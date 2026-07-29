"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const orderTypes = [
  { name: "طباعة مستندات", amount: 420000, percent: 35, color: "#10b981" },
  { name: "طباعة صور", amount: 300000, percent: 25, color: "#f59e0b" },
  { name: "طباعة بانرات", amount: 240000, percent: 20, color: "#8b5cf6" },
  { name: "طباعة كروت", amount: 144000, percent: 12, color: "#ef4444" },
  { name: "تجليد", amount: 60000, percent: 5, color: "#06b6d4" },
  { name: "خدمات أخرى", amount: 36000, percent: 3, color: "#ec4899" },
];

const totalAmount = 1200000;

function formatDZD(n: number) {
  return n.toLocaleString("ar-DZ");
}

// Build SVG donut arc path
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export default function OrderRevenueDistribution() {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const cx = 120, cy = 120, r = 88;
  const arcs = orderTypes.reduce<{ items: typeof orderTypes[number][]; cum: number }>(
    (acc, ot) => {
      const angle = (ot.percent / 100) * 360;
      const gap = 1.5;
      const path = describeArc(cx, cy, r, acc.cum + gap / 2, acc.cum + angle - gap / 2);
      return { items: [...acc.items, { ...ot, path }], cum: acc.cum + angle };
    },
    { items: [], cum: 0 }
  ).items;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h3 className="mb-6 text-lg font-bold text-foreground">توزيع إيرادات الطلبات</h3>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-10">
        {/* Donut chart */}
        <div className="relative flex-shrink-0">
          <svg width="240" height="240" viewBox="0 0 240 240">
            <circle cx={cx} cy={cy} r={r} className="fill-none stroke-border stroke-[14]" />
            {arcs.map((arc, i) => (
              <motion.path
                key={arc.name}
                d={arc.path}
                fill="none"
                stroke={arc.color}
                strokeWidth={14}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: animated ? 1 : 0 }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-foreground">{formatDZD(totalAmount)}</span>
            <span className="text-xs text-muted-foreground">د.ج</span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-1">
          {orderTypes.map((ot, i) => (
            <motion.div
              key={ot.name}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-2"
            >
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: ot.color }}
              />
              <div className="flex flex-1 items-center justify-between">
                <span className="text-sm text-muted-foreground">{ot.name}</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatDZD(ot.amount)} د.ج
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
