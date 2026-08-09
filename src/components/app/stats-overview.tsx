"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Zap, DollarSign, Clock } from "lucide-react";
import { formatDA, STATUS_META } from "@/lib/print-config";

interface Stats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  statusCounts: Record<string, number>;
}

interface StatsOverviewProps {
  adminCode: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

function SkeletonCard() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
        <div className="flex flex-col gap-2">
          <div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsOverview({ adminCode }: StatsOverviewProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminCode) {
      setLoading(false);
      return;
    }
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { "x-admin-code": adminCode },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [adminCode]);

  const inProgress = stats
    ? (stats.statusCounts[STATUS_META.pending.label] ?? 0) +
      (stats.statusCounts[STATUS_META.printing.label] ?? 0)
    : 0;
  const inProgressAlt = stats
    ? (stats.statusCounts["pending"] ?? 0) + (stats.statusCounts["printing"] ?? 0)
    : 0;
  const finalInProgress = inProgress > 0 ? inProgress : inProgressAlt;

  const cards = [
    {
      icon: Package,
      value: stats?.totalOrders ?? 0,
      label: "إجمالي الطلبات",
      iconBg: "bg-amber-100 dark:bg-amber-950/60",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      icon: Zap,
      value: stats?.todayOrders ?? 0,
      label: "طلبات اليوم",
      iconBg: "bg-orange-100 dark:bg-orange-950/60",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      icon: DollarSign,
      value: stats ? formatDA(stats.totalRevenue) : "0 دج",
      label: "إجمالي الإيرادات",
      iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      isFormatted: true,
    },
    {
      icon: Clock,
      value: finalInProgress,
      label: "قيد التنفيذ",
      iconBg: "bg-rose-100 dark:bg-rose-950/60",
      iconColor: "text-rose-600 dark:text-rose-400",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          custom={i}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="border-border/50 shadow-sm transition-shadow hover:shadow-md dark:border-border/30">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}>
                <card.icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-2xl font-bold tracking-tight text-foreground">
                  {card.value}
                </p>
                <p className="truncate text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}