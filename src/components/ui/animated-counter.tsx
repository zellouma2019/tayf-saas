"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  formatFn?: (n: number) => string;
}

/**
 * Animated counter that counts up from 0 to the target value.
 * Uses requestAnimationFrame for smooth animation.
 */
export function AnimatedCounter({
  value,
  duration = 800,
  className,
  formatFn,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number>(0);
  const prevValueRef = useRef(value);

  useEffect(() => {
    // If value hasn't changed, no animation needed
    if (prevValueRef.current === value) return;
    prevValueRef.current = value;

    const startValue = displayValue;
    startTimeRef.current = null;

    function animate(currentTime: number) {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial animation on mount
  useEffect(() => {
    const startValue = 0;
    startTimeRef.current = null;

    function animate(currentTime: number) {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayText = formatFn
    ? formatFn(displayValue)
    : displayValue.toLocaleString("ar-DZ");

  return (
    <span className={className}>
      {displayText}
    </span>
  );
}
