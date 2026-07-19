"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Shield, Lock, Eye, EyeOff, RefreshCw, Users,
  Mail, Trash2, UserPlus, Timer, Check, LogOut, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDateTimeAr } from "@/lib/print-config";
import type { TeamMember } from "@/lib/admin-types";

export function SecurityTab() {
  // كلمة المرور
  const [isDefaultPwd, setIsDefaultPwd] = useState(true);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  // مؤشر قوة كلمة المرور — مبني على الطول فقط
  const pwdStrength = useMemo(() => {
    if (!newPwd) return { level: 0, label: "", color: "" };
    const len = newPwd.length;
    if (len < 10) return { level: 1, label: "قصيرة", color: "bg-rose-500" };
    if (len <= 14) return { level: 2, label: "مقبولة", color: "bg-amber-500" };
    if (len <= 19) return { level: 3, label: "جيدة", color: "bg-emerald-500" };
    return { level: 4, label: "قوية", color: "bg-emerald-500" };
  }, [newPwd]);

  // الفريق
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("member");
  const [addingMember, setAddingMember] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    // تحقق من حالة كلمة المرور
    fetch("/api/super-admin/password")
      .then(async r => { if (!r.ok) return null; return r.json(); })
      .then((d) => { if (d) setIsDefaultPwd(d.isDefault ?? true); })
      .catch(() => {});

    // تحميل أعضاء الفريق
    fetch("/api/super-admin/team")
      .then(async r => { if (!r.ok) return null; return r.json(); })
      .then((d) => { if (d) setMembers(d.members || []); })
      .catch(() => {})
      .finally(() => setLoadingTeam(false));
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPwd || newPwd !== confirmPwd) {
      if (newPwd !== confirmPwd) toast.error("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    if (newPwd.length < 10) {
      toast.error("كلمة المرور يجب أن تكون 10 أحرف على الأقل");
      return;
    }
    setChangingPwd(true);
    try {
      const res = await fetch("/api/super-admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: isDefaultPwd ? undefined : currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isDefaultPwd ? "تم تعيين كلمة المرور بنجاح ✅" : "تم تغيير كلمة المرور بنجاح");
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
        setIsDefaultPwd(false);
      } else {
        toast.error(data.error || "فشل تغيير كلمة المرور");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setChangingPwd(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !newName) return;
    setAddingMember(true);
    try {
      const res = await fetch("/api/super-admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, name: newName, role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("تمت إضافة العضو", { description: newEmail });
        setMembers(data.members || []);
        setNewEmail(""); setNewName(""); setNewRole("member");
      } else {
        toast.error(data.error || "فشل الإضافة");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(email: string) {
    try {
      const res = await fetch("/api/super-admin/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("تم حذف العضو");
        setMembers(data.members || []);
      } else {
        toast.error(data.error || "فشل الحذف");
      }
    } catch {
      toast.error("خطأ في الاتصال");
    }
  }

  function handleLogout() {
    localStorage.removeItem("sa_auth");
    window.location.reload();
  }

  return (
    <div className="space-y-5">
      {/* بانر حماية */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-5 w-5 text-teal-600" />
        </div>
        <p className="text-sm text-teal-800 font-medium">حماية لوحة التحكم الخاصة بك — تأكد من استخدام كلمة مرور قوية</p>
      </div>

      {/* معلومات الجلسة */}
      <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
            <Timer className="h-4 w-4 text-sky-600" />
          </div>
          <h3 className="text-sm text-slate-700 font-semibold">معلومات الجلسة</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-0.5">تاريخ الدخول</div>
            <div className="text-sm font-medium text-slate-800">{formatDateTimeAr(new Date().toISOString())}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-xs text-slate-400 mb-0.5">صلاحية الجلسة</div>
            <div className="text-sm font-medium text-slate-800">24 ساعة</div>
          </div>
        </div>
      </div>

      {/* ===== بطاقة كلمة المرور ===== */}
      <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm flex items-center gap-2 text-slate-700 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <Lock className="h-4 w-4 text-teal-600" />
              </div>
              كلمة مرور لوحة التحكم
            </h3>
            {isDefaultPwd && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                ⚠️ يجب تعيين كلمة مرور
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 mr-10">
            غيّر كلمة المرور بشكل دوري لحماية لوحة التحكم
          </p>
        </div>
        <div className="px-5 pb-5">
          <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
            {!isDefaultPwd && (
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">كلمة المرور الحالية</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية"
                  className="h-10 text-sm pe-10 rounded-lg"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            )}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="10 أحرف على الأقل"
                  className="h-10 text-sm pe-10 rounded-lg"
                  required
                  minLength={10}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* مؤشر القوة */}
              {newPwd && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i <= pwdStrength.level ? pwdStrength.color : "bg-slate-200"
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn(
                    "text-xs",
                    pwdStrength.level <= 1 ? "text-rose-500" :
                    pwdStrength.level <= 2 ? "text-amber-500" : "text-emerald-500"
                  )}>
                    القوة: {pwdStrength.label}
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">تأكيد كلمة المرور الجديدة</Label>
              <Input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                className="h-10 text-sm rounded-lg"
                required
                minLength={10}
              />
              {confirmPwd && newPwd !== confirmPwd && (
                <p className="text-xs text-rose-500 mt-1">كلمة المرور غير متطابقة</p>
              )}
            </div>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg h-10 px-5"
              disabled={changingPwd || (!isDefaultPwd && !currentPwd) || !newPwd || newPwd !== confirmPwd}
            >
              {changingPwd ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span className="mr-1.5">تغيير كلمة المرور</span>
            </Button>
          </form>
        </div>
      </div>

      {/* ===== بطاقة أعضاء الفريق ===== */}
      <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="p-5 pb-4">
          <h3 className="text-sm flex items-center gap-2 text-slate-700 font-semibold">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            فريق العمل
          </h3>
          <p className="text-xs text-slate-400 mt-1 mr-10">
            أضف أعضاء فريقك بالإيميل ليتمكنوا من الوصول والتعديل
          </p>
        </div>
        <div className="px-5 pb-5 space-y-4">
          {/* نموذج الإضافة */}
          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="الاسم الكامل"
                className="h-10 text-sm rounded-lg"
                required
              />
            </div>
            <div className="flex-1">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                className="h-10 text-sm rounded-lg"
                dir="ltr"
                required
              />
            </div>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="h-10 text-sm rounded-lg w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="member">عضو</SelectItem>
                <SelectItem value="viewer">مشاهد</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-10 px-4 shrink-0"
              disabled={addingMember || !newEmail || !newName}
            >
              {addingMember ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              <span className="mr-1.5 hidden sm:inline">إضافة</span>
            </Button>
          </form>

          {/* قائمة الأعضاء */}
          {loadingTeam ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
              جارٍ التحميل...
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              لا يوجد أعضاء في الفريق بعد
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {members.map((m) => (
                <div
                  key={m.email}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-teal-700">
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{m.name}</div>
                      <div className="text-xs text-slate-400 truncate flex items-center gap-1" dir="ltr">
                        <Mail className="h-3 w-3 shrink-0" />
                        {m.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={cn(
                        "text-xs",
                        m.role === "admin" ? "bg-teal-50 text-teal-700 border-teal-200" :
                        m.role === "viewer" ? "bg-slate-100 text-slate-600 border-slate-200" :
                        "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}
                    >
                      {m.role === "admin" ? "مدير" : m.role === "viewer" ? "مشاهد" : "عضو"}
                    </Badge>
                    <button
                      onClick={() => handleRemoveMember(m.email)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== تسجيل الخروج ===== */}
      <div className="bg-background rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm flex items-center gap-2 text-slate-700 font-semibold">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                <LogOut className="h-4 w-4 text-rose-600" />
              </div>
              الجلسة الحالية
            </h3>
            <p className="text-xs text-slate-400 mt-1 mr-10">تسجيل الخروج من لوحة التحكم</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg h-10 px-4"
          >
            <LogOut className="h-4 w-4" />
            <span className="mr-1.5">تسجيل الخروج</span>
          </Button>
        </div>
      </div>
    </div>
  );
}