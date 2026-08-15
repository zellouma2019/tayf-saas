'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  ShoppingCart, DollarSign, Store, TrendingUp, TrendingDown,
  Plus, LogOut, RefreshCw, User, Search, Shield, Trash2, Eye,
  Lock, Settings, CalendarDays, Menu, LayoutDashboard, BarChart3,
  Users, UsersRound, Globe, Key, Bell, ToggleLeft, ToggleRight,
  Mail, Phone, MessageCircle, Palette, Clock, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Save, X, Copy, ExternalLink, Pencil, Zap, Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ThemeToggle } from '@/components/app/theme-toggle';
import {
  DashboardSidebar, type SidebarSection,
} from '@/components/ui/dashboard-sidebar';
import {
  isAuthenticated, verifySession, clearSession, clearVerifyCache,
  markAuthenticated, getTimeAgoShort, statusLabelAr, STATUS_COLORS,
  robustCopy,
} from '@/lib/admin-utils';
import { AdminShopManagement } from '@/components/app/admin-shop-management';
import { ARAB_COUNTRIES, formatDA } from '@/lib/countries';
import type { ShopItem } from '@/lib/admin-types';
import { cn } from '@/lib/utils';

// ===== Animation =====
const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ===== Types =====
interface PlatformSettings {
  platformName: string;
  platformTagline: string;
  platformLogo: string;
  platformEmail: string;
  platformPhone: string;
  platformWhatsapp: string;
  platformDescription: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewShops: boolean;
  maxShops: number;
  defaultCountry: string;
  defaultLanguage: string;
  defaultCurrency: string;
  defaultTrialDays: number;
  defaultWelcomeMessage: string;
  defaultFeatures: Record<string, boolean>;
  notifications: Record<string, boolean>;
  customCss: string;
}

interface TeamMember {
  email: string;
  name: string;
  role: string;
  addedAt: string;
}

// ===== Login Gate =====
function InlineLoginGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true); setError(false);
    try {
      const res = await fetch('/api/super-admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) { markAuthenticated(data.token, data.ts); onUnlock(); }
      else setError(true);
    } catch { setError(true); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="max-w-sm w-full dark:glass-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <img src="/n.png" alt="طيف" className="w-16 h-16 rounded-2xl object-contain shadow-lg" />
            <div className="text-center">
              <h1 className="text-2xl font-extrabold tracking-tight">لوحة تحكم المنصة</h1>
              <p className="text-sm text-muted-foreground font-medium">أدخل كلمة المرور للدخول</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} className="pr-9 h-11" dir="ltr" />
            </div>
            {error && <p className="text-destructive text-xs text-center">كلمة المرور غير صحيحة</p>}
            <Button type="submit" className="w-full rounded-full px-6 py-3 bg-gradient-to-l from-amber-500 to-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.3),0_0_60px_rgba(245,158,11,0.1)] hover:shadow-[0_0_24px_rgba(245,158,11,0.4),0_0_72px_rgba(245,158,11,0.15)] hover:opacity-90" disabled={loading}>
              {loading ? 'جاري التحقق...' : 'دخول'}
            </Button>
          </form>
          <div className="flex items-center justify-center gap-2 pt-2"><ThemeToggle /></div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Create Shop Dialog =====
function InlineCreateShop({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [pin, setPin] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [country, setCountry] = useState('DZ');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ name: string; slug: string; pin: string } | null>(null);

  function genSlug(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function handleName(v: string) { setName(v); if (!slug || slug === genSlug(name)) setSlug(genSlug(v)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug || !pin) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/shops', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, adminPin: pin, ownerName, ownerPhone, country }),
      });
      if (res.ok) { setCreated({ name, slug, pin }); onCreated(); }
      else { const data = await res.json().catch(() => ({})); toast.error(data.error || 'فشل إنشاء المتجر'); }
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSubmitting(false); }
  }

  function handleClose() {
    setName(''); setSlug(''); setPin(''); setOwnerName(''); setOwnerPhone('');
    setCreated(null); onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogTitle>{created ? 'تم إنشاء المتجر ✓' : 'إنشاء متجر جديد'}</DialogTitle>
        {created ? (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <p className="font-bold text-lg">{created.name}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">رابط المتجر:</span>
                  <button onClick={() => robustCopy(`/s/${created.slug}`, 'تم نسخ الرابط', '')} className="font-mono text-xs text-primary hover:underline">/s/{created.slug}</button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">كلمة المرور:</span>
                  <span className="font-mono text-xs font-bold">{created.pin}</span>
                </div>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full rounded-full px-6 py-3 hover:opacity-90">تم</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>اسم المتجر *</Label><Input value={name} onChange={(e) => handleName(e.target.value)} placeholder="مثال: مطبعة النور" className="h-11" /></div>
            <div className="space-y-2"><Label>المعرّف (slug) *</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="matbaa-alnoor" dir="ltr" className="h-11" /></div>
            <div className="space-y-2"><Label>كلمة مرور لوحة التحكم (PIN) *</Label><Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="1234" maxLength={10} dir="ltr" type="text" className="h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>اسم المالك</Label><Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="اختياري" className="h-11" /></div>
              <div className="space-y-2"><Label>هاتف المالك</Label><Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="اختياري" dir="ltr" className="h-11" /></div>
            </div>
            <div className="space-y-2">
              <Label>الدولة</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ARAB_COUNTRIES.map((c) => (<SelectItem key={c.code} value={c.code}>{c.flag} {c.name_ar}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 rounded-full hover:opacity-90">إلغاء</Button>
              <Button type="submit" disabled={!name || !slug || !pin || submitting} className="flex-1 rounded-full px-6 py-3 bg-gradient-to-l from-amber-500 to-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.25),0_0_60px_rgba(245,158,11,0.08)] hover:shadow-[0_0_24px_rgba(245,158,11,0.35),0_0_72px_rgba(245,158,11,0.12)] hover:opacity-90">
                {submitting ? 'جاري الإنشاء...' : 'إنشاء'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ===== Edit Shop Dialog =====
interface EditShopData {
  slug: string; name: string; phone: string | null;
  ownerName: string | null; ownerPhone: string | null;
  whatsapp: string | null; email: string | null; address: string | null;
  country: string | null; isActive: boolean; plan: string;
  primaryColor: string | null; adminPin: string;
}

function InlineEditShop({ open, onClose, shop, onSaved }: {
  open: boolean; onClose: () => void;
  shop: ShopItem | null; onSaved: () => void;
}) {
  const [data, setData] = useState<EditShopData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // جلب بيانات المتجر الكاملة عند الفتح
  useEffect(() => {
    if (!open || !shop) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/shops/${shop.slug}`);
        if (res.ok && !cancelled) {
          const d = await res.json();
          const s = d.shop;
          setData({
            slug: s.slug, name: s.name, phone: s.phone,
            ownerName: s.ownerName, ownerPhone: s.ownerPhone,
            whatsapp: s.whatsapp, email: s.email, address: s.address,
            country: s.country, isActive: s.isActive,
            plan: s.plan || 'free', primaryColor: s.primaryColor,
            adminPin: s.adminPin,
          });
        } else if (!cancelled) {
          toast.error('فشل تحميل بيانات المتجر');
          onClose();
        }
      } catch { if (!cancelled) { toast.error('خطأ في الاتصال'); onClose(); } }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [open, shop, onClose]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/shops/${data.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name, phone: data.phone, ownerName: data.ownerName,
          ownerPhone: data.ownerPhone, whatsapp: data.whatsapp,
          email: data.email, address: data.address, country: data.country,
          isActive: data.isActive, plan: data.plan,
          primaryColor: data.primaryColor, adminPin: data.adminPin,
        }),
      });
      if (res.ok) { toast.success('تم تحديث المتجر بنجاح'); onSaved(); onClose(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.error || 'فشل التحديث'); }
    } catch { toast.error('خطأ في الاتصال'); }
    finally { setSaving(false); }
  }

  function setField<K extends keyof EditShopData>(key: K, val: EditShopData[K]) {
    setData((prev) => (prev ? { ...prev, [key]: val } : prev));
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogTitle>تعديل المتجر</DialogTitle>
        <DialogDescription>تعديل بيانات وإعدادات المتجر</DialogDescription>
        {loading || !data ? (
          <div className="py-8 flex justify-center"><Skeleton className="h-48 w-full rounded-lg" /></div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المتجر *</Label>
              <Input value={data.name} onChange={(e) => setField('name', e.target.value)} className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>اسم المالك</Label>
                <Input value={data.ownerName || ''} onChange={(e) => setField('ownerName', e.target.value || null)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>هاتف المالك</Label>
                <Input value={data.ownerPhone || ''} onChange={(e) => setField('ownerPhone', e.target.value || null)} dir="ltr" className="h-11" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>هاتف المتجر</Label>
                <Input value={data.phone || ''} onChange={(e) => setField('phone', e.target.value || null)} dir="ltr" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>واتساب</Label>
                <Input value={data.whatsapp || ''} onChange={(e) => setField('whatsapp', e.target.value || null)} dir="ltr" className="h-11" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input value={data.email || ''} onChange={(e) => setField('email', e.target.value || null)} dir="ltr" type="email" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>الدولة</Label>
                <Select value={data.country || 'DZ'} onValueChange={(v) => setField('country', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ARAB_COUNTRIES.map((c) => (<SelectItem key={c.code} value={c.code}>{c.flag} {c.name_ar}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input value={data.address || ''} onChange={(e) => setField('address', e.target.value || null)} className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الخطة</Label>
                <Select value={data.plan} onValueChange={(v) => setField('plan', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">مجانية</SelectItem>
                    <SelectItem value="paid">مدفوعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>اللون الأساسي</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={data.primaryColor || '#f59e0b'} onChange={(e) => setField('primaryColor', e.target.value)} className="h-9 w-12 rounded-md border cursor-pointer" />
                  <Input value={data.primaryColor || '#f59e0b'} onChange={(e) => setField('primaryColor', e.target.value)} className="flex-1 font-mono text-xs h-11" dir="ltr" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
              <Label className="!mb-0 font-medium">حالة المتجر</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{data.isActive ? 'نشط' : 'متوقف'}</span>
                <Switch checked={data.isActive} onCheckedChange={(v) => setField('isActive', v)} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-full hover:opacity-90">إلغاء</Button>
              <Button type="submit" disabled={saving || !data.name} className="flex-1 rounded-full px-6 py-3 bg-gradient-to-l from-amber-500 to-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.25),0_0_60px_rgba(245,158,11,0.08)] hover:shadow-[0_0_24px_rgba(245,158,11,0.35),0_0_72px_rgba(245,158,11,0.12)] hover:opacity-90">
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ===== Share Shop Dialog =====
function InlineShareShop({ open, onClose, shop }: {
  open: boolean; onClose: () => void; shop: ShopItem | null;
}) {
  const [pinData, setPinData] = useState<{ pin: string; loaded: boolean }>({ pin: '', loaded: false });

  useEffect(() => {
    if (!open || !shop) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/shops/${shop.slug}`);
        if (res.ok && !cancelled) {
          const d = await res.json();
          setPinData({ pin: d.shop.adminPin || '', loaded: true });
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [open, shop]);

  if (!open || !shop) return null;

  const customerLink = `/s/${shop.slug}`;
  const adminLink = `/s/${shop.slug}?admin=1`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogTitle>مشاركة المتجر</DialogTitle>
        <DialogDescription>روابط وكلمة مرور متجر {shop.name}</DialogDescription>
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">رابط الزبون</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2.5 rounded-xl font-mono" dir="ltr">{customerLink}</code>
              <Button size="sm" variant="outline" className="shrink-0 gap-1 rounded-full hover:opacity-90" onClick={() => robustCopy(customerLink, 'تم النسخ', customerLink)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">رابط الإدارة</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2.5 rounded-xl font-mono" dir="ltr">{adminLink}</code>
              <Button size="sm" variant="outline" className="shrink-0 gap-1 rounded-full hover:opacity-90" onClick={() => robustCopy(adminLink, 'تم النسخ', adminLink)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Separator />
          <div className="space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">كلمة مرور الإدارة (PIN)</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 rounded-xl font-mono font-bold text-amber-700 dark:text-amber-300" dir="ltr">
                {pinData.loaded ? (pinData.pin || '—') : '...'}
              </code>
              {pinData.loaded && pinData.pin && (
                <Button size="sm" variant="outline" className="shrink-0 gap-1 rounded-full hover:opacity-90" onClick={() => robustCopy(pinData.pin, 'تم نسخ PIN', pinData.pin)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <Button onClick={onClose} className="w-full mt-4 rounded-full px-6 py-3 hover:opacity-90">تم</Button>
      </DialogContent>
    </Dialog>
  );
}

// ===== Mini Bar Chart (CSS-based, no Recharts) =====
function MiniBarChart({ data, maxValue, color = 'bg-primary' }: { data: number[]; maxValue?: number; color?: string }) {
  const max = maxValue || Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className={`${color} rounded-t-sm w-full transition-all duration-500`} style={{ height: `${Math.max((v / max) * 48, 2)}px` }} />
        </div>
      ))}
    </div>
  );
}

// ===== Main Admin Page =====
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [dailyData, setDailyData] = useState<{ date: string; orders: number; revenue: number }[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [monthOrders, setMonthOrders] = useState(0);
  const [totalShops, setTotalShops] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [adminName, setAdminName] = useState('مدير المنصة');
  const [deleteTarget, setDeleteTarget] = useState<ShopItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editTarget, setEditTarget] = useState<ShopItem | null>(null);
  const [shareTarget, setShareTarget] = useState<ShopItem | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Settings state
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('member');

  // Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Auth check
  useEffect(() => {
    (async () => {
      if (isAuthenticated()) {
        const { valid, adminName: name } = await verifySession();
        if (valid) { setAuthenticated(true); if (name) setAdminName(name); }
      }
      setLoading(false);
    })();
  }, []);

  const handleUnlock = useCallback(() => { setAuthenticated(true); }, []);

  // Fetch main data
  const fetchData = useCallback(async (silent = false) => {
    setRefreshing(true);
    try {
      const [shopsRes, statsRes, dailyRes] = await Promise.all([
        fetch('/api/shops'),
        fetch('/api/admin/global-stats'),
        fetch('/api/admin/global-daily-stats'),
      ]);
      if (shopsRes.ok) { const d = await shopsRes.json(); setShops(d.shops || []); }
      if (statsRes.ok) {
        const d = await statsRes.json();
        setTotalRevenue(d.totalRevenue || 0);
        setTodayOrders(d.todayOrders || 0);
        setRecentOrders(d.recentOrders || []);
        setStatusCounts(d.statusCounts || {});
      }
      if (dailyRes.ok) {
        const d = await dailyRes.json();
        setDailyData(d.daily || []);
        setMonthRevenue(d.monthRevenue || 0);
        setMonthOrders(d.monthOrders || 0);
        setTotalShops(d.totalShops || 0);
      }
      if (!silent) toast.success('تم تحديث البيانات');
    } catch { if (!silent) toast.error('فشل تحميل البيانات'); }
    setRefreshing(false);
  }, []);

  useEffect(() => { if (authenticated) fetchData(true); }, [authenticated, fetchData]);

  // Fetch platform settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/super-admin/platform-settings');
      if (res.ok) { const d = await res.json(); setPlatformSettings(d.settings); }
    } catch { /* ignore */ }
    setSettingsLoading(false);
  }, []);

  // Fetch team
  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/super-admin/team');
      if (res.ok) { const d = await res.json(); setTeamMembers(d.members || []); }
    } catch { /* ignore */ }
  }, []);

  // Load settings & team when tab changes
  useEffect(() => {
    if (!authenticated) return;
    if (activeTab === 'settings' && !platformSettings) fetchSettings();
    if (activeTab === 'team') fetchTeam();
  }, [activeTab, authenticated, platformSettings, fetchSettings, fetchTeam]);

  const handleShopCreated = useCallback(() => { setCreateOpen(false); fetchData(); toast.success('تم إنشاء المتجر بنجاح'); }, [fetchData]);
  const handleDeleteShop = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/shops/${deleteTarget.slug}`, { method: 'DELETE' });
      if (res.ok) { toast.success('تم حذف المتجر'); fetchData(); setDeleteTarget(null); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.error || 'فشل حذف المتجر'); }
    }
    catch { toast.error('خطأ في الاتصال'); }
    setDeleting(false);
  }, [deleteTarget, fetchData]);

  const handleToggleShop = useCallback(async (shop: ShopItem) => {
    try {
      const res = await fetch(`/api/admin/shops/${shop.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !shop.isActive }),
      });
      if (res.ok) {
        toast.success(shop.isActive ? 'تم إيقاف المتجر' : 'تم تفعيل المتجر');
        fetchData();
      } else toast.error('فشل تغيير الحالة');
    } catch { toast.error('خطأ'); }
  }, [fetchData]);

  const handleCopyPin = useCallback(async (shop: ShopItem) => {
    try {
      const res = await fetch(`/api/admin/shops/${shop.slug}`);
      if (res.ok) {
        const d = await res.json();
        const pin = d.shop?.adminPin;
        if (pin) { robustCopy(pin, 'تم نسخ PIN', pin); }
        else toast.error('لا توجد كلمة مرور');
      } else toast.error('فشل جلب PIN');
    } catch { toast.error('خطأ في الاتصال'); }
  }, []);

  const handleShopSaved = useCallback(() => { setEditTarget(null); fetchData(); }, [fetchData]);

  const handleLogout = useCallback(() => { clearSession(); setAuthenticated(false); setShops([]); setRecentOrders([]); }, []);

  // Save platform settings
  const saveSettings = useCallback(async (partial: Partial<PlatformSettings>) => {
    if (!platformSettings) return;
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/super-admin/platform-settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial),
      });
      if (res.ok) {
        const d = await res.json();
        setPlatformSettings(d.settings);
        toast.success('تم حفظ الإعدادات');
      } else toast.error('فشل حفظ الإعدادات');
    } catch { toast.error('خطأ في الاتصال'); }
    setSettingsSaving(false);
  }, [platformSettings]);

  // Add team member
  const addTeamMember = useCallback(async () => {
    if (!newMemberName || !newMemberEmail) return;
    try {
      const res = await fetch('/api/super-admin/team', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMemberName, email: newMemberEmail, role: newMemberRole }),
      });
      if (res.ok) {
        const d = await res.json(); setTeamMembers(d.members || []);
        setNewMemberName(''); setNewMemberEmail(''); setNewMemberRole('member');
        toast.success('تم إضافة العضو');
      } else { const d = await res.json().catch(() => ({})); toast.error(d.error || 'فشل الإضافة'); }
    } catch { toast.error('خطأ'); }
  }, [newMemberName, newMemberEmail, newMemberRole]);

  // Remove team member
  const removeTeamMember = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/super-admin/team', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) { const d = await res.json(); setTeamMembers(d.members || []); toast.success('تم حذف العضو'); }
    } catch { toast.error('خطأ'); }
  }, []);

  // Change password
  const changePassword = useCallback(async () => {
    if (!newPass || newPass.length < 6) { toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    if (newPass !== confirmPass) { toast.error('كلمة المرور غير متطابقة'); return; }
    setPassLoading(true);
    try {
      const res = await fetch('/api/super-admin/password', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      if (res.ok) { toast.success('تم تغيير كلمة المرور'); setCurrentPass(''); setNewPass(''); setConfirmPass(''); clearVerifyCache(); }
      else { const d = await res.json().catch(() => ({})); toast.error(d.error || 'فشل تغيير كلمة المرور'); }
    } catch { toast.error('خطأ'); }
    setPassLoading(false);
  }, [currentPass, newPass, confirmPass]);

  // Derived data
  const filteredShops = shops.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOrders = recentOrders.filter((o) => {
    const matchSearch =
      (o.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.shopName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.serviceName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customer?.phone || '').includes(searchQuery);
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  });
  const totalOrders = shops.reduce((sum, s) => sum + (s._count?.orders || 0), 0);
  const activeShops = shops.filter((s) => s.isActive).length;

  // Unique customers from orders
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; orders: number; total: number; lastOrder: string }>();
    for (const o of recentOrders) {
      const phone = o.customer?.phone || '—';
      const name = o.customer?.name || '—';
      const existing = map.get(phone);
      if (existing) { existing.orders += 1; existing.total += (o.total || 0); if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt; }
      else map.set(phone, { name, phone, orders: 1, total: o.total || 0, lastOrder: o.createdAt });
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [recentOrders]);

  const dailyOrdersArr = dailyData.map((d) => d.orders);
  const dailyRevenueArr = dailyData.map((d) => d.revenue);

  // ===== Sidebar =====
  const sidebarSections: SidebarSection[] = [
    {
      title: 'القائمة',
      items: [
        { key: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
        { key: 'shops', label: 'المتاجر', icon: Store, badge: shops.length || undefined },
        { key: 'orders', label: 'الطلبات', icon: ShoppingCart, badge: recentOrders.length || undefined },
      ],
    },
    {
      title: 'البيانات',
      items: [
        { key: 'analytics', label: 'التحليلات', icon: BarChart3 },
        { key: 'customers', label: 'العملاء', icon: Users, badge: uniqueCustomers.length || undefined },
      ],
    },
    {
      title: 'النظام',
      items: [
        { key: 'settings', label: 'الإعدادات', icon: Settings },
        { key: 'team', label: 'الفريق والأمان', icon: UsersRound },
      ],
    },
  ];

  const sidebarLogo = (
    <div className="flex items-center gap-3 overflow-hidden">
      <Image src="/n-sm.png" alt="طيف" width={32} height={32} className="w-8 h-8 rounded-lg object-contain shrink-0 shadow-sm" />
      <span className="font-bold text-sidebar-foreground text-sm truncate">طيف إدارة المنصة</span>
    </div>
  );

  const sidebarFooter = (
    <div className="flex items-center justify-between">
      <span className="text-xs text-sidebar-foreground/50 truncate">{adminName}</span>
      <ThemeToggle className="h-8 w-8" />
    </div>
  );

  const tabTitle: Record<string, string> = {
    dashboard: 'الرئيسية', shops: 'المتاجر', orders: 'الطلبات',
    analytics: 'التحليلات', customers: 'العملاء', settings: 'الإعدادات', team: 'الفريق والأمان',
  };

  // ===== Render =====
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl"><Skeleton className="w-48 h-48 rounded-2xl" /></div>;
  if (!authenticated) return <InlineLoginGate onUnlock={handleUnlock} />;

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      <DashboardSidebar
        sections={sidebarSections} activeKey={activeTab} onNavigate={setActiveTab}
        logo={sidebarLogo} footer={sidebarFooter}
        collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileMenuOpen} onMobileToggle={() => setMobileMenuOpen((v) => !v)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 dark:bg-[#050505] dark:border-b dark:border-white/[0.06] bg-card/80 backdrop-blur-sm border-b shadow-sm">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setMobileMenuOpen(true)} aria-label="القائمة">
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight dark:text-white">{tabTitle[activeTab] || ''}</h1>
                <p className="text-[10px] text-muted-foreground">مرحباً، {adminName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing} className="gap-1.5 rounded-full dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.06] hover:opacity-90"><RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /><span className="hidden sm:inline">{refreshing ? 'جارٍ التحديث...' : 'تحديث'}</span></Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 rounded-full text-rose-500 dark:text-[#c75252] hover:opacity-90"><LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">خروج</span></Button>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-8 w-full max-w-7xl flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ====== DASHBOARD TAB ====== */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" {...fadeIn} className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: 'إجمالي الطلبات', value: totalOrders, icon: ShoppingCart, color: 'from-[#c75252] to-[#a03030]', bg: 'bg-amber-50 dark:bg-[rgba(199,82,82,0.1)]', sub: `${todayOrders} اليوم` },
                    { label: 'الإيرادات', value: formatDA(totalRevenue), icon: DollarSign, color: 'from-[#d46060] to-[#b04040]', bg: 'bg-emerald-50 dark:bg-[rgba(199,82,82,0.08)]', sub: `${formatDA(monthRevenue)} هذا الشهر` },
                    { label: 'المتاجر', value: shops.length, icon: Store, color: 'from-[#e07070] to-[#c75252]', bg: 'bg-violet-50 dark:bg-[rgba(199,82,82,0.06)]', sub: `${activeShops} نشطة` },
                    { label: 'طلبات اليوم', value: todayOrders, icon: TrendingUp, color: 'from-[#c75252] to-[#d46060]', bg: 'bg-sky-50 dark:bg-[rgba(199,82,82,0.12)]', sub: `${uniqueCustomers.length} عميل` },
                  ].map((c, i) => (
                    <motion.div key={c.label} {...fadeIn} transition={{ delay: i * 0.06 }}>
                      <Card className={`${c.bg} rounded-[20px] border border-border/30 shadow-none dark:bg-white/[0.04] dark:border-white/[0.08]`}>
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-medium">{c.label}</p>
                              <p className="text-2xl font-black tabular-nums dark:text-white">{c.value}</p>
                              <p className="text-[10px] text-muted-foreground mt-1.5 font-medium">{c.sub}</p>
                            </div>
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-sm`}>
                              <c.icon className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* 7-Day Chart + Status Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card className="lg:col-span-2 dark:glass-card dark:glass-card-hover">
                    <CardHeader className="pb-2"><CardTitle className="text-base font-extrabold tracking-tight">إحصائيات 7 أيام</CardTitle><CardDescription>الطلبات اليومية والإيرادات</CardDescription></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">الطلبات</p>
                          <MiniBarChart data={dailyOrdersArr} color="bg-amber-400 dark:bg-[#c75252]" />
                          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                            <span>{dailyData[0]?.date?.slice(5) || ''}</span>
                            <span>{dailyData[dailyData.length - 1]?.date?.slice(5) || ''}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">الإيرادات</p>
                          <MiniBarChart data={dailyRevenueArr} color="bg-emerald-400 dark:bg-[#d46060]" />
                          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                            <span>{dailyData[0]?.date?.slice(5) || ''}</span>
                            <span>{dailyData[dailyData.length - 1]?.date?.slice(5) || ''}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="dark:glass-card dark:glass-card-hover">
                    <CardHeader className="pb-2"><CardTitle className="text-base font-extrabold tracking-tight">توزيع الحالات</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(statusCounts).length === 0 && <p className="text-xs text-muted-foreground">لا توجد بيانات</p>}
                      {Object.entries(statusCounts).map(([status, count]) => {
                        const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                        return (
                          <div key={status} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>{statusLabelAr(status)}</span>
                              <span className="tabular-nums">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${status === 'delivered' ? 'bg-emerald-500 dark:bg-[#c75252]' : status === 'pending' ? 'bg-amber-500 dark:bg-[#d46060]' : status === 'printing' ? 'bg-blue-500 dark:bg-[#e07070]' : status === 'cancelled' ? 'bg-rose-500 dark:bg-[#b04040]' : 'bg-violet-500 dark:bg-[#a03030]'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>

                {/* Top Shops + Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="dark:glass-card dark:glass-card-hover">
                    <CardHeader className="pb-2"><CardTitle className="text-base font-extrabold tracking-tight">أفضل المتاجر</CardTitle><CardDescription>حسب عدد الطلبات</CardDescription></CardHeader>
                    <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                      {shops.sort((a, b) => (b._count?.orders || 0) - (a._count?.orders || 0)).slice(0, 8).map((shop) => (
                        <div key={shop.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-[rgba(199,82,82,0.2)] dark:to-[rgba(199,82,82,0.1)] flex items-center justify-center text-sm">🖨️</div>
                            <div><p className="text-xs font-medium">{shop.name}</p><p className="text-[10px] text-muted-foreground font-mono" dir="ltr">{shop.slug}</p></div>
                          </div>
                          <div className="text-left"><p className="text-xs font-black tabular-nums">{shop._count?.orders || 0}</p><p className="text-[10px] text-muted-foreground">طلب</p></div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="dark:glass-card dark:glass-card-hover">
                    <CardHeader className="pb-2"><CardTitle className="text-base font-extrabold tracking-tight">آخر النشاطات</CardTitle></CardHeader>
                    <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                      {recentOrders.slice(0, 8).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-8 rounded-full ${order.status === 'delivered' ? 'bg-emerald-500 dark:bg-[#c75252]' : order.status === 'pending' ? 'bg-amber-500 dark:bg-[#d46060]' : order.status === 'printing' ? 'bg-blue-500 dark:bg-[#e07070]' : 'bg-muted-foreground/30 dark:bg-white/20'}`} />
                            <div>
                              <p className="text-xs font-medium">{order.serviceName || order.serviceType}</p>
                              <p className="text-[10px] text-muted-foreground">{order.shopName} · {order.customer?.name || '—'}</p>
                            </div>
                          </div>
                          <div className="text-left"><p className="text-xs font-black tabular-nums">{formatDA(order.total)}</p><p className="text-[10px] text-muted-foreground">{getTimeAgoShort(order.createdAt)}</p></div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* ====== SHOPS TAB ====== */}
            {activeTab === 'shops' && (
              <motion.div key="shops" {...fadeIn} className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="بحث في المتاجر..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 h-11" />
                  </div>
                  <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2 rounded-full px-6 py-3 bg-gradient-to-l from-amber-500 to-amber-600 text-white dark:from-[#c75252] dark:to-[#a03030] dark:text-white dark:hover:from-[#d46060] dark:hover:to-[#b04040] shadow-[0_0_20px_rgba(245,158,11,0.25),0_0_60px_rgba(245,158,11,0.08)] hover:shadow-[0_0_24px_rgba(245,158,11,0.35),0_0_72px_rgba(245,158,11,0.12)] hover:opacity-90">
                    <Plus className="h-4 w-4" />إنشاء متجر
                  </Button>
                </div>
                {filteredShops.length === 0 ? (
                  <Card className="border-dashed dark:glass-card"><CardContent className="flex flex-col items-center gap-4 py-16"><Store className="h-12 w-12 text-muted-foreground/30" /><h3 className="font-extrabold tracking-tight">لا توجد متاجر</h3><p className="text-sm font-medium text-muted-foreground">أنشئ أول متجر للبدء</p></CardContent></Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredShops.map((shop, idx) => (
                      <motion.div key={shop.id} {...fadeIn} transition={{ delay: idx * 0.03 }}>
                        <Card className="hover:shadow-md transition-shadow dark:glass-card">
                          <CardContent className="p-5 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-[rgba(199,82,82,0.2)] dark:to-[rgba(199,82,82,0.1)] flex items-center justify-center text-lg">🖨️</div>
                                <div>
                                  <h3 className="font-extrabold text-sm tracking-tight">{shop.name}</h3>
                                  <p className="text-[11px] text-muted-foreground font-mono" dir="ltr">{shop.slug}</p>
                                </div>
                              </div>
                              <Badge variant={shop.isActive ? 'default' : 'secondary'} className={shop.isActive ? 'bg-emerald-500 text-white dark:bg-[#c75252] dark:text-white' : ''}>
                                {shop.isActive ? 'نشط' : 'متوقف'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-muted/50"><ShoppingCart className="h-3 w-3 text-muted-foreground" /><span className="font-medium">{shop._count?.orders || 0} طلب</span></div>
                              <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-muted/50"><CalendarDays className="h-3 w-3 text-muted-foreground" /><span className="font-medium">{getTimeAgoShort(shop.createdAt)}</span></div>
                            </div>
                            {shop.ownerName && <p className="text-xs text-muted-foreground">👤 {shop.ownerName}{shop.phone ? ` · ${shop.phone}` : ''}</p>}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              <Button type="button" size="sm" variant="outline" className="gap-1 text-xs rounded-full dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.06]" asChild><a href={`/s/${shop.slug}`} target="_blank" rel="noopener noreferrer"><Eye className="h-3 w-3" />عرض</a></Button>
                              <Button type="button" size="sm" variant="outline" className="gap-1 text-xs rounded-full dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.06]" asChild><a href={`/s/${shop.slug}?admin=1`} target="_blank" rel="noopener noreferrer"><Shield className="h-3 w-3" />إدارة</a></Button>
                              <Button type="button" size="sm" variant="outline" className="gap-1 text-xs rounded-full dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.06]" onClick={() => setEditTarget(shop)}><Pencil className="h-3 w-3" />تعديل</Button>
                              <Button type="button" size="sm" variant="outline" className="gap-1 text-xs rounded-full dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.06]" onClick={() => setShareTarget(shop)}><Share2 className="h-3 w-3" />مشاركة</Button>
                              <Button type="button" size="sm" variant="outline" className="gap-1 text-xs rounded-full dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.06]" onClick={() => handleCopyPin(shop)}><Key className="h-3 w-3" />PIN</Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className={"gap-1 text-xs rounded-full dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.06] " + (shop.isActive ? 'text-amber-600 hover:text-amber-700 dark:text-[#d46060] dark:hover:text-[#e07070]' : 'text-emerald-600 hover:text-emerald-700 dark:text-[#c75252] dark:hover:text-[#d46060]')}
                                onClick={() => handleToggleShop(shop)}
                              >
                                {shop.isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                                {shop.isActive ? 'إيقاف' : 'تفعيل'}
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="gap-1 text-xs rounded-full text-rose-500 hover:text-rose-600 dark:text-[#dc2626] dark:border-white/[0.12] dark:hover:bg-white/[0.06]" onClick={() => setDeleteTarget(shop)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ====== ORDERS TAB ====== */}
            {activeTab === 'orders' && (
              <motion.div key="orders" {...fadeIn} className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <div className="relative max-w-sm flex-1 min-w-[200px]">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="بحث بالرقم أو المتجر أو الخدمة..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 h-11" />
                    </div>
                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="الحالة" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الحالات</SelectItem>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="printing">قيد الطباعة</SelectItem>
                        <SelectItem value="ready">جاهز</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                        <SelectItem value="cancelled">ملغى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Badge variant="outline" className="text-xs">{filteredOrders.length} طلب</Badge>
                </div>
                {filteredOrders.length === 0 ? (
                  <Card className="border-dashed dark:glass-card"><CardContent className="flex flex-col items-center gap-3 py-16"><ShoppingCart className="h-12 w-12 text-muted-foreground/30" /><p className="font-medium text-muted-foreground">لا توجد طلبات</p></CardContent></Card>
                ) : (
                  <div className="space-y-2">
                    {filteredOrders.map((order: any) => (
                      <Card key={order.id} className="hover:shadow-sm transition-shadow dark:glass-card dark:glass-card-hover">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-1 h-10 rounded-full shrink-0 ${order.status === 'delivered' ? 'bg-emerald-500 dark:bg-[#c75252]' : order.status === 'pending' ? 'bg-amber-500 dark:bg-[#d46060]' : order.status === 'printing' ? 'bg-blue-500 dark:bg-[#e07070]' : order.status === 'cancelled' ? 'bg-rose-500 dark:bg-[#b04040]' : 'bg-violet-500 dark:bg-[#a03030]'}`} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs text-muted-foreground">{order.reference}</span>
                                  <Badge variant="secondary" className={`${STATUS_COLORS[order.status] || ''} text-white text-[10px] px-1.5 py-0`}>{statusLabelAr(order.status)}</Badge>
                                </div>
                                <p className="text-sm font-medium truncate">{order.serviceName || order.serviceType}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{order.customer?.name || '—'}</span>
                                  <span>·</span>
                                  <a href={`/s/${order.shopSlug}?admin=1`} target="_blank" className="text-amber-600 hover:underline">{order.shopName}</a>
                                </div>
                              </div>
                            </div>
                            <div className="text-left shrink-0">
                              <p className="text-sm font-black tabular-nums dark:text-white">{formatDA(order.total)}</p>
                              <p className="text-[10px] text-muted-foreground">{getTimeAgoShort(order.createdAt)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ====== ANALYTICS TAB ====== */}
            {activeTab === 'analytics' && (
              <motion.div key="analytics" {...fadeIn} className="space-y-6">
                {/* Monthly Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'إيرادات الشهر', value: formatDA(monthRevenue), icon: DollarSign, color: 'from-[#c75252] to-[#a03030]' },
                    { label: 'طلبات الشهر', value: monthOrders, icon: ShoppingCart, color: 'from-[#d46060] to-[#b04040]' },
                    { label: 'متوسط قيمة الطلب', value: formatDA(monthOrders > 0 ? Math.round(monthRevenue / monthOrders) : 0), icon: TrendingUp, color: 'from-[#e07070] to-[#c75252]' },
                    { label: 'المتاجر النشطة', value: `${activeShops}/${shops.length}`, icon: Store, color: 'from-[#c75252] to-[#d46060]' },
                  ].map((c, i) => (
                    <motion.div key={c.label} {...fadeIn} transition={{ delay: i * 0.06 }}>
                      <Card className="rounded-[20px] border border-border/30 shadow-none dark:bg-white/[0.04] dark:border-white/[0.08]">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div><p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-medium">{c.label}</p><p className="text-xl font-black tabular-nums dark:text-white">{c.value}</p></div>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center`}><c.icon className="h-4 w-4 text-white" /></div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* 7-Day Revenue Chart */}
                <Card className="dark:glass-card dark:glass-card-hover">
                  <CardHeader className="pb-2"><CardTitle className="text-base font-extrabold tracking-tight">الإيرادات اليومية — آخر 7 أيام</CardTitle></CardHeader>
                  <CardContent>
                    {dailyData.length > 0 ? (
                      <div className="space-y-1">
                        {dailyData.map((d) => {
                          const maxRev = Math.max(...dailyData.map((x) => x.revenue), 1);
                          const pct = (d.revenue / maxRev) * 100;
                          return (
                            <div key={d.date} className="flex items-center gap-2 sm:gap-3">
                              <span className="text-[11px] text-muted-foreground w-14 sm:w-16 shrink-0 tabular-nums">{d.date?.slice(5)}</span>
                              <div className="flex-1 h-7 bg-muted rounded-xl overflow-hidden">
                                <div className="h-full bg-gradient-to-l from-amber-400 to-amber-600 dark:from-[#c75252] dark:to-[#a03030] rounded-xl transition-all duration-700" style={{ width: `${Math.max(pct, 1)}%` }} />
                              </div>
                              <span className="text-xs font-black tabular-nums w-16 sm:w-20 text-left shrink-0">{formatDA(d.revenue)}</span>
                              <span className="text-[10px] text-muted-foreground w-8 text-left shrink-0">{d.orders} طلب</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : <p className="text-sm text-muted-foreground">لا توجد بيانات</p>}
                  </CardContent>
                </Card>

                {/* Status + Service Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="dark:glass-card dark:glass-card-hover">
                    <CardHeader className="pb-2"><CardTitle className="text-base font-extrabold tracking-tight">توزيع حالات الطلبات</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                        const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                        const colors: Record<string, string> = { pending: 'bg-amber-500 dark:bg-[#d46060]', printing: 'bg-blue-500 dark:bg-[#e07070]', ready: 'bg-violet-500 dark:bg-[#c75252]', delivered: 'bg-emerald-500 dark:bg-[#a03030]', cancelled: 'bg-rose-500 dark:bg-[#b04040]' };
                        return (
                          <div key={status} className="space-y-1">
                            <div className="flex items-center justify-between text-xs"><span>{statusLabelAr(status)}</span><span className="tabular-nums font-medium">{count} ({pct}%)</span></div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${colors[status] || 'bg-muted-foreground'}`} style={{ width: `${pct}%` }} /></div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                  <Card className="dark:glass-card dark:glass-card-hover">
                    <CardHeader className="pb-2"><CardTitle className="text-base font-extrabold tracking-tight">أفضل العملاء</CardTitle><CardDescription>حسب إجمالي الإنفاق</CardDescription></CardHeader>
                    <CardContent className="space-y-2 max-h-72 overflow-y-auto">
                      {uniqueCustomers.slice(0, 10).map((c, i) => (
                        <div key={c.phone + i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-muted dark:bg-[rgba(199,82,82,0.2)] flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                            <div><p className="text-xs font-medium">{c.name}</p><p className="text-[10px] text-muted-foreground" dir="ltr">{c.phone}</p></div>
                          </div>
                          <div className="text-left"><p className="text-xs font-black tabular-nums">{formatDA(c.total)}</p><p className="text-[10px] text-muted-foreground">{c.orders} طلب</p></div>
                        </div>
                      ))}
                      {uniqueCustomers.length === 0 && <p className="text-xs font-medium text-muted-foreground">لا توجد بيانات</p>}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* ====== CUSTOMERS TAB ====== */}
            {activeTab === 'customers' && (
              <motion.div key="customers" {...fadeIn} className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="بحث بالاسم أو الهاتف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 h-11" />
                  </div>
                  <Badge variant="outline">{uniqueCustomers.length} عميل فريد</Badge>
                </div>
                {uniqueCustomers.length === 0 ? (
                  <Card className="border-dashed dark:glass-card"><CardContent className="flex flex-col items-center gap-3 py-16"><Users className="h-12 w-12 text-muted-foreground/30" /><p className="font-medium text-muted-foreground">لا يوجد عملاء</p></CardContent></Card>
                ) : (
                  <div className="space-y-2">
                    {uniqueCustomers
                      .filter((c) => (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.phone || '').includes(searchQuery))
                      .map((c, i) => (
                      <Card key={c.phone + i} className="hover:shadow-sm transition-shadow dark:glass-card dark:glass-card-hover">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-[rgba(199,82,82,0.2)] dark:to-[rgba(199,82,82,0.1)] flex items-center justify-center text-sm font-black text-amber-700 dark:text-[#d46060]">
                                {(c.name || '?')[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{c.name}</p>
                                <p className="text-xs text-muted-foreground" dir="ltr">{c.phone}</p>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black tabular-nums">{formatDA(c.total)}</p>
                              <p className="text-[10px] text-muted-foreground">{c.orders} طلب · {getTimeAgoShort(c.lastOrder)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ====== SETTINGS TAB ====== */}
            {activeTab === 'settings' && (
              <motion.div key="settings" {...fadeIn} className="space-y-6">
                {settingsLoading && !platformSettings ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
                ) : platformSettings ? (
                  <>
                    {/* Platform Info */}
                    <Card className="dark:glass-card">
                      <CardHeader><CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2"><Globe className="h-4 w-4" />معلومات المنصة</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>اسم المنصة</Label><Input value={platformSettings.platformName} onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })} className="h-11" /></div>
                          <div className="space-y-2"><Label>الشعار النصي</Label><Input value={platformSettings.platformTagline} onChange={(e) => setPlatformSettings({ ...platformSettings, platformTagline: e.target.value })} className="h-11" /></div>
                          <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input value={platformSettings.platformEmail} onChange={(e) => setPlatformSettings({ ...platformSettings, platformEmail: e.target.value })} dir="ltr" className="h-11" /></div>
                          <div className="space-y-2"><Label>الهاتف</Label><Input value={platformSettings.platformPhone} onChange={(e) => setPlatformSettings({ ...platformSettings, platformPhone: e.target.value })} dir="ltr" className="h-11" /></div>
                          <div className="space-y-2"><Label>واتساب</Label><Input value={platformSettings.platformWhatsapp} onChange={(e) => setPlatformSettings({ ...platformSettings, platformWhatsapp: e.target.value })} dir="ltr" placeholder="213xxxxxxxxx" className="h-11" /></div>
                          <div className="space-y-2"><Label>وصف المنصة</Label><Textarea value={platformSettings.platformDescription} onChange={(e) => setPlatformSettings({ ...platformSettings, platformDescription: e.target.value })} rows={2} /></div>
                        </div>
                        <Button onClick={() => saveSettings(platformSettings)} disabled={settingsSaving} className="gap-2 rounded-full px-6 py-3 bg-gradient-to-l from-amber-500 to-amber-600 text-white dark:from-[#c75252] dark:to-[#a03030] dark:text-white shadow-[0_0_20px_rgba(245,158,11,0.25),0_0_60px_rgba(245,158,11,0.08)] hover:shadow-[0_0_24px_rgba(245,158,11,0.35),0_0_72px_rgba(245,158,11,0.12)] hover:opacity-90">
                          <Save className="h-4 w-4" />{settingsSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* General Settings */}
                    <Card className="dark:glass-card">
                      <CardHeader><CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2"><Settings className="h-4 w-4" />الإعدادات العامة</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2"><Label>الدولة الافتراضية</Label>
                            <Select value={platformSettings.defaultCountry} onValueChange={(v) => setPlatformSettings({ ...platformSettings, defaultCountry: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>{ARAB_COUNTRIES.map((c) => (<SelectItem key={c.code} value={c.code}>{c.flag} {c.name_ar}</SelectItem>))}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2"><Label>اللغة الافتراضية</Label>
                            <Select value={platformSettings.defaultLanguage} onValueChange={(v) => setPlatformSettings({ ...platformSettings, defaultLanguage: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="ar">العربية</SelectItem><SelectItem value="fr">الفرنسية</SelectItem><SelectItem value="en">الإنجليزية</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2"><Label>العملة الافتراضية</Label>
                            <Select value={platformSettings.defaultCurrency} onValueChange={(v) => setPlatformSettings({ ...platformSettings, defaultCurrency: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="DZD">دينار جزائري (DZD)</SelectItem><SelectItem value="TND">دينار تونسي (TND)</SelectItem><SelectItem value="MAD">درهم مغربي (MAD)</SelectItem><SelectItem value="SAR">ريال سعودي (SAR)</SelectItem><SelectItem value="AED">درهم إماراتي (AED)</SelectItem><SelectItem value="EGP">جنيه مصري (EGP)</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2"><Label>مدة التجربة (أيام)</Label><Input type="number" value={platformSettings.defaultTrialDays} onChange={(e) => setPlatformSettings({ ...platformSettings, defaultTrialDays: parseInt(e.target.value) || 30 })} className="h-11" /></div>
                          <div className="space-y-2"><Label>الحد الأقصى للمتاجر</Label><Input type="number" value={platformSettings.maxShops} onChange={(e) => setPlatformSettings({ ...platformSettings, maxShops: parseInt(e.target.value) || 100 })} className="h-11" /></div>
                          <div className="space-y-2"><Label>رسالة الترحيب الافتراضية</Label><Input value={platformSettings.defaultWelcomeMessage} onChange={(e) => setPlatformSettings({ ...platformSettings, defaultWelcomeMessage: e.target.value })} className="h-11" /></div>
                        </div>
                        <Button onClick={() => saveSettings(platformSettings)} disabled={settingsSaving} className="gap-2 rounded-full hover:opacity-90"><Save className="h-4 w-4" />{settingsSaving ? 'جاري الحفظ...' : 'حفظ'}</Button>
                      </CardContent>
                    </Card>

                    {/* Feature Toggles */}
                    <Card className="dark:glass-card">
                      <CardHeader><CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2"><Zap className="h-4 w-4" />الميزات الافتراضية للمتاجر الجديدة</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        {Object.entries({
                          whatsappNotifications: { label: 'إشعارات واتساب', desc: 'إرسال إشعارات الطلبات عبر واتساب' },
                          orderTracking: { label: 'تتبع الطلبات', desc: 'السماح للعملاء بتتبع حالة طلباتهم' },
                          darkMode: { label: 'الوضع الداكن', desc: 'تفعيل المظهر الداكن للمتجر' },
                          repeatOrders: { label: 'إعادة الطلب', desc: 'السماح للعملاء بإعادة طلب سابق' },
                          customerLogin: { label: 'تسجيل العميل', desc: 'تفعيل تسجيل دخول العملاء' },
                          advancedAnalytics: { label: 'التحليلات المتقدمة', desc: 'تفعيل لوحة التحليلات المتقدمة' },
                        }).map(([key, info]) => (
                          <div key={key} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                            <div><p className="text-sm font-medium">{info.label}</p><p className="text-xs text-muted-foreground">{info.desc}</p></div>
                            <Switch
                              checked={!!platformSettings.defaultFeatures?.[key]}
                              onCheckedChange={(v) => setPlatformSettings({ ...platformSettings, defaultFeatures: { ...platformSettings.defaultFeatures, [key]: v } })}
                            />
                          </div>
                        ))}
                        <Button onClick={() => saveSettings({ defaultFeatures: platformSettings.defaultFeatures })} disabled={settingsSaving} className="gap-2 rounded-full hover:opacity-90"><Save className="h-4 w-4" />حفظ</Button>
                      </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card className="dark:glass-card">
                      <CardHeader><CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2"><Bell className="h-4 w-4" />إعدادات الإشعارات</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        {Object.entries({
                          newOrderSound: { label: 'صوت الطلب الجديد', desc: 'تشغيل صوت عند وصول طلب جديد' },
                          orderStatusChange: { label: 'تغيير حالة الطلب', desc: 'إشعار عند تغيير حالة أي طلب' },
                          dailySummary: { label: 'الملخص اليومي', desc: 'إرسال ملخص يومي للطلبات والإيرادات' },
                          lowBalanceAlert: { label: 'تنبيه الرصيد المنخفض', desc: 'تنبيه عند انخفاض رصيد المنصة' },
                        }).map(([key, info]) => (
                          <div key={key} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                            <div><p className="text-sm font-medium">{info.label}</p><p className="text-xs text-muted-foreground">{info.desc}</p></div>
                            <Switch
                              checked={!!platformSettings.notifications && !!platformSettings.notifications[key]}
                              onCheckedChange={(v) => setPlatformSettings({ ...platformSettings, notifications: { ...platformSettings.notifications, [key]: v } })}
                            />
                          </div>
                        ))}
                        <Button onClick={() => saveSettings({ notifications: platformSettings.notifications })} disabled={settingsSaving} className="gap-2 rounded-full hover:opacity-90"><Save className="h-4 w-4" />حفظ</Button>
                      </CardContent>
                    </Card>

                    {/* Maintenance Mode */}
                    <Card className={cn(platformSettings.maintenanceMode && 'border-destructive', 'dark:glass-card')}>
                      <CardHeader><CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2"><AlertTriangle className={`h-4 w-4 ${platformSettings.maintenanceMode ? 'text-destructive' : ''}`} />وضع الصيانة</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <div><p className="text-sm font-medium">تفعيل وضع الصيانة</p><p className="text-xs text-muted-foreground">سيتم إخفاء جميع المتاجر عن العملاء</p></div>
                          <Switch
                            checked={platformSettings.maintenanceMode}
                            onCheckedChange={(v) => {
                              setPlatformSettings({ ...platformSettings, maintenanceMode: v });
                              saveSettings({ maintenanceMode: v });
                            }}
                          />
                        </div>
                        {platformSettings.maintenanceMode && (
                          <div className="space-y-2">
                            <Label>رسالة الصيانة</Label>
                            <Textarea value={platformSettings.maintenanceMessage} onChange={(e) => setPlatformSettings({ ...platformSettings, maintenanceMessage: e.target.value })} rows={2} />
                            <Button onClick={() => saveSettings({ maintenanceMessage: platformSettings.maintenanceMessage })} disabled={settingsSaving} size="sm" className="gap-1 rounded-full hover:opacity-90"><Save className="h-3.5 w-3.5" />حفظ الرسالة</Button>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                          <div><p className="text-sm font-medium">السماح بإنشاء متاجر جديدة</p><p className="text-xs text-muted-foreground">التحكم في إنشاء المتاجر الجديدة</p></div>
                          <Switch
                            checked={platformSettings.allowNewShops}
                            onCheckedChange={(v) => {
                              setPlatformSettings({ ...platformSettings, allowNewShops: v });
                              saveSettings({ allowNewShops: v });
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : null}
              </motion.div>
            )}

            {/* ====== TEAM & SECURITY TAB ====== */}
            {activeTab === 'team' && (
              <motion.div key="team" {...fadeIn} className="space-y-6">
                {/* Password Change */}
                <Card className="dark:glass-card">
                  <CardHeader><CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2"><Key className="h-4 w-4" />تغيير كلمة المرور</CardTitle><CardDescription>قم بتغيير كلمة مرور لوحة تحكم المنصة</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>كلمة المرور الحالية</Label><Input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} dir="ltr" className="h-11" /></div>
                      <div className="space-y-2"><Label>كلمة المرور الجديدة</Label><Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} dir="ltr" className="h-11" /></div>
                      <div className="space-y-2"><Label>تأكيد كلمة المرور</Label><Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} dir="ltr" className="h-11" /></div>
                    </div>
                    <Button onClick={changePassword} disabled={passLoading || !newPass} className="gap-2 rounded-full px-6 py-3 bg-gradient-to-l from-amber-500 to-amber-600 text-white dark:from-[#c75252] dark:to-[#a03030] dark:text-white shadow-[0_0_20px_rgba(245,158,11,0.25),0_0_60px_rgba(245,158,11,0.08)] hover:shadow-[0_0_24px_rgba(245,158,11,0.35),0_0_72px_rgba(245,158,11,0.12)] hover:opacity-90">
                      <Lock className="h-4 w-4" />{passLoading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Team Members */}
                <Card className="dark:glass-card">
                  <CardHeader><CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2"><UsersRound className="h-4 w-4" />أعضاء الفريق</CardTitle><CardDescription>إدارة أعضاء فريق الإدارة</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add member form */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-muted/50">
                      <div className="space-y-1"><Label className="text-xs uppercase tracking-wider">الاسم</Label><Input placeholder="اسم العضو" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="h-11" /></div>
                      <div className="space-y-1"><Label className="text-xs uppercase tracking-wider">البريد الإلكتروني</Label><Input placeholder="email@example.com" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} dir="ltr" className="h-11" /></div>
                      <div className="space-y-1"><Label className="text-xs uppercase tracking-wider">الدور</Label>
                        <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="admin">مدير</SelectItem><SelectItem value="member">عضو</SelectItem><SelectItem value="viewer">مشاهد</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end"><Button onClick={addTeamMember} disabled={!newMemberName || !newMemberEmail} size="sm" className="w-full gap-1 rounded-full bg-gradient-to-l from-amber-500 to-amber-600 text-white dark:from-[#c75252] dark:to-[#a03030] dark:text-white shadow-[0_0_16px_rgba(245,158,11,0.2),0_0_48px_rgba(245,158,11,0.06)] hover:opacity-90"><Plus className="h-4 w-4" />إضافة</Button></div>
                    </div>
                    {/* Members list */}
                    <div className="space-y-2">
                      {teamMembers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا يوجد أعضاء فريق</p>}
                      {teamMembers.map((member) => (
                        <div key={member.email} className="flex items-center justify-between p-3 rounded-xl border border-border/30">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-100 to-violet-50 dark:from-[rgba(199,82,82,0.2)] dark:to-[rgba(199,82,82,0.1)] flex items-center justify-center text-sm font-black text-violet-700 dark:text-[#d46060]">
                              {member.name[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground" dir="ltr">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{member.role === 'admin' ? 'مدير' : member.role === 'member' ? 'عضو' : 'مشاهد'}</Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 rounded-full hover:opacity-90" onClick={() => removeTeamMember(member.email)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* System Info */}
                <Card className="dark:glass-card">
                  <CardHeader><CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2"><Shield className="h-4 w-4" />معلومات النظام</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-muted/50"><p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">إجمالي المتاجر</p><p className="text-lg font-black tabular-nums">{shops.length}</p></div>
                      <div className="p-3 rounded-xl bg-muted/50"><p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">المتاجر النشطة</p><p className="text-lg font-black tabular-nums text-emerald-600">{activeShops}</p></div>
                      <div className="p-3 rounded-xl bg-muted/50"><p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">إجمالي الطلبات</p><p className="text-lg font-black tabular-nums">{totalOrders}</p></div>
                      <div className="p-3 rounded-xl bg-muted/50"><p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">العملاء الفريدين</p><p className="text-lg font-black tabular-nums">{uniqueCustomers.length}</p></div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><p className="text-sm">المسؤول الحالي</p></div>
                      <span className="text-sm font-medium">{adminName}</span>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="w-full gap-2 text-rose-500 mt-2 rounded-full hover:opacity-90"><LogOut className="h-4 w-4" />تسجيل الخروج</Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="mt-auto border-t py-4 text-center text-xs text-muted-foreground dark:bg-[#0a0a0a] dark:border-white/[0.06] dark:text-[#747474]">© {new Date().getFullYear()} طيف — منصة إدارة المطابع</footer>
      </div>

      <InlineCreateShop open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleShopCreated} />
      <AdminShopManagement open={!!editTarget} onClose={() => setEditTarget(null)} shop={editTarget} onSaved={handleShopSaved} />
      <InlineShareShop open={!!shareTarget} onClose={() => setShareTarget(null)} shop={shareTarget} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المتجر &quot;{deleteTarget?.name}&quot;؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف المتجر وجميع طلباته وإعداداته نهائياً. هذا الإجراء لا يمكن التراجع عنه.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="rounded-full">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShop} disabled={deleting} className="rounded-full font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:opacity-90">
              {deleting ? 'جارٍ الحذف...' : 'حذف المتجر'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
