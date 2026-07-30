"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DeliveryStep {
  id: number;
  label: string;
  status: "completed" | "active" | "pending";
}

const allSteps: Omit<DeliveryStep, "status">[] = [
  { id: 1, label: "تم الطلب" },
  { id: 2, label: "تم التأكيد" },
  { id: 3, label: "قيد الإنتاج" },
  { id: 4, label: "فحص الجودة" },
  { id: 5, label: "جاهز" },
  { id: 6, label: "تم التسليم" },
];

const stepColors: Record<string, string> = {
  completed: "#22c55e",
  active: "#6366f1",
  pending: "#e2e8f0",
};

const stepDarkColors: Record<string, string> = {
  completed: "#22c55e",
  active: "#818cf8",
  pending: "#334155",
};

const mockInfo = {
  estimatedTime: "اليوم 16:00",
  driver: "أحمد بن علي",
  phone: "+213 555 123 456",
  address: "شارع الأمير عبد القادر، البليدة",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};
const stepVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function DeliveryTrackerMap() {
  const [activeStep, setActiveStep] = useState(3);
  const [steps, setSteps] = useState<DeliveryStep[]>([]);

  useEffect(() => {
    setSteps(
      allSteps.map((s) => ({
        ...s,
        status: s.id < activeStep
          ? ("completed" as const)
          : s.id === activeStep
            ? ("active" as const)
            : ("pending" as const),
      }))
    );
  }, [activeStep]);

  const progressPercent = ((activeStep - 1) / (allSteps.length - 1)) * 100;

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
        تتبع التسليم
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tracker Steps */}
        <motion.div
          className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/50"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                التقدم
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-5 right-5 left-5 h-0.5 bg-neutral-100 dark:bg-neutral-700 z-0" />
            <motion.div
              className="absolute top-5 right-5 h-0.5 z-0"
              style={{ background: "linear-gradient(90deg, #22c55e, #6366f1)" }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />

            <div className="flex justify-between relative z-10">
              {steps.map((step) => (
                <motion.div
                  key={step.id}
                  variants={stepVariants}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                  onClick={() => setActiveStep(step.id)}
                >
                  {/* Circle */}
                  <div className="relative">
                    {step.status === "active" && (
                      <motion.div
                        className="absolute inset-[-4px] rounded-full bg-indigo-400/30 dark:bg-indigo-500/30"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors"
                      style={{
                        backgroundColor:
                          step.status === "completed"
                            ? stepColors.completed
                            : step.status === "active"
                              ? stepColors.active
                              : "transparent",
                        borderColor:
                          step.status === "pending"
                            ? stepColors.pending
                            : "transparent",
                        color:
                          step.status === "completed" || step.status === "active"
                            ? "#ffffff"
                            : "#94a3b8",
                      }}
                    >
                      {step.status === "completed" ? "✓" : step.id}
                    </div>
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[11px] text-center max-w-[60px] leading-tight ${
                      step.status === "pending"
                        ? "text-neutral-400 dark:text-neutral-500"
                        : "text-neutral-700 dark:text-neutral-300 font-medium"
                    }`}
                  >
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Details Panel */}
        <motion.div
          className="p-5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700/50 space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500">الوقت المتوقع</p>
            <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{mockInfo.estimatedTime}</p>
          </div>

          <div className="h-px bg-neutral-100 dark:bg-neutral-700" />

          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500">السائق</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                أ
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{mockInfo.driver}</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500" dir="ltr">{mockInfo.phone}</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-neutral-100 dark:bg-neutral-700" />

          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500">عنوان التسليم</p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">{mockInfo.address}</p>
          </div>

          <div className="h-px bg-neutral-100 dark:bg-neutral-700" />

          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500">رقم الطلب</p>
            <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">#ORD-2024-0847</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
