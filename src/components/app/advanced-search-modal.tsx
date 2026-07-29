"use client";

import { useState, useCallback } from "react";
import {
  Search, X, Filter, Calendar, Package, Store, User, Phone, Tag, ChevronDown, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AdvancedSearchFilters {
  query: string;
  status: string;
  shopSlug: string;
  customerName: string;
  phone: string;
  serviceType: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  sortBy: string;
  sortDir: string;
}

const SERVICE_TYPES = [
  { value: "document", label: "مستند" },
  { value: "photo", label: "صور" },
  { value: "banner", label: "لافتة" },
  { value: "card", label: "بطاقة" },
  { value: "binding", label: "تجليد" },
  { value: "sticker", label: "ملصق" },
  { value: "poster", label: "ملصق كبير" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "كل الحالات" },
  { value: "pending", label: "في الانتظار" },
  { value: "confirmed", label: "مؤكد" },
  { value: "printing", label: "قيد الطباعة" },
  { value: "ready", label: "جاهز" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغى" },
];

const SORT_OPTIONS = [
  { value: "date", label: "التاريخ" },
  { value: "total", label: "المبلغ" },
  { value: "customerName", label: "اسم الزبون" },
  { value: "status", label: "الحالة" },
];

interface AdvancedSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (filters: AdvancedSearchFilters) => void;
  shops?: { slug: string; name: string }[];
  className?: string;
}

export function AdvancedSearchModal({
  open, onOpenChange, onSearch, shops = [], className,
}: AdvancedSearchModalProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    query: "",
    status: "all",
    shopSlug: "all",
    customerName: "",
    phone: "",
    serviceType: "all",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
    maxAmount: "",
    sortBy: "date",
    sortDir: "desc",
  });

  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const updateFilter = useCallback((key: keyof AdvancedSearchFilters, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      const count = Object.entries(next).filter(([k, v]) =>
        v && v !== "all" && v !== "" && v !== "date" && v !== "desc" && k !== "query"
      ).length;
      setActiveFilterCount(count);
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    const empty: AdvancedSearchFilters = {
      query: "", status: "all", shopSlug: "all", customerName: "",
      phone: "", serviceType: "all", dateFrom: "", dateTo: "",
      minAmount: "", maxAmount: "", sortBy: "date", sortDir: "desc",
    };
    setFilters(empty);
    setActiveFilterCount(0);
  }, []);

  const handleSearch = useCallback(() => {
    onSearch(filters);
    onOpenChange(false);
  }, [filters, onSearch, onOpenChange]);

  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-2xl max-h-[90vh] overflow-y-auto p-6",
          "card-glass-morphism dark-card",
          className
        )}
        dir="rtl"
      >
        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Search className="h-5 w-5 text-primary" />
          بحث متقدم
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="badge-pulse text-xs">
              {activeFilterCount} عامل
            </Badge>
          )}
        </DialogTitle>

        <div className="space-y-4">
          {/* البحث الرئيسي */}
          <div className="form-card p-4 rounded-xl border border-border/50 space-y-3">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5" />
              بحث نصي
            </Label>
            <Input
              placeholder="رقم الطلب، اسم الزبون، أو أي كلمة مفتاحية..."
              value={filters.query}
              onChange={e => updateFilter("query", e.target.value)}
              className="search-input"
              dir="rtl"
            />
          </div>

          {/* الحالة والمتجر */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-card p-4 rounded-xl border border-border/50 space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                الحالة
              </Label>
              <Select value={filters.status} onValueChange={v => updateFilter("status", v)}>
                <SelectTrigger className="input-animated-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="form-card p-4 rounded-xl border border-border/50 space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5" />
                المتجر
              </Label>
              <Select value={filters.shopSlug} onValueChange={v => updateFilter("shopSlug", v)}>
                <SelectTrigger className="input-animated-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المتاجر</SelectItem>
                  {shops.map(s => (
                    <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* الزبون */}
          <div className="form-card p-4 rounded-xl border border-border/50 space-y-3">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              معلومات الزبون
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="اسم الزبون"
                value={filters.customerName}
                onChange={e => updateFilter("customerName", e.target.value)}
                className="input-animated-border"
                dir="rtl"
              />
              <Input
                placeholder="رقم الهاتف"
                value={filters.phone}
                onChange={e => updateFilter("phone", e.target.value)}
                className="input-animated-border"
                dir="ltr"
              />
            </div>
          </div>

          {/* نوع الخدمة والتاريخ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-card p-4 rounded-xl border border-border/50 space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                نوع الخدمة
              </Label>
              <Select value={filters.serviceType} onValueChange={v => updateFilter("serviceType", v)}>
                <SelectTrigger className="input-animated-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الخدمات</SelectItem>
                  {SERVICE_TYPES.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="form-card p-4 rounded-xl border border-border/50 space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                المبلغ
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="من"
                  type="number"
                  value={filters.minAmount}
                  onChange={e => updateFilter("minAmount", e.target.value)}
                  className="input-animated-border text-sm"
                  dir="ltr"
                />
                <Input
                  placeholder="إلى"
                  type="number"
                  value={filters.maxAmount}
                  onChange={e => updateFilter("maxAmount", e.target.value)}
                  className="input-animated-border text-sm"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* التاريخ */}
          <div className="form-card p-4 rounded-xl border border-border/50 space-y-3">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              نطاق التاريخ
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">من تاريخ</span>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={e => updateFilter("dateFrom", e.target.value)}
                  className="input-animated-border"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">إلى تاريخ</span>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={e => updateFilter("dateTo", e.target.value)}
                  className="input-animated-border"
                />
              </div>
            </div>
          </div>

          {/* الترتيب */}
          <div className="form-card p-4 rounded-xl border border-border/50 space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <ChevronDown className="h-3.5 w-3.5" />
              الترتيب
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={filters.sortBy} onValueChange={v => updateFilter("sortBy", v)}>
                <SelectTrigger className="input-animated-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.sortDir} onValueChange={v => updateFilter("sortDir", v)}>
                <SelectTrigger className="input-animated-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">الأحدث أولاً</SelectItem>
                  <SelectItem value="asc">الأقدم أولاً</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            إعادة تعيين
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button size="sm" onClick={handleSearch} className="btn-gradient gap-1.5">
              <Search className="h-3.5 w-3.5" />
              بحث
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
