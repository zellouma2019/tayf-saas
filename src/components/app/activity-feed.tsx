"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  UserPlus,
  Store,
  Settings,
  CheckCircle2,
  Printer,
  Clock,
  Star,
  Tag,
  TrendingUp,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import type { PrintOrderLite } from "@/lib/order-types";
import { getTimeAgo } from "@/lib/admin-utils";

interface ActivityItem {
  id: string;
  type: "order_new" | "order_status" | "order_completed" | "shop_created" | "settings_change" | "payment" | "review";
  title: string;
  description: string;
  timestamp: Date;
  meta?: { amount?: string; status?: string; shopName?: string; customerName?: string };
}

interface ActivityFeedProps {
  orders: PrintOrderLite[];
  className?: string;
}

const ACTIVITY_ICONS: Record<string, { icon: typeof Package; color: string; bgColor: string }> = {
  order_new: { icon: Package, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  order_status: { icon: Printer, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  order_completed: { icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  shop_created: { icon: Store, color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-100 dark:bg-violet-900/30" },
  settings_change: { icon: Settings, color: "text-neutral-600 dark:text-neutral-400", bgColor: "bg-neutral-100 dark:bg-neutral-800" },
  payment: { icon: CreditCard, color: "text-gold-600 dark:text-gold-400", bgColor: "bg-gold-100 dark:bg-gold-900/30" },
  review: { icon: Star, color: "text-pink-600 dark:text-pink-400", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
};

export function ActivityFeed({ orders, className = "" }: ActivityFeedProps) {
  const activities = useMemo<ActivityItem[]>(() => {
    if (!orders || orders.length === 0) return [];

    const items: ActivityItem[] = [];

    // Process orders into activity items
    const recentOrders = orders.slice(0, 20);
    for (const order of recentOrders) {
      const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
      const updatedAt = order.updatedAt ? new Date(order.updatedAt) : createdAt;

      // New order activity
      items.push({
        id: `new-${order.id}`,
        type: "order_new",
        title: "طلب جديد",
        description: `${order.serviceName || "طباعة"} — ${order.customerName || "زبون"}`,
        timestamp: createdAt,
        meta: { amount: order.total?.toString(), shopName: order.shopName, customerName: order.customerName },
      });

      // Status change activity (if different from creation)
      if (updatedAt.getTime() - createdAt.getTime() > 60000) {
        items.push({
          id: `status-${order.id}`,
          type: order.status === "delivered" || order.status === "completed" ? "order_completed" : "order_status",
          title: order.status === "delivered" || order.status === "completed" ? "تم إنجاز الطلب" : "تحديث حالة",
          description: `${order.reference} — ${getStatusAr(order.status)}`,
          timestamp: updatedAt,
          meta: { status: order.status, shopName: order.shopName },
        });
      }
    }

    // Sort by timestamp descending
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return items.slice(0, 12);
  }, [orders]);

  if (activities.length === 0) {
    return (
      <div className={`empty-state ${className}`}>
        <div className="empty-state-icon">
          <Clock className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">لا يوجد نشاط حتى الآن</p>
        <p className="text-xs text-muted-foreground/60 mt-1">ستظهر التحديثات هنا تلقائياً</p>
      </div>
    );
  }

  return (
    <div className={`space-y-0 ${className}`}>
      <AnimatePresence initial={false}>
        {activities.map((item, index) => {
          const iconConfig = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.order_new;
          const IconComponent = iconConfig.icon;
          const isLatest = index === 0;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative flex gap-3 group"
            >
              {/* Timeline line */}
              <div className="flex flex-col items-center shrink-0">
                <div className={`timeline-dot ${isLatest ? "timeline-dot-active" : ""}`} />
                {index < activities.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-border to-transparent min-h-[24px]" />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-4 min-w-0 notif-hover rounded-lg p-2 transition-all hover:bg-muted/30 ${isLatest ? 'ring-1 ring-primary/10 bg-primary/[0.02]' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <div className={`w-8 h-8 rounded-lg ${iconConfig.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                    <IconComponent className={`h-4 w-4 ${iconConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {item.title}
                      </span>
                      {item.meta?.amount && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gold-100 dark:bg-gold-900/20 text-gold-700 dark:text-gold-400 font-bold">
                          {item.meta.amount} د.ج
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      {getTimeAgo(item.timestamp.toISOString())}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function getStatusAr(status: string): string {
  const map: Record<string, string> = {
    pending: "بانتظار الطباعة",
    confirmed: "تم التأكيد",
    printing: "جارٍ الطباعة",
    ready: "جاهز للاستلام",
    delivered: "تم التسليم",
    completed: "مكتمل",
    cancelled: "ملغى",
  };
  return map[status] || status;
}
