"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Star, ChevronRight, ChevronLeft } from "lucide-react";

interface Review {
  rating: number;
  review: string;
  serviceName: string;
  serviceType: string;
  ratedAt: string;
  customerName?: string;
}

/** ألوان دافئة للبطاقات */
const AVATAR_COLORS = [
  "from-amber-400 to-orange-500",
  "from-rose-400 to-pink-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-red-500",
  "from-yellow-400 to-amber-500",
  "from-rose-400 to-orange-500",
];

const BORDER_ACCENTS = [
  "border-t-amber-400",
  "border-t-rose-400",
  "border-t-emerald-400",
  "border-t-orange-400",
  "border-t-yellow-400",
  "border-t-rose-400",
];

const CARD_GRADIENTS = [
  "from-amber-500/5 to-orange-500/5 dark:from-amber-500/10 dark:to-orange-500/10",
  "from-rose-500/5 to-pink-500/5 dark:from-rose-500/10 dark:to-pink-500/10",
  "from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10",
  "from-orange-500/5 to-red-500/5 dark:from-orange-500/10 dark:to-red-500/10",
  "from-yellow-500/5 to-amber-500/5 dark:from-yellow-500/10 dark:to-amber-500/10",
  "from-rose-500/5 to-orange-500/5 dark:from-rose-500/10 dark:to-orange-500/10",
];

const SERVICE_EMOJI: Record<string, string> = {
  document: "🖨️",
  photo: "🖼️",
  binding: "📚",
  copy: "📄",
  card: "🪪",
  poster: "📜",
};

const DEFAULT_REVIEWS: Review[] = [
  { rating: 5, review: "سرعة مذهلة! طلبت 50 نسخة وكنت أستلمها خلال ساعة. الجودة ممتازة!", serviceName: "طباعة مستند", serviceType: "document", ratedAt: new Date(Date.now() - 2 * 86400000).toISOString(), customerName: "أمين بوعلام" },
  { rating: 5, review: "أفضل مطبعة تعاملت معها! خدمة العملاء رائعة. أنصح الجميع!", serviceName: "طباعة صور", serviceType: "photo", ratedAt: new Date(Date.now() - 5 * 86400000).toISOString(), customerName: "سارة محمدي" },
  { rating: 4, review: "تجليد رسالتي الجامعية كان احترافي بامتياز. الغلاف فاخر!", serviceName: "تجليد", serviceType: "binding", ratedAt: new Date(Date.now() - 8 * 86400000).toISOString(), customerName: "يوسف بن أحمد" },
  { rating: 5, review: "بطاقات الأعمال ظهرت أجمل مما توقعت! ألوان دقيقة جداً.", serviceName: "بطاقات", serviceType: "card", ratedAt: new Date(Date.now() - 12 * 86400000).toISOString(), customerName: "نور الهدى" },
  { rating: 5, review: "رفعت ملفي من الجوال واستلمت طلبي في نفس اليوم. ممتاز!", serviceName: "طباعة مستند", serviceType: "document", ratedAt: new Date(Date.now() - 20 * 86400000).toISOString(), customerName: "كريم بلقاسم" },
  { rating: 4, review: "الملصقات كانت ممتازة. الألوان زاهية والورق سميك. أسعار منافسة!", serviceName: "ملصقات", serviceType: "poster", ratedAt: new Date(Date.now() - 30 * 86400000).toISOString(), customerName: "فاطمة الزهراء" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= rating
              ? "text-amber-400 fill-amber-400"
              : "text-neutral-300 dark:text-neutral-600"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, index }: { review: Review; index: number }) {
  const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const gradientClass = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const borderAccent = BORDER_ACCENTS[index % BORDER_ACCENTS.length];
  const name = review.customerName || "مستخدم";

  return (
    <div
      className={`flex-shrink-0 w-[280px] sm:w-[320px] bg-gradient-to-br ${gradientClass} border border-border/60 ${borderAccent} border-t-[3px] rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
    >
      <div className="mb-3 flex items-center gap-2">
        <StarRating rating={review.rating} />
        <span className="text-[11px] text-muted-foreground">
          {SERVICE_EMOJI[review.serviceType] || "📄"} {review.serviceName}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-foreground/85 min-h-[4rem]">
        {review.review}
      </p>

      <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shrink-0 shadow-sm text-sm font-bold`}
        >
          {name.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{name}</div>
          <div className="text-[11px] text-muted-foreground">
            {(() => {
              const days = Math.floor((Date.now() - new Date(review.ratedAt).getTime()) / 86400000);
              return days === 0 ? "اليوم" : `منذ ${days} يوم`;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

const AUTO_SCROLL_SPEED = 0.5; // pixels per frame

export function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const scrollPosRef = useRef(0);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/reviews");
        if (res.ok) {
          const data = await res.json();
          const fetched = Array.isArray(data.reviews) ? data.reviews : [];
          setReviews(fetched.length > 0 ? fetched : DEFAULT_REVIEWS);
        } else {
          setReviews(DEFAULT_REVIEWS);
        }
      } catch {
        setReviews(DEFAULT_REVIEWS);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, []);

  // Duplicate reviews for infinite scroll effect
  const displayReviews = reviews.length > 0 ? [...reviews, ...reviews] : [];

  // Auto-scroll animation
  useEffect(() => {
    if (loading || displayReviews.length === 0) return;
    const container = scrollRef.current;
    if (!container) return;

    const halfWidth = container.scrollWidth / 2;

    function animate() {
      if (!isPausedRef.current) {
        scrollPosRef.current += AUTO_SCROLL_SPEED;
        if (scrollPosRef.current >= halfWidth) {
          scrollPosRef.current = 0;
        }
        container.scrollLeft = scrollPosRef.current;
      }
      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [loading, displayReviews.length]);

  const scrollBy = useCallback((direction: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = 320;
    container.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
    // Update scrollPosRef to match after scroll
    setTimeout(() => {
      scrollPosRef.current = container.scrollLeft;
    }, 400);
  }, []);

  if (loading) {
    return (
      <section className="py-8 md:py-12 no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold">آراء عملائنا</h2>
            <div className="mt-2 mx-auto w-12 h-1 rounded-full bg-gradient-to-l from-amber-400 to-amber-500" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[280px] h-52 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* العنوان */}
        <div className="mb-6 text-center">
          <h2 className="text-xl md:text-2xl font-bold">آراء عملائنا</h2>
          <div className="mt-2 mx-auto w-12 h-1 rounded-full bg-gradient-to-l from-amber-400 to-amber-500" />
          <p className="text-sm text-muted-foreground mt-2">
            {reviews.length} تقييم من عملائنا
          </p>
        </div>

        {/* منطقة التمرير */}
        <div className="relative group">
          {/* زر يمين (السابق) */}
          <button
            onClick={() => scrollBy(-1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-lg border border-border/60 items-center justify-center hover:bg-white dark:hover:bg-neutral-700 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
            aria-label="السابق"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* زر يسار (التالي) */}
          <button
            onClick={() => scrollBy(1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-lg border border-border/60 items-center justify-center hover:bg-white dark:hover:bg-neutral-700 transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
            aria-label="التالي"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* تدرج يمنى */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-[5] pointer-events-none hidden md:block" />
          {/* تدرج يسرى */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-[5] pointer-events-none hidden md:block" />

          {/* الحاوية المتحركة */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1"
            style={{ direction: "ltr" }}
            onMouseEnter={() => (isPausedRef.current = true)}
            onMouseLeave={() => (isPausedRef.current = false)}
            onTouchStart={() => (isPausedRef.current = true)}
            onTouchEnd={() => { setTimeout(() => (isPausedRef.current = false), 3000); }}
          >
            {displayReviews.map((r, i) => (
              <div key={i} dir="rtl">
                <ReviewCard review={r} index={i % reviews.length} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
