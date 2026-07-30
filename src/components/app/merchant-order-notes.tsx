"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Trash2, Loader2, MessageSquare, Clock, StickyNote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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

interface StoredNote {
  id: string;
  text: string;
  createdAt: string;
  authorName?: string;
}

interface MerchantOrderNotesProps {
  orderId: string;
  shopId: string;
}

const MAX_CHARS = 500;

function getStorageKey(orderId: string) {
  return `tayf-merchant-note-${orderId}`;
}

function loadNotesFromStorage(orderId: string): StoredNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(orderId));
    if (!raw) return [];
    return JSON.parse(raw) as StoredNote[];
  } catch {
    return [];
  }
}

function saveNotesToStorage(orderId: string, notes: StoredNote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(orderId), JSON.stringify(notes));
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ar-DZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
  }

export function MerchantOrderNotes({ orderId, shopId }: MerchantOrderNotesProps) {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // تحميل الملاحظات من الـ API ثم دمجها مع localStorage
  const loadNotes = useCallback(async () => {
    setLoading(true);
    const localNotes = loadNotesFromStorage(orderId);

    try {
      const res = await fetch(`/api/orders/${orderId}/notes?shopId=${encodeURIComponent(shopId)}`);
      if (res.ok) {
        const data = await res.json();
        const apiNotes: StoredNote[] = (data.notes || []).map((n: any) => ({
          id: n.id || Date.now().toString(36),
          text: n.content || n.note || n.text || "",
          createdAt: n.createdAt || new Date().toISOString(),
          authorName: n.authorName || "المتجر",
        }));

        // دمج: أضف الملاحظات المحلية التي ليست في الـ API
        const apiIds = new Set(apiNotes.map(n => n.id));
        const merged = [
          ...apiNotes,
          ...localNotes.filter(ln => !apiIds.has(ln.id)),
        ];

        setNotes(merged);
        if (merged.length > localNotes.length) {
          saveNotesToStorage(orderId, merged);
        }
      } else {
        setNotes(localNotes);
      }
    } catch {
      setNotes(localNotes);
    } finally {
      setLoading(false);
    }
  }, [orderId, shopId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSave = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("اكتب ملاحظة أولاً");
      return;
    }

    setSaving(true);
    const newNote: StoredNote = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: trimmed,
      createdAt: new Date().toISOString(),
      authorName: "المتجر",
    };

    // حفظ محلياً فوراً
    const updated = [newNote, ...notes];
    saveNotesToStorage(orderId, updated);
    setNotes(updated);
    setText("");
    setLastSaved(newNote.createdAt);

    // محاولة الحفظ عبر الـ API
    try {
      await fetch(`/api/orders/${orderId}/notes?shopId=${encodeURIComponent(shopId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, authorName: "المتجر", shopId }),
      });
    } catch {
      // صامت — localStorage تم الحفظ بالفعل
    }

    setSaving(false);
    toast.success("تم حفظ الملاحظة");
  }, [text, notes, orderId, shopId]);

  const handleDelete = useCallback((noteId: string) => {
    setDeleteTarget(noteId);
  }, []);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const updated = notes.filter((n) => n.id !== deleteTarget);
    saveNotesToStorage(orderId, updated);
    setNotes(updated);
    setDeleteTarget(null);
    toast.success("تم حذف الملاحظة");
  }, [deleteTarget, notes, orderId]);

  const handleQuickAdd = useCallback(() => {
    if (text.trim()) handleSave();
  }, [text, handleSave]);

  return (
    <section className="space-y-3">
      {/* عنوان القسم */}
      <h3 className="text-sm font-semibold flex items-center gap-2.5 text-foreground">
        <StickyNote className="h-3.5 w-3.5 text-amber-500" />
        📝 ملاحظات داخلية
      </h3>

      {/* فاصل */}
      <div className="border-t border-border" />

      {/* قائمة الملاحظات */}
      {loading ? (
        <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin ml-2" />
          جارٍ تحميل الملاحظات...
        </div>
      ) : notes.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative flex items-start gap-2 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/50 p-2.5 text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-foreground text-xs">{note.authorName || "المتجر"}</span>
                  <span className="text-muted-foreground/60 flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {formatTimestamp(note.createdAt)}
                  </span>
                </div>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">{note.text}</p>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-500"
                aria-label="حذف الملاحظة"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/60 text-center py-2">لا توجد ملاحظات بعد</p>
      )}

      {/* حقل إضافة ملاحظة */}
      <div className="flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) setText(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleQuickAdd();
            }
          }}
          className="text-sm h-9 rounded-lg border-border bg-background flex-1"
          placeholder="أضف ملاحظة داخلية..."
          dir="rtl"
          disabled={saving}
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="h-9 px-3 text-xs gap-1.5 shrink-0"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saving ? "..." : "إضافة"}
        </Button>
      </div>

      {/* حذف الملاحظة — تأكيد */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الملاحظة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الملاحظة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
