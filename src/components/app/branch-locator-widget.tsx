"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Star, CheckCircle2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BRANCHES = [
  {
    name: "المقر الرئيسي", address: "شارع الأمير عبد القادر، الجزائر", phone: "0555 123 456",
    hours: "08:00 - 20:00", status: "open" as const, rating: 4.8, orders: 156,
    services: ["طباعة مستندات", "طباعة صور", "تجليد", "كروت شخصية"],
  },
  {
    name: "فرع حيدرة", address: "حي حيدرة، الجزائر", phone: "0555 789 012",
    hours: "09:00 - 18:00", status: "open" as const, rating: 4.5, orders: 89,
    services: ["طباعة مستندات", "طباعة صور"],
  },
  {
    name: "فرع باب الوادي", address: "شارع باب الوادي، الجزائر", phone: "0555 345 678",
    hours: "08:00 - 20:00", status: "closed" as const, rating: 4.7, orders: 112,
    services: ["طباعة مستندات", "طباعة صور", "تجليد", "بانرات", "ملصقات"],
  },
];

export function BranchLocatorWidget() {
  return (
    <Card className="bg-card rounded-xl border border-border shadow-sm fade-in-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2 text-foreground/80">
            <MapPin className="h-4 w-4 text-primary" />
            مواقع الفروع
          </CardTitle>
          <Badge className="text-[10px] bg-primary/10 text-primary">{BRANCHES.length} فروع</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3" dir="rtl">
        {BRANCHES.map((branch, i) => (
          <motion.div
            key={branch.name}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-border p-3 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0",
                branch.status === "open" ? "bg-emerald-500" : "bg-gray-400"
              )}>
                {branch.name.charAt(branch.name.indexOf(" ") + 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-foreground">{branch.name}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                    branch.status === "open"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  )}>
                    {branch.status === "open" ? "مفتوح" : "مغلق"}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" />{branch.address}</p>
                  <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{branch.phone}</p>
                  <p className="flex items-center gap-1.5"><Clock className="h-3 w-3 shrink-0" />{branch.hours}</p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-0.5 text-amber-500 text-[11px]">
                    <Star className="h-3 w-3 fill-amber-500" />{branch.rating}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{branch.orders} طلب</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {branch.services.slice(0, 3).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[9px] px-1.5 py-0">{s}</Badge>
                  ))}
                  {branch.services.length > 3 && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">+{branch.services.length - 3}</Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
