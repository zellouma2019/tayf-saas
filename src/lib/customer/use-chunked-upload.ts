"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export type UploadPhase = "idle" | "preparing" | "uploading" | "assembling" | "done" | "error";

export interface UploadState {
  phase: UploadPhase;
  progress: number;        // 0-100
  speed: number;           // bytes/sec
  eta: number;             // seconds remaining
  uploadedBytes: number;
  totalBytes: number;
  fileId: string | null;
  errorMessage: string | null;
  canPause: boolean;
  canResume: boolean;
}

interface ChunkTask {
  index: number;
  status: "pending" | "uploading" | "done" | "error";
  retries: number;
}

// ═══════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════

const SMALL_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB
const CHUNK_SIZE = 2 * 1024 * 1024;           // 2MB per chunk
const MAX_RETRIES = 3;
const CONCURRENCY = 3;                         // parallel chunks
const SPEED_SAMPLES = 5;                       // rolling window for speed calc

export function useChunkedUpload() {
  const [state, setState] = useState<UploadState>({
    phase: "idle",
    progress: 0,
    speed: 0,
    eta: 0,
    uploadedBytes: 0,
    totalBytes: 0,
    fileId: null,
    errorMessage: null,
    canPause: false,
    canResume: false,
  });

  const fileRef = useRef<File | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pauseRef = useRef(false);
  const cancelRef = useRef(false);
  const speedHistory = useRef<{ time: number; bytes: number }[]>([]);
  const pausePromiseRef = useRef<(() => void) | null>(null);

  // ─── Utility: format ───
  const formatSpeed = useCallback((bytesPerSec: number): string => {
    if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(0)} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  }, []);

  const formatETA = useCallback((secs: number): string => {
    if (!isFinite(secs) || secs < 0) return "--";
    if (secs < 5) return "أقل من 5 ثوانٍ";
    if (secs < 60) return `~${Math.ceil(secs)} ثانية`;
    if (secs < 3600) return `~${Math.ceil(secs / 60)} دقيقة`;
    return `~${Math.ceil(secs / 3600)} ساعة`;
  }, []);

  const formatSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  // ─── Speed calculator ───
  const updateSpeed = useCallback((nowUploaded: number, total: number) => {
    const now = Date.now();
    const history = speedHistory.current;
    history.push({ time: now, bytes: nowUploaded });
    if (history.length > SPEED_SAMPLES) history.shift();

    let speed = 0;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const elapsed = (last.time - first.time) / 1000;
      if (elapsed > 0) {
        speed = (last.bytes - first.bytes) / elapsed;
      }
    }

    const remaining = total - nowUploaded;
    const eta = speed > 0 ? remaining / speed : 0;
    const progress = total > 0 ? Math.min(Math.round((nowUploaded / total) * 100), 99) : 0;

    return { speed, eta, progress };
  }, []);

  // ─── Pause / Resume ───
  const pause = useCallback(() => {
    pauseRef.current = true;
    setState((s) => ({ ...s, canPause: false, canResume: true }));
  }, []);

  const resume = useCallback(() => {
    pauseRef.current = false;
    if (pausePromiseRef.current) {
      pausePromiseRef.current();
      pausePromiseRef.current = null;
    }
    setState((s) => ({ ...s, canPause: true, canResume: false }));
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    pauseRef.current = false;
    if (pausePromiseRef.current) {
      pausePromiseRef.current();
      pausePromiseRef.current = null;
    }
    if (abortRef.current) abortRef.current.abort();
    setState({
      phase: "idle",
      progress: 0,
      speed: 0,
      eta: 0,
      uploadedBytes: 0,
      totalBytes: 0,
      fileId: null,
      errorMessage: null,
      canPause: false,
      canResume: false,
    });
    fileRef.current = null;
  }, []);

  // ─── Upload single chunk with retry ───
  const uploadOneChunk = useCallback(async (
    fileId: string,
    chunk: Blob,
    index: number,
    totalChunks: number,
    signal: AbortSignal,
  ): Promise<boolean> => {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (signal.aborted) return false;
      // Wait if paused
      while (pauseRef.current && !signal.aborted) {
        await new Promise<void>((r) => { pausePromiseRef.current = r; });
      }
      if (signal.aborted || cancelRef.current) return false;

      try {
        const fd = new FormData();
        fd.append("fileId", fileId);
        fd.append("chunkIndex", index.toString());
        fd.append("totalChunks", totalChunks.toString());
        fd.append("chunk", chunk, `chunk_${index}`);

        const res = await fetch("/api/c/upload-chunk", {
          method: "POST",
          body: fd,
          signal,
        });

        if (res.ok) return true;
        if (res.status === 404) return false; // session expired
        // Retry on 5xx
        if (res.status >= 500 && attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return false;
      } catch (e) {
        if ((e as Error).name === "AbortError") return false;
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        return false;
      }
    }
    return false;
  }, []);

  // ─── Simple (small file) upload fallback ───
  const uploadSimple = useCallback(async (
    file: File,
    onProgress: (pct: number) => void,
    signal: AbortSignal,
  ): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/c/upload");
      xhr.timeout = 120_000;

      const start = Date.now();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(Math.min(pct, 99));
          // Update speed
          const elapsed = (Date.now() - start) / 1000;
          if (elapsed > 0) {
            const spd = e.loaded / elapsed;
            const remaining = e.total - e.loaded;
            const et = spd > 0 ? remaining / spd : 0;
            setState((s) => ({ ...s, speed: spd, eta: et, uploadedBytes: e.loaded }));
          }
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            onProgress(100);
            resolve(data.storedFileName);
          } catch {
            reject(new Error("فشل في قراءة استجابة الخادم"));
          }
        } else {
          reject(new Error(`فشل في رفع الملف (${xhr.status})`));
        }
      });
      xhr.addEventListener("error", () => reject(new Error("SERVER_UNREACHABLE")));
      xhr.addEventListener("timeout", () => reject(new Error("SERVER_TIMEOUT")));
      xhr.addEventListener("abort", () => reject(new Error("تم إلغاء الرفع")));

      signal.addEventListener("abort", () => xhr.abort());
      xhr.send(fd);
    });
  }, []);

  // ─── Main upload function ───
  const upload = useCallback(async (file: File): Promise<string | null> => {
    fileRef.current = file;
    cancelRef.current = false;
    pauseRef.current = false;
    speedHistory.current = [];
    abortRef.current = new AbortController();

    setState({
      phase: "preparing",
      progress: 0,
      speed: 0,
      eta: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
      fileId: null,
      errorMessage: null,
      canPause: false,
      canResume: false,
    });

    try {
      // ── Small file: direct upload ──
      if (file.size < SMALL_FILE_THRESHOLD) {
        setState((s) => ({ ...s, phase: "uploading", canPause: true }));
        const result = await uploadSimple(
          file,
          (pct) => {
            setState((s) => ({ ...s, progress: pct }));
          },
          abortRef.current.signal,
        );
        setState((s) => ({ ...s, phase: "done", progress: 100, speed: 0, eta: 0, uploadedBytes: file.size, canPause: false }));
        return result;
      }

      // ── Large file: chunked upload ──
      setState((s) => ({ ...s, phase: "preparing" }));

      // Step 1: Init session
      const initRes = await fetch("/api/c/upload-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          chunkSize: CHUNK_SIZE,
        }),
        signal: abortRef.current.signal,
      });

      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "فشل في تهيئة الرفع");
      }

      const init = await initRes.json();
      const { fileId, totalChunks } = init;

      setState((s) => ({
        ...s,
        phase: "uploading",
        fileId,
        canPause: true,
      }));

      // Step 2: Check for existing chunks (resume support)
      let completedSet = new Set<number>();
      try {
        const statusRes = await fetch(`/api/c/upload-status?fileId=${encodeURIComponent(fileId)}`);
        if (statusRes.ok) {
          const status = await statusRes.json();
          completedSet = new Set(status.completedChunks || []);
        }
      } catch {
        // Fresh start
      }

      // Step 3: Upload chunks with concurrency
      const chunks: ChunkTask[] = [];
      for (let i = 0; i < totalChunks; i++) {
        chunks.push({
          index: i,
          status: completedSet.has(i) ? "done" : "pending",
          retries: 0,
        });
      }

      let activeCount = 0;
      let nextIndex = 0;
      let doneCount = completedSet.size;
      let failedCount = 0;

      const uploadNext = async (): Promise<void> => {
        // Find next pending chunk
        while (nextIndex < chunks.length && chunks[nextIndex].status !== "pending") {
          nextIndex++;
        }
        if (nextIndex >= chunks.length) return;

        const task = chunks[nextIndex];
        const idx = nextIndex;
        nextIndex++;

        task.status = "uploading";
        activeCount++;

        const start = (task.index) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunkBlob = file.slice(start, end);

        const success = await uploadOneChunk(
          fileId,
          chunkBlob,
          task.index,
          totalChunks,
          abortRef.current.signal,
        );

        activeCount--;

        if (success) {
          task.status = "done";
          doneCount++;
          const uploaded = Math.min(doneCount * CHUNK_SIZE, file.size);
          const { speed, eta, progress } = updateSpeed(uploaded, file.size);
          setState((s) => ({ ...s, progress, speed, eta, uploadedBytes: uploaded }));
        } else if (cancelRef.current) {
          return;
        } else {
          task.status = "error";
          task.retries++;
          failedCount++;
          if (task.retries < MAX_RETRIES) {
            task.status = "pending";
            // Re-queue: find position to insert
            nextIndex = Math.min(nextIndex, task.index);
            failedCount--;
          }
        }
      };

      // Concurrency loop
      const workers: Promise<void>[] = [];
      for (let w = 0; w < CONCURRENCY; w++) {
        workers.push((async () => {
          while (!cancelRef.current) {
            let hasWork = false;
            for (let i = 0; i < chunks.length; i++) {
              if (chunks[i].status === "pending") { hasWork = true; break; }
            }
            if (!hasWork) break;
            await uploadNext();
          }
        })());
      }
      await Promise.all(workers);

      if (cancelRef.current) return null;

      // Step 4: Assemble
      setState((s) => ({ ...s, phase: "assembling", progress: 99 }));
      const completeRes = await fetch("/api/c/upload-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || "فشل في تجميع الملف");
      }

      const result = await completeRes.json();
      setState((s) => ({
        ...s,
        phase: "done",
        progress: 100,
        speed: 0,
        eta: 0,
        uploadedBytes: file.size,
        canPause: false,
      }));

      return result.storedFileName;
    } catch (e) {
      if (cancelRef.current) return null;
      const msg = (e as Error).message || "حدث خطأ أثناء الرفع";
      setState((s) => ({ ...s, phase: "error", errorMessage: msg, canPause: false }));
      return null;
    }
  }, [uploadSimple, uploadOneChunk, updateSpeed]);

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  return {
    ...state,
    upload,
    pause,
    resume,
    cancel,
    formatSpeed,
    formatETA,
    formatSize,
    file: fileRef.current,
  };
}
