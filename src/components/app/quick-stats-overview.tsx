"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

interface QuickStatsOverviewProps {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  className?: string;
}

function ProgressRing({
  value,
  max,
  size = 56,
  strokeWidth = 5,
  color = "#d4a853",
  children,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference * (1 - percent);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/50"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="progress-ring-circle"
          style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function QuickStatsOverview({
  totalOrders,
  completedOrders,
  pendingOrders,
  totalRevenue,
  className = "",
}: QuickStatsOverviewProps) {
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

  const stats = useMemo(() => [
    {
      label: "معدل الإنجاز",
      value: `${completionRate}%`,
      sublabel: `${completedOrders} من ${totalOrders}`,
      color: "#10b981",
      ringValue: completionRate,
      ringMax: 100,
    },
    {
      label: "قيمة المتوسط",
      value: avgOrderValue > 0 ? `${Math.round(avgOrderValue)}` : "0",
      sublabel: "د.ج لكل طلب",
      color: "#d4a853",
      ringValue: Math.min(avgOrderValue / 500 * 100, 100),
      ringMax: 100,
    },
    {
      label: "في الانتظار",
      value: `${pendingOrders}`,
      sublabel: `من أصل ${totalOrders} طلب`,
      color: "#f59e0b",
      ringValue: totalOrders > 0 ? pendingOrders : 0,
      ringMax: Math.max(totalOrders, 1),
    },
  ], [completionRate, completedOrders, totalOrders, pendingOrders, avgOrderValue]);

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/50 hover-lift stat-card-3d"
        >
          <ProgressRing value={stat.ringValue} max={stat.ringMax} color={stat.color} size={60} strokeWidth={5}>
            <span className="text-sm font-bold text-foreground counter-number">{stat.value}</span>
          </ProgressRing>
          <div className="text-center">
            <p className="text-[11px] font-semibold text-foreground">{stat.label}</p>
            <p className="text-[9px] text-muted-foreground/60">{stat.sublabel}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
