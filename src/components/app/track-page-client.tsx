"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package,
  Store,
  ArrowLeft,
  Loader2,
  Clock,
  Inbox,
  Phone,
  Printer,
  CheckCircle2,
  Truck,
  Zap,
  Hourglass,
  Timer,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { STATUS_META, STATUS_FLOW, formatDA, formatDateTimeAr } from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";

interface Shop {
  id: string;
  name: string;
  slug: string;
}

const SERVICE_EMOJI: Record<string, string> = {
  document: "🖨️",
  photo: "🖼️",
  binding: "📚",
  copy: "📄",
  card: "🪪",
  poster: "📜",
};

/* ===== خطوات مسار الحالة المرئي ===== */
const TIMELINE_STEPS = [
  { key: "pending",   label: "تم الاستلام",   icon: Inbox,        color: "amber" },
  { key: "printing",  label: "جارٍ الطباعة",  icon: Printer,     color: "blue" },
  { key: "ready",     label: "جاهز للاستلام",  icon: CheckCircle2, color: "emerald" },
  { key: "delivered", label: "تم التسليم",    icon: Truck,        color: "emerald" },
];

function getStepIndex(status: string): number {
  const idx = STATUS_FLOW.indexOf(status);
  if (idx >= 0) return idx;
  if (status === "confirmed") return 0;
  if (status === "cancelled") return -1;
  return 0;
}

function ProgressFill({ stepIndex }: { stepIndex: number }) {
  const pct = Math.max(0, (stepIndex / (TIMELINE_STEPS.length - 1)) * 76);
  return (
    <motion.div
      className="absolute top-1/2 left-[12%] -translate-y-1/2 h-1.5 rounded-full bg-gradient-to-l from-emerald-500 to-violet-500 shadow-sm"
      initial={{ width: 0 }}
      animate={{ width: pct + "%" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    />
  );
}

/* ===== مؤقت العد التنازلي ===== */
function useEtaCountdown(estimatedHours: number, createdAt: string, status: string) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (status === "delivered" || status === "cancelled" || estimatedHours <= 0) {
      setTimeLeft(status === "delivered" ? "تم" : "—");
      setProgress(status === "delivered" ? 100 : 0);
      return;
    }

    function calc() {
      const created = new Date(createdAt).getTime();
      const totalMs = estimatedHours * 3600000;
      const elapsed = Date.now() - created;
      const remaining = Math.max(0, totalMs - elapsed);
      const pct = Math.min(100, (elapsed / totalMs) * 100);

      if (remaining <= 0) {
        setTimeLeft("متأخر");
        setProgress(100);
      } else {
        const hrs = Math.floor(remaining / 3600000);
        const mins = Math.floor((remaining % 3600000) / 60000);
        setTimeLeft(hrs > 0 ? `${hrs}س ${mins}د` : `${mins}د`);
        setProgress(pct);
      }
    }

    calc();
    const interval = setInterval(calc, 30000); // تحديث كل 30 ثانية
    return () => clearInterval(interval);
  }, [estimatedHours, createdAt, status]);

  return { timeLeft, progress };
}

export function TrackPageClient() {
  const searchParams = useSearchParams();
  const prefillRef = searchParams.get("ref") || "";
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [query, setQuery] = useState(prefillRef);
  const [orders, setOrders] = useState<PrintOrderLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  // Fetch shops on mount + auto-search if ref query param exists
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/shops");
        const data = await res.json();
        if (data.shops && Array.isArray(data.shops)) {
          setShops(data.shops);
        }
      } catch {
        toast.error("فشل تحميل قائمة المتاجر");
      } finally {
        setShopsLoading(false);
      }
    })();
  }, []);

  // Auto-search when ref is pre-filled and shops are loaded
  const autoSearchedRef = useRef(false);
  useEffect(() => {
    if (prefillRef && shops.length > 0 && !autoSearchedRef.current) {
      autoSearchedRef.current = true;
      // Find shop that has this order
      const timer = setTimeout(() => {
        // Search all shops for the order
        const shopToSearch = shops[0]?.slug || "";
        if (shopToSearch) {
          setSelectedShop(shopToSearch);
          setQuery(prefillRef);
          // Trigger search after a short delay for state to update
          setTimeout(() => {
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
            handleSearch(fakeEvent);
          }, 100);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [prefillRef, shops]);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) {
      toast.error("أدخل رقم الطلب أو رقم الهاتف");
      return;
    }
    if (!selectedShop) {
      toast.error("اختر المتجر أولاً");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({
        shopId: selectedShop,
        q: query.trim(),
      });
      const res = await fetch(`/api/track?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
      toast.error("خطأ في البحث — حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-6"
      dir="rtl"
    >
      <div className="max-w-2xl w-full space-y-6">
        {/* === Enhanced Gradient Header === */}
        <div className="relative rounded-2xl bg-gradient-to-br from-violet-50 via-indigo-50 to-slate-50 dark:from-violet-950/30 dark:via-indigo-950/20 dark:to-slate-900/30 border border-border p-6 sm:p-8 text-center overflow-hidden">
          {/* Animated radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(139,92,246,0.1),transparent_60%)] pointer-events-none animate-pulse" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,rgba(245,158,11,0.06),transparent_50%)] pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />
          {/* Dot pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative">
            {/* Animated icon container */}
            <motion.div
              className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center mb-4 shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              whileHover={{ scale: 1.05, rotate: 3 }}
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Package className="h-9 w-9 text-violet-600 dark:text-violet-400" />
              </motion.div>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              تتبّع الطلب
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              اختر المتجر ثم أدخل رقم الطلب أو رقم هاتفك لمعرفة حالة طلبك
            </p>
            {/* Feature badges */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-violet-100/80 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium">
                <Zap className="h-3 w-3" /> تتبّع فوري
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                <Timer className="h-3 w-3" /> عدّ تنازلي
              </span>
            </div>
          </div>
        </div>

        {/* === Search Form === */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleSearch} className="space-y-3">
              {/* Shop Selector */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  اختر المتجر
                </label>
                <Select
                  value={selectedShop}
                  onValueChange={setSelectedShop}
                  disabled={shopsLoading || shops.length === 0}
                >
                  <SelectTrigger className="w-full h-11 text-sm focus-visible:ring-gold-500/30 focus-visible:border-gold-500 focus-ring">
                    <SelectValue
                      placeholder={
                        shopsLoading
                          ? "جارٍ تحميل المتاجر..."
                          : shops.length === 0
                            ? "لا توجد متاجر متاحة"
                            : "اختر متجرك..."
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem key={shop.id} value={shop.id}>
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  رقم الطلب أو رقم الهاتف
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1 search-input-enhanced rounded-xl">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="مثال: A-1050 أو 0560..."
                      className="pr-9 h-11 text-sm rounded-xl focus-visible:ring-gold-500/30 focus-visible:border-gold-500 transition-all duration-300"
                      dir="ltr"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-11 px-6 bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/20 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-gold-500/50 transition-all"
                    disabled={loading || !query.trim() || !selectedShop}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    تتبّع
                  </Button>
                </div>
              </div>
            </form>

            {/* === Hint === */}
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
              <Phone className="h-3.5 w-3.5 text-amber-500" />
              تلميح: أدخل رقم الطلب مثل A-1050 أو رقم هاتفك
            </p>
          </CardContent>
        </Card>

        {/* === Loading Skeleton === */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center py-16 text-muted-foreground"
            >
              <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-3" />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-violet-500/20"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <p className="text-sm font-medium">جارٍ البحث عن طلبك...</p>
              <div className="flex gap-1 mt-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-violet-400"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === Empty State === */}
        <AnimatePresence>
          {!loading && searched && orders.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-border overflow-hidden">
                <div className="h-1.5 bg-gradient-to-l from-violet-500 via-indigo-500 to-amber-500" />
                <CardContent className="py-16 text-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 dark:bg-muted/20 flex items-center justify-center mb-4">
                      <Inbox className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  </motion.div>
                  <p className="text-sm font-semibold text-foreground mb-1">لا توجد طلبات مطابقة</p>
                  <p className="text-xs text-muted-foreground">
                    تأكد من رقم الطلب أو رقم الهاتف وحاول مرة أخرى
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === Results === */}
        <AnimatePresence>
          {!loading && orders.length > 0 && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <p className="text-sm text-muted-foreground px-3">
                  تم العثور على{" "}
                  <span className="font-bold text-foreground">{orders.length}</span>{" "}
                  طلب
                </p>
                <div className="h-px flex-1 bg-border" />
              </div>
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.1, ease: "easeOut" }}
                >
                  <TrackedOrderCard order={order} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* === Instructions Section === */}
        <Card className="border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-l from-violet-500 to-amber-500" />
          <CardContent className="p-5 text-sm text-muted-foreground space-y-4">
            <p className="text-foreground font-semibold flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-violet-500" />
              كيفية التتبّع؟
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { num: "١", text: "اختر المتجر من القائمة" },
                { num: "٢", text: "أدخل رقم الطلب أو الهاتف" },
                { num: "٣", text: "اضغط \"تتبّع\" للنتائج" },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5 text-start">
                  <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {step.num}
                  </div>
                  <span className="text-xs leading-relaxed">{step.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* === Back to Home === */}
        <div className="text-center pt-2 pb-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors hover:underline underline-offset-4 decoration-primary/30"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ بطاقة الطلب مع خط المسار الزمني ═══════════════════ */

function TrackedOrderCard({ order }: { order: PrintOrderLite }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const serviceEmoji = SERVICE_EMOJI[order.serviceType] || "🖨️";
  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = order.status === "cancelled";
  const { timeLeft, progress } = useEtaCountdown(order.estimatedHours || 0, order.createdAt, order.status);

  const etaColor = useMemo(() => {
    if (isCancelled || order.status === "delivered") return "text-muted-foreground";
    if (progress > 90) return "text-rose-500";
    if (progress > 60) return "text-amber-500";
    return "text-emerald-500";
  }, [progress, isCancelled, order.status]);

  const progressColor = useMemo(() => {
    if (isCancelled) return "bg-muted";
    if (progress > 90) return "bg-rose-500";
    if (progress > 60) return "bg-amber-500";
    return "bg-emerald-500";
  }, [progress, isCancelled]);

  return (
    <Card className="overflow-hidden shadow-lg shadow-slate-200/40 dark:shadow-slate-900/40 hover:shadow-xl dark:hover:shadow-slate-800/50 hover:-translate-y-0.5 transition-all duration-300 border-border">
      {/* Header strip with gradient */}
      <div className="relative px-4 sm:px-5 py-3 sm:py-4 border-b overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-l from-neutral-900 to-neutral-800" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <span className="text-lg">{serviceEmoji}</span>
            </div>
            <div className="min-w-0">
              <div className="font-mono font-bold text-sm text-amber-300 truncate">
                {order.reference}
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-400 truncate">
                {order.serviceName}
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[11px] sm:text-xs px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border whitespace-nowrap shrink-0 font-semibold ${meta.bg}`}
          >
            {meta.emoji} {meta.label}
          </Badge>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* === Visual Status Timeline === */}
        {!isCancelled && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="font-medium">مسار الطلب</span>
            </div>
            <div className="relative flex items-center justify-between gap-1 px-1">
              {/* Progress bar background */}
              <div className="absolute top-1/2 left-[12%] right-[12%] -translate-y-1/2 h-1.5 rounded-full bg-muted" />
              {/* Progress bar fill */}
              <ProgressFill stepIndex={currentStepIndex} />
              {/* Steps */}
              {TIMELINE_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isCompleted = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5" style={{ width: "24%" }}>
                    <motion.div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCompleted
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500 shadow-md shadow-emerald-500/20"
                          : "bg-card border-muted-foreground/20"
                      } ${isCurrent ? "ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-background" : ""}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.15, type: "spring" }}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isCompleted ? "text-white" : "text-muted-foreground/50"}`} />
                    </motion.div>
                    <span className={`text-[9px] sm:text-[10px] font-medium leading-none ${isCurrent ? "text-emerald-600 dark:text-emerald-400" : isCompleted ? "text-foreground" : "text-muted-foreground/60"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* === ETA Countdown === */}
        {!isCancelled && order.estimatedHours > 0 && (
          <div className="rounded-xl bg-muted/30 dark:bg-muted/20 border border-border/50 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Hourglass className="h-3.5 w-3.5" />
                الوقت المتوقّع
              </span>
              <span className={`text-sm font-bold tabular-nums ${etaColor}`}>
                {timeLeft}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${progressColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground/60">تم الطلب</span>
              <span className="text-[10px] text-muted-foreground/60">التسليم</span>
            </div>
          </div>
        )}

        {/* === Cancelled banner === */}
        {isCancelled && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 p-3 text-center">
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400">تم إلغاء هذا الطلب</p>
          </div>
        )}

        {/* === Order details grid === */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <InfoItem
            label="العميل"
            value={order.customer?.name || "—"}
            icon={null}
          />
          <InfoItem
            label="المجموع"
            value={formatDA(order.total)}
            highlight
            icon={null}
          />
          <InfoItem
            label="التاريخ"
            value={formatDateTimeAr(order.createdAt)}
            icon={<Clock className="h-3 w-3" />}
          />
          <InfoItem
            label="الصفحات"
            value={`${order.pages}×${order.copies}`}
            icon={null}
          />
        </div>

        {/* Last update */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>آخر تحديث: {formatDateTimeAr(order.updatedAt)}</span>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════ عنصر المعلومات ═══════════════════ */

function InfoItem({
  label,
  value,
  highlight,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/30 dark:bg-muted/20 p-2.5 border-r-[3px] border-r-amber-400/60 dark:border-r-amber-500/40 min-w-0 transition-colors hover:bg-muted/50">
      <div className="text-[11px] text-muted-foreground mb-0.5 flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div
        className={`text-xs font-semibold truncate ${
          highlight
            ? "text-amber-700 dark:text-amber-400 font-bold"
            : "text-foreground"
        }`}
        dir="auto"
      >
        {value}
      </div>
    </div>
  );
}
