'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, DollarSign, Store, TrendingUp,
  Plus, LogOut, RefreshCw,
  User, Search, Shield, Trash2, Eye, Lock,
  Settings, CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ThemeToggle } from '@/components/app/theme-toggle';
import {
  isAuthenticated,
  verifySession,
  clearSession,
  markAuthenticated,
  getTimeAgoShort,
  statusLabelAr,
  STATUS_COLORS,
  robustCopy,
} from '@/lib/admin-utils';
import { formatDA } from '@/lib/print-config';
import { ARAB_COUNTRIES } from '@/lib/countries';
import type { ShopItem } from '@/lib/admin-types';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ===== Inline Login Gate =====
function InlineLoginGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/super-admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        markAuthenticated(data.token, data.ts);
        onUnlock();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="max-w-sm w-full">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">ط</div>
            <div className="text-center">
              <h1 className="text-xl font-bold">لوحة تحكم المنصة</h1>
              <p className="text-sm text-muted-foreground">أدخل كلمة المرور للدخول</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} className="pr-9" dir="ltr" />
            </div>
            {error && <p className="text-destructive text-xs text-center">كلمة المرور غير صحيحة</p>}
            <Button type="submit" className="w-full bg-gradient-to-l from-amber-500 to-amber-600 text-white" disabled={loading}>
              {loading ? 'جاري التحقق...' : 'دخول'}
            </Button>
          </form>
          <div className="flex items-center justify-center gap-2 pt-2">
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Inline Create Shop Dialog =====
function InlineCreateShop({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [pin, setPin] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [country, setCountry] = useState('DZ');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ name: string; slug: string; pin: string } | null>(null);

  function genSlug(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function handleName(v: string) {
    setName(v);
    if (!slug || slug === genSlug(name)) setSlug(genSlug(v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug || !pin) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, adminPin: pin, ownerName, ownerPhone, country }),
      });
      if (res.ok) {
        setCreated({ name, slug, pin });
        onCreated();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'فشل إنشاء المتجر');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
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
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">رابط المتجر:</span>
                  <button onClick={() => robustCopy(`/s/${created.slug}`, 'تم نسخ الرابط', '')} className="font-mono text-xs text-primary hover:underline">/s/{created.slug}</button>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <span className="text-muted-foreground">كلمة المرور:</span>
                  <span className="font-mono text-xs font-bold">{created.pin}</span>
                </div>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">تم</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المتجر *</Label>
              <Input value={name} onChange={(e) => handleName(e.target.value)} placeholder="مثال: مطبعة النور" />
            </div>
            <div className="space-y-2">
              <Label>المعرّف (slug) *</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="matbaa-alnoor" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>كلمة مرور لوحة التحكم (PIN) *</Label>
              <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="1234" maxLength={10} dir="ltr" type="text" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>اسم المالك</Label>
                <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="اختياري" />
              </div>
              <div className="space-y-2">
                <Label>هاتف المالك</Label>
                <Input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="اختياري" dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الدولة</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ARAB_COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">إلغاء</Button>
              <Button type="submit" disabled={!name || !slug || !pin || submitting} className="flex-1 bg-gradient-to-l from-amber-500 to-amber-600 text-white">
                {submitting ? 'جاري الإنشاء...' : 'إنشاء'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ===== Main Admin Page =====
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shops');
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminName, setAdminName] = useState('مدير');
  const [deleteTarget, setDeleteTarget] = useState<ShopItem | null>(null);

  useEffect(() => {
    (async () => {
      if (isAuthenticated()) {
        const { valid, adminName: name } = await verifySession();
        if (valid) {
          setAuthenticated(true);
          if (name) setAdminName(name);
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleUnlock = useCallback(() => { setAuthenticated(true); }, []);

  const fetchData = useCallback(async () => {
    try {
      const [shopsRes, statsRes] = await Promise.all([
        fetch('/api/shops'),
        fetch('/api/admin/global-stats'),
      ]);
      if (shopsRes.ok) {
        const data = await shopsRes.json();
        setShops(data.shops || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setTotalRevenue(data.totalRevenue || 0);
        setTodayOrders(data.todayOrders || 0);
        setRecentOrders(data.recentOrders || []);
      }
    } catch {
      toast.error('فشل تحميل البيانات');
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated, fetchData]);

  const handleShopCreated = useCallback(() => { setCreateOpen(false); fetchData(); toast.success('تم إنشاء المتجر بنجاح'); }, [fetchData]);

  const handleDeleteShop = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/shops/${deleteTarget.slug}`, { method: 'DELETE' });
      if (res.ok) { toast.success('تم حذف المتجر'); fetchData(); }
      else toast.error('فشل حذف المتجر');
    } catch { toast.error('خطأ'); }
    setDeleteTarget(null);
  }, [deleteTarget, fetchData]);

  const handleLogout = useCallback(() => { clearSession(); setAuthenticated(false); setShops([]); setRecentOrders([]); }, []);

  const filteredShops = shops.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = recentOrders.filter((o) =>
    (o.reference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.shopName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.serviceName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOrders = shops.reduce((sum, s) => sum + (s._count?.orders || 0), 0);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl"><Skeleton className="w-48 h-48 rounded-2xl" /></div>;
  }

  if (!authenticated) {
    return <InlineLoginGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-md">ط</div>
            <div>
              <h1 className="text-sm font-bold">طيف إدارة المنصة</h1>
              <p className="text-[10px] text-muted-foreground">مرحباً، {adminName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /><span className="hidden sm:inline">تحديث</span></Button>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-rose-500"><LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">خروج</span></Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'إجمالي الطلبات', value: totalOrders, icon: ShoppingCart, color: 'from-amber-400 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { label: 'الإيرادات', value: formatDA(totalRevenue), icon: DollarSign, color: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
            { label: 'المتاجر', value: shops.length, icon: Store, color: 'from-violet-400 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
            { label: 'طلبات اليوم', value: todayOrders, icon: TrendingUp, color: 'from-sky-400 to-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30' },
          ].map((c, i) => (
            <motion.div key={c.label} {...fadeIn} transition={{ delay: i * 0.08 }}>
              <Card className={`${c.bg} border-0 shadow-sm`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-xs text-muted-foreground mb-1">{c.label}</p><p className="text-xl font-bold tabular-nums">{c.value}</p></div>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-sm`}><c.icon className="h-5 w-5 text-white" /></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8 w-full flex-1">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="shops" className="gap-1.5"><Store className="h-3.5 w-3.5" />المتاجر</TabsTrigger>
              <TabsTrigger value="orders" className="gap-1.5"><ShoppingCart className="h-3.5 w-3.5" />الطلبات</TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-3.5 w-3.5" />الإعدادات</TabsTrigger>
            </TabsList>
            {activeTab === 'shops' && (
              <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-2 bg-gradient-to-l from-amber-500 to-amber-600 text-white">
                <Plus className="h-4 w-4" />إنشاء متجر
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="mb-4 relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9" />
          </div>

          {/* Shops Tab */}
          <TabsContent value="shops">
            {filteredShops.length === 0 ? (
              <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-4 py-16"><Store className="h-12 w-12 text-muted-foreground/30" /><h3 className="font-bold">لا توجد متاجر</h3><p className="text-sm text-muted-foreground">أنشئ أول متجر للبدء</p></CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredShops.map((shop, idx) => (
                  <motion.div key={shop.id} {...fadeIn} transition={{ delay: idx * 0.04 }}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center text-lg">🖨️</div>
                            <div>
                              <h3 className="font-bold text-sm">{shop.name}</h3>
                              <p className="text-[11px] text-muted-foreground font-mono" dir="ltr">{shop.slug}</p>
                            </div>
                          </div>
                          <Badge variant={shop.isActive ? 'default' : 'secondary'} className={shop.isActive ? 'bg-emerald-500 text-white' : ''}>
                            {shop.isActive ? 'نشط' : 'متوقف'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50"><ShoppingCart className="h-3 w-3 text-muted-foreground" /><span>{shop._count?.orders || 0} طلب</span></div>
                          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/50"><CalendarDays className="h-3 w-3 text-muted-foreground" /><span>{getTimeAgoShort(shop.createdAt)}</span></div>
                        </div>
                        {shop.ownerName && <p className="text-xs text-muted-foreground">👤 {shop.ownerName}{shop.phone ? ` · ${shop.phone}` : ''}</p>}
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => window.open(`/s/${shop.slug}`, '_blank')}>
                            <Eye className="h-3 w-3" />عرض
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => window.open(`/s/${shop.slug}?admin=1`, '_blank')}>
                            <Shield className="h-3 w-3" />إدارة
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-xs text-rose-500 hover:text-rose-600" onClick={() => setDeleteTarget(shop)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            {filteredOrders.length === 0 ? (
              <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-3 py-16"><ShoppingCart className="h-12 w-12 text-muted-foreground/30" /><p className="text-muted-foreground">لا توجد طلبات</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order: any) => (
                  <Card key={order.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs">{order.reference}</span>
                        <Badge variant="secondary" className={`${STATUS_COLORS[order.status] || ''} text-white`}>{statusLabelAr(order.status)}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>{order.serviceName}</span>
                        <span className="font-bold">{formatDA(order.total)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>{order.customer?.name || order.customer?.phone || '—'}</span>
                          <a href={`/s/${order.shopSlug}?admin=1`} target="_blank" className="text-amber-600 hover:underline">{order.shopName}</a>
                        </div>
                        <span>{getTimeAgoShort(order.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white"><User className="h-5 w-5" /></div>
                    <div><h3 className="font-bold">المسؤول</h3><p className="text-xs text-muted-foreground">{adminName}</p></div>
                  </div>
                  <p className="text-sm text-muted-foreground">لوحة تحكم المنصة الرئيسية — إدارة المتاجر والطلبات.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white"><Shield className="h-5 w-5" /></div>
                    <div><h3 className="font-bold">الأمان</h3><p className="text-xs text-muted-foreground">إدارة الجلسة</p></div>
                  </div>
                  <Button variant="outline" onClick={handleLogout} className="w-full gap-2"><LogOut className="h-4 w-4" />تسجيل الخروج</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} طيف — منصة إدارة المطابع</footer>

      {/* Create Dialog */}
      <InlineCreateShop open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleShopCreated} />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المتجر &quot;{deleteTarget?.name}&quot;؟</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف المتجر وجميع بياناته نهائياً. هذا الإجراء لا يمكن التراجع عنه.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShop} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
