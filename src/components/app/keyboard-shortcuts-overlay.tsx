"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; label: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "التنقل",
    shortcuts: [
      { keys: ["Alt", "1"], label: "الرئيسية" },
      { keys: ["Alt", "2"], label: "الطلبات" },
      { keys: ["Alt", "3"], label: "المتاجر" },
      { keys: ["Alt", "4"], label: "الإعدادات" },
      { keys: ["Alt", "5"], label: "الأمان" },
    ],
  },
  {
    title: "الإجراءات",
    shortcuts: [
      { keys: ["Alt", "N"], label: "طلب جديد" },
      { keys: ["Alt", "R"], label: "تحديث البيانات" },
      { keys: ["Ctrl", "K"], label: "لوحة الأوامر" },
    ],
  },
  {
    title: "عام",
    shortcuts: [
      { keys: ["?"], label: "عرض الاختصارات" },
      { keys: ["Esc"], label: "إغلاق" },
    ],
  },
];

function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center min-w-[28px] h-7 px-2.5 rounded-lg bg-muted border border-border text-[11px] font-mono font-semibold text-foreground shadow-sm kbd-enhanced",
        className
      )}
    >
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-2rem)]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            اختصارات لوحة المفاتيح
          </DialogTitle>
          <DialogDescription className="sr-only">قائمة بجميع اختصارات لوحة المفاتيح المتاحة في التطبيق</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scroll mt-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-foreground">{shortcut.label}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <Kbd>{key}</Kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-[10px]">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="text-center text-[10px] text-muted-foreground pt-2 border-t border-border">
            اضغط Escape أو ? للإغلاق
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
