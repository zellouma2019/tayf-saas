"use client";

import { useState } from "react";
import { Star, Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface OrderRatingProps {
  order: {
    id: string;
    reference: string;
    status: string;
    rating?: number | null;
    serviceName: string;
  };
}

const STAR_LABELS = ["سيء جداً", "سيء", "عادي", "جيد", "ممتاز"];

export function OrderRating({ order }: OrderRatingProps) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // لا تُعرض إلا للطلبات المُسلَّمة غير المُقيَّمة
  if (order.status !== "delivered" || order.rating) return null;

  const displayStars = hovered || selected;

  async function handleSubmit() {
    if (selected === 0) {
      toast.error("يرجى اختيار التقييم أولاً");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/rate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: selected,
          review: review.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "حدث خطأ أثناء إرسال التقييم");
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {!submitted ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-800/50 p-5"
        >
          {/* العنوان */}
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">😊</div>
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
              كيف كانت تجربتك؟
            </h3>
            <p className="text-sm text-amber-700/70 dark:text-amber-400/70 mt-1">
              شاركنا رأيك في خدمة &quot;{order.serviceName}&quot;
            </p>
          </div>

          {/* النجوم */}
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={loading}
                className="focus:outline-none transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setSelected(star)}
                aria-label={`${star} نجوم`}
              >
                <Star
                  className={`h-9 w-9 transition-colors duration-150 ${
                    star <= displayStars
                      ? "fill-amber-400 text-amber-400"
                      : "fill-transparent text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* وصف التقييم */}
          {displayStars > 0 && (
            <motion.p
              key={displayStars}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm font-medium text-amber-700 dark:text-amber-300 mb-4"
            >
              {STAR_LABELS[displayStars - 1]}
            </motion.p>
          )}

          {/* حقل التعليق */}
          {selected > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="أضف تعليقاً اختيارياً... (اختياري)"
                rows={3}
                disabled={loading}
                className="w-full rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-neutral-900 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 placeholder:text-muted-foreground/50 disabled:opacity-50"
              />
            </motion.div>
          )}

          {/* زر الإرسال */}
          {selected > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2 px-8 rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جارٍ الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    إرسال التقييم
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800/50 p-5 text-center"
        >
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
            شكراً لتقييمك! 🙏
          </h3>
          <div className="flex justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-6 w-6 ${
                  star <= selected
                    ? "fill-amber-400 text-amber-400"
                    : "fill-transparent text-muted-foreground/20"
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}