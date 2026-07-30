"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, CheckCircle2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedCounter } from "@/components/ui/animated-counter";

// ===== CustomerReviewsWidget =====
// ويدجت تقييمات العملاء — يعرض التقييمات والأرقام للمنتج

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
}

interface CustomerReviewsWidgetProps {
  shopName: string;
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
  className?: string;
}

/** عرض نجوم التقييم */
function RatingStars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const iconClass = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="review-stars flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            iconClass,
            i < Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-muted-foreground/25"
          )}
        />
      ))}
    </div>
  );
}

/** الأحرف الأولى من الاسم للحرف الأول */
function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

/** وصف المشاعر حسب التقييم */
function getSentimentLabel(rating: number): { label: string; color: string } {
  if (rating >= 4.5) return { label: "ممتاز", color: "text-emerald-600 dark:text-emerald-400" };
  if (rating >= 3.5) return { label: "جيد جداً", color: "text-sky-600 dark:text-sky-400" };
  if (rating >= 2.5) return { label: "جيد", color: "text-amber-600 dark:text-amber-400" };
  return { label: "يحتاج تحسين", color: "text-rose-600 dark:text-rose-400" };
}

export function CustomerReviewsWidget({
  shopName,
  averageRating,
  totalReviews,
  reviews,
  className,
}: CustomerReviewsWidgetProps) {
  const [showAll, setShowAll] = useState(false);
  const sentiment = getSentimentLabel(averageRating);

  // عدد التقييمات المعروضة
  const displayedReviews = showAll ? reviews : reviews.slice(0, 4);

  return (
    <Card className={cn("widget-glass card-glass-morphism overflow-hidden", className)}>
      {/* رأس الويدجت: متوسط التقييم */}
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          تقييمات {shopName}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ملخص التقييم */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="text-center">
            <AnimatedCounter
              value={Math.round(averageRating * 10) / 10}
              className="text-3xl font-bold text-foreground tabular-nums"
              formatFn={(n) => (n / 10).toFixed(1)}
            />
            <div className="mt-1">
              <RatingStars rating={averageRating} size="sm" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-medium mb-1", sentiment.color)}>
              {sentiment.label}
            </p>
            <p className="text-xs text-muted-foreground">
              بناءً على{" "}
              <span className="font-bold text-foreground tabular-nums">
                {totalReviews.toLocaleString("ar-SA-u-nu-latn")}
              </span>{" "}
              تقييم
            </p>
          </div>
        </div>

        {/* قائمة التقييمات */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayedReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className={cn(
                  "review-card p-3 rounded-xl border border-border/50",
                  "bg-background/50 hover:bg-accent/30 transition-colors"
                )}
              >
                <div className="flex items-start gap-2.5">
                  {/* حرف أول العميل */}
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {getInitial(review.customerName)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* اسم وتاريخ */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {review.customerName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {review.verified && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {review.date}
                        </span>
                      </div>
                    </div>
                    {/* النجوم */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <RatingStars rating={review.rating} size="sm" />
                      {review.verified && (
                        <Badge variant="secondary" className="verified-review text-[9px] px-1.5 py-0 h-4">
                          موثّق
                        </Badge>
                      )}
                    </div>
                    {/* التعليق */}
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* زر عرض الكل */}
        {reviews.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs text-primary hover:text-primary/80"
          >
            {showAll ? "عرض أقل" : "عرض الكل"}
            <ChevronLeft
              className={cn(
                "h-3.5 w-3.5 mr-1 transition-transform",
                showAll && "rotate-180"
              )}
            />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
