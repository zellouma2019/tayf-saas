"use client";

import { motion } from "framer-motion";

type Status = "running" | "maintenance" | "stopped";

interface Machine {
  icon: string;
  name: string;
  status: Status;
  statusLabel: string;
  lastMaint: string;
  nextMaint: string;
  overdue?: string;
}

const MACHINES: Machine[] = [
  {
    icon: "🖨️",
    name: "طابعة HP LaserJet",
    status: "running",
    statusLabel: "تعمل",
    lastMaint: "منذ 3 أيام",
    nextMaint: "في 15 يوم",
  },
  {
    icon: "🖨️",
    name: "طابعة Canon ImagePRO",
    status: "running",
    statusLabel: "تعمل",
    lastMaint: "منذ أسبوع",
    nextMaint: "في 7 أيام",
  },
  {
    icon: "✂️",
    name: "قاطعة ورق",
    status: "maintenance",
    statusLabel: "تحتاج صيانة",
    lastMaint: "منذ أسبوعين",
    nextMaint: "تأخرت 3 أيام",
    overdue: "تأخرت 3 أيام",
  },
  {
    icon: "🔗",
    name: "آلة التجليد",
    status: "stopped",
    statusLabel: "متوقفة",
    lastMaint: "منذ 10 أيام",
    nextMaint: "منذ 5 أيام",
    overdue: "من 5 أيام",
  },
];

function StatusBadge({ status, label }: { status: Status; label: string }) {
  const styles: Record<Status, string> = {
    running: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    maintenance: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    stopped: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
  };

  const dotColor: Record<Status, string> = {
    running: "bg-emerald-500",
    maintenance: "bg-amber-500",
    stopped: "bg-rose-500",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[status]} ${status !== "running" ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}

function MachineCard({ machine, index }: { machine: Machine; index: number }) {
  const borderColor =
    machine.status === "stopped"
      ? "border-rose-400 dark:border-rose-500"
      : machine.status === "maintenance"
        ? "border-amber-400 dark:border-amber-500"
        : "border-zinc-200 dark:border-zinc-700";

  const isAlert = machine.status === "maintenance" || machine.status === "stopped";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-lg border-2 p-4 ${borderColor} bg-white dark:bg-zinc-900 transition-shadow hover:shadow-md ${isAlert ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 " + (machine.status === "stopped" ? "ring-rose-400/50 dark:ring-rose-500/50 animate-pulse" : "ring-amber-400/50 dark:ring-amber-500/50") : ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{machine.icon}</span>
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{machine.name}</span>
        </div>
        <StatusBadge status={machine.status} label={machine.statusLabel} />
      </div>

      <div className="space-y-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
        <div className="flex justify-between">
          <span>آخر صيانة</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{machine.lastMaint}</span>
        </div>
        <div className="flex justify-between">
          <span>الصيانة التالية</span>
          <span className={`font-medium ${machine.overdue ? (machine.status === "stopped" ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400") : "text-zinc-700 dark:text-zinc-300"}`}>
            {machine.overdue ?? machine.nextMaint}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function MachineMaintenanceWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <span className="text-base">🔧</span>
          صيانة الآلات
        </h3>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
          2 متأخرة
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {MACHINES.map((m, i) => (
          <MachineCard key={m.name} machine={m} index={i} />
        ))}
      </div>

      <button className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-semibold transition-colors">
        جدولة صيانة
      </button>
    </motion.div>
  );
}
