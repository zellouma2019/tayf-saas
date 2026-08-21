"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Heart, ShieldCheck, Loader2, MapPin, Clock, Package, Truck, CheckCircle2, X, Search, Copy, Phone, MessageCircle, FileText, RotateCcw, Zap, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SettingsProvider, useSettings } from "@/lib/customer/settings-provider";
import { useShop } from "@/lib/shop-context";
import { motion, AnimatePresence } from "framer-motion";

const StandalonePreview = dynamic(
  () => import("@/components/customer/standalone-preview").then((m) => m.StandalonePreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-sm text-muted-foreground">جارٍ تحميل التطبيق...</p>
      </div>
    ),
  }
);

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  pending: { label: "بانتظار الطباعة", icon: <Clock className="h-4 w-4" />, color: "text-amber-700", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" },
  printing: { label: "جارٍ التنفيذ", icon: <Package className="h-4 w-4" />, color: "text-blue-700", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800" },
  ready: { label: "جاهز للاستلام", icon: <MapPin className="h-4 w-4" />, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" },
  delivered: { label: "تم التسليم", icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" },
  cancelled: { label: "ملغي", icon: <X className="h-4 w-4" />, color: "text-rose-700", bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800" },
};

const STATUS_FLOW = ["pending", "printing", "ready", "delivered"];

interface OrderInfo {
  id: string;
  reference: string;
  status: string;
  fileName: string | null;
  serviceName: string | null;
  total: number;
  pages: number;
  copies: number;
  createdAt: string;
  updatedAt: string;
}

function TrackingSection() {
  const { shop } = useShop();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const lookupOrders = useCallback(async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ phone: phone.trim() });
      if (shop?.id) params.set("shopId", shop.id);
      const res = await fetch(`/api/c/order-lookup?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [phone, shop?.id]);

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Auto-poll for active (non-delivered) orders every 30s
  useEffect(() => {
    if (orders.length === 0) return;
    const hasActive = orders.some(o => o.status !== "delivered" && o.status !== "cancelled");
    if (!hasActive) return;
    const interval = setInterval(lookupOrders, 30000);
    return () => clearInterval(interval);
  }, [orders, lookupOrders]);

  // Show active order badge at top
  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const latestActive = activeOrders[0];

  return (
    <div className="space-y-3">
      {/* Active Order Banner — shown at top when there's an in-progress order */}
      <AnimatePresence>
        {latestActive && searched && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-xl border p-3 ${STATUS_CONFIG[latestActive.status]?.bg || STATUS_CONFIG.pending.bg}`}
          >
            <div className="flex items-center gap-3">
              <div className={`${STATUS_CONFIG[latestActive.status]?.color || "text-amber-700"}`}>
                {STATUS_CONFIG[latestActive.status]?.icon || <Clock className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${STATUS_CONFIG[latestActive.status]?.color || "text-amber-700"}`}>
                    {STATUS_CONFIG[latestActive.status]?.label || latestActive.status}
                  </span>
                  <Badge variant="outline" className="text-[9px] font-mono">{latestActive.reference}</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {latestActive.fileName || latestActive.serviceName || "طلب طباعة"}
                </p>
              </div>
              <div className="text-left shrink-0">
                <p className="text-sm font-bold">{latestActive.total.toFixed(2)} ر.س</p>
                <p className="text-[9px] text-muted-foreground">{new Date(latestActive.updatedAt).toLocaleString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
            {/* Status progress bar */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-2.5 right-0 left-0 h-0.5 bg-muted rounded-full" />
                <div
                  className="absolute top-2.5 right-0 h-0.5 bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${(STATUS_FLOW.indexOf(latestActive.status) / (STATUS_FLOW.length - 1)) * 100}%` }}
                />
                {STATUS_FLOW.map((s, i) => (
                  <div key={s} className="relative z-10 flex flex-col items-center gap-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] border-2 transition-all duration-300 ${
                      i <= STATUS_FLOW.indexOf(latestActive.status)
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-background border-muted text-muted-foreground"
                    }`}>
                      {i < STATUS_FLOW.indexOf(latestActive.status) ? <CheckCircle2 className="h-3 w-3" /> : (i + 1)}
                    </div>
                    <span className={`text-[8px] ${i <= STATUS_FLOW.indexOf(latestActive.status) ? STATUS_CONFIG[s]?.color : "text-muted-foreground"}`}>
                      {STATUS_CONFIG[s]?.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search bar */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookupOrders()}
            placeholder="أدخل رقم الهاتف لتتبع طلباتك..."
            className="border-0 focus-visible:ring-0 h-10 text-sm placeholder:text-muted-foreground/60"
            dir="ltr"
          />
          <Button
            onClick={lookupOrders}
            disabled={loading || !phone.trim()}
            size="sm"
            className="h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shrink-0 px-3 text-xs"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            تتبع
          </Button>
        </div>
      </div>

      {/* Orders list */}
      <AnimatePresence>
        {searched && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 max-h-60 overflow-y-auto"
          >
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              return (
                <div key={order.id} className={`rounded-lg border p-3 ${cfg.bg}`}>
                  <div className="flex items-center gap-3">
                    <div className={cfg.color}>{cfg.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                        <button
                          onClick={() => copyRef(order.reference)}
                          className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                          title="نسخ رقم الطلب"
                        >
                          {order.reference}
                          <Copy className={`h-2.5 w-2.5 ${copiedRef === order.reference ? "text-emerald-500" : ""}`} />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{order.fileName || "طلب طباعة"}</p>
                      {(order as any).trackingNumber && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 flex items-center gap-1">
                          <Truck className="h-2.5 w-2.5" />
                          رقم التتبع: <span dir="ltr" className="font-mono">{(order as any).trackingNumber}</span>
                        </p>
                      )}
                      {(order as any).adminNotes && (
                        <p className="text-[9px] text-muted-foreground/80 mt-0.5 truncate">{(order as any).adminNotes}</p>
                      )}
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-xs font-bold">{order.total.toFixed(2)} ر.س</p>
                      <p className="text-[9px] text-muted-foreground">
                        {order.pages}×{order.copies}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
        {searched && orders.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-6"
          >
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">لا توجد طلبات بهذا الرقم</p>
            <p className="text-xs text-muted-foreground/60">تأكد من الرقم أو قم بطلب طباعة جديد</p>
          </motion.div>
        )}
        {!searched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
            <p className="text-[11px] text-muted-foreground/50">أدخل رقم هاتفك لعرض طلباتك السابقة وحالة كل طلب</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerContent() {
  const { shopName, tagline } = useSettings();

  return (
    <main className="min-h-screen flex flex-col relative" dir="rtl">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <TrackingSection />
          <StandalonePreview />
        </div>
      </div>
      <footer className="mt-auto border-t bg-gradient-to-t from-muted/40 to-transparent backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex flex-col gap-3">
            {/* Top row: branding + trust badges */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                {shopName && (
                  <span className="font-semibold">{shopName}</span>
                )}
                {tagline && (
                  <span className="text-muted-foreground">— {tagline}</span>
                )}
                {!shopName && !tagline && (
                  <>
                    <span className="font-semibold">طيف</span>
                    <span className="text-muted-foreground">— منصة الطباعة الذكية</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" />ملفات آمنة ومشفّرة</span>
                <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-amber-500" />تسعيرة فورية</span>
                <span className="flex items-center gap-1"><Printer className="h-3 w-3 text-blue-500" />طباعة فورية</span>
                <span className="flex items-center gap-1"><Heart className="h-3 w-3 text-rose-400" />صُنع بحب</span>
              </div>
            </div>
            {/* Bottom row: features */}
            <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/60">
              <span>تحليل ذكي للملفات</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>معاينة ثلاثية الأبعاد</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>تتبع الطلبات لحظياً</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>الدفع عند الاستلام</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

export function CustomerPage() {
  const { shop } = useShop();
  return (
    <SettingsProvider shopData={shop}>
      <CustomerContent />
    </SettingsProvider>
  );
}
