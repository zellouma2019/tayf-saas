"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { History, Phone, Search, Loader2, Inbox, Package, Filter, RotateCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { shopApi } from "@/lib/shop-api";
import { formatDA, formatDateTimeAr } from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";

/* ─────────────────────── ألوان الحالات ─────────────────────── */
const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; border: string; icon: string }> = {
  pending:   { label: "بانتظار المراجعة", bg: "bg-amber-50 dark:bg-amber-950/40",   text: "text-amber-700 dark:text-amber-300",   border: "border-amber-200 dark:border-amber-800", icon: "⏳" },
  confirmed: { label: "مؤكّد",          bg: "bg-gold-500/10 dark:bg-gold-500/10",      text: "text-gold-400 dark:text-gold-300",      border: "border-gold-500/20 dark:border-gold-500/20", icon: "✅" },
  printing:  { label: "جارٍ الطباعة",    bg: "bg-blue-50 dark:bg-blue-950/40",   text: "text-blue-700 dark:text-blue-300",  border: "border-blue-200 dark:border-blue-800", icon: "🖨️" },
  ready:     { label: "جاهز للاستلام",  bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", icon: "📦" },
  delivered: { label: "تم التسليم",      bg: "bg-dark-100 dark:bg-card border-gold-500/8 dark:border-dark-700", text: "text-dark-600 dark:text-dark-300", border: "border-gold-500/8 dark:border-dark-700", icon: "✅" },
  cancelled: { label: "ملغي",           bg: "bg-rose-50 dark:bg-rose-950/40",      text: "text-rose-700 dark:text-rose-300",      border: "border-rose-200 dark:border-rose-800", icon: "❌" },
};

/* ─────────────────────── رموز الخدمات ─────────────────────── */
const SERVICE_EMOJI: Record<string, string> = {
  document: "🖨️",
  photo: "🖼️",
  binding: "📚",
  copy: "📄",
  card: "🪪",
  poster: "📜",
};

function getStatusStyle(status: string) {
  return STATUS_STYLES[status] || STATUS_STYLES.pending;
}

/* ═══════════════════════ المكون الرئيسي ═══════════════════════ */
interface OrderHistoryProps {
  onReorder?: (order: PrintOrderLite) => void;
}

export function OrderHistory({ onReorder }: OrderHistoryProps) {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<PrintOrderLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.reference?.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.serviceName?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [orders, statusFilter, searchQuery]);

  const hasActiveFilters = statusFilter !== "all" || searchQuery.trim().length > 0;

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 8) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await shopApi(
        `/api/orders/by-phone?phone=${encodeURIComponent(trimmed)}`,
      );
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function handleClearFilters() {
    setStatusFilter("all");
    setSearchQuery("");
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* المنطقة الترويسية */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-50 dark:from-slate-900/50 to-violet-50/40 dark:to-violet-950/30 border border-border p-6 md:p-8 mb-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.06),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="relative">
          <motion.div
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-100 dark:from-slate-800 to-violet-100 dark:to-violet-900/40 flex items-center justify-center mb-3 shadow-sm"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            whileHover={{ rotate: 5 }}
          >
            <History className="h-7 w-7 text-gold-500" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-1">سجل الطلبات</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            أدخل رقم هاتفك لعرض جميع طلباتك السابقة
          </p>
        </div>
      </div>

      <Card className="border-border shadow-sm mb-4">
        <CardContent className="p-4">
          {/* حقل الإدخال */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0560123456"
                className="pr-9 h-12 text-base focus-visible:ring-gold-500/30 focus-visible:border-gold-500"
                dir="ltr"
                type="tel"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 px-6 bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/20 active:scale-[0.97] transition-all"
              disabled={loading || phone.trim().length < 8}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4 ml-1.5" />
              )}
              بحث
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-2">
            أدخل رقم الهاتف الذي استخدمته عند إنشاء الطلب
          </p>
        </CardContent>
      </Card>

      {/* فلاتر البحث */}
      {searched && orders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-2 mb-4"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالرقم المرجعي أو الاسم..."
              className="pr-9 h-9 text-xs"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
              <SelectTrigger className="h-9 w-full sm:w-[180px] text-xs">
                <Filter className="h-3.5 w-3.5 ml-1" />
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="pending">⏳ بانتظار المراجعة</SelectItem>
                <SelectItem value="confirmed">✅ مؤكّد</SelectItem>
                <SelectItem value="printing">🖨️ جارٍ الطباعة</SelectItem>
                <SelectItem value="ready">📦 جاهز للاستلام</SelectItem>
                <SelectItem value="delivered">✅ تم التسليم</SelectItem>
                <SelectItem value="cancelled">❌ ملغي</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 px-2" onClick={handleClearFilters}>
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* حالة عدم وجود نتائج بعد الفلتر */}
      {!loading && searched && orders.length > 0 && filteredOrders.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <Filter className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium">لا توجد نتائج تطابق الفلتر</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs"
              onClick={handleClearFilters}
            >
              مسح الفلاتر
            </Button>
          </CardContent>
        </Card>
      )}

      {/* حالة التحميل */}
      {loading && (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <div className="relative">
            <Loader2 className="h-6 w-6 animate-spin text-gold-400 mb-3" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-gold-400/20"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          <p className="text-sm font-medium">جارٍ البحث عن طلباتك...</p>
        </div>
      )}

      {/* حالة عدم وجود نتائج */}
      {!loading && searched && orders.length === 0 && (
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-l from-violet-500 to-amber-500" />
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/50 dark:bg-muted/20 flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">لا توجد طلبات سابقة</p>
            <p className="text-xs text-muted-foreground">
              تأكد من صحة رقم الهاتف وحاول مرة أخرى
            </p>
          </CardContent>
        </Card>
      )}

      {/* قائمة الطلبات */}
      {!loading && filteredOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <p className="text-xs text-muted-foreground px-3">
              {filteredOrders.length}{filteredOrders.length !== orders.length ? ` من ${orders.length}` : ""} طلب
            </p>
            <div className="h-px flex-1 bg-border" />
          </div>
          <AnimatePresence>
            {filteredOrders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
              >
                <HistoryCard order={order} onReorder={onReorder} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ بطاقة الطلب ═══════════════════ */
function HistoryCard({ order, onReorder }: { order: PrintOrderLite; onReorder?: (order: PrintOrderLite) => void }) {
  const style = getStatusStyle(order.status);
  const emoji = SERVICE_EMOJI[order.serviceType] || "🖨️";

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-border">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          {/* الجانب الأيمن: الرمز + المعلومات */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 dark:from-slate-800 to-violet-50 dark:to-violet-900/40 flex items-center justify-center shrink-0 text-lg shadow-sm">
              {emoji}
            </div>
            <div className="min-w-0 flex-1">
              {/* رقم المرجع */}
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono font-bold text-sm text-foreground">
                  {order.reference}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">{order.serviceName}</span>
              </div>
              {/* التاريخ */}
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDateTimeAr(order.createdAt)}
              </p>
            </div>
          </div>

          {/* الجانب الأيسر: الحالة + المبلغ */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge
              variant="outline"
              className={`${style.bg} ${style.text} ${style.border} text-[11px] font-semibold px-2.5 py-0.5`}
            >
              {style.icon} {style.label}
            </Badge>
            <span className="text-sm font-bold text-foreground">
              {formatDA(order.total)}
            </span>
          </div>
        </div>

        {/* تفاصيل إضافية + زر إعادة الطلب */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              {order.pages} صفحة
            </span>
            <span>× {order.copies} نسخة</span>
            <span className="hidden sm:inline font-mono text-[11px]">
              {order.customer?.name}
            </span>
          </div>
          {/* زر إعادة الطلب السريع */}
          {onReorder && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-[11px] gap-1.5 border-dashed hover:border-solid hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 active:scale-[0.97] transition-all"
              onClick={() => onReorder(order)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              إعادة الطلب
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
