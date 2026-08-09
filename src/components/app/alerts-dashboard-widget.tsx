"use client";

import { motion } from "framer-motion";
import { Zap, Package, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AlertItem {
  id: string;
  type: "urgent" | "warning" | "info";
  title: string;
  description: string;
  time: string;
  action?: string;
}

const ALERTS: AlertItem[] = [
  { id: "1", type: "urgent", title: "طلب متأخر #1047", description: "طلب طباعة مستندات متأخر 3 ساعات عن الموعد المحدد", time: "منذ 30 دقيقة", action: "عرض" },
  { id: "2", type: "warning", title: "حبر منخفض", description: "مستوى الحبر الأسود أقل من 15% في الطابعة رقم 2", time: "منذ ساعة", action: "إعادة طلب" },
  { id: "3", type: "info", title: "تقرير يومي جاهز", description: "تم إنشاء التقرير اليومي تلقائياً — 38 طلب", time: "منذ ساعتين", action: "عرض" },
  { id: "4", type: "warning", title: "عميل جديد بدون عنوان", description: "آخر 3 عملاء لم يدخلوا عنوان التوصيل", time: "منذ 3 ساعات" },
  { id: "5", type: "urgent", title: "طلب مميز #1052", description: "طلب عميل مميز يحتاج موافقة فورية — طباعة بانر", time: "منذ 5 دقائق", action: "موافقة" },
];

const TYPE_CONFIG = {
  urgent: { icon: <AlertTriangle className="h-4 w-4" />, bg: "bg-rose-50 dark:bg-rose-950/20", border: "border-rose-200 dark:border-rose-800/40", iconColor: "text-rose-600 dark:text-rose-400", badgeBg: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", label: "عاجل" },
  warning: { icon: <Clock className="h-4 w-4" />, bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800/40", iconColor: "text-amber-600 dark:text-amber-400", badgeBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "تنبيه" },
  info: { icon: <Zap className="h-4 w-4" />, bg: "bg-blue-50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800/40", iconColor: "text-blue-600 dark:text-blue-400", badgeBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "معلومات" },
};

export function AlertsDashboardWidget() {
  const urgentCount = ALERTS.filter((a) => a.type === "urgent").length;

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm fade-in-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
            <Zap className="h-4 w-4 text-primary" />
            لوحة التنبيهات
          </CardTitle>
          {urgentCount > 0 && (
            <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px] gap-1 animate-pulse">
              <AlertTriangle className="h-3 w-3" />
              {urgentCount} عاجل
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2" dir="rtl">
        {ALERTS.map((alert, i) => {
          const config = TYPE_CONFIG[alert.type];
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "rounded-xl border p-3 transition-colors hover:shadow-sm",
                config.bg, config.border
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 shrink-0", config.iconColor)}>{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                    <Badge className={cn("text-[9px] px-1 py-0", config.badgeBg)}>{config.label}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{alert.description}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                    {alert.action && (
                      <button className="text-[10px] font-medium text-primary hover:underline">
                        {alert.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
