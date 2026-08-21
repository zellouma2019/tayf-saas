"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════════
//  Professional PDF Viewer — عارض PDF احترافي عالي الدقة
//  • تحكم تكيفي بدقة الشاشة (Device Pixel Ratio)
//  • Virtual scrolling: يعرض فقط الصفحات المرئية
//  • Pinch-to-zoom + Pan على الموبايل
//  • Responsive: يستخدم عرض الحاوية الفعلي بدل قيمة ثابتة
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfessionalPdfViewerProps {
  /** اسم الملف المخزن في uploads/ أو dataURL */
  fileSource: string;
  /** الصفحة الحالية (للوضع أحادي الصفحة) */
  currentPage?: number;
  /** عند تغيير الصفحة من الخارج */
  onPageChange?: (page: number) => void;
  /** وضع العرض: صفحة واحدة أو تمرير متعدد */
  viewMode?: "single" | "scroll";
  /** مقياس أولي */
  initialScale?: number;
  /** CSS filter (مثل grayscale) */
  cssFilter?: string;
  /** عرض أقصى للمحتوى (fallback if ResizeObserver unavailable) */
  maxWidth?: number;
  /** إجمالي الصفحات */
  onTotalPages?: (n: number) => void;
  /** className */
  className?: string;
  /** رد الاتصال عند التحميل */
  onLoaded?: () => void;
  /** حالة التحميل */
  onLoadingChange?: (loading: boolean) => void;
}

interface RenderedPage {
  pageNum: number;
  width: number;
  height: number;
  dataUrl: string;
}

export function ProfessionalPdfViewer({
  fileSource,
  currentPage = 1,
  onPageChange,
  viewMode = "single",
  initialScale = 1,
  cssFilter,
  maxWidth = 600,
  onTotalPages,
  className = "",
  onLoaded,
  onLoadingChange,
}: ProfessionalPdfViewerProps) {
  // ───Refs───
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<unknown>(null);
  const renderTaskRef = useRef<unknown>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist: number; scale: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  // ───State───
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(initialScale);
  const [internalPage, setInternalPage] = useState(currentPage);
  const [totalPagesCount, setTotalPagesCount] = useState(0);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [renderedPages, setRenderedPages] = useState<Map<number, string>>(new Map());
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  const [containerWidth, setContainerWidth] = useState<number>(maxWidth);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Use internal page for single mode, or track scroll position for scroll mode
  const activePage = viewMode === "single" ? currentPage : internalPage;

  // ───Responsive container width via ResizeObserver───
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setContainerWidth(Math.floor(w));
      }
    });
    observer.observe(container);
    // Initial measurement
    const w = container.getBoundingClientRect().width;
    if (w > 0) setContainerWidth(Math.floor(w));
    return () => observer.disconnect();
  }, []);

  // ───Device Pixel Ratio───
  const dpr = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return Math.min(window.devicePixelRatio || 1, 3);
  }, []);

  // ───Effective max width (use actual container width)───
  const effectiveMaxWidth = Math.min(containerWidth, maxWidth);

  // ───Adaptive scale: fit PDF page within container───
  // pageDimensions is in PDF points (72 DPI base).
  // effectiveMaxWidth is in CSS pixels (96 DPI base).
  // We need: pdfPoints * scale * (96/72) <= containerWidth
  // So: scale <= containerWidth / (pdfPoints * 4/3)
  const adaptiveScale = useMemo(() => {
    if (!pageDimensions.width || !effectiveMaxWidth) return scale;
    const cssWidthAtScale1 = pageDimensions.width * (96 / 72);
    const fitScale = (effectiveMaxWidth - 16) / cssWidthAtScale1;
    if (scale <= 1) {
      return Math.max(fitScale, 0.3);
    }
    return Math.min(scale, fitScale);
  }, [scale, pageDimensions.width, effectiveMaxWidth]);

  // ───Load PDF document───
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      onLoadingChange?.(true);

      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();

        // Determine source type
        let source: { url: string } | { data: ArrayBuffer };
        if (fileSource.startsWith("data:")) {
          const base64 = fileSource.split(",")[1];
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          source = { data: bytes.buffer as ArrayBuffer };
        } else {
          const fetchUrl = `/api/c/uploads/${encodeURIComponent(fileSource)}`;
          const resp = await fetch(fetchUrl);
          if (!resp.ok) {
            throw new Error("الملف غير متوفر على الخادم — يرجى إعادة رفع الملف لمعاينة الصفحات");
          }
          const arrayBuffer = await resp.arrayBuffer();
          source = { data: arrayBuffer };
        }

        const pdf = await pdfjsLib.getDocument(source).promise;
        if (cancelled) { pdf.destroy(); return; }

        pdfDocRef.current = pdf;
        const numPages = (pdf as unknown as { numPages: number }).numPages;
        setTotalPagesCount(numPages);
        onTotalPages?.(numPages);

        // Get first page dimensions for layout
        const firstPage = await pdf.getPage(1);
        const vp = firstPage.getViewport({ scale: 1 });
        setPageDimensions({ width: vp.width, height: vp.height });

        setLoading(false);
        onLoadingChange?.(false);
        onLoaded?.();
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setLoading(false);
          onLoadingChange?.(false);
        }
      }
    }

    loadPdf();
    return () => { cancelled = true; pdfDocRef.current = null; };
  }, [fileSource]);

  // ───Render a single page to a data URL───
  const renderPageToCanvas = useCallback(async (pageNum: number, targetScale: number): Promise<string | null> => {
    const pdf = pdfDocRef.current as {
      getPage: (n: number) => Promise<unknown>;
    } | null;
    if (!pdf) return null;

    try {
      const pdfPage = await pdf.getPage(pageNum) as {
        getViewport: (opts: { scale: number }) => { width: number; height: number };
        render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => Promise<unknown>;
      };

      const renderScale = targetScale * dpr;
      const viewport = pdfPage.getViewport({ scale: renderScale });

      const offscreen = document.createElement("canvas");
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return null;

      // White background for clean rendering
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const renderTask = pdfPage.render({ canvasContext: ctx, viewport });
      await renderTask.promise;

      return offscreen.toDataURL("image/png", 1.0);
    } catch (e) {
      const err = e as Error & { name?: string };
      if (err.name !== "RenderingCancelledException" && err.name !== "RenderingCancelled") {
        console.error(`Failed to render page ${pageNum}:`, err);
      }
      return null;
    }
  }, [dpr]);

  // ───Single page mode: render current page───
  useEffect(() => {
    if (viewMode !== "single" || !pdfDocRef.current || !canvasRef.current) return;

    let cancelled = false;

    async function renderCurrentPage() {
      setLoading(true);
      onLoadingChange?.(true);

      if (renderTaskRef.current) {
        try {
          (renderTaskRef.current as { cancel: () => void }).cancel();
        } catch {}
      }

      const dataUrl = await renderPageToCanvas(currentPage, adaptiveScale);

      if (cancelled || !dataUrl) {
        setLoading(false);
        onLoadingChange?.(false);
        return;
      }

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.style.width = `${img.width / dpr}px`;
        canvas.style.height = `${img.height / dpr}px`;
        ctx.drawImage(img, 0, 0);
        setLoading(false);
        onLoadingChange?.(false);
      };
      img.src = dataUrl;
    }

    renderCurrentPage();
    return () => { cancelled = true; };
  }, [viewMode, currentPage, adaptiveScale, renderPageToCanvas, dpr, onLoadingChange]);

  // ───Scroll mode: render visible pages───
  useEffect(() => {
    if (viewMode !== "scroll" || !pdfDocRef.current) return;

    let cancelled = false;

    async function renderVisible() {
      const newRendered = new Map<number, string>(renderedPages);

      for (const pageNum of visiblePages) {
        if (!newRendered.has(pageNum)) {
          const dataUrl = await renderPageToCanvas(pageNum, adaptiveScale);
          if (cancelled) return;
          if (dataUrl) {
            newRendered.set(pageNum, dataUrl);
          }
        }
      }

      if (!cancelled) {
        setRenderedPages(newRendered);
      }
    }

    renderVisible();
    return () => { cancelled = true; };
  }, [viewMode, visiblePages, adaptiveScale, renderPageToCanvas, renderedPages]);

  // ───Intersection observer for scroll mode───
  useEffect(() => {
    if (viewMode !== "scroll" || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = new Set<number>();
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageNum = Number((entry.target as HTMLElement).dataset.pageNum);
            if (!isNaN(pageNum)) visible.add(pageNum);
          }
        }
        setVisiblePages((prev) => {
          const merged = new Set(prev);
          for (const p of visible) merged.add(p);
          return merged;
        });

        if (visible.size > 0) {
          const maxPage = Math.max(...visible);
          setInternalPage(maxPage);
          onPageChange?.(maxPage);
        }
      },
      { root: scrollContainerRef.current, rootMargin: "200px 0px" }
    );

    const placeholders = scrollContainerRef.current.querySelectorAll("[data-page-num]");
    placeholders.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [viewMode, totalPagesCount, onPageChange]);

  // ───Touch gestures: Pinch-to-zoom───
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist,
        scale: scale,
      };
    } else if (e.touches.length === 1 && scale > 1.2) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        scrollLeft: scrollContainerRef.current?.scrollLeft || 0,
        scrollTop: scrollContainerRef.current?.scrollTop || 0,
      };
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = Math.max(0.3, Math.min(5, touchStartRef.current.scale * (dist / touchStartRef.current.dist)));
      setScale(Math.round(newScale * 100) / 100);
    } else if (e.touches.length === 1 && isPanning && panStartRef.current && scrollContainerRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - panStartRef.current.x;
      const dy = e.touches[0].clientY - panStartRef.current.y;
      scrollContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      scrollContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
    }
  }, [isPanning]);

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    panStartRef.current = null;
    setIsPanning(false);
  }, []);

  // ───Swipe detection for single page mode───
  const swipeStartRef = useRef<{ x: number; time: number } | null>(null);

  const handleSingleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && viewMode === "single" && scale <= 1.2) {
      swipeStartRef.current = { x: e.touches[0].clientX, time: Date.now() };
    }
  }, [viewMode, scale]);

  const handleSingleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeStartRef.current || viewMode !== "single" || scale > 1.2) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - swipeStartRef.current.x;
    const dt = Date.now() - swipeStartRef.current.time;

    // RTL: swipe left = next page, swipe right = prev page
    if (Math.abs(dx) > 50 && dt < 500) {
      if (dx < 0 && currentPage < totalPagesCount) {
        onPageChange?.(currentPage + 1);
      } else if (dx > 0 && currentPage > 1) {
        onPageChange?.(currentPage - 1);
      }
    }

    swipeStartRef.current = null;
  }, [viewMode, scale, currentPage, totalPagesCount, onPageChange]);

  // ───Wheel zoom (Ctrl+scroll)───
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setScale((prev) => {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        return Math.max(0.3, Math.min(5, Math.round((prev + delta) * 100) / 100));
      });
    }
  }, []);

  // ───Cleanup───
  useEffect(() => {
    return () => {
      if (pdfDocRef.current) {
        (pdfDocRef.current as { destroy: () => void }).destroy();
      }
    };
  }, []);

  // ───Page display dimensions (CSS pixels)───
  const pageDisplayWidth = useMemo(() => {
    if (!pageDimensions.width) return effectiveMaxWidth;
    const baseWidth = pageDimensions.width * (96 / 72);
    return baseWidth * adaptiveScale;
  }, [pageDimensions.width, adaptiveScale, effectiveMaxWidth]);

  const pageDisplayHeight = useMemo(() => {
    if (!pageDimensions.height) return 800;
    const baseHeight = pageDimensions.height * (96 / 72);
    return baseHeight * adaptiveScale;
  }, [pageDimensions.height, adaptiveScale]);

  // ═══════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════

  if (error && !pdfDocRef.current) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[300px] gap-3 ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-amber-500" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">الملف غير متاح للمعاينة</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[300px]">يرجى إعادة رفع الملف من جهازك لعرض الصفحات</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ touchAction: isPanning ? "none" : "pan-x pan-y" }}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-black/80 z-20 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-3 border-muted border-t-amber-500 animate-spin" />
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPagesCount > 0 ? `جارٍ تحميل الصفحة ${activePage}...` : "جارٍ تحميل الملف..."}
            </p>
          </div>
        </div>
      )}

      {/* ═══ وضع الصفحة الواحدة ═══ */}
      {viewMode === "single" && (
        <div
          className="relative overflow-auto rounded-lg bg-[#f5f5f5] dark:bg-zinc-900/80 shadow-lg"
          style={{
            maxWidth: "100%",
            maxHeight: "70vh",
            touchAction: isPanning ? "none" : "pan-x pan-y",
          }}
          onTouchStart={(e) => {
            handleTouchStart(e);
            handleSingleTouchStart(e);
          }}
          onTouchMove={handleTouchMove}
          onTouchEnd={(e) => {
            handleTouchEnd(e);
            handleSingleTouchEnd(e);
          }}
          onWheel={handleWheel}
        >
          <div
            className="flex items-start justify-center p-3"
            style={{ minHeight: `${pageDisplayHeight + 24}px` }}
          >
            <div className="relative bg-white rounded shadow-md ring-1 ring-black/5" style={{ filter: cssFilter }}>
              <canvas
                ref={canvasRef}
                className="block rounded"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                }}
              />\n              {/* Page number badge overlay */}
              {totalPagesCount > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-medium">
                  صفحة {currentPage} من {totalPagesCount}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ وضع التمرير المتعدد ═══ */}
      {viewMode === "scroll" && (
        <div
          ref={scrollContainerRef}
          className="overflow-auto rounded-lg bg-[#f5f5f5] dark:bg-zinc-900/80"
          style={{
            maxHeight: "75vh",
            touchAction: isPanning ? "none" : "pan-x pan-y",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <div className="flex flex-col items-center gap-4 p-3 pb-8">
            {Array.from({ length: totalPagesCount }, (_, i) => i + 1).map((pageNum) => {
              const dataUrl = renderedPages.get(pageNum);

              return (
                <div
                  key={pageNum}
                  data-page-num={pageNum}
                  ref={(el) => {
                    if (el) pageRefs.current.set(pageNum, el);
                    else pageRefs.current.delete(pageNum);
                  }}
                  className="relative bg-white rounded shadow-md ring-1 ring-black/5 overflow-hidden"
                  style={{
                    width: `${pageDisplayWidth}px`,
                    height: `${pageDisplayHeight}px`,
                    filter: cssFilter,
                  }}
                >
                  {dataUrl ? (
                    <img
                      src={dataUrl}
                      alt={`صفحة ${pageNum}`}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md font-mono">
                    {pageNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
