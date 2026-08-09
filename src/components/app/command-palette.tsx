"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Package,
  Store,
  BarChart3,
  Users,
  Settings,
  FileText,
  Printer,
  MapPin,
  ArrowRightLeft,
  History,
  X,
  LayoutDashboard,
  Calculator,
  Palette,
  Shield,
  Receipt,
  Globe,
  ChevronLeft,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
  category?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const setView = useAppStore((s) => s.setView);

  const commands: CommandItem[] = [
    { id: "new-order", label: "طلب جديد", description: "إنشاء طلب طباعة جديد", icon: Printer, action: () => setView("new"), shortcut: "Alt+N", category: "الطلبات" },
    { id: "repeat-order", label: "تكرار طلب", description: "إعادة طلب سابق", icon: ArrowRightLeft, action: () => setView("repeat"), category: "الطلبات" },
    { id: "track-order", label: "تتبّع الطلب", description: "تتبّع حالة الطلب", icon: MapPin, action: () => setView("track"), shortcut: "Alt+T", category: "الطلبات" },
    { id: "order-history", label: "سجل الطلبات", description: "عرض جميع الطلبات السابقة", icon: History, action: () => setView("history"), category: "الطلبات" },
    { id: "admin", label: "لوحة التحكم", description: "لوحة تحكم المتجر", icon: LayoutDashboard, action: () => setView("admin"), category: "الإدارة" },
    { id: "price-est", label: "حاسبة الأسعار", description: "تقدير تكلفة الطباعة", icon: Calculator, action: () => {}, category: "أدوات" },
    { id: "settings", label: "الإعدادات", description: "إعدادات المتجر والمنصة", icon: Settings, shortcut: "Alt+S", action: () => {}, category: "النظام" },
  ];

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.includes(query) ||
          (c.description && c.description.includes(query)) ||
          (c.category && c.category.includes(query))
      )
    : commands;

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  // Keyboard shortcut: Ctrl+K or Alt+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = useCallback(
    (cmd: CommandItem) => {
      cmd.action();
      setOpen(false);
      setQuery("");
    },
    []
  );

  // Arrow key navigation
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        handleSelect(filtered[selectedIndex]);
      }
    },
    [filtered, selectedIndex, handleSelect]
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="command-palette-backdrop" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="command-palette" dir="rtl">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="ابحث عن أمر..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
          <kbd className="kbd-key">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto scrollbar-improved py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Search className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">لا توجد نتائج</p>
            </div>
          ) : (
            <>
              {filtered.map((cmd, index) => (
                <div
                  key={cmd.id}
                  className={cn(
                    "command-item",
                    index === selectedIndex && "active"
                  )}
                  onClick={() => handleSelect(cmd)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <cmd.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{cmd.label}</div>
                    {cmd.description && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        {cmd.description}
                      </div>
                    )}
                  </div>
                  {cmd.shortcut && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {cmd.shortcut.split("+").map((key, i) => (
                        <kbd key={i} className="kbd-key">{key.trim()}</kbd>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="kbd-key text-[9px]">↑↓</kbd> تنقل
            </span>
            <span className="flex items-center gap-1">
              <kbd className="kbd-key text-[9px]">↵</kbd> اختيار
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {filtered.length} نتيجة
          </span>
        </div>
      </div>
    </>
  );
}
