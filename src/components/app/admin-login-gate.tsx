"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markAuthenticated } from "@/lib/admin-utils";

export function LoginGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isFirstSetup, setIsFirstSetup] = useState(false);

  // التحقق: هل هذه أول مرة (لم يتم تعيين كلمة مرور بعد)؟
  useEffect(() => {
    fetch("/api/super-admin/password")
      .then((r) => r.json())
      .then((d) => {
        const first = d.isDefault === true;
        setIsFirstSetup(first);
        setChecking(false);
        // أول مرة: دخول مباشر تلقائي بدون عرض بوابة
        if (first) {
          markAuthenticated();
          onUnlock();
          setTimeout(() => {
            toast.warning("أضف كلمة مرور", {
              description: "اذهب إلى الإعدادات ← الأمان والفريق وقم بتعيين كلمة مرور",
              duration: 8000,
            });
          }, 600);
        }
      })
      .catch(() => setChecking(false));
  }, []);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    // أول مرة: دخول مباشر بدون كلمة مرور
    if (isFirstSetup) {
      markAuthenticated();
      onUnlock();
      setTimeout(() => {
        toast.warning("أضف كلمة مرور", {
          description: "اذهب إلى الإعدادات ← الأمان والفريق وقم بتعيين كلمة مرور",
          duration: 8000,
        });
      }, 500);
      return;
    }

    if (!password.trim() || verifying) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/super-admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        markAuthenticated();
        onUnlock();
      } else {
        setError(true);
        toast.error("كلمة المرور غير صحيحة");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center" dir="rtl">
        <RefreshCw className="h-6 w-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  // بعد تعيين كلمة مرور: عرض حقل كلمة المرور
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-indigo-50 flex items-center justify-center p-4" dir="rtl">
      {/* Decorative blob */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-violet-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #7c3aed 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <Card className="w-full max-w-sm shadow-2xl border-slate-200/40 dark:border-slate-700/40 backdrop-blur-sm bg-background/80 relative z-10">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="text-center mb-6">
            <img src="/brand/tayf-logo.png" alt="طيف" className="w-16 h-16 mx-auto mb-4 animate-float" />
            <h1 className="text-lg font-bold text-slate-800"><span className="animate-fade-in inline-block">طيف</span></h1>
            <p className="text-sm text-slate-400 mt-1">منصة إدارة المطابع</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="كلمة المرور"
                className={cn("h-11 text-sm pe-10", error && "border-rose-300 focus-visible:ring-rose-500")}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200"
              disabled={verifying || !password.trim()}
            >
              {verifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : "دخول"}
            </Button>
          </form>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-4">
            <Lock className="h-3 w-3" />
            <span>هذا القسم مخصص للإدارة فقط</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}