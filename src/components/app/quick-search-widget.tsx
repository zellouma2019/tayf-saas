"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const RECENT = [
  "طباعة مستندات Word", "طباعة صور عائلية", "تجليد تقرير سنوي",
  "طباعة كروت شخصية", "طباعة ملصقات دعائية", "طباعة بانر متجر",
];

const SUGGESTIONS = [
  { text: "أكثر الخدمات طلباً", type: "category" as const },
  { text: "طباعة سريعة 24 ساعة", type: "service" as const },
  { text: "طباعة ملصقات", type: "service" as const },
  { text: "تجليد كتب", type: "service" as const },
];

export function QuickSearchWidget() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const filtered = query.length > 0 ? RECENT.filter((r) => r.includes(query)) : RECENT;
  const suggestions = query.length > 0 ? SUGGESTIONS.filter((s) => s.text.includes(query)) : SUGGESTIONS;

  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm fade-in-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
          <Search className="h-4 w-4 text-primary" />
          بحث سريع
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Input
            placeholder="ابحث عن طلب، خدمة، أو عميل..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            className="pr-10 pl-10 h-10"
            dir="rtl"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {query && (
            <button onClick={() => setQuery("")} className="absolute left-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-2 inset-x-0 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden"
              >
                {filtered.length > 0 && (
                  <div className="p-2">
                    <p className="text-[10px] text-muted-foreground px-2 py-1 font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />عمليات بحث سابقة
                    </p>
                    {filtered.map((item) => (
                      <button key={item} className="w-full text-right text-sm px-2 py-1.5 rounded-lg hover:bg-muted transition-colors text-foreground truncate" onClick={() => { setQuery(item); setIsOpen(false); }}>
                        {item}
                      </button>
                    ))}
                  </div>
                )}
                {suggestions.length > 0 && (
                  <div className="p-2 border-t border-border">
                    <p className="text-[10px] text-muted-foreground px-2 py-1 font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />اقتراحات
                    </p>
                    {suggestions.map((s) => (
                      <button key={s.text} className="w-full text-right text-sm px-2 py-1.5 rounded-lg hover:bg-muted transition-colors flex items-center gap-2 text-foreground">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{s.type === "category" ? "تصنيف" : "خدمة"}</Badge>
                        {s.text}
                      </button>
                    ))}
                  </div>
                )}
                {filtered.length === 0 && suggestions.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">لا توجد نتائج</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="text-[10px] text-muted-foreground self-center ml-1 mr-auto">سريع:</span>
          {["طلبات اليوم", "بانتظار", "جاهز", "مطبعة الريان"].map((tag) => (
            <button key={tag} onClick={() => { setQuery(tag); setIsOpen(true); }} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              {tag}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
