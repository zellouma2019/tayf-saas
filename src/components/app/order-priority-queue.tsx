"use client";

import { motion, AnimatePresence } from "framer-motion";

type Priority = "urgent" | "medium" | "normal";

interface Order {
  id: string;
  customer: string;
  service: string;
  timeRemaining: string;
  priority: Priority;
}

interface Column {
  priority: Priority;
  label: string;
  emoji: string;
  color: string;
  headerBg: string;
  badgeBg: string;
  badgeText: string;
  orders: Order[];
}

const COLUMNS: Column[] = [
  {
    priority: "urgent",
    label: "عاجل",
    emoji: "🔴",
    color: "border-red-200 dark:border-red-500/30",
    headerBg: "bg-red-500/10",
    badgeBg: "bg-red-100 dark:bg-red-500/20",
    badgeText: "text-red-600 dark:text-red-400",
    orders: [
      { id: "#1024", customer: "أحمد بن علي", service: "طباعة كروت", timeRemaining: "30 د", priority: "urgent" },
      { id: "#1019", customer: "سارة محمدي", service: "طباعة ملصقات", timeRemaining: "45 د", priority: "urgent" },
    ],
  },
  {
    priority: "medium",
    label: "متوسط",
    emoji: "🟡",
    color: "border-amber-200 dark:border-amber-500/30",
    headerBg: "bg-amber-500/10",
    badgeBg: "bg-amber-100 dark:bg-amber-500/20",
    badgeText: "text-amber-600 dark:text-amber-400",
    orders: [
      { id: "#1022", customer: "محمد العربي", service: "طباعة فواتير", timeRemaining: "2 س", priority: "medium" },
      { id: "#1021", customer: "فاطمة زهود", service: "طباعة تقرير", timeRemaining: "3 س", priority: "medium" },
      { id: "#1018", customer: "يوسف بلقاسم", service: "تصميم وطباعة", timeRemaining: "4 س", priority: "medium" },
    ],
  },
  {
    priority: "normal",
    label: "عادي",
    emoji: "🟢",
    color: "border-emerald-200 dark:border-emerald-500/30",
    headerBg: "bg-emerald-500/10",
    badgeBg: "bg-emerald-100 dark:bg-emerald-500/20",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    orders: [
      { id: "#1020", customer: "خالد بن عمر", service: "طباعة أفلام", timeRemaining: "6 س", priority: "normal" },
      { id: "#1017", customer: "نورة حسين", service: "طباعة مظاريف", timeRemaining: "8 س", priority: "normal" },
      { id: "#1015", customer: "عبد الرحمن سعيدي", service: "طباعة كتيبات", timeRemaining: "12 س", priority: "normal" },
    ],
  },
];

const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.25 } },
};

export default function OrderPriorityQueue() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-lg">
          📋
        </div>
        <div>
          <h3 className="font-bold text-foreground text-sm">طابور الأولوية</h3>
          <p className="text-xs text-muted-foreground">{COLUMNS.reduce((s, c) => s + c.orders.length, 0)} طلب</p>
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {COLUMNS.map((col) => (
          <div key={col.priority} className={`rounded-xl border ${col.color} overflow-hidden`}>
            {/* Column header */}
            <div className={`px-3 py-2.5 flex items-center justify-between ${col.headerBg}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{col.emoji}</span>
                <span className="text-sm font-bold text-foreground">{col.label}</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${col.badgeBg} ${col.badgeText}`}>
                {col.orders.length}
              </span>
            </div>

            {/* Order cards */}
            <div className="p-2 space-y-2 bg-background min-h-[180px]">
              <AnimatePresence mode="popLayout">
                {col.orders.map((order) => (
                  <motion.div
                    key={order.id}
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                    className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-foreground">{order.id}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${col.badgeBg} ${col.badgeText}`}>
                        {order.timeRemaining}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground mb-0.5">{order.customer}</p>
                    <p className="text-[11px] text-muted-foreground">{order.service}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Reorder button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
      >
        إعادة ترتيب
      </motion.button>
    </div>
  );
}
