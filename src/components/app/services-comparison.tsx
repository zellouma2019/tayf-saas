"use client";

import { useState } from "react";
import { Table2, Trophy, BadgeCheck, Clock, Tag, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ServiceRow {
  name: string;
  icon: string;
  price: string;
  time: string;
  bestFor: string;
  recommended: boolean;
}

const servicesComparison: ServiceRow[] = [
  { name: 'طباعة مستند', icon: '🖨️', price: '5 د.ج/صفحة', time: '10-30 دقيقة', bestFor: 'تقارير، مذكرات، وورد', recommended: true },
  { name: 'نسخ مستندات', icon: '📄', price: '3 د.ج/صفحة', time: '5-15 دقيقة', bestFor: 'نسخ سريع ورخيص', recommended: false },
  { name: 'طباعة صور', icon: '🖼️', price: '25 د.ج/صفحة', time: '15-45 دقيقة', bestFor: 'صور شخصية، فنية', recommended: false },
  { name: 'تجليد', icon: '📚', price: '50 د.ج', time: '30-60 دقيقة', bestFor: 'كتب، أطروحات', recommended: false },
  { name: 'بطاقات', icon: '🪪', price: '15 د.ج/بطاقة', time: '15-30 دقيقة', bestFor: 'بطاقات شخصية، عمل', recommended: false },
  { name: 'ملصقات', icon: '📜', price: '10 د.ج/ملصق', time: '10-20 دقيقة', bestFor: 'ملصقات دعائية', recommended: false },
];

export function ServicesComparison() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-xl h-11 text-sm font-medium transition-all"
            )}
          >
            <Table2 className="h-4 w-4" />
            مقارنة الخدمات
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Table2 className="h-5 w-5 text-primary" />
              مقارنة الخدمات
            </DialogTitle>
            <DialogDescription>
              قارن بين خدمات الطباعة المتاحة للعثور على ما يناسب احتياجاتك
            </DialogDescription>
          </DialogHeader>

          {/* جدول الحاسوب */}
          <div className="hidden sm:block overflow-x-auto -mx-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-right text-xs font-semibold min-w-[120px]">الخدمة</TableHead>
                  <TableHead className="text-center text-xs font-semibold">السعر</TableHead>
                  <TableHead className="text-center text-xs font-semibold">مدة الإنجاز</TableHead>
                  <TableHead className="text-center text-xs font-semibold min-w-[130px]">الأنسب لـ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicesComparison.map((service, index) => (
                  <TableRow
                    key={service.name}
                    className={cn(
                      "transition-colors",
                      service.recommended
                        ? "bg-amber-50/60 dark:bg-amber-950/20 border-l-4 border-l-amber-400 dark:border-l-amber-500"
                        : index % 2 === 0
                          ? "table-row-even"
                          : "table-row-odd"
                    )}
                  >
                    <TableCell className="font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg shrink-0">{service.icon}</span>
                        <span>{service.name}</span>
                        {service.recommended && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold">
                            <Trophy className="h-3 w-3" />
                            موصى به
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm font-semibold tabular-nums text-primary">
                      {service.price}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {service.time}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {service.bestFor}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* بطاقات الجوال */}
          <div className="sm:hidden divide-y divide-border">
            {servicesComparison.map((service, index) => (
              <div
                key={service.name}
                className={cn(
                  "p-4 space-y-2.5",
                  service.recommended
                    ? "bg-amber-50/60 dark:bg-amber-950/20 border-r-4 border-r-amber-400 dark:border-r-amber-500"
                    : index % 2 === 0
                      ? "table-row-even"
                      : "table-row-odd"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{service.icon}</span>
                    <span className="font-semibold text-sm">{service.name}</span>
                  </div>
                  {service.recommended && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold">
                      <Trophy className="h-3 w-3" />
                      موصى به
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-muted-foreground">السعر:</span>
                    <span className="font-bold tabular-nums text-primary">{service.price}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">المدة:</span>
                    <span className="font-medium">{service.time}</span>
                  </div>
                </div>
                <div className="flex items-start gap-1.5 text-xs">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">
                    الأنسب لـ: <span className="font-medium text-foreground">{service.bestFor}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
