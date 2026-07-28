"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Eye, EyeOff, RefreshCw, ShieldAlert, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markAuthenticated, verifySession } from "@/lib/admin-utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"ar" | "en">("ar");

  // Prevent hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  // التحقق من صلاحية الجلسة مع الخادم (ليس localStorage فقط)
  useEffect(() => {
    (async () => {
      try {
        // تحقق من الخادم أولاً
        const { valid } = await verifySession();
        if (valid) {
          onUnlock();
          return;
        }
      } catch {}

      // التحقق من حالة كلمة المرور فقط (بدون إظهار تحذير قبل تسجيل الدخول)
      try {
        await fetch("/api/super-admin/password");
      } catch {}
      setChecking(false);
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

  const t = lang === "ar" ? {
    title: "طيف — لوحة الإدارة",
    subtitle: "أدخل كلمة المرور للوصول",
    placeholder: "كلمة المرور",
    loginBtn: "دخول",
    attempts: (a: number) => `⚠️ ${a}/${MAX_ATTEMPTS} محاولات — بعد ${MAX_ATTEMPTS} محاولات خاطئة سيتم القفل مؤقتاً`,
    lockedTitle: "تم قفل الوصول مؤقتاً",
    lockedSubtitle: "ثانية متبقية",
    lockedToast: (d: number) => `تم تجاوز ${MAX_ATTEMPTS} محاولات. انتظر ${d / 1000} ثانية.`,
    wrongPassword: (a: number) => `محاولة ${a} من ${MAX_ATTEMPTS}`,
    wrongTitle: "كلمة المرور غير صحيحة",
    connectionError: "خطأ في الاتصال",
    protected: "هذا القسم محمي ومخصص للإدارة فقط",
    version: "الإصدار 4.0 — منصة طيف للطباعة الذكية",
    defaultPwTitle: "⚠️ كلمة المرور الافتراضية لا تزال مستخدمة",
    defaultPwDesc: "يُرجى تغييرها فوراً من الإعدادات ← الأمان",
  } : {
    title: "Tayf — Admin Panel",
    subtitle: "Enter password to access",
    placeholder: "Password",
    loginBtn: "Login",
    attempts: (a: number) => `⚠️ ${a}/${MAX_ATTEMPTS} attempts — account locks after ${MAX_ATTEMPTS} failed attempts`,
    lockedTitle: "Access temporarily locked",
    lockedSubtitle: "seconds remaining",
    lockedToast: (d: number) => `Exceeded ${MAX_ATTEMPTS} attempts. Wait ${d / 1000}s.`,
    wrongPassword: (a: number) => `Attempt ${a} of ${MAX_ATTEMPTS}`,
    wrongTitle: "Incorrect password",
    connectionError: "Connection error",
    protected: "This section is protected for admin only",
    version: "v4.0 — Tayf Smart Printing Platform",
    defaultPwTitle: "⚠️ Default password is still in use",
    defaultPwDesc: "Please change it from Settings ← Security",
  };

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

        // تحقق من كلمة المرور الافتراضية بعد تسجيل الدخول فقط
        try {
          const pwRes = await fetch("/api/super-admin/password");
          const pwData = await pwRes.json();
          if (pwData.isDefault === true) {
            const { toast } = await import("sonner");
            setTimeout(() => {
              toast.warning(t.defaultPwTitle, {
                description: t.defaultPwDesc,
                duration: 10000,
              });
            }, 500);
          }
        } catch {}

        onUnlock();
      } else {
        setError(true);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setLockoutUntil(Date.now() + LOCKOUT_DURATION);
          const { toast } = await import("sonner");
          toast.error(t.lockedTitle, {
            description: t.lockedToast(LOCKOUT_DURATION),
            duration: 8000,
          });
        } else {
          const { toast } = await import("sonner");
          toast.error(t.wrongTitle, {
            description: t.wrongPassword(newAttempts),
          });
        }
      }
    } catch {
      setError(true);
      const { toast } = await import("sonner");
      toast.error(t.connectionError);
    } finally {
      setVerifying(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="h-6 w-6 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background flex items-center justify-center p-4 relative", lang === "ar" ? "dir-rtl" : "dir-ltr")} dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Dot grid background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 0.8px, transparent 0.8px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Animated decorative blobs */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: "rgba(139, 92, 246, 0.07)" }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/3 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: "rgba(245, 158, 11, 0.06)" }}
        animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: "rgba(99, 102, 241, 0.04)" }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <Card className="w-full max-w-sm shadow-2xl border-border backdrop-blur-sm bg-card/80 relative z-10 overflow-hidden">
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-transparent to-amber-500/20 pointer-events-none"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Shimmer border effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-violet-500/40 to-transparent" />

        <CardContent className="pt-8 pb-6 px-6 relative z-10">
          <div className="text-center mb-6">
            {/* Language toggle */}
            {mounted && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
                  title={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
                >
                  <Globe className="h-3 w-3" />
                  {lang === "ar" ? "EN" : "عربي"}
                </button>
              </div>
            )}

            <motion.img
              src={lang === "ar" ? "/tayf-logo-sm.png" : "/brand/tayf-logo.png"}
              alt=""
              className={cn("w-8 h-8 mx-auto mb-3", lang === "ar" ? "dark:hidden" : "dark:hidden")}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring" }}
            />
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20"
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              whileHover={{ scale: 1.05 }}
            >
              <Lock className="h-8 w-8 text-primary-foreground" />
            </motion.div>
            <h1 className="text-lg font-bold text-foreground">{t.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
          </div>

          <AnimatePresence mode="wait">
            {isLockedOut ? (
              <motion.div
                key="locked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-3 py-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="relative mx-auto w-fit"
                >
                  <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-md animate-[onlinePulse_2s_ease-in-out_infinite]" />
                  <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto relative drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                </motion.div>
                <p className="text-sm font-medium text-destructive">{t.lockedTitle}</p>
                <p className="text-3xl font-bold text-foreground tabular-nums">{lockoutSecondsLeft}</p>
                <p className="text-xs text-muted-foreground">{t.lockedSubtitle}</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(false); }}
                    placeholder={t.placeholder}
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
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-amber-500 text-center"
                  >
                    {t.attempts(attempts)}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-l from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.97] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-gold-500/50"
                  disabled={verifying || !password.trim()}
                >
                  {verifying ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                  ) : t.loginBtn}
                </Button>
                {!verifying && password.trim() && (
                  <p className="text-center text-[10px] text-muted-foreground/50 mt-1.5">
                    {lang === "ar" ? "اضغط Enter للدخول" : "Press Enter to login"}
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4">
            <ShieldAlert className="h-3 w-3" />
            <span>{t.protected}</span>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/40 mt-3">
            {t.version}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
