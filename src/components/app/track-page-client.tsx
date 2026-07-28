"use client";

import { useState, useEffect } from "react";
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
import { STATUS_META, formatDA, formatDateTimeAr } from "@/lib/print-config";
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

export function TrackPageClient() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<PrintOrderLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  // Fetch shops on mount
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
        {/* === Gradient Header === */}
        <div className="relative rounded-2xl bg-gradient-to-br from-violet-50 via-indigo-50 to-slate-50 dark:from-violet-950/30 dark:via-indigo-950/20 dark:to-slate-900/30 border border-border p-6 sm:p-8 text-center overflow-hidden">
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.08),transparent_50%)] pointer-events-none" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center mb-4 shadow-lg">
              <Package className="h-9 w-9 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              تتبّع الطلب
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              اختر المتجر ثم أدخل رقم الطلب أو رقم هاتفك لمعرفة حالة طلبك
            </p>
          </div>
        </div>

        {/* === Search Form === */}
        <form onSubmit={handleSearch} className="space-y-3">
          {/* Shop Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              اختر المتجر
            </label>
            <Select
              value={selectedShop}
              onValueChange={setSelectedShop}
              disabled={shopsLoading || shops.length === 0}
            >
              <SelectTrigger className="w-full h-11 text-sm">
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              رقم الطلب أو رقم الهاتف
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="مثال: A-1050 أو 0560..."
                  className="pr-9 h-11 text-sm"
                  dir="ltr"
                />
              </div>
              <Button
                type="submit"
                className="h-11 px-6 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-white"
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
        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-amber-500" />
          تلميح: أدخل رقم الطلب مثل A-1050 أو رقم هاتفك
        </p>

        {/* === Loading === */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center py-16 text-muted-foreground"
            >
              <Loader2 className="h-6 w-6 animate-spin text-violet-500 mb-3" />
              <p className="text-sm font-medium">جارٍ البحث عن طلبك...</p>
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
              <Card>
                <CardContent className="py-16 text-center">
                  <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium">لا توجد طلبات مطابقة</p>
                  <p className="text-xs text-muted-foreground mt-1">
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
              <p className="text-sm text-muted-foreground text-center">
                تم العثور على {orders.length} طلب
              </p>
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
        <Card className="border-border">
          <CardContent className="p-5 text-sm text-muted-foreground space-y-3">
            <p className="text-foreground font-medium">كيفية التتبّع؟</p>
            <ol className="space-y-2 text-start list-decimal list-inside">
              <li>اختر المتجر الذي أتممت منه الطلب من القائمة أعلاه</li>
              <li>أدخل رقم الطلب أو رقم الهاتف المستخدم</li>
              <li>اضغط على زر &quot;تتبّع&quot; لعرض النتائج</li>
            </ol>
          </CardContent>
        </Card>

        {/* === Back to Home === */}
        <div className="text-center pt-2">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

/* ───── Individual order card ───── */

function TrackedOrderCard({ order }: { order: PrintOrderLite }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const serviceEmoji = SERVICE_EMOJI[order.serviceType] || "🖨️";

  return (
    <Card className="overflow-hidden shadow-lg shadow-slate-200/40 dark:shadow-slate-900/40 hover:shadow-xl dark:hover:shadow-slate-800/50 transition-shadow duration-300">
      {/* Dark header strip */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b bg-neutral-900 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-900" />
            </div>
            <div className="min-w-0">
              <div className="font-mono font-bold text-sm text-amber-400 truncate">
                {order.reference}
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-300 truncate">
                {serviceEmoji} {order.serviceName}
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[11px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border whitespace-nowrap shrink-0 ${meta.bg}`}
          >
            {meta.emoji} {meta.label}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 space-y-3">
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

        {/* Status timeline summary */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span>
            آخر تحديث: {formatDateTimeAr(order.updatedAt)}
          </span>
        </div>
      </div>
    </Card>
  );
}

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
    <div className="rounded-lg bg-muted/30 p-2.5 border-r-[3px] border-r-amber-400/60 min-w-0">
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
