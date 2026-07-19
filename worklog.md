# Dark Mode Support - Worklog

## Date: 2025-06-19

## Summary
Added dark mode support (`dark:` Tailwind variants) to 3 files:
1. `src/components/app/merchant-dashboard.tsx`
2. `src/components/app/merchant-order-detail.tsx`
3. `src/components/app/merchant-settings-advanced.tsx`

## Approach
- Applied systematic color mappings per the provided table
- Used `replace_all` for bulk patterns where safe
- Used `MultiEdit` for targeted/context-specific changes
- Used placeholder technique to prevent cross-pattern conflicts (e.g., `hover:text-slate-700` containing `text-slate-700`)
- Manually fixed edge cases (gradient backgrounds, opacity variants, doubled dark variants)

## Color Mappings Applied

| Light Mode | Dark Mode |
|---|---|
| `bg-white` | `dark:bg-slate-800` |
| `bg-slate-50` | `dark:bg-slate-900` |
| `bg-slate-100` | `dark:bg-slate-800` |
| `text-slate-800` | `dark:text-slate-100` |
| `text-slate-700` | `dark:text-slate-200` |
| `text-slate-600` | `dark:text-slate-300` |
| `text-slate-500` | `dark:text-slate-400` |
| `text-slate-400` | `dark:text-slate-500` |
| `border-slate-200` | `dark:border-slate-700` |
| `hover:bg-slate-50` | `dark:hover:bg-slate-700` |
| `hover:bg-slate-100` | `dark:hover:bg-slate-700` |
| `hover:text-slate-700` | `dark:hover:text-slate-200` |
| `hover:text-slate-600` | `dark:hover:text-slate-300` |
| `hover:bg-rose-50` | `dark:hover:bg-rose-900/30` |
| `hover:bg-teal-50` | `dark:hover:bg-teal-900/30` |
| `bg-white/80` | `dark:bg-slate-900/80` |

## Additional Patterns Handled
- Gradient backgrounds (stat cards, page backgrounds, banners)
- Opacity variants (`bg-slate-50/50`, `bg-slate-50/60`, `bg-slate-50/80`, `bg-white/60`)
- Colored accent backgrounds (`bg-emerald-100`, `bg-teal-100`, `bg-slate-300`)
- `border-slate-100` → `dark:border-slate-700`

## Special Cases
- Preserved existing `dark:border-slate-700/60` on dashboard line 1221
- Excluded `bg-white/N` decorative elements on colored/gradient backgrounds
- Handled `group-hover:text-slate-800` without adding incorrect dark prefix
- Fixed race condition in batch Edit operations causing `dark:dark:` doubles

## Verification
- `bun run lint` passes with 0 errors (1 pre-existing unrelated warning)
- No leftover placeholders or malformed `dark:dark:` patterns

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
1. **Vercel Deployment**: Deployment token expired. User needs to trigger manual deploy from Vercel dashboard or re-authenticate
2. **Timezone in Stats API**: `admin/stats/route.ts` uses `new Date()` for "today" which uses server timezone (UTC on Vercel). Off by 1 hour for Algeria (UTC+1)
3. **Home Tab Conditional Rendering**: Uses `{activeTab === "home" && (...)}` which causes re-mount on every tab switch (stats re-fetch). Low priority — could use `hidden` pattern like other tabs