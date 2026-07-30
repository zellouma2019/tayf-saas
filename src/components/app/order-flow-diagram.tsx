"use client";

import { motion } from "framer-motion";
import { GitBranch, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STAGES = [
  { label: "طلب جديد", pct: 100, color: "#6366f1", dropoff: null },
  { label: "قيد المراجعة", pct: 85, color: "#3b82f6", dropoff: 15 },
  { label: "قيد الطباعة", pct: 70, color: "#f59e0b", dropoff: 15 },
  { label: "فحص الجودة", pct: 60, color: "#f97316", dropoff: 10 },
  { label: "مكتمل", pct: 55, color: "#10b981", dropoff: 5 },
];

export function OrderFlowDiagram() {
  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <GitBranch className="h-4 w-4 text-primary" />
          مسار معالجة الطلبات
        </CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        <div className="flex items-center justify-between gap-1 mb-6">
          {STAGES.map((stage, i) => (
            <motion.div
              key={stage.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="relative w-full">
                <motion.div
                  className="mx-auto rounded-lg text-center py-3 px-2 text-white font-bold text-sm relative overflow-hidden"
                  style={{
                    background: stage.color,
                    width: `${70 + stage.pct * 0.3}%`,
                    maxWidth: "100%",
                  }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.15 + 0.2, duration: 0.5, ease: "easeOut" }}
                >
                  <div className="relative z-10">{stage.pct}%</div>
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: i * 0.5 }}
                  />
                </motion.div>
                {stage.dropoff !== null && (
                  <div className="absolute top-1/2 -translate-y-1/2 -left-3 z-10">
                    <span className="text-[9px] bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold">-{stage.dropoff}%</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight">{stage.label}</span>
              {i < STAGES.length - 1 && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground/40 text-lg hidden sm:block">←</div>
              )}
            </motion.div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-border">
          <Timer className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            متوسط وقت المعالجة: <span className="font-bold text-foreground">4.2 ساعات</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
