"use client";

import { motion } from "framer-motion";
import { Star, Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StaffStatus = "online" | "busy" | "offline";

interface StaffMember {
  name: string;
  role: string;
  initials: string;
  tasksCompleted: number;
  status: StaffStatus;
  rating: number;
  contribution: number;
  color: string;
}

const STAFF_DATA: StaffMember[] = [
  {
    name: "أحمد",
    role: "طباعة",
    initials: "أم",
    tasksCompleted: 47,
    status: "online",
    rating: 4.8,
    contribution: 34,
    color: "bg-emerald-500",
  },
  {
    name: "فاطمة",
    role: "تصميم",
    initials: "فع",
    tasksCompleted: 38,
    status: "online",
    rating: 4.9,
    contribution: 28,
    color: "bg-violet-500",
  },
  {
    name: "محمد",
    role: "خدمة العملاء",
    initials: "مد",
    tasksCompleted: 25,
    status: "busy",
    rating: 4.5,
    contribution: 18,
    color: "bg-sky-500",
  },
  {
    name: "سارة",
    role: "فحص",
    initials: "سر",
    tasksCompleted: 18,
    status: "online",
    rating: 4.7,
    contribution: 13,
    color: "bg-amber-500",
  },
  {
    name: "يوسف",
    role: "تسليم",
    initials: "يس",
    tasksCompleted: 9,
    status: "offline",
    rating: 4.3,
    contribution: 7,
    color: "bg-rose-500",
  },
];

const TOTAL_TASKS = STAFF_DATA.reduce((sum, m) => sum + m.tasksCompleted, 0);

const STATUS_CONFIG: Record<
  StaffStatus,
  { label: string; dotColor: string; badgeClass: string }
> = {
  online: {
    label: "متصل",
    dotColor: "bg-emerald-500",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0",
  },
  busy: {
    label: "مشغول",
    dotColor: "bg-amber-500",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0",
  },
  offline: {
    label: "غير متصل",
    dotColor: "bg-neutral-400",
    badgeClass:
      "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-0",
  },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-3 h-3",
            star <= Math.floor(rating)
              ? "text-amber-400 fill-amber-400"
              : star - 0.5 <= rating
                ? "text-amber-400 fill-amber-400/50"
                : "text-muted-foreground/30"
          )}
        />
      ))}
      <span className="text-[10px] text-muted-foreground mr-1">{rating}</span>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function StaffActivityWidget() {
  return (
    <Card className="w-full" dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle className="text-base font-bold">
              أداء الفريق
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-bold">
              {TOTAL_TASKS}{" "}
              <span className="text-xs text-muted-foreground font-normal">
                مهمة مكتملة
              </span>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <motion.div
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {STAFF_DATA.map((member) => {
            const statusCfg = STATUS_CONFIG[member.status];

            return (
              <motion.div
                key={member.name}
                variants={itemVariants}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold",
                      member.color
                    )}
                  >
                    {member.initials}
                  </div>
                  <div
                    className={cn(
                      "absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full border-2 border-background",
                      statusCfg.dotColor
                    )}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">
                      {member.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-5",
                        statusCfg.badgeClass
                      )}
                    >
                      {statusCfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {member.role}
                  </p>

                  {/* Contribution bar */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", member.color)}
                        initial={{ width: 0 }}
                        animate={{ width: `${member.contribution}%` }}
                        transition={{
                          duration: 0.6,
                          delay: 0.3,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground min-w-[2rem] text-left">
                      {member.contribution}%
                    </span>
                  </div>
                </div>

                {/* Stats column */}
                <div className="text-left shrink-0">
                  <p className="text-sm font-bold">{member.tasksCompleted}</p>
                  <p className="text-[10px] text-muted-foreground">مهمة</p>
                  <StarRating rating={member.rating} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </CardContent>
    </Card>
  );
}
