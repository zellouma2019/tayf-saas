"use client";

import { motion } from "framer-motion";
import { Store, Eye, Download, Package, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShopAnalyticsCardProps {
  shopName?: string;
}

const DEFAULT_SERVICES = [
  { name: "طباعة مستندات", pct: 60, color: "bg-indigo-500" },
  { name: "طباعة صور", pct: 25, color: "bg-blue-500" },
  { name: "تجليد", pct: 15, color: "bg-amber-500" },
];

const SPARKLINE = [28, 35, 32, 40, 38, 45, 47];

export function ShopAnalyticsCard({ shopName = "مطبعة الريان" }: ShopAnalyticsCardProps) {
  const maxSpark = Math.max(...SPARKLINE);
  const sparkW = 100;
  const sparkH = 30;
  const sparkPoints = SPARKLINE.map((v, i) => {
    const x = (i / (SPARKLINE.length - 1)) * sparkW;
    const y = sparkH - (v / maxSpark) * sparkH;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-card rounded-xl border border-border shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300">
        <div className="h-1 bg-gradient-to-l from-primary to-primary/50" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {shopName.charAt(0)}{shopName.charAt(shopName.indexOf(" ") + 1)}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm text-foreground">{shopName}</CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-1.5 py-0">نشط</Badge>
              </div>
            </div>
            <svg viewBox={`0 0 ${sparkW} ${sparkH}`} className="w-20 h-8 opacity-60">
              <motion.path
                d={sparkPoints}
                fill="none"
                stroke="#6366f1"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <KpiBox icon={<Package className="h-3.5 w-3.5" />} label="طلبات الشهر" value="47" change="+12%" positive />
            <KpiBox icon={<TrendingUp className="h-3.5 w-3.5" />} label="الإيرادات" value="125,000 د.ج" change="+8%" positive />
            <KpiBox icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="معدل التسليم" value="94%" change="+3%" positive />
            <KpiBox icon={<Clock className="h-3.5 w-3.5" />} label="متوسط المعالجة" value="2.5 س" change="-15%" positive />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground font-medium mb-1">توزيع الخدمات</p>
            {DEFAULT_SERVICES.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="text-xs text-foreground w-24 truncate">{s.name}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", s.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-left">{s.pct}%</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 h-8">
              <Eye className="h-3.5 w-3.5" />عرض التفاصيل
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 h-8">
              <Download className="h-3.5 w-3.5" />تصدير التقرير
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function KpiBox({ icon, label, value, change, positive }: { icon: React.ReactNode; label: string; value: string; change: string; positive: boolean }) {
  return (
    <div className="rounded-lg bg-muted/50 dark:bg-muted/30 p-2.5 space-y-1">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
        <span className={cn("text-[10px] font-medium", positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
          {change}
        </span>
      </div>
    </div>
  );
}
