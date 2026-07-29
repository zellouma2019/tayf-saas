"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, X, Eye, EyeOff, AlertTriangle, Info, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PermissionItem {
  key: string;
  label: string;
  description: string;
  allowed: boolean;
  category: string;
}

interface PermissionsMatrixProps {
  permissions: PermissionItem[];
  onChange: (key: string, allowed: boolean) => void;
  role: string;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  orders: { label: "الطلبات", icon: <Shield className="h-4 w-4" />, color: "text-violet-600" },
  shops: { label: "المتاجر", icon: <Info className="h-4 w-4" />, color: "text-blue-600" },
  settings: { label: "الإعدادات", icon: <HelpCircle className="h-4 w-4" />, color: "text-amber-600" },
  reports: { label: "التقارير", icon: <AlertTriangle className="h-4 w-4" />, color: "text-emerald-600" },
};

export function PermissionsMatrix({ permissions, onChange, role }: PermissionsMatrixProps) {
  const [filter, setFilter] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(true);

  const categories = useMemo(() => {
    const cats = [...new Set(permissions.map(p => p.category))];
    return cats.map(c => ({
      key: c,
      ...CATEGORY_LABELS[c],
      items: permissions.filter(p => p.category === c),
      allowedCount: permissions.filter(p => p.category === c && p.allowed).length,
    }));
  }, [permissions]);

  const filteredCategories = filter ? categories.filter(c => c.key === filter) : categories;
  const totalAllowed = permissions.filter(p => p.allowed).length;
  const totalPermissions = permissions.length;

  const toggleAll = (category: string, allowed: boolean) => {
    permissions.filter(p => p.category === category).forEach(p => onChange(p.key, allowed));
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            صلاحيات: {role}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {totalAllowed} من {totalPermissions} صلاحية مفعّلة
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          {showAll ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {showAll ? "إخفاء التفاصيل" : "عرض التفاصيل"}
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={cn("text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors",
            !filter ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
          )}
        >
          الكل
        </button>
        {categories.map(c => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFilter(filter === c.key ? null : c.key)}
            className={cn("text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors flex items-center gap-1",
              filter === c.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
            )}
          >
            {c.icon}
            {c.label}
          </button>
        ))}
      </div>

      {/* Categories */}
      <AnimatePresence mode="wait">
        {filteredCategories.map(category => (
          <motion.div
            key={category.key}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-border overflow-hidden"
          >
            {/* Category header */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2">
                <div className={category.color}>{category.icon}</div>
                <span className="text-sm font-bold text-foreground">{category.label}</span>
                <span className="text-[10px] text-muted-foreground">({category.allowedCount}/{category.items.length})</span>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => toggleAll(category.key, true)}
                  className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 transition-colors">
                  الكل
                </button>
                <button type="button" onClick={() => toggleAll(category.key, false)}
                  className="text-[10px] px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 hover:bg-rose-200 transition-colors">
                  لا شيء
                </button>
              </div>
            </div>

            {/* Permission items */}
            <div className="divide-y divide-border/50">
              {category.items.map((perm, idx) => (
                <motion.div
                  key={perm.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors"
                >
                  <div className={cn("flex-1", !perm.allowed && "opacity-50")}>
                    <div className="text-xs font-medium text-foreground">{perm.label}</div>
                    {showAll && <div className="text-[10px] text-muted-foreground mt-0.5">{perm.description}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange(perm.key, !perm.allowed)}
                    className={cn(
                      "w-10 h-5.5 rounded-full transition-all duration-200 relative flex items-center",
                      perm.allowed ? "bg-primary justify-end" : "bg-muted justify-start"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white shadow-sm mx-0.5 transition-transform",
                      perm.allowed && "translate-x-0"
                    )} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
