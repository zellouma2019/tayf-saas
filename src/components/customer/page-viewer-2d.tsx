"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * PageViewer2D — High-Fidelity 2D Page Viewer
 *
 * Supports two source modes:
 * 1. File object (client-side PDF rendering)
 * 2. Stored file name (server-side fetch via /api/c/uploads/)
 *
 * Features:
 * - Crisp text rendering via high-DPI canvas
 * - Smooth page transitions with Framer Motion
 * - Pinch-to-zoom and scroll-to-zoom support
 * - Fullscreen mode
 * - Page counter with keyboard navigation
 */

interface PageViewer2DProps {
  /** PDF File object for client-side rendering */
  file?: File | null;
  /** Stored file name for server-side loading (fallback) */
  storedFileName?: string | null;
  /** PDF data URL for client-side rendering (avoids server fetch) */
  pdfDataUrl?: string | null;
  /** Total number of pages */
  totalPages: number;
  /** Initial page to display */
  initialPage?: number;
  /** Whether the viewer is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** RTL direction */
  dir?: "rtl" | "ltr";
}

/** Scale factor for rendering PDF pages to canvas */
const RENDER_SCALE = 2.0;

export function PageViewer2D({
  file,
  storedFileName,
  pdfDataUrl,
  totalPages,
  initialPage = 1,
  isOpen,
  onClose,
  dir = "rtl",
}: PageViewer2DProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pageDataUrl, setPageDataUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<unknown>(null);
  const isRenderingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef(false);

  // Load pdfjs and render page
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (isRenderingRef.current || abortRef.current) return;
      isRenderingRef.current = true;
      setIsLoading(true);
      setPageError(null);

      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        // Load document if not already loaded
        if (!pdfDocRef.current) {
          let source: { data: ArrayBuffer } | { url: string };

          if (file) {
            // Client-side: use File object directly
            const arrayBuffer = await file.arrayBuffer();
            source = { data: arrayBuffer };
          } else if (pdfDataUrl) {
            // Data URL: decode base64 directly (avoids server fetch on Vercel)
            const base64 = pdfDataUrl.split(",")[1];
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            source = { data: bytes.buffer as ArrayBuffer };
          } else if (storedFileName) {
            // Server-side: fetch the file first for clear error handling
            const fetchUrl = `/api/c/uploads/${encodeURIComponent(storedFileName)}`;
            const resp = await fetch(fetchUrl);
            if (!resp.ok) {
              throw new Error("الملف غير متوفر — يرجى إعادة رفع الملف لعرض الصفحات");
            }
            const arrayBuffer = await resp.arrayBuffer();
            source = { data: arrayBuffer };
          } else {
            throw new Error("لا يوجد ملف للعرض");
          }

          const loadingTask = pdfjsLib.getDocument({
            ...source,
            disableAutoFetch: true,
          });
          pdfDocRef.current = (await loadingTask.promise) as {
            numPages: number;
            getPage: (n: number) => Promise<unknown>;
            destroy: () => void;
          };
        }

        const doc = pdfDocRef.current;
        if (abortRef.current) return;

        const page = (await doc.getPage(pageNum)) as {
          getViewport: (o: { scale: number }) => { width: number; height: number };
          render: (o: Record<string, unknown>) => { promise: Promise<void> };
        };

        const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 3) : 1;
        const effectiveScale = RENDER_SCALE * dpr;
        const viewport = page.getViewport({ scale: effectiveScale });

        // Create offscreen canvas for rendering
        const canvas = document.createElement("canvas");
        const width = Math.round(viewport.width);
        const height = Math.round(viewport.height);
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;

        if (abortRef.current) return;

        // ═══ White background before rendering ═══
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // Render PDF page
        await page.render({
          canvasContext: ctx,
          viewport,
          canvas,
        }).promise;

        if (abortRef.current) return;

        // Convert to data URL for display
        const dataUrl = canvas.toDataURL("image/png");
        setPageDataUrl(dataUrl);
        setImageDimensions({ w: width, h: height });
      } catch (err) {
        if (!abortRef.current) {
          console.error("[PageViewer2D] Render error:", err);
          setPageError(
            `فشل في عرض الصفحة ${pageNum} — يرجى المحاولة مرة أخرى`
          );
        }
      } finally {
        setIsLoading(false);
        isRenderingRef.current = false;
      }
    },
    [file, storedFileName, pdfDataUrl]
  );

  // Render when page changes
  useEffect(() => {
    if (!isOpen) return;
    if (!file && !storedFileName) return;
    abortRef.current = false;
    renderPage(currentPage);
    return () => {
      abortRef.current = true;
    };
  }, [isOpen, file, storedFileName, currentPage, renderPage]);

  // Cleanup PDF document on unmount or close
  useEffect(() => {
    return () => {
      try {
        (pdfDocRef.current as { destroy?: () => void } | null)?.destroy?.();
      } catch {
        /* ignore */
      }
      pdfDocRef.current = null;
    };
  }, []);

  // Reset PDF doc when source changes
  useEffect(() => {
    pdfDocRef.current = null;
    setCurrentPage(initialPage);
    setPageDataUrl(null);
    setZoomLevel(100);
  }, [file, storedFileName, pdfDataUrl, initialPage]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        // In RTL, ArrowRight goes to prev page
        const isNext = dir === "rtl" ? e.key === "ArrowLeft" : e.key === "ArrowRight";
        if (isNext) {
          setCurrentPage((p) => Math.min(p + 1, totalPages));
        } else {
          setCurrentPage((p) => Math.max(p - 1, 1));
        }
      }
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, totalPages, dir, onClose]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => setZoomLevel((z) => Math.min(z + 25, 300)), []);
  const zoomOut = useCallback(() => setZoomLevel((z) => Math.max(z - 25, 50)), []);
  const resetZoom = useCallback(() => setZoomLevel(100), []);

  const goNext = useCallback(() => setCurrentPage((p) => Math.min(p + 1, totalPages)), [totalPages]);
  const goPrev = useCallback(() => setCurrentPage((p) => Math.max(p - 1, 1)), []);
  const retryRender = useCallback(() => renderPage(currentPage), [currentPage, renderPage]);

  // Touch/swipe handling for page navigation
  const touchStartX = useRef(0);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      // In RTL: swipe left = next page, swipe right = prev page
      const threshold = 50;
      if (dir === "rtl") {
        if (diff < -threshold) goNext();
        else if (diff > threshold) goPrev();
      } else {
        if (diff > threshold) goNext();
        else if (diff < -threshold) goPrev();
      }
    },
    [dir, goNext, goPrev]
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* ═══ Top Bar ═══ */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-md border-b border-white/10">
            <div className="flex items-center gap-3">
              <h3 className="text-white text-sm font-medium">
                تصفح الصفحات
              </h3>
              <span className="text-white/50 text-xs">
                {currentPage} / {totalPages}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={zoomOut}
                disabled={zoomLevel <= 50}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                title="تصغير"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={resetZoom}
                className="px-2.5 py-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all text-xs font-medium min-w-[48px] text-center"
                title="إعادة تعيين"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={zoomIn}
                disabled={zoomLevel >= 300}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30"
                title="تكبير"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                title="ملء الشاشة"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all"
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ═══ Page Content Area ═══ */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: dir === "rtl" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir === "rtl" ? 20 : -20 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="relative"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: "center center",
                }}
              >
                {isLoading && !pageDataUrl && (
                  <div className="flex flex-col items-center justify-center gap-3 min-h-[300px]">
                    <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                    <p className="text-white/60 text-sm">
                      جارٍ تحميل الصفحة {currentPage}...
                    </p>
                  </div>
                )}

                {pageError && (
                  <div className="flex flex-col items-center justify-center gap-4 min-h-[300px] bg-white/5 rounded-2xl p-8">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <AlertCircle className="h-7 w-7 text-amber-400" />
                    </div>
                    <p className="text-amber-300 text-sm text-center max-w-[300px]">{pageError}</p>
                    <button
                      onClick={retryRender}
                      className="px-5 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition-all border border-amber-500/30 hover:scale-105 active:scale-95"
                    >
                      إعادة محاولة
                    </button>
                  </div>
                )}

                {pageDataUrl && !isLoading && (
                  <div className="relative rounded-lg overflow-hidden shadow-2xl shadow-black/50">
                    <img
                      src={pageDataUrl}
                      alt={`صفحة ${currentPage}`}
                      className="block max-h-[70vh] w-auto"
                      style={{
                        imageRendering: "-webkit-optimize-contrast",
                      }}
                      draggable={false}
                    />
                    {/* Page number badge */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white/90 text-xs font-medium">
                      صفحة {currentPage} من {totalPages}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ═══ Bottom Navigation Bar ═══ */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-md border-t border-white/10">
            <button
              onClick={goPrev}
              disabled={currentPage <= 1 || isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentPage <= 1 || isLoading
                  ? "text-white/20 cursor-not-allowed"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
              <span>السابق</span>
            </button>

            {/* Page indicator dots (mobile-friendly) */}
            <div className="flex items-center gap-1.5 overflow-hidden">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      if (!isLoading) setCurrentPage(pageNum);
                    }}
                    disabled={isLoading}
                    className={`rounded-full transition-all duration-200 ${
                      isActive
                        ? "w-6 h-2 bg-amber-400"
                        : "w-2 h-2 bg-white/20 hover:bg-white/40"
                    }`}
                    title={`صفحة ${pageNum}`}
                  />
                );
              })}
            </div>

            <button
              onClick={goNext}
              disabled={currentPage >= totalPages || isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                currentPage >= totalPages || isLoading
                  ? "text-white/20 cursor-not-allowed"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>التالي</span>
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Hidden canvas for rendering */}
          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
