"use client";

import { useState } from "react";
import { Star, ChevronDown, ChevronUp, Table2, Trophy } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";

interface ServiceRow {
  name: string;
  pricePerPage: number;
  minQty: number;
  delivery: string;
  rating: number;
  popular: boolean;
}

const SERVICES: ServiceRow[] = [
  { name: "طباعة مستند", pricePerPage: 5, minQty: 1, delivery: "ساعة", rating: 5, popular: true },
  { name: "طباعة صور", pricePerPage: 25, minQty: 1, delivery: "ساعتين", rating: 4, popular: false },
  { name: "طباعة لافتة", pricePerPage: 100, minQty: 1, delivery: "يوم", rating: 4, popular: false },
  { name: "طباعة بطاقة", pricePerPage: 15, minQty: 50, delivery: "3 ساعات", rating: 5, popular: false },
  { name: "تجليد", pricePerPage: 50, minQty: 1, delivery: "ساعتين", rating: 4, popular: false },
  { name: "طباعة ملصق", pricePerPage: 30, minQty: 10, delivery: "يوم", rating: 3, popular: false },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

export function ServicesComparison() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-center gap-2 rounded-xl h-11 text-sm font-medium transition-all",
          open && "bg-primary/5 border-primary/30 text-primary"
        )}
      >
        <Table2 className="h-4 w-4" />
        عرض المقارنة
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {open && (
        <Card className="border-border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* جدول الحاسوب */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-right text-xs font-semibold">الخدمة</TableHead>
                    <TableHead className="text-center text-xs font-semibold">السعر</TableHead>
                    <TableHead className="text-center text-xs font-semibold">الحد الأدنى</TableHead>
                    <TableHead className="text-center text-xs font-semibold">مدة التسليم</TableHead>
                    <TableHead className="text-center text-xs font-semibold">التقييم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SERVICES.map((service, index) => (
                    <TableRow
                      key={service.name}
                      className={cn(
                        "transition-colors",
                        service.popular
                          ? "bg-amber-50/60 dark:bg-amber-950/20 border-l-4 border-l-amber-400 dark:border-l-amber-500"
                          : index % 2 === 0
                            ? "table-row-even"
                            : "table-row-odd"
                      )}
                    >
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          {service.popular && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40">
                              <Trophy className="h-3 w-3 text-amber-500" />
                            </span>
                          )}
                          <span>{service.name}</span>
                          {service.popular && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold">
                              الأكثر طلباً
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm font-semibold tabular-nums">
                        {service.pricePerPage} د.ج/صفحة
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground tabular-nums">
                        {service.minQty}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {service.delivery}
                      </TableCell>
                      <TableCell className="text-center">
                        <StarRating rating={service.rating} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* بطاقات الجوال */}
            <div className="sm:hidden divide-y divide-border">
              {SERVICES.map((service, index) => (
                <div
                  key={service.name}
                  className={cn(
                    "p-3.5 space-y-2",
                    service.popular
                      ? "bg-amber-50/60 dark:bg-amber-950/20 border-r-4 border-r-amber-400 dark:border-r-amber-500"
                      : index % 2 === 0
                        ? "table-row-even"
                        : "table-row-odd"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {service.popular && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40">
                          <Trophy className="h-3 w-3 text-amber-500" />
                        </span>
                      )}
                      <span className="font-semibold text-sm">{service.name}</span>
                    </div>
                    {service.popular && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold">
                        الأكثر طلباً
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">السعر: </span>
                      <span className="font-semibold tabular-nums">{service.pricePerPage} د.ج/صفحة</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الحد الأدنى: </span>
                      <span className="font-medium tabular-nums">{service.minQty}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">التسليم: </span>
                      <span className="font-medium">{service.delivery}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={service.rating} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
