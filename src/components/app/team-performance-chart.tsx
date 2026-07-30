"use client";

import { motion } from "framer-motion";
import { Users, Clock, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TEAM = [
  { name: "أحمد", role: "طباعة", pct: 95, tasks: 156, avgTime: "2.3 س", rating: 4.9 },
  { name: "فاطمة", role: "تصميم", pct: 88, tasks: 142, avgTime: "2.8 س", rating: 4.7 },
  { name: "محمد", role: "خدمة العملاء", pct: 76, tasks: 98, avgTime: "3.1 س", rating: 4.5 },
  { name: "سارة", role: "فحص الجودة", pct: 92, tasks: 134, avgTime: "2.5 س", rating: 4.8 },
  { name: "يوسف", role: "تسليم", pct: 83, tasks: 89, avgTime: "3.4 س", rating: 4.4 },
];

function barColor(pct: number) {
  if (pct >= 90) return "bg-emerald-500 dark:bg-emerald-400";
  if (pct >= 80) return "bg-blue-500 dark:bg-blue-400";
  if (pct >= 70) return "bg-amber-500 dark:bg-amber-400";
  return "bg-rose-500 dark:bg-rose-400";
}

function barBg(pct: number) {
  if (pct >= 90) return "bg-emerald-500/10";
  if (pct >= 80) return "bg-blue-500/10";
  if (pct >= 70) return "bg-amber-500/10";
  return "bg-rose-500/10";
}

export function TeamPerformanceChart() {
  const avgPct = Math.round(TEAM.reduce((a, m) => a + m.pct, 0) / TEAM.length);

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <Users className="h-4 w-4 text-primary" />
          أداء فريق العمل
          <span className="text-[10px] text-muted-foreground font-normal mr-auto">متوسط: {avgPct}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" dir="rtl">
        {TEAM.map((member, i) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="group"
          >
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {member.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium text-foreground">{member.name}</span>
                  <span className="text-xs font-bold tabular-nums text-foreground">{member.pct}%</span>
                </div>
                <div className={cn("h-2 rounded-full overflow-hidden", barBg(member.pct))}>
                  <motion.div
                    className={cn("h-full rounded-full", barColor(member.pct))}
                    initial={{ width: 0 }}
                    animate={{ width: `${member.pct}%` }}
                    transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 pr-11 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{member.avgTime}</span>
              <span>{member.tasks} مهمة</span>
              <span className="flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-amber-500" />{member.rating}
              </span>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
