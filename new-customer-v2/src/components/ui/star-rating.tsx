"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
}

const SIZE_MAP = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
} as const;

const TEXT_SIZE_MAP = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
} as const;

export function StarRating({
  value,
  onChange,
  size = "md",
  readonly = false,
  showValue = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const handleMouseEnter = useCallback((star: number) => {
    if (!readonly && onChange) {
      setHoverValue(star);
    }
  }, [readonly, onChange]);

  const handleMouseLeave = useCallback(() => {
    setHoverValue(0);
  }, []);

  const handleClick = useCallback((star: number) => {
    if (!readonly && onChange) {
      onChange(star);
    }
  }, [readonly, onChange]);

  const displayValue = hoverValue || value;

  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
        role={readonly ? undefined : "radiogroup"}
        aria-label={`تقييم ${value} من 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;
          const isHalf = !isFilled && star - 0.5 <= displayValue;
          const isHovered = hoverValue > 0 && star <= hoverValue;

          return (
            <motion.button
              key={star}
              type="button"
              disabled={readonly}
              className={`relative focus:outline-none ${
                readonly
                  ? "cursor-default"
                  : "cursor-pointer"
              }`}
              onMouseEnter={() => handleMouseEnter(star)}
              onClick={() => handleClick(star)}
              whileHover={!readonly ? { scale: 1.1 } : {}}
              whileTap={!readonly ? { scale: 0.9 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              aria-label={`${star} نج${star === 1 ? "مة" : "م"}`}
              role={readonly ? undefined : "radio"}
              aria-checked={star === value}
            >
              <Star
                className={`${SIZE_MAP[size]} transition-colors duration-150 ${
                  isFilled
                    ? "text-amber-500 fill-amber-500"
                    : isHalf
                      ? "text-amber-500 fill-amber-500/50"
                      : isHovered
                        ? "text-amber-400 fill-amber-400/40"
                        : "text-neutral-300 dark:text-neutral-600"
                }`}
              />
            </motion.button>
          );
        })}
      </div>
      {showValue && (
        <span className={`${TEXT_SIZE_MAP[size]} font-bold text-amber-600 dark:text-amber-400`}>
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
