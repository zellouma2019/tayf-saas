"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Phone, Search, Loader2, Inbox, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { shopApi } from "@/lib/shop-api";
import { formatDA, formatDateTimeAr } from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";

/* ─────────────────────── ألوان الحالات ─────────────────────── */
const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:   { label: "بانتظار المراجعة", bg: "bg-amber-50 dark:bg-amber-950/40",   text: "text-amber-700 dark:text-amber-300",   border: "border-amber-200 dark:border-amber-800" },
  confirmed: { label: "مؤكّد",          bg: "bg-gold-500/10 dark:bg-gold-500/10",      text: "text-gold-400 dark:text-gold-300",      border: "border-gold-500/20 dark:border-gold-500/20" },
  printing:  { label: "جارٍ الطباعة",    bg: "bg-gold-50 dark:bg-gold-500/10",   text: "text-gold-600 dark:text-gold-200",  border: "border-gold-200 dark:border-gold-500/20" },
  ready:     { label: "جاهز للاستلام",  bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  delivered: { label: "تم التسليم",      bg: "bg-dark-100 dark:bg-card border-gold-500/8 dark:border-dark-700", text: "text-dark-600 dark:text-dark-300", border: "border-gold-500/8 dark:border-dark-700" },
  cancelled: { label: "ملغي",           bg: "bg-rose-50 dark:bg-rose-950/40",      text: "text-rose-700 dark:text-rose-300",      border: "border-rose-200 dark:border-rose-800" },
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
export function OrderHistory() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<PrintOrderLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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

  return (
    <div className="max-w-3xl mx-auto">
      {/* المنطقة الترويسية */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-50 dark:from-slate-900/50 to-violet-50/40 dark:to-violet-950/30 border border-dark-200/60 p-6 md:p-8 mb-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.06),transparent_50%)]" />
        <div className="relative">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-slate-100 dark:from-slate-800 to-violet-100 dark:to-violet-900/40 flex items-center justify-center mb-3 shadow-sm">
            <History className="h-7 w-7 text-gold-500" />
          </div>
          <h1 className="text-2xl font-bold mb-1">سجل الطلبات</h1>
          <p className="text-sm text-muted-foreground">
            أدخل رقم هاتفك لعرض جميع طلباتك السابقة
          </p>
        </div>
      </div>

      {/* حقل الإدخال */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0560123456"
            className="pr-9 h-12 text-base"
            dir="ltr"
            type="tel"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-12 px-6 bg-neutral-900 hover:bg-neutral-800 text-white"
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

      <p className="text-xs text-center text-muted-foreground mb-6">
        أدخل رقم الهاتف الذي استخدمته عند إنشاء الطلب
      </p>

      {/* حالة التحميل */}
      {loading && (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-gold-400 mb-3" />
          <p className="text-sm font-medium">جارٍ البحث عن طلباتك...</p>
        </div>
      )}

      {/* حالة عدم وجود نتائج */}
      {!loading && searched && orders.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium">لا توجد طلبات سابقة</p>
            <p className="text-xs text-muted-foreground mt-1">
              تأكد من صحة رقم الهاتف وحاول مرة أخرى
            </p>
          </CardContent>
        </Card>
      )}

      {/* قائمة الطلبات */}
      {!loading && orders.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground mb-2">
            تم العثور على {orders.length} طلب
          </p>
          <AnimatePresence>
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
              >
                <HistoryCard order={order} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ بطاقة الطلب ═══════════════════ */
function HistoryCard({ order }: { order: PrintOrderLite }) {
  const style = getStatusStyle(order.status);
  const emoji = SERVICE_EMOJI[order.serviceType] || "🖨️";

  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          {/* الجانب الأيمن: الرمز + المعلومات */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 dark:from-slate-800 to-violet-50 dark:to-violet-900/40 flex items-center justify-center shrink-0 text-lg">
              {emoji}
            </div>
            <div className="min-w-0 flex-1">
              {/* رقم المرجع */}
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono font-bold text-sm text-foreground">
                  {order.reference}
                </span>
              </div>
              {/* اسم الخدمة */}
              <p className="text-sm font-medium text-foreground truncate">
                {order.serviceName}
              </p>
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
              {style.label}
            </Badge>
            <span className="text-sm font-bold text-foreground">
              {formatDA(order.total)}
            </span>
          </div>
        </div>

        {/* تفاصيل إضافية */}
        <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            {order.pages} صفحة
          </span>
          <span>× {order.copies} نسخة</span>
          <span className="mr-auto font-mono text-[11px]">
            {order.customer?.name}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}