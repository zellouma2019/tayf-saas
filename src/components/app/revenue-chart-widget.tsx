"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const REVENUE = [420000, 380000, 510000, 470000, 620000, 580000, 710000, 690000, 750000, 820000, 780000, 890000];
const TOTAL = REVENUE.reduce((a, b) => a + b, 0);
const GROWTH = 18.5;

function formatCurrency(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(v);
}

export function RevenueChartWidget() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimProgress(1));
    return () => cancelAnimationFrame(frame);
  }, []);

  const w = 600, h = 260, pad = { t: 20, r: 20, b: 40, l: 60 };
  const chartW = w - pad.l - pad.r;
  const chartH = h - pad.t - pad.b;
  const maxVal = Math.max(...REVENUE) * 1.15;
  const points = REVENUE.map((v, i) => ({
    x: pad.l + (i / (REVENUE.length - 1)) * chartW,
    y: pad.t + chartH - (v / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${pad.t + chartH} L${points[0].x},${pad.t + chartH} Z`;

  const stepCount = 4;
  const yTicks = Array.from({ length: stepCount + 1 }, (_, i) => {
    const val = (maxVal / stepCount) * (stepCount - i);
    return { y: pad.t + (i / stepCount) * chartH, label: formatCurrency(val) };
  });

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm chart-container fade-in-up">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <TrendingUp className="h-4 w-4 text-primary" />
          الرسوم البيانية للإيرادات
        </CardTitle>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(TOTAL)} د.ج</p>
            <p className="text-xs text-muted-foreground">إجمالي إيرادات السنة</p>
          </div>
          <Badge className={cn("gap-1", GROWTH >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400")}>
            {GROWTH >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {GROWTH >= 0 ? "+" : ""}{GROWTH}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent dir="ltr">
        <div className="relative">
          <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line x1={pad.l} y1={tick.y} x2={w - pad.r} y2={tick.y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4 4" className="dark:stroke-neutral-700" />
                <text x={pad.l - 8} y={tick.y + 4} textAnchor="end" fill="#94a3b8" fontSize="10">{tick.label}</text>
              </g>
            ))}
            {MONTHS.map((m, i) => {
              const x = pad.l + (i / (MONTHS.length - 1)) * chartW;
              return <text key={m} x={x} y={h - 8} textAnchor="middle" fill="#94a3b8" fontSize="9">{m.slice(0, 3)}</text>;
            })}
            <motion.path
              d={areaPath}
              fill="url(#areaGrad)"
              initial={{ opacity: 0 }}
              animate={{ opacity: animProgress }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <motion.path
              d={linePath}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: animProgress }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x} cy={p.y} r={hoveredIdx === i ? 6 : 3}
                  fill={hoveredIdx === i ? "#6366f1" : "#fff"}
                  stroke="#6366f1" strokeWidth="2"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              </g>
            ))}
            {hoveredIdx !== null && (() => {
              const p = points[hoveredIdx];
              return (
                <g>
                  <line x1={p.x} y1={pad.t} x2={p.x} y2={pad.t + chartH} stroke="#6366f1" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.5" />
                  <rect x={p.x - 40} y={p.y - 32} width="80" height="24" rx="6" fill="#1e293b" />
                  <text x={p.x} y={p.y - 16} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">{REVENUE[hoveredIdx].toLocaleString()} د.ج</text>
                </g>
              );
            })()}
          </svg>
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">2026</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
