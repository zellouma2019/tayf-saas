"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Heart, ShieldCheck, Loader2, MapPin, Clock, Package, Truck, CheckCircle2, X,
  Search, Copy, Phone, MessageCircle, Zap, Printer, ChevronDown, ChevronUp,
  FileText, RotateCcw, Calendar, Hash, User, ShoppingBag, Sparkles, Box
} from "lucide-react";
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
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-3 border-muted border-t-amber-500 animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">جارٍ تحميل التطبيق...</p>
      </div>
    ),
  }
);

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; ring: string }> = {
  pending: {
    label: "بانتظار الطباعة", icon: <Clock className="h-4 w-4" />,
    color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    ring: "ring-amber-400/40",
  },
  printing: {
    label: "جارٍ التنفيذ", icon: <Package className="h-4 w-4" />,
    color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
    ring: "ring-blue-400/40",
  },
  ready: {
    label: "جاهز للاستلام", icon: <MapPin className="h-4 w-4" />,
    color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
    ring: "ring-emerald-400/40",
  },
  delivered: {
    label: "تم التسليم", icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
    ring: "ring-emerald-400/40",
  },
  cancelled: {
    label: "ملغي", icon: <X className="h-4 w-4" />,
    color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800",
    ring: "ring-rose-400/40",
  },
};

const STATUS_FLOW = ["pending", "printing", "ready", "delivered"];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  printing: <Package className="h-3 w-3" />,
  ready: <MapPin className="h-3 w-3" />,
  delivered: <CheckCircle2 className="h-3 w-3" />,
};

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
  trackingNumber?: string;
  adminNotes?: string;
  deliveryMode?: string;
  customerName?: string;
}

function TrackingSection() {
  const { shop } = useShop();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [prevStatuses, setPrevStatuses] = useState<Record<string, string>>({});
  const [showConfetti, setShowConfetti] = useState(false);

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
        const newOrders = data.orders || [];
        // Check for status changes to delivered
        const oldMap: Record<string, string> = {};
        orders.forEach(o => { oldMap[o.id] = o.status; });
        newOrders.forEach(o => {
          if (oldMap[o.id] && oldMap[o.id] !== "delivered" && o.status === "delivered") {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4000);
          }
        });
        setPrevStatuses(oldMap);
        setOrders(newOrders);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [phone, shop?.id, orders]);

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(prev => prev === orderId ? null : orderId);
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
  const currentStepIdx = latestActive ? STATUS_FLOW.indexOf(latestActive.status) : -1;

  return (
    <div className="space-y-3">
      {/* ═══ Confetti Celebration ═══ */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <CheckCircle2 className="h-5 w-5" />
              </motion.div>
              <span className="text-sm font-bold">تم تسليم طلبك بنجاح!</span>
              <Sparkles className="h-4 w-4" />
            </div>
            {/* Confetti particles */}
            {Array.from({ length: 12 }, (_, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 200,
                  y: Math.random() * 120 + 40,
                  opacity: 0,
                  rotate: Math.random() * 360,
                }}
                transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.03 }}
                className="absolute top-0 left-1/2 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"][i % 6],
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Order Banner — shown at top when there's an in-progress order */}
      <AnimatePresence>
        {latestActive && searched && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-2xl border p-4 ${STATUS_CONFIG[latestActive.status]?.bg || STATUS_CONFIG.pending.bg} relative overflow-hidden`}
          >
            {/* Subtle shimmer background */}
            <motion.div
              className="absolute inset-0 opacity-5"
              animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundImage: "linear-gradient(135deg, transparent 40%, rgba(245,158,11,0.3) 50%, transparent 60%)",
                backgroundSize: "200% 200%",
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    latestActive.status === "printing" ? "bg-blue-100 dark:bg-blue-900/40" : "bg-amber-100 dark:bg-amber-900/40"
                  }`}
                >
                  <span className={STATUS_CONFIG[latestActive.status]?.color || "text-amber-700"}>
                    {STATUS_CONFIG[latestActive.status]?.icon || <Clock className="h-5 w-5" />}
                  </span>
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${STATUS_CONFIG[latestActive.status]?.color || "text-amber-700"}`}>
                      {STATUS_CONFIG[latestActive.status]?.label || latestActive.status}
                    </span>
                    <Badge variant="outline" className="text-[9px] font-mono border-current/20">{latestActive.reference}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {latestActive.fileName || latestActive.serviceName || "طلب طباعة"}
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-base font-extrabold tabular-nums">{latestActive.total.toFixed(2)} <span className="text-xs font-medium">ر.س</span></p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(latestActive.updatedAt).toLocaleString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              {/* Status progress bar with staggered dots */}
              <div className="mt-4">
                <div className="flex items-center justify-between relative px-2">
                  {/* Background track */}
                  <div className="absolute top-[9px] right-[20px] left-[20px] h-[3px] bg-muted/60 rounded-full" />
                  {/* Active track */}
                  <motion.div
                    className="absolute top-[9px] right-[20px] h-[3px rounded-full"
                    initial={false}
                    animate={{ width: `${((currentStepIdx >= 0 ? currentStepIdx : 0) / (STATUS_FLOW.length - 1)) * (100 - 12)}%` }}
                    style={{ background: "linear-gradient(to left, #f59e0b, #f97316)" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  {STATUS_FLOW.map((s, i) => {
                    const isActive = i === currentStepIdx;
                    const isComplete = i < currentStepIdx;
                    const isPending = i > currentStepIdx;
                    return (
                      <motion.div
                        key={s}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
                        className="relative z-10 flex flex-col items-center gap-1.5"
                      >
                        <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isActive
                            ? `ring-4 ${STATUS_CONFIG[s]?.ring} bg-white dark:bg-background shadow-md`
                            : isComplete
                              ? "bg-amber-500 border-amber-500 text-white"
                              : "bg-background border-muted-foreground/20 text-muted-foreground/50"
                        } ${isActive ? `border-amber-500 ${STATUS_CONFIG[s]?.color}` : ""}`}>
                          {isComplete ? <CheckCircle2 className="h-3 w-3" /> : STATUS_ICONS[s]}
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-amber-400"
                              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                          )}
                        </div>
                        <span className={`text-[9px] font-medium leading-none ${
                          isActive ? STATUS_CONFIG[s]?.color : isComplete ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/40"
                        }`}>
                          {STATUS_CONFIG[s]?.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search bar with focus glow */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border bg-card overflow-hidden transition-shadow duration-300 focus-within:shadow-lg focus-within:shadow-amber-500/10 focus-within:border-amber-300/50 dark:focus-within:border-amber-700/50"
      >
        <div className="flex items-center gap-2 px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookupOrders()}
            placeholder="أدخل رقم الهاتف لتتبع طلباتك..."
            className="border-0 focus-visible:ring-0 h-11 text-sm placeholder:text-muted-foreground/50"
            dir="ltr"
          />
          <Button
            onClick={lookupOrders}
            disabled={loading || !phone.trim()}
            size="sm"
            className="h-9 rounded-xl bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shrink-0 px-4 text-xs font-semibold shadow-sm shadow-amber-500/20 active:scale-[0.97] transition-all"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            تتبع
          </Button>
        </div>
      </motion.div>

      {/* Skeleton loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {[0, 1].map(i => (
              <div key={i} className="rounded-xl border p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-2 w-40 bg-muted rounded" />
                  </div>
                  <div className="text-left space-y-2">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-2 w-12 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders list with staggered animation */}
      <AnimatePresence>
        {!loading && searched && orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 max-h-72 overflow-y-auto"
          >
            {orders.map((order, index) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const isExpanded = expandedOrder === order.id;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06, type: "spring", stiffness: 200, damping: 20 }}
                  className={`rounded-xl border p-3.5 ${cfg.bg} cursor-pointer transition-all duration-200 hover:shadow-md ${isExpanded ? "ring-2 " + (cfg.ring || "") : ""}`}
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        order.status === "delivered" ? "bg-emerald-100 dark:bg-emerald-900/40" :
                        order.status === "printing" ? "bg-blue-100 dark:bg-blue-900/40" :
                        "bg-amber-100 dark:bg-amber-900/40"
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className={cfg.color}>{cfg.icon}</span>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyRef(order.reference); }}
                          className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground hover:text-foreground transition-all"
                          title="نسخ رقم الطلب"
                        >
                          <Hash className="h-2.5 w-2.5" />
                          {order.reference}
                          <motion.span
                            animate={copiedRef === order.reference ? { scale: [1, 1.3, 1] } : {}}
                          >
                            <Copy className={`h-2.5 w-2.5 transition-colors ${copiedRef === order.reference ? "text-emerald-500" : ""}`} />
                          </motion.span>
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {order.fileName || order.serviceName || "طلب طباعة"}
                      </p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-extrabold tabular-nums">{order.total.toFixed(2)} <span className="text-[10px] font-medium">ر.س</span></p>
                      <p className="text-[10px] text-muted-foreground">{order.pages} صفحة × {order.copies} نسخة</p>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className={`h-4 w-4 text-muted-foreground/50 ${isExpanded ? "text-foreground" : ""}`} />
                    </motion.div>
                  </div>

                  {/* Expanded order details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2.5">
                          {/* Order details grid */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 text-[11px]">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">التاريخ:</span>
                              <span className="font-medium">
                                {new Date(order.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px]">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">التفاصيل:</span>
                              <span className="font-medium">{order.pages} صفحة</span>
                            </div>
                            {order.customerName && (
                              <div className="flex items-center gap-2 text-[11px]">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">الاسم:</span>
                                <span className="font-medium">{order.customerName}</span>
                              </div>
                            )}
                            {order.deliveryMode && (
                              <div className="flex items-center gap-2 text-[11px]">
                                <Truck className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">التوصيل:</span>
                                <span className="font-medium">{order.deliveryMode === "delivery" ? "توصيل" : "استلام من المطبعة"}</span>
                              </div>
                            )}
                          </div>

                          {/* Tracking number */}
                          {order.trackingNumber && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                              <Truck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">رقم التتبع:</span>
                              <span dir="ltr" className="text-[11px] font-mono font-bold text-amber-800 dark:text-amber-200">{order.trackingNumber}</span>
                            </div>
                          )}

                          {/* Admin notes */}
                          {order.adminNotes && (
                            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30">
                              <MessageCircle className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">ملاحظات المطبعة:</span>
                                <p className="text-[11px] text-blue-800 dark:text-blue-200 mt-0.5">{order.adminNotes}</p>
                              </div>
                            </div>
                          )}

                          {/* Mini status flow for this order */}
                          <div className="flex items-center gap-1 pt-1">
                            {STATUS_FLOW.map((s, i) => {
                              const orderStepIdx = STATUS_FLOW.indexOf(order.status);
                              const stepActive = i <= orderStepIdx;
                              return (
                                <div key={s} className="flex items-center gap-1">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                    stepActive ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground/40"
                                  }`}>
                                    {i < orderStepIdx ? <CheckCircle2 className="h-2.5 w-2.5" /> : <span className="text-[7px] font-bold">{i + 1}</span>}
                                  </div>
                                  {i < STATUS_FLOW.length - 1 && (
                                    <div className={`w-4 h-0.5 ${stepActive ? "bg-amber-400" : "bg-muted"}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state with float animation */}
      <AnimatePresence>
        {searched && orders.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center"
            >
              <Search className="h-7 w-7 text-muted-foreground/40" />
            </motion.div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">لا توجد طلبات بهذا الرقم</p>
            <p className="text-xs text-muted-foreground/60 max-w-[240px] mx-auto">تأكد من الرقم أو قم بطلب طباعة جديد من المنطقة أدناه</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle hint */}
      <AnimatePresence>
        {!searched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-5"
          >
            <div className="flex items-center justify-center gap-2 text-muted-foreground/40">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
                <Phone className="h-3 w-3" />
                <span className="text-[11px]">أدخل رقم هاتفك لعرض طلباتك السابقة وحالة كل طلب</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══ WhatsApp FAB ═══ */
function WhatsAppFab() {
  const { whatsappNumber } = useSettings();
  const [isHovered, setIsHovered] = useState(false);

  if (!whatsappNumber) return null;

  const cleaned = whatsappNumber.replace(/[^0-9+]/g, "");
  const message = encodeURIComponent("مرحباً، أريد الاستفسار عن خدمة الطباعة");
  const url = `https://wa.me/${cleaned}?text=${message}`;

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 200, damping: 15 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="fixed bottom-6 left-6 z-40 group"
      aria-label="تواصل عبر واتساب"
    >
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-green-500"
        animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Button */}
      <motion.div
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 flex items-center justify-center transition-colors duration-200"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </motion.div>
      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium whitespace-nowrap shadow-lg"
          >
            تواصل عبر واتساب
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.a>
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

      {/* Enhanced Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
        className="mt-auto border-t bg-gradient-to-t from-muted/50 to-transparent backdrop-blur-sm"
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            {/* Top row: branding + trust badges with icons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <Printer className="h-4 w-4 text-white" />
                </div>
                <div className="text-sm">
                  {shopName && (
                    <span className="font-bold text-foreground/80">{shopName}</span>
                  )}
                  {tagline && (
                    <span className="text-muted-foreground mr-1.5">— {tagline}</span>
                  )}
                  {!shopName && !tagline && (
                    <>
                      <span className="font-bold text-foreground/80">طيف</span>
                      <span className="text-muted-foreground mr-1.5">— منصة الطباعة الذكية</span>
                    </>
                  )}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-4 text-xs"
              >
                {[
                  { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "ملفات آمنة", color: "text-emerald-500" },
                  { icon: <Zap className="h-3.5 w-3.5" />, label: "تسعيرة فورية", color: "text-amber-500" },
                  { icon: <Printer className="h-3.5 w-3.5" />, label: "طباعة فورية", color: "text-blue-500" },
                  { icon: <Heart className="h-3.5 w-3.5" />, label: "صُنع بحب", color: "text-rose-400" },
                ].map((badge, i) => (
                  <motion.span
                    key={badge.label}
                    initial={{ opacity: 0, y: 5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-default"
                  >
                    <span className={badge.color}>{badge.icon}</span>
                    {badge.label}
                  </motion.span>
                ))}
              </motion.div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-l from-transparent via-border to-transparent" />

            {/* Bottom row: features with pill badges */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 flex-wrap"
            >
              {[
                { icon: <Sparkles className="h-3 w-3" />, label: "تحليل ذكي" },
                { icon: <Box className="h-3 w-3" />, label: "معاينة 3D" },
                { icon: <MapPin className="h-3 w-3" />, label: "تتبع لحظي" },
                { icon: <RotateCcw className="h-3 w-3" />, label: "الدفع عند الاستلام" },
              ].map((feat) => (
                <span
                  key={feat.label}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/50 border border-border/50 text-[10px] text-muted-foreground/70"
                >
                  {feat.icon}
                  {feat.label}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.footer>

      {/* WhatsApp Floating Button */}
      <WhatsAppFab />
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
