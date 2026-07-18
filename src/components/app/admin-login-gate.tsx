"use client";

import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, RefreshCw, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markAuthenticated } from "@/lib/admin-utils";

export function LoginGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isFirstSetup, setIsFirstSetup] = useState(false);

  useEffect(() => {
    fetch("/api/super-admin/password")
      .then((r) => r.json())
      .then((d) => {
        const first = d.isDefault === true;
        setIsFirstSetup(first);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  async function handleSetupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || !confirmPassword.trim() || verifying) return;
    if (password.trim().length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); return; }
    if (password.trim() !== confirmPassword.trim()) { setError("كلمتا المرور غير متطابقتين"); return; }
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/super-admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        markAuthenticated();
        toast.success("تم إنشاء كلمة المرور بنجاح");
        onUnlock();
      } else {
        setError(data.error || "فشل إنشاء كلمة المرور");
      }
    } catch { setError("خطأ في الاتصال"); } finally { setVerifying(false); }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!password.trim() || verifying) return;
    setVerifying(true);
    setError("");
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
      } else if (data.requiresSetup) {
        setIsFirstSetup(true);
        toast.info("يرجى إنشاء كلمة مرور جديدة");
      } else {
        setError(data.error || "كلمة المرور غير صحيحة");
      }
    } catch { setError("خطأ في الاتصال"); } finally { setVerifying(false); }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center" dir="rtl">
        <RefreshCw className="h-6 w-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (isFirstSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-indigo-50 flex items-center justify-center p-4" dir="rtl">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-violet-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
        <Card className="w-full max-w-sm shadow-2xl border-slate-200/40 backdrop-blur-sm bg-background/80 relative z-10">
          <CardContent className="pt-8 pb-6 px-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center mb-4 shadow-lg shadow-violet-300/40">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-800">إعداد كلمة المرور</h1>
              <p className="text-sm text-slate-400 mt-1">مرحباً بك في طيف — أنشئ كلمة مرور لحساب المدير</p>
            </div>
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="كلمة المرور الجديدة" className={cn("h-11 text-sm pe-10", error && "border-rose-300 focus-visible:ring-rose-500")} autoFocus />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><Eye className={showPassword ? "hidden h-4 w-4" : "h-4 w-4"} /><EyeOff className={showPassword ? "h-4 w-4" : "hidden h-4 w-4"} /></button>
              </div>
              <div className="relative">
                <Input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }} placeholder="تأكيد كلمة المرور" className={cn("h-11 text-sm pe-10", error && "border-rose-300 focus-visible:ring-rose-500")} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><Eye className={showConfirmPassword ? "hidden h-4 w-4" : "h-4 w-4"} /><EyeOff className={showConfirmPassword ? "h-4 w-4" : "hidden h-4 w-4"} /></button>
              </div>
              {error && <p className="text-sm text-rose-500 text-center">{error}</p>}
              <Button type="submit" className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200" disabled={verifying || !password.trim() || !confirmPassword.trim()}>
                {verifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : "إنشاء كلمة المرور"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-indigo-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-violet-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      <Card className="w-full max-w-sm shadow-2xl border-slate-200/40 backdrop-blur-sm bg-background/80 relative z-10">
        <CardContent className="pt-8 pb-6 px-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center mb-4 shadow-lg shadow-violet-300/40">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">طيف</h1>
            <p className="text-sm text-slate-400 mt-1">منصة إدارة المطابع</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="كلمة المرور" className={cn("h-11 text-sm pe-10", error && "border-rose-300 focus-visible:ring-rose-500")} autoFocus />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><Eye className={showPassword ? "hidden h-4 w-4" : "h-4 w-4"} /><EyeOff className={showPassword ? "h-4 w-4" : "hidden h-4 w-4"} /></button>
            </div>
            {error && <p className="text-sm text-rose-500 text-center">{error}</p>}
            <Button type="submit" className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200" disabled={verifying || !password.trim()}>
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