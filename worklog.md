---
Task ID: 1
Agent: Main Agent
Task: Comprehensive bug fix for admin/merchant panel - file upload, settings save, shopApi, order sync

Work Log:
- Analyzed 3 uploaded screenshots with VLM to identify visible issues
- VLM identified: file upload 404 error, potential spelling issues (later confirmed as VLM misreadings)
- Read and analyzed src/components/app/admin-panel.tsx (shop toggle, sync)
- Read and analyzed src/app/page.tsx (handleToggleShop, admin page)
- Read and analyzed src/app/api/admin/shops/[slug]/route.ts (shop toggle API)
- Read and analyzed src/lib/shop-api.ts (shopApi helper)
- Read and analyzed src/lib/store.ts (Zustand store)
- Read and analyzed src/lib/shop-context.tsx (ShopProvider)
- Read and analyzed src/app/api/settings/route.ts (settings API)
- Read and analyzed src/lib/admin-auth.ts (requireAdmin)
- Read and analyzed src/components/app/merchant-dashboard.tsx (merchant PIN login)
- Read and analyzed src/app/api/c/orders/route.ts (customer order creation)
- Read and analyzed src/components/customer/standalone-preview.tsx (file upload call)

Critical Bugs Found and Fixed:
1. **File Upload 404**: Customer version POSTs to `/api/c/upload` but no route existed. Created `/api/c/upload/route.ts`.
2. **shopId missing from Zustand store**: `shopApi()` reads `shopId` from store but it wasn't defined. Added `shopId` and `setShopId` to store.
3. **shopId not set when shop loads**: ShopProvider loads shop data but never sets shopId in store. Added `useAppStore.getState().setShopId(d.shop.id)` in fetchShop callback.
4. **shopApi missing x-admin-code header**: Settings PUT requires `x-admin-code` but shopApi didn't send it. Fixed shopApi to auto-include adminCode from store.
5. **Merchant dashboard doesn't set adminCode in store**: When merchant logs in with PIN, adminCode wasn't saved to store. Added `setAdminCodeStore(pin)` call.
6. **Order tracking verified**: Customer version correctly sends shopId when creating orders. Merchant dashboard correctly queries with shopId. Connection exists.
7. **Feature toggles verified**: AdminShopManagement correctly loads, toggles, and saves features via API.
8. **Shop toggle verified**: handleToggleShop correctly calls API. API correctly handles isActive field.

Stage Summary:
- Created: /src/app/api/c/upload/route.ts (file upload endpoint)
- Modified: /src/lib/store.ts (added shopId, setShopId)
- Modified: /src/lib/shop-context.tsx (set shopId in store on load)
- Modified: /src/lib/shop-api.ts (include adminCode header, fix URL construction)
- Modified: /src/components/app/merchant-dashboard.tsx (import store, set adminCode on login)
- Root cause of settings save failure: shopApi missing both shopId and x-admin-code
- Root cause of file upload failure: /api/c/upload route didn't exist
- Root cause of feature toggle "not responding": actually working, but settings save failure made it seem broken
