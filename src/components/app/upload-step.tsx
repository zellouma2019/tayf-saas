"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Upload,
  FileText,
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  Zap,
  Palette,
  Target,
  Ruler,
  BookOpen,
  Search,
  Image as ImageIconLucide,
  ClipboardList,
  RefreshCw,
  Ratio,
  Type,
  Monitor,
  Copy,
  AlertTriangle,
  Info,
  Loader2,
  ImageIcon,
  File,
  FileSpreadsheet,
  Link,
  Camera,
  Smartphone,
  Timer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { RealFileAnalysis } from "@/lib/file-analyzer";
import type { ServiceType } from "@/lib/print-config";

/* ═══════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════ */

export type AnalysisPhase =
  | "idle"
  | "uploading"
  | "local-analysis"
  | "ai-analysis"
  | "done"
  | "error";

export interface UploadStepProps {
  fileName: string;
  fileType: string;
  fileSize: number;
  analysisPhase: AnalysisPhase;
  uploadProgress: number;
  analysis: RealFileAnalysis | null;
  analyzing: boolean;
  serviceType: ServiceType | null;
  errorMessage?: string;
  analysisTimings?: {
    upload: number | null;
    local: number | null;
    ai: number | null;
    total: number | null;
  };
  onFileSelected: (file: File) => void;
}

/* ═══════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════ */

const ACCEPTED_TYPES = [".pdf", ".docx", ".jpg", ".jpeg", ".png", ".webp"];

// ترجمة مفاتيح الخيارات للعرض
const OPTION_KEY_LABELS: Record<string, string> = {
  color: "نوع الطباعة",
  paperSize: "حجم الورق",
  sides: "الوجهين",
  paperType: "نوع الورق",
  printMethod: "طريقة الطباعة",
  colorProcessing: "معالجة الألوان",
  bleedCut: "القص والحواف",
  binding: "التجليد",
  photoSize: "حجم الصورة",
  dpiBoost: "ضبط الدقة",
  imageFit: "ملائمة الصورة",
  finish: "التشطيب",
  retouch: "تحسينات",
  bindingType: "نوع التجليد",
  coverColor: "لون الغلاف",
  coverPrint: "طباعة الغلاف",
  pageNumbering: "ترقيم الصفحات",
  extras: "إضافات",
  sorting: "ترتيب النسخ",
  cardType: "نوع البطاقة",
  lamination: "التغليف",
  posterSize: "حجم الملصق",
  material: "المادة",
};

const OPTION_VALUE_LABELS: Record<string, string> = {
  bw: "أبيض وأسود",
  color: "ملون",
  A4: "A4",
  A3: "A3",
  A5: "A5",
  Legal: "Legal",
  single: "وجه واحد",
  double: "وجهان",
  normal: "عادي",
  glossy: "لامع",
  matte: "مطفي",
  cardboard: "مقوّى",
  "cardboard-250": "مقوّى 250غ",
  "cardboard-300": "مقوّى 300غ",
  "cardboard-350": "مقوّى 350غ",
  pvc: "بلاستيك PVC",
  recycled: "مُعاد تدويره",
  premium: "فاخر برو",
  metallic: "معدني",
  digital: "رقمية",
  offset: "أوفست",
  "large-format": "طباعة كبيرة",
  "as-is": "كما هو",
  "force-bw": "تحويل أبيض/أسود",
  enhance: "تعزيز الألوان",
  "color-correct": "تصحيح ألوان احترافي",
  "auto-cut": "قص تلقائي",
  "margin-5": "هامش 5 مم",
  bleed: "بدون حواف",
  "safe-margin": "حواف آمنة",
  none: "بدون",
  staple: "تدبيس",
  spiral: "لولبي",
  glue: "غراء",
  "10x15": "10×15 سم",
  "13x18": "13×18 سم",
  "15x21": "15×21 سم",
  "20x30": "20×30 سم",
  auto: "تلقائي",
  "dpi-150": "150 DPI",
  "dpi-300": "300 DPI",
  "keep-ratio": "حفظ النسبة",
  fill: "ملء الصفحة",
  "white-bg": "خلفية بيضاء",
  "crop-fill": "اقتصاص وملء",
  borderless: "بلا إطار",
  border: "مع إطار",
  whiteframe: "إطار عريض",
  standard: "قياسي",
  foil: "ختم ذهبي/فضي",
  emboss: "نقش بارز",
  rounded: "حواف مدورة",
  "removebg": "إزالة الخلفية",
  restore: "ترميم الصور",
  "spiral-metal": "لولبي معدني",
  thermal: "حراري بغلاف",
  hardcover: "غلاف مقوّى فاخر",
  transparent: "شفاف",
  black: "أسود",
  blue: "أزرق",
  red: "أحمر",
  leather: "جلد صناعي",
  "bw-title": "عنوان أبيض وأسود",
  "color-title": "عنوان ملون",
  "full-design": "تصميم كامل",
  simple: "ترقيم بسيط",
  "with-header": "ترقيم مع عنوان",
  center: "ترقيم مركزي",
  tabs: "فواصم ملونة",
  lamination: "تغليف حراري",
  ribbon: "إشارة مرجعية",
  collated: "مرتبة",
  uncollated: "غير مرتبة",
  business: "بطاقة عمل",
  id: "بطاقة هوية",
  invitation: "دعوة",
  greeting: "بطاقة تهنئة",
  loyalty: "بطاقة ولاء",
  "glossy-lam": "تغليف لامع",
  "matte-lam": "تغليف مطفي",
  "soft-touch": "لمسة ناعمة",
  "spot-uv": "UV بارز",
  A2: "A2",
  A1: "A1",
  A0: "A0",
  custom: "مخصص",
  "photo-paper": "ورق صور",
  vinyl: "فينيل",
  canvas: "قماش",
  backlit: "إضاءة خلفية",
};

function translateOptionKeyDisplay(key: string): string {
  return OPTION_KEY_LABELS[key] || key;
}

function translateOptionValueDisplay(val: string): string {
  return OPTION_VALUE_LABELS[val] || val;
}
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

const FILE_TYPE_META: Record<string, { icon: typeof FileText; color: string; bg: string; label: string }> = {
  PDF: { icon: FileText, color: "text-red-500", bg: "bg-red-50 border-red-200", label: "PDF" },
  DOCX: { icon: FileSpreadsheet, color: "text-blue-500", bg: "bg-blue-50 border-blue-200", label: "DOCX" },
  JPG: { icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200", label: "JPG" },
  JPEG: { icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200", label: "JPEG" },
  PNG: { icon: ImageIcon, color: "text-violet-500", bg: "bg-violet-50 border-violet-200", label: "PNG" },
  WEBP: { icon: ImageIcon, color: "text-amber-500", bg: "bg-amber-50 border-amber-200", label: "WEBP" },
};

const PHASE_CONFIG: Record<
  AnalysisPhase,
  { label: string; icon: typeof Upload; description: string; estimatedSeconds: number }
> = {
  idle: { label: "بانتظار الملف", icon: Upload, description: "", estimatedSeconds: 0 },
  uploading: { label: "رفع الملف", icon: Upload, description: "جارٍ رفع الملف إلى الخادم الآمن...", estimatedSeconds: 1 },
  "local-analysis": { label: "التحليل المحلي", icon: Brain, description: "تحليل محتوى الملف الفعلي...", estimatedSeconds: 5 },
  "ai-analysis": { label: "التحليل الذكي", icon: Sparkles, description: "تحليل بالذكاء الاصطناعي...", estimatedSeconds: 20 },
  done: { label: "اكتمل", icon: CheckCircle2, description: "", estimatedSeconds: 0 },
  error: { label: "خطأ", icon: XCircle, description: "", estimatedSeconds: 0 },
};

/* ═══════════════════════════════════════════════════════
   Animation Variants
   ═══════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

/* ═══════════════════════════════════════════════════════
   Sub-Components: AnimatedCounter
   ═══════════════════════════════════════════════════════ */

function AnimatedCounter({
  value,
  duration = 1.2,
  suffix = "",
}: {
  value: number;
  duration?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = (now - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value, duration]);

  return <>{display.toLocaleString("en-US")}{suffix}</>;
}

/* ═══════════════════════════════════════════════════════
   Sub-Components: CircularGauge
   ═══════════════════════════════════════════════════════ */

function CircularGauge({
  value,
  max,
  size = 64,
  smSize,
  strokeWidth = 5,
  color,
  label,
  tooltipText,
}: {
  value: number;
  max: number;
  size?: number;
  smSize?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  tooltipText?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference - percentage * circumference;
  // Use CSS to make the gauge responsive: smaller on mobile, larger on desktop (smSize)
  const responsiveClass = smSize ? "w-14 h-14 sm:w-[72px] sm:h-[72px]" : "";

  const gauge = (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${responsiveClass}`} style={!smSize ? { width: size, height: size } : undefined}>
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/40"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs sm:text-sm font-bold" style={{ color }}>
            <AnimatedCounter value={value} />
          </span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );

  if (tooltipText) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative cursor-help">{gauge}</div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-center">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    );
  }

  return <div className="relative">{gauge}</div>;
}

/* ═══════════════════════════════════════════════════════
   Sub-Components: InfoChip
   ═══════════════════════════════════════════════════════ */

function InfoChip({
  icon,
  label,
  value,
  tooltipText,
  ltr = false,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tooltipText?: string;
  ltr?: boolean;
  colorClass?: string;
}) {
  const content = (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-2.5 bg-card border border-border rounded-xl px-3.5 py-2.5 hover:shadow-sm transition-shadow"
    >
      <span className={`shrink-0 ${colorClass || "text-amber-500"}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
        <div
          className={`text-xs font-semibold truncate leading-tight mt-0.5 ${ltr ? "dir-ltr" : ""}`}
          dir={ltr ? "ltr" : undefined}
        >
          {value}
        </div>
      </div>
      {tooltipText && (
        <Info className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
      )}
    </motion.div>
  );

  if (tooltipText) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

/* ═══════════════════════════════════════════════════════
   Sub-Components: Pill (enhanced)
   ═══════════════════════════════════════════════════════ */

function SuggestionPill({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60"
    >
      {icon}
      {label}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════ */

export default function UploadStep({
  fileName,
  fileType,
  fileSize,
  analysisPhase,
  uploadProgress,
  analysis,
  analyzing,
  serviceType,
  errorMessage,
  analysisTimings,
  onFileSelected,
}: UploadStepProps) {
  const isMobile = useIsMobile();
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const currentFileRef = useRef<File | null>(null);

  // مؤقت زمني — يبدأ مع أول مراحل نشطة
  const analysisStartRef = useRef<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    const isActive = analysisPhase === "uploading" || analysisPhase === "local-analysis" || analysisPhase === "ai-analysis";
    if (!isActive) {
      analysisStartRef.current = null;
      return undefined;
    }
    // بداية المؤقت عند أول مراحل نشطة (لم يسبق تحديث)
    if (analysisStartRef.current === null) {
      analysisStartRef.current = Date.now();
    }
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - (analysisStartRef.current || Date.now())) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [analysisPhase]);

  // ─── Validation helpers ───
  function validateFile(file: File): string | null {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ACCEPTED_TYPES.includes(`.${ext}`)) {
      return `صيغة الملف "${ext}" غير مدعومة. الصيغ المدعومة: ${ACCEPTED_TYPES.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `حجم الملف ${(file.size / (1024 * 1024)).toFixed(1)} ميغابايت يتجاوز الحد الأقصى (50 ميغابايت)`;
    }
    if (file.size === 0) {
      return "الملف فارغ — يرجى اختيار ملف آخر";
    }
    return null;
  }

  // ─── File processing ───
  function processFile(file: File) {
    const error = validateFile(file);
    if (error) {
      // We can't set error state here — let the parent handle it via toast
      // The parent's handleFile will handle validation too
    }
    currentFileRef.current = file;
    onFileSelected(file);
  }

  // ─── Drag & Drop handlers ───
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => c + 1);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => {
      const next = c - 1;
      if (next === 0) setIsDragOver(false);
      return next;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter(0);
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile],
  );

  // ─── Clipboard paste handler ───
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            // Create a named file from clipboard
            const namedFile = new File(
              [file],
              `لصق_الحافظة_${Date.now()}.${file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1] || "png"}`,
              { type: file.type },
            );
            processFile(namedFile);
          }
          return;
        }
      }
    }

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  // ─── Input change handler ───
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  // ─── Computed values ───
  const isProcessing = ["uploading", "local-analysis", "ai-analysis"].includes(analysisPhase);
  const isDone = analysisPhase === "done";
  const isError = analysisPhase === "error";
  const hasFile = !!fileName;
  const hasAnalysis = !!analysis;
  // normalize confidence: if >1 it's already 0-100 scale, otherwise 0-1
  const confidencePercent = analysis ? (analysis.confidence > 1 ? Math.round(analysis.confidence) : Math.round(analysis.confidence * 100)) : 0;

  const currentPhaseIndex = ["idle", "uploading", "local-analysis", "ai-analysis", "done"].indexOf(analysisPhase);
  const phases: AnalysisPhase[] = ["uploading", "local-analysis", "ai-analysis"];

  const fileMeta = FILE_TYPE_META[fileType] || FILE_TYPE_META["PDF"];
  const FileIcon = fileMeta.icon;

  return (
    <div className="space-y-5">
      {/* ─── Section Header ─── */}
      <div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-base font-semibold mb-1">ارفع ملفك هنا</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-amber-600" />
            نظام ذكي سيحلل ملفك فعلياً ويستخرج كل المعلومات الحقيقية
          </p>
        </motion.div>
      </div>

      {/* ─── Dropzone (hidden during processing) ─── */}
      {!isProcessing && (
      <motion.div
        ref={dropzoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        <motion.div
          animate={
            isDragOver
              ? { scale: 1.02, borderColor: "rgb(245 158 11)" }
              : { scale: 1, borderColor: "rgb(252 211 77)" }
          }
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed p-6 md:p-8 text-center
            transition-colors duration-200
            ${isDragOver ? "bg-amber-50 border-amber-400" : "bg-amber-50/40 border-amber-300 hover:bg-amber-50"}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          {/* Drag overlay glow */}
          <AnimatePresence>
            {isDragOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-2xl bg-amber-400/10 pointer-events-none"
                style={{
                  boxShadow: "inset 0 0 40px rgba(245, 158, 11, 0.15)",
                }}
              />
            )}
          </AnimatePresence>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleInputChange}
            accept={ACCEPTED_TYPES.join(",")}
            tabIndex={-1}
          />

          {/* Content */}
          <AnimatePresence mode="wait">
            {hasFile ? (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="relative z-10"
              >
                <motion.div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: isDone
                      ? "linear-gradient(135deg, #10b981, #34d399)"
                      : "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  }}
                  animate={isProcessing ? { rotate: [0, 5, -5, 0] } : {}}
                  transition={isProcessing ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
                >
                  <FileIcon className="h-7 w-7 text-white" />
                </motion.div>
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-800 break-all max-w-md mx-auto">
                  {fileName}
                </div>
                <div className="text-xs text-muted-foreground mt-1.5">
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      جارٍ المعالجة...
                    </span>
                  ) : isDone ? (
                    <span className="flex items-center justify-center gap-1.5 text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      اكتمل التحليل — انقر لتغيير الملف
                    </span>
                  ) : (
                    "انقر لتغيير الملف"
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="relative z-10"
              >
                <motion.div
                  className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  }}
                  animate={isDragOver ? { y: -4 } : { y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {isMobile ? (
                    <Camera className="h-7 w-7 text-white" />
                  ) : (
                    <Upload className="h-7 w-7 text-white" />
                  )}
                </motion.div>
                {isDragOver ? (
                  <div className="font-bold text-sm text-amber-700">
                    أفلت الملف هنا الآن
                  </div>
                ) : (
                  <>
                    <div className="font-semibold text-sm">
                      {isMobile
                        ? "اختر ملفاً من جهازك"
                        : "اسحب وأفلت ملفك هنا"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isMobile
                        ? "أو التقط صورة مباشرة"
                        : "أو انقر للاختيار من جهازك"}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
      )}

      {/* ─── URL / Text Input ─── */}
      {!hasFile && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Link className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="أدخل رابطاً لملف أو صورة هنا"
              dir="ltr"
              className="w-full h-11 pr-10 pl-4 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300 transition-all"
            />
            {urlInput.trim() && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUrlInput("");
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/60 mt-1.5 text-center">
            {isMobile
              ? "يمكنك لصق رابط مباشرة بالضغط مطولاً"
              : "يمكنك لصق رابط مباشرة باستخدام Ctrl+V"}
          </p>
        </motion.div>
      )}

      {/* ─── Device-Specific Quick Actions ─── */}
      {!hasFile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 xs:grid-cols-3 gap-2"
        >
          {/* File Picker */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-amber-200 transition-all active:scale-[0.97]"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              {isMobile ? (
                <Smartphone className="h-4.5 w-4.5 text-amber-600" />
              ) : (
                <File className="h-4.5 w-4.5 text-amber-600" />
              )}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground leading-tight text-center">
              {isMobile ? "اختر من المعرض" : "اختر ملف"}
            </span>
          </button>

          {/* Camera (mobile only) / Drag hint (desktop) */}
          {isMobile ? (
            <button
              type="button"
              onClick={() => {
                // Trigger camera by accepting image/* on a new input
                const cameraInput = document.createElement("input");
                cameraInput.type = "file";
                cameraInput.accept = "image/*";
                cameraInput.capture = "environment";
                cameraInput.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) processFile(file);
                };
                cameraInput.click();
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-amber-200 transition-all active:scale-[0.97]"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Camera className="h-4.5 w-4.5 text-emerald-600" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground leading-tight text-center">
                التقط صورة
              </span>
            </button>
          ) : (
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-border bg-muted/20">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Upload className="h-4.5 w-4.5 text-amber-500" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground/60 leading-tight text-center">
                اسحب ملف هنا
              </span>
            </div>
          )}

          {/* Paste / Clipboard */}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.readText().then((text) => {
                if (text) setUrlInput(text);
              }).catch(() => {
                // Clipboard API might be blocked — ignore
              });
            }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-amber-200 transition-all active:scale-[0.97]"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <Copy className="h-4.5 w-4.5 text-orange-500" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground leading-tight text-center">
              {isMobile ? "الصق من الحافظة" : "الصق (Ctrl+V)"}
            </span>
          </button>
        </motion.div>
      )}

      {/* ─── File Type Badges ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap items-center justify-center gap-2"
      >
        {Object.entries(FILE_TYPE_META).map(([type, meta]) => {
          const Icon = meta.icon;
          return (
            <span
              key={type}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 ${meta.bg} ${meta.color}`}
            >
              <Icon className="h-3 w-3" />
              {meta.label}
            </span>
          );
        })}
      </motion.div>

      {/* ─── Security note ─── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5"
      >
        <span className="text-emerald-500">&#128274;</span>
        ملفاتك آمنة — تُعالج محلياً ولا تُرفع لأي خادم خارجي
      </motion.p>

      {/* ═══════════════════════════════════════════════════
          Multi-Stage Progress
          ═══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border-2 border-amber-200 bg-white p-4 space-y-3">
              {/* Phase indicators */}
              <div className="flex items-center gap-3">
                {phases.map((phase, i) => {
                  const PhaseIcon = PHASE_CONFIG[phase].icon;
                  const isActive = phase === analysisPhase;
                  const isComplete = i < currentPhaseIndex - 1;
                  const isPending = i > currentPhaseIndex - 1;

                  return (
                    <div key={phase} className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col items-center gap-1 min-w-[56px]">
                        <motion.div
                          animate={
                            isActive
                              ? { scale: [1, 1.1, 1] }
                              : isComplete
                                ? { scale: 1 }
                                : { scale: 1 }
                          }
                          transition={
                            isActive
                              ? { repeat: Infinity, duration: 1.5 }
                              : {}
                          }
                          className={`
                            w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-300
                            ${isComplete ? "bg-emerald-100" : isActive ? "bg-amber-100" : "bg-muted"}
                          `}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                          ) : isActive ? (
                            <PhaseIcon className="h-4.5 w-4.5 text-amber-600 animate-pulse" />
                          ) : (
                            <PhaseIcon className="h-4.5 w-4.5 text-muted-foreground/40" />
                          )}
                        </motion.div>
                        <span
                          className={`text-[10px] font-medium text-center leading-tight ${
                            isActive
                              ? "text-amber-700"
                              : isComplete
                                ? "text-emerald-600"
                                : "text-muted-foreground/50"
                          }`}
                        >
                          {PHASE_CONFIG[phase].label}
                          {isComplete && phase === "uploading" && analysisTimings?.upload != null && (
                            <span className="block text-[9px] font-mono tabular-nums text-emerald-500 mt-0.5" dir="ltr">{(analysisTimings.upload / 1000).toFixed(1)}s</span>
                          )}
                          {isComplete && phase === "local-analysis" && analysisTimings?.local != null && (
                            <span className="block text-[9px] font-mono tabular-nums text-emerald-500 mt-0.5" dir="ltr">{(analysisTimings.local / 1000).toFixed(1)}s</span>
                          )}
                          {isComplete && phase === "ai-analysis" && analysisTimings?.ai != null && (
                            <span className="block text-[9px] font-mono tabular-nums text-emerald-500 mt-0.5" dir="ltr">{(analysisTimings.ai / 1000).toFixed(1)}s</span>
                          )}
                        </span>
                      </div>
                      {i < phases.length - 1 && (
                        <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden -mt-5">
                          <motion.div
                            className="h-full bg-emerald-400 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{
                              width: isComplete ? "100%" : isActive ? "50%" : "0%",
                            }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Current phase description + progress + timer */}
              {analysisPhase === "uploading" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-700 font-medium">
                      {PHASE_CONFIG.uploading.description}
                    </span>
                    <span className="text-amber-700 font-bold tabular-nums" dir="ltr">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-l from-amber-500 to-amber-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>📤 رفع إلى الخادم الآمن...</span>
                    <span dir="ltr">
                      {fileSize > 0 ? `${(fileSize / 1024).toFixed(0)} ك.ب` : ""}
                    </span>
                  </div>
                </div>
              )}

              {(analysisPhase === "local-analysis" || analysisPhase === "ai-analysis") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-700 font-medium">
                      {PHASE_CONFIG[analysisPhase].description}
                    </span>
                    {elapsedSec > 0 && (
                      <span className="text-amber-600 font-bold tabular-nums" dir="ltr">
                        {elapsedSec}ث
                      </span>
                    )}
                  </div>
                  <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-l from-amber-500 to-amber-400"
                      initial={{ width: 0 }}
                      animate={{
                        width: analysisPhase === "ai-analysis"
                          ? `${Math.min(100, (elapsedSec / (PHASE_CONFIG["ai-analysis"].estimatedSeconds || 20)) * 100)}%`
                          : "80%",
                      }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {analysisPhase === "local-analysis"
                        ? "🧠 فحص النصوص والصور والأبعاد..."
                        : "🤖 معالجة بالذكاء الاصطناعي..."}
                    </span>
                    {PHASE_CONFIG[analysisPhase].estimatedSeconds > 0 && elapsedSec > 0 && (
                      <span className="tabular-nums" dir="ltr">
                        ≈ {Math.max(0, PHASE_CONFIG[analysisPhase].estimatedSeconds - elapsedSec)}ث متبقّي
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Error State ─── */}
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-rose-700">تعذّر معالجة الملف</div>
              <div className="text-xs text-rose-600 mt-0.5">
                {errorMessage || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."}
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 text-xs font-medium text-rose-600 hover:text-rose-800 underline underline-offset-2"
            >
              إعادة المحاولة
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════
          Enhanced Analysis Panel
          ═══════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {hasAnalysis && analysis && serviceType && (
          <motion.div
            key="analysis-panel"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* ─── Preview Column (stacked on mobile, side-by-side on desktop) ─── */}
              {analysis.thumbnailUrl && (
                <motion.div
                  variants={scaleIn}
                  className="p-4 sm:p-5 border-b border-border bg-muted/20 flex flex-col items-center"
                >
                  <div className="flex items-center gap-1.5 mb-3 self-start">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      معاينة
                    </span>
                  </div>
                  <motion.div
                    className="relative rounded-xl overflow-hidden border border-border bg-white shadow-sm w-full max-w-xs mx-auto"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <img
                      src={analysis.thumbnailUrl}
                      alt={analysis.fileName || "معاينة الملف"}
                      className="w-full h-auto max-h-64 sm:max-h-72 object-contain"
                    />
                    {analysis.fileType?.toLowerCase().includes("pdf") && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/90 text-white text-[11px] font-bold backdrop-blur-sm">
                        <Monitor className="h-3 w-3" />
                        PDF
                      </span>
                    )}
                  </motion.div>
                  {analysis.textPreview && analysis.textPreview.length > 0 && (
                    <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed line-clamp-4 text-center max-w-xs mx-auto">
                      {analysis.textPreview.length > 150
                        ? analysis.textPreview.slice(0, 150) + "..."
                        : analysis.textPreview}
                    </p>
                  )}
                  {analysis.imageDimensions && (
                    <div className="mt-3 w-full text-center">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {analysis.imageDimensions.width} × {analysis.imageDimensions.height} بكسل
                      </span>
                      {analysis.imageDimensions.megapixels > 0 && (
                        <span className="text-[11px] text-muted-foreground mr-2">
                          ({analysis.imageDimensions.megapixels.toFixed(1)} ميجابكسل)
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── Gauges Row: DPI + Confidence (responsive) ─── */}
              <div className="px-4 sm:px-5 py-3 border-b border-border">
                {analysis.estimatedDPI != null && (
                  <motion.div variants={itemVariants} className="flex items-center justify-center gap-4 sm:gap-8">
                    <CircularGauge
                      value={analysis.estimatedDPI}
                      max={600}
                      size={56}
                      strokeWidth={5}
                      smSize={72}
                      color={
                        (analysis.dpiCategory === "جاهزة للطباعة"
                          ? "#10b981"
                          : analysis.dpiCategory === "عالية"
                            ? "#3b82f6"
                            : analysis.dpiCategory === "متوسطة"
                              ? "#f59e0b"
                              : "#ef4444")
                      }
                      label="DPI"
                      tooltipText="DPI (نقاط لكل إنش) — كلما زادت كانت جودة الطباعة أعلى. 300 DPI هو الحد الأدنى للطباعة الاحترافية."
                    />
                    <CircularGauge
                      value={confidencePercent}
                      max={100}
                      size={56}
                      strokeWidth={5}
                      smSize={72}
                      color="#f59e0b"
                      label="الثقة %"
                      tooltipText="نسبة ثقة الذكاء الاصطناعي في تحليل الملف واقتراحاته. كلما اقتربت من 100% كانت التوصيات أدق."
                    />
                  </motion.div>
                )}
              </div>

              {/* ─── Analysis Cards Grid: 1 col mobile, 2 cols desktop ─── */}
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ─── Card 1: معلومات الملف ─── */}
                  <motion.div variants={itemVariants} className="rounded-xl border bg-muted/20 p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                        <FileText className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <span className="text-xs font-bold text-foreground">معلومات الملف</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <InfoChip
                        icon={<FileText className="h-4 w-4" />}
                        label="نوع الملف"
                        value={analysis.fileType || "غير معروف"}
                        tooltipText="صيغة الملف المرفوع."
                      />
                      <InfoChip
                        icon={<Ruler className="h-4 w-4" />}
                        label="حجم الملف"
                        value={
                          analysis.fileSizeFormatted
                            ? analysis.fileSizeFormatted
                            : analysis.fileSizeMB >= 1
                              ? `${analysis.fileSizeMB.toFixed(2)} ميغابايت`
                              : `${analysis.fileSizeKB.toFixed(1)} كيلوبايت`
                        }
                        tooltipText="حجم الملف على القرص."
                      />
                      <InfoChip
                        icon={<BookOpen className="h-4 w-4" />}
                        label="عدد الصفحات"
                        value={<AnimatedCounter value={analysis.pageCount} suffix=" صفحة" />}
                        ltr
                        tooltipText="عدد صفحات الملف."
                      />
                      {analysis.fileNature && (
                        <InfoChip
                          icon={<Search className="h-4 w-4" />}
                          label="طبيعة الملف"
                          value={analysis.fileNature}
                          tooltipText="وصف تلقائي لمحتوى الملف."
                        />
                      )}
                      {analysis.pageDimensionsMM && (
                        <InfoChip
                          icon={<ImageIconLucide className="h-4 w-4" />}
                          label="أبعاد الصفحة"
                          value={`${analysis.pageDimensionsMM.width} × ${analysis.pageDimensionsMM.height} مم`}
                          ltr
                          tooltipText="الأبعاد الفعلية للصفحة."
                        />
                      )}
                      {analysis.closestPaperSize && (
                        <InfoChip
                          icon={<ClipboardList className="h-4 w-4" />}
                          label="أقرب مقاس"
                          value={analysis.closestPaperSize}
                          tooltipText="أقرب مقاس ورقي قياسي."
                          colorClass={
                            analysis.closestPaperSize !== "مخصص"
                              ? "text-emerald-500"
                              : "text-amber-500"
                          }
                        />
                      )}
                      {analysis.orientation && (
                        <InfoChip
                          icon={
                            analysis.orientation === "عمودي" ? (
                              <Ruler className="h-4 w-4" />
                            ) : analysis.orientation === "أفقي" ? (
                              <RefreshCw className="h-4 w-4 rotate-90" />
                            ) : (
                              <Ratio className="h-4 w-4" />
                            )
                          }
                          label="الاتجاه"
                          value={analysis.orientation}
                          tooltipText="اتجاه الصفحة."
                        />
                      )}
                      {analysis.aspectRatio && (
                        <InfoChip
                          icon={<Ratio className="h-4 w-4" />}
                          label="النسبة"
                          value={analysis.aspectRatio}
                          ltr
                          tooltipText="نسبة العرض للارتفاع."
                        />
                      )}
                      {analysis.detectedLanguage && (
                        <InfoChip
                          icon={<Type className="h-4 w-4" />}
                          label="اللغة"
                          value={analysis.detectedLanguage}
                          tooltipText="اللغة المكتشفة."
                        />
                      )}
                      {analysis.pdfAuthor && (
                        <InfoChip
                          icon={<File className="h-4 w-4" />}
                          label="المؤلف"
                          value={analysis.pdfAuthor}
                          tooltipText="اسم المؤلف."
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* ─── Card 2: تحليل الطباعة + اقتراحات ─── */}
                  <motion.div variants={itemVariants} className="rounded-xl border bg-emerald-50/30 p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <span className="text-xs font-bold text-foreground">تحليل الطباعة</span>
                    </div>

                    <div className="flex items-center justify-between mb-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-800">
                          {analysis.detectedServiceName}
                        </span>
                      </div>
                      <span className="text-amber-600 text-xs font-bold" dir="ltr">
                        <AnimatedCounter value={confidencePercent} suffix="%" />
                      </span>
                    </div>

                    {analysis.suggestedReasons && Object.keys(analysis.suggestedReasons).length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {Object.entries(analysis.suggestedReasons).map(([key, reason], idx) => {
                          const optValue = analysis.suggestedOptions?.[key];
                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.05 * idx, type: "spring", stiffness: 300, damping: 25 }}
                              className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 border border-emerald-100"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-emerald-800">
                                  {translateOptionKeyDisplay(key)}{optValue ? `: ${translateOptionValueDisplay(optValue)}` : ""}
                                </span>
                                {reason && (
                                  <p className="text-[11px] text-emerald-600/70 mt-0.5 leading-relaxed">← {reason}</p>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.suggestedColor && (
                          <SuggestionPill
                            icon={<Palette className="h-3 w-3" />}
                            label={analysis.suggestedColor === "bw" ? "أبيض وأسود" : analysis.suggestedColor === "color" ? "ملون" : analysis.suggestedColor}
                          />
                        )}
                        {analysis.suggestedPaperSize && (
                          <SuggestionPill
                            icon={<FileText className="h-3 w-3" />}
                            label={analysis.suggestedPaperSize}
                          />
                        )}
                        {analysis.suggestedPaperType && (
                          <SuggestionPill
                            icon={<Type className="h-3 w-3" />}
                            label={analysis.suggestedPaperType}
                          />
                        )}
                        {analysis.suggestedBinding && analysis.suggestedBinding !== "none" && (
                          <SuggestionPill
                            icon={<BookOpen className="h-3 w-3" />}
                            label={analysis.suggestedBinding}
                          />
                        )}
                      </div>
                    )}

                    {/* جودة الطباعة */}
                    <div className="mt-3 pt-3 border-t border-emerald-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Target className="h-3 w-3 text-emerald-600" />
                        <span className="text-[11px] font-bold text-emerald-700">جودة الطباعة</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {analysis.estimatedDPI != null && (
                          <InfoChip
                            icon={<Target className="h-4 w-4" />}
                            label="الدقة"
                            value={
                              <span className="flex items-center gap-1">
                                <AnimatedCounter value={analysis.estimatedDPI} suffix=" DPI" />
                                {analysis.dpiCategory && (
                                  <span
                                    className={`text-[9px] px-1 py-0.5 rounded-full font-medium border ${
                                      analysis.dpiCategory === "جاهزة للطباعة"
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        : analysis.dpiCategory === "عالية"
                                          ? "bg-amber-50 text-amber-600 border-amber-200"
                                          : analysis.dpiCategory === "متوسطة"
                                            ? "bg-amber-50 text-amber-600 border-amber-200"
                                            : "bg-rose-50 text-rose-600 border-rose-200"
                                    }`}
                                  >
                                    {analysis.dpiCategory}
                                  </span>
                                )}
                              </span>
                            }
                            ltr
                            tooltipText="دقة الملف."
                          />
                        )}
                        {analysis.colorSpace && (
                          <InfoChip
                            icon={<Palette className="h-4 w-4" />}
                            label="المساحة اللونية"
                            value={analysis.colorSpace}
                            tooltipText="نظام الألوان."
                          />
                        )}
                        <InfoChip
                          icon={
                            analysis.hasText ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground/40" />
                            )
                          }
                          label="نصوص"
                          value={analysis.hasText ? "نعم" : "لا"}
                          colorClass={analysis.hasText ? "text-emerald-500" : "text-muted-foreground/40"}
                        />
                        <InfoChip
                          icon={
                            analysis.hasImages ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground/40" />
                            )
                          }
                          label="صور"
                          value={analysis.hasImages ? "نعم" : "لا"}
                          colorClass={analysis.hasImages ? "text-emerald-500" : "text-muted-foreground/40"}
                        />
                      </div>

                      {analysis.dominantColors && analysis.dominantColors.length > 0 && (
                        <motion.div
                          variants={itemVariants}
                          className="flex items-center gap-2 mt-2 p-2 bg-white/50 rounded-lg border border-emerald-100"
                        >
                          <Palette className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="text-[11px] text-muted-foreground shrink-0">ألوان</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {analysis.dominantColors.map((color, i) => (
                              <Tooltip key={i}>
                                <TooltipTrigger asChild>
                                  <motion.span
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 400 }}
                                    className="inline-block h-4.5 w-4.5 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform"
                                    style={{ backgroundColor: color }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <span className="font-mono text-xs">{color}</span>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* ─── Insights Card (full width) ─── */}
                {analysis.insights && analysis.insights.length > 0 && (
                  <motion.div variants={itemVariants} className="mt-4 rounded-xl border bg-amber-50/30 p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Zap className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <span className="text-xs font-bold text-foreground">ملاحظات ذكية</span>
                    </div>
                    <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                      {analysis.insights.slice(0, 5).map((insight, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                          className="flex items-start gap-2 text-xs"
                        >
                          <span className="mt-0.5 shrink-0 text-amber-400">
                            <Zap className="h-3 w-3" />
                          </span>
                          <span className="text-muted-foreground leading-relaxed">{insight}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>

              {/* ─── Timing Bar ─── */}
              {analysisTimings && (analysisTimings.upload != null || analysisTimings.local != null || analysisTimings.ai != null) && (
                <div className="border-t border-border bg-muted/30 px-4 sm:px-5 py-2.5">
                  <div className="flex items-center justify-center gap-3 sm:gap-5 text-[11px] sm:text-xs text-muted-foreground flex-wrap">
                    {analysisTimings.upload != null && (
                      <span className="flex items-center gap-1">
                        <Upload className="h-3 w-3 text-sky-400" />
                        <span className="font-medium text-sky-600">رفع</span>
                        <span className="font-mono tabular-nums">{(analysisTimings.upload / 1000).toFixed(1)}s</span>
                      </span>
                    )}
                    {analysisTimings.local != null && (
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3 w-3 text-orange-400" />
                        <span className="font-medium text-orange-600">تحليل محلي</span>
                        <span className="font-mono tabular-nums">{(analysisTimings.local / 1000).toFixed(1)}s</span>
                      </span>
                    )}
                    {analysisTimings.ai != null && (
                      <span className="flex items-center gap-1">
                        <Brain className="h-3 w-3 text-amber-400" />
                        <span className="font-medium text-amber-600">تحليل ذكي</span>
                        <span className="font-mono tabular-nums">{(analysisTimings.ai / 1000).toFixed(1)}s</span>
                      </span>
                    )}
                    {analysisTimings.total != null && (
                      <>
                        <span className="w-px h-3.5 bg-border" />
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3 text-emerald-400" />
                          <span className="font-semibold text-emerald-700">المجموع</span>
                          <span className="font-mono tabular-nums font-bold text-emerald-700">{(analysisTimings.total / 1000).toFixed(1)}s</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Empty State (before upload) ─── */}
      <AnimatePresence>
        {!hasAnalysis && !analyzing && analysisPhase === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border-2 border-dashed border-amber-200/60 bg-amber-50/20 p-6 text-center"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="w-14 h-14 mx-auto rounded-2xl bg-amber-100/60 flex items-center justify-center mb-3"
            >
              <Brain className="h-7 w-7 text-amber-500" />
            </motion.div>
            <div className="font-bold text-sm text-amber-800 mb-1">
              التحليل الذكي ينتظر ملفك
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              ارفع ملفك أعلاه وسيقوم النظام بتحليله تلقائياً واقتراح أفضل خيارات الطباعة
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}