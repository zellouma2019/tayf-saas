"use client";

import { motion } from "framer-motion";

type CouponStatus = "ACTIVE" | "EXPIRED" | "DRAFT";

interface Coupon {
  name: string;
  code: string;
  discount: string;
  usedCount: number;
  status: CouponStatus;
  expiresIn?: number;
}

const COUPONS: Coupon[] = [
  { name: "خصم 20%", code: "TAYF20", discount: "20%", usedCount: 89, status: "ACTIVE", expiresIn: 15 },
  { name: "طباعة مجانية", code: "TAYFFREE", discount: "مجاني", usedCount: 45, status: "ACTIVE", expiresIn: 3 },
  { name: "خصم 10%", code: "TAYF10", discount: "10%", usedCount: 120, status: "EXPIRED" },
  { name: "تخفيض خاص", code: "TAYFSPEC", discount: "15%", usedCount: 0, status: "DRAFT" },
];

function getStatusBadge(status: CouponStatus) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400";
    case "EXPIRED":
      return "bg-gray-100 text-gray-500 dark:bg-gray-500/15 dark:text-gray-400";
    case "DRAFT":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400";
  }
}

function getStatusLabel(status: CouponStatus) {
  switch (status) {
    case "ACTIVE": return "نشط";
    case "EXPIRED": return "منتهي";
    case "DRAFT": return "مسودة";
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

export default function CouponManagementWidget() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
          🎫
        </div>
        <h3 className="font-bold text-foreground text-sm">إدارة القسائم</h3>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">4 قسائم نشطة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs text-muted-foreground">243 مستخدم</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-xs text-muted-foreground">45,000 د.ج خصم</span>
        </div>
      </div>

      {/* Coupon list */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {COUPONS.map((coupon) => {
          const isExpiringSoon = coupon.expiresIn !== undefined && coupon.expiresIn <= 3;
          return (
            <motion.div
              key={coupon.code}
              variants={itemVariants}
              className={`relative rounded-xl border p-4 space-y-3 transition-colors ${
                coupon.status === "EXPIRED"
                  ? "border-border/50 opacity-60"
                  : isExpiringSoon
                  ? "border-amber-400 dark:border-amber-500/50"
                  : "border-border"
              }`}
            >
              {/* Warning pulse for expiring soon */}
              {isExpiringSoon && (
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-amber-400 dark:border-amber-500/60"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}

              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{coupon.name}</p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusBadge(coupon.status)}`}
                    >
                      {getStatusLabel(coupon.status)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono tracking-wider">
                    {coupon.code}
                  </p>
                </div>
                <span className="text-sm font-black text-primary">{coupon.discount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  مُستخدم {coupon.usedCount} مرة
                  {coupon.expiresIn && (
                    <span className={isExpiringSoon ? " text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                      {" "}• ينتهي خلال {coupon.expiresIn} أيام
                    </span>
                  )}
                </span>
                {coupon.status !== "EXPIRED" && (
                  <div className="flex items-center gap-2">
                    <button className="text-[11px] font-medium text-primary hover:underline">تعديل</button>
                    <button className="text-[11px] font-medium text-muted-foreground hover:text-red-500 hover:underline">تعطيل</button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
