"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Save, Loader2, StickyNote, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { formatDateTimeAr } from "@/lib/print-config";
import { cn } from "@/lib/utils";
import { shopApi } from "@/lib/shop-api";

interface OrderNotesProps {
  orderId: string;
  initialNotes: string | null;
  updatedAt?: string;
}

export function OrderNotes({ orderId, initialNotes, updatedAt }: OrderNotesProps) {
  const adminCode = useAppStore((s) => s.adminCode);
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(initialNotes || "");
  const [savedNotes, setSavedNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadedNotes, setLoadedNotes] = useState(initialNotes || "");
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(updatedAt);

  // تحميل الملاحظات من الـ API عند التوسيع
  const fetchNotes = useCallback(async () => {
    try {
      const res = await shopApi(`/api/orders/${orderId}/notes?x-admin-code=${adminCode}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || "");
        setSavedNotes(data.notes || "");
        setLoadedNotes(data.notes || "");
        setLastUpdated(data.updatedAt);
      }
    } catch {
      /* silent */
    }
  }, [orderId, adminCode]);

  useEffect(() => {
    if (expanded) {
      fetchNotes();
    }
  }, [expanded, fetchNotes]);

  // تحديث الملاحظات الأولية إذا تغيّرت
  useEffect(() => {
    setLoadedNotes(initialNotes || "");
  }, [initialNotes]);

  async function handleSave() {
    if (notes === savedNotes) {
      toast.info("لا توجد تغييرات لحفظها");
      return;
    }
    setSaving(true);
    try {
      const res = await shopApi(`/api/orders/${orderId}/notes?x-admin-code=${adminCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-code": adminCode },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل الحفظ");
      }
      setSavedNotes(notes);
      setLoadedNotes(notes);
      setLastUpdated(new Date().toISOString());
      toast.success("تم حفظ الملاحظة بنجاح");
      // تأثير النجاح
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1200);
    } catch (e) {
      toast.error("خطأ في الحفظ", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  const hasNotes = !!loadedNotes.trim();
  const hasChanges = notes !== savedNotes;

  return (
    <section>
      {/* زر التوسيع */}
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-bold text-neutral-700 w-full text-right"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600" />
        )}
        <StickyNote className="h-4 w-4 text-amber-600" />
        ملاحظات الإدارة
        {hasNotes && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
            1
          </span>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-3">
              {/* الملاحظات المحفوظة */}
              {hasNotes ? (
                <Card
                  className={cn(
                    "border transition-colors duration-500",
                    showSuccess
                      ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20"
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <AnimatePresence mode="wait">
                        {showSuccess ? (
                          <motion.span
                            key="check"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="shrink-0 mt-0.5"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="note"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="shrink-0 mt-0.5"
                          >
                            <StickyNote className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                          {loadedNotes}
                        </p>
                        {lastUpdated && (
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            آخر تحديث: {formatDateTimeAr(lastUpdated)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground rounded-lg border border-dashed bg-muted/20">
                  <StickyNote className="h-6 w-6 mx-auto mb-1.5 text-muted-foreground/50" />
                  لا توجد ملاحظات
                </div>
              )}

              {/* حقل الإدخال */}
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm min-h-[60px] max-h-[156px] resize-none border-amber-200 dark:border-amber-800/40 focus-visible:ring-amber-400/50"
                  placeholder="أضف ملاحظة... (استخدم &quot;عام:&quot; في بداية النص لجعلها مرئية للعميل)"
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    💡 ابدأ بـ &quot;عام:&quot; لإظهار الملاحظة للعميل
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                    className="text-xs bg-amber-600 hover:bg-amber-700 h-8"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 ml-1 animate-spin" />
                        جارٍ الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5 ml-1" />
                        حفظ الملاحظة
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}