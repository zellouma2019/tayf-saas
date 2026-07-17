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

---

# fix-logo-theme — Work Record

## Summary
Fixed two bugs in the merchant dashboard: (1) Logo upload was limited to 300KB with no compression, now allows 2MB with automatic client-side compression to 512x512 JPEG at 0.8 quality. (2) Theme/template changes and all settings saves were failing silently because the API requires `adminPin` in every PUT request, but child components had no access to the verified PIN.

## Root Cause Analysis

### Bug 1: Logo Upload Size Limit
- Client-side check at line 1458 rejected files > 300KB with toast "حجم الملف كبير جداً"
- No image compression was performed — raw file data was stored as base64 in the DB TEXT field
- This wasted DB storage and made even reasonably-sized images fail

### Bug 2: Theme/Template Change Not Working
- The PUT `/api/shops/[slug]` endpoint requires `adminPin` in the request body for authentication
- When the merchant enters their PIN to unlock the dashboard, it's verified via the same PUT endpoint
- After verification, `pin` state was cleared (`setPin("")`) for security
- Child components (`MerchantShopSettings`, `ThemePickerSection`, `PriceEditorSection`) had no access to the verified PIN
- ALL settings save operations (save settings, upload logo, remove logo, select icon, change theme, save services) were sending PUT requests WITHOUT `adminPin`, causing 403 errors
- The user saw toast errors like "فشل الحفظ" but the local UI state updated optimistically, making it look like only the theme wasn't persisting

## Changes Made — `src/components/app/merchant-dashboard.tsx`

### 1. PIN persistence across child components
- Added `verifiedPinRef = useRef("")` in `MerchantDashboard` to store the verified PIN
- After successful PIN verification, store it: `verifiedPinRef.current = pin` before clearing the input
- Pass `adminPin={verifiedPinRef.current}` as prop to `MerchantShopSettings`

### 2. All PUT requests now include `adminPin`
- `handleSave`: `{ ...form, adminPin }`
- `handleSaveOwnerInfo`: `{ ownerName, ownerPhone, adminPin }`
- `handleLogoUpload`: `{ logoUrl: dataUrl, adminPin }`
- `handleRemoveLogo`: `{ logoUrl: null, adminPin }`
- `handleSelectIcon`: `{ logoIcon: iconName, adminPin }`
- `handleSelectTheme` (ThemePickerSection): `{ themeId, adminPin }`
- `handleSaveServices` (PriceEditorSection): `{ settings: ..., adminPin }`

### 3. Component prop chains updated
- `MerchantShopSettings`: added `adminPin: string` prop
- `ThemePickerSection`: added `adminPin: string` prop
- `PriceEditorSection`: added `adminPin: string` prop

### 4. Logo upload improvements (Bug 1)
- Increased client-side limit from `300 * 1024` (300KB) to `2 * 1024 * 1024` (2MB)
- Added `compressLogo()` function using client-side Canvas API:
  - Parses the uploaded image data URL
  - Resizes to fit within 512×512 maintaining aspect ratio
  - Exports as JPEG with 0.8 quality
  - Returns compressed data URL for storage
- Updated UI text from "الحد الأقصى: 300 ك.ب" to "الحد الأقصى: 2 م.ب (يُضغط تلقائياً)"

## Lint Results
- 0 errors, 1 pre-existing warning (unrelated alt-text in file-analysis-panel.tsx)
---
Task ID: fix-logo-theme
Agent: main

---

# fix-pdf-arabic — Work Record

## Summary
Fixed garbled/corrupted Arabic text (mojibake) in PDF invoices generated by jsPDF. The root cause was that jsPDF's default fonts (Helvetica, etc.) have no Arabic glyphs, and jsPDF does not natively support Arabic character shaping (connected forms) or right-to-left text direction.

## Root Cause Analysis
Three issues combined to produce unreadable Arabic in PDF invoices:
1. **Missing Arabic font**: jsPDF's built-in fonts don't include Arabic glyphs, so Arabic characters render as blank/tofu
2. **No character shaping**: Arabic letters change form based on position (initial, medial, final, isolated). Without shaping, each letter appears in its isolated form, making words unrecognizable
3. **No BiDi support**: jsPDF renders all text left-to-right. Arabic requires visual reordering for correct RTL display

## Solution
Installed `arabic-reshaper` (converts Arabic to proper connected forms) and `bidi-js` (applies Unicode Bidirectional Algorithm for visual reordering). Downloaded the free Amiri Arabic font (Regular + Bold) and embedded it in jsPDF.

## Files Created

### 1. `src/lib/pdf-arabic.ts` (New)
- `initArabicPdf(doc)`: Fetches Amiri font TTF files from `/fonts/`, converts to base64, and registers them with the jsPDF document. Font data is cached after first fetch.
- `ar(text)`: Main text processing function. Detects if text contains Arabic, reshapes characters into connected forms, applies bidi visual reordering. Non-Arabic text passes through unchanged.
- `arFont(bold?)`: Returns the font name ("Amiri" or "Amiri-Bold") for use with `doc.setFont()`.
- `hasArabic(text)`: Utility to detect Arabic/RTL characters.

### 2. `public/fonts/Amiri-Regular.ttf` + `public/fonts/Amiri-Bold.ttf` (New)
- Amiri font v1.000 (GPL license) — a high-quality Naskh-style Arabic font that renders beautifully at small PDF sizes.

## Files Modified

### 3. `src/lib/pdf-invoice.ts`
- Added import of `initArabicPdf`, `ar`, `arFont` from `@/lib/pdf-arabic`
- Added `await initArabicPdf(doc)` after jsPDF instance creation (before any text rendering)
- Replaced all `doc.setFont(undefined, "bold"/"normal")` with `doc.setFont(arFont(true/false))`
- Wrapped all Arabic text strings with `ar()` function — the function safely passes through non-Arabic text (numbers, Latin, references like "A-1234")

### 4. `print-receipt.ts` — NOT modified
- Uses HTML `window.open()` with `dir="rtl"` and browser rendering — Arabic works natively. No changes needed.

## Packages Added
- `arabic-reshaper@1.1.0` — Arabic character shaping
- `bidi-js@1.0.3` — Unicode Bidirectional Algorithm

## Testing Verified
```
Pure Arabic:      "بسم الله الرحمن الرحيم" → correctly shaped & reordered
Mixed Arabic+Num: "المجموع: 150" → "150 :ﻉﻮﻤﺠﻤﻟﺍ" (visual order for jsPDF)
Mixed Arabic+Phone:"هاتف: 0501234567" → phone stays intact
Pure Latin:       "A-1234" → passes through unchanged
Arabic name:      "أحمد محمد" → correctly shaped & reordered
```

## Lint Results
- 0 errors, 1 pre-existing warning (unrelated alt-text in file-analysis-panel.tsx)
---
Task ID: fix-pdf-arabic
Agent: main

---

# fix-features — Work Record

## Summary
Rebuilt the features system from scratch to fix inconsistent/in broken display between admin and merchant dashboards. The previous system had 36 loosely-defined features split by "customer"/"merchant" level, with no clear free/paid distinction. The new system has 25 well-organized features with a clear `isFree` boolean, 7 auto-enabled free features, and 18 paid features.

## Root Cause Analysis
1. **Feature list was bloated**: 36 features, many not actually gated in code (e.g., `couponCode`, `specialOffers`, `voiceInput`, `imageGeneration` were defined but never checked via `hasFeature()`)
2. **No `isFree` field**: Features were marked free by listing their keys in a `FREE_FEATURES` array, but the display code used `CUSTOMER_FEATURES`/`MERCHANT_FEATURES` splits with manual filtering
3. **Admin showed toggles on free features**: Free features had checkboxes that admins could toggle, contradicting the "auto-enabled" concept
4. **Merchant display mixed everything**: Active features were shown in one block without distinguishing free vs. paid

## Changes Made

### 1. `src/lib/shop-features.ts` — Complete Rewrite
**New structure:**
- `FeatureKey` type: 25 feature keys (7 free + 18 paid)
- `FeatureDef` interface: `{ key, label, description, icon, category, isFree, order }`
- `FEATURES` constant: All 25 features with proper `isFree` boolean

**Free features (7, auto-enabled):**
1. `orderCreation` — إنشاء الطلبات (NEW)
2. `orderTracking` — تتبع الطلبات
3. `smartFileAnalysis` — تحليل الملفات
4. `darkMode` — الوضع الداكن
5. `webNotifications` — إشعارات الويب (NEW)
6. `directTrackingLink` — تتبع الطلب بالرابط
7. `rtlSupport` — دعم RTL (NEW)

**Paid features (14 from spec):**
`whatsappNotifications`, `advancedAnalytics`, `receiptPrinting`, `exportExcel`, `orderKanban`, `customerCrm`, `expenseTracking`, `formTemplates`, `orderInvoice`, `aiAssistant`, `customTheme`, `customLogo`, `customDomain` (NEW), `prioritySupport`

**Extra paid features (4, kept for backward compat with hasFeature() calls):**
`bulkActions`, `customPricing`, `serviceToggle`, `merchantFileDownload`

**New exports:**
- `FEATURES` — primary feature list
- `FREE_FEATURES` — auto-enabled feature keys
- `PAID_FEATURES` — paid feature keys
- `TOTAL_FREE_FEATURES`, `TOTAL_PAID_FEATURES` — counts
- `isFeatureFree(key)` — helper
- `isFeatureEnabledStr(featuresJson, featureId, plan)` — string-based helper
- `FEATURE_DEFINITIONS`, `CUSTOMER_FEATURES`, `MERCHANT_FEATURES` — backward-compat aliases

### 2. `src/components/app/admin-shop-card.tsx` — Admin Features Display Fixed
**Before:** Free features had checkboxes (toggleable), split by customer/merchant level
**After:**
- Free features: shown with green `CheckCircle2` icons, no toggles, always-on display
- Paid features: shown with toggleable checkboxes, enable-all/disable-all buttons
- Removed customer/merchant split — organized by free/paid only
- Active paid features show "مفعّل" badge, inactive show "مدفوع" badge

### 3. `src/components/app/merchant-settings-advanced.tsx` — Merchant Features Display Fixed
**Before:** All active features mixed together, locked features not clearly distinguished
**After:**
- Free features section: green cards with "مفعّل مجاناً" badges and `CheckCircle2` icons
- Active paid features section: violet cards with "مفعّل" badges and `Check` icons
- Locked paid features section: gray cards with "مقفل" badges and `Lock` icons + upgrade prompt
- Summary card shows free count + paid active count separately

### 4. `src/components/app/admin-settings-tab.tsx` — No Changes Needed
This file only edits JSON settings (services, deliveryOptions, general) and has no feature-specific UI.

## Backward Compatibility
- All 10 feature keys used in `hasFeature()` calls preserved: `aiAssistant`, `advancedAnalytics`, `exportExcel`, `bulkActions`, `receiptPrinting`, `customLogo`, `customPricing`, `serviceToggle`, `merchantFileDownload`, `darkMode`
- `FeatureKey` type updated but old keys that were only in definitions (not in hasFeature calls) removed cleanly
- `FEATURE_DEFINITIONS`, `CUSTOMER_FEATURES`, `MERCHANT_FEATURES` exported as aliases pointing to `FEATURES`
- `parseFeatures()` and `isFeatureEnabled()` signatures unchanged

## Lint Results
- 0 errors, 1 pre-existing warning (unrelated alt-text in file-analysis-panel.tsx)
---
Task ID: fix-features
Agent: main

---
Task ID: fix-round2-bugs
Agent: main
Task: إصلاح 4 مشاكل حرجة: PDF عربي، شعار، قوالب، ميزات

Work Log:
- حللت 5 لقطات شاشة وحددت المشاكل بدقة
- إصلاح PDF: إضافة خط Amiri العربي + arabic-reshaper + bidi-js
- إصلاح الشعار: زيادة الحد 300KB→2MB + ضغط تلقائي 512x512
- إصلاح القوالب: تمرير adminPin عبر المكونات (7 نقاط نهاية)
- إعادة بناء نظام الميزات: 7 مجانية + 18 مدفوعة مع عرض واضح
- رفعت على GitHub واختبرت على Vercel:
  - ✅ تغيير السمة يعمل (تم التحقق بالتوست)
  - ✅ الميزات تعرض بشكل صحيح (7/25)
  - ✅ حد الشعار 2MB يظهر

Stage Summary:
- 4 مشاكل رئيسية تم إصلاحها
- الموقع يعمل: https://tayf-saas.vercel.app
- كلمة مرور الأدمن: Admin@2025
- متجر تجريبي: /s/matbaa-alnoor (PIN: 1234)
