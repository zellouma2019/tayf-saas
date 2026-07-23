# سجل العمل - Tayf SaaS Platform

---
Task ID: 1
Agent: Main Agent
Task: استبدال النسخة الحالية بالنسخة الجديدة + إعادة تطبيق إصلاحات 504 + الرفع على GitHub

## الوضع الحالي
- ✅ تم استبدال المشروع بالنسخة الجديدة (116 ملف تغيّر)
- ✅ تم إعادة تطبيق جميع إصلاحات 504 GATEWAY_TIMEOUT
- ✅ تم الرفع على GitHub (commits ba7d50a, ff52e27)

---
Task ID: 2
Agent: Main Agent
Task: إصلاح مشكلة تسجيل الدخول 500 + النظرة العامة لا تظهر + اختبار شامل

## الوضع الحالي
- ✅ تسجيل الدخول يعمل بكلمة المرور Admin@2025
- ✅ لوحة التحكم الرئيسية تعرض النظرة العامة (12 طلب، 1,701 د.ج إيرادات)
- ✅ نسخة الزبون تعمل (5 خطوات طلب + فاتورة PDF)
- ✅ الطلب الجديد يظهر في لوحة الإدارة

## الإصلاحات المُطبقة

### 1. مشكلة تسجيل الدخول 500 (السبب الجذري)
عمود `platformSettings` في جدول `SuperAdmin` غير موجود في قاعدة بيانات Turso الحية.
Prisma كان يولد `SELECT *` يشمل هذا العمود → فشل الاستعلام.

**الحل:**
- `src/lib/db-migrations.ts`: إعادة كتابة كاملة مع دوال مساعدة `getSuperAdmin()`, `createSuperAdmin()`, `updateSuperAdmin()` تستخدم raw SQL كـ fallback
- `src/lib/db.ts`: تشغيل الميجريشن تلقائياً عبر `ensureDb()` عند أول وصول للـ DB
- جميع مسارات SuperAdmin تستخدم الدوال المساعدة الآن

### 2. مشكلة النظرة العامة لا تظهر
**السبب:** عمود `customCurrency` في جدول `Shop` و `lastOrderAt` في جدول `Customer` مفقودين من DB الحية.
+ `global-stats` API لا يُرجع `recentOrders` المطلوب من المكون.

**الحل:**
- `src/lib/db-migrations.ts`: إضافة ALTER TABLE لـ customCurrency و lastOrderAt
- `src/app/api/setup/route.ts`: تحديث CREATE TABLE + إضافة الميجريشنات
- `src/app/api/admin/global-stats/route.ts`: إضافة استعلام recentOrders موازي

### 3. الملفات المُعدلة
| الملف | التغيير |
|--------|---------|
| `src/lib/db.ts` | تشغيل الميجريشن تلقائياً في ensureDb() |
| `src/lib/db-migrations.ts` | إعادة كتابة مع دوال مساعدة آمنة + ميجريشن Shop/Customer |
| `src/app/api/super-admin/auth/route.ts` | raw SQL fallback + select محدود |
| `src/app/api/super-admin/verify/route.ts` | استخدام getSuperAdmin |
| `src/app/api/super-admin/password/route.ts` | استخدام getSuperAdmin/createSuperAdmin/updateSuperAdmin |
| `src/app/api/super-admin/platform-settings/route.ts` | استخدام الدوال المساعدة |
| `src/app/api/super-admin/team/route.ts` | استخدام الدوال المساعدة |
| `src/app/api/orders/[id]/invoice/route.ts` | raw SQL للـ SuperAdmin query |
| `src/app/api/seed/route.ts` | استخدام getSuperAdmin |
| `src/app/api/setup/route.ts` | تحديث CREATE TABLE + ميجريشنات |
| `src/app/api/admin/global-stats/route.ts` | إضافة ensureDb + recentOrders |

## نتائج الاختبار على البيئة الحية (agent-browser)
| الاختبار | النتيجة |
|---------|----------|
| تسجيل دخول المدير (Admin@2025) | ✅ ناجح |
| لوحة النظرة العامة | ✅ تظهر 12 طلب + 1,701 د.ج |
| توزيع حالات الطلبات | ✅ 9 بانتظار + 2 جاهز |
| المخطط الدائري | ✅ يعمل |
| نسخة الزبون (مطبعة ابو وديع) | ✅ تعرض الخدمات والخطوات |
| اختيار خدمة (طباعة مستند) | ✅ تعرض إعدادات الطباعة |
| إعدادات الطباعة (السعر) | ✅ 50 د.ج تقديري |
| وقت التسليم | ✅ يعرض الأوقات المتاحة |
| معلومات الزبون | ✅ النموذج يعمل |
| مراجعة الطلب | ✅ تعرض كل التفاصيل |
| إنشاء الطلب | ✅ نافذة تأكيد + QR + فاتورة |
| تحميل فاتورة PDF | ✅ فتحت في تبويب جديد |
| الطلب الجديد في الإدارة | ✅ تحديث العدد من 11 إلى 12 |

## Commits المُرفعة
- `7706c6e` - fix: resolve admin login 500 and dashboard overview
- `db241ac` - fix: add missing recentOrders to global-stats API response

---
## أوصيات المرحلة القادمة
1. اختبار لوحة تحكم التاجر بالكامل (تحتاج PIN)
2. اختبار تحكم التاجر في نسخة الزبون (تعديل النصوص/الشعار/الأسعار/الألوان)
3. اختبار سرعة التحميل (الهدف < 2 ثانية)
4. تغيير كلمة المرور الافتراضية فوراً من الإعدادات ← الأمان
---
Task ID: 4
Agent: Dark Mode Fix Agent
Task: Fix dark mode in new-order-wizard.tsx

Work Log:
- Added 41 dark: variant classes across the entire file
- Fixed bg-neutral-900 review header and sidebar header with dark:bg-neutral-100 dark:text-neutral-900
- Fixed text-neutral-900 dark:text-neutral-100 for file name, delivery title, phone display
- Fixed text-neutral-600 dark:text-neutral-400 for delivery estimate text
- Fixed text-neutral-300 dark:text-neutral-600 for header descriptions
- Fixed text-neutral-400 dark:text-neutral-500 for strikethrough pricing
- Fixed 7x bg-white dark:bg-neutral-800 for file chips, thumbnail, analysis chip
- Fixed bg-emerald-50/30 dark:bg-emerald-950/20 for valid phone inputs (2x)
- Fixed bg-emerald-50 dark:bg-emerald-950/30 for page range info box
- Fixed bg-emerald-100 dark:bg-emerald-900/30 for discount badge and delivery icons
- Fixed border-emerald-200 dark:border-emerald-800/40 for info boxes and analysis chip
- Fixed bg-rose-50 dark:bg-rose-950/30 and bg-rose-100 dark:bg-rose-900/30 for urgent delivery
- Fixed text-emerald-700/600 dark:text-emerald-400 across 8 locations
- Fixed text-rose-600 dark:text-rose-400 for delivery surcharge and zap icon
- Fixed shadow-emerald-200 dark:shadow-emerald-900/40 and shadow-violet-300 dark:shadow-violet-800/30
- Fixed hover:bg-muted/30 dark:hover:bg-muted/50 for collapsible sections
- Fixed bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 for phone box

Stage Summary:
- new-order-wizard.tsx now has 41 dark: variant classes providing full dark mode support
- All hardcoded light backgrounds, dark text, and light borders now have appropriate dark alternatives
- Bright status indicators (bg-emerald-500, bg-rose-500 dots) left unchanged as they work in both modes

---
Task ID: 5
Agent: Dark Mode Fix Agent
Task: Fix dark mode in admin-settings.tsx + remove extra bottom spacing

Work Log:
- Added dark: variants to all hardcoded light colors
- Removed extra bottom spacing in settings container

Stage Summary:
- admin-settings.tsx now has full dark mode support
---
Task ID: 6
Agent: Dark Mode Fix Agent
Task: Fix dark mode in upload-step.tsx

Work Log:
- Added 45 dark: variant classes across the entire file (1380 lines)
- Fixed FILE_TYPE_META constant: bg-red-50, bg-emerald-50, bg-gold-50, bg-amber-50 all got dark:bg-*-950/30 variants
- Fixed file type badge borders: border-red-200, border-emerald-200, border-gold-200, border-amber-200 all got dark:border-*-800/40
- Fixed InfoChip border-r-violet-300 -> dark:border-r-violet-500/50
- Fixed SuggestionPill bg-amber-50/text-amber-700/border-amber-200/60 -> dark variants
- Fixed dropzone: bg-gold-50/80, shadow-violet-100, bg-amber-50/30, border-amber-300/70 -> dark variants
- Fixed drag overlay gradient: from-violet-100/40 to-indigo-100/40 -> dark:from-violet-900/20 dark:to-indigo-900/20
- Fixed quick action buttons: bg-amber-50, bg-emerald-50, bg-gold-50 -> dark:bg-*-950/30 or dark:bg-gold-500/10
- Fixed icon text colors: text-amber-600, text-emerald-600 -> dark:text-amber-400, dark:text-emerald-400
- Fixed progress panel: bg-white -> dark:bg-neutral-800, border-amber-200 -> dark:border-amber-800/40
- Fixed phase indicators: bg-emerald-100, bg-amber-100 -> dark:bg-emerald-900/40, dark:bg-amber-900/40
- Fixed phase text: text-amber-700, text-emerald-600 -> dark:text-amber-400, dark:text-emerald-400
- Fixed progress bar: bg-amber-100 -> dark:bg-amber-900/40
- Fixed error state: border-rose-200, bg-rose-50 -> dark:border-rose-800/40, dark:bg-rose-950/30
- Fixed error text: text-rose-700, text-rose-600 -> dark:text-rose-400
- Fixed DPI category badges: bg-emerald-50, bg-amber-50, bg-rose-50 with borders -> all dark variants
- Fixed AI recommendations: bg-amber-50, border-amber-100, text-amber-800, text-amber-600 -> dark variants
- Fixed preview: bg-white -> dark:bg-neutral-800, border-white -> dark:border-neutral-700
- Fixed empty state: border-amber-200/60, bg-amber-50/20, bg-amber-100/60, text-amber-800 -> dark variants
- Fixed hover:border-amber-200 on 3 buttons -> dark:hover:border-amber-500/30
- Fixed focus:border-amber-300 on URL input -> dark:focus:border-amber-500/30
- Fixed gold colors: text-gold-600 -> dark:text-gold-400, border-gold-200 -> dark:border-gold-500/20

Stage Summary:
- upload-step.tsx now has 45 dark: variant classes providing full dark mode support
- All hardcoded light backgrounds, text colors, and borders now have appropriate dark alternatives
---
---
Task ID: 7
Agent: Main Agent
Task: Fix dark mode, responsiveness, spacing + lint + push + verify

Work Log:
- Dark mode: Added 130+ dark: variant classes across 16 component files
  - admin-platform-settings.tsx, admin-analytics.tsx, dashboard.tsx, admin-panel.tsx
  - premium-feature.tsx, order-success.tsx, merchant-dashboard.tsx, merchant-order-detail.tsx
  - floating-assistant.tsx, admin-shop-card.tsx, admin-expenses.tsx, admin-customers.tsx
  - admin-create-shop.tsx, order-history.tsx
- Responsiveness fixes in track-order.tsx:
  - Timeline icons: w-7 h-7 on mobile, w-8 h-8 on desktop (sm: breakpoint)
  - Timeline labels: text-[9px] on mobile, text-[11px] on desktop
  - Timeline connector line: hidden on mobile (hidden sm:block)
  - Card header: stacks vertically on mobile (flex-col sm:flex-row)
  - Card padding: p-3 on mobile, p-5 on desktop
  - Added min-w-0 to prevent overflow in flex children
- Responsiveness fix in order-detail-modal.tsx:
  - Added max-w-[calc(100vw-2rem)] for better mobile fit
- Responsiveness fix in order-details-row.tsx:
  - Changed grid breakpoint from lg to md for expanded order area
  - Changed padding from p-4 md:p-6 for mobile optimization
- Settings bottom spacing: Already fixed in Task 5 (confirmed space-y-5 only, no extra padding)
- Lint: Passed with zero errors
- Pushed: commit 546ee6a to main branch
- Verified on live (tayf-saas.vercel.app):
  - Customer shop page loads correctly in dark mode on mobile (375px)
  - Track order page renders properly in dark mode
  - New order wizard displays correctly in dark mode on desktop
  - Admin login could not be verified (password changed by user)

Stage Summary:
- 18 files changed, 130 insertions, 131 deletions
- Commit: 546ee6a pushed to GitHub and deployed on Vercel
- Dark mode comprehensively fixed across all remaining components
- Mobile responsiveness improved in order tracking area

---
Task ID: 8
Agent: Main Agent
Task: Fix 504 timeout on global-stats + dashboard overview blank

Work Log:
- Diagnosed: global-stats API returning 504 FUNCTION_INVOCATION_TIMEOUT on Vercel
- Root cause: 18 Prisma queries + ensureDb migrations = ~22 DB calls per cold start
- Attempted raw SQL optimization (still 504 - raw SQL with Turso adapter also slow)
- Discovered: Turso/PrismaLibSQL $queryRaw has high overhead vs ORM
- Discovered: Promise.all with multiple queries causes Turso connection contention
- Final fix: 3 queries only (1 aggregate, 1 groupBy, 2 parallel findMany)
- Also: removed ensureDb() from global-stats (migrations not needed for PrintOrder/Shop)
- Also: made ensureDb() accept {runMigrations} option to skip migrations for non-admin routes

Stage Summary:
- global-stats reduced from 22 DB calls to 3
- Dashboard overview should now load within Vercel 10s function timeout
- Commit: f1654c8 pushed, awaiting Vercel deployment
