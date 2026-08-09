"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useShop } from "@/lib/shop-context";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Receipt,
  Plus,
  Trash2,
  Package,
  Home,
  Wrench,
  Users,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Loader2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDA, formatDateAr } from "@/lib/print-config";

// ===== الفئات =====
const CATEGORIES: { value: string; label: string; icon: LucideIcon; color: string; bgColor: string }[] = [
  { value: "耗材", label: "耗材", icon: Package, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { value: "إيجار", label: "إيجار", icon: Home, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  { value: "صيانة", label: "صيانة", icon: Wrench, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { value: "رواتب", label: "رواتب", icon: Users, color: "text-violet-500", bgColor: "bg-violet-500/10" },
  { value: "أخرى", label: "أخرى", icon: MoreHorizontal, color: "text-gray-500", bgColor: "bg-gray-500/10" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

// ===== أنواع =====
interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function genId() {
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ===== المكون الرئيسي =====
interface MerchantExpensesProps {
  revenue?: number;
}

export function MerchantExpenses({ revenue = 0 }: MerchantExpensesProps) {
  const { shop } = useShop();
  const shopId = shop?.id ?? "";

  // ===== الحالة =====
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // نموذج الإضافة
  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState(todayStr());

  // ===== تحميل من localStorage =====
  useEffect(() => {
    if (!shopId) return;
    try {
      const raw = localStorage.getItem(`tayf_expenses_${shopId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Expense[];
        setExpenses(parsed);
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, [shopId]);

  // ===== حفظ في localStorage =====
  const saveExpenses = useCallback(
    (next: Expense[]) => {
      setExpenses(next);
      if (shopId) {
        localStorage.setItem(`tayf_expenses_${shopId}`, JSON.stringify(next));
      }
    },
    [shopId],
  );

  // ===== التصفية =====
  const filteredExpenses = useMemo(() => {
    if (!categoryFilter) return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const sortedExpenses = useMemo(
    () => [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredExpenses],
  );

  // ===== الإحصائيات =====
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const monthExpenses = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses
      .filter((e) => new Date(e.date) >= startOfMonth)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const netProfit = revenue - totalExpenses;

  // ===== إعادة تعيين النموذج =====
  const resetForm = () => {
    setFormCategory("");
    setFormAmount("");
    setFormDescription("");
    setFormDate(todayStr());
  };

  // ===== إضافة مصروف =====
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategory || !formAmount) {
      toast.error("الفئة والمبلغ مطلوبان");
      return;
    }
    const amount = Number(formAmount);
    if (amount <= 0) {
      toast.error("المبلغ يجب أن يكون أكبر من صفر");
      return;
    }

    const newExpense: Expense = {
      id: genId(),
      category: formCategory,
      amount,
      description: formDescription || null,
      date: formDate || todayStr(),
      createdAt: new Date().toISOString(),
    };

    saveExpenses([newExpense, ...expenses]);
    toast.success("تمت إضافة المصروف بنجاح");
    resetForm();
  };

  // ===== تعديل مصروف =====
  const startEdit = (exp: Expense) => {
    setEditingId(exp.id);
    setEditCategory(exp.category);
    setEditAmount(String(exp.amount));
    setEditDescription(exp.description || "");
    setEditDate(exp.date);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editCategory || !editAmount) {
      toast.error("الفئة والمبلغ مطلوبان");
      return;
    }
    const amount = Number(editAmount);
    if (amount <= 0) {
      toast.error("المبلغ يجب أن يكون أكبر من صفر");
      return;
    }
    setSavingId(id);
    const updated = expenses.map((exp) =>
      exp.id === id
        ? { ...exp, category: editCategory, amount, description: editDescription || null, date: editDate || exp.date }
        : exp,
    );
    saveExpenses(updated);
    toast.success("تم تحديث المصروف بنجاح");
    setEditingId(null);
    setSavingId(null);
  };

  // ===== حذف مصروف مع تأكيد =====
  const requestDelete = (exp: Expense) => {
    setExpenseToDelete(exp);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!expenseToDelete) return;
    setDeletingId(expenseToDelete.id);
    const updated = expenses.filter((e) => e.id !== expenseToDelete.id);
    saveExpenses(updated);
    toast.success("تم حذف المصروف");
    setDeletingId(null);
    setExpenseToDelete(null);
    setDeleteConfirmOpen(false);
  };

  // ===== تصنيف فئة =====
  const getCategoryInfo = (catValue: string) => {
    return CATEGORY_MAP[catValue] ?? { value: "أخرى", label: "أخرى", icon: MoreHorizontal, color: "text-gray-500", bgColor: "bg-gray-500/10" };
  };

  const handleFilterChange = (value: string) => {
    setCategoryFilter(value === "__all__" ? null : value);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* ===== العنوان ===== */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold flex items-center gap-2 border-r-4 border-gold-500 pr-3">
          <Receipt className="h-5 w-5 text-gold-500" />
          إدارة المصاريف
        </h2>
      </div>

      {/* ===== بطاقة صافي الربح ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 hover-lift">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">الإيرادات</span>
          </div>
          <p className="text-xl font-bold text-emerald-600">{formatDA(revenue)}</p>
        </div>
        <div className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 hover-lift">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            <span className="text-xs text-muted-foreground">إجمالي المصاريف</span>
          </div>
          <p className="text-xl font-bold text-rose-600">{formatDA(totalExpenses)}</p>
        </div>
        <div
          className={`bg-card border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 hover-lift ${
            netProfit >= 0 ? "border-emerald-500/20" : "border-rose-500/20"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            )}
            <span className="text-xs text-muted-foreground">صافي الربح</span>
          </div>
          <p
            className={`text-xl font-bold ${
              netProfit >= 0
                ? "text-gradient bg-gradient-to-l from-emerald-600 to-emerald-400 bg-clip-text text-transparent"
                : "text-gradient bg-gradient-to-l from-rose-600 to-rose-400 bg-clip-text text-transparent"
            }`}
          >
            {formatDA(netProfit)}
          </p>
          {/* شريط بصري */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                netProfit >= 0
                  ? "bg-gradient-to-l from-emerald-500 to-emerald-400"
                  : "bg-gradient-to-l from-rose-500 to-rose-400"
              }`}
              style={{
                width: revenue > 0
                  ? `${Math.min(100, Math.max(0, ((revenue - totalExpenses) / revenue) * 100))}%`
                  : "0%",
              }}
            />
          </div>
        </div>
      </div>

      {/* ===== نموذج الإضافة ===== */}
      <div className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5 hover-lift">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm font-semibold flex items-center gap-1.5 mb-1">
            <Plus className="h-4 w-4 text-gold-500" />
            إضافة مصروف جديد
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">الفئة</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="اختر الفئة..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.value} value={cat.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {cat.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">المبلغ</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="h-9"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الوصف</Label>
              <Input
                placeholder="وصف اختياري..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">التاريخ</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="h-9"
                dir="ltr"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={submitting || !formCategory || !formAmount}
            size="sm"
            className="gap-1.5 bg-gold-500 hover:bg-gold-600"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            إضافة مصروف
          </Button>
        </form>
      </div>

      {/* ===== ملخص المصاريف ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 hover-lift">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-gold-500" />
            <span className="text-xs text-muted-foreground">مصاريف الشهر</span>
          </div>
          <p className="text-xl font-bold">{formatDA(monthExpenses)}</p>
        </div>
        <div className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 hover-lift">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-rose-600" />
            <span className="text-xs text-muted-foreground">إجمالي المصاريف</span>
          </div>
          <p className="text-xl font-bold text-value-gradient">{formatDA(totalExpenses)}</p>
        </div>
      </div>

      {/* ===== فلتر الفئات ===== */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={!categoryFilter ? "default" : "outline"}
          size="sm"
          className={`h-8 text-xs ${!categoryFilter ? "bg-gold-500 text-white hover:bg-gold-600" : ""}`}
          onClick={() => handleFilterChange("__all__")}
        >
          الكل
        </Button>
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Button
              key={cat.value}
              variant={categoryFilter === cat.value ? "default" : "outline"}
              size="sm"
              className={`h-8 text-xs gap-1 ${
                categoryFilter === cat.value
                  ? "bg-gold-500 text-white hover:bg-gold-600"
                  : ""
              }`}
              onClick={() => handleFilterChange(cat.value)}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
            </Button>
          );
        })}
      </div>

      {/* ===== قائمة فارغة ===== */}
      {mounted && sortedExpenses.length === 0 && (
        <div className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 text-center card-entrance">
          <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            {categoryFilter
              ? "لا توجد مصاريف في هذه الفئة"
              : "لا توجد مصاريف مسجّلة بعد"}
          </p>
        </div>
      )}

      {/* ===== المحتوى الرئيسي ===== */}
      {sortedExpenses.length > 0 && (
        <>
          {/* ===== جدول سطح المكتب ===== */}
          <div className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] hidden md:block overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-dark-50">
                  <TableHead>الفئة</TableHead>
                  <TableHead className="text-center">المبلغ</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.map((exp) => {
                  const catInfo = getCategoryInfo(exp.category);
                  const Icon = catInfo.icon;
                  const isEditing = editingId === exp.id;
                  return (
                    <TableRow key={exp.id} className="group card-entrance">
                      <TableCell>
                        {isEditing ? (
                          <Select value={editCategory} onValueChange={setEditCategory}>
                            <SelectTrigger className="h-8 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  <span className="flex items-center gap-1.5">
                                    <c.icon className="h-3.5 w-3.5" />
                                    {c.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`flex items-center gap-1.5 text-sm font-medium ${catInfo.color}`}>
                            <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${catInfo.bgColor}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span>{catInfo.label}</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="h-8 w-28 text-center text-xs mx-auto"
                            dir="ltr"
                          />
                        ) : (
                          <span className="text-rose-600 font-semibold">
                            {formatDA(exp.amount)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="h-8 text-xs"
                            placeholder="وصف..."
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {exp.description || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="h-8 text-xs w-36"
                            dir="ltr"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {formatDateAr(exp.date)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleSaveEdit(exp.id)}
                                disabled={savingId === exp.id}
                              >
                                {savingId === exp.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-gold-500/10"
                                onClick={cancelEdit}
                                disabled={savingId === exp.id}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gold-500 hover:text-gold-600 hover:bg-gold-50"
                                onClick={() => startEdit(exp)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                onClick={() => requestDelete(exp)}
                                disabled={deletingId === exp.id}
                              >
                                {deletingId === exp.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ===== بطاقات الجوال ===== */}
          <div className="md:hidden space-y-3">
            {sortedExpenses.map((exp) => {
              const catInfo = getCategoryInfo(exp.category);
              const Icon = catInfo.icon;
              const isEditing = editingId === exp.id;
              return (
                <div
                  key={exp.id}
                  className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 card-entrance"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">الفئة</Label>
                        <Select value={editCategory} onValueChange={setEditCategory}>
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                <span className="flex items-center gap-1.5">
                                  <c.icon className="h-3.5 w-3.5" />
                                  {c.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">المبلغ</Label>
                          <Input
                            type="number"
                            min="0"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="h-9"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">التاريخ</Label>
                          <Input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="h-9"
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">الوصف</Label>
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="h-9"
                          placeholder="وصف اختياري..."
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="gap-1.5 bg-gold-500 hover:bg-gold-600"
                          onClick={() => handleSaveEdit(exp.id)}
                          disabled={savingId === exp.id}
                        >
                          {savingId === exp.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          حفظ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={savingId === exp.id}
                        >
                          إلغاء
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <span className={`flex items-center gap-1.5 font-bold text-sm ${catInfo.color}`}>
                          <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg ${catInfo.bgColor}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span>{catInfo.label}</span>
                        </span>
                        <div className="flex gap-1 shrink-0 mr-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gold-500"
                            onClick={() => startEdit(exp)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-500"
                            onClick={() => requestDelete(exp)}
                            disabled={deletingId === exp.id}
                          >
                            {deletingId === exp.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-rose-600 mb-1">
                        {formatDA(exp.amount)}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {exp.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDateAr(exp.date)}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* ===== إجمالي المصاريف في الأسفل ===== */}
          <div className="bg-card border border-gold-500/8 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 flex items-center justify-between card-entrance">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Receipt className="h-4 w-4 text-gold-500" />
              إجمالي المصاريف المعروضة
            </span>
            <span className="text-lg font-bold text-value-gradient">
              {formatDA(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
            </span>
          </div>
        </>
      )}

      {/* ===== حوار تأكيد الحذف ===== */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف المصروف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
              {expenseToDelete && (
                <span className="block mt-2 font-semibold text-rose-600">
                  {getCategoryInfo(expenseToDelete.category).label} — {formatDA(expenseToDelete.amount)}
                  {expenseToDelete.description && ` (${expenseToDelete.description})`}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="gap-1.5">
              <X className="h-3.5 w-3.5" />
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 gap-1.5"
              onClick={confirmDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
