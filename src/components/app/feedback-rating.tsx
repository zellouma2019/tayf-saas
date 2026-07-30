"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Send, CheckCircle2, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ===== FeedbackRating =====
// مكون التقييم والتعليقات — تفاعلي مع نجوم ونموذج ردود الفعل

interface FeedbackRatingProps {
  orderId: string;
  shopName: string;
  onSubmit: (rating: number, feedback: string) => void;
  className?: string;
}

/** وصف المشاعر حسب التقييم */
function getSentimentInfo(rating: number): {
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
} {
  if (rating >= 5) return { label: "ممتاز!", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", emoji: "🤩" };
  if (rating >= 4) return { label: "جيد جداً", color: "text-sky-600 dark:text-sky-400", bgColor: "bg-sky-50 dark:bg-sky-950/30", emoji: "😊" };
  if (rating >= 3) return { label: "جيد", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950/30", emoji: "🙂" };
  if (rating >= 2) return { label: "مقبول", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-50 dark:bg-orange-950/30", emoji: "😐" };
  return { label: "يحتاج تحسين", color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-50 dark:bg-rose-950/30", emoji: "😞" };
}

/** حالة المكون: التقييم → التعليق → إرسال → شكراً */
type FeedbackState = "rating" | "feedback" | "submitting" | "thanks";

export function FeedbackRating({
  orderId,
  shopName,
  onSubmit,
  className,
}: FeedbackRatingProps) {
  const [state, setState] = useState<FeedbackState>("rating");
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");

  // التقييم المعروض (المعلّق أو المختار)
  const displayRating = hoverRating || selectedRating;
  const sentiment = getSentimentInfo(selectedRating);

  /** معالجة اختيار النجمة */
  const handleStarClick = (rating: number) => {
    setSelectedRating(rating);
    // الانتقال لنموذج التعليق بعد اختيار التقييم
    setTimeout(() => setState("feedback"), 200);
  };

  /** معالجة إرسال التعليق */
  const handleSubmit = () => {
    setState("submitting");
    // محاكاة إرسال ثم الانتقال لحالة الشكر
    setTimeout(() => {
      onSubmit(selectedRating, feedbackText);
      setState("thanks");
    }, 600);
  };

  return (
    <Card className={cn("card-glass-morphism overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          قيّم تجربتك مع {shopName}
        </CardTitle>
        {orderId && (
          <p className="text-[10px] font-mono text-muted-foreground">
            طلب #{orderId}
          </p>
        )}
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {/* حالة الشكر */}
          {state === "thanks" && (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-3 py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              >
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </motion.div>
              <p className="text-sm font-bold text-foreground">
                شكراً لتقييمك! 🎉
              </p>
              <p className="text-xs text-muted-foreground text-center">
                نحن نقدر ملاحظاتك ونسعى دائماً لتحسين خدماتنا
              </p>
              <div className="flex items-center gap-0.5 mt-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < selectedRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-foreground/25"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* حالة الإرسال */}
          {state === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
              />
              <p className="text-xs text-muted-foreground">جارٍ الإرسال...</p>
            </motion.div>
          )}

          {/* حالة التعليق */}
          {state === "feedback" && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="feedback-form space-y-3"
            >
              {/* ملخص التقييم المختار */}
              <div className="flex items-center gap-2">
                <span className="text-lg">{sentiment.emoji}</span>
                <div>
                  <p className={cn("text-xs font-bold", sentiment.color)}>
                    {sentiment.label}
                  </p>
                  <div className="rating-display flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < selectedRating
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/25"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* مؤشر المشاعر */}
              <div
                className={cn(
                  "sentiment-indicator flex items-center gap-2 p-2.5 rounded-lg border text-xs",
                  sentiment.bgColor
                )}
              >
                <ThumbsUp className={cn("h-3.5 w-3.5", sentiment.color)} />
                <span className={sentiment.color}>
                  {selectedRating}/5 — {sentiment.label}
                </span>
              </div>

              {/* حقل التعليق */}
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="أضف تعليقاً اختيارياً (اختياري)..."
                rows={3}
                className="rating-input w-full text-xs resize-none rounded-lg border border-border/50 bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
              />

              {/* أزرار */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  className="flex-1 text-xs"
                >
                  <Send className="h-3 w-3 ml-1" />
                  إرسال التقييم
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setState("rating");
                    setSelectedRating(0);
                  }}
                  className="text-xs"
                >
                  إعادة
                </Button>
              </div>
            </motion.div>
          )}

          {/* حالة التقييم — النجوم */}
          {state === "rating" && (
            <motion.div
              key="rating"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rating-input flex flex-col items-center gap-3 py-4"
            >
              <p className="text-xs text-muted-foreground">
                اختر تقييمك
              </p>

              {/* النجوم التفاعلية */}
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }, (_, i) => {
                  const starValue = i + 1;
                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleStarClick(starValue)}
                      className="focus:outline-none p-0.5"
                      aria-label={`${starValue} من 5 نجوم`}
                    >
                      <Star
                        className={cn(
                          "h-8 w-8 transition-colors cursor-pointer",
                          starValue <= displayRating
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/20 hover:text-amber-300"
                        )}
                      />
                    </motion.button>
                  );
                })}
              </div>

              {/* مؤشر المشاعر عند التحويم */}
              {displayRating > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="sentiment-indicator"
                >
                  <span
                    className={cn(
                      "text-xs font-medium px-3 py-1 rounded-full",
                      getSentimentInfo(displayRating).bgColor,
                      getSentimentInfo(displayRating).color
                    )}
                  >
                    {getSentimentInfo(displayRating).emoji}{" "}
                    {getSentimentInfo(displayRating).label}
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
