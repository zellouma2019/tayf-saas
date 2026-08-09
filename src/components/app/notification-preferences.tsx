"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Package, RefreshCw, Star, Megaphone, Mail, Smartphone, AppWindow, Moon, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NotifCategory {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  defaultOn: boolean;
}

const CATEGORIES: NotifCategory[] = [
  { id: "orders", icon: <Package className="h-4 w-4 text-indigo-500" />, title: "الطلبات الجديدة", description: "إشعار عند استلام طلب جديد", defaultOn: true },
  { id: "status", icon: <RefreshCw className="h-4 w-4 text-blue-500" />, title: "تحديثات الحالة", description: "إشعار عند تغيير حالة الطلب", defaultOn: true },
  { id: "payments", icon: <Star className="h-4 w-4 text-emerald-500" />, title: "المدفوعات", description: "إشعار عند استلام دفعة جديدة", defaultOn: false },
  { id: "reviews", icon: <Star className="h-4 w-4 text-amber-500" />, title: "التقييمات", description: "إشعار عند تقييم جديد", defaultOn: true },
  { id: "marketing", icon: <Megaphone className="h-4 w-4 text-rose-500" />, title: "التسويق", description: "عروض وتخفيضات", defaultOn: false },
];

const CHANNELS = [
  { id: "email", icon: <Mail className="h-3.5 w-3.5" />, label: "البريد الإلكتروني", defaultOn: true },
  { id: "sms", icon: <Smartphone className="h-3.5 w-3.5" />, label: "الرسائل النصية", defaultOn: false },
  { id: "push", icon: <AppWindow className="h-3.5 w-3.5" />, label: "إشعارات التطبيق", defaultOn: true },
];

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      className={cn(
        "relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0",
        active ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <motion.div
        className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm"
        animate={{ left: active ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export function NotificationPreferences() {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.id, c.defaultOn]))
  );
  const [channels, setChannels] = useState<Record<string, boolean>>(
    Object.fromEntries(CHANNELS.map((c) => [c.id, c.defaultOn]))
  );
  const [quietFrom, setQuietFrom] = useState("22:00");
  const [quietTo, setQuietTo] = useState("08:00");

  const hasChanges = true;

  function toggleNotif(id: string) {
    setToggles((p) => ({ ...p, [id]: !p[id] }));
  }
  function toggleChannel(id: string) {
    setChannels((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <Bell className="h-4 w-4 text-primary" />
          إعدادات الإشعارات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1" dir="rtl">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 py-3 px-1 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
              {cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{cat.title}</p>
              <p className="text-[11px] text-muted-foreground">{cat.description}</p>
            </div>
            <Toggle active={!!toggles[cat.id]} onToggle={() => toggleNotif(cat.id)} />
          </motion.div>
        ))}

        <div className="border-t border-border pt-4 mt-2 space-y-3">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            قنوات الإشعارات
          </p>
          <div className="flex flex-wrap gap-3">
            {CHANNELS.map((ch) => (
              <label key={ch.id} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!channels[ch.id]}
                  onChange={() => toggleChannel(ch.id)}
                  className="h-3.5 w-3.5 rounded border-border accent-primary"
                />
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">{ch.icon}{ch.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4 mt-2 space-y-3">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            ساعات الهدوء
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground">من</span>
            <Input
              type="time"
              value={quietFrom}
              onChange={(e) => setQuietFrom(e.target.value)}
              className="w-28 h-8 text-xs"
            />
            <span className="text-[11px] text-muted-foreground">إلى</span>
            <Input
              type="time"
              value={quietTo}
              onChange={(e) => setQuietTo(e.target.value)}
              className="w-28 h-8 text-xs"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button
            size="sm"
            className="w-full gap-2 h-9"
            disabled={!hasChanges}
          >
            <Save className="h-3.5 w-3.5" />
            حفظ الإعدادات
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
