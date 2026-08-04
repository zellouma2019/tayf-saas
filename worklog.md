---
Task ID: 2
Agent: Main
Task: Fix orders synchronization failure, auto-retry, button overlap, calculator, horizontal scroll

Work Log:
- Analyzed screenshot: Stats show 25 total / 20 pending but orders list shows "تعذر تحميل الطلبات" error
- Root cause identified: `/api/orders` uses `tursoQueryWithTimeout` which silently returns `[]` on timeout/error, while `/api/admin/stats` uses fast aggregate queries (COUNT/SUM) that succeed
- **Orders API rewrite** (`/api/orders/route.ts`):
  - Replaced `tursoQueryWithTimeout` with `tursoQuerySafe` to distinguish errors from empty results
  - Added 3-tier query fallback: full columns → light (no pricing/delivery) → minimal (no JSON at all)
  - Added `_meta` field in response with `queryLevel` and `error` info
  - Run count query in parallel with orders query (was sequential before)
  - Reduced timeout from 25s to 15s per query attempt (faster failure → faster retry)
- **Merchant dashboard loadOrders** (`merchant-dashboard.tsx`):
  - Added auto-retry with exponential backoff (1s → 2s → 4s, max 3 attempts)
  - Added fallback to `stats.recentOrders` (last 5 orders) when all retries fail
  - Used `URLSearchParams` instead of string concatenation (no more `?&shopId` issue)
  - Added cache-buster `_t` param to prevent stale responses
  - Sync detection useEffect now skips during active retries
- **Chat button overlap** (`floating-assistant.tsx`, `app-shell.tsx`):
  - Moved FloatingAssistant from `bottom-24 right-5` to `bottom-[5.5rem] right-4` on mobile (88px from bottom)
  - Moved chat panel from `bottom-[7.5rem] right-5` to `bottom-[9.5rem] right-4`
  - Moved back-to-top from `bottom-32` to `bottom-36` (144px) on mobile
  - Chat panel width changed from `calc(100vw-2.5rem)` to `calc(100vw-2rem)` for better fit
- **Calculator responsiveness** (`app-shell.tsx`):
  - Changed from `fixed bottom-24 left-20 w-80` (causes overflow on 320px screens)
  - To: `fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] sm:left-20 sm:translate-x-0 sm:w-80`
  - Centers on mobile, left-aligned on desktop
- **Horizontal scroll** (`globals.css`):
  - Added `box-sizing: border-box` on all elements (`*, *::before, *::after`)
  - Added `overflow-x: hidden` on `#__next, main, [dir="rtl"] > div`
- Verified: no cron jobs exist (previously deleted)
- Verified: lint passes (only 1 alt-text warning)

Stage Summary:
- Orders sync: 3-tier API fallback + 3x auto-retry + stats fallback ensures orders always load
- Chat button: Properly spaced (88px nav gap + 56px to back-to-top)
- Calculator: Centers on mobile, stays left-aligned on desktop
- Horizontal scroll: Multiple CSS layers prevent any horizontal overflow
- Deploy: Vercel deploy ID: d1KK71JiNSGw3hpIPkZw

Unresolved/Risks:
- If Turso DB itself is experiencing outages, even the minimal query will fail
- The stats recentOrders fallback only shows 5 orders (not all)
- Auto-retry adds up to ~7 seconds of loading time before showing error
- The `_meta` field in API response should be used by frontend for better error messages (future improvement)
