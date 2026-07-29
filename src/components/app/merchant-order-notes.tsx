"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Trash2, Loader2, MessageSquare, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
}

interface MerchantOrderNotesProps {
  orderId: string;
  shopId: string;
}

const MAX_CHARS = 500;

function getStorageKey(orderId: string) {
  return `tayf-merchant-note-${orderId}`;
}

function loadNotes(orderId: string): StoredNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(orderId));
    if (!raw) return [];
    return JSON.parse(raw) as StoredNote[];
  } catch {
    return [];
  }
}

function saveNotes(orderId: string, notes: StoredNote[]) {
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

  useEffect(() => {
    setNotes(loadNotes(orderId));
  }, [orderId]);

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
    };

    // Save to localStorage first (instant)
    const updated = [newNote, ...notes];
    saveNotes(orderId, updated);
    setNotes(updated);
    setText("");
    setLastSaved(newNote.createdAt);

    // Attempt DB save via API
    try {
      await fetch(`/api/orders/${orderId}/notes?shopId=${encodeURIComponent(shopId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: trimmed, shopId }),
      });
    } catch {
      // Silent — localStorage already saved
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
    saveNotes(orderId, updated);
    setNotes(updated);
    setDeleteTarget(null);
    toast.success("تم حذف الملاحظة");
  }, [deleteTarget, notes, orderId]);

  return (
    <section className="bg-card border border-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-3 sm:p-4 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2.5 text-foreground border-r-4 border-r-primary pr-3">
        <MessageSquare className="h-3.5 w-3.5" />
        ملاحظات
      </h3>

      {/* Input area */}
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) setText(e.target.value);
            }}
            className="text-sm min-h-[70px] rounded-lg border-border bg-background resize-none"
            placeholder="أضف ملاحظة على هذا الطلب..."
            dir="rtl"
          />
          <span
            className={cn(
              "absolute bottom-2 left-3 text-[10px] tabular-nums",
              text.length >= MAX_CHARS
                ? "text-rose-500"
                : "text-muted-foreground/60"
            )}
          >
            {text.length}/{MAX_CHARS}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !text.trim()}
            className="h-8 px-3 text-xs gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? "جارٍ الحفظ..." : "حفظ الملاحظة"}
          </Button>
          {lastSaved && (
            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              آخر حفظ: {formatTimestamp(lastSaved)}
            </span>
          )}
        </div>
      </div>

      {/* Notes list */}
      {notes.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group relative flex items-start gap-2 rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/50 p-2.5 text-xs"
            >
              <div className="flex-1 min-w-0">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words">{note.text}</p>
                <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                  {formatTimestamp(note.createdAt)}
                </span>
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
      )}

      {/* Delete confirmation dialog */}
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
