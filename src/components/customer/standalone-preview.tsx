"use client";

import { useState, useCallback, useRef, useMemo, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, Eye, Box, Sparkles, ShieldCheck, AlertTriangle,
  ZoomIn, ZoomOut, Grid3X3, Ruler, BookOpen, ChevronRight, ChevronLeft,
  Maximize2, Check, RotateCcw, Layers, Palette, Monitor,
  ArrowRight, ArrowLeft, X, ImagePlus, Bookmark,
  Copy, Settings2, ToggleLeft, ToggleRight, Pin, CircleDot, Paperclip, ImageIcon,
  Printer, Zap, Clock, History, Download, Minus, Plus, Calculator, Hash, Cloud,
  Send, User, Phone, CheckCircle2, Loader2,
} from "lucide-react";
import type { BindingType, FileCategory } from "@/components/customer/book-mockup-3d";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import dynamic from "next/dynamic";
import { useSettings } from "@/lib/customer/settings-provider";
import { DEFAULT_PRICING_RULES } from "@/lib/customer/default-settings";
import { detectFileType } from "@/lib/customer/magic-bytes";
import { processPdfInWorker, processPdfMainThread, terminatePdfWorker, type PdfWorkerResult } from "@/lib/customer/pdf-worker-bridge";

/* ═══ Server-side PDF processing result (for large files >10MB) ═══ */
interface ServerPdfResult {
  numPages: number;
  pageDimensionsMM: { width: number; height: number };
  closestPaperSize: string;
  isPortrait: boolean;
  aspectRatio: number;
  title: string;
  author: string;
  coverImageUrl: string | null;
  backImageUrl: string | null;
  processingTimeMs: number;
}

/** 10MB threshold: above this, PDF processing is server-side */
const CLIENT_SIZE_LIMIT = 10 * 1024 * 1024;

const ProfessionalPdfViewer = dynamic(
  () => import("@/components/customer/professional-pdf-viewer").then((m) => ({ default: m.ProfessionalPdfViewer })),
  { ssr: false, loading: () => <SpinLoader /> },
);
const BookMockup3D = dynamic(
  () => import("@/components/customer/book-mockup-3d").then((m) => ({ default: m.BookMockup3D })),
  { ssr: false, loading: () => <SpinLoader /> },
);
const PageViewer2D = dynamic(
  () => import("@/components/customer/page-viewer-2d").then((m) => ({ default: m.PageViewer2D })),
  { ssr: false },
);

type Step = "idle" | "uploading" | "analyzing" | "results" | "preview";

type UploadedFileType = "pdf" | "image" | "document" | "design";

interface AnalysisResult {
  pageCount: number;
  fileSizeKB: number;
  fileSizeMB: number;
  paperSize: string;
  paperType: string;
  binding: string;
  color: string;
  orientation: string;
  title: string;
  author: string;
  confidence: number;
  insights: string[];
  healthScore: number;
  hasImages: boolean;
  hasEmbeddedFonts: boolean;
  imageCount: number;
  isEncrypted: boolean;
  textLayer: boolean;
  isColor: boolean;
  dpiCategory: string;
  estimatedDPI: number;
  closestPaperSize: string;
  pageDimensionsMM: { width: number; height: number } | null;
  fileNature: string;
}

interface RecentUpload {
  name: string;
  size: string;
  pages: number;
  category: FileCategory;
  timestamp: number;
  storedFileName: string;
  fileType: UploadedFileType;
}

const DEFAULT_ANALYSIS: AnalysisResult = {
  pageCount: 0, fileSizeKB: 0, fileSizeMB: 0, paperSize: "A4", paperType: "normal",
  binding: "none", color: "bw", orientation: "portrait", title: "", author: "",
  confidence: 0, insights: [], healthScore: 0, hasImages: false, hasEmbeddedFonts: false,
  imageCount: 0, isEncrypted: false, textLayer: false, isColor: false, dpiCategory: "",
  estimatedDPI: 0, closestPaperSize: "", pageDimensionsMM: null, fileNature: "",
};

const HISTORY_KEY = "print-shop-recent-uploads";

/* ═══ محرك تصنيف الملفات التلقائي ═══ */
function classifyFile(
  fileType: UploadedFileType | string,
  pageCount: number,
  pageDimensionsMM: { width: number; height: number } | null,
): FileCategory {
  // صورة مباشرة = دائماً صورة
  if (fileType === "image") return "image";
  // مستند أو تصميم = مستند قصير
  if (fileType === "document" || fileType === "design") return "short-doc";
  // PDF صفحة واحدة = صورة
  if (pageCount <= 1) return "image";
  // 2-10 صفحات = مستند قصير
  if (pageCount <= 10) return "short-doc";
  // أكثر من 10 = كتاب
  return "book";
}

/* التجليد الافتراضي حسب التصنيف */
function getDefaultBinding(category: FileCategory): BindingType {
  if (category === "image") return "none";
  if (category === "short-doc") return "staple";
  return "spiral";
}

/* ═══ تقدير تكلفة الطباعة (مبسط) ═══ */
function estimateCost(pages: number, isColor: boolean): { min: number; max: number } {
  const basePerPage = isColor ? 0.25 : 0.08;
  const min = Math.round(pages * basePerPage * 100) / 100;
  const max = Math.round(pages * basePerPage * 1.6 * 100) / 100;
  return { min, max };
}

/* ═══ تقدير وقت الطباعة ═══ */
function estimateTime(pages: number): string {
  if (pages <= 1) return "1-3 دقائق";
  if (pages <= 10) return "3-8 دقائق";
  if (pages <= 50) return "8-20 دقيقة";
  if (pages <= 100) return "20-40 دقيقة";
  return "40-60 دقيقة";
}

/* ═══ حساب "منذ متى" ═══ */
function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  return `منذ ${Math.floor(diff / 86400)} يوم`;
}

/* ─── تنسيق حجم الملف ─── */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StandalonePreview() {
  const settings = useSettings();
  const [step, setStep] = useState<Step>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<UploadedFileType>("pdf");
  const [storedName, setStoredName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult>(DEFAULT_ANALYSIS);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState("");
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState<"mockup" | "precise">("mockup");
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfViewMode, setPdfViewMode] = useState<"single" | "scroll">("single");
  const [showOverlay, setShowOverlay] = useState(false);
  const [showCropMarks, setShowCropMarks] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeBinding, setActiveBinding] = useState<BindingType>("spiral");
  const [duplex, setDuplex] = useState(true);
  const [spineColor, setSpineColor] = useState("");
  const [show3DSettings, setShow3DSettings] = useState(false);
  // خيارات المستند القصير
  const [staplePosition, setStaplePosition] = useState<"top-left" | "top" | "left">("top-left");
  const [holePunch, setHolePunch] = useState<"none" | "2hole" | "4hole">("none");
  // نوع الورق للصورة
  const [imagePaperType, setImagePaperType] = useState<"normal" | "glossy" | "matte">("normal");
  // غلاف بلاستيكي شفاف
  const [clearCover, setClearCover] = useState(false);
  // عدد النسخ
  const [copies, setCopies] = useState(1);
  // وزن الورق
  const [paperWeight, setPaperWeight] = useState<"80gsm" | "100gsm" | "120gsm">("80gsm");
  // لون الطباعة (مستقل عن التحليل)
  const [printColor, setPrintColor] = useState<boolean>(true);
  // recent uploads history
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  // image preview URL
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  // Worker-processed PDF data (cover/back textures + dimensions)
  const [workerResult, setWorkerResult] = useState<PdfWorkerResult | null>(null);
  // Original file ref for worker processing
  const fileForWorkerRef = useRef<File | null>(null);
  // 2D Page Viewer overlay state
  const [browsePagesOpen, setBrowsePagesOpen] = useState(false);
  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState<{ originalSize: number; compressedSize: number; warning?: boolean } | null>(null);
  // Order dialog state
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  // Order dialog
  const [orderStep, setOrderStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── تحميل السجل من localStorage ─── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setRecentUploads(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  /* ─── Cleanup: terminate PDF Worker on unmount ─── */
  useEffect(() => {
    return () => { terminatePdfWorker(); };
  }, []);

  /* ─── تنظيف URL الصورة عند إلغاء التحديد ─── */
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  /* ─── إنشاء URL معاينة الصورة ─── */
  useEffect(() => {
    if (file && uploadedFileType === "image") {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [file, uploadedFileType]);

  /* ─── حفظ في السجل ─── */
  const saveToHistory = useCallback((f: File, cat: FileCategory, sn: string, ft: UploadedFileType) => {
    setRecentUploads((prev) => {
      const entry: RecentUpload = {
        name: f.name,
        size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
        pages: (ft === "image" || ft === "document" || ft === "design") ? 1 : totalPages || 1,
        category: cat,
        timestamp: Date.now(),
        storedFileName: sn,
        fileType: ft,
      };
      const updated = [entry, ...prev].slice(0, 5);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [totalPages]);

  /* ─── مسح السجل ─── */
  const clearHistory = useCallback(() => {
    setRecentUploads([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  /* ─── إعادة رفع من السجل ─── */
  const reuploadFromHistory = useCallback(async (item: RecentUpload) => {
    setStoredName(item.storedFileName);
    setUploadedFileType(item.fileType);
    setFile(null);
    setImagePreviewUrl(null);
    // Set minimal analysis for re-uploaded item
    const cat = item.category;
    setAnalysis((prev) => ({
      ...prev,
      pageCount: item.pages,
      closestPaperSize: "A4",
      confidence: 80,
      healthScore: 80,
      isColor: true,
      insights: ["تم إعادة تحميل ملف سابق"],
    }));
    setTotalPages(item.pages);
    setActiveBinding(getDefaultBinding(cat));
    setStep("preview");
  }, []);

  /* ─── التصنيف التلقائي ─── */
  const fileCategory = useMemo<FileCategory>(
    () => classifyFile(uploadedFileType, analysis.pageCount, analysis.pageDimensionsMM),
    [uploadedFileType, analysis.pageCount, analysis.pageDimensionsMM],
  );

  // التجليد الفعّال = التصنيف يحدد الخيارات المتاحة
  const effectiveBinding = fileCategory === "image" ? "none" : activeBinding;
  const bindingLabel: Record<string, string> = { perfect: "كمالي", spiral: "سلك", brochure: "بروشور", staple: "دبوس", none: "سائبة" };

  // أوصاف التصنيف بالعربي
  const categoryInfo = useMemo(() => {
    switch (fileCategory) {
      case "image": return {
        label: "صورة / شهادة",
        color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
        borderGrad: "from-emerald-200 to-emerald-400 dark:from-emerald-800 dark:to-emerald-600",
        icon: <ImageIcon className="h-3.5 w-3.5" />,
        description: "ورقة مطبوعة منبسطة — لا يتطلب تجليد",
      };
      case "short-doc": return {
        label: "مستند قصير",
        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        borderGrad: "from-amber-200 to-amber-400 dark:from-amber-800 dark:to-amber-600",
        icon: <FileText className="h-3.5 w-3.5" />,
        description: `${analysis.pageCount} صفحة — دبوس + تجويف`,
      };
      case "book": return {
        label: "كتاب / مذكرة",
        color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
        borderGrad: "from-violet-200 to-violet-400 dark:from-violet-800 dark:to-violet-600",
        icon: <BookOpen className="h-3.5 w-3.5" />,
        description: `${analysis.pageCount} صفحة — تجليد متقدم`,
      };
    }
  }, [fileCategory, analysis.pageCount]);

  const resetZoom = useCallback(() => setZoom(100), []);
  const resetAll = useCallback(() => {
    setStep("idle"); setFile(null); setStoredName(""); setUploadProgress(0);
    setAnalysis(DEFAULT_ANALYSIS); setAnalysisProgress(0); setAnalysisStage("");
    setError(""); setPreviewMode("mockup"); setZoom(100); setCurrentPage(1);
    setTotalPages(0); setShowOverlay(false); setShowCropMarks(false);
    setUploadedFileType("pdf"); setHolePunch("none"); setStaplePosition("top-left");
    setImagePaperType("normal"); setImagePreviewUrl(null);
    setCopies(1); setPaperWeight("80gsm"); setPrintColor(true);
    setClearCover(false); setSpineColor(""); setDuplex(true);
    setWorkerResult(null); fileForWorkerRef.current = null;
    setDownloadInfo(null); setIsDownloading(false);
    setOrderStep(1); setIsSubmitting(false);
  }, []);

  /* ─── تنزيل الملف عبر API ─── */
  const handleDownload = useCallback(async () => {
    if (!storedName) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/download?file=${encodeURIComponent(storedName)}`);
      if (!res.ok) {
        console.error("Download failed:", res.status);
        return;
      }
      const blob = await res.blob();
      const originalSize = Number(res.headers.get("X-Original-Size") || 0);
      const compressedSize = Number(res.headers.get("X-Compressed-Size") || 0);
      const hasWarning = res.headers.get("X-File-Size-Warning") === "true";

      setDownloadInfo({
        originalSize,
        compressedSize,
        warning: hasWarning,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file?.name || storedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [storedName, file]);

  const uploadAndAnalyze = useCallback(async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    const imageExts = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "avif", "svg"];
    const pdfExts = ["pdf"];
    const docExts = ["docx", "doc", "xlsx", "xls", "pptx", "ppt", "txt", "rtf", "csv"];
    const designExts = ["ai", "eps", "psd", "indd"];
    const allAccepted = [...imageExts, ...pdfExts, ...docExts, ...designExts];

    const claimedImage = imageExts.includes(ext);
    const claimedPdf = pdfExts.includes(ext);
    const claimedDoc = docExts.includes(ext);
    const claimedDesign = designExts.includes(ext);
    const isAccepted = allAccepted.includes(ext);

    if (!isAccepted) {
      setError(`صيغة غير مدعومة. الصيغ المدعومة: PDF, JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, SVG, DOCX, XLSX, PPTX, AI, EPS, PSD`);
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError("حجم الملف يتجاوز 100 ميغابايت");
      return;
    }

    /* ─── Magic Bytes Validation ─── */
    try {
      const detected = await detectFileType(f);
      if (claimedPdf && detected.type !== "pdf") {
        setError(`الملف ليس PDF حقيقي — تم اكتشاف: ${detected.description}. يرجى اختيار ملف PDF صالح.`);
        return;
      }
      if (claimedImage && detected.type === "pdf") {
        // Auto-correct: treat as PDF
      }
      // Relax magic bytes for new image formats (GIF, BMP, TIFF, AVIF, SVG don't have strict magic detection)
      if (claimedImage && !claimedDoc && !claimedDesign && detected.type !== "unknown" && detected.type !== "pdf") {
        const validImageTypes = ["jpeg", "jpg", "png", "webp", "gif", "bmp", "tiff", "avif", "svg"];
        if (!validImageTypes.includes(detected.type) && !detected.description.startsWith("JPEG")) {
          setError(`صيغة الصورة غير مدعومة — تم اكتشاف: ${detected.description}`);
          return;
        }
      }
      // Skip magic bytes validation for documents and design files (they have varied internal structures)
    } catch {
      // If magic bytes check fails, continue with extension-based detection (graceful fallback)
    }

    const isImage = claimedImage;
    const isPdf = claimedPdf || (claimedImage && false); // PDF auto-correct handled above
    const isDoc = claimedDoc;
    const isDesign = claimedDesign;

    // Determine display file type
    let displayType: "image" | "pdf" | "document" | "design" = "image";
    if (claimedPdf) displayType = "pdf";
    else if (claimedDoc) displayType = "document";
    else if (claimedDesign) displayType = "design";
    else if (claimedImage) displayType = "image";

    setUploadedFileType(displayType);
    setStep("uploading"); setUploadProgress(0);
    setWorkerResult(null);
    fileForWorkerRef.current = isPdf ? f : null;
    try {
      // ═══ Real XHR upload with progress tracking ═══
      const fd = new FormData(); fd.append("file", f);
      const storedFileName = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/c/upload");
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(Math.min(pct, 99));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              setUploadProgress(100);
              resolve(data.storedFileName);
            } catch { reject(new Error("فشل في قراءة استجابة الخادم")); }
          } else {
            try { const e = JSON.parse(xhr.responseText); reject(new Error(e.error || "فشل في رفع الملف")); }
            catch { reject(new Error(`فشل في رفع الملف (${xhr.status})`)); }
          }
        });
        xhr.addEventListener("error", () => reject(new Error("خطأ في الاتصال بالخادم")));
        xhr.addEventListener("abort", () => reject(new Error("تم إلغاء الرفع")));
        xhr.send(fd);
      });
      setStoredName(storedFileName);

      if (isImage) {
        // صورة: تحليل مبسط بدون pdfjs
        setAnalysisProgress(100);
        const imgResult: AnalysisResult = {
          ...DEFAULT_ANALYSIS,
          pageCount: 1,
          fileSizeKB: Math.round(f.size / 1024),
          fileSizeMB: Math.round((f.size / (1024 * 1024)) * 100) / 100,
          paperSize: "A4",
          paperType: "normal",
          binding: "none",
          color: "color",
          orientation: "portrait",
          closestPaperSize: "A4",
          confidence: 85,
          insights: ["صورة مرفوعة — ستُطبع كورقة واحدة"],
          healthScore: 85,
          hasImages: true,
          isColor: true,
          fileNature: "صورة",
        };
        setAnalysis(imgResult);
        setTotalPages(1);
        const cat = classifyFile("image", 1, null);
        saveToHistory(f, cat, storedFileName, "image");
        setStep("results");
      } else if (isDoc || isDesign) {
        // ═══ مستند أو ملف تصميم: رفع مباشر بدون تحليل PDF ═══
        setAnalysisProgress(100);
        const fileLabel = isDoc ? "مستند" : "ملف تصميم";
        const docResult: AnalysisResult = {
          ...DEFAULT_ANALYSIS,
          pageCount: 1,
          fileSizeKB: Math.round(f.size / 1024),
          fileSizeMB: Math.round((f.size / (1024 * 1024)) * 100) / 100,
          paperSize: "A4",
          paperType: "normal",
          binding: "none",
          color: "color",
          orientation: "portrait",
          closestPaperSize: "A4",
          confidence: 70,
          insights: [`${fileLabel} مرفوع (${ext.toUpperCase()}) — سيتم مراجعته من قبل المطبعة`],
          healthScore: 75,
          hasImages: isDesign,
          isColor: true,
          fileNature: isDesign ? "تصميم" : "مستند",
        };
        setAnalysis(docResult);
        setTotalPages(1);
        const cat = classifyFile(isDesign ? "design" : "document", 1, null);
        saveToHistory(f, cat, storedFileName, displayType);
        setStep("results");
      } else {
        // ═══════════════════════════════════════════════════════════════
        // HYBRID PDF PROCESSING: 10MB threshold
        // ═══════════════════════════════════════════════════════════════
        setStep("analyzing"); setAnalysisProgress(0);

        const IS_LARGE_FILE = f.size > CLIENT_SIZE_LIMIT;

        if (IS_LARGE_FILE) {
          // ═══════════════════════════════════════════════════════
          // PATH A: Server-Side Processing (>10MB)
          // The browser NEVER reads this file — zero memory impact
          // ═══════════════════════════════════════════════════════
          setAnalysisStage("معالجة سحابية — الملف كبير (جاريْ المعالجة على الخادم)...");
          setAnalysisProgress(10);

          // Send file to server for processing (separate from upload to avoid double send)
          const processFd = new FormData();
          processFd.append("file", f);

          setAnalysisProgress(25);
          const processRes = await fetch("/api/c/pdf-process", { method: "POST", body: processFd });

          if (!processRes.ok) {
            const errData = await processRes.json().catch(() => ({}));
            throw new Error(errData.error || "فشل في المعالجة السحابية");
          }

          setAnalysisProgress(70);
          const serverData: ServerPdfResult = await processRes.json();

          setAnalysisProgress(85);
          setAnalysisStage("جارٍ تحميل صورة الغلاف...");

          // ═══ STRICT PIPELINE: Convert server URLs to data URLs BEFORE showing 3D preview ═══
          // This ensures BookMockup3D receives the texture on its FIRST render
          let coverDataUrl: string | null = null;
          let backDataUrl: string | null = null;

          if (serverData.coverImageUrl) {
            try {
              setAnalysisStage("جارٍ تحميل صورة الغلاف...");
              const coverResp = await fetch(serverData.coverImageUrl);
              if (!coverResp.ok) throw new Error(`HTTP ${coverResp.status}`);
              const coverBlob = await coverResp.blob();
              coverDataUrl = await new Promise<string>((res) => {
                const reader = new FileReader();
                reader.onloadend = () => res(reader.result as string);
                reader.readAsDataURL(coverBlob);
              });
            } catch {
              /* cover conversion failed — will render without cover texture */
            }
          }

          if (serverData.backImageUrl) {
            try {
              const backResp = await fetch(serverData.backImageUrl);
              if (!backResp.ok) throw new Error(`HTTP ${backResp.status}`);
              const backBlob = await backResp.blob();
              backDataUrl = await new Promise<string>((res) => {
                const reader = new FileReader();
                reader.onloadend = () => res(reader.result as string);
                reader.readAsDataURL(backBlob);
              });
            } catch {
              /* back conversion failed — will render without back texture */
            }
          }

          // Set worker result WITH the data URLs (not null)
          setWorkerResult({
            numPages: serverData.numPages ?? 1,
            pageDimensionsMM: serverData.pageDimensionsMM ?? null,
            closestPaperSize: serverData.closestPaperSize ?? undefined,
            isPortrait: serverData.isPortrait ?? true,
            aspectRatio: serverData.aspectRatio ?? undefined,
            coverDataUrl,
            backDataUrl,
          });

          // Build analysis result from server data + light client metadata
          setAnalysisProgress(95);
          const numP = serverData.numPages ?? 1;
          const pdfResult: AnalysisResult = {
            ...DEFAULT_ANALYSIS,
            pageCount: numP,
            fileSizeKB: Math.round(f.size / 1024),
            fileSizeMB: Math.round((f.size / (1024 * 1024)) * 100) / 100,
            paperSize: serverData.closestPaperSize || undefined,
            orientation: serverData.isPortrait ? "portrait" : "landscape",
            closestPaperSize: serverData.closestPaperSize || undefined,
            pageDimensionsMM: serverData.pageDimensionsMM ?? null,
            title: serverData.title || "",
            author: serverData.author || "",
            confidence: 90,
            healthScore: 90,
            hasImages: true,
            isColor: true,
            insights: [
              `معالجة سحابية ناجحة في ${serverData.processingTimeMs ?? "?"}مس`,
              `الملف يحتوي على ${numP} صفحة`,
              `الأبعاد: ${serverData.pageDimensionsMM?.width ?? "?"}×${serverData.pageDimensionsMM?.height ?? "?"} مم`,
            ],
            fileNature: numP > 10 ? "كتاب / مذكرة" : numP > 1 ? "مستند قصير" : "صفحة واحدة",
          };
          setAnalysis(pdfResult);
          setTotalPages(numP);
          setAnalysisProgress(100);
          setAnalysisStage("");
          const cat = classifyFile("pdf", numP, serverData.pageDimensionsMM ?? null);
          saveToHistory(f, cat, storedFileName, "pdf");
          setStep("results");

        } else {
          // ═══════════════════════════════════════════════════════
          // PATH B: Client-Side Web Worker Processing (≤10MB)
          // Fast local processing, no server rendering needed
          // ═══════════════════════════════════════════════════════
          setAnalysisStage("جارٍ تحليل الملف...");

          // Start Web Worker for cover/back textures in parallel (non-blocking)
          const workerPromise = (async () => {
            try {
              setAnalysisStage("استخراج الغلاف (خيط منفصل)...");
              const result = await processPdfInWorker(f, (p) => {
                if (p.percent > 20) setAnalysisProgress(Math.min(p.percent * 0.8, 85));
                if (p.stage === "cover") setAnalysisStage("جارٍ استخراج الغلاف...");
                else if (p.stage === "back") setAnalysisStage("جارٍ استخراج الصفحة الأخيرة...");
                else if (p.stage === "cleanup") setAnalysisStage("جارٍ الانتهاء...");
              });
              setWorkerResult(result);
              return result;
            } catch {
              /* Worker failed — falling back to main-thread */
              try {
                const fallback = await processPdfMainThread(f, (p) => {
                  if (p.percent > 20) setAnalysisProgress(Math.min(p.percent * 0.8, 85));
                });
                setWorkerResult(fallback);
                return fallback;
              } catch { return null; }
            }
          })();

          // Run full analysis (text, metadata, health) in parallel with worker
          const { analyzeFileReal } = await import("@/lib/customer/file-analyzer");
          setAnalysisProgress(20);

          // Wait for both to complete
          const [r] = await Promise.all([analyzeFileReal(f), workerPromise]);

          setAnalysisProgress(100);
          setAnalysisStage("");
          const pdfResult: AnalysisResult = {
            pageCount: r.pageCount, fileSizeKB: r.fileSizeKB, fileSizeMB: r.fileSizeMB,
            paperSize: r.closestPaperSize || r.suggestedPaperSize || "A4",
            paperType: r.suggestedPaperType || "normal", binding: r.suggestedBinding || "none",
            color: r.suggestedColor || "bw",
            orientation: r.isPortrait === false ? "landscape" : "portrait",
            title: r.pdfTitle || "", author: r.pdfAuthor || "", confidence: r.confidence,
            insights: r.insights,
            healthScore: Math.min(100, Math.round(r.confidence * 0.8 + (r.hasEmbeddedFonts ? 10 : 0) + (r.textLayer ? 10 : 0))),
            hasImages: r.hasImages || false, hasEmbeddedFonts: r.hasEmbeddedFonts || false,
            imageCount: r.imageCount || 0, isEncrypted: r.isEncrypted || false,
            textLayer: r.textLayer || false, isColor: r.isColor || false,
            dpiCategory: r.dpiCategory || "", estimatedDPI: r.estimatedDPI || 0,
            closestPaperSize: r.closestPaperSize || "",
            pageDimensionsMM: r.pageDimensionsMM || null, fileNature: r.fileNature || "",
          };
          setAnalysis(pdfResult);
          setTotalPages(r.pageCount);
          const cat = classifyFile("pdf", r.pageCount, r.pageDimensionsMM || null);
          saveToHistory(f, cat, storedFileName, "pdf");
          setStep("results");
        }
      }
    } catch (e) {
      /* Error during upload/analyze */
      setError((e as Error).message || "حدث خطأ غير متوقع"); setStep("idle");
    }
  }, [saveToHistory]);

  const handleFile = useCallback(async (f: File) => {
    setError(""); setFile(f); await uploadAndAnalyze(f);
  }, [uploadAndAnalyze]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const onDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }, []);
  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const s = e.target.files?.[0]; if (s) handleFile(s);
  }, [handleFile]);

  // Reusable category-based gradient classnames (eliminates 4x duplication in stat cards)
  const catCardBg = useMemo(() => {
    if (fileCategory === "image") return "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-950/10 border-emerald-200/50 dark:border-emerald-800/30";
    if (fileCategory === "short-doc") return "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-950/10 border-amber-200/50 dark:border-amber-800/30";
    return "bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/20 dark:to-violet-950/10 border-violet-200/50 dark:border-violet-800/30";
  }, [fileCategory]);

  const hCol = analysis.healthScore >= 80 ? "text-emerald-500" : analysis.healthScore >= 60 ? "text-amber-500" : "text-rose-500";
  const hBg = analysis.healthScore >= 80 ? "bg-emerald-500" : analysis.healthScore >= 60 ? "bg-amber-500" : "bg-rose-500";
  const hStroke = analysis.healthScore >= 80 ? "#10b981" : analysis.healthScore >= 60 ? "#f59e0b" : "#f43f5e";
  const hLbl = analysis.healthScore >= 80 ? "جاهز للطباعة" : analysis.healthScore >= 60 ? "جيد مع ملاحظات" : "يحتاج تحسين";

  const cost = estimateCost(analysis.pageCount, analysis.isColor);
  const printTime = estimateTime(analysis.pageCount);

  /* ─── حاسبة التسعير اللحظي ─── */
  const pricing = useMemo(() => {
    const pages = analysis.pageCount || 1;
    const isColor = printColor;
    const pr = settings.settings.general.pricingRules || DEFAULT_PRICING_RULES;
    const basePerPage = isColor ? pr.colorCostPerPage : pr.bwCostPerPage;
    const printCost = basePerPage * pages * copies * (pr.paperSurcharge[paperWeight] || 1.0);
    const bindCost = pr.bindingCosts[effectiveBinding] || 0;
    const coverCost = clearCover ? pr.clearCoverCost : 0;
    const duplexSurcharge = duplex && pages > 1 ? pages * pr.duplexPerPageRate * copies : 0;
    const subtotal = printCost + bindCost * copies + coverCost * copies + duplexSurcharge;
    const vat = subtotal * (pr.vatRate / 100);
    const total = Math.round((subtotal + vat) * 100) / 100;
    return {
      printCost: Math.round(printCost * 100) / 100,
      bindCost: Math.round(bindCost * copies * 100) / 100,
      coverCost: Math.round(coverCost * copies * 100) / 100,
      duplexSurcharge: Math.round(duplexSurcharge * 100) / 100,
      vat: Math.round(vat * 100) / 100,
      total,
    };
  }, [analysis.pageCount, printColor, copies, paperWeight, effectiveBinding, clearCover, duplex, settings.settings.general.pricingRules]);

  const ORDER_STEPS = [
    { n: 1, label: "بياناتك", icon: <User className="h-4 w-4" /> },
    { n: 2, label: "التأكيد", icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  // SVG circle gauge (larger: radius 42)
  const gaugeRadius = 42;
  const gaugeCircum = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircum - (analysis.healthScore / 100) * gaugeCircum;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ═══════════════════════════════════════════════════════════
          الرأس الاحترافي — Animated Header
         ═══════════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center space-y-4 pt-4 pb-2"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25 flex items-center justify-center"
          >
            <Printer className="h-8 w-8 text-white" />
          </motion.div>
        </div>

        {/* Title with gradient */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-l from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
            {settings.shopName || "مطبعة الذكي"}
          </h1>
          <p className="text-foreground/70 text-sm mt-2 font-medium">
            ارفع ملفك وشاهد المعاينة ثلاثية الأبعاد فوراً
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex justify-center gap-3 flex-wrap">
          {[
            { icon: <Sparkles className="h-3.5 w-3.5" />, label: "تحليل ذكي" },
            { icon: <Box className="h-3.5 w-3.5" />, label: "معاينة 3D" },
            { icon: <Zap className="h-3.5 w-3.5" />, label: "طباعة فورية" },
          ].map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium shadow-sm"
            >
              {badge.icon}
              {badge.label}
            </span>
          ))}
        </div>
      </motion.header>

      {step === "idle" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* ─── منطقة الرفع المحسّنة ─── */}
          <style>{`
            @keyframes gradient-rotate {
              0%   { background-position: 0% 50%; }
              50%  { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes float-upload {
              0%, 100% { transform: translateY(0px); }
              50%      { transform: translateY(-8px); }
            }
            .upload-zone-border {
              background: linear-gradient(270deg, #f59e0b, #f97316, #eab308, #f59e0b);
              background-size: 300% 300%;
              animation: gradient-rotate 4s ease infinite;
            }
            .upload-float {
              animation: float-upload 3s ease-in-out infinite;
            }
            .grid-pattern {
              background-image: radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px);
              background-size: 20px 20px;
            }
            .dark .grid-pattern {
              background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
            }
          `}</style>
          <div
            className={`relative rounded-3xl p-[3px] transition-all duration-300 ${isDragging ? "scale-[1.02] shadow-xl shadow-amber-500/20" : "hover:shadow-lg hover:shadow-amber-500/10"}`}
            onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
          >
            {/* Animated gradient border */}
            <div className={`upload-zone-border absolute inset-0 rounded-3xl transition-opacity duration-300 ${isDragging ? "opacity-100 scale-105" : "opacity-70"}`} />
            <div
              className={`relative rounded-[21px] bg-background cursor-pointer group transition-all duration-300 ${isDragging ? "bg-amber-50/80 dark:bg-amber-950/30" : "hover:bg-muted/20"}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tiff,.tif,.avif,.svg,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.rtf,.csv,.ai,.eps,.psd,.indd" className="hidden" onChange={onFileInput} />
              <div className="grid-pattern rounded-[21px] px-6 sm:px-16 py-10 sm:py-16 flex flex-col items-center justify-center gap-5 min-h-[320px] sm:min-h-[360px]">
                {/* Upload icon with float */}
                <div className="upload-float w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Upload className="h-10 w-10 text-amber-500" />
                </div>
                <div className="text-center w-full">
                  <p className="text-lg font-bold mb-1.5 bg-gradient-to-l from-amber-600 to-orange-500 bg-clip-text text-transparent">اسحب الملف هنا</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">أو انقر لاختيار ملف من جهازك</p>
                </div>

                {/* Format icons row */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {[
                    { icon: <FileText className="h-4 w-4" />, label: "PDF", bg: "bg-red-50 dark:bg-red-950/30 text-red-500 border-red-200/50 dark:border-red-800/30" },
                    { icon: <ImageIcon className="h-4 w-4" />, label: "JPG", bg: "bg-blue-50 dark:bg-blue-950/30 text-blue-500 border-blue-200/50 dark:border-blue-800/30" },
                    { icon: <ImagePlus className="h-4 w-4" />, label: "PNG", bg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 border-emerald-200/50 dark:border-emerald-800/30" },
                    { icon: <FileText className="h-4 w-4" />, label: "WebP", bg: "bg-purple-50 dark:bg-purple-950/30 text-purple-500 border-purple-200/50 dark:border-purple-800/30" },
                    { icon: <FileText className="h-4 w-4" />, label: "DOCX", bg: "bg-sky-50 dark:bg-sky-950/30 text-sky-500 border-sky-200/50 dark:border-sky-800/30" },
                    { icon: <FileText className="h-4 w-4" />, label: "AI/PSD", bg: "bg-orange-50 dark:bg-orange-950/30 text-orange-500 border-orange-200/50 dark:border-orange-800/30" },
                    { icon: <FileText className="h-4 w-4" />, label: "+18", bg: "bg-gray-50 dark:bg-gray-950/30 text-gray-500 border-gray-200/50 dark:border-gray-800/30" },
                  ].map((fmt) => (
                    <span key={fmt.label} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold min-w-[72px] justify-center ${fmt.bg}`}>
                      {fmt.icon}
                      {fmt.label}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>حتى 100 ميغابايت</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-rose-200/80 bg-gradient-to-l from-rose-50 to-rose-50/80 dark:from-rose-950/20 dark:to-rose-950/10 dark:border-rose-800/40">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                </div>
                <p className="text-sm text-rose-700 dark:text-rose-300 flex-1 font-medium">{error}</p>
                <button
                  onClick={() => { setError(""); fileInputRef.current?.click(); }}
                  className="shrink-0 px-4 py-2 rounded-xl bg-white dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-900/50 transition-all border border-rose-200/80 dark:border-rose-800/50 shadow-sm"
                >إعادة محاولة</button>
                <button onClick={() => setError("")} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"><X className="h-4 w-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── عمليات سابقة ─── Recent Uploads History ─── */}
          {recentUploads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <History className="h-4 w-4" />
                  عمليات سابقة
                </div>
                <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-rose-500 transition-colors">
                  مسح السجل
                </button>
              </div>
              <div className="space-y-2">
                {recentUploads.map((item, i) => {
                  const catColor = item.category === "image"
                    ? "border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/10"
                    : item.category === "short-doc"
                      ? "border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600 bg-amber-50/30 dark:bg-amber-950/10"
                      : "border-violet-300 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-600 bg-violet-50/30 dark:bg-violet-950/10";
                  const badgeColor = item.category === "image"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : item.category === "short-doc"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300";
                  return (
                    <motion.button
                      key={item.timestamp}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => reuploadFromHistory(item)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border ${catColor} transition-all duration-200 hover:shadow-sm text-right`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-background dark:bg-card flex items-center justify-center shrink-0 shadow-sm">
                        {item.fileType === "image"
                          ? <ImageIcon className="h-4 w-4 text-emerald-500" />
                          : <FileText className="h-4 w-4 text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.pages} صفحة • {item.size}</p>
                      </div>
                      <Badge className={`${badgeColor} border-0 text-[9px] font-semibold`}>
                        {item.category === "image" ? "صورة" : item.category === "short-doc" ? "مستند" : "كتاب"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(item.timestamp)}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {step === "uploading" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 rounded-3xl border p-8 sm:p-12 bg-card shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center"
            >
              <Upload className="h-8 w-8 text-amber-500" />
            </motion.div>
            <div><p className="font-semibold text-lg">جارٍ رفع الملف...</p><p className="text-sm text-muted-foreground mt-1">{file?.name}</p><p className="text-xs text-muted-foreground/70">{file ? `${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت` : ""}</p></div>
            <div className="w-full max-w-sm space-y-2">
              <div className="relative">
                <Progress value={uploadProgress} className="h-3" />
                <motion.div
                  className="absolute top-0 right-0 h-3 rounded-full bg-gradient-to-l from-amber-400 to-amber-500/0"
                  style={{ width: `${uploadProgress}%` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <p className="text-xs text-muted-foreground font-mono tabular-nums">{uploadProgress}%</p>
            </div>
          </div>
        </motion.div>
      )}

      {step === "analyzing" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 rounded-3xl border p-8 sm:p-12 bg-card shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center"
            >
              {file && file.size > CLIENT_SIZE_LIMIT
                ? <Cloud className="h-8 w-8 text-amber-500" />
                : <Sparkles className="h-8 w-8 text-amber-500" />}
            </motion.div>
            <div>
              <p className="font-semibold text-lg">
                {file && file.size > CLIENT_SIZE_LIMIT ? "معالجة سحابية للملف الكبير..." : "جارٍ تحليل الملف..."}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{analysisStage}</p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <Progress value={analysisProgress} className="h-2" />
              <p className="text-xs text-muted-foreground font-mono">{analysisProgress}%</p>
            </div>
            {file && file.size > CLIENT_SIZE_LIMIT && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-3 py-2">
                <ShieldCheck className="h-4 w-4" />
                <span>الملف كبير ({(file.size / (1024 * 1024)).toFixed(1)} MB) — يتم المعالجة على الخادم لتجنب تجميد المتصفح</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {step === "results" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* ─── بطاقة النتائج مع شارة التصنيف + معاينة + مؤشر دائري ─── */}
          <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Image thumbnail or file icon */}
                {imagePreviewUrl ? (
                  <div className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 bg-gradient-to-br ${categoryInfo.borderGrad}`}>
                    <img src={imagePreviewUrl} alt="معاينة" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                    <FileText className="h-7 w-7 text-amber-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">{analysis.fileSizeMB} ميغابايت • {analysis.pageCount} صفحة</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={`${categoryInfo.color} border-0 text-[10px] font-semibold gap-1`}>{categoryInfo.icon}{categoryInfo.label}</Badge>
              </div>
            </div>

            {/* Health Score gauge + stats */}
            <div className="flex items-center gap-6">
              {/* Circular gauge — larger for better readability */}
              <div className="shrink-0 relative">
                <svg width="104" height="104" viewBox="0 0 104 104" className="transform -rotate-90">
                  <circle cx="52" cy="52" r={gaugeRadius} fill="none" className="stroke-muted" strokeWidth="7" />
                  <motion.circle
                    cx="52" cy="52" r={gaugeRadius} fill="none"
                    stroke={hStroke} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={gaugeCircum} strokeDashoffset={gaugeOffset}
                    initial={{ strokeDashoffset: gaugeCircum }}
                    animate={{ strokeDashoffset: gaugeOffset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-extrabold ${hCol}`}>{analysis.healthScore}</span>
                  <span className="text-[10px] text-muted-foreground">/ 100</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`h-4 w-4 ${hCol}`} />
                  <span className={`text-sm font-semibold ${hCol}`}>{hLbl}</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div className={`h-full rounded-full ${hBg}`} initial={{ width: 0 }} animate={{ width: `${analysis.healthScore}%` }} transition={{ duration: 1, ease: "easeOut" }} />
                </div>
                <p className="text-[10px] text-muted-foreground">{categoryInfo.description}</p>
              </div>
            </div>
          </div>

          {/* ─── بطاقات الإحصائيات مع خلفيات متدرجة ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`rounded-xl p-3 text-center border ${catCardBg}`}>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><FileText className="h-4 w-4" /><span className="text-[10px]">الصفحات</span></div>
              <span className="text-sm font-bold block">{analysis.pageCount}</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={`rounded-xl p-3 text-center border ${catCardBg}`}>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><ImagePlus className="h-4 w-4" /><span className="text-[10px]">الصور</span></div>
              <span className="text-sm font-bold block">{analysis.imageCount}</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`rounded-xl p-3 text-center border ${catCardBg}`}>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><Layers className="h-4 w-4" /><span className="text-[10px]">مقاس الورق</span></div>
              <span className="text-sm font-bold block">{analysis.closestPaperSize || analysis.paperSize}</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={`rounded-xl p-3 text-center border ${catCardBg}`}>
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1"><Palette className="h-4 w-4" /><span className="text-[10px]">الألوان</span></div>
              <span className="text-sm font-bold block">{analysis.isColor ? "ملون" : "أبيض وأسود"}</span>
            </motion.div>
          </div>

          {/* ─── تقدير التكلفة والوقت ─── */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                <Monitor className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">التكلفة التقريبية</p>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{cost.min} – {cost.max} ريال</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl border bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">الوقت التقريبي</p>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{printTime}</p>
              </div>
            </motion.div>
          </div>

          {analysis.pageDimensionsMM && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex flex-col"><span className="text-muted-foreground">الأبعاد</span><span className="font-medium font-mono">{analysis.pageDimensionsMM.width}×{analysis.pageDimensionsMM.height} مم</span></div>
                <div className="flex flex-col"><span className="text-muted-foreground">الدقة</span><span className="font-medium">{analysis.estimatedDPI ? `${analysis.estimatedDPI} DPI` : "—"}</span></div>
                <div className="flex flex-col"><span className="text-muted-foreground">فئة الدقة</span><span className="font-medium">{analysis.dpiCategory || "—"}</span></div>
                <div className="flex flex-col"><span className="text-muted-foreground">الاتجاه</span><span className="font-medium">{analysis.orientation === "portrait" ? "عمودي" : "أفقي"}</span></div>
              </div>
            </motion.div>
          )}
          {analysis.insights.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="rounded-2xl border bg-gradient-to-br from-amber-50/60 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 p-4 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 mb-2"><Sparkles className="h-4 w-4 text-amber-500" /><span className="text-xs font-semibold">توصيات</span></div>
              <ul className="space-y-1.5">{analysis.insights.map((ins, i) => (<li key={i} className="flex items-start gap-2 text-xs"><Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" /><span>{ins}</span></li>))}</ul>
            </motion.div>
          )}
          <Button onClick={() => {
            // تعيين التجليد الافتراضي حسب التصنيف عند الدخول للمعاينة
            setActiveBinding(getDefaultBinding(fileCategory));
            setStep("preview");
          }} className="w-full h-12 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 font-bold text-sm gap-2">
            <Eye className="h-4 w-4" />متابعة للمعاينة<ArrowLeft className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {step === "preview" && storedName && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* ─── Breadcrumb ─── */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <button onClick={() => setStep("results")} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              نتائج التحليل
            </button>
            <ChevronLeft className="h-3 w-3" />
            <span className="font-medium text-foreground">المعاينة</span>
          </div>

          {/* ─── شريط الملخص العلوي ─── Summary bar ─── */}
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-gradient-to-l from-amber-50/60 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Image thumbnail in summary */}
              {imagePreviewUrl ? (
                <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 border-2 bg-gradient-to-br ${categoryInfo.borderGrad}`}>
                  <img src={imagePreviewUrl} alt="معاينة" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{file?.name}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <Badge className={`${categoryInfo.color} border-0 text-[9px] font-semibold gap-0.5`}>{categoryInfo.icon}{categoryInfo.label}</Badge>
                  <Badge variant="secondary" className="font-mono text-[9px]">{analysis.pageCount} صفحة</Badge>
                  <Badge variant="outline" className="text-[9px] text-muted-foreground">{analysis.closestPaperSize || analysis.paperSize}</Badge>
                  <Badge variant="outline" className="text-[9px] text-muted-foreground">{analysis.isColor ? "ملون" : "أبيض وأسود"}</Badge>
                  {fileCategory !== "image" && effectiveBinding !== "none" && (
                    <Badge variant="outline" className="text-[9px] text-muted-foreground">
                      <Layers className="h-2.5 w-2.5 ml-0.5" />{bindingLabel[effectiveBinding]}
                    </Badge>
                  )}
                </div>
              </div>
              {/* Download button */}
              <div className="flex items-center gap-1.5">
                <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 rounded-lg gap-1.5 text-xs shadow-sm"
                      disabled={isDownloading}
                      onClick={handleDownload}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      تنزيل
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs font-mono">
                    {downloadInfo ? (
                      <span>
                        {downloadInfo.warning
                          ? `${formatFileSize(downloadInfo.originalSize)} — تجاوز الحد`
                          : downloadInfo.originalSize > 5 * 1024 * 1024
                            ? `${formatFileSize(downloadInfo.originalSize)} ← ${formatFileSize(downloadInfo.compressedSize)}`
                            : formatFileSize(downloadInfo.originalSize)}
                      </span>
                    ) : (
                      <span>{file ? formatFileSize(file.size) : "—"}</span>
                    )}
                  </TooltipContent>
                </Tooltip>
                {downloadInfo && (
                  <Badge
                    variant="secondary"
                    className={`text-[9px] font-mono font-semibold ${
                      downloadInfo.warning
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
                        : downloadInfo.originalSize > 5 * 1024 * 1024
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
                    }`}
                  >
                    {downloadInfo.warning
                      ? formatFileSize(downloadInfo.originalSize)
                      : downloadInfo.originalSize > 5 * 1024 * 1024
                        ? `${formatFileSize(downloadInfo.originalSize)}←${formatFileSize(downloadInfo.compressedSize)}`
                        : formatFileSize(downloadInfo.originalSize)}
                  </Badge>
                )}
                </TooltipProvider>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/60 border shadow-sm">
            <button onClick={() => setPreviewMode("mockup")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${previewMode === "mockup" ? "bg-white dark:bg-card shadow-sm text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:text-foreground"}`}><Box className="h-4 w-4" /><span>معاينة 3D</span></button>
            <button onClick={() => setPreviewMode("precise")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${previewMode !== "mockup" ? "bg-white dark:bg-card shadow-sm text-amber-600 dark:text-amber-400" : "text-muted-foreground hover:text-foreground"}`}><Eye className="h-4 w-4" /><span>معاينة الصفحات</span></button>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              لوحة الإعدادات التفاعلية — مختلفة حسب التصنيف
             ═══════════════════════════════════════════════════════════ */}
          {previewMode === "mockup" && (
            <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
              <button onClick={() => setShow3DSettings(!show3DSettings)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Settings2 className="h-4 w-4 text-amber-500" />
                  <span>خيارات الطباعة والعرض</span>
                  <Badge className={`${categoryInfo.color} border-0 text-[10px] font-semibold gap-1`}>{categoryInfo.icon}{categoryInfo.label}</Badge>
                </div>
                <svg className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${show3DSettings ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <AnimatePresence>
                {show3DSettings && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-4 border-t">

                      {/* ═══🟢 مسار الصورة / صفحة واحدة ═══ */}
                      {fileCategory === "image" && (
                        <div className="pt-3 space-y-4">
                          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl px-3 py-2">
                            <ImageIcon className="h-4 w-4" />
                            <span className="font-medium">ورقة / صورة واحدة — التجليد غير مطلوب</span>
                          </div>

                          {/* ─── عدد النسخ ─── */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">عدد النسخ</p>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setCopies((c) => Math.max(1, c - 1))}
                                disabled={copies <= 1}
                                className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              ><Minus className="h-3.5 w-3.5" /></button>
                              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 min-w-[70px] justify-center">
                                <Hash className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{copies}</span>
                              </div>
                              <button
                                onClick={() => setCopies((c) => Math.min(99, c + 1))}
                                disabled={copies >= 99}
                                className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              ><Plus className="h-3.5 w-3.5" /></button>
                              {copies > 1 && (
                                <button onClick={() => setCopies(1)} className="text-[10px] text-muted-foreground hover:text-rose-500 transition-colors">إعادة تعيين</button>
                              )}
                            </div>
                          </div>

                          {/* ─── لون الطباعة ─── */}
                          <div className="flex items-center gap-4">
                            <p className="text-xs font-semibold text-muted-foreground">الطباعة:</p>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setPrintColor(true)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${printColor ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 border-2 border-emerald-400" : "border hover:bg-muted text-muted-foreground"}`}
                              ><Palette className="h-3 w-3" />ملون</button>
                              <button
                                onClick={() => setPrintColor(false)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${!printColor ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 border-2 border-emerald-400" : "border hover:bg-muted text-muted-foreground"}`}
                              >أبيض وأسود</button>
                            </div>
                          </div>

                          {/* نوع الورق */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">نوع الورق</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {([
                                { id: "normal" as const, label: "عادي", desc: "ورق قياسي" },
                                { id: "glossy" as const, label: "لامع", desc: "بريق عالي" },
                                { id: "matte" as const, label: "مات", desc: "غير لامع" },
                              ]).map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => setImagePaperType(p.id)}
                                  className={`flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl text-[10px] transition-all duration-200 ${
                                    imagePaperType === p.id
                                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-400"
                                      : "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <span className="font-medium">{p.label}</span>
                                  <span className="text-[9px] opacity-70">{p.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* ─── وزن الورق ─── */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">سمك الورق</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {([
                                { id: "80gsm" as const, label: "80 جرام", desc: "قياسي" },
                                { id: "100gsm" as const, label: "100 جرام", desc: "أسمك" },
                                { id: "120gsm" as const, label: "120 جرام", desc: "فاخر" },
                              ]).map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => setPaperWeight(p.id)}
                                  className={`flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl text-[10px] transition-all duration-200 ${
                                    paperWeight === p.id
                                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-400"
                                      : "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <span className="font-medium">{p.label}</span>
                                  <span className="text-[9px] opacity-70">{p.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* مقاس الطباعة */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">مقاس الطباعة</p>
                            <div className="flex flex-wrap gap-1.5">
                              {["A5", "A4", "A3", "Letter"].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setAnalysis((a) => ({ ...a, paperSize: s, closestPaperSize: s }))}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    (analysis.closestPaperSize || analysis.paperSize) === s
                                      ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-400"
                                      : "border hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >{s}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ═══🟡 مسار المستند القصير (2-10 صفحات) ═══ */}
                      {fileCategory === "short-doc" && (
                        <div className="pt-3 space-y-4">
                          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-xl px-3 py-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">مستند قصير ({analysis.pageCount} صفحة) — دبوس + تجويف بدل التجليد المتقدم</span>
                          </div>

                          {/* ─── عدد النسخ ─── */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">عدد النسخ</p>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setCopies((c) => Math.max(1, c - 1))}
                                disabled={copies <= 1}
                                className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              ><Minus className="h-3.5 w-3.5" /></button>
                              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 min-w-[70px] justify-center">
                                <Hash className="h-3.5 w-3.5 text-amber-500" />
                                <span className="text-lg font-bold tabular-nums text-amber-700 dark:text-amber-300">{copies}</span>
                              </div>
                              <button
                                onClick={() => setCopies((c) => Math.min(99, c + 1))}
                                disabled={copies >= 99}
                                className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              ><Plus className="h-3.5 w-3.5" /></button>
                              {copies > 1 && (
                                <button onClick={() => setCopies(1)} className="text-[10px] text-muted-foreground hover:text-rose-500 transition-colors">إعادة تعيين</button>
                              )}
                            </div>
                          </div>

                          {/* ─── لون الطباعة ─── */}
                          <div className="flex items-center gap-4">
                            <p className="text-xs font-semibold text-muted-foreground">الطباعة:</p>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setPrintColor(true)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${printColor ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 border-2 border-amber-400" : "border hover:bg-muted text-muted-foreground"}`}
                              ><Palette className="h-3 w-3" />ملون</button>
                              <button
                                onClick={() => setPrintColor(false)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${!printColor ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 border-2 border-amber-400" : "border hover:bg-muted text-muted-foreground"}`}
                              >أبيض وأسود</button>
                            </div>
                          </div>

                          {/* ─── وزن الورق ─── */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">سمك الورق</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {([
                                { id: "80gsm" as const, label: "80 جرام", desc: "قياسي" },
                                { id: "100gsm" as const, label: "100 جرام", desc: "أسمك" },
                                { id: "120gsm" as const, label: "120 جرام", desc: "فاخر" },
                              ]).map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => setPaperWeight(p.id)}
                                  className={`flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl text-[10px] transition-all duration-200 ${
                                    paperWeight === p.id
                                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-2 border-amber-400"
                                      : "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <span className="font-medium">{p.label}</span>
                                  <span className="text-[9px] opacity-70">{p.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* طباعة وجه/وجهين */}
                          <div className="flex items-center gap-6">
                            <button onClick={() => setDuplex(!duplex)} className="flex items-center gap-2 text-xs">
                              {duplex ? <ToggleRight className="h-5 w-5 text-amber-500" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                              <span className={duplex ? "text-amber-700 dark:text-amber-300 font-medium" : "text-muted-foreground"}>طباعة على وجهين</span>
                            </button>
                          </div>

                          {/* موضع الدبوس */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">وضع الدبوس</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {([
                                { id: "top-left" as const, label: "زاوية علوية", icon: <Pin className="h-4 w-4" /> },
                                { id: "top" as const, label: "أعلى الوسط", icon: <Bookmark className="h-4 w-4" /> },
                                { id: "left" as const, label: "يسار الوسط", icon: <Paperclip className="h-4 w-4" /> },
                              ]).map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => setStaplePosition(s.id)}
                                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-medium transition-all duration-200 ${
                                    staplePosition === s.id
                                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-2 border-amber-400"
                                      : "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {s.icon}
                                  <span>{s.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* التخريم (تجويف) */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">التخريم</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {([
                                { id: "none" as const, label: "بدون تخريم", icon: <CircleDot className="h-4 w-4" /> },
                                { id: "2hole" as const, label: "ثقبين", icon: <CircleDot className="h-4 w-4" /> },
                                { id: "4hole" as const, label: "4 ثقوب", icon: <CircleDot className="h-4 w-4" /> },
                              ]).map((h) => (
                                <button
                                  key={h.id}
                                  onClick={() => setHolePunch(h.id)}
                                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-medium transition-all duration-200 ${
                                    holePunch === h.id
                                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-2 border-amber-400"
                                      : "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {h.icon}
                                  <span>{h.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* مقاس الورق */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">مقاس الورق</p>
                            <div className="flex flex-wrap gap-1.5">
                              {["A5", "A4", "B5", "Letter"].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setAnalysis((a) => ({ ...a, paperSize: s, closestPaperSize: s }))}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    (analysis.closestPaperSize || analysis.paperSize) === s
                                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-2 border-amber-400"
                                      : "border hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >{s}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ═══🔵 مسار الكتاب / المذكرة (>10 صفحات) ═══ */}
                      {fileCategory === "book" && (
                        <div className="pt-3 space-y-4">
                          <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 rounded-xl px-3 py-2">
                            <BookOpen className="h-4 w-4" />
                            <span className="font-medium">كتاب / مذكرة ({analysis.pageCount} صفحة) — تجليد متقدم متاح</span>
                          </div>

                          {/* ─── عدد النسخ ─── */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">عدد النسخ</p>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setCopies((c) => Math.max(1, c - 1))}
                                disabled={copies <= 1}
                                className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              ><Minus className="h-3.5 w-3.5" /></button>
                              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 min-w-[70px] justify-center">
                                <Hash className="h-3.5 w-3.5 text-violet-500" />
                                <span className="text-lg font-bold tabular-nums text-violet-700 dark:text-violet-300">{copies}</span>
                              </div>
                              <button
                                onClick={() => setCopies((c) => Math.min(99, c + 1))}
                                disabled={copies >= 99}
                                className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                              ><Plus className="h-3.5 w-3.5" /></button>
                              {copies > 1 && (
                                <button onClick={() => setCopies(1)} className="text-[10px] text-muted-foreground hover:text-rose-500 transition-colors">إعادة تعيين</button>
                              )}
                            </div>
                          </div>

                          {/* ─── لون الطباعة ─── */}
                          <div className="flex items-center gap-4">
                            <p className="text-xs font-semibold text-muted-foreground">الطباعة:</p>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setPrintColor(true)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${printColor ? "bg-violet-100 dark:bg-violet-950/40 text-violet-700 border-2 border-violet-400" : "border hover:bg-muted text-muted-foreground"}`}
                              ><Palette className="h-3 w-3" />ملون</button>
                              <button
                                onClick={() => setPrintColor(false)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${!printColor ? "bg-violet-100 dark:bg-violet-950/40 text-violet-700 border-2 border-violet-400" : "border hover:bg-muted text-muted-foreground"}`}
                              >أبيض وأسود</button>
                            </div>
                          </div>

                          {/* ─── وزن الورق ─── */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">سمك الورق</p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {([
                                { id: "80gsm" as const, label: "80 جرام", desc: "قياسي" },
                                { id: "100gsm" as const, label: "100 جرام", desc: "أسمك" },
                                { id: "120gsm" as const, label: "120 جرام", desc: "فاخر" },
                              ]).map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => setPaperWeight(p.id)}
                                  className={`flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl text-[10px] transition-all duration-200 ${
                                    paperWeight === p.id
                                      ? "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-2 border-violet-400"
                                      : "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <span className="font-medium">{p.label}</span>
                                  <span className="text-[9px] opacity-70">{p.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* نوع التجليد */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">نوع التجليد</p>
                            <div className="grid grid-cols-4 gap-1.5">
                              {([
                                { id: "spiral" as BindingType, label: "سلك", icon: <Copy className="h-4 w-4" /> },
                                { id: "perfect" as BindingType, label: "كمالي", icon: <Bookmark className="h-4 w-4" /> },
                                { id: "staple" as BindingType, label: "دبوس", icon: <Pin className="h-4 w-4" /> },
                                { id: "none" as BindingType, label: "سائبة", icon: <Layers className="h-4 w-4" /> },
                              ]).map((b) => (
                                <button
                                  key={b.id}
                                  onClick={() => setActiveBinding(b.id)}
                                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[10px] font-medium transition-all duration-200 ${
                                    effectiveBinding === b.id
                                      ? "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-2 border-violet-400"
                                      : "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {b.icon}
                                  <span>{b.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* طباعة على وجهين + لون التجليد */}
                          <div className="flex flex-wrap items-center gap-6">
                            <button onClick={() => setDuplex(!duplex)} className="flex items-center gap-2 text-xs">
                              {duplex ? <ToggleRight className="h-5 w-5 text-amber-500" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                              <span className={duplex ? "text-amber-700 dark:text-amber-300 font-medium" : "text-muted-foreground"}>طباعة على وجهين</span>
                            </button>

                            {/* لون التجليد */}
                            {effectiveBinding !== "none" && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">لون التجليد:</span>
                                <div className="flex gap-1.5">
                                  {[
                                    { c: "", label: "تلقائي" },
                                    { c: "#1a1a2e", label: "كحلي" },
                                    { c: "#8b0000", label: "أحمر" },
                                    { c: "#1a5c2a", label: "أخضر" },
                                    { c: "#1a3a5c", label: "أزرق" },
                                    { c: "#5c4b1a", label: "بني" },
                                  ].map((clr) => (
                                    <button
                                      key={clr.c || "auto"}
                                      onClick={() => setSpineColor(clr.c)}
                                      title={clr.label}
                                      className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                                        spineColor === clr.c
                                          ? "border-violet-500 ring-2 ring-violet-300"
                                          : (clr.c ? `border-muted-foreground/20` : "border-muted-foreground/30 border-dashed")
                                      }`}
                                      style={clr.c ? { backgroundColor: clr.c } : { background: "repeating-conic-gradient(#d4d4d4 0% 25%, transparent 0% 50%) 50%/8px 8px" }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* مقاس الورق */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">مقاس الورق</p>
                            <div className="flex flex-wrap gap-1.5">
                              {["A5", "B5", "A4", "B4", "Letter"].map((s) => (
                                <button
                                  key={s}
                                  onClick={() => setAnalysis((a) => ({ ...a, paperSize: s, closestPaperSize: s }))}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    (analysis.closestPaperSize || analysis.paperSize) === s
                                      ? "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-2 border-violet-400"
                                      : "border hover:bg-muted text-muted-foreground hover:text-foreground"
                                  }`}
                                >{s}</button>
                              ))}
                            </div>
                          </div>
                          {/* غلاف بلاستيكي شفاف */}
                          <div className="flex items-center gap-6">
                            <button onClick={() => setClearCover(!clearCover)} className="flex items-center gap-2 text-xs">
                              {clearCover ? <ToggleRight className="h-5 w-5 text-violet-500" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                              <span className={clearCover ? "text-violet-700 dark:text-violet-300 font-medium" : "text-muted-foreground"}>غلاف بلاستيكي شفاف</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {previewMode !== "mockup" && (
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border bg-card shadow-sm">
              <button onClick={() => setShowOverlay(!showOverlay)} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:scale-105 shadow-sm ${showOverlay ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600" : "hover:bg-muted"}`} title="منطقة آمنة"><Grid3X3 className="h-3.5 w-3.5" /></button>
              <button onClick={() => setShowCropMarks(!showCropMarks)} className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:scale-105 shadow-sm ${showCropMarks ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600" : "hover:bg-muted"}`} title="علامات القص"><Ruler className="h-3.5 w-3.5" /></button>
              <div className="w-px h-5 bg-border mx-0.5" />
              <button onClick={() => setZoom((z: number) => Math.max(25, z - 25))} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:scale-105 shadow-sm hover:bg-muted" title="تصغير"><ZoomOut className="h-3.5 w-3.5" /></button>
              <span className="text-[11px] font-mono w-10 text-center tabular-nums">{zoom}%</span>
              <button onClick={() => setZoom((z: number) => Math.min(300, z + 25))} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:scale-105 shadow-sm hover:bg-muted" title="تكبير"><ZoomIn className="h-3.5 w-3.5" /></button>
              <button onClick={resetZoom} className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:scale-105 shadow-sm hover:bg-muted" title="ملاءمة"><Maximize2 className="h-3.5 w-3.5" /></button>
            </div>
          )}

          {/* ─── المعاينة ثلاثية الأبعاد ─── */}
          <AnimatePresence mode="wait">
            {previewMode === "mockup" && (
              <motion.div key="mockup" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                <div className="relative rounded-2xl border bg-muted/10 overflow-hidden shadow-sm" style={{ minHeight: 320 }}>
                  <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                        <Box className="h-8 w-8 text-amber-500 animate-pulse" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">جارٍ تحميل المعاينة ثلاثية الأبعاد...</p>
                        <p className="text-[10px] text-muted-foreground/70">يتم تحميل مشهد Three.js وملفات النسيج</p>
                      </div>
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  }>
                    <BookMockup3D
                      fileSource={storedName}
                      totalPages={analysis.pageCount}
                      paperSize={analysis.closestPaperSize || analysis.paperSize}
                      paperType={fileCategory === "image" ? imagePaperType : analysis.paperType}
                      binding={effectiveBinding}
                      color={analysis.color}
                      orientation={analysis.orientation}
                      duplex={duplex}
                      spineColor={spineColor || undefined}
                      category={fileCategory}
                      fileType={uploadedFileType}
                      clearCover={clearCover}
                      copies={copies}
                      pageWidthMM={workerResult?.pageDimensionsMM?.width || analysis.pageDimensionsMM?.width}
                      pageHeightMM={workerResult?.pageDimensionsMM?.height || analysis.pageDimensionsMM?.height}
                      paperWeight={paperWeight}
                      coverDataUrl={workerResult?.coverDataUrl || null}
                      backDataUrl={workerResult?.backDataUrl || null}
                      onBrowsePages={() => setBrowsePagesOpen(true)}
                    />
                  </Suspense>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ 2D High-Res Page Viewer Overlay ═══ */}
          {browsePagesOpen && uploadedFileType === "pdf" && file && (
            <PageViewer2D
              file={file}
              totalPages={totalPages}
              isOpen={browsePagesOpen}
              onClose={() => setBrowsePagesOpen(false)}
            />
          )}

          {/* ─── حاسبة التسعير اللحظي ─── Real-Time Pricing Panel ─── */}
          {step === "preview" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-l from-amber-100/60 to-orange-100/30 dark:from-amber-950/30 dark:to-orange-950/15">
                <Calculator className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-bold text-amber-800 dark:text-amber-200">التسعير اللحظي</span>
                <span className="text-[9px] text-amber-600/70 dark:text-amber-400/70 font-medium mr-auto">يتحدث تلقائياً</span>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="rounded-xl bg-background/80 p-3 border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">تكلفة الطباعة</p>
                    <p className="text-sm font-bold tabular-nums">{pricing.printCost.toFixed(2)} ر.س</p>
                    <p className="text-[9px] text-muted-foreground">{analysis.pageCount} صفحة × {copies} نسخة × {printColor ? "ملون" : "أبيض وأسود"}</p>
                  </div>
                  {effectiveBinding !== "none" && (
                    <div className="rounded-xl bg-background/80 p-3 border">
                      <p className="text-[10px] text-muted-foreground mb-0.5">التجليد</p>
                      <p className="text-sm font-bold tabular-nums">{pricing.bindCost.toFixed(2)} ر.س</p>
                      <p className="text-[9px] text-muted-foreground">{bindingLabel[effectiveBinding]} × {copies}</p>
                    </div>
                  )}
                  {pricing.coverCost > 0 && (
                    <div className="rounded-xl bg-background/80 p-3 border">
                      <p className="text-[10px] text-muted-foreground mb-0.5">غلاف بلاستيكي</p>
                      <p className="text-sm font-bold tabular-nums">{pricing.coverCost.toFixed(2)} ر.س</p>
                      <p className="text-[9px] text-muted-foreground">شفاف × {copies}</p>
                    </div>
                  )}
                  {pricing.duplexSurcharge > 0 && (
                    <div className="rounded-xl bg-background/80 p-3 border">
                      <p className="text-[10px] text-muted-foreground mb-0.5">رسوم الوجهين</p>
                      <p className="text-sm font-bold tabular-nums">{pricing.duplexSurcharge.toFixed(2)} ر.س</p>
                      <p className="text-[9px] text-muted-foreground">طباعة مزدوجة</p>
                    </div>
                  )}
                  <div className="rounded-xl bg-background/80 p-3 border">
                    <p className="text-[10px] text-muted-foreground mb-0.5">ضريبة القيمة المضافة (15%)</p>
                    <p className="text-sm font-bold tabular-nums">{pricing.vat.toFixed(2)} ر.س</p>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 p-4 text-white mt-2">
                  <div>
                    <p className="text-xs opacity-80">الإجمالي شامل الضريبة</p>
                    <p className="text-2xl font-extrabold tabular-nums">{pricing.total.toFixed(2)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-1.5 text-xs opacity-80">
                      <Layers className="h-3 w-3" />
                      <span>{copies} نسخة</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs opacity-80">
                      <FileText className="h-3 w-3" />
                      <span>{analysis.pageCount} صفحة</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs opacity-80">
                      <Clock className="h-3 w-3" />
                      <span>{estimateTime(analysis.pageCount * copies)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── معاينة الصفحات / الصور ─── */}
          <AnimatePresence mode="wait">
            {previewMode !== "mockup" && uploadedFileType === "image" && imagePreviewUrl && (
              <motion.div key="image" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
                <div className="rounded-2xl border bg-muted/10 overflow-hidden shadow-sm relative">
                  <div className="flex items-center justify-center p-4 bg-muted/5 min-h-[300px]">
                    <img
                      src={imagePreviewUrl}
                      alt="معاينة الصورة"
                      className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm"
                      style={{ filter: !printColor ? 'grayscale(100%)' : undefined }}
                    />
                  </div>
                  <div className="px-3 py-1.5 bg-muted/30 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />معاينة الصورة • {file?.name}</span>
                    <span>{analysis.fileSizeMB} ميغابايت</span>
                  </div>
                </div>
              </motion.div>
            )}
            {previewMode !== "mockup" && uploadedFileType === "pdf" && (
              <motion.div key="pdf" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} ref={previewContainerRef}>
                <div className="rounded-2xl border bg-muted/10 overflow-hidden shadow-sm relative">
                  <ProfessionalPdfViewer fileSource={storedName} currentPage={currentPage} onPageChange={setCurrentPage} viewMode={pdfViewMode} initialScale={zoom / 100} maxWidth={600} onTotalPages={(n) => setTotalPages(n)} />
                  {pdfViewMode === "single" && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-muted/20 border-t">
                      <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-all"><ChevronRight className="h-4 w-4" /></button>
                      <div className="flex items-center gap-1.5 text-xs"><span className="font-mono font-bold text-amber-600 dark:text-amber-400">{currentPage}</span><span className="text-muted-foreground">/</span><span className="font-mono">{totalPages}</span></div>
                      <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-all"><ChevronLeft className="h-4 w-4" /></button>
                    </div>
                  )}
                  <div className="px-3 py-1.5 bg-muted/30 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />معاينة طباعة دقيقة • {file?.name}</span>
                    <span>{analysis.pageDimensionsMM ? `${analysis.pageDimensionsMM.width}×${analysis.pageDimensionsMM.height} مم` : analysis.closestPaperSize || analysis.paperSize}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── طلب الطباعة ─── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Button
              onClick={() => { setOrderSubmitted(false); setOrderStep(1); setOrderDialogOpen(true); }}
              className="w-full h-13 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/35 transition-all duration-300 font-bold text-sm gap-2"
            >
              <Send className="h-4 w-4" />طلب طباعة — {pricing.total.toFixed(2)} ر.س
            </Button>
          </motion.div>

          {/* ─── أزرار التنقل المحسّنة ─── */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep("results")} className="flex-1 h-11 rounded-xl shadow-sm"><ArrowRight className="h-4 w-4 ml-1" />نتائج التحليل</Button>
            <Button variant="outline" onClick={resetAll} className="flex-1 h-11 rounded-xl shadow-sm"><RotateCcw className="h-4 w-4 ml-1" />رفع ملف جديد</Button>
          </div>
        </motion.div>
      )}
      {/* ═══════════════════════════════════════════════════════════
          نافذة طلب الطباعة — خطوتين
         ═══════════════════════════════════════════════════════════ */}
      <Dialog open={orderDialogOpen} onOpenChange={(open) => { if (!open) setOrderDialogOpen(false); }}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden" dir="rtl">
          {/* ─── رأس النافذة مع خطوات التقدم ─── */}
          <div className="bg-gradient-to-l from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/10 border-b px-6 pt-5 pb-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Printer className="h-5 w-5 text-amber-500" />
                {!orderSubmitted ? "إتمام طلب الطباعة" : "تم تأكيد الطلب"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {!orderSubmitted ? `الخطوة ${orderStep} من 2 — ${ORDER_STEPS[orderStep - 1].label}` : "طلبك قيد التحضير"}
              </DialogDescription>
            </DialogHeader>

            {/* Stepper dots */}
            {!orderSubmitted && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {ORDER_STEPS.map((s, i) => (
                  <div key={s.n} className="flex items-center gap-1.5">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300 ${
                      orderStep > s.n
                        ? "bg-emerald-500 text-white"
                        : orderStep === s.n
                          ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 scale-110"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {orderStep > s.n ? <Check className="h-3.5 w-3.5" /> : <span>{s.n}</span>}
                    </div>
                    {i < 1 && (
                      <div className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${orderStep > s.n ? "bg-emerald-400" : "bg-muted"}`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 max-h-[65vh] overflow-y-auto">
            <AnimatePresence mode="wait">
              {!orderSubmitted ? (
                <motion.div key={`step-${orderStep}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }} className="space-y-4">

                  {/* ═══════════════════════════════════
                      الخطوة ١: البيانات الشخصية
                     ═══════════════════════════════════ */}
                  {orderStep === 1 && (
                    <>
                      <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/15 border border-amber-200/40 dark:border-amber-800/20 p-3 space-y-1.5">
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">الملف</span><span className="font-medium truncate max-w-[200px]">{file?.name}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">الصفحات</span><span className="font-medium">{analysis.pageCount}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">النسخ</span><span className="font-medium">{copies}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">التجليد</span><span className="font-medium">{bindingLabel[effectiveBinding]}</span></div>
                      </div>
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><User className="h-3.5 w-3.5" />الاسم الكامل</label>
                          <Input placeholder="أدخل اسمك" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-11 rounded-xl text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />رقم الجوال</label>
                          <Input placeholder="05XXXXXXXX" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="h-11 rounded-xl text-sm" dir="ltr" type="tel" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ═══════════════════════════════════
                      الخطوة ٢: مراجعة وتأكيد
                     ═══════════════════════════════════ */}
                  {orderStep === 2 && (
                    <div className="space-y-3">
                      {/* ملخص الطباعة */}
                      <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1"><FileText className="h-3.5 w-3.5" />تفاصيل الطباعة</p>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">الملف</span><span className="font-medium truncate max-w-[180px]">{file?.name}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">الصفحات</span><span className="font-medium">{analysis.pageCount} صفحة</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">النسخ</span><span className="font-medium">{copies} نسخة</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">التجليد</span><span className="font-medium">{bindingLabel[effectiveBinding]}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">الطباعة</span><span className="font-medium">{printColor ? "ملون" : "أبيض وأسود"}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">الورق</span><span className="font-medium">{paperWeight}</span></div>
                      </div>

                      {/* بيانات العميل */}
                      <div className="rounded-xl border bg-muted/30 p-3 space-y-2">
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-1"><User className="h-3.5 w-3.5" />بياناتك</p>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">الاسم</span><span className="font-medium">{customerName}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">الجوال</span><span className="font-medium" dir="ltr">{customerPhone}</span></div>
                      </div>

                      {/* التسعير النهائي */}
                      <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/50 dark:border-amber-800/30 p-3.5 space-y-2">
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">طباعة + التجليد + الضريبة</span><span className="font-medium tabular-nums">{pricing.total.toFixed(2)} ر.س</span></div>
                        <div className="border-t border-amber-200/50 dark:border-amber-800/30 pt-2 flex justify-between text-sm font-extrabold">
                          <span>الإجمالي</span>
                          <span className="text-amber-600 dark:text-amber-400 tabular-nums">{pricing.total.toFixed(2)} ر.س</span>
                        </div>
                      </div>

                      {/* حماية */}
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border">
                        <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">سيتم حفظ طلبك وسيتم التواصل معك خلال دقائق.</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* ═══════════════════════════════════
                    شاشة النجاح
                   ═══════════════════════════════════ */
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </motion.div>
                  <div className="text-center space-y-1.5">
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">تم إرسال طلبك بنجاح!</p>
                    <p className="text-sm text-muted-foreground">سنتواصل معك على <span className="font-medium text-foreground" dir="ltr">{customerPhone}</span></p>
                  </div>
                  <Button onClick={() => { setOrderDialogOpen(false); resetAll(); }} className="w-full h-11 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm gap-2 shadow-lg shadow-amber-500/20">تم</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── أزرار التنقل السفلية ─── */}
          {!orderSubmitted && (
            <div className="flex items-center gap-3 px-6 py-4 border-t bg-muted/20">
              {orderStep > 1 ? (
                <Button variant="outline" onClick={() => setOrderStep(1)} className="h-10 rounded-xl gap-1.5 text-xs flex-1">
                  <ArrowRight className="h-3.5 w-3.5" />البيانات
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setOrderDialogOpen(false)} className="h-10 rounded-xl gap-1.5 text-xs text-muted-foreground flex-1">
                  <X className="h-3.5 w-3.5" />إلغاء
                </Button>
              )}
              {orderStep < 2 ? (
                <Button
                  onClick={() => {
                    if (!customerName.trim() || customerPhone.trim().length < 10) return;
                    setOrderStep(2);
                  }}
                  disabled={!customerName.trim() || customerPhone.trim().length < 10}
                  className="h-10 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20 flex-1 disabled:opacity-50 disabled:shadow-none"
                >
                  مراجعة الطلب<ArrowLeft className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    setIsSubmitting(true);
                    try {
                      await fetch("/api/c/orders", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          serviceType: "document",
                          fileName: file?.name,
                          fileType: uploadedFileType === "image" ? "PNG" : uploadedFileType === "document" ? "DOCX" : uploadedFileType === "design" ? "AI" : "PDF",
                          fileSize: file?.size,
                          fileData: storedName,
                          smartAnalysis: analysis,
                          options: {
                            pages: analysis.pageCount,
                            copies,
                            color: printColor ? "color" : "bw",
                            paperSize: analysis.closestPaperSize || "A4",
                            sides: duplex ? "duplex" : "simplex",
                            binding: effectiveBinding,
                            paperType: paperWeight,
                            printRange: "all",
                            clearCover,
                          },
                          customer: { name: customerName, phone: customerPhone },
                          delivery: { mode: "pickup" },
                        }),
                      });
                      setOrderSubmitted(true);
                    } catch {
                      /* silent */
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="h-10 rounded-xl bg-gradient-to-l from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-500/20 flex-1 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}تأكيد الطلب — {pricing.total.toFixed(2)} ر.س
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

function SpinLoader() {
  return <div className="flex flex-col items-center justify-center py-32 gap-4"><div className="w-12 h-12 rounded-full border-4 border-muted border-t-amber-500 animate-spin" /><p className="text-sm text-muted-foreground">جارٍ التحميل...</p></div>;
}
