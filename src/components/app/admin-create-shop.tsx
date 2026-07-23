"use client";

import { useState } from "react";
import {
  Plus, ExternalLink, Lock, Link2, CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ARAB_COUNTRIES } from "@/lib/countries";
import { getNextThemeId } from "@/lib/themes";
import { robustCopy, openInNewTab } from "@/lib/admin-utils";
import { CopyButton } from "@/components/app/admin-shop-card";

export function CreateShopDialog({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [trialDays, setTrialDays] = useState("");
  const [country, setCountry] = useState("DZ");
  const [language, setLanguage] = useState("ar");
  const [submitting, setSubmitting] = useState(false);
  const [createdSlug, setCreatedSlug] = useState("");
  const [createdPin, setCreatedPin] = useState("");
  const [createdName, setCreatedName] = useState("");

  // إظهار شاشة النجاح بعد الإنشاء
  const showSuccess = !!createdSlug;

  function handleNameChange(value: string) {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  }

  function generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[\u0600-\u06FF]/g, (m) => {
        const map: Record<string, string> = {
          "ا": "a", "ب": "b", "ت": "t", "ث": "th", "ج": "j", "ح": "h", "خ": "kh",
          "د": "d", "ذ": "dh", "ر": "r", "ز": "z", "س": "s", "ش": "sh", "ص": "s",
          "ض": "dh", "ط": "t", "ظ": "dh", "ع": "a", "غ": "gh", "ف": "f", "ق": "k",
          "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h", "و": "w", "ي": "y",
        };
        return map[m] || "";
      })
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleClose() {
    setCreatedSlug(""); setCreatedPin(""); setCreatedName("");
    setName(""); setSlug(""); setAdminPin(""); setOwnerName(""); setOwnerPhone(""); setTrialDays(""); setCountry("DZ"); setLanguage("ar");
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug || !adminPin) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, adminPin, ownerName, ownerPhone, trialDays: trialDays ? Number(trialDays) : undefined, country, language, themeId: getNextThemeId() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "فشل الإنشاء");
      }
      // عرض شاشة النجاح مع الروابط
      setCreatedSlug(slug);
      setCreatedPin(adminPin);
      setCreatedName(name);
      onCreated();
    } catch (err) {
      toast.error("فشل إنشاء المتجر", { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const customerLink = `${baseUrl}/s/${createdSlug}`;
  const adminLink = `${customerLink}?admin=1`;

  async function copyText(text: string, label: string) {
    await robustCopy(text, `تم نسخ ${label}`, "");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md rounded-xl shadow-2xl p-0 gap-0 overflow-hidden bg-background" dir="rtl">
        <VisuallyHidden><DialogTitle>إنشاء متجر جديد</DialogTitle></VisuallyHidden>

        {showSuccess ? (
          /* ===== شاشة النجاح مع الروابط ===== */
          <div className="p-6 space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500 flex items-center justify-center mb-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-lg font-bold text-foreground">تم إنشاء المتجر بنجاح!</h2>
              <p className="text-sm text-muted-foreground/70 mt-1">{createdName}</p>
            </div>

            {/* رابط الزبائن */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <Link2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                رابط الزبائن (أعطه للعميل)
              </div>
              <div className="flex gap-2">
                <Input value={customerLink} readOnly className="flex-1 bg-muted text-xs rounded-lg border-border" dir="ltr" onClick={(e) => (e.target as HTMLInputElement).select()} />
                <CopyButton text={customerLink} label="نسخ" className="px-2 py-2" />
              </div>
              <p className="text-xs text-muted-foreground/70">🔗 أرسل هذا الرابط للعميل ليشاركه مع زبائنه</p>
            </div>

            {/* رابط الإدارة */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                </div>
                رابط الإدارة + كلمة المرور
              </div>
              <div className="flex gap-2">
                <Input value={adminLink} readOnly className="flex-1 bg-muted text-xs rounded-lg border-border" dir="ltr" onClick={(e) => (e.target as HTMLInputElement).select()} />
                <CopyButton text={adminLink} label="نسخ" className="px-2 py-2" />
              </div>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                <div className="text-xs font-bold text-primary mb-2">كلمة مرور الإدارة:</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xl font-mono font-bold text-foreground tracking-widest" dir="ltr">{createdPin}</span>
                  <CopyButton text={createdPin} label="نسخ" className="border-primary/20 text-primary hover:bg-primary/10" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70">🔒 أرسل رابط الإدارة + كلمة المرور للعميل فقط</p>
            </div>

            {/* تعليمات واضحة */}
            <div className="bg-muted rounded-lg p-4 space-y-2.5 border border-border">
              <h4 className="font-bold text-sm text-foreground/80">📌 ماذا تفعل الآن؟</h4>
              <ol className="text-xs text-muted-foreground/70 space-y-1.5 list-decimal list-inside">
                <li>أرسل <strong className="text-foreground/60">رابط الزبائن</strong> للعميل ليشاركه مع زبائنه</li>
                <li>أرسل <strong className="text-foreground/60">رابط الإدارة + كلمة المرور</strong> للعميل لإدارة متجره</li>
                <li>العميل يفتح رابط الإدارة ويدخل كلمة المرور</li>
                <li>من هناك يستطيع تعديل متجره ومتابعة طلبات زبائنه</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button onClick={handleClose} className="flex-1 bg-foreground hover:bg-foreground/80 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                تم، أغلق
              </button>
              <button onClick={() => openInNewTab(adminLink)} className="border border-border text-foreground/80 hover:bg-accent rounded-lg px-4 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5">
                <ExternalLink className="h-4 w-4" />
                فتح الإدارة
              </button>
            </div>
          </div>
        ) : (
          /* ===== نموذج الإنشاء ===== */
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">إنشاء متجر جديد</h2>
                <p className="text-xs text-muted-foreground/70">سيحصل العميل على رابطين: واحد للزبائن وآخر للإدارة</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-foreground/60">اسم المتجر *</Label>
                <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="مثال: مطبعة النور" className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" required />
              </div>
              <div>
                <Label className="text-foreground/60">المعرّف (الرابط) *</Label>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-xs text-muted-foreground/70 bg-muted px-3 py-2.5 rounded-r-lg border border-r-0 border-border whitespace-nowrap font-mono">/s/</span>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))} placeholder="matbaa-alnoor" className="rounded-l-lg rounded-r-none border-border focus:ring-ring focus:border-ring" dir="ltr" required />
                </div>
                <p className="text-xs text-muted-foreground/70 mt-1.5">سيكون الرابط: {baseUrl}/s/{slug || "..."}</p>
              </div>
              <div>
                <Label className="text-foreground/60">كلمة مرور الإدارة *</Label>
                <Input type="text" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="4 أرقام على الأقل" className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" required dir="ltr" />
                <p className="text-xs text-muted-foreground/70 mt-1.5">سيتم إرسالها للعميل مع رابط الإدارة</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground/60">اسم العميل</Label>
                  <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="الاسم" className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" />
                </div>
                <div>
                  <Label className="text-foreground/60">هاتف العميل</Label>
                  <Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="0XXX XXX XXX" className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground/60">الدولة والعملة</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="mt-1.5 rounded-lg border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {ARAB_COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.nameAr} — {c.currencySymbol} ({c.currencyEn})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-foreground/60">مدة التجربة المجانية (أيام)</Label>
                <Input type="number" min="0" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} placeholder="اتركه فارغاً = بلا حدود" className="mt-1.5 rounded-lg border-border focus:ring-ring focus:border-ring" dir="ltr" />
                {trialDays && (
                  <p className="text-xs text-amber-600 mt-1.5">⏰ ستبدأ التجربة تلقائياً من الآن لمدة {trialDays} يوم</p>
                )}
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-medium transition-colors h-11" disabled={submitting}>
                {submitting ? "جارٍ الإنشاء..." : "إنشاء المتجر"}
              </button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}