"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTheme } from "next-themes";

const DAYS = [
  "السبت",
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
];

const TIME_SLOTS = [
  "صباح (8-12)",
  "ظهر (12-14)",
  "بعد الظهر (14-17)",
  "مساء (17-20)",
  "ليل (20-23)",
  "متأخر (23-8)",
];

// بيانات وهمية واقعية — كثافة أكبر أثناء ساعات العمل
const MOCK_DATA: number[][] = [
  [5, 8, 12, 9, 3, 0],    // السبت
  [7, 11, 16, 13, 4, 1],   // الأحد
  [9, 14, 20, 17, 6, 1],   // الاثنين
  [8, 12, 18, 15, 5, 0],   // الثلاثاء
  [10, 16, 22, 19, 8, 2],  // الأربعاء
  [6, 10, 14, 11, 4, 1],   // الخميس
  [1, 3, 5, 4, 2, 0],      // الجمعة
];

const MAX_VALUE = Math.max(...MOCK_DATA.flat());

function getHeatColor(value: number, isDark: boolean): string {
  if (value === 0) return isDark ? "bg-zinc-800/60" : "bg-zinc-100";
  const intensity = value / MAX_VALUE;
  if (intensity > 0.8) return isDark ? "bg-violet-700" : "bg-emerald-500";
  if (intensity > 0.6) return isDark ? "bg-violet-600" : "bg-emerald-400";
  if (intensity > 0.4) return isDark ? "bg-violet-500" : "bg-emerald-300";
  if (intensity > 0.2) return isDark ? "bg-violet-400" : "bg-emerald-200";
  return isDark ? "bg-violet-300/50" : "bg-emerald-100";
}

function getTextColor(value: number, isDark: boolean): string {
  const intensity = value / MAX_VALUE;
  if (intensity > 0.6) return "text-white";
  if (intensity > 0.3) return isDark ? "text-white/90" : "text-emerald-900";
  return isDark ? "text-foreground/70" : "text-foreground/50";
}

export function OrdersHeatmap() {
  const [hovered, setHovered] = useState<{ day: number; slot: number } | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <Flame className="h-4 w-4 text-emerald-500" />
          خريطة كثافة الطلبات
          <span className="text-[10px] text-muted-foreground font-normal mr-auto">يوم × فترة زمنية</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            {/* Column headers */}
            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: "80px repeat(6, 1fr)" }}>
              <div />
              {TIME_SLOTS.map((slot) => (
                <div key={slot} className="text-[10px] text-muted-foreground text-center font-medium truncate px-1">
                  {slot}
                </div>
              ))}
            </div>
            {/* Rows */}
            <div className="space-y-1">
              {DAYS.map((day, di) => (
                <div key={day} className="grid gap-1" style={{ gridTemplateColumns: "80px repeat(6, 1fr)" }}>
                  <div className="text-xs font-medium text-muted-foreground flex items-center">{day}</div>
                  {TIME_SLOTS.map((_, si) => {
                    const value = MOCK_DATA[di][si];
                    const isHovered = hovered?.day === di && hovered?.slot === si;
                    return (
                      <div
                        key={si}
                        className={cn(
                          "h-9 rounded-md flex items-center justify-center text-[11px] font-semibold tabular-nums transition-all duration-150 cursor-default",
                          getHeatColor(value, isDark),
                          getTextColor(value, isDark),
                          isHovered && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105"
                        )}
                        title={`${DAYS[di]} — ${TIME_SLOTS[si]}: ${value} طلب`}
                        onMouseEnter={() => setHovered({ day: di, slot: si })}
                        onMouseLeave={() => setHovered(null)}
                      >
                        {value}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-muted-foreground">
          <span>أقل</span>
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v, i) => (
            <div
              key={i}
              className={cn("w-5 h-3.5 rounded-sm", getHeatColor(Math.round(v * MAX_VALUE), isDark))}
            />
          ))}
          <span>أكثر</span>
        </div>

        {/* Tooltip */}
        {hovered && (
          <div className="fixed top-4 left-4 z-50 px-3 py-2 rounded-lg bg-popover border border-border shadow-lg text-xs pointer-events-none">
            <div className="font-semibold text-foreground">{DAYS[hovered.day]} — {TIME_SLOTS[hovered.slot]}</div>
            <div className="text-muted-foreground mt-0.5">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{MOCK_DATA[hovered.day][hovered.slot]}</span> طلب
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
