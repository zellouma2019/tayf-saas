"use client";

import { useState } from "react";
import { FileText, Download, Calendar, BarChart2, Users, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ReportFormat = "PDF" | "Excel";
type ReportStatus = "ready" | "building" | "expired";

interface Report {
  id: string;
  title: string;
  icon: typeof FileText;
  iconColor: string;
  iconBg: string;
  lastGenerated: string;
  format: ReportFormat;
  status: ReportStatus;
  size: string;
}

interface TimelineEntry {
  name: string;
  date: string;
  format: ReportFormat;
}

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string; dotColor: string }> = {
  ready: { label: "جاهز", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", dotColor: "bg-emerald-500" },
  building: { label: "قيد الإنشاء", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40", dotColor: "bg-amber-500" },
  expired: { label: "منتهي", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-950/40", dotColor: "bg-rose-500" },
};

const REPORTS: Report[] = [
  { id: "r1", title: "تقرير المبيعات الأسبوعي", icon: BarChart2, iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-50 dark:bg-emerald-950/40", lastGenerated: "2025-01-14", format: "PDF", status: "ready", size: "2.4 MB" },
  { id: "r2", title: "تقرير المخزون الشهري", icon: FileText, iconColor: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-50 dark:bg-amber-950/40", lastGenerated: "2025-01-01", format: "Excel", status: "ready", size: "1.8 MB" },
  { id: "r3", title: "تقرير الأداء المالي", icon: BarChart2, iconColor: "text-sky-600 dark:text-sky-400", iconBg: "bg-sky-50 dark:bg-sky-950/40", lastGenerated: "2025-01-10", format: "PDF", status: "expired", size: "3.1 MB" },
  { id: "r4", title: "تقرير رضا العملاء", icon: Users, iconColor: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-50 dark:bg-violet-950/40", lastGenerated: "2025-01-13", format: "PDF", status: "ready", size: "1.2 MB" },
  { id: "r5", title: "تقرير كفاءة الإنتاج", icon: Printer, iconColor: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-50 dark:bg-rose-950/40", lastGenerated: "2024-12-20", format: "Excel", status: "expired", size: "4.5 MB" },
  { id: "r6", title: "تقرير مصادر العملاء", icon: Users, iconColor: "text-teal-600 dark:text-teal-400", iconBg: "bg-teal-50 dark:bg-teal-950/40", lastGenerated: "2025-01-14", format: "PDF", status: "building", size: "—" },
];

const RECENT_REPORTS: TimelineEntry[] = [
  { name: "تقرير المبيعات الأسبوعي", date: "2025-01-14 09:30", format: "PDF" },
  { name: "تقرير رضا العملاء", date: "2025-01-13 16:15", format: "PDF" },
  { name: "تقرير الأداء المالي", date: "2025-01-10 11:00", format: "PDF" },
  { name: "تقرير المخزون الشهري", date: "2025-01-01 08:45", format: "Excel" },
];

export function QuickReportsWidget() {
  const [buildingId, setBuildingId] = useState<string | null>("r6");

  const handleGenerate = (id: string) => {
    setBuildingId(id);
    setTimeout(() => setBuildingId(null), 3000);
  };

  return (
    <Card className="rounded-xl border border-border/50 overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            التقارير السريعة
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5">
            {REPORTS.length} تقرير
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Report Cards Grid */}
        <div className="grid grid-cols-2 gap-2">
          {REPORTS.map((report) => {
            const isActive = buildingId === report.id;
            const statusConf = STATUS_CONFIG[isActive ? "building" : report.status];
            const ReportIcon = report.icon;

            return (
              <div
                key={report.id}
                className={`rounded-xl border p-3 transition-all duration-200 hover:shadow-sm ${
                  isActive
                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/50 dark:border-amber-700/30"
                    : "bg-card border-border/50 hover:bg-muted/30"
                }`}
              >
                {/* Icon & Title */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg ${report.iconBg} flex items-center justify-center shrink-0`}>
                    <ReportIcon className={`h-3.5 w-3.5 ${report.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">{report.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${statusConf.dotColor} ${isActive ? "animate-pulse" : ""}`} />
                      <span className={`text-[9px] ${statusConf.color}`}>{statusConf.label}</span>
                    </div>
                  </div>
                </div>

                {/* Meta Row */}
                <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-2">
                  <span className="font-mono">{report.lastGenerated}</span>
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 font-mono">
                    {report.format}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleGenerate(report.id)}
                    disabled={isActive}
                    className={`flex-1 text-[9px] font-medium py-1.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary/10 text-primary hover:bg-primary/20 active:scale-[0.97]"
                    }`}
                  >
                    {isActive ? "⏳ جارٍ الإنشاء..." : "إنشاء"}
                  </button>
                  {report.status === "ready" && (
                    <button className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-all duration-200 active:scale-95">
                      <Download className="h-3 w-3" />
                    </button>
                  )}
                  <button className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 active:scale-95">
                    <Calendar className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Last Reports Timeline */}
        <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
          <p className="text-[10px] font-medium text-muted-foreground mb-2.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            آخر التقارير المُنشأة
          </p>
          <div className="relative space-y-0">
            {/* Timeline Line */}
            <div className="absolute right-[3px] top-2 bottom-2 w-px bg-border" />

            {RECENT_REPORTS.map((item, i) => (
              <div key={i} className="relative flex items-center justify-between pr-5 py-2">
                <div className="absolute right-[1px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-primary/20" />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[11px] font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] text-muted-foreground font-mono">{item.date.split(" ")[1]}</span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 font-mono">
                    {item.format}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
