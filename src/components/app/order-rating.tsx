"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, CheckCircle2, Loader2, Send } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface OrderRatingProps {
  /** The order ID to rate */
  orderId: string;
  /** The current order status */
  orderStatus: string;
  /** Whether the order already has a rating */
  hasRating?: boolean;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

const starVariants = {
  idle: { scale: 1, rotate: 0 },
  hover: { scale: 1.25, rotate: -8 },
  selected: { scale: 1.15, rotate: 0 },
};

const RATING_LABELS: Record<number, string> = {
  1: "سيء",
  2: "ضعيف",
  3: "مقبول",
  4: "جيد",
  5: "ممتاز",
};

export function OrderRating({
  orderId,
  orderStatus,
  hasRating = false,
  open,
  onOpenChange,
}: OrderRatingProps) {
  const { shop } = useShop();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't render if order isn't delivered or already rated
  const shouldShow = orderStatus === "delivered" && !hasRating && !success;

  const handleSubmit = async () => {
    if (selectedRating === 0 || !shop?.id) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/rate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: selectedRating,
          review: review.trim() || undefined,
          shopId: shop.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "فشل إرسال التقييم");
      }

      setSuccess(true);
      // Auto close after a short delay
      setTimeout(() => onOpenChange(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoveredStar || selectedRating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
              >
                <CheckCircle2 className="h-20 w-20 text-emerald-500" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-foreground"
              >
                شكراً لتقييمك! 🎉
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="text-sm text-muted-foreground text-center"
              >
                نحن نقدر رأيك وسنعمل دائماً على تحسين خدماتنا
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-5"
            >
              <DialogHeader>
                <DialogTitle className="text-xl">
                قيّم طلبك ⭐
                </DialogTitle>
                <DialogDescription>
                  كيف كانت تجربتك مع هذا الطلب؟ تقييمك يساعدنا على التحسين.
                </DialogDescription>
              </DialogHeader>

              {/* Star rating */
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="flex gap-2" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      variants={starVariants}
                      animate={
                        selectedRating === star
                          ? "selected"
                          : hoveredStar === star
                            ? "hover"
                            : "idle"
                      }
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "p-1 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        star <= displayRating
                          ? "text-amber-400"
                          : "text-muted-foreground/30"
                      )}
                      aria-label={`${star} نجوم`}
                    >
                      <Star
                        className="h-10 w-10"
                        fill={star <= displayRating ? "currentColor" : "none"}
                        strokeWidth={star <= displayRating ? 1 : 1.5}
                      />
                    </motion.button>
                  ))}
                </div>
                {displayRating > 0 && (
                  <motion.span
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-medium text-amber-600 dark:text-amber-400"
                  >
                    {RATING_LABELS[displayRating]}
                  </motion.span>
                )}
              </div>

              {/* Optional text review */
              <div className="space-y-2">
                <Textarea
                  placeholder="أضف تعليقاً اختيارياً (اختياري)..."
                  value={review}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setReview(e.target.value);
                      setError(null);
                    }
                  }}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {review.length}/300
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-destructive text-xs text-center">{error}</p>
              )}

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  لاحقاً
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={selectedRating === 0 || submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  إرسال التقييم
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
