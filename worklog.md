# fix-db-init — Work Record

## Summary
Fixed critical database auto-initialization bug where `ensureDb()` was exported but never called, and the `LoginGate` component auto-skipped login because the GET `/api/super-admin/password` handler caught DB errors and returned `isDefault: true`.

## Changes Made

### 1. `src/app/api/super-admin/password/route.ts`
- Added `ensureSchema()` helper that calls `/api/setup` POST when tables don't exist
- Fixed GET handler: instead of returning `{ isDefault: true }` on DB error, it now attempts DB initialization first
- If initialization succeeds, retries the query; if it fails, returns 503 with Arabic error message
- This is the **core bug fix** — prevents LoginGate from auto-skipping

### 2. `src/app/api/shops/[slug]/route.ts`
- Added `ensureSchema()` helper for DB initialization on table-not-found errors
- GET handler now attempts DB init on first failure, retries query after init
- Replaced all `(e as Error).message` with generic Arabic error messages + console.error logging
- All catch blocks now return `{ error: "الخدمة غير متاحة حالياً" }` with 503 status

### 3. Error Messages — All API Routes (30+ catch blocks fixed)
Replaced raw Prisma/internal error messages with user-friendly Arabic messages in:
- `src/app/api/orders/route.ts` (GET + POST)
- `src/app/api/orders/[id]/route.ts` (GET + PUT + DELETE)
- `src/app/api/orders/[id]/file/route.ts`
- `src/app/api/orders/[id]/thumbnail/route.ts`
- `src/app/api/orders/[id]/preview/route.ts`
- `src/app/api/orders/[id]/audit/route.ts`
- `src/app/api/orders/[id]/invoice/route.ts`
- `src/app/api/orders/by-phone/route.ts`
- `src/app/api/orders/export/route.ts`
- `src/app/api/admin/global-stats/route.ts`
- `src/app/api/admin/stats/route.ts`
- `src/app/api/admin/daily-stats/route.ts`
- `src/app/api/admin/analytics/route.ts`
- `src/app/api/settings/route.ts` (GET + PUT + DELETE)
- `src/app/api/super-admin/auth/route.ts`
- `src/app/api/super-admin/password/route.ts`
- `src/app/api/shops/route.ts` (GET + POST)
- `src/app/api/shops/[slug]/change-pin/route.ts`
- `src/app/api/expenses/route.ts` (GET + POST)
- `src/app/api/expenses/[id]/route.ts` (PUT + DELETE)
- `src/app/api/customers/route.ts` (GET + POST)
- `src/app/api/customers/[id]/route.ts` (PUT + DELETE)
- `src/app/api/records/route.ts` (GET + POST)
- `src/app/api/records/[id]/route.ts` (GET + PUT + DELETE)
- `src/app/api/notifications/route.ts`
- `src/app/api/track/route.ts`
- `src/app/api/stats/route.ts`
- `src/app/api/seed/route.ts`
- `src/app/api/templates/route.ts` (GET + POST)

All real errors are preserved via `console.error()` with a route identifier tag.

### 4. `src/middleware.ts` (New File)
- Created Next.js middleware that intercepts `/api/*` routes
- On first API request, checks if DB is initialized via `GET /api/setup`
- If not initialized, calls `POST /api/setup` before letting the request through
- Skips `/api/setup` itself to avoid infinite loops
- Uses module-level `dbInitDone` flag to only attempt once per cold start
- Does not block non-API requests

### 5. `src/app/api/setup/route.ts`
- Added `PRAGMA foreign_keys = ON` at start (important for Turso/libSQL)
- SQL schema verified: all syntax is standard SQL compatible with libSQL
  - `CREATE TABLE IF NOT EXISTS` ✓
  - `ON DELETE CASCADE` ✓ (supported by libSQL)
  - `FOREIGN KEY` constraints ✓
  - `BOOLEAN DEFAULT 1` ✓ (stored as integer in libSQL)
- Added post-creation health check using `db.$queryRaw` to query `sqlite_master`
- Verifies all 9 expected tables exist after creation
- Returns missing tables list if health check fails
- Removed raw error message from 500 response (security)
- Added error counter for partial failures

## Lint Results
- 0 errors, 1 pre-existing warning (unrelated alt-text issue in file-analysis-panel.tsx)
---
Task ID: fix-critical-bugs-vercel
Agent: main
Task: إصلاح المشاكل الحرجة على Vercel (قاعدة البيانات، الشعار، الأخطاء)

Work Log:
- حللت لقطات الشاشة واكتشفت 4 مشاكل رئيسية:
  1. قاعدة البيانات لم تُهيّأ (ensureDb غير مستدعى)
  2. أخطاء Prisma الخام معرّضة للمستخدمين
  3. لوحة التحكم فارغة عند عدم جاهزية DB
  4. الشعار القديم لم يُستبدل
- أنشأت middleware.ts لتهيئة DB تلقائياً
- أصلحت GET /api/super-admin/password ليهيئ DB
- أصلحت GET /api/shops/[slug] ليهيئ DB
- استبدلت رسائل الخطأ الخام بعربية في 30+ مسار API
- حولت الشعار الجديد إلى 4 أحجام (512, 192, 64, 32 px)
- استبدلت الشعار في 6 ملفات مصدرية
- رفعت على GitHub وVercel أعاد النشر تلقائياً
- هيلت DB يدوياً واختبرت الموقع بنجاح:
  - لوحة تحكم المدير: تعمل
  - إنشاء متجر: يعمل
  - صفحة الزبون: تعمل
  - لوحة تحكم التاجر (PIN 1234): تعمل

Stage Summary:
- ✅ قاعدة البيانات مهيأة (9 جداول) على Turso
- ✅ الشعار الجديد في كل الأماكن
- ✅ لا أخطاء خام معرّضة
- ✅ كل الواجهات الثلاث تعمل (مدير، تاجر، زبون)
- متجر تجريبي: https://tayf-saas.vercel.app/s/matbaa-alnoor
- كلمة مرور التاجر: 1234
