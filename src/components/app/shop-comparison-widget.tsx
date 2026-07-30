"use client";

import { motion } from "framer-motion";

interface Shop {
  name: string;
  orders: number;
  revenue: number;
  avgDelivery: string;
  rating: number;
  completionRate: number;
}

interface MetricDef {
  key: keyof Shop;
  label: string;
  icon: string;
  format: (val: Shop[keyof Shop]) => string;
  lowerIsBetter: boolean;
}

const SHOPS: Shop[] = [
  { name: "مطبعة الريان", orders: 312, revenue: 458000, avgDelivery: "1.2 يوم", rating: 4.8, completionRate: 97 },
  { name: "مطبعة النور", orders: 285, revenue: 392000, avgDelivery: "1.5 يوم", rating: 4.5, completionRate: 94 },
  { name: "مطبعة الأمل", orders: 256, revenue: 345000, avgDelivery: "1.8 يوم", rating: 4.3, completionRate: 91 },
];

const METRICS: MetricDef[] = [
  { key: "orders", label: "إجمالي الطلبات", icon: "📦", format: (v) => String(v), lowerIsBetter: false },
  { key: "revenue", label: "الإيرادات", icon: "💵", format: (v) => `${Number(v).toLocaleString("ar-DZ")} د.ج`, lowerIsBetter: false },
  { key: "avgDelivery", label: "متوسط وقت التسليم", icon: "⏱️", format: (v) => String(v), lowerIsBetter: true },
  { key: "rating", label: "تقييم العملاء", icon: "⭐", format: (v) => `${Number(v)}/5`, lowerIsBetter: false },
  { key: "completionRate", label: "معدل الإنجاز", icon: "✅", format: (v) => `${v}%`, lowerIsBetter: false },
];

const RANK_BADGES = ["🥇", "🥈", "🥉"];
const RANK_COLORS = [
  "ring-yellow-400/50 dark:ring-yellow-400/30",
  "ring-zinc-300/50 dark:ring-zinc-400/30",
  "ring-amber-600/30 dark:ring-amber-700/30",
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className="w-3.5 h-3.5"
          viewBox="0 0 20 20"
          fill={s <= Math.floor(rating) || (s - rating <= 0.5 && s - rating > 0) ? "currentColor" : "none"}
          stroke={s <= Math.floor(rating) ? "none" : "currentColor"}
          strokeWidth="1.5"
        >
          <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27l-4.94 2.43L6 11.21l-4-3.9 5.53-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function getRanking(metricKey: keyof Shop): number[] {
  const values = SHOPS.map((s) => s[metricKey]);
  const metric = METRICS.find((m) => m.key === metricKey)!;

  if (typeof values[0] === "number") {
    return values
      .map((v, i) => ({ v: v as number, i }))
      .sort((a, b) => (metric.lowerIsBetter ? a.v - b.v : b.v - a.v))
      .map((x) => x.i);
  }

  // Parse delivery time strings like "1.2 يوم"
  const parsed = values.map((v) => parseFloat(String(v)));
  return parsed
    .map((v, i) => ({ v, i }))
    .sort((a, b) => (metric.lowerIsBetter ? a.v - b.v : b.v - a.v))
    .map((x) => x.i);
}

export default function ShopComparisonWidget() {
  // Determine best shop (most #1 rankings)
  const bestShopIndex = (() => {
    const counts = [0, 0, 0];
    for (const m of METRICS) {
      const ranking = getRanking(m.key);
      counts[ranking[0]]++;
    }
    return counts.indexOf(Math.max(...counts));
  })();

  const maxRevenue = Math.max(...SHOPS.map((s) => s.revenue));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
          🏪
        </div>
        <div>
          <h3 className="font-bold text-foreground text-sm">مقارنة المتاجر</h3>
          <p className="text-xs text-muted-foreground">مقارنة الأداء الشهري</p>
        </div>
      </div>

      {/* Shop headers */}
      <div className="grid grid-cols-4 gap-2">
        <div />
        {SHOPS.map((shop, idx) => (
          <div
            key={shop.name}
            className={`text-center p-2 rounded-lg ${idx === bestShopIndex ? "bg-primary/5 ring-2 " + RANK_COLORS[0] : "bg-muted/30"}`}
          >
            <div className="text-sm font-bold text-foreground">{shop.name}</div>
            {idx === bestShopIndex && (
              <span className="text-[10px] font-semibold text-primary">الأفضل</span>
            )}
          </div>
        ))}
      </div>

      {/* Metrics rows */}
      <div className="space-y-2">
        {METRICS.map((metric) => {
          const ranking = getRanking(metric.key);
          return (
            <div key={metric.key} className="grid grid-cols-4 gap-2 items-center">
              {/* Label */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{metric.icon}</span>
                <span className="text-xs font-medium text-muted-foreground">{metric.label}</span>
              </div>

              {/* Values */}
              {SHOPS.map((shop, shopIdx) => {
                const rank = ranking.indexOf(shopIdx);
                const isRevenue = metric.key === "revenue";
                const revenuePct = isRevenue ? (shop.revenue / maxRevenue) * 100 : 0;

                return (
                  <div
                    key={shop.name}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg ${shopIdx === bestShopIndex ? "bg-primary/[0.03]" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-foreground">
                        {metric.format(shop[metric.key])}
                      </span>
                      <span className="text-xs">{RANK_BADGES[rank]}</span>
                    </div>

                    {/* Star rating for rating metric */}
                    {metric.key === "rating" && (
                      <div className="flex items-center">
                        <StarRating rating={shop.rating} />
                      </div>
                    )}

                    {/* Bar for revenue */}
                    {isRevenue && (
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${revenuePct}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="h-full rounded-full bg-primary"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
