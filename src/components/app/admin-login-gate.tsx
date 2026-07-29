"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Eye, EyeOff, RefreshCw, ShieldAlert, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="min-h-screen login-gate-bg flex items-center justify-center" dir="rtl">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="text-primary"
        >
          <RefreshCw className="h-6 w-6" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen login-gate-bg flex items-center justify-center p-4 relative overflow-hidden", lang === "ar" ? "dir-rtl" : "dir-ltr")} dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Dot grid background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 0.8px, transparent 0.8px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Animated decorative blobs */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: "rgba(139, 92, 246, 0.06)" }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: "rgba(245, 158, 11, 0.05)" }}
        animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: "rgba(99, 102, 241, 0.03)" }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Fade-in card wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <Card className="w-full login-gate-card border-border/40 bg-card/70 relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-amber-500/10 pointer-events-none dark:from-violet-500/15 dark:to-amber-500/15"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Shimmer top accent line */}
          <div className="absolute inset-x-0 top-0 login-gate-shimmer-line" />

          <CardContent className="pt-8 pb-6 px-6 relative z-10">
            <div className="text-center mb-6">
              {/* Language toggle */}
              {mounted && (
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors duration-200 px-2.5 py-1.5 rounded-lg hover:bg-muted/40 dark:hover:bg-muted/20"
                    title={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {lang === "ar" ? "EN" : "عربي"}
                  </button>
                </div>
              )}

              {/* Logo icon */}
              <motion.div
                className="w-[4.25rem] h-[4.25rem] mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center login-gate-logo"
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                whileHover={{ scale: 1.05 }}
              >
                <Lock className="h-8 w-8 text-primary-foreground" strokeWidth={1.75} />
              </motion.div>
              <motion.h1
                className="text-lg font-bold text-foreground tracking-tight"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
              >
                {t.title}
              </motion.h1>
              <motion.p
                className="text-sm text-muted-foreground/80 mt-1"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                {t.subtitle}
              </motion.p>
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
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(false); }}
                      placeholder={t.placeholder}
                      className={cn(
                        "login-gate-input w-full h-11 text-sm px-4 pe-10 text-foreground placeholder:text-muted-foreground/50 outline-none",
                        error && "input-error"
                      )}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground login-gate-pw-toggle"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {attempts > 0 && !isLockedOut && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-amber-600 dark:text-amber-400 text-center"
                    >
                      {t.attempts(attempts)}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    className={cn(
                      "login-gate-btn w-full h-11 bg-gradient-to-l from-primary to-primary/80 text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/40",
                      (verifying || !password.trim()) && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={verifying || !password.trim()}
                  >
                    {verifying ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RefreshCw className="h-4 w-4 mx-auto" />
                      </motion.div>
                    ) : t.loginBtn}
                  </button>
                  {!verifying && password.trim() && (
                    <p className="text-center text-[10px] text-muted-foreground/40 mt-1.5">
                      {lang === "ar" ? "اضغط Enter للدخول" : "Press Enter to login"}
                    </p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60 mt-5">
              <ShieldAlert className="h-3 w-3" />
              <span>{t.protected}</span>
            </div>
            <p className="text-center text-[10px] text-muted-foreground/30 mt-3">
              {t.version}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
