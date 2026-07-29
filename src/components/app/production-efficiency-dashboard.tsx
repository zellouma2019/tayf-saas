"use client";

import { motion } from "framer-motion";
import {
  Printer, Check, AlertTriangle, Clock, BarChart3,
  Moon, Sun, Zap, TrendingUp, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductionEfficiencyDashboardProps {
  jobsCompleted: number;
  jobsPending: number;
  avgTime: number;
  efficiency: number;
  machineStatus: "online" | "offline" | "busy";
  shift: "morning" | "evening" | "night";
}

const SHIFT_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  morning: { label: "صباحي", icon: <Sun className="h-4 w-4" />, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
  evening: { label: "مسائي", icon: <Moon className="h-4 w-4" />, color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30" },
  night: { label: "ليلي", icon: <Zap className="h-4 w-4" />, color: "text-slate-600 bg-slate-100 dark:bg-slate-900/30" },
};

const MACHINE_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  online: { label: "متصل", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  offline: { label: "غير متصل", color: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  busy: { label: "مشغول", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
};

export function ProductionEfficiencyDashboard({
  jobsCompleted, jobsPending, avgTime, efficiency,
  machineStatus, shift,
}: ProductionEfficiencyDashboardProps) {
  const shiftInfo = SHIFT_LABELS[shift];
  const machineInfo = MACHINE_STATUS[machineStatus];
  const gaugeColor = efficiency >= 80 ? "#10b981" : efficiency >= 50 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (efficiency / 100) * circumference;

  return (
    <div className="space-y-4" dir="rtl">
      {/* حالة الماكينة + الوردية */}
      <div className="grid grid-cols-2 gap-3">
        <div className={cn("machine-card rounded-xl border p-4", machineStatus === "online" ? "machine-online border-emerald-200 dark:border-emerald-800/40" : machineStatus === "busy" ? "machine-busy border-amber-200 dark:border-amber-800/40" : "machine-offline border-rose-200 dark:border-rose-800/40 bg-rose-50/50 dark:bg-rose-950/10")}>
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("w-2.5 h-2.5 rounded-full", machineInfo.dot, "animate-pulse")} />
            <span className="text-xs font-bold text-foreground">حالة الآلة</span>
          </div>
          <div className="flex items-center gap-2">
            <Printer className={cn("h-5 w-5", machineInfo.color)} />
            <span className={cn("text-sm font-bold", machineInfo.color)}>{machineInfo.label}</span>
          </div>
        </div>
        <div className="shift-indicator rounded-xl border border-border p-4">
          <div className="text-xs font-bold text-foreground mb-2">الوردية الحالية</div>
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", shiftInfo.color)}>
              {shiftInfo.icon}
            </div>
            <span className="text-sm font-bold text-foreground">{shiftInfo.label}</span>
          </div>
        </div>
      </div>

      {/* مقياس الكفاءة */}
      <div className="efficiency-meter rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            مؤشر الكفاءة
          </h3>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", efficiency >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : efficiency >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300")}>
            {efficiency >= 80 ? "ممتاز" : efficiency >= 50 ? "جيد" : "يحتاج تحسين"}
          </span>
        </div>
        <div className="flex items-center justify-center">
          <svg width="120" height="70" viewBox="0 0 120 70">
            <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-muted/20" />
            <motion.path
              d="M 10 65 A 50 50 0 0 1 110 65"
              fill="none"
              stroke={gaugeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <text x="60" y="55" textAnchor="middle" className="fill-foreground" fontSize="20" fontWeight="bold">
              {efficiency}%
            </text>
          </svg>
        </div>
      </div>

      {/* عدّاد الوظائف */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="job-counter rounded-xl border border-border bg-card p-3 text-center"
        >
          <div className="text-[10px] text-muted-foreground mb-1">مكتملة</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{jobsCompleted}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="job-counter rounded-xl border border-border bg-card p-3 text-center"
        >
          <div className="text-[10px] text-muted-foreground mb-1">بانتظار</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">{jobsPending}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="job-counter rounded-xl border border-border bg-card p-3 text-center"
        >
          <div className="text-[10px] text-muted-foreground mb-1">متوسط الوقت</div>
          <div className="text-xl font-bold text-foreground tabular-nums">{avgTime}د</div>
        </motion.div>
      </div>

      {/* تنبيه — إذا كانت الكفاءة منخفضة */}
      {efficiency < 50 && (
        <div className="downtime-alert rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-950/20 p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
          <div>
            <div className="text-xs font-bold text-rose-700 dark:text-rose-400">انخفاض في الكفاءة</div>
            <div className="text-[11px] text-rose-600/70 dark:text-rose-400/60">يُنصح بفحص حالة الآلة وتقليل أوقات الانتظار</div>
          </div>
        </div>
      )}

      {/* ملخص الإنتاج */}
      <div className="production-summary rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-primary" />
          ملخص الإنتاج
        </h3>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">الإنتاجية اليومية</span>
          <span className="font-bold text-foreground flex items-center gap-1 tabular-nums">
            {jobsCompleted > 0 ? Math.round(jobsCompleted / Math.max(1, avgTime / 60)) : 0} وظيفة/ساعة
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          </span>
        </div>
      </div>
    </div>
  );
}
