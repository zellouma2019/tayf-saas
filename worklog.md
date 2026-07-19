# Dark Mode Support - Worklog

## Date: 2025-06-19

## Summary

---
## Date: 2025-07-19 — Critical Bug Fixes & Audit

### Bug Fixes Applied

#### 1. Logo Upload Failure (merchant-dashboard.tsx + logo API route)
- **Root Cause**: `e.target.value = ""` was called BEFORE `FileReader.readAsDataURL()`, causing the File blob to be invalidated in some browsers
- **Fix**: Moved `e.target.value = ""` to the `finally` block (after read completes)
- **API Route Fix**: Replaced fragile regex (`/^data:image\/([\w+]+);base64,(.+)$/`) with `split(",")` approach — the regex was failing for some data URLs because `(.+)$` doesn't handle very long base64 strings well in all environments
- **API Limit**: Increased from 500KB to 1.5MB (frontend already compresses to JPEG at 512x512)

#### 2. Preview Tab Not Working (merchant-dashboard.tsx)
- **Root Cause**: iframe inside `display: none` container doesn't load in some browsers
- **Fix**: Changed from `className={activeTab !== "preview" ? "hidden" : ""}` to conditional rendering `{activeTab === "preview" && (...)}` — iframe now mounts fresh when tab is activated

#### 3. Dark/Light Theme Toggle — Text Disappearing (app-shell.tsx)
- **Root Cause**: Customer view uses inline styles from theme system (always light backgrounds), but child components use Tailwind's `text-foreground`/`text-muted-foreground` which become white in dark mode → invisible text
- **Fix**: Override ALL CSS variables (`--foreground`, `--muted-foreground`, `--background`, `--card`, `--border`, etc.) on the app-shell container to always use light mode values. This protects ALL 27+ child components automatically without modifying each one
- Also replaced `text-foreground`/`bg-muted/60`/`hover:bg-background` in app-shell nav with explicit `text-slate-600`/`bg-slate-100/80`/`hover:bg-slate-50`

#### 4. Missing DB Migration Columns (db.ts) — from audit
- Added `country` (DEFAULT 'DZ') and `language` (DEFAULT 'ar') to `MIGRATION_COLUMNS`

#### 5. Stats Refresh Missing r.ok Check (merchant-dashboard.tsx) — from audit
- Added `if (!r.ok) throw new Error()` before `.json()` parse to prevent corrupting stats state on server errors

#### 6. KanbanBoard Unfiltered Orders (admin-panel.tsx) — from audit
- Changed `orders` prop to `filteredOrders` so search/date filters apply to kanban view

### Files Modified
1. `src/components/app/merchant-dashboard.tsx` — logo upload fix, stats r.ok, preview tab
2. `src/app/api/shops/[slug]/logo/route.ts` — regex → split, limit increase
3. `src/components/app/app-shell.tsx` — CSS variable overrides, explicit nav colors
4. `src/lib/db.ts` — migration columns
5. `src/components/app/admin-panel.tsx` — filtered orders for kanban

### Verification (agent-browser)
- ✅ Customer page loads correctly with all elements visible
- ✅ Dark mode toggle: all text, buttons, navigation, footer remain visible
- ✅ VLM confirms: "All text elements, buttons, navigation items, and the footer are visible with no missing or invisible text/icons"
- ✅ Merchant dashboard: login, settings, preview tab all work
- ✅ Preview tab: iframe renders correctly inside the tab
- ✅ Logo upload: successfully uploaded tayf-logo.png (177KB PNG) without errors
- ✅ No console errors during any operation
- ✅ `bun run lint` passes with 0 errors
- ✅ Pushed to GitHub (commit 72e76af)

### Current Project Status
- App is functional and all reported bugs are fixed
- Vercel deployment token expired (SAML issue) — user needs to manually redeploy or re-authenticate
- Code is pushed to GitHub, Vercel should auto-deploy if configured

### Unresolved Issues / Risks
1. **Timezone in Stats API**: `admin/stats/route.ts` uses `new Date()` for "today" which uses server timezone (UTC on Vercel). Off by 1 hour for Algeria (UTC+1)
2. **Home Tab Conditional Rendering**: Uses `{activeTab === "home" && (...)}` which causes re-mount on every tab switch (stats re-fetch). Low priority — could use `hidden` pattern like other tabs

---
## Date: 2025-07-19 (Session 2) — Robust Logo Upload + Full Audit

### Bug Fixes Applied

#### 1. Logo Upload "failed to read file" — Complete Rewrite (merchant-dashboard.tsx)
- **Root Cause**: FileReader API can fail in certain browser/OS combinations, especially on mobile
- **Fix**: Replaced FileReader with `URL.createObjectURL()` + `Image` + `Canvas` for ALL non-SVG images
  - `compressImageToDataUrl(file)`: Creates blob URL → loads into Image → draws on Canvas → returns dataURL
  - No FileReader needed for the compression path at all
  - `readFileAsDataUrl(file)`: FileReader kept ONLY as fallback for SVG files
  - Added 15-second timeout on both functions
  - Added `onabort` handler for FileReader
  - `e.target.value = ""` stays in `finally` block
  - `accept` attribute updated to explicit MIME types: `image/png,image/jpeg,image/gif,image/webp,image/svg+xml`

#### 2. Dark Mode Logo Invisible on White Header (app-shell.tsx)
- **Root Cause**: `dark:hidden`/`hidden dark:block` pattern showed dark logo variant when system dark mode was active, but customer view header is always white (from theme system)
- **Fix**: Removed dark logo variant entirely from header — always shows light logo since customer view is forced to light mode via CSS variable overrides

#### 3. Missing r.ok Checks Before .json() — 5 Files
- **Files**: admin-security-tab.tsx, new-order-wizard.tsx, records-list.tsx, repeat-order.tsx, admin-panel.tsx
- **Fix**: Added `if (!r.ok)` guards before all `.json()` calls
- **Admin panel stats**: Added shape validation `typeof s.totalOrders === 'number'` to prevent error objects being rendered as stats

#### 4. Missing dark:bg-slate-800 on Merchant Sub-components
- **Files**: merchant-expenses.tsx (6 occurrences), merchant-customers.tsx (6 occurrences)
- **Fix**: Replaced all `bg-white` with `bg-white dark:bg-slate-800`

### Files Modified (commit cde2190)
1. `src/components/app/merchant-dashboard.tsx` — complete logo upload rewrite
2. `src/components/app/app-shell.tsx` — dark logo fix
3. `src/components/app/admin-security-tab.tsx` — r.ok check
4. `src/components/app/new-order-wizard.tsx` — r.ok check
5. `src/components/app/records-list.tsx` — r.ok check
6. `src/components/app/repeat-order.tsx` — r.ok check
7. `src/components/app/admin-panel.tsx` — r.ok check + stats validation
8. `src/components/app/merchant-expenses.tsx` — dark mode bg
9. `src/components/app/merchant-customers.tsx` — dark mode bg

### Verification
- ✅ `bun run lint` — 0 errors (1 pre-existing unrelated warning)
- ✅ Pushed to GitHub (commit cde2190)
- ✅ Vercel auto-deployed — confirmed `createObjectURL` present in deployed JS chunks
- ✅ Customer page loads correctly with all text/icons visible (VLM verified)
- ✅ Footer visible with correct dark background and light text colors

### Audit Findings (additional, not yet fixed)
- **Low**: setTimeout leaks in copy-to-clipboard handlers (4 files) — React 18 tolerant
- **Low**: Chart tooltip low contrast in dark mode (admin-analytics.tsx)
- **Medium**: Offer popup timeout leak in new-order-wizard.tsx — intentional but anti-pattern

---
## Date: 2025-07-19 (Session 3) — Settings Sync + Theme Fix + Preview Fix + Docs

### Bug Fixes Applied

#### 1. Welcome Screen Settings Not Showing for Customers (CRITICAL)
- **Root Cause**: Merchant dashboard saves settings to `Setting` table via `/api/settings` PUT, but customer-facing `app-shell.tsx` reads from `shop.settings` (JSON field on Shop model) — two completely different storage locations
- **Also**: `shopApi()` adds `shopId` to query params, but the PUT handler extracted it from the request body (where it didn't exist) → settings saved with `shopId: null` instead of the actual shop ID
- **Fix**:
  1. `/api/settings` PUT: Extract `shopId` from query params (not body)
  2. After saving to `Setting` table, sync all changes to `Shop.settings` JSON field via `syncSettingsToShop()`
  3. `/api/settings` DELETE: Also clears `Shop.settings`
  4. `MerchantSettingsAdvanced`: Added `onSaved` prop + calls `refreshShop()` after save
  5. `merchant-dashboard.tsx`: Passes `onSaved` to `MerchantSettingsAdvanced` (triggers `previewKey` increment)

#### 2. Dark/Light Theme Toggle — Text Disappearing (PROPER FIX)
- **Previous fix**: Hardcoded all CSS variables to light mode values → broke dark mode entirely
- **New Fix**:
  1. Import `useTheme` from `next-themes` in `app-shell.tsx`
  2. Use `isDark` flag to switch CSS variables between light and dark oklch values
  3. Updated: `--foreground`, `--muted-foreground`, `--background`, `--card`, `--popover`, `--border`, `--input`, `--accent`, `--secondary`, etc.
  4. Replaced hardcoded `text-slate-*` and `bg-slate-*` with semantic `text-foreground`, `text-muted-foreground`, `bg-muted`, `hover:bg-accent` in nav and share button

#### 3. Preview Section Enhancement
- Preview tab was using conditional rendering (correct pattern for iframes)
- Added `onSaved` callback from `MerchantSettingsAdvanced` to increment `previewKey`, forcing iframe reload when settings change

### Documents Created
1. **PROJECT_SUMMARY.md** — Comprehensive project overview (architecture, features, data model, feature flags, supported countries)
2. **SUBSCRIPTION_PLAN.md** — 3-tier subscription plan (Free / Pro 2,500 DZD / Business 5,000 DZD) with implementation roadmap

### Files Modified (commit 02d4700)
1. `src/app/api/settings/route.ts` — syncSettingsToShop, shopId from query, DELETE cleanup
2. `src/components/app/merchant-settings-advanced.tsx` — onSaved prop, refreshShop call
3. `src/components/app/merchant-dashboard.tsx` — pass onSaved to MerchantSettingsAdvanced
4. `src/components/app/app-shell.tsx` — dark mode CSS variables, semantic color classes
5. `PROJECT_SUMMARY.md` — new file
6. `SUBSCRIPTION_PLAN.md` — new file

### Verification
- ✅ `bun run lint` — 0 errors (1 pre-existing unrelated warning)
- ✅ Pushed to GitHub (commit 02d4700)
- ✅ Dev server starts and compiles without errors
- ✅ Customer page loads (200), admin page loads (200)
- ✅ No TypeScript errors

### Unresolved Issues / Risks
1. **Low**: setTimeout leaks in copy-to-clipboard handlers (4 files)
2. **Low**: Chart tooltip low contrast in dark mode (admin-analytics.tsx)
3. **Medium**: Footer uses hardcoded `text-neutral-*` colors (not affected by theme toggle — intentional for always-dark footer)