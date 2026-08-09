"use client";

import { motion } from "framer-motion";
import { Users, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const TEAM = [
  { name: "أحمد", role: "طباعة", tasks: 10, capacity: 12 },
  { name: "فاطمة", role: "تصميم", tasks: 8, capacity: 10 },
  { name: "محمد", role: "خدمة العملاء", tasks: 5, capacity: 8 },
  { name: "سارة", role: "فحص الجودة", tasks: 7, capacity: 8 },
  { name: "يوسف", role: "تسليم", tasks: 2, capacity: 10 },
];

const totalTasks = TEAM.reduce((a, m) => a + m.tasks, 0);

function capacityColor(pct: number) {
  if (pct <= 60) return "bg-emerald-500 dark:bg-emerald-400";
  if (pct <= 85) return "bg-amber-500 dark:bg-amber-400";
  return "bg-rose-500 dark:bg-rose-400";
}

function capacityBg(pct: number) {
  if (pct <= 60) return "bg-emerald-500/10 dark:bg-emerald-400/10";
  if (pct <= 85) return "bg-amber-500/10 dark:bg-amber-400/10";
  return "bg-rose-500/10 dark:bg-rose-400/10";
}

function capacityLabel(pct: number) {
  if (pct <= 60) return "text-emerald-600 dark:text-emerald-400";
  if (pct <= 85) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function TeamWorkloadWidget() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">حمل العمل</h3>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {totalTasks} مهمة نشطة
          </span>
        </div>
        <button className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <RefreshCw className="h-3 w-3" />
          إعادة توزيع
        </button>
      </div>

      {/* Members */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
        dir="rtl"
      >
        {TEAM.map((member) => {
          const pct = Math.round((member.tasks / member.capacity) * 100);
          return (
            <motion.div
              key={member.name}
              variants={item}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {member.name.charAt(0)}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-semibold text-foreground block">{member.name}</span>
                    <span className="text-[10px] text-muted-foreground">{member.role}</span>
                  </div>
                  <span className={cn("text-xs font-bold tabular-nums", capacityLabel(pct))}>
                    {member.tasks}/{member.capacity}
                  </span>
                </div>
                {/* Capacity bar */}
                <div className={cn("h-2 rounded-full overflow-hidden", capacityBg(pct))}>
                  <motion.div
                    className={cn("h-full rounded-full", capacityColor(pct))}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
