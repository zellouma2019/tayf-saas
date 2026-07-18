---
Task ID: 1
Agent: main
Task: Fix password protection and load time for Vercel deployment

Work Log:
- Analyzed root cause of password not working: `ensureDb()` called without `await` in auth routes
- Analyzed root cause of 20s+ load time: `ensureDb()` without await causes Turso deadlocks, global-stats does 8 heavy queries, orders loaded on mount
- Fixed ALL 38 API routes to use `await ensureDb()` before any database operation
- Fixed `/api/super-admin/auth` route: await ensureDb, cleaner response
- Fixed `/api/super-admin/password` route: await ensureDb, added password save verification (reads back after write)
- Rewrote `LoginGate`: retries on API failure (up to 2 times with 1-1.5s delay), handles 500 errors properly
- Rewrote `page.tsx`: orders are NO LONGER loaded on mount (only when orders tab is selected)
- Rewrote `global-stats` API: reduced from 8 DB queries to 4 parallel queries
- Made `ShopManageCard` a dynamic import with ssr:false
- XLSX import changed to inline (not cached globally)
- Build passes: `bun run lint` shows 0 errors, `next build` succeeds
- Pushed to GitHub (commits 33d6222, 2266aeb)

Stage Summary:
- Code is fixed and builds successfully
- CRITICAL ISSUE: Vercel is NOT deploying new code from GitHub
  - Live site still serves old JS chunks (hash: 6703dbfbff093890)
  - /api/admin/global-stats TIMES OUT (60+ seconds) on live site
  - /api/orders also times out
  - The GitHub → Vercel webhook appears to be broken or Vercel project is paused
  - User MUST manually trigger redeploy from Vercel dashboard

Root Causes Identified:
1. PASSWORD BUG: `ensureDb()` without `await` → on Vercel cold start, DB queries execute before tables are ready → API returns 500 → LoginGate shows login form but API might not work properly for password verification
2. LOAD TIME BUG: Two heavy API calls fire on mount, global-stats does 8 sequential/parallel queries, combined with Turso cold start = 60+ second timeout. With `await ensureDb()`, queries should complete in ~1-2 seconds.
3. DEPLOYMENT BUG: Vercel not picking up new commits from GitHub. Needs manual intervention.

User Action Required:
- Go to https://vercel.com/zellouma2019/tayf-saas (or Vercel dashboard)
- Check Deployments tab for recent build errors
- Click "Redeploy" on the latest successful commit
- OR reconnect the GitHub integration if disconnected
