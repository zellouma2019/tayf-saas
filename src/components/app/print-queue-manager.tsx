"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Pause,
  XCircle,
  SkipForward,
  Printer,
  Clock,
  CheckCircle2,
  Zap,
  Layers,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JobStatus = "waiting" | "printing" | "done";
type Priority = "normal" | "urgent" | "vip";

interface PrintJob {
  id: string;
  client: string;
  service: string;
  pages: number;
  status: JobStatus;
  priority: Priority;
}

const MOCK_JOBS: PrintJob[] = [
  { id: "#1042", client: "شركة الأمل", service: "طباعة مستندات", pages: 120, status: "waiting", priority: "normal" },
  { id: "#1043", client: "مؤسسة النور", service: "طباعة كروت", pages: 500, status: "waiting", priority: "urgent" },
  { id: "#1044", client: "مدرسة المستقبل", service: "طباعة ملصقات", pages: 80, status: "waiting", priority: "vip" },
  { id: "#1039", client: "مكتبة الإبداع", service: "طباعة صور", pages: 200, status: "printing", priority: "normal" },
  { id: "#1040", client: "عيادة الشفاء", service: "طباعة بانرات", pages: 15, status: "printing", priority: "urgent" },
  { id: "#1035", client: "شركة البركة", service: "طباعة مستندات", pages: 300, status: "done", priority: "normal" },
];

const STATUS_CONFIG: Record<JobStatus, { label: string; icon: React.ElementType; color: string; bg: string; dotColor: string }> = {
  waiting: {
    label: "في الانتظار",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    dotColor: "bg-amber-500",
  },
  printing: {
    label: "قيد الطباعة",
    icon: Printer,
    color: "text-primary dark:text-primary",
    bg: "bg-primary/10 dark:bg-primary/20",
    dotColor: "bg-primary",
  },
  done: {
    label: "مكتمل",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    dotColor: "bg-emerald-500",
  },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; badgeClass: string }> = {
  normal: {
    label: "عادي",
    badgeClass: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-0",
  },
  urgent: {
    label: "عاجل",
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0",
  },
  vip: {
    label: "مميز",
    badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0 font-black",
  },
};

const SECTIONS: { key: JobStatus; label: string }[] = [
  { key: "waiting", label: "في الانتظار" },
  { key: "printing", label: "قيد الطباعة" },
  { key: "done", label: "مكتمل" },
];

export function PrintQueueManager() {
  const [jobs, setJobs] = useState<PrintJob[]>(MOCK_JOBS);

  const totalJobs = jobs.length;
  const printingJobs = jobs.filter((j) => j.status === "printing");
  const waitingJobs = jobs.filter((j) => j.status === "waiting");
  const totalPagesPrinting = printingJobs.reduce((s, j) => s + j.pages, 0);
  const pagesPerMin = 12;
  const estMinutes = totalPagesPrinting > 0 ? Math.ceil(totalPagesPrinting / pagesPerMin) : 0;

  const handleAction = (jobId: string, action: "pause" | "cancel" | "skip") => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        if (action === "pause") return { ...j, status: "waiting" as JobStatus };
        if (action === "cancel") return { ...j, status: "done" as JobStatus };
        if (action === "skip") return { ...j, status: "done" as JobStatus };
        return j;
      })
    );
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <CardTitle className="text-base font-bold">إدارة طابور الطباعة</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{pagesPerMin} صفحة/دقيقة</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {totalJobs} وظيفة
            </Badge>
            {estMinutes > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>~{estMinutes} دقيقة</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {SECTIONS.map((section) => {
          const sectionJobs = jobs.filter((j) => j.status === section.key);
          const cfg = STATUS_CONFIG[section.key];
          const SectionIcon = cfg.icon;

          if (sectionJobs.length === 0) return null;

          return (
            <div key={section.key}>
              {/* Section header */}
              <div className="flex items-center gap-2 mb-2">
                <SectionIcon className={cn("w-4 h-4", cfg.color)} />
                <h3 className="text-sm font-bold">{section.label}</h3>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] h-5", cfg.bg, cfg.color, "border-0")}
                >
                  {sectionJobs.length}
                </Badge>
              </div>

              {/* Job rows */}
              <div className="space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {sectionJobs.map((job) => {
                    const priorityCfg = PRIORITY_CONFIG[job.priority];
                    const isPrinting = job.status === "printing";

                    return (
                      <motion.div
                        key={job.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                          isPrinting && "border-primary/30 bg-primary/5",
                          !isPrinting && "bg-card hover:bg-muted/50"
                        )}
                      >
                        {/* Drag handle */}
                        <div className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab shrink-0">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Priority badge */}
                        <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 shrink-0", priorityCfg.badgeClass)}>
                          {priorityCfg.label}
                        </Badge>

                        {/* Job info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold font-mono">{job.id}</span>
                            {isPrinting && (
                              <motion.div
                                className="w-2 h-2 rounded-full bg-primary"
                                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {job.client} — {job.service}
                          </p>
                        </div>

                        {/* Pages */}
                        <div className="text-center shrink-0 hidden sm:block">
                          <p className="text-sm font-bold">{job.pages}</p>
                          <p className="text-[10px] text-muted-foreground">صفحة</p>
                        </div>

                        {/* Status dot + label */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className={cn("w-2 h-2 rounded-full", cfg.dotColor)} />
                          <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
                        </div>

                        {/* Actions */}
                        {job.status !== "done" && (
                          <div className="flex items-center gap-1 shrink-0">
                            {isPrinting && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                onClick={() => handleAction(job.id, "pause")}
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                              onClick={() => handleAction(job.id, "cancel")}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={() => handleAction(job.id, "skip")}
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}

                        {job.status === "done" && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* Summary footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{waitingJobs.length} في الانتظار</span>
            <span>{printingJobs.length} جارٍ الطباعة</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>الوقت المتوقع: ~{estMinutes} دقيقة</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
