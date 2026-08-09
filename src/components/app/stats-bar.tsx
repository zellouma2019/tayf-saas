"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ClipboardList, Users, CalendarCheck, Layers, TrendingUp } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { StatsCardSkeleton } from "@/components/app/skeleton-cards";
import { SERVICES } from "@/lib/print-config";

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return target === 0 ? 0 : count;
}

interface StatCardProps {
  label: string;
  target: number;
  icon: React.ComponentType<{ className?: string }>;
  delayClass: string;
  iconBg?: string;
  iconColor?: string;
}

function StatCard({ label, target, icon: Icon, delayClass, iconBg, iconColor }: StatCardProps) {
  const value = useAnimatedCounter(target);
  const reached = value > 0 && value === target;
  const popKey = reached ? `pop-${target}` : '';

  return (
    <div
      className={`animate-fade-up ${delayClass} card-elevated card-hover-lift bg-white dark:bg-card rounded-xl px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-4 min-w-[155px] sm:min-w-0 shrink-0 border border-border/40 dark:border-border/20 focus-ring-animated cursor-default`}
      tabIndex={0}
      role="status"
    >
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${iconBg || 'bg-primary/10'} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${iconColor || 'text-primary'}`} />
      </div>
      <div className="flex flex-col min-w-0">
        <span
          key={popKey || target}
          className="text-xl sm:text-2xl font-bold text-gradient-gold tabular-nums leading-tight animate-pop-once"
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
          {label}
        </span>
      </div>
    </div>
  );
}

export function StatsBar() {
  const refreshKey = useAppStore((s) => s.refreshKey);
  const [stats, setStats] = useState({
    todayOrders: 0,
    totalDelivered: 0,
    uniqueCustomers: 0,
    activeDays: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/stats/overview");
      if (res.ok) {
        const data = await res.json();
        setStats({
          todayOrders: data.todayOrders || 0,
          totalDelivered: data.totalDelivered || 0,
          uniqueCustomers: data.uniqueCustomers || 0,
          activeDays: data.activeDays || 0,
        });
      }
    } catch {
      // silent
    } finally {
      const remaining = Math.max(0, 1500 - (Date.now() - start));
      setTimeout(() => setLoading(false), remaining);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  const serviceCount = SERVICES.length;

  return (
    <section
      className="border-b border-border/50 dark:border-border/20"
      aria-label="إحصائيات سريعة"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex gap-3 md:gap-6 overflow-x-auto custom-scroll pb-1 md:pb-0 md:overflow-visible">
          {loading ? (
            <>
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label="طلبات اليوم"
                target={stats.todayOrders}
                icon={ClipboardList}
                delayClass=""
                iconBg="bg-amber-100 dark:bg-amber-900/40"
                iconColor="text-amber-600 dark:text-amber-400"
              />
              <StatCard
                label="طلب مُسلَّم"
                target={stats.totalDelivered}
                icon={TrendingUp}
                delayClass="animate-fade-up-delay-1"
                iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                iconColor="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                label="عميل"
                target={stats.uniqueCustomers}
                icon={Users}
                delayClass="animate-fade-up-delay-2"
                iconBg="bg-rose-100 dark:bg-rose-900/30"
                iconColor="text-rose-600 dark:text-rose-400"
              />
              <StatCard
                label="خدمة متاحة"
                target={serviceCount}
                icon={Layers}
                delayClass="animate-fade-up-delay-3"
                iconBg="bg-orange-100 dark:bg-orange-900/30"
                iconColor="text-orange-600 dark:text-orange-400"
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
