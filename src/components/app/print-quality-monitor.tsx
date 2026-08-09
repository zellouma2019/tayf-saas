"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ClipboardCheck, CheckCircle2, AlertCircle } from "lucide-react";

const metrics = [
  { label: "دقة الألوان", value: 98, color: "#10b981" },
  { label: "وضوح النص", value: 97, color: "#10b981" },
  { label: "محاذاة الصفحات", value: 95, color: "#f59e0b" },
  { label: "جودة الورق", value: 97, color: "#10b981" },
];

const recentChecks = [
  { id: "#1052", status: "ممتاز", ok: true },
  { id: "#1048", status: "جيد", ok: false },
  { id: "#1045", status: "ممتاز", ok: true },
];

const overallScore = 96.8;

function QualityGauge({ score }: { score: number }) {
  const radius = 70;
  const stroke = 10;
  const cx = 80, cy = 80;
  const circ = 2 * Math.PI * radius;
  const pct = score / 100;
  const offset = circ - pct * circ;

  return (
    <div className="relative mx-auto w-40">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle cx={cx} cy={cy} r={radius} className="fill-none stroke-border" strokeWidth={stroke} />
        <motion.circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        <span className="text-2xl font-extrabold text-foreground">{score}%</span>
        <span className="mt-0.5 flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          ممتاز
        </span>
      </div>
    </div>
  );
}

export default function PrintQualityMonitor() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-emerald-500" />
        <h3 className="text-lg font-bold text-foreground">مراقبة جودة الطباعة</h3>
      </div>

      {/* Gauge */}
      <div className="mb-6">
        <QualityGauge score={overallScore} />
      </div>

      {/* Metrics grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="rounded-xl bg-muted/50 p-3"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{m.label}</span>
              <span className="text-sm font-bold" style={{ color: m.color }}>{m.value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: m.color }}
                initial={{ width: 0 }}
                animate={{ width: mounted ? `${m.value}%` : 0 }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent checks */}
      <div className="mb-4">
        <p className="mb-2.5 text-sm font-semibold text-foreground">فحوصات الجودة الأخيرة</p>
        <div className="flex flex-col gap-2">
          {recentChecks.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
            >
              <span className="text-sm text-muted-foreground">طلب {c.id}</span>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.ok
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {c.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {c.status}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        <ClipboardCheck className="h-4 w-4" />
        فحص جودة جديد
      </motion.button>
    </motion.div>
  );
}
