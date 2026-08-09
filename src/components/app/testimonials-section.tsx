"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Star, MessageSquarePlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  review?: string;
  serviceEmoji?: string;
  serviceName?: string;
  createdAt: string;
  customerName?: string;
}

const WARM_COLORS = [
  "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/60 dark:border-amber-800/40",
  "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/60 dark:border-emerald-800/40",
  "from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border-rose-200/60 dark:border-rose-800/40",
  "from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 border-orange-200/60 dark:border-orange-800/40",
];

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex gap-0.5" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            starSize,
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ar-DZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TestimonialsSection() {
  const { shop } = useShop();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchReviews = useCallback(async () => {
    if (!shop?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews?shopId=${shop.id}`);
      if (!res.ok) throw new Error("فشل تحميل التقييمات");
      const data = await res.json();
      setReviews(Array.isArray(data.reviews) ? data.reviews : data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ غير معروف");
    } finally {
      setLoading(false);
    }
  }, [shop?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (reviews.length <= 1 || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reviews.length, isPaused]);

  // Smooth scroll to current card
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || reviews.length === 0) return;

    const cardWidth = container.scrollWidth / reviews.length;
    container.scrollTo({
      left: currentIndex * cardWidth,
      behavior: "smooth",
    });
  }, [currentIndex, reviews.length]);

  const visibleCount = typeof window !== "undefined" && window.innerWidth >= 1024 ? 3 : 1;
  const maxIndex = Math.max(0, reviews.length - visibleCount);

  const goNext = () => setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  const goPrev = () => setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));

  if (loading) {
    return (
      <section className="w-full py-8" dir="rtl">
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 min-w-[280px] h-40 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full py-8" dir="rtl">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchReviews}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <section className="w-full py-8" dir="rtl">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <MessageSquarePlus className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-foreground">لا توجد تقييمات بعد</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              كن أول من يقيّم خدماتنا! نحن نسعى لتقديم أفضل تجربة لك.
            </p>
            <Button size="sm" className="mt-1">
              أضف تقييمك
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section
      className="w-full py-8"
      dir="rtl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-bold text-foreground">آراء العملاء ✨</h2>
        {reviews.length > visibleCount && (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goNext}
              aria-label="التالي"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goPrev}
              aria-label="السابق"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Scrollable cards container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex gap-4 overflow-x-auto scroll-smooth",
          "scrollbar-none",
          "snap-x snap-mandatory"
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {reviews.map((review, idx) => (
          <Card
            key={review.id}
            className={cn(
              "min-w-[300px] md:min-w-[320px] lg:min-w-[calc(33.333%-1rem)] flex-shrink-0 snap-start",
              "bg-gradient-to-br transition-all duration-500",
              WARM_COLORS[idx % WARM_COLORS.length]
            )}
          >
            <CardContent className="p-4 flex flex-col gap-3">
              {/* Top row: emoji + name + date */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {review.serviceEmoji && (
                    <span className="text-xl" role="img" aria-label={review.serviceName}>
                      {review.serviceEmoji}
                    </span>
                  )}
                  {review.customerName && (
                    <span className="font-medium text-sm text-foreground">
                      {review.customerName}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {formatDate(review.createdAt)}
                </span>
              </div>

              {/* Stars */}
              <StarRating rating={review.rating} size="sm" />

              {/* Review text */}
              {review.review ? (
                <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                  &ldquo;{review.review}&rdquo;
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">بدون تعليق</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dots indicator */}
      {reviews.length > visibleCount && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentIndex
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`انتقل إلى المجموعة ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
