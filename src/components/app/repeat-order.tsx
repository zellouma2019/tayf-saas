"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Inbox, Search, RotateCcw, Clock, FileText, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  STATUS_META,
  formatDA,
  formatDateTimeAr,
} from "@/lib/print-config";
import type { PrintOrderLite } from "@/lib/order-types";
import { shopApi } from "@/lib/shop-api";

const STATUS_BORDER: Record<string, string> = {
  pending: "border-r-amber-500",
  printing: "border-r-blue-500",
  ready: "border-r-emerald-500",
  delivered: "border-r-emerald-500",
  cancelled: "border-r-rose-500",
};

interface RepeatOrderProps {
  /** عند اختيار طلب لإعادة تعبئته في المعالج، أو null للانتقال لطلب جديد */
  onRepeat: (order: PrintOrderLite | null) => void;
}

export function RepeatOrder({ onRepeat }: RepeatOrderProps) {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<PrintOrderLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const clean = phone.replace(/[\s\-+]/g, "");
    if (clean.length < 8) {
      toast.error("رقم الهاتف غير صحيح", {
        description: "أدخل رقم هاتف صحيح (8 أرقام على الأقل)",
      });
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await shopApi(`/api/orders/by-phone?phone=${encodeURIComponent(clean)}`);
      const d = await res.json();
      setOrders(d.orders || []);
      if ((d.orders || []).length === 0) {
        toast.info("لا توجد طلبات سابقة لهذا الرقم");
      } else {
        toast.success(`تم العثور على ${d.orders.length} طلب سابق`);
      }
    } catch {
      setOrders([]);
      toast.error("خطأ في البحث");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ترويسة محسّنة */}
      <div className="relative rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/30 border border-amber-200/60 p-6 mb-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.08),transparent_50%)]" />
        <div className="relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mb-3 shadow-lg shadow-amber-200/50"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <RotateCcw className="h-8 w-8 text-white" />
            </motion.div>
          </motion.div>
          <h1 className="text-2xl font-bold mb-1">إعادة طلب سابق</h1>
          <p className="text-sm text-muted-foreground">
            أدخل رقم هاتفك لعرض كل طلباتك السابقة — اختر أحدها وعدّله قبل التأكيد
          </p>
        </div>
      </div>

      {/* البحث برقم الهاتف */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0XXX XXX XXX"
            className="pr-9 h-12 text-base"
            dir="ltr"
            type="tel"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 px-6 bg-neutral-900 hover:bg-neutral-800 text-white" disabled={loading}>
          {loading ? (
            <span className="animate-pulse">بحث...</span>
          ) : (
            <>
              <Search className="h-4 w-4" />
              عرض طلباتي
            </>
          )}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground mb-6">
        🔒 يُستخدم رقم هاتفك فقط لاسترجاع طلباتك السابقة — تُحذف تلقائياً بعد 10 أيام
      </p>

      {/* النتائج - حالة فارغة محسّنة */}
      {searched && !loading && orders.length === 0 && (
        <Card>
          <CardContent className="py-20 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-base font-semibold mb-1 text-foreground">لا توجد طلبات سابقة لهذا الرقم</p>
            <p className="text-sm text-muted-foreground mb-1">
              تأكد من الرقم أو ابدأ طلبك الأول من جديد
            </p>
            <p className="text-xs text-muted-foreground/70">
              ملاحظة: تُحذف الطلبات تلقائياً بعد 10 أيام من تاريخ إنشائها
            </p>
          </CardContent>
        </Card>
      )}

      {orders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">
              {orders.length} طلب سابق
            </h2>
            <span className="text-xs text-muted-foreground">اختر طلباً لتعديله وإرساله من جديد</span>
          </div>
          <div className="space-y-3">
            {orders.map((o) => (
              <RepeatOrderCard key={o.id} order={o} onRepeat={onRepeat} />
            ))}
          </div>
        </div>
      )}

      {/* رابط طلب جديد */}
      {searched && !loading && (
        <div className="text-center mt-6">
          <button
            onClick={() => onRepeat(null)}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            لا توجد طلبات؟ ابدأ طلب جديد
          </button>
        </div>
      )}
    </div>
  );
}

function RepeatOrderCard({
  order,
  onRepeat,
}: {
  order: PrintOrderLite;
  onRepeat: (o: PrintOrderLite) => void;
}) {
  const meta = STATUS_META[order.status];
  const serviceEmoji: Record<string, string> = {
    document: "🖨️",
    photo: "🖼️",
    binding: "📚",
    copy: "📄",
    card: "🪪",
    poster: "📜",
  };
  const borderClass = STATUS_BORDER[order.status] || "border-r-amber-500";

  return (
    <Card className={`hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden border-r-[3px] ${borderClass}`}>
      <CardContent className="p-0">
        <div className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0">
            <span className="text-xl">{serviceEmoji[order.serviceType] || "🖨️"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-bold text-sm">{serviceEmoji[order.serviceType] || "🖨️"} {order.serviceName}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.bg}`}>
                {meta.label}
              </span>
            </div>
            {/* اسم العميل */}
            {order.customer?.name && (
              <div className="text-xs text-muted-foreground mb-1">
                👤 {order.customer.name}
              </div>
            )}
            <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
              <span className="font-mono">{order.reference}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateTimeAr(order.createdAt)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span>{order.pages} صفحة · {order.copies} نسخة</span>
              {order.fileName && (
                <span className="flex items-center gap-1 truncate max-w-[150px]">
                  <FileText className="h-3 w-3" />
                  {order.fileName}
                </span>
              )}
            </div>
          </div>
          <div className="text-left shrink-0">
            <div className="text-xs text-muted-foreground">المجموع</div>
            <div className="font-bold text-amber-700">{formatDA(order.total)}</div>
          </div>
          <Button
            size="sm"
            className="shrink-0 bg-neutral-900 hover:bg-neutral-800 text-white"
            onClick={() => {
              onRepeat(order);
              toast.success("تم تحميل الطلب للتعديل", {
                description: "عدّل ما تريد ثم أكّد الطلب الجديد",
              });
            }}
          >
            <RotateCcw className="h-4 w-4" />
            تعديل وإعادة
          </Button>
        </div>
        {/* تفاصيل سريعة */}
        <div className="px-4 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
          <Detail label="الطباعة" value={order.options.color === "color" ? "ملون" : "أبيض وأسود"} />
          <Detail label="الورق" value={`${order.options.paperSize} · ${order.options.paperType}`} />
          <Detail label="التجليد" value={order.options.binding === "none" ? "بدون" : order.options.binding} />
          <Detail label="النسخ" value={`${order.copies}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted/40 px-2 py-1">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}