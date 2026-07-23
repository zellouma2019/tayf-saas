"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Eye, EyeOff, RefreshCw, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markAuthenticated, verifySession } from "@/lib/admin-utils";

// حد أقصى للمحاولات قبل القفل المؤقت
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60_000; // 60 ثانية

export function LoginGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);
  const lockoutRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // التحقق من صلاحية الجلسة مع الخادم (ليس localStorage فقط)
  useEffect(() => {
    (async () => {
      try {
        // تحقق من الخادم أولاً
        const valid = await verifySession();
        if (valid) {
          onUnlock();
          return;
        }
      } catch {}

      // إذا لم تنجح، تحقق من حالة كلمة المرور واعرض شاشة الدخول
      try {
        const r = await fetch("/api/super-admin/password");
        const d = await r.json();
        setChecking(false);

        if (d.isDefault === true) {
          setTimeout(() => {
            toast.warning("⚠️ كلمة المرور الافتراضية لا تزال مستخدمة", {
              description: "يُرجى تغييرها فوراً من الإعدادات ← الأمان",
              duration: 10000,
            });
          }, 800);
        }
      } catch {
        setChecking(false);
      }
    })();
  }, []);

  // عدّاد القفل المؤقت
  useEffect(() => {
    if (lockoutUntil > 0) {
      lockoutRef.current = setInterval(() => {
        const remaining = lockoutUntil - Date.now();
        if (remaining <= 0) {
          setLockoutUntil(0);
          setAttempts(0);
          if (lockoutRef.current) clearInterval(lockoutRef.current);
        }
      }, 1000);
      return () => { if (lockoutRef.current) clearInterval(lockoutRef.current); };
    }
  }, [lockoutUntil]);

  const isLockedOut = lockoutUntil > Date.now();
  const lockoutSecondsLeft = isLockedOut ? Math.ceil((lockoutUntil - Date.now()) / 1000) : 0;

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    if (!password.trim() || verifying || isLockedOut) return;

    setVerifying(true);
    try {
      const res = await fetch("/api/super-admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // حفظ رمز الجلسة المُوقَّع من الخادم مع الطابع الزمني
        markAuthenticated(data.token, data.ts);
        setAttempts(0);
        onUnlock();
      } else {
        setError(true);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockoutUntil(Date.now() + LOCKOUT_DURATION);
          toast.error("تم قفل الوصول مؤقتاً", {
            description: `تم تجاوز ${MAX_ATTEMPTS} محاولات. انتظر ${LOCKOUT_DURATION / 1000} ثانية.`,
            duration: 8000,
          });
        } else {
          toast.error("كلمة المرور غير صحيحة", {
            description: `محاولة ${newAttempts} من ${MAX_ATTEMPTS}`,
          });
        }
      }
    } catch {
      setError(true);
      toast.error("خطأ في الاتصال");
    } finally {
      setVerifying(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative" dir="rtl">
      {/* Decorative elements */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-sm shadow-2xl border-border backdrop-blur-sm bg-card/80 relative z-10">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold text-foreground">طيف — لوحة الإدارة</h1>
            <p className="text-sm text-muted-foreground mt-1">أدخل كلمة المرور للوصول</p>
          </div>

          {isLockedOut ? (
            <div className="text-center space-y-3 py-4">
              <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto" />
              <p className="text-sm font-medium text-destructive">تم قفل الوصول مؤقتاً</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{lockoutSecondsLeft}</p>
              <p className="text-xs text-muted-foreground">ثانية متبقية</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="كلمة المرور"
                  className={cn("h-11 text-sm pe-10", error && "border-destructive focus-visible:ring-destructive")}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {attempts > 0 && !isLockedOut && (
                <p className="text-[10px] text-amber-500 text-center">
                  ⚠️ {attempts}/{MAX_ATTEMPTS} محاولات — بعد {MAX_ATTEMPTS} محاولات خاطئة سيتم القفل مؤقتاً
                </p>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                disabled={verifying || !password.trim()}
              >
                {verifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : "دخول"}
              </Button>
            </form>
          )}

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4">
            <ShieldAlert className="h-3 w-3" />
            <span>هذا القسم محمي ومخصص للإدارة فقط</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}