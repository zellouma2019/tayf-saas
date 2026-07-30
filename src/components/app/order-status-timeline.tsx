"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Search,
  Printer,
  ShieldCheck,
  PackageCheck,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderStatusTimelineProps {
  orderId?: string;
  currentStatus?: string;
}

const STEPS = [
  { key: "received", label: "تم الاستلام", icon: ClipboardList, time: "09:30 ص" },
  { key: "review", label: "قيد المراجعة", icon: Search, time: "10:15 ص" },
  { key: "printing", label: "قيد الطباعة", icon: Printer, time: "11:00 ص" },
  { key: "quality", label: "فحص الجودة", icon: ShieldCheck, time: "—" },
  { key: "ready", label: "جاهز", icon: PackageCheck, time: "—" },
  { key: "delivered", label: "تم التسليم", icon: Truck, time: "—" },
] as const;

type StepStatus = "completed" | "active" | "pending";

function getStepStatus(
  stepIndex: number,
  activeIndex: number
): StepStatus {
  if (stepIndex < activeIndex) return "completed";
  if (stepIndex === activeIndex) return "active";
  return "pending";
}

export function OrderStatusTimeline({
  orderId = "ORD-2024-1847",
  currentStatus = "printing",
}: OrderStatusTimelineProps) {
  const activeIndex = STEPS.findIndex((s) => s.key === currentStatus);
  const resolvedActive = activeIndex >= 0 ? activeIndex : 2;

  const progressPercent = useMemo(() => {
    return Math.round((resolvedActive / (STEPS.length - 1)) * 100);
  }, [resolvedActive]);

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold">
            حالة الطلب
          </CardTitle>
          <Badge
            variant="outline"
            className="font-mono text-xs"
          >
            {orderId}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs font-bold text-primary min-w-[3rem] text-left">
            {progressPercent}%
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Desktop: horizontal timeline */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between relative">
            /
            <div className="absolute top-5 right-5 left-5 h-0.5 bg-muted z-0" />
            <div
              className="absolute top-5 right-5 h-0.5 bg-emerald-500 z-0"
              style={{
                width: `calc(${progressPercent}% - ${(100 / (STEPS.length - 1)) * 0.5}%)`,
              }}
            />

            {STEPS.map((step, index) => {
              const status = getStepStatus(index, resolvedActive);
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.key}
                  className="relative z-10 flex flex-col items-center gap-2"
                  style={{ width: `${100 / STEPS.length}%` }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      status === "completed" &&
                        "bg-emerald-500 border-emerald-500 text-white",
                      status === "active" &&
                        "bg-primary border-primary text-primary-foreground",
                      status === "pending" &&
                        "bg-background border-muted text-muted-foreground"
                    )}
                  >
                    {status === "active" ? (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  <div className="text-center">
                    <p
                      className={cn(
                        "text-xs font-semibold leading-tight",
                        status === "pending" && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] mt-0.5",
                        status === "pending"
                          ? "text-muted-foreground/60"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.time}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="md:hidden relative">
          {/* Vertical connector line */}
          <div className="absolute top-4 right-4 bottom-4 w-0.5 bg-muted z-0" />
          <div
            className="absolute top-4 right-4 w-0.5 bg-emerald-500 z-0"
            style={{
              height: `${(resolvedActive / (STEPS.length - 1)) * 100}%`,
            }}
          />

          <div className="space-y-1">
            {STEPS.map((step, index) => {
              const status = getStepStatus(index, resolvedActive);
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.key}
                  className="relative z-10 flex items-center gap-4 p-2 rounded-lg"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.35 }}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors",
                      status === "completed" &&
                        "bg-emerald-500 border-emerald-500 text-white",
                      status === "active" &&
                        "bg-primary border-primary text-primary-foreground",
                      status === "pending" &&
                        "bg-background border-muted text-muted-foreground"
                    )}
                  >
                    {status === "active" ? (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        status === "pending" && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        status === "pending"
                          ? "text-muted-foreground/60"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.time}
                    </p>
                  </div>

                  {status === "completed" && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px]">
                      مكتمل
                    </Badge>
                  )}
                  {status === "active" && (
                    <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                      حالياً
                    </Badge>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
