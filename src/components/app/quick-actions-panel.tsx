"use client";

import { useState, useEffect, useRef } from "react";
import {
  Zap, Package, FileText, Printer, Tag, BarChart3, Plus, RefreshCw, MessageCircle, ExternalLink, Settings, QrCode, Users, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  onClick: () => void;
  badge?: string;
  shortcut?: string;
}

interface QuickActionsPanelProps {
  onNewOrder?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  onQRCode?: () => void;
  onCustomers?: () => void;
  className?: string;
}

export function QuickActionsPanel({
  onNewOrder, onRefresh, onExport, onSettings, onQRCode, onCustomers, className,
}: QuickActionsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const actions: QuickAction[] = [
    {
      id: "new-order",
      label: "طلب جديد",
      icon: <Plus className="h-4 w-4" />,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950",
      borderColor: "border-violet-200 dark:border-violet-800",
      onClick: onNewOrder || (() => {}),
      badge: "Alt+N",
      shortcut: "Alt+N",
    },
    {
      id: "refresh",
      label: "تحديث",
      icon: <RefreshCw className="h-4 w-4" />,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      borderColor: "border-blue-200 dark:border-blue-800",
      onClick: onRefresh || (() => {}),
      shortcut: "F5",
    },
    {
      id: "export",
      label: "تصدير",
      icon: <Download className="h-4 w-4" />,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      onClick: onExport || (() => {}),
      shortcut: "Ctrl+E",
    },
    {
      id: "qr",
      label: "QR كود",
      icon: <QrCode className="h-4 w-4" />,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      borderColor: "border-amber-200 dark:border-amber-800",
      onClick: onQRCode || (() => {}),
    },
    {
      id: "customers",
      label: "الزبائن",
      icon: <Users className="h-4 w-4" />,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50 dark:bg-pink-950",
      borderColor: "border-pink-200 dark:border-pink-800",
      onClick: onCustomers || (() => {}),
    },
    {
      id: "settings",
      label: "إعدادات",
      icon: <Settings className="h-4 w-4" />,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-50 dark:bg-gray-950",
      borderColor: "border-gray-200 dark:border-gray-800",
      onClick: onSettings || (() => {}),
      shortcut: "Alt+S",
    },
  ];

  if (!mounted) return null;

  return (
    <div className={cn("animate-fade-up", className)} dir="rtl">
      {/* عنوان القسم */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" />
          إجراءات سريعة
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] text-muted-foreground h-6 px-2"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "عرض الكل" : "طي"}
        </Button>
      </div>

      {/* شبكة الإجراءات */}
      <AnimatePresence mode="wait">
        {!collapsed ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-2">
              {actions.map((action, i) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 30, duration: 0.15 }}
                  onClick={action.onClick}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center",
                    "transition-all duration-200 cursor-pointer group",
                    "hover:shadow-md active:scale-95",
                    action.bgColor, action.borderColor
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    "group-hover:scale-110 transition-transform duration-200",
                    action.bgColor
                  )}>
                    <span className={action.color}>{action.icon}</span>
                  </div>
                  <span className="text-[11px] font-medium text-foreground">{action.label}</span>
                  {action.shortcut && (
                    <kbd className="text-[8px] px-1 py-0.5 rounded bg-background/80 text-muted-foreground border border-border/50 font-mono">
                      {action.shortcut}
                    </kbd>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar"
          >
            {actions.map(action => (
              <button
                key={action.id}
                onClick={action.onClick}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border whitespace-nowrap",
                  "text-[11px] font-medium transition-colors cursor-pointer",
                  "hover:bg-background/50",
                  action.bgColor, action.borderColor
                )}
              >
                <span className={action.color}>{action.icon}</span>
                <span className="text-foreground">{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
