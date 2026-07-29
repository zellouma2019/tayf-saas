"use client";

import { useMemo } from "react";
import {
  Package, Clock, CheckCircle, XCircle, Printer, Truck, Star, TrendingUp, AlertTriangle, BarChart3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { GlobalOrder } from "@/lib/admin-types";

interface ShopActivityFeedProps {
  shopName: string;
  orders: GlobalOrder[];
  limit?: number;
  className?: string;
}

const ACTIVITY_ICONS: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="h-3 w-3" />, color: "text-amber-500 bg-amber-50 dark:bg-amber-950", label: "طلب جديد" },
  confirmed: { icon: <CheckCircle className="h-3 w-3" />, color: "text-blue-500 bg-blue-50 dark:bg-blue-950", label: "تم التأكيد" },
  printing: { icon: <Printer className="h-3 w-3" />, color: "text-violet-500 bg-violet-50 dark:bg-violet-950", label: "بدأ الطباعة" },
  ready: { icon: <Package className="h-3 w-3" />, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950", label: "جاهز للاستلام" },
  delivered: { icon: <Truck className="h-3 w-3" />, color: "text-green-600 bg-green-50 dark:bg-green-950", label: "تم التسليم" },
  cancelled: { icon: <XCircle className="h-3 w-3" />, color: "text-red-500 bg-red-50 dark:bg-red-950", label: "ملغى" },
};

function getTimeAgoShort(dateStr: string): string {
  const now = new Date().getTime();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  if (hours < 24) return `منذ ${hours} س`;
  if (days < 7) return `منذ ${days} ي`;
  return new Date(dateStr).toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric' });
}

export function ShopActivityFeed({
  shopName, orders, limit = 10, className,
}: ShopActivityFeedProps) {
  const activities = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    return orders
      .slice(0, limit)
      .map(order => {
        const activityConfig = ACTIVITY_ICONS[order.status] || ACTIVITY_ICONS.pending;
        return {
          id: order.id,
          orderId: order.orderNumber || order.id.slice(0, 8),
          customerName: order.customerName || "زبون",
          status: order.status,
          statusLabel: activityConfig.label,
          icon: activityConfig.icon,
          color: activityConfig.color,
          total: order.total || 0,
          serviceType: order.serviceType || "",
          timeAgo: getTimeAgoShort(order.createdAt || order.updatedAt || new Date().toISOString()),
          timestamp: order.createdAt || order.updatedAt || new Date().toISOString(),
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orders, limit]);

  const stats = useMemo(() => {
    const total = orders.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => {
      const t = new Date(o.createdAt || o.updatedAt || "");
      return t >= today;
    }).length;
    const pending = orders.filter(o => o.status === "pending").length;
    const completed = orders.filter(o => o.status === "delivered" || o.status === "ready").length;
    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    return { total, todayOrders, pending, completed, revenue };
  }, [orders]);

  if (activities.length === 0) {
    return (
      <div className={cn("flex flex-col items-center py-8 text-muted-foreground", className)} dir="rtl">
        <BarChart3 className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">لا توجد نشاطات حديثة</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} dir="rtl">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "اليوم", value: stats.todayOrders, color: "text-primary" },
          { label: "معلّقة", value: stats.pending, color: "text-amber-600 dark:text-amber-400" },
          { label: "مكتملة", value: stats.completed, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "الإيرادات", value: `${(stats.revenue / 1000).toFixed(1)}k`, color: "text-foreground" },
        ].map((item, i) => (
          <div key={i} className="text-center p-1.5">
            <div className={cn("text-sm font-bold tabular-nums", item.color)}>{item.value}</div>
            <div className="text-[10px] text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>

      {/* النشاطات */}
      <div className="space-y-0">
        {activities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 40, duration: 0.2 }}
            className="feed-item flex items-start gap-2.5 py-2.5 border-b border-border/30 last:border-0"
          >
            {/* أيقونة الحالة */}
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              activity.color
            )}>
              {activity.icon}
            </div>

            {/* المحتوى */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-medium text-foreground truncate">
                  {activity.customerName}
                </span>
                <span className="text-[10px] text-muted-foreground">#{activity.orderId}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className={cn("font-medium", activity.color.split(" ")[0])}>
                  {activity.statusLabel}
                </span>
                <span>·</span>
                <span>{activity.total.toLocaleString('ar-DZ')} د.ج</span>
              </div>
            </div>

            {/* الوقت */}
            <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
              {activity.timeAgo}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
