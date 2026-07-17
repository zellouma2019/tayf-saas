# language-currency-customization — Work Record

## Summary
Added language and currency selection to the merchant's advanced shop settings, along with 6 new customization options for merchants to control the customer-facing shop experience.

## Task 1: Language & Currency Selection

### 1. `src/lib/default-settings.ts`
- Added 6 new fields to `AppSettings.general` interface and `DEFAULT_SETTINGS.general`:
  - `businessName: string` — Override shop name in customer header
  - `tagline: string` — Custom text below shop name
  - `whatsappButtonNumber: string` — Separate WhatsApp number for floating button
  - `enableOrderTracking: boolean` — Toggle order tracking visibility for customers (default: true)
  - `welcomeMessage: string` — Custom welcome banner on customer page
  - `minOrderAmount: number` — Minimum order amount in shop's currency (default: 0)

### 2. `src/components/app/merchant-settings-advanced.tsx`
- Added `adminPin: string` to `MerchantSettingsAdvancedProps` (required for saving country/language via shop PUT)
- Added imports: `Globe`, `Languages`, `DollarSign`, `ToggleLeft`, `Megaphone`, `Tag`, `Hash` from lucide-react
- Added imports: `ARAB_COUNTRIES`, `APP_LANGUAGES`, `getCountry`, `getLanguage`, `formatCurrency` from `@/lib/countries`
- Added state: `selectedCountry`, `selectedLanguage`, `savingShopFields`
- Added `handleSaveCountryLanguage()` — saves country + language via `PUT /api/shops/[slug]` with `adminPin`
- Syncs country/language from shop context on refresh
- New "اللغة والعملة" card in the General tab:
  - **Country dropdown**: All 22 Arab countries with flags, Arabic names, and ISO codes
  - **Language dropdown**: العربية (ar), Français (fr), English (en), Türkçe (tr), Español (es)
  - **Currency display** (read-only): Shows currency symbol, code, country name, and formatted example (1500 in that currency)
  - **Save button**: Only appears when values differ from current shop, calls shop PUT with adminPin
- New "تخصيص إضافي" card in the General tab with 6 fields (see Task 2)
- Updated "أدنى مبلغ للطلب" hint to dynamically show selected country's currency symbol

### 3. `src/components/app/merchant-dashboard.tsx`
- Updated `MerchantSettingsAdvanced` call to pass `adminPin={verifiedPinRef.current}`

## Task 2: More Merchant Customization Options

### New fields added to "إعدادات عامة" tab (in "تخصيص إضافي" card):
1. **اسم الأعمال** — Text input, shows as shop header name if set
2. **شعار نصي مخصص** — Text input, shows below shop name in customer page
3. **رقم الواتساب للزر العائم** — Phone input, separate from main WhatsApp
4. **تفعيل تتبع الطلبات** — Switch toggle (default: on)
5. **رسالة الترحيب** — Textarea, shows as banner on customer page
6. **الحد الأدنى للطلب** — Number input, in shop's local currency

## Customer-Facing Changes

### 4. `src/components/app/app-shell.tsx`
- Added imports: `getCountry` from `@/lib/countries`, `DEFAULT_SETTINGS` + `AppSettings` type from `@/lib/default-settings`
- Parses shop settings to extract `businessName`, `tagline`, `whatsappButtonNumber`, `enableOrderTracking`, `welcomeMessage`
- **Header**: Uses `displayBusinessName` (businessName override or shop name) and `displayTagline` (tagline override or default)
- **Navigation**: Order tracking tab hidden when `enableOrderTracking` is false
- **Footer**: Uses `displayBusinessName` and `whatsappBtnNumber` for WhatsApp link
- **Welcome message**: Shows as a violet banner on the "new order" view if set
- **Copyright**: Uses `displayBusinessName`

### 5. `src/components/app/new-order-wizard.tsx`
- Added imports: `useShop` from `@/lib/shop-context`, `getCountry` from `@/lib/countries`
- Derives `phonePlaceholder` from shop's country (e.g., "+213 XXX XXX XXX" for Algeria)
- Phone input uses dynamic placeholder instead of hardcoded "أدخل رقم هاتفك"

### 6. `src/components/app/floating-assistant.tsx`
- Removed hardcoded `WHATSAPP_NUMBER` constant
- Loads WhatsApp number from settings API on mount (priority: whatsappButtonNumber > shop.whatsapp > settings.whatsappNumber)
- `openWhatsApp()` now uses the loaded number (cleaned of non-digits) instead of hardcoded "2130560000000"

## Lint Results
- 0 errors, 1 pre-existing warning (unrelated alt-text in file-analysis-panel.tsx)
---
Task ID: round3-features-merchant-control
Agent: main
Task: ميزات جديدة + شعار + لغة/عملة + طباعة مباشرة + تخصيص المتجر

Work Log:
- استبدال الشعار بالنسخة الجديدة مع دعم dark/light mode (8 صور)
- إضافة قسم "اللغة والعملة" (22 دولة عربية + 5 لغات)
- إضافة قسم "تخصيص إضافي" (6 خيارات جديدة)
- إضافة ميزة الطباعة المباشرة (مدفوعة) مع تذكرة A4
- تحويل تغيير المظهر إلى ميزة مجانية
- إضافة أكواد الخصم كميزة مدفوعة
- إصلاح isFeatureEnabled لتفعيل الميزات المجانية دائماً
- إصلاح مفتاح القالب (customLogo → themeCustomization)
- اختبار شامل على Vercel: كل شيء يعمل

Stage Summary:
- 8 مجانية + 19 مدفوعة (إجمالي 27 ميزة)
- الشعار يتجاوب مع dark/light
- اللغة والعملة قابلة للتغيير من التاجر
- الموقع: https://tayf-saas.vercel.app
