"use client";

import { useState, useCallback } from "react";
import { Tag, X, Plus, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TAG_OPTIONS = [
  { value: "urgent", label: "عاجل", className: "tag-urgent", dot: "bg-rose-500" },
  { value: "vip", label: "VIP", className: "tag-vip", dot: "bg-amber-500" },
  { value: "wholesale", label: "جملة", className: "tag-wholesale", dot: "bg-sky-500" },
  { value: "express", label: "سريع", className: "tag-express", dot: "bg-violet-500" },
  { value: "new", label: "جديد", className: "tag-new", dot: "bg-emerald-500" },
] as const;

type TagValue = typeof TAG_OPTIONS[number]["value"];

interface OrderTagsProps {
  orderId: string;
  selectedTags?: TagValue[];
  onChange?: (tags: TagValue[]) => void;
  size?: "sm" | "md";
  readOnly?: boolean;
}

const STORAGE_KEY = "tayf-order-tags";

function loadOrderTags(orderId: string): TagValue[] {
  if (typeof window === "undefined") return [];
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return all[orderId] || [];
  } catch {
    return [];
  }
}

function saveOrderTags(orderId: string, tags: TagValue[]) {
  if (typeof window === "undefined") return;
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (tags.length === 0) {
      delete all[orderId];
    } else {
      all[orderId] = tags;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function OrderTags({ orderId, selectedTags: propTags, onChange, size = "sm", readOnly = false }: OrderTagsProps) {
  const [tags, setTags] = useState<TagValue[]>(() => propTags || loadOrderTags(orderId));
  const [open, setOpen] = useState(false);

  const toggleTag = useCallback(
    (value: TagValue) => {
      const next = tags.includes(value) ? tags.filter((t) => t !== value) : [...tags, value];
      setTags(next);
      saveOrderTags(orderId, next);
      onChange?.(next);
    },
    [tags, orderId, onChange]
  );

  const removeTag = useCallback(
    (value: TagValue) => {
      const next = tags.filter((t) => t !== value);
      setTags(next);
      saveOrderTags(orderId, next);
      onChange?.(next);
    },
    [tags, orderId, onChange]
  );

  const tagMeta = (value: TagValue) => TAG_OPTIONS.find((t) => t.value === value);

  if (tags.length === 0 && readOnly) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap" dir="rtl">
      {tags.map((value) => {
        const meta = tagMeta(value);
        if (!meta) return null;
        return (
          <span
            key={value}
            className={cn("tag-chip group", meta.className, size === "sm" ? "text-[9px] px-1.5 py-0.5" : "text-[10px]")}
          >
            <span className={cn("w-1 h-1 rounded-full", meta.dot)} />
            {meta.label}
            {!readOnly && (
              <button
                onClick={(e) => { e.stopPropagation(); removeTag(value); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        );
      })}
      {!readOnly && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors",
                size === "sm" ? "text-[9px]" : "text-[10px]"
              )}
            >
              <Plus className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-1.5" align="start" dir="rtl">
            <div className="space-y-0.5">
              {TAG_OPTIONS.map((opt) => {
                const isActive = tags.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleTag(opt.value)}
                    className={cn(
                      "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", opt.dot)} />
                    <span className="flex-1 text-right">{opt.label}</span>
                    {isActive && (
                      <span className="text-primary text-[9px]">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/** Get tags for an order (read-only, for external use) */
export function getOrderTags(orderId: string): TagValue[] {
  return loadOrderTags(orderId);
}
