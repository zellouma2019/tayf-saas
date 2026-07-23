"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { shopApi } from "@/lib/shop-api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_SETTINGS } from "@/lib/default-settings";

const ADMIN_AUTH_TTL = 6 * 24 * 60 * 60 * 1000; // 6 days

function getStorageKey(shopId: string) {
  return `admin_auth_${shopId}`;
}

/** Check if there's a valid (non-expired) stored admin session for this shop */
function hasStoredSession(shopId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(getStorageKey(shopId));
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.shopId !== shopId) return false;
    if (Date.now() - data.timestamp > ADMIN_AUTH_TTL) {
      localStorage.removeItem(getStorageKey(shopId));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Store an admin session for this shop */
function storeSession(shopId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(shopId), JSON.stringify({
      adminAuthenticated: true,
      shopId,
      timestamp: Date.now(),
    }));
  } catch {}
}

/** Clear the stored admin session for this shop (logout) */
export function clearAdminSession(shopId?: string) {
  if (typeof window === "undefined") return;
  const id = shopId || useAppStore.getState().shopId;
  if (id) localStorage.removeItem(getStorageKey(id));
}

interface AdminGateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminGate({ open, onClose, onSuccess }: AdminGateProps) {
  const [code, setCode] = useState("");
  const [adminCode, setAdminCode] = useState(DEFAULT_SETTINGS.general.adminCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [autoUnlocked, setAutoUnlocked] = useState(false);

  // Check localStorage on mount + when open changes (client-only, no hydration issue)
  useEffect(() => {
    if (!open) {
      setAutoUnlocked(false);
      return;
    }
    const shopId = useAppStore.getState().shopId;
    if (shopId && hasStoredSession(shopId)) {
      setAutoUnlocked(true);
    }
  }, [open]);

  // When auto-unlocked, call onSuccess
  useEffect(() => {
    if (autoUnlocked) {
      onSuccess();
    }
  }, [autoUnlocked, onSuccess]);

  // Fetch admin code from settings (only when dialog is open and not auto-unlocked)
  useEffect(() => {
    if (!open || autoUnlocked) return;

    setLoading(true);
    shopApi("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const general = data.general || data.find?.((s: { key: string }) => s.key === "general")?.value;
        if (general?.adminCode) setAdminCode(general.adminCode);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, autoUnlocked]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (code === adminCode) {
      toast.success("تم التحقق من الكود بنجاح", {
        description: "مرحباً بك في لوحة الإدارة",
      });
      setCode("");
      setError(false);
      setAttempts(0);

      // Store session for future visits (6 days)
      const sid = useAppStore.getState().shopId;
      if (sid) storeSession(sid);

      onSuccess();
    } else {
      setError(true);
      setAttempts((a) => a + 1);
      toast.error("كود خاطئ", {
        description: attempts >= 2 ? "محاولة أخيرة قبل القفل المؤقت" : `المتبقي ${3 - attempts - 1} محاولات`,
      });
      setCode("");
      if (attempts >= 2) {
        setTimeout(() => {
          setAttempts(0);
          setError(false);
        }, 5000);
      }
    }
  }, [code, adminCode, attempts, onSuccess]);

  // Don't render the dialog if auto-unlocked via remembered session
  if (autoUnlocked) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden" dir="rtl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogTitle className="sr-only">كود الدخول للإدارة</DialogTitle>
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-900 flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold mb-1">قسم محمي</h2>
          <p className="text-sm text-muted-foreground mb-6">
            أدخل الكود السري للوصول إلى لوحة الإدارة
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                placeholder="• • • •"
                className={`text-center text-2xl font-mono tracking-[0.5em] h-14 ${
                  error ? "border-destructive bg-destructive/5" : ""
                }`}
                maxLength={4}
                inputMode="numeric"
                autoFocus
                dir="ltr"
              />

              {error && (
                <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  كود خاطئ — حاول مرة أخرى
                </div>
              )}

              <Button type="submit" className="w-full bg-neutral-900 hover:bg-neutral-800 text-white h-12" disabled={code.length < 4}>
                <ShieldCheck className="h-4 w-4" />
                دخول
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            🔒 هذا القسم مخصص للموظفين المصرح لهم فقط
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}