"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronRight, ChevronLeft, MessageSquare, Printer } from "lucide-react";

interface Review {
  rating: number;
  review: string;
  serviceName: string;
  serviceType: string;
  ratedAt: string;
}
/** ألوان دافئة فقط — بدون أزرق/بنفسجي/سيان */
const AVATAR_COLORS = [
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-red-500",
  "from-yellow-400 to-amber-500",
];

const BORDER_ACCENTS = [
  "border-l-amber-400",
  "border-l-rose-400",
  "border-l-emerald-400",
  "border-l-orange-400",
  "border-l-yellow-400",
];

const CARD_GRADIENTS = [
  "from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10",
  "from-rose-500/5 to-pink-500/5 dark:from-rose-500/10 dark:to-pink-500/10",
  "from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10",
  "from-orange-500/5 to-red-500/5 dark:from-orange-500/10 dark:to-red-500/10",
  "from-yellow-500/5 to-amber-500/5 dark:from-yellow-500/10 dark:to-amber-500/10",
];

const SERVICE_EMOJI: Record<string, string> = {
  document: "🖨️",
  photo: "🖼️",
  binding: "📚",
  copy: "📄",
  card: "🪪",
  poster: "📜",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating
              ? "text-amber-400 fill-amber-400"
              : "text-neutral-300 dark:text-neutral-600"
          }`}
        />
      ))}
    </div>
  );
}

function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-DZ-u-nu-latn", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function TestimonialCard({
  review,
  index,
}: {
  review: Review;
  index: number;
}) {
  const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const gradientClass = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const borderAccent = BORDER_ACCENTS[index % BORDER_ACCENTS.length];

  return (
    <div
      className={`bg-gradient-to-br ${gradientClass} border border-border/60 ${borderAccent} border-l-4 rounded-xl p-3.5 md:p-4 relative overflow-hidden min-w-0 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-border/80`}
    >
      {/* علامة اقتباس */}
      <span className="absolute top-2 right-3 text-5xl leading-none select-none opacity-[0.06] dark:opacity-[0.10] font-serif text-amber-500">
        &ldquo;
      </span>

      {/* التقييم + اسم الخدمة */}
      <div className="mb-2 flex items-center gap-2.5 relative z-10">
        <StarRating rating={review.rating} />
        <span className="text-xs text-muted-foreground">
          {SERVICE_EMOJI[review.serviceType] || "📄"} {review.serviceName}
        </span>
      </div>

      {/* نص التعليق */}
      <p className="text-[13px] leading-relaxed text-foreground/85 relative z-10 min-h-[2.5rem]">
        {review.review}
      </p>

      {/* علامة اقتباس نهاية */}
      <span className="absolute bottom-3 left-3 text-5xl leading-none select-none opacity-[0.06] dark:opacity-[0.10] font-serif text-amber-500 rotate-180">
        &ldquo;
      </span>

      {/* فاصل + تاريخ */}
      <div className="relative z-10 my-2.5 border-t border-border/40" />
      <div className="flex items-center gap-2 relative z-10">
        <div
          className={`w-7 h-7 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shrink-0 shadow-sm`}
        >
          <MessageSquare className="h-3.5 w-3.5" />
        </div>
        <div className="text-[11px] text-muted-foreground">
          {formatReviewDate(review.ratedAt)}
        </div>
      </div>
    </div>
  );
}

/** حالة فارغة — لا توجد آراء بعد */
function EmptyReviews() {
  return (
    <div className="py-8 text-center">
      <div className="w-12 h-12 mx-auto rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
        <Printer className="h-6 w-6 text-amber-700 dark:text-amber-400" />
      </div>
      <h3 className="text-sm font-bold mb-1">لا توجد آراء بعد</h3>
      <p className="text-xs text-muted-foreground max-w-md mx-auto">
        كن أول من يُقيّم تجربته معنا! بعد استلام طلبك يمكنك ترك تقييمك في صفحة التتبع.
      </p>
    </div>
  );
}

const AUTO_SCROLL_INTERVAL = 5000;

export function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);

  // جلب الآراء الحقيقية من قاعدة البيانات
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/reviews");
        if (res.ok) {
          const data = await res.json();
          setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  const goNext = useCallback(() => {
    if (reviews.length === 0) return;
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  }, [reviews.length]);

  const goPrev = useCallback(() => {
    if (reviews.length === 0) return;
    setDirection(-1);
    setActiveIndex(
      (prev) => (prev - 1 + reviews.length) % reviews.length
    );
  }, [reviews.length]);

  const goTo = useCallback(
    (index: number, dir?: number) => {
      setDirection(dir ?? (index > activeIndex ? 1 : -1));
      setActiveIndex(index);
    },
    [activeIndex]
  );

  // التمرير التلقائي
  useEffect(() => {
    if (reviews.length <= 1) return;
    intervalRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        goNext();
      }
    }, AUTO_SCROLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [goNext, reviews.length]);

  // إعادة ضبط المؤقت عند التفاعل اليدوي
  const resetAutoScroll = useCallback(() => {
    if (reviews.length <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        goNext();
      }
    }, AUTO_SCROLL_INTERVAL);
  }, [goNext, reviews.length]);

  const handleDotClick = useCallback(
    (index: number) => {
      goTo(index);
      resetAutoScroll();
    },
    [goTo, resetAutoScroll]
  );

  const handlePrev = useCallback(() => {
    goPrev();
    resetAutoScroll();
  }, [goPrev, resetAutoScroll]);

  const handleNext = useCallback(() => {
    goNext();
    resetAutoScroll();
  }, [goNext, resetAutoScroll]);

  // حالة التحميل
  if (loading) {
    return (
      <section className="py-5 md:py-7 bg-gradient-to-b from-muted/40 to-muted/20 no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-5">
            <h2 className="text-base md:text-lg font-bold">آراء عملائنا</h2>
            <div className="mt-1.5 mx-auto w-10 h-0.5 rounded-full bg-gradient-to-l from-amber-400 to-amber-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // لا توجد آراء
  if (reviews.length === 0) {
    return (
      <section className="py-5 md:py-7 bg-gradient-to-b from-muted/40 to-muted/20 no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-4">
            <h2 className="text-base md:text-lg font-bold">آراء عملائنا</h2>
            <div className="mt-1.5 mx-auto w-10 h-0.5 rounded-full bg-gradient-to-l from-amber-400 to-amber-500" />
          </div>
          <EmptyReviews />
        </div>
      </section>
    );
  }

  // الكاروسيل
  return (
    <section className="py-5 md:py-7 bg-gradient-to-b from-muted/40 to-muted/20 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* العنوان + عدد الآراء */}
        <div className="mb-5 text-center">
          <h2 className="text-base md:text-lg font-bold">آراء عملائنا</h2>
          <div className="mt-1.5 mx-auto w-10 h-0.5 rounded-full bg-gradient-to-l from-amber-400 to-amber-500" />
          <p className="text-sm text-muted-foreground mt-2">
            {reviews.length} تقييم حقيقي من عملائنا
          </p>
        </div>

        {/* منطقة الكاروسيل */}
        <div
          className="relative"
          onMouseEnter={() => (isPausedRef.current = true)}
          onMouseLeave={() => (isPausedRef.current = false)}
        >
          {/* أزرار التنقل */}
          <button
            onClick={handlePrev}
            className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border border-border shadow-sm items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            aria-label="السابق"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-neutral-800 border border-border shadow-sm items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            aria-label="التالي"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* الجوال: بطاقة واحدة */}
          <div className="md:hidden overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={activeIndex}
                custom={direction}
                initial={{ opacity: 0, x: direction * 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -60 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <TestimonialCard
                  review={reviews[activeIndex]}
                  index={activeIndex}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* التابلت: بطاقتين */}
          <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-4">
            {reviews.map((r, i) => {
              const offset = ((i - activeIndex) % reviews.length + reviews.length) % reviews.length;
              const isVisible = offset <= 1;
              return (
                <AnimatePresence key={i} initial={false}>
                  {isVisible && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15, scale: 0.97 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }}
                    >
                      <TestimonialCard review={r} index={i} />
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
          </div>

          {/* Desktop: 3 cards */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-4">
            {reviews.map((r, i) => {
              const offset =
                ((i - activeIndex) % reviews.length + reviews.length) %
                reviews.length;
              const isVisible = offset <= 2;

              return (
                <AnimatePresence key={i} initial={false}>
                  {isVisible && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -15, scale: 0.97 }}
                      transition={{
                        duration: 0.4,
                        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
                      }}
                    >
                      <TestimonialCard review={r} index={i} />
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
          </div>
        </div>

        {/* مؤشرات النقاط */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              aria-label={`الانتقال للرأي ${i + 1}`}
              className="relative group outline-none"
            >
              <motion.span
                className="block rounded-full"
                animate={{
                  width: i === activeIndex ? 24 : 8,
                  height: 8,
                  backgroundColor:
                    i === activeIndex
                      ? "oklch(0.82 0.13 85)"
                      : "oklch(0.7 0.01 260 / 30%)"
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                }}
              />
            </button>
          ))}
        </div>

        {/* شريط التقدم */}
        {reviews.length > 1 && (
          <div className="flex justify-center mt-3">
            <div className="w-20 h-0.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <motion.div
                key={activeIndex}
                className="h-full bg-amber-400 rounded-full origin-right"
                initial={{ scaleX: 1, x: "0%" }}
                animate={{ scaleX: 0, x: "100%" }}
                transition={{
                  duration: AUTO_SCROLL_INTERVAL / 1000,
                  ease: "linear",
                }}
                style={{ width: "100%" }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
