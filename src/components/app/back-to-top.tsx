"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const view = useAppStore((s) => s.view);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (view === "admin") return null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-24 right-4 z-40 lg:bottom-6 lg:right-6"
        >
          <button
            onClick={scrollToTop}
            aria-label="العودة للأعلى"
            className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all cursor-pointer"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}