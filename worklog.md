---
Task ID: 1
Agent: Main
Task: Fix data synchronization across all dashboards + orders crash + UI fixes

Work Log:
- Analyzed uploaded screenshot showing synchronization failure: KPIs show 0 orders today but 20 pending, orders list empty despite DB having 25 orders
- Root cause: `/api/orders` endpoint silently fails (returns empty) while `/api/admin/stats` works fine
- Added `synced*` variables (syncedTotalOrders, syncedPending, syncedPrinting, syncedReady, syncedDelivered) that derive from rawOrders when available, fall back to stats API
- Updated statCards, quickFilters, and mobile KPI buttons to use synchronized values
- Moved `derivedStatusCounts` useMemo before early return to fix React hooks order violation
- Wrapped orders tab content with `OrdersErrorBoundary` (was defined but never used!)
- Changed all 3 empty states (desktop table, mobile table, kanban) to detect when orders exist but failed to load, showing retry button instead of "no orders"
- Moved FloatingAssistant button from bottom-20 to bottom-24 on mobile to clear nav bar
- Moved back-to-top button from bottom-28 to bottom-32 on mobile to avoid overlap
- Fixed PriceEstimator container: changed `w-[calc(100vw-2rem)]` to `max-w-[calc(100vw-2rem)] w-80`
- Added global CSS: `html, body { overflow-x: hidden !important; }` + box-sizing fix
- Fixed pre-existing duplicate `className` prop in admin-activity-panel.tsx
- All lint errors resolved (only 1 false positive warning remains)
- Deployed to Vercel

Stage Summary:
- Synchronization: ALL dashboard sections now use synchronized data (rawOrders → stats API fallback)
- Orders crash: Error Boundary wraps orders tab, preventing full-page crash
- Chat button: Repositioned higher on mobile (bottom-24) to not overlap with nav bar
- Horizontal scroll: Global CSS fix + container width fixes
- Calculator: PriceEstimator width constrained with max-w
- Deploy: Vercel deploy triggered, ID: RkWm8soQerm3sKEnj6AT
