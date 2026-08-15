# Task 2: Fix admin-create-shop.tsx — Shop Creation Settings

## Agent: Main

## Changes Made

### 1. `/home/z/my-project/src/lib/countries.ts`
- **Reordered ARAB_COUNTRIES**: Gulf countries (SA, AE, KW, QA, BH, OM) first, then other Arab countries
- **Updated getDefaultCountry()**: Now returns SA (Saudi Arabia) instead of DZ (Algeria)

### 2. `/home/z/my-project/src/components/app/admin-create-shop.tsx` (Complete rewrite)

**A) Country Selector (Problem #1 — Fixed):**
- Full country info shown in Select dropdown: flag emoji, Arabic name, English name, currency code (SAR, AED, etc.), currency symbol (ر.س, د.إ, etc.)
- Gulf countries grouped separately with amber header "🏦 دول الخليج"
- Other countries grouped with "🌍 باقي الدول العربية" header
- Country info card below selector showing: name, direction (RTL/LTR), currency, phone prefix
- Default changed to SA (Saudi Arabia)
- Auto-sets language based on country's defaultLang

**B) Trial Period (Problem #2 — Fixed):**
- Replaced free-text input with RadioGroup buttons
- Options: 7 days, 15 days, 30 days, unlimited (بدون حدود)
- "0" value = unlimited, shown with emerald green color and ♾️ icon
- Warning message when a limited trial is selected

**C) Feature Toggles (Problem #3 — Fixed):**
- **Quick Features (7 items, always visible):**
  - إشعارات واتساب (WhatsApp notifications) — default ON
  - تحليل الملفات بالذكاء الاصطناعي (AI file analysis) — default ON
  - نظام الولاء (Loyalty system) — default OFF
  - الدفع الإلكتروني (Online payment) — default OFF
  - تتبع التوصيل (Delivery tracking) — default ON
  - تقييمات الزبائن (Customer reviews) — default ON
  - قوالب النماذج (Form templates) — default ON
- **Advanced Features (14 items, collapsible):**
  - All previous advanced features preserved in a collapsible section
  - Select all / Deselect all buttons
  - Blue color scheme to differentiate from quick features

**D) API Payload (Problem #4 — Fixed):**
- trialDays: sends `null` for unlimited (was sending undefined)
- All features merged into single JSON object: `{ ...quickFeatures, ...advancedFeatures, ...merchantFeatures }`
- Country code always included

**E) Existing Functionality Preserved:**
- Slug auto-generation from Arabic name
- PIN field
- Owner info section
- Contact info section  
- Language selector
- Theme picker (8 themes)
- Custom color picker
- Logo icon selector
- Custom currency field
- Merchant admin tabs (7 toggles)
- Merchant permissions (6 toggles)
- Summary section in step 4
- Success screen with links
- 4-step stepper navigation
- RTL Arabic layout throughout

### 3. `/home/z/my-project/src/app/api/shops/route.ts`

**D) Shop Folder Auto-Creation (Problem #4 — Fixed):**
- After creating the Shop record, automatically initializes 4 Setting records:
  - `services`: Default services from DEFAULT_SETTINGS
  - `deliveryOptions`: Default delivery options
  - `general`: Pre-filled with shop name, phone, whatsapp, email, address, admin PIN
  - `intro`: Pre-filled with shop name
- Wrapped in try/catch — shop creation won't fail if settings init fails
- Console log for tracking

**Other API fixes:**
- Default country changed from "DZ" to "SA"
- trialDays: properly handles 0/null as unlimited (null in DB)
- Clean slug sanitization

## Lint Status
- No new lint errors from our changes
- All 19 pre-existing errors remain unchanged (set-state-in-effect, no-this-alias)
