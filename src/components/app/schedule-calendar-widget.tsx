"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const MONTH_NAMES = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

const MOCK_EVENTS: Record<string, { label: string; color: string }[]> = {
  "2026-07-29": [{ label: "3 طلبات مستندات", color: "bg-indigo-500" }, { label: "طباعة صور", color: "bg-blue-500" }],
  "2026-07-30": [{ label: "2 تجليد", color: "bg-amber-500" }],
  "2026-07-31": [{ label: "بانر متجر", color: "bg-rose-500" }, { label: "كروت شخصية", color: "bg-emerald-500" }],
  "2026-08-01": [{ label: "تقرير سنوي", color: "bg-violet-500" }],
};

export function ScheduleCalendarWidget() {
  const [date, setDate] = useState(new Date(2026, 6, 29));
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = 29;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = () => setDate(new Date(year, month - 1, 1));
  const next = () => setDate(new Date(year, month + 1, 1));

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <Calendar className="h-4 w-4 text-primary" />
          جدول المواعيد
        </CardTitle>
      </CardHeader>
      <CardContent dir="rtl">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prev} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-foreground">{MONTH_NAMES[month]} {year}</span>
          <button onClick={next} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-7 gap-0.5"
          >
            {cells.map((day, idx) => {
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
              const events = day ? (MOCK_EVENTS[dateStr] || []) : [];
              const isToday = day === today;
              return (
                <div
                  key={idx}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-colors min-h-[36px]",
                    day && "hover:bg-muted cursor-pointer",
                    !day && "opacity-0",
                    isToday && "bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                  )}
                >
                  {day && <span className={cn("tabular-nums", !isToday && "text-foreground")}>{day}</span>}
                  {events.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {events.map((e, ei) => (
                        <span key={ei} className={cn("w-1 h-1 rounded-full", e.color)} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 space-y-1.5 border-t border-border pt-3">
          <p className="text-[10px] text-muted-foreground font-medium">مواعيد اليوم</p>
          {(MOCK_EVENTS["2026-07-29"] || []).map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={cn("w-2 h-2 rounded-full", e.color)} />
              <span className="text-foreground">{e.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
