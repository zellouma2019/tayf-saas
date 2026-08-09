"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, CheckCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Returns a human-readable Arabic relative time string. */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days === 1) return "أمس";
  if (days < 7) return `منذ ${days} أيام`;
  return `منذ ${Math.floor(days / 7)} أسبوع`;
}

/** Truncate text to a max length with ellipsis. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const panelVariants = {
  hidden: { opacity: 0, scale: 0.92, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: -8,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.25, ease: "easeOut" },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

const badgePop = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: { type: "spring", stiffness: 500, damping: 20 },
  },
  exit: { scale: 0, transition: { duration: 0.15 } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function NotificationBadge() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adminUnlocked = useAppStore((s) => s.adminUnlocked);

  /* ---- Fetch unread count ---- */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?unreadOnly=true");
      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data) ? data.length : data?.count ?? 0;
        setUnreadCount(count);
      }
    } catch {
      /* silent */
    }
  }, []);

  /* ---- Fetch all notifications ---- */
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---- Mark single notification as read ---- */
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/notifications/${id}/read`, { method: "POST" });
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        /* silent */
      }
    },
    [],
  );

  /* ---- Mark all as read ---- */
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((n) => !n.read)
      .map((n) => n.id);

    if (unreadIds.length === 0) return;

    setMarkingAll(true);
    try {
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`/api/notifications/${id}/read`, { method: "POST" }),
        ),
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("تم تحديد جميع الإشعارات كمقروءة");
    } catch {
      toast.error("حدث خطأ أثناء تحديث الإشعارات");
    } finally {
      setMarkingAll(false);
    }
  }, [notifications]);

  /* ---- Open panel and fetch ---- */
  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  /* ---- Close on outside click ---- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  /* ---- Auto-refresh — only poll when admin is unlocked ---- */
  useEffect(() => {
    if (!adminUnlocked) return;
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUnreadCount, adminUnlocked]);

  /* ---- Refresh notifications list when panel is open (30s) ---- */
  useEffect(() => {
    if (!open) return;
    const id = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(id);
  }, [open, fetchNotifications]);

  return (
    <div ref={containerRef} className="relative">
      {/* ---- Bell Button ---- */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        aria-label="الإشعارات"
        className="relative"
      >
        <AnimatePresence mode="wait">
          {unreadCount > 0 ? (
            <motion.div
              key="bell-active"
              initial={{ scale: 0.6, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.6, rotate: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="relative"
            >
              <Bell className="h-[18px] w-[18px]" />
              {/* Pulse ring when unread */}
              <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
            </motion.div>
          ) : (
            <motion.div
              key="bell-inactive"
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.6 }}
              transition={{ duration: 0.2 }}
            >
              <BellOff className="h-[18px] w-[18px] text-muted-foreground" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Red count badge ---- */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              {...badgePop}
              className="absolute -top-0.5 -left-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-md pointer-events-none"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* ---- Dropdown Panel ---- */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full mt-2 left-0 w-[340px] sm:w-[380px] z-50"
            dir="rtl"
          >
            {/* Glass panel */}
            <div className="glass rounded-xl shadow-xl border border-border/60 overflow-hidden">
              {/* ---- Header ---- */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-500" />
                  الإشعارات
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500/15 text-red-500 text-[11px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </h3>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={markingAll}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    {markingAll ? "جارٍ التحديث..." : "تحديد الكل كمقروء"}
                  </button>
                )}
              </div>

              {/* ---- Notification List ---- */}
              <ScrollArea className="h-[320px] sm:h-[360px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
                    <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-500 animate-spin" />
                    <span className="text-xs text-muted-foreground">
                      جارٍ تحميل الإشعارات...
                    </span>
                  </div>
                ) : notifications.length === 0 ? (
                  /* ---- Empty state ---- */
                  <div className="flex flex-col items-center justify-center h-full py-16 gap-3 text-muted-foreground">
                    <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center">
                      <Inbox className="h-7 w-7 text-muted-foreground/60" />
                    </div>
                    <span className="text-sm font-medium">لا توجد إشعارات</span>
                    <span className="text-xs text-muted-foreground/70">
                      ستظهر هنا الإشعارات الجديدة
                    </span>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    <AnimatePresence initial={false}>
                      {notifications.map((notif, i) => (
                        <motion.button
                          key={notif.id}
                          custom={i}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          onClick={() => {
                            if (!notif.read) markAsRead(notif.id);
                          }}
                          className={`
                            w-full text-right px-4 py-3 transition-colors
                            hover:bg-amber-50/60 dark:hover:bg-amber-400/5
                            ${!notif.read ? "bg-amber-50/30 dark:bg-amber-400/[0.03]" : ""}
                          `}
                        >
                          <div className="flex items-start gap-3">
                            {/* Unread dot */}
                            <div className="mt-2 shrink-0">
                              {!notif.read ? (
                                <span className="block w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                              ) : (
                                <span className="block w-2 h-2 rounded-full bg-transparent" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span
                                  className={`text-sm truncate ${
                                    !notif.read
                                      ? "font-bold text-foreground"
                                      : "font-medium text-muted-foreground"
                                  }`}
                                >
                                  {notif.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap shrink-0">
                                  {relativeTime(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {truncate(notif.message, 80)}
                              </p>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}