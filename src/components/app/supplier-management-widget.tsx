"use client";

import { useState } from "react";
import { Building2, Phone, Star, Package, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type SupplierCategory = "ورق" | "حبر" | "معدات" | "تغليف";
type SupplierStatus = "active" | "inactive";

interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  contact: string;
  rating: number;
  orderCount: number;
  lastOrderDate: string;
  status: SupplierStatus;
  isTop: boolean;
  city: string;
}

const CATEGORY_COLORS: Record<SupplierCategory, { color: string; bg: string }> = {
  "ورق": { color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-950/40" },
  "حبر": { color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/40" },
  "معدات": { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  "تغليف": { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
};

const CATEGORY_ICONS: Record<SupplierCategory, string> = {
  "ورق": "📄",
  "حبر": "🎨",
  "معدات": "⚙️",
  "تغليف": "📦",
};

const MOCK_SUPPLIERS: Supplier[] = [
  { id: "sup1", name: "شركة الورق الجزائرية", category: "ورق", contact: "+213 555 123 456", rating: 5, orderCount: 142, lastOrderDate: "2025-01-12", status: "active", isTop: true, city: "الجزائر العاصمة" },
  { id: "sup2", name: "مؤسسة الألوان المتقدمة", category: "حبر", contact: "+213 555 789 012", rating: 4, orderCount: 98, lastOrderDate: "2025-01-10", status: "active", isTop: false, city: "وهران" },
  { id: "sup3", name: "معدات الطباعة الحديثة", category: "معدات", contact: "+213 555 345 678", rating: 4, orderCount: 34, lastOrderDate: "2025-01-08", status: "active", isTop: false, city: "قسنطينة" },
  { id: "sup4", name: "ورش التغليف الوطنية", category: "تغليف", contact: "+213 555 901 234", rating: 3, orderCount: 67, lastOrderDate: "2025-01-05", status: "active", isTop: false, city: "عنابة" },
  { id: "sup5", name: "موردي الورق الفاخر", category: "ورق", contact: "+213 555 567 890", rating: 5, orderCount: 89, lastOrderDate: "2024-12-28", status: "active", isTop: false, city: "سطيف" },
  { id: "sup6", name: "حبر الشرق للتوريد", category: "حبر", contact: "+213 555 234 567", rating: 2, orderCount: 12, lastOrderDate: "2024-12-15", status: "inactive", isTop: false, city: "باتنة" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 transition-colors duration-200 ${i < rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="text-[9px] text-muted-foreground mr-1">{rating}/5</span>
    </div>
  );
}

export function SupplierManagementWidget() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<SupplierCategory | "all">("all");

  const totalSuppliers = MOCK_SUPPLIERS.length;
  const activeCount = MOCK_SUPPLIERS.filter((s) => s.status === "active").length;
  const totalOrdersThisMonth = MOCK_SUPPLIERS.reduce((s, sup) => s + sup.orderCount, 0);

  const filteredSuppliers = filterCategory === "all" ? MOCK_SUPPLIERS : MOCK_SUPPLIERS.filter((s) => s.category === filterCategory);

  const categories: Array<SupplierCategory | "all"> = ["all", "ورق", "حبر", "معدات", "تغليف"];
  const categoryLabels: Record<string, string> = { all: "الكل", "ورق": "ورق", "حبر": "حبر", "معدات": "معدات", "تغليف": "تغليف" };

  return (
    <Card className="rounded-xl border border-border/50 overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            إدارة الموردين
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5">
            {activeCount} نشط
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200/50 dark:border-sky-800/30 p-2.5 text-center">
            <Building2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-sky-700 dark:text-sky-300">{totalSuppliers}</p>
            <p className="text-[10px] text-sky-600/70 dark:text-sky-400/70">إجمالي الموردين</p>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 p-2.5 text-center">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{activeCount}</p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">نشط</p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 p-2.5 text-center">
            <Package className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{totalOrdersThisMonth}</p>
            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">إجمالي الطلبات</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all duration-200 ${
                filterCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted/60"
              }`}
            >
              {cat !== "all" && <span className="ml-1">{CATEGORY_ICONS[cat as SupplierCategory]}</span>}
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* Suppliers List */}
        <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
          {filteredSuppliers.map((supplier) => {
            const catConf = CATEGORY_COLORS[supplier.category];
            const isExpanded = expandedId === supplier.id;
            return (
              <div
                key={supplier.id}
                onClick={() => setExpandedId(isExpanded ? null : supplier.id)}
                className={`rounded-xl border p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  isExpanded ? "bg-muted/50 border-primary/20 shadow-sm" : "bg-card border-border/50 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${catConf.bg} flex items-center justify-center text-sm`}>
                      {CATEGORY_ICONS[supplier.category]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold">{supplier.name}</p>
                        {supplier.isTop && (
                          <Badge className="text-[8px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-0 hover:bg-amber-200 dark:hover:bg-amber-900/70">
                            ★ الأفضل
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${catConf.color} ${catConf.bg} border-0`}>
                          {supplier.category}
                        </Badge>
                        <StarRating rating={supplier.rating} />
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className={`w-2 h-2 rounded-full ${supplier.status === "active" ? "bg-emerald-500" : "bg-rose-400"}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {supplier.contact}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Package className="h-3 w-3" /> {supplier.orderCount} طلب
                      </span>
                      <span className="text-muted-foreground">آخر طلب: {supplier.lastOrderDate}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">📍 {supplier.city}</span>
                      <span className={`text-[10px] font-medium ${supplier.status === "active" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {supplier.status === "active" ? "نشط" : "متوقف"}
                      </span>
                    </div>
                    {supplier.status === "inactive" && (
                      <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 rounded-lg px-2 py-1.5">
                        <AlertCircle className="h-3 w-3" />
                        هذا المورد متوقف حالياً — يرجى التواصل لإعادة التفعيل
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
