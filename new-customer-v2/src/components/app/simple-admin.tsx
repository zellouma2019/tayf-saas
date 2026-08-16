"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, CheckCircle2, PackageCheck, RefreshCw, ShieldCheck, Clock, FileText, Printer, ImageIcon,
  AlertCircle, Loader2, Copy, Layers, Palette, FileType, BookOpen, Scissors, Sparkles, Phone, User,
  DollarSign, Info, ChevronRight, Box, ArrowRight, Eye, X, Search, Store, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BindingType, FileCategory } from "@/components/app/book-mockup-3d";
import { processPdfInWorker, type PdfWorkerResult } from "@/lib/pdf-worker-bridge";
import { AdminConfigPanel } from "@/components/app/admin-config-panel";

const BookMockup3D = dynamic(
  () => import("@/components/app/book-mockup-3d").then((m) => ({ default: m.BookMockup3D })),
  { ssr: false }
);

/* ═══════════════════════════════════════════════════════════════════ */
/*  Types                                                            */
/* ═══════════════════════════════════════════════════════════════════ */

interface SmartAnalysis {
  detectedService?: string;
  detectedServiceName?: string;
  fileNature?: string;
  pageCount?: number;
  confidence?: number;
  insights?: string[];
  paperSize?: string;
  paperType?: string;
  color?: string;
  orientation?: string;
  binding?: string;
  pageDimensionsMM?: { width: number; height: number };
  closestPaperSize?: string;
  isPortrait?: boolean;
  healthScore?: number;
  [key: string]: unknown;
}

interface RenderCoverResult {
  type: "image" | "pdf";
  coverDataUrl: string | null;
  backDataUrl: string | null;
  numPages?: number;
  pageDimensionsMM?: { width: number; height: number };
  closestPaperSize?: string;
  isPortrait?: boolean;
  aspectRatio?: number;
}

interface Order {
  id: string;
  reference: string;
  serviceType: string;
  serviceName: string;
  customer: { name: string; phone: string; whatsapp?: string };
  options: {
    pages: number;
    copies: number;
    color?: string;
    paperSize?: string;
    sides?: string;
    binding?: string;
    paperType?: string;
    printRange?: string;
    pageRange?: string;
    totalPages?: number;
    notes?: string;
  };
  pricing: {
    perPage?: number;
    pagesCost?: number;
    copiesCost?: number;
    sidesSaving?: number;
    deliveryCost?: number;
    discount?: number;
    total?: number;
    breakdown?: { label: string; amount: number }[];
  };
  status: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  filePreview: string | null;
  smartAnalysis: SmartAnalysis | null;
  fileData: string | null;
  createdAt: string;
  total: number;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Constants & Helpers                                               */
/* ═══════════════════════════════════════════════════════════════════ */

const ADMIN_CODE = "2514";
const REFRESH_INTERVAL = 30_000;

const TABS = [
  { key: "pending", label: "قيد الانتظار", empty: "لا توجد طلبات قيد الانتظار" },
  { key: "printing", label: "قيد الطباعة", empty: "لا توجد طلبات قيد الطباعة" },
  { key: "ready", label: "جاهز للتسليم", empty: "لا توجد طلبات جاهزة" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "قيد الانتظار", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800", icon: Clock },
  printing: { label: "قيد الطباعة", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800", icon: Printer },
  ready: { label: "جاهز للتسليم", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800", icon: PackageCheck },
  delivered: { label: "تم التسليم", color: "text-zinc-500 dark:text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700", icon: CheckCircle2 },
};

const BINDING_LABELS: Record<string, string> = {
  none: "بدون تجليد", perfect: "تجليد كامل", spiral: "تجليد حلزوني", staple: "دباسة", brochure: "كتيب مطوي",
};
const COLOR_LABELS: Record<string, string> = { color: "ملون", bw: "أبيض وأسود", gray: "تدرج رمادي" };
const SIDES_LABELS: Record<string, string> = { simplex: "وجه واحد", duplex: "وجهين" };
const PAPER_TYPE_LABELS: Record<string, string> = {
  regular: "ورق عادي", premium: "ورق فاخر", glossy: "ورق لامع", matte: "ورق مطفي",
  thick: "ورق سميك", photo: "ورق صور", recycled: "ورق معاد تدويره",
  normal: "ورق عادي (80gsm)", "80gsm": "ورق عادي (80gsm)",
  "100gsm": "ورق فاخر (100gsm)", "120gsm": "ورق سميك (120gsm)",
};

function timeAgo(dateStr: string): string {
  const d = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${Math.floor(h / 24)} يوم`;
}

function formatFileSize(b: number | null): string {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function isImageType(ft: string | null): boolean {
  if (!ft) return false;
  return ["PNG", "JPG", "JPEG", "WEBP", "GIF"].includes(ft.toUpperCase());
}

function getCat(o: Order): FileCategory {
  const n = o.smartAnalysis?.fileNature || "";
  const p = o.options.pages || 1;
  if ((o.fileType || "").toUpperCase() === "PDF" && p > 10) return "book";
  if ((o.fileType || "").toUpperCase() === "PDF" && p > 3) return "short-doc";
  if (isImageType(o.fileType)) return "image";
  if (n.includes("كتاب") || n.includes("book")) return "book";
  if (n.includes("صور") || n.includes("صورة")) return "image";
  return p > 5 ? "book" : "short-doc";
}

function getBind(o: Order): BindingType {
  const b = o.options.binding || "none";
  if (["spiral", "perfect", "brochure", "staple", "none"].includes(b)) return b as BindingType;
  return "none";
}

function getConfidence(val: number | undefined | null): string {
  if (val == null) return "—";
  return val > 1 ? `${val}%` : `${Math.round(val * 100)}%`;
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Status Badge                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Ic = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.color}`}>
      <Ic className="h-3 w-3" />{c.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Spin Loader                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

function SpinLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
      <div className="flex gap-1.5">{[0, 1, 2].map(i => (
        <div key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}</div>
      <p className="text-[10px] text-muted-foreground">جارٍ التحميل...</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Admin Login                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [ld, setLd] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLd(true);
    await new Promise(r => setTimeout(r, 400));
    if (code === ADMIN_CODE) onSuccess();
    else setErr("رمز غير صحيح");
    setLd(false);
  };
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <form onSubmit={submit} className="w-full max-w-xs text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 flex items-center justify-center shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30">
          <ShieldCheck className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-bold">الدخول للإدارة</h3>
          <p className="text-sm text-muted-foreground">أدخل رمز الإدارة للمتابعة</p>
        </div>
        <div className="space-y-2">
          <Input type="password" placeholder="رمز الإدارة" value={code} onChange={e => setCode(e.target.value)} className="text-center text-lg tracking-[0.3em]" autoFocus />
          {err && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 flex items-center justify-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{err}</motion.p>}
        </div>
        <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11" disabled={ld || !code}>{ld ? <Loader2 className="h-4 w-4 animate-spin" /> : "دخول"}</Button>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  3D Book Preview (same as customer wizard)                        */
/* ═══════════════════════════════════════════════════════════════════ */

function Admin3DPreview({ order }: { order: Order }) {
  const [data, setData] = useState<RenderCoverResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!order.fileData) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        // For images: use server API for fast base64
        if ((order.fileType || "").toUpperCase() !== "PDF") {
          const res = await fetch(`/api/orders/${order.id}/render-cover`);
          if (!res.ok) throw new Error("فشل تحميل المعاينة");
          const d: RenderCoverResult = await res.json();
          if (!cancelled) { setData(d); setLoading(false); }
          return;
        }
        // For PDFs: use server-side render-cover for reliability
        const res = await fetch(`/api/orders/${order.id}/render-cover`);
        if (!res.ok) throw new Error("فشل تحميل المعاينة");
        const d: RenderCoverResult = await res.json();
        if (!cancelled) { setData(d); setLoading(false); }
      } catch (e) {
        if (!cancelled) { setError((e as Error).message); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [order.id, order.fileData, order.fileType]);

  const sa = order.smartAnalysis;
  const category = getCat(order);
  const binding = getBind(order);
  const fileSource = order.fileData || "";
  const totalPages = sa?.pageCount || order.options.pages || 1;
  const paperSize = order.options.paperSize || sa?.closestPaperSize || sa?.paperSize || "A4";
  const paperType = order.options.paperType || sa?.paperType || "normal";
  const color = order.options.color || sa?.color || "bw";
  const orientation = sa?.orientation || (sa?.isPortrait ? "portrait" : "landscape");
  const duplex = order.options.sides === "duplex";
  const copies = order.options.copies || 1;
  const pageWidthMM = data?.pageDimensionsMM?.width || sa?.pageDimensionsMM?.width;
  const pageHeightMM = data?.pageDimensionsMM?.height || sa?.pageDimensionsMM?.height;
  const fileType = order.fileType || "PDF";

  if (loading) {
    return (
      <div className="rounded-xl border bg-muted/10 overflow-hidden flex flex-col items-center justify-center min-h-[280px] sm:min-h-[320px] gap-3">
        <div className="flex gap-1.5">{[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}</div>
        <p className="text-xs text-muted-foreground">جارٍ تحميل المعاينة ثلاثية الأبعاد...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border bg-muted/10 overflow-hidden flex flex-col items-center justify-center min-h-[280px] sm:min-h-[320px] gap-3 text-center p-6">
        <Box className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground font-medium">تعذر تحميل المعاينة</p>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-gradient-to-b from-stone-100 to-stone-200 dark:from-stone-900 dark:to-stone-950">
      <Suspense fallback={<SpinLoader />}>
        <BookMockup3D
          fileSource={fileSource}
          totalPages={totalPages}
          paperSize={paperSize}
          paperType={paperType}
          binding={binding}
          color={color}
          orientation={orientation}
          duplex={duplex}
          category={category}
          fileType={fileType}
          copies={copies}
          pageWidthMM={pageWidthMM}
          pageHeightMM={pageHeightMM}
          coverDataUrl={data.coverDataUrl}
          backDataUrl={data.backDataUrl}
        />
      </Suspense>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Order Detail Panel (Right Side)                                   */
/* ═══════════════════════════════════════════════════════════════════ */

function OrderDetailPanel({ order, onStatusChange, isUpdating }: {
  order: Order;
  onStatusChange: (id: string, s: string) => void;
  isUpdating: boolean;
}) {
  const opts = order.options;
  const sa = order.smartAnalysis;

  const specs = [
    { icon: <Layers className="h-4 w-4" />, label: "حجم الورق", value: opts.paperSize || "—" },
    { icon: <FileType className="h-4 w-4" />, label: "نوع الورق", value: opts.paperType ? (PAPER_TYPE_LABELS[opts.paperType] || opts.paperType) : "عادي" },
    { icon: <Palette className="h-4 w-4" />, label: "اللون", value: opts.color ? (COLOR_LABELS[opts.color] || opts.color) : "—" },
    { icon: <Copy className="h-4 w-4" />, label: "الوجهين", value: opts.sides ? (SIDES_LABELS[opts.sides] || opts.sides) : "—" },
    { icon: <BookOpen className="h-4 w-4" />, label: "التجليد", value: (opts.binding && opts.binding !== "none") ? (BINDING_LABELS[opts.binding] || opts.binding) : "بدون" },
    { icon: <Layers className="h-4 w-4" />, label: "عدد الصفحات", value: `${opts.pages || 1} صفحة` },
    { icon: <Copy className="h-4 w-4" />, label: "عدد النسخ", value: `${opts.copies || 1} نسخة` },
    { icon: <Scissors className="h-4 w-4" />, label: "نطاق الطباعة", value: opts.printRange === "custom" && opts.pageRange ? `صفحات ${opts.pageRange}` : "الكل" },
  ];

  const actionBtn = (() => {
    if (order.status === "pending") return { label: "بدء التنفيذ", next: "printing", icon: <Play className="h-4 w-4" />, cls: "bg-blue-600 hover:bg-blue-700" };
    if (order.status === "printing") return { label: "جاهز للتسليم", next: "ready", icon: <PackageCheck className="h-4 w-4" />, cls: "bg-emerald-600 hover:bg-emerald-700" };
    if (order.status === "ready") return { label: "تم التسليم", next: "delivered", icon: <CheckCircle2 className="h-4 w-4" />, cls: "bg-zinc-600 hover:bg-zinc-700" };
    return null;
  })();

  return (
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-5 space-y-4">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">{order.reference}</span>
            <StatusBadge status={order.status} />
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(order.createdAt)}</span>
        </div>

        {/* ─── Service & File ─── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
            <Printer className="h-3 w-3 ml-1" />{order.serviceName || order.serviceType}
          </Badge>
          {order.fileSize && <span className="text-xs text-muted-foreground">{formatFileSize(order.fileSize)}</span>}
          {order.fileName && (
            <span className="text-xs text-muted-foreground truncate max-w-[180px]" title={order.fileName}>
              {isImageType(order.fileType) ? <ImageIcon className="h-3 w-3 inline ml-0.5" /> : <FileText className="h-3 w-3 inline ml-0.5" />}
              {order.fileName}
            </span>
          )}
        </div>

        {/* ─── 3D Preview ─── */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2.5">
            <Box className="h-4 w-4 text-amber-500" />المعاينة ثلاثية الأبعاد
          </h4>
          <Admin3DPreview order={order} />
        </div>

        {/* ─── Print Specifications ─── */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2.5">
            <Printer className="h-4 w-4 text-amber-500" />مواصفات الطباعة
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {specs.map(s => (
              <div key={s.label} className="rounded-lg border bg-card p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">{s.icon}<span className="text-[11px]">{s.label}</span></div>
                <p className="text-sm font-semibold truncate">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Customer Info ─── */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2.5">
            <User className="h-4 w-4 text-amber-500" />بيانات العميل
          </h4>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{order.customer.name || "—"}</p>
              {order.customer.phone && (
                <a href={`tel:${order.customer.phone}`} className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline">
                  <Phone className="h-3 w-3" />{order.customer.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ─── AI Analysis ─── */}
        {sa && (sa.fileNature || sa.insights?.length || sa.confidence) && (
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2.5">
              <Sparkles className="h-4 w-4 text-amber-500" />تحليل الذكاء الاصطناعي
            </h4>
            <div className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {sa.fileNature && (
                  <Badge variant="secondary" className="text-xs">{sa.fileNature}</Badge>
                )}
                {sa.confidence != null && (
                  <span className="text-xs text-muted-foreground">الثقة: <strong>{getConfidence(sa.confidence)}</strong></span>
                )}
              </div>
              {sa.insights && sa.insights.length > 0 && (
                <ul className="space-y-1">
                  {sa.insights.map((ins, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <Info className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                      <span>{ins}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ─── Pricing ─── */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2.5">
            <DollarSign className="h-4 w-4 text-amber-500" />التسعير
          </h4>
          <div className="rounded-lg border bg-card p-3 space-y-1.5">
            {order.pricing.breakdown?.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">{item.amount.toFixed(2)} ر.س</span>
              </div>
            ))}
            {order.pricing.discount != null && order.pricing.discount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                <span>الخصم</span>
                <span className="font-medium tabular-nums">-{order.pricing.discount.toFixed(2)} ر.س</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex items-center justify-between text-sm font-bold">
              <span>الإجمالي</span>
              <span className="text-amber-600 dark:text-amber-400 tabular-nums">{(order.total ?? order.pricing.total ?? 0).toFixed(2)} ر.س</span>
            </div>
          </div>
        </div>

        {/* ─── Action Button ─── */}
        {actionBtn && (
          <Button
            className={`w-full text-white h-11 ${actionBtn.cls}`}
            disabled={isUpdating}
            onClick={() => onStatusChange(order.id, actionBtn!.next)}
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{actionBtn.icon}{actionBtn.label}</>}
          </Button>
        )}

        {/* ─── Notes ─── */}
        {opts.notes && (
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-1.5">
              <FileText className="h-4 w-4 text-amber-500" />ملاحظات العميل
            </h4>
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">{opts.notes}</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Order List Card                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

function OrderCard({ order, isSelected, onClick }: {
  order: Order;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`w-full text-right rounded-xl border p-3 transition-all hover:shadow-md ${
        isSelected
          ? "border-amber-400 dark:border-amber-600 bg-amber-50/80 dark:bg-amber-950/30 shadow-sm"
          : "border-border bg-card hover:border-amber-200 dark:hover:border-amber-800/50"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">{order.reference}</span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{timeAgo(order.createdAt)}</span>
      </div>
      <p className="text-xs font-medium truncate mb-1">{order.customer.name || "—"}</p>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {isImageType(order.fileType) ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
        <span className="truncate flex-1">{order.fileName || "—"}</span>
        <span className="font-semibold text-foreground tabular-nums">{(order.total ?? 0).toFixed(2)} ر.س</span>
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main Admin Panel                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

type MainSection = "orders" | "settings";

export function SimpleAdmin({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void; }) {
  const [authed, setAuthed] = useState(false);
  const [section, setSection] = useState<MainSection>("orders");
  const [tab, setTab] = useState<TabKey>("pending");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authed || !open) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/orders?status=pending,printing,ready&noPreview=true`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setOrders(Array.isArray(data) ? data : data.orders || []);
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    };
    load();
    const iv = setInterval(load, REFRESH_INTERVAL);
    return () => { cancelled = true; clearInterval(iv); };
  }, [authed, open]);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?status=pending,printing,ready&noPreview=true`);
      if (!res.ok) return;
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : data.orders || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-code": ADMIN_CODE },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        // Remove from list after short delay for visual feedback
        setTimeout(() => {
          setOrders(prev => prev.filter(o => o.id !== id));
          if (selectedId === id) setSelectedId(null);
        }, 400);
      }
    } catch { /* ignore */ }
    setUpdating(null);
  };

  const filteredOrders = orders.filter(o => o.status === tab);
  const searchFiltered = search
    ? filteredOrders.filter(o =>
        o.reference.includes(search) ||
        o.customer.name.includes(search) ||
        (o.fileName || "").includes(search) ||
        o.customer.phone.includes(search)
      )
    : filteredOrders;
  const selectedOrder = orders.find(o => o.id === selectedId) || null;

  const tabCounts = {
    pending: orders.filter(o => o.status === "pending").length,
    printing: orders.filter(o => o.status === "printing").length,
    ready: orders.filter(o => o.status === "ready").length,
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-[1200px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">لوحة تحكم الإدارة</DialogTitle>
                <DialogDescription className="text-xs">إدارة الطلبات وإعدادات المتجر</DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {authed && section === "orders" && (
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={refreshOrders} disabled={loading}>
                  <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">تحديث</span>
                </Button>
              )}
            </div>
          </div>

          {/* ─── Main Section Switcher ─── */}
          {authed && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setSection("orders")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  section === "orders"
                    ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-sm"
                    : "text-muted-foreground border-transparent hover:bg-muted/50"
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>إدارة الطلبات</span>
                {orders.filter(o => o.status === "pending" || o.status === "printing" || o.status === "ready").length > 0 && (
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    section === "orders" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {orders.filter(o => o.status === "pending" || o.status === "printing" || o.status === "ready").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSection("settings")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  section === "settings"
                    ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 shadow-sm"
                    : "text-muted-foreground border-transparent hover:bg-muted/50"
                }`}
              >
                <Store className="h-4 w-4" />
                <span>إعدادات المتجر</span>
              </button>
            </div>
          )}
        </DialogHeader>

        {!authed ? (
          <AdminLogin onSuccess={() => setAuthed(true)} />
        ) : section === "settings" ? (
          <div className="flex-1 min-h-0 relative">
            <AdminConfigPanel onSaved={() => {}} />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1 min-h-0">
            {/* ─── Left Panel: Order List ─── */}
            <div className="w-full md:w-[340px] lg:w-[380px] border-l border-t md:border-t-0 flex flex-col shrink-0 bg-muted/20">
              {/* Tabs */}
              <div className="flex border-b shrink-0">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => { setTab(t.key); setSelectedId(null); }}
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                      tab === t.key
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                    {tabCounts[t.key] > 0 && (
                      <span className={`mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                        tab === t.key
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {tabCounts[t.key]}
                      </span>
                    )}
                    {tab === t.key && (
                      <motion.div layoutId="admin-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
                    )}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="px-3 py-2 border-b shrink-0">
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالرقم أو الاسم أو الملف..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-8 text-xs pr-8"
                  />
                </div>
              </div>

              {/* Order list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {loading && orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">جارٍ تحميل الطلبات...</p>
                  </div>
                ) : searchFiltered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Box className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">{search ? "لا توجد نتائج" : TABS.find(t => t.key === tab)?.empty}</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {searchFiltered.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        isSelected={order.id === selectedId}
                        onClick={() => setSelectedId(order.id)}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* ─── Right Panel: Order Detail ─── */}
            <div className="flex-1 min-h-0 relative">
              {selectedOrder ? (
                <OrderDetailPanel
                  order={selectedOrder}
                  onStatusChange={handleStatusChange}
                  isUpdating={updating === selectedOrder.id}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                    <Eye className="h-7 w-7 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">اختر طلباً لعرض التفاصيل</p>
                  <p className="text-xs text-muted-foreground/70">اضغط على أي طلب من القائمة لعرض المعاينة ثلاثية الأبعاد والمواصفات</p>
                </div>
              )}
            </div>

            {/* ─── Mobile Back Button ─── */}
            {selectedOrder && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden absolute top-14 right-3 z-10 h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur border"
                onClick={() => setSelectedId(null)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
