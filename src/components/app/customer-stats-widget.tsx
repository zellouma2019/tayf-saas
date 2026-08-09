"use client";

import { motion } from "framer-motion";
import { Users, UserPlus, RotateCcw, Receipt, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatCardData {
  label: string;
  value: string;
  icon: React.ElementType;
  badge: string;
  badgeType: "positive" | "ring";
  color: string;
}

const STAT_CARDS: StatCardData[] = [
  {
    label: "إجمالي العملاء",
    value: "156",
    icon: Users,
    badge: "+12%",
    badgeType: "positive",
    color: "text-primary",
  },
  {
    label: "عملاء جدد هذا الشهر",
    value: "23",
    icon: UserPlus,
    badge: "+8%",
    badgeType: "positive",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "معدل العودة",
    value: "67%",
    icon: RotateCcw,
    badge: "",
    badgeType: "ring",
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "متوسط قيمة الطلب",
    value: "2,340 د.ج",
    icon: Receipt,
    badge: "+5%",
    badgeType: "positive",
    color: "text-violet-600 dark:text-violet-400",
  },
];

interface TopCustomer {
  name: string;
  initials: string;
  totalOrders: number;
  totalSpent: string;
  lastOrder: string;
  color: string;
}

const TOP_CUSTOMERS: TopCustomer[] = [
  {
    name: "شركة الأمل للخدمات",
    initials: "أم",
    totalOrders: 34,
    totalSpent: "245,000 د.ج",
    lastOrder: "2024-01-15",
    color: "bg-primary",
  },
  {
    name: "مؤسسة النور",
    initials: "نو",
    totalOrders: 28,
    totalSpent: "189,500 د.ج",
    lastOrder: "2024-01-14",
    color: "bg-emerald-500",
  },
  {
    name: "مكتبة الإبداع",
    initials: "إب",
    totalOrders: 22,
    totalSpent: "134,200 د.ج",
    lastOrder: "2024-01-13",
    color: "bg-amber-500",
  },
  {
    name: "مدرسة المستقبل",
    initials: "مس",
    totalOrders: 19,
    totalSpent: "112,800 د.ج",
    lastOrder: "2024-01-12",
    color: "bg-sky-500",
  },
  {
    name: "عيادة الشفاء",
    initials: "شق",
    totalOrders: 15,
    totalSpent: "97,600 د.ج",
    lastOrder: "2024-01-10",
    color: "bg-rose-500",
  },
];

function ProgressRing({ percentage, size = 48, strokeWidth = 4 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className="stroke-muted" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        className="stroke-amber-500 dark:stroke-amber-400"
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}

const gridContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const gridItem = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const listContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const listItem = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0 },
};

export function CustomerStatsWidget() {
  return (
    <Card className="w-full" dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-base font-bold">إحصائيات العملاء</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-5">
        <motion.div className="grid grid-cols-2 gap-3" variants={gridContainer} initial="hidden" animate="visible">
          {STAT_CARDS.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={gridItem} className="rounded-xl border bg-card p-4 flex flex-col gap-2 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center", stat.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {stat.badgeType === "positive" && stat.badge && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px] px-1.5 h-5">
                      {stat.badge}
                    </Badge>
                  )}
                  {stat.badgeType === "ring" && <ProgressRing percentage={67} size={36} strokeWidth={3} />}
                </div>
                <div>
                  <p className="text-lg font-black leading-tight">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold">أفضل العملاء</h3>
          </div>
          <motion.div className="space-y-2 max-h-64 overflow-y-auto" variants={listContainer} initial="hidden" animate="visible">
            {TOP_CUSTOMERS.map((customer, idx) => (
              <motion.div key={customer.name} variants={listItem} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="relative shrink-0">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold", customer.color)}>
                    {customer.initials}
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-background border border-border text-[9px] font-bold flex items-center justify-center text-muted-foreground">
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{customer.name}</p>
                  <p className="text-[10px] text-muted-foreground">آخر طلب: {customer.lastOrder}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-xs font-bold">{customer.totalSpent}</p>
                  <p className="text-[10px] text-muted-foreground">{customer.totalOrders} طلب</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
