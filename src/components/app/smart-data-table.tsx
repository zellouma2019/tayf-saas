"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

interface SmartDataTableProps {
  columns: Column[];
  data: Array<Record<string, unknown>>;
  emptyMessage?: string;
  onRowClick?: (row: Record<string, unknown>) => void;
}

export function SmartDataTable({ columns, data, emptyMessage = "لا توجد بيانات", onRowClick }: SmartDataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv), "ar")
        : String(bv).localeCompare(String(av), "ar");
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden" dir="rtl">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-right text-xs font-bold text-muted-foreground whitespace-nowrap",
                    col.sortable && "cursor-pointer hover:text-foreground select-none transition-colors",
                    col.sortable && sortKey === col.key && "text-primary"
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform",
                        sortKey === col.key && sortDir === "asc" && "rotate-180"
                      )} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {sortedData.map((row, idx) => (
                <motion.tr
                  key={String(row.id || idx)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "border-b border-border/50 last:border-0 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                    idx % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-foreground whitespace-nowrap tabular-nums">
                      {String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {sortedData.length === 0 && (
        <div className="p-12 text-center">
          <Filter className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground bg-muted/10">
        <span>{sortedData.length} نتيجة</span>
        {sortKey && (
          <span>مرتّب حسب: {columns.find(c => c.key === sortKey)?.label} ({sortDir === "asc" ? "تصاعدي" : "تنازلي"})</span>
        )}
      </div>
    </div>
  );
}
