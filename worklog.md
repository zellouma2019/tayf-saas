---
Task ID: 1
Agent: Main Agent
Task: Fix browser tab icon/name, configure Turso DB, expand shop settings

Work Log:
- Analyzed uploaded screenshot confirming Z.ai branding on browser tab
- Added explicit `icons` property to root layout.tsx metadata (favicon.svg, favicon.png, tayf-icon.png)
- Added OpenGraph images and Twitter card images to metadata
- Configured Turso database credentials in .env (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN)
- Verified Turso connection works - 8 shops found in database
- Converted /api/admin/shops/[slug] GET to use turso-lite (more reliable on Vercel)
- Converted /api/admin/shops/[slug] DELETE to use turso-lite
- Added ensureDb() to all Prisma-dependent API routes
- Massively expanded admin-create-shop.tsx: 4-step wizard (Basic Info → Plan & Features → Appearance → Merchant Admin)
- Added 18 feature toggles (up from 10): directPrint, autoReminder, customBranding, multiBranch, couponSystem, deliveryTracking, customerSupport, smartPricing
- Added 6 merchant permissions (up from 3): canChangePin, canManageTeam, canViewReports
- Added language selector (ar/fr/en/tr/es) and custom currency to both create and edit dialogs
- Added logo icon selector (8 icons) to both create and appearance tabs
- Added theme selector and custom color picker to create dialog
- Updated /api/shops POST to accept new fields: features, logoIcon, primaryColor, plan, customCurrency, themeId, language
- Updated admin-shop-management.tsx with expanded features, language, currency, logo icon
- Dev server OOMs locally (4GB constraint) - all changes verified via code review

Stage Summary:
- Browser tab: Added explicit icons metadata with SVG/PNG favicons
- Database: Turso connected and verified (8 shops exist)
- Shop creation: Expanded from basic form to 4-step wizard with 50+ configurable options
- Shop editing: Expanded with 18 features, 6 permissions, language/currency/logo controls
- API: All admin shop endpoints now use turso-lite for reliability
- Pending: Customer cosmetic fixes, E2E testing on live deployment
