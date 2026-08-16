---
Task ID: 1
Agent: Main
Task: Delete old customer view, add new customer version from a2.zip

Work Log:
- Deleted 33 customer-only component files (app-shell, mobile-bottom-nav, mobile-sidebar, etc.)
- Deleted /s/[slug] customer-specific metadata (simplified page.tsx)
- Deleted track page route
- Deleted customer-only APIs (track, notifications, loyalty)
- Restored notification/loyalty APIs used by merchant dashboard
- Cleaned up store.ts (removed customer-specific state, kept shared types)
- Updated shop-page.tsx to remove AppShell customer path
- Extracted a2.zip to /new-customer-v2/ for analysis
- Analyzed new version: 6 app components, 12 lib files, 9 API routes, ~11K lines
- Copied new customer files to isolated namespaces:
  - src/lib/customer/ (8 lib files)
  - src/components/customer/ (5 component files)
  - src/app/api/c/ (9 API routes)
- Fixed ALL import paths (@/lib/customer/..., @/components/customer/...)
- Created customer-page.tsx (original page.tsx WITHOUT admin settings button)
- Updated shop-page.tsx: default=CustomerPage, ?admin=1=MerchantDashboard
- Changed all API paths in customer components to /api/c/ prefix
- Installed missing deps: three, @types/three, pdfjs-dist, mammoth
- Created whatsapp-notifier.ts stub
- Copied star-rating UI component
- Copied PDF worker files to public/
- Both / and /s/[slug] return HTTP 200

Stage Summary:
- Old customer view COMPLETELY removed
- New customer version added as-is with ZERO visual changes
- Admin link (Settings icon + SimpleAdmin) removed from customer footer
- Customer view at /s/[slug] — Merchant at /s/[slug]?admin=1
- Admin panel at / — unchanged
- Fonts: still Cairo only (project uses Cairo+Alexandria, will match later)
