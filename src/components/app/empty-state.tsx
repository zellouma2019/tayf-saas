"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  emoji?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export function EmptyState({
  title,
  description,
  emoji,
  actionLabel,
  onAction,
  icon: Icon,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {/* Animated illustration */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mb-5 flex items-center justify-center"
      >
        {emoji ? (
          <span
            className="block text-[64px] leading-none opacity-15 select-none"
            role="img"
            aria-hidden
          >
            {emoji}
          </span>
        ) : Icon ? (
          <Icon className="size-16 text-muted-foreground/15" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            className="text-muted-foreground/15"
            aria-hidden="true"
          >
            {/* Outer circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="6 4"
              opacity="0.6"
            />
            {/* Magnifying glass handle */}
            <line
              x1="45"
              y1="45"
              x2="56"
              y2="56"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Magnifying glass lens */}
            <circle
              cx="28"
              cy="28"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
          </svg>
        )}
      </motion.div>

      {/* Title */}
      <h3 className="text-lg font-bold text-foreground">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}

      {/* Action button */}
      {actionLabel && (
        <Button
          variant="secondary"
          className={cn("mt-5")}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}