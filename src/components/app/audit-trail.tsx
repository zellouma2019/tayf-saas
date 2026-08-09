"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Clock, Shield, User, Package, Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ===== أنواع البيانات =====
type AuditAction = "create" | "update" | "delete";
type AuditTarget = "shop" | "order" | "admin" | "settings" | "feature";

interface AuditEntry {
  id: string;
  action: AuditAction;
  target: AuditTarget;
  targetLabel: string;
  adminName: string;
  timestamp: string;
  details?: string;
}

// ===== بيانات تجريبية (Mock Data) =====
const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: "1",
    action: "create",
    target: "shop",
    targetLabel: "مطبعة الأمل",
    adminName: "أحمد",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    details: "تم إنشاء متجر جديد",
  },
  {
    id: "2",
    action: "update",
    target: "order",
    targetLabel: "ORD-2847",
    adminName: "سارة",
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    details: "تحديث حالة الطلب إلى 'جاهز'",
  },
  {
    id: "3",
    action: "delete",
    target: "order",
    targetLabel: "ORD-2831",
    adminName: "أحمد",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    details: "حذف طلب ملغي",
  },
  {
    id: "4",
    action: "update",
    target: "settings",
    targetLabel: "إعدادات المنصة",
    adminName: "أحمد",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    details: "تحديث شعار المنصة",
  },
  {
    id: "5",
    action: "create",
    target: "order",
    targetLabel: "ORD-2852",
    adminName: "فاطمة",
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    details: "طلب طباعة مستندات جديد",
  },
  {
    id: "6",
    action: "update",
    target: "shop",
    targetLabel: "مطبعة النور",
    adminName: "سارة",
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    details: "تحديث بيانات المتجر",
  },
  {
    id: "7",
    action: "create",
    target: "admin",
    targetLabel: "عضو فريق جديد",
    adminName: "أحمد",
    timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    details: "إضافة محمد إلى فريق الإدارة",
  },
  {
    id: "8",
    action: "update",
    target: "feature",
    targetLabel: "المميزات",
    adminName: "أحمد",
    timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    details: "تفعيل ميزة التحليلات المتقدمة",
  },
];

// ===== أيقونات الإجراءات =====
const ACTION_ICONS: Record<AuditAction, React.ComponentType<{ className?: string }>> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
};

const ACTION_COLORS: Record<AuditAction, string> = {
  create: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  update: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  delete: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const ACTION_LABELS: Record<AuditAction, string> = {
  create: "إنشاء",
  update: "تحديث",
  delete: "حذف",
};

const TARGET_ICONS: Record<AuditTarget, React.ComponentType<{ className?: string }>> = {
  shop: Store,
  order: Package,
  admin: User,
  settings: Shield,
  feature: Shield,
};

// ===== تنسيق الوقت النسبي =====
function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  if (diffHour < 24) return `منذ ${diffHour} ساعة`;
  return `منذ ${diffDay} يوم`;
}

// ===== المكون الرئيسي =====
export function AuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // محاكاة تحميل البيانات (Mock) — لاحقاً سنربطها بقاعدة البيانات
    const timer = setTimeout(() => {
      setEntries(MOCK_AUDIT_ENTRIES);
      setLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // الحالة الفارغة
  if (loaded && entries.length === 0) {
    return (
      <Card className="bg-card rounded-xl border border-border shadow-sm card-glow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
            <Shield className="h-4 w-4 text-primary" />
            سجل الإجراءات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-10 flex flex-col items-center text-muted-foreground">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Clock className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium">لا توجد إجراءات مسجلة بعد</p>
            <p className="text-xs text-muted-foreground/60 mt-1">ستظهر هنا آخر إجراءات المديرين</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm card-glow card-frosted glass-subtle">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <Shield className="h-4 w-4 text-primary" />
          سجل الإجراءات
          <span className="text-[10px] text-muted-foreground font-normal mr-auto">
            آخر {entries.length} إجراءات
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 sm:px-5 py-3">
          {loaded && entries.map((entry, index) => {
            const ActionIcon = ACTION_ICONS[entry.action];
            const TargetIcon = TARGET_ICONS[entry.target];
            const isFirst = index === 0;

            return (
              <div key={entry.id} className="relative flex gap-3">
                {/* الموصل العمودي */}
                {index < entries.length - 1 && (
                  <div className="absolute top-8 right-[15px] bottom-0 w-[2px] bg-border progress-step" />
                )}

                {/* نقطة الإجراء */}
                <div className="relative z-10 shrink-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full border flex items-center justify-center",
                      ACTION_COLORS[entry.action],
                      isFirst && "status-dot-animated ring-2 ring-offset-2 ring-offset-background",
                      isFirst && entry.action === "create" && "ring-emerald-500/30",
                      isFirst && entry.action === "update" && "ring-amber-500/30",
                      isFirst && entry.action === "delete" && "ring-rose-500/30"
                    )}
                  >
                    <ActionIcon className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* محتوى الإجراء */}
                <div className="flex-1 min-w-0 pb-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">
                          {entry.adminName}
                        </span>
                        <span className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded-md border",
                          ACTION_COLORS[entry.action]
                        )}>
                          {ACTION_LABELS[entry.action]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <TargetIcon className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">
                          {entry.targetLabel}
                        </span>
                      </div>
                      {entry.details && (
                        <p className="text-[11px] text-muted-foreground/60 mt-1 truncate">
                          {entry.details}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 shrink-0 tabular-nums flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatTimeAgo(entry.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* حالة التحميل */}
          {!loaded && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-2 bg-muted/50 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
