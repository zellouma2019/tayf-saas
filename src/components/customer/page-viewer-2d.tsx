"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Loader2, AlertCircle, Grid3X3, Columns2 } from "lucide-react";

interface PageViewer2DProps {
  file?: File | null;
  storedFileName?: string | null;
  pdfDataUrl?: string | null;
  totalPages: number;
  initialPage?: number;
  isOpen: boolean;
  onClose: () => void;
  dir?: "rtl" | "ltr";
}

const RENDER_SCALE = 2.0;
const THUMBNAIL_SCALE = 0.3;

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
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<unknown>(null);
  const isRenderingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const abortRef = useRef(false);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const renderPageToDataUrl = useCallback(async (pageNum: number, scale: number, pdfDoc: unknown): Promise<string | null> => {
    try {
      const page = await (pdfDoc as { getPage: (n: number) => Promise<unknown> }).getPage(pageNum) as {
        getViewport: (o: { scale: number }) => { width: number; height: number };
        render: (o: Record<string, unknown>) => { promise: Promise<void> };
      };
      const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      const effectiveScale = scale * dpr;
      const viewport = page.getViewport({ scale: effectiveScale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      return canvas.toDataURL("image/jpeg", 0.6);
    } catch {
      return null;
    }
  }, []);

  // Load pdfjs and render page
  const renderPage = useCallback(async (pageNum: number) => {
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

      if (!pdfDocRef.current) {
        let source: { data: ArrayBuffer } | { url: string };
        if (file) {
          const arrayBuffer = await file.arrayBuffer();
          source = { data: arrayBuffer };
        } else if (pdfDataUrl) {
          const base64 = pdfDataUrl.split(",")[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          source = { data: bytes.buffer as ArrayBuffer };
        } else if (storedFileName) {
          const fetchUrl = `/api/c/uploads/${encodeURIComponent(storedFileName)}`;
          const resp = await fetch(fetchUrl);
          if (!resp.ok) throw new Error("الملف غير متوفر — يرجى إعادة رفع الملف لعرض الصفحات");
          const arrayBuffer = await resp.arrayBuffer();
          source = { data: arrayBuffer };
        } else {
          throw new Error("لا يوجد ملف للعرض");
        }

        const loadingTask = pdfjsLib.getDocument({ ...source, disableAutoFetch: true });
        pdfDocRef.current = (await loadingTask.promise) as {
          numPages: number;
          getPage: (n: number) => Promise<unknown>;
          destroy: () => void;
        };
      }

      const doc = pdfDocRef.current;
      if (abortRef.current) return;

      const dataUrl = await renderPageToDataUrl(pageNum, RENDER_SCALE, doc);
      if (abortRef.current || !dataUrl) {
        setIsLoading(false);
        return;
      }
      setPageDataUrl(dataUrl);
    } catch (err) {
      if (!abortRef.current) {
        console.error("[PageViewer2D] Render error:", err);
        setPageError(`فشل في عرض الصفحة ${pageNum} — يرجى المحاولة مرة أخرى`);
      }
    } finally {
      setIsLoading(false);
      isRenderingRef.current = false;
    }
  }, [file, storedFileName, pdfDataUrl, renderPageToDataUrl]);

  // Generate thumbnails when sidebar opens
  useEffect(() => {
    if (!showThumbnails || !pdfDocRef.current || abortRef.current) return;
    let cancelled = false;
    async function generateThumbnails() {
      const doc = pdfDocRef.current!;
      const newThumbs = new Map<number, string>(thumbnails);
      for (let i = 1; i <= totalPages; i++) {
        if (newThumbs.has(i)) continue;
        if (cancelled) return;
        const dataUrl = await renderPageToDataUrl(i, THUMBNAIL_SCALE, doc);
        if (cancelled) return;
        if (dataUrl) {
          newThumbs.set(i, dataUrl);
          setThumbnails(new Map(newThumbs));
        }
      }
    }
    generateThumbnails();
    return () => { cancelled = true; };
  }, [showThumbnails, totalPages, renderPageToDataUrl, thumbnails]);

  // Auto-scroll thumbnail into view
  useEffect(() => {
    if (!showThumbnails || !thumbnailContainerRef.current) return;
    const activeThumb = thumbnailContainerRef.current.querySelector(`[data-thumb-page="${currentPage}"]`);
    activeThumb?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentPage, showThumbnails]);

  useEffect(() => {
    if (!isOpen) return;
    if (!file && !storedFileName && !pdfDataUrl) return;
    abortRef.current = false;
    renderPage(currentPage);
    return () => { abortRef.current = true; };
  }, [isOpen, file, storedFileName, pdfDataUrl, currentPage, renderPage]);

  useEffect(() => {
    return () => {
      try { (pdfDocRef.current as { destroy?: () => void } | null)?.destroy?.(); } catch {}
      pdfDocRef.current = null;
    };
  }, []);

  useEffect(() => {
    pdfDocRef.current = null;
    setCurrentPage(initialPage);
    setPageDataUrl(null);
    setZoomLevel(100);
    setThumbnails(new Map());
  }, [file, storedFileName, pdfDataUrl, initialPage]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const isNext = dir === "rtl" ? e.key === "ArrowLeft" : e.key === "ArrowRight";
        setCurrentPage((p) => isNext ? Math.min(p + 1, totalPages) : Math.max(p - 1, 1));
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, totalPages, dir, onClose]);

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

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const zoomIn = useCallback(() => setZoomLevel((z) => Math.min(z + 25, 300)), []);
  const zoomOut = useCallback(() => setZoomLevel((z) => Math.max(z - 25, 50)), []);
  const resetZoom = useCallback(() => setZoomLevel(100), []);
  const goNext = useCallback(() => setCurrentPage((p) => Math.min(p + 1, totalPages)), [totalPages]);
  const goPrev = useCallback(() => setCurrentPage((p) => Math.max(p - 1, 1)), []);
  const retryRender = useCallback(() => renderPage(currentPage), [currentPage, renderPage]);

  const touchStartX = useRef(0);
  const onTouchStart = useCallback((e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; }, []);
  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    const threshold = 50;
    if (dir === "rtl") {
      if (diff < -threshold) goNext(); else if (diff > threshold) goPrev();
    } else {
      if (diff > threshold) goNext(); else if (diff < -threshold) goPrev();
    }
  }, [dir, goNext, goPrev]);

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
          <div className="flex items-center justify-between px-4 py-2.5 bg-black/70 backdrop-blur-md border-b border-white/10">
            <div className="flex items-center gap-3">
              <h3 className="text-white text-sm font-medium">تصفح الصفحات</h3>
              <span className="text-white/40 text-xs font-mono">{currentPage} / {totalPages}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={zoomOut} disabled={zoomLevel <= 50} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25" title="تصغير"><ZoomOut className="h-4 w-4" /></button>
              <button onClick={resetZoom} className="px-2.5 py-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs font-medium min-w-[48px] text-center" title="إعادة تعيين">{zoomLevel}%</button>
              <button onClick={zoomIn} disabled={zoomLevel >= 300} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25" title="تكبير"><ZoomIn className="h-4 w-4" /></button>
              <div className="w-px h-4 bg-white/10 mx-0.5" />
              <button onClick={() => setShowThumbnails(!showThumbnails)} className={`p-2 rounded-lg transition-all ${showThumbnails ? 'text-amber-400 bg-amber-400/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`} title="شريط الصفحات المصغرة"><Grid3X3 className="h-4 w-4" /></button>
              <button onClick={toggleFullscreen} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" title="ملء الشاشة"><Maximize2 className="h-4 w-4" /></button>
              <button onClick={onClose} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all" title="إغلاق"><X className="h-4 w-4" /></button>
            </div>
          </div>

          {/* ═══ Main Content + Optional Thumbnail Sidebar ═══ */}
          <div className="flex-1 flex overflow-hidden">
            {/* Thumbnail Sidebar */}
            <AnimatePresence>
              {showThumbnails && totalPages > 1 && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 120, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-l border-white/10 bg-black/40 overflow-y-auto shrink-0"
                  ref={thumbnailContainerRef}
                >
                  <div className="p-2 space-y-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const thumb = thumbnails.get(pageNum);
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          data-thumb-page={pageNum}
                          onClick={() => !isLoading && setCurrentPage(pageNum)}
                          disabled={isLoading}
                          className={`w-full rounded-lg overflow-hidden transition-all duration-200 border-2 ${
                            isActive
                              ? 'border-amber-400 shadow-lg shadow-amber-400/20 scale-[1.02]'
                              : 'border-transparent hover:border-white/20 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {thumb ? (
                            <img src={thumb} alt={`ص${pageNum}`} className="w-full h-auto block" draggable={false} />
                          ) : (
                            <div className="aspect-[3/4] bg-white/5 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 text-white/20 animate-spin" />
                            </div>
                          )}
                          <div className={`text-center py-0.5 text-[10px] font-medium ${isActive ? 'text-amber-400' : 'text-white/40'}`}>{pageNum}</div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Page Content Area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage}
                  initial={{ opacity: 0, x: dir === "rtl" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir === "rtl" ? 20 : -20 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="relative"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
                >
                  {isLoading && !pageDataUrl && (
                    <div className="flex flex-col items-center justify-center gap-3 min-h-[300px]">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-amber-400 animate-spin" />
                      </div>
                      <p className="text-white/50 text-sm">جارٍ تحميل الصفحة {currentPage}...</p>
                    </div>
                  )}

                  {pageError && (
                    <div className="flex flex-col items-center justify-center gap-4 min-h-[300px] bg-white/5 rounded-2xl p-8">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center"><AlertCircle className="h-7 w-7 text-amber-400" /></div>
                      <p className="text-amber-300 text-sm text-center max-w-[300px]">{pageError}</p>
                      <button onClick={retryRender} className="px-5 py-2.5 rounded-xl bg-amber-500/20 text-amber-300 text-sm font-medium hover:bg-amber-500/30 transition-all border border-amber-500/30 hover:scale-105 active:scale-95">إعادة محاولة</button>
                    </div>
                  )}

                  {pageDataUrl && !isLoading && (
                    <div className="relative rounded-lg overflow-hidden shadow-2xl shadow-black/50">
                      <img src={pageDataUrl} alt={`صفحة ${currentPage}`} className="block max-h-[70vh] w-auto" style={{ imageRendering: "-webkit-optimize-contrast" }} draggable={false} />
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white/90 text-xs font-medium">
                        صفحة {currentPage} من {totalPages}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ═══ Bottom Navigation Bar ═══ */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-black/70 backdrop-blur-md border-t border-white/10">
            <button onClick={goPrev} disabled={currentPage <= 1 || isLoading} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentPage <= 1 || isLoading ? 'text-white/15 cursor-not-allowed' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              <ChevronRight className="h-4 w-4" /><span>السابق</span>
            </button>

            <div className="flex items-center gap-1.5 overflow-hidden">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) pageNum = i + 1;
                else if (currentPage <= 4) pageNum = i + 1;
                else if (currentPage >= totalPages - 3) pageNum = totalPages - 6 + i;
                else pageNum = currentPage - 3 + i;
                const isActive = pageNum === currentPage;
                return (
                  <button key={pageNum} onClick={() => { if (!isLoading) setCurrentPage(pageNum); }} disabled={isLoading} className={`rounded-full transition-all duration-200 ${isActive ? 'w-6 h-2 bg-amber-400' : 'w-2 h-2 bg-white/15 hover:bg-white/30'}`} title={`صفحة ${pageNum}`} />
                );
              })}
            </div>

            <button onClick={goNext} disabled={currentPage >= totalPages || isLoading} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${currentPage >= totalPages || isLoading ? 'text-white/15 cursor-not-allowed' : 'text-white/70 hover:text-white hover:bg-white/10'}`}>
              <span>التالي</span><ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
