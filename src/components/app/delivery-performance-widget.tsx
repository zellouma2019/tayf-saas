"use client";

import { motion } from "framer-motion";

interface Metric {
  label: string;
  value: string;
  indicatorColor: string;
  bgColor: string;
}

const METRICS: Metric[] = [
  {
    label: "متوسط وقت التوصيل",
    value: "2.5 يوم",
    indicatorColor: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    label: "نسبة التوصيل في الوقت",
    value: "91%",
    indicatorColor: "bg-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    label: "طلبات متأخرة",
    value: "8",
    indicatorColor: "bg-red-500",
    bgColor: "bg-red-500/10",
  },
];

type DeliveryStatus = "في الوقت" | "متأخر" | "مبكر";

interface DeliveryItem {
  id: string;
  customer: string;
  time: string;
  status: DeliveryStatus;
}

const TIMELINE: DeliveryItem[] = [
  { id: "ORD-1084", customer: "أحمد بن علي", time: "10:30 ص", status: "في الوقت" },
  { id: "ORD-1083", customer: "فاطمة زهراء", time: "11:15 ص", status: "مبكر" },
  { id: "ORD-1082", customer: "محمد الأمين", time: "12:00 م", status: "متأخر" },
  { id: "ORD-1081", customer: "سارة بلقاسم", time: "01:45 م", status: "في الوقت" },
  { id: "ORD-1080", customer: "يوسف حمادي", time: "02:30 م", status: "في الوقت" },
];

function getStatusColor(status: DeliveryStatus) {
  switch (status) {
    case "في الوقت":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
    case "متأخر":
      return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";
    case "مبكر":
      return "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400";
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DeliveryPerformanceWidget() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
          🚚
        </div>
        <h3 className="font-bold text-foreground text-sm">أداء التوصيل</h3>
      </div>

      {/* Metric cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 gap-3"
      >
        {METRICS.map((m) => (
          <motion.div
            key={m.label}
            variants={itemVariants}
            className="rounded-xl p-3 space-y-2 text-center"
          >
            <div className={`w-8 h-8 rounded-full ${m.bgColor} mx-auto flex items-center justify-center`}>
              <div className={`w-2 h-2 rounded-full ${m.indicatorColor}`} />
            </div>
            <p className="text-lg font-black text-foreground">{m.value}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{m.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Timeline */}
      <div className="border-t border-border pt-4 space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground">آخر التوصيلات</h4>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative space-y-0"
        >
          <div className="absolute start-3 top-2 bottom-2 w-px bg-border" />
          {TIMELINE.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="flex items-start gap-3 py-2.5"
            >
              <div className="relative z-10 w-6 h-6 rounded-full bg-muted border-2 border-border flex items-center justify-center shrink-0 mt-0.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.status === "في الوقت"
                      ? "bg-emerald-500"
                      : item.status === "متأخر"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                />
              </div>
              <div className="flex-1 flex items-center justify-between min-w-0">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {item.id} — {item.customer}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{item.time}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${getStatusColor(item.status)}`}
                >
                  {item.status}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
