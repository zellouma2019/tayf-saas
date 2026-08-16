---
Task ID: 2
Agent: Main
Task: Integrate new customer v2, add admin settings, cleanup, push to GitHub

Work Log:
- Analyzed new customer version features: 45+ configurable settings across 8 categories
- Identified gap: admin panel missing controls for pricing rules, work hours config, delivery points/zones, tagline, google maps key
- Updated /src/lib/default-settings.ts to include ALL new fields from customer v2 (PricingRules, WorkHoursConfig, DeliveryPoint, DeliveryZone, SAUDI_CITIES)
- Added new settings UI to admin-settings.tsx: pricing rules card, work hours config card, delivery points manager, delivery price & google maps key
- Added tagline field to shop identity section
- Connected customer SettingsProvider to ShopProvider context (shop name, logo, phone, whatsapp, email, address override)
- Fixed autoDeleteDays: cleanup.ts now reads from DB settings instead of hardcoded 10
- Deleted old customer files: file-analyzer.ts, content-classifier.ts, analysis-cache.ts, smart-assistant.ts
- Deleted reference folders: new-customer/, new-customer-v2/, tool-results/
- Fixed standalone-preview.tsx import: @/lib/file-analyzer → @/lib/customer/file-analyzer
- Committed all changes (106 files, +490/-34031 lines)
- Push FAILED: GitHub token is invalid/expired

Stage Summary:
- Admin panel now has full control over new customer version settings
- Customer view merges shop-specific data from ShopProvider
- autoDeleteDays reads from DB settings (was hardcoded)
- All old customer files removed, no overlap
- LOCAL COMMIT READY but PUSH BLOCKED by invalid GitHub token
- User needs to provide a valid GitHub PAT

Known Issues:
- Dual pricing engines (old print-config vs new service-specs) - customer UI uses new, API uses old
- Delivery zones editor not yet in admin UI (complex geo editor needed)
- No service enable/disable toggle in customer version schema

Files Modified:
- src/lib/default-settings.ts (added new types and fields)
- src/components/app/admin-settings.tsx (added pricing, work hours, delivery points UI)
- src/components/customer/customer-page.tsx (shop data integration)
- src/lib/customer/settings-provider.tsx (shopData prop support)
- src/components/customer/standalone-preview.tsx (fixed import path)
- src/lib/cleanup.ts (autoDeleteDays from DB)

Files Deleted:
- src/lib/file-analyzer.ts (old version)
- src/lib/content-classifier.ts (old)
- src/lib/analysis-cache.ts (old)
- src/lib/smart-assistant.ts (old)
- new-customer/ (entire directory)
- new-customer-v2/ (entire directory)
- tool-results/ (temp files)
