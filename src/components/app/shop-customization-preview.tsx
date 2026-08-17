"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShop } from "@/lib/shop-context";
import { Search, Clock, Package, CheckCircle2, Printer, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: "قيد الانتظار", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400", icon: Clock },
  printing: { label: "يطبع", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400", icon: Printer },
  ready: { label: "جاهز", color: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400", icon: Package },
  delivered: { label: "تم التسليم", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400", icon: CheckCircle2 },
  cancelled: { label: "ملغى", color: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400", icon: XCircle },
};

interface OrderItem {
  id: string;
  reference: string;
  serviceName: string;
  customer: { name: string; phone: string };
  status: string;
  total: number;
  createdAt: string;
}

export default function ShopCustomizationPreview() {
  const { shop } = useShop();
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackingRef, setTrackingRef] = useState("");

  const loadOrders = useCallback(async () => {
    if (!shop?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ shopId: shop.id, limit: "20" });
      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [shop?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.reference.toLowerCase().includes(q) ||
      (o.customer?.name || "").toLowerCase().includes(q) ||
      (o.customer?.phone || "").includes(q)
    );
  });

  const trackedOrder = trackingRef
    ? orders.find((o) => o.reference.toLowerCase() === trackingRef.toLowerCase())
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">متابعة الطلبات</h3>
          <p className="text-sm text-muted-foreground mt-1">تتبع حالة الطلبات في الوقت الحقيقي</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadOrders} disabled={loading} className="gap-1.5">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          تحديث
        </Button>
      </div>

      {/* تتبع بالرقم */}
      <div className="bg-card border border-gold-500/10 dark:border-gold-500/15 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 sm:p-6">
        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-foreground">
          <Search className="h-4 w-4 text-gold-500" />
          تتبع طلب برقمه
        </h4>
        <div className="flex gap-2">
          <Input
            placeholder="أدخل رقم الطلب مثل A-1050"
            value={trackingRef}
            onChange={(e) => setTrackingRef(e.target.value)}
            className="flex-1"
            dir="ltr"
          />
        </div>
        {trackedOrder && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-lg border border-border/50 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-sm font-bold">{trackedOrder.reference}</p>
                <p className="text-xs text-muted-foreground">{trackedOrder.serviceName} — {trackedOrder.customer?.name}</p>
              </div>
              <Badge className={STATUS_META[trackedOrder.status]?.color || ""}>
                {STATUS_META[trackedOrder.status]?.label || trackedOrder.status}
              </Badge>
            </div>
          </motion.div>
        )}
        {trackingRef && !trackedOrder && !loading && (
          <p className="text-xs text-muted-foreground mt-3">لم يتم العثور على طلب بهذا الرقم</p>
        )}
      </div>

      {/* قائمة الطلبات الأخيرة */}
      <div className="bg-card border border-gold-500/10 dark:border-gold-500/15 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="p-4 sm:p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Package className="h-4 w-4 text-gold-500" />
              آخر الطلبات
            </h4>
            <Badge variant="secondary" className="text-xs">{filteredOrders.length}</Badge>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالرقم أو الاسم أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 h-10 rounded-lg"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
              <p className="text-xs text-muted-foreground mt-2">جارٍ التحميل...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-8 w-8 opacity-30" />
              <p className="text-sm mt-2">لا توجد طلبات</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const meta = STATUS_META[order.status] || STATUS_META.pending;
                const IconComp = meta.icon;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 sm:p-4 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", meta.color.split(" ")[0])}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{order.reference}</span>
                          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", meta.color)}>{meta.label}</Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{order.serviceName}</p>
                        <p className="text-xs text-muted-foreground">{order.customer?.name} — {order.customer?.phone}</p>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-bold tabular-nums">{order.total} د.ج</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
