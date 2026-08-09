---
Task ID: 1-8
Agent: Main Agent
Task: Full analysis and update of tayf-saas project

Work Log:
- Cloned GitHub repo from zellouma2019/tayf-saas
- Analyzed 3 live URLs via agent-browser: admin dashboard, merchant admin, customer view
- Identified 7 active shops, 49 orders, 74,271 DA revenue
- Updated prisma/schema.prisma: Added rating, review, editableUntil to PrintOrder
- Created 5 new components: whatsapp-button, testimonials-section, welcome-hero, loyalty-checker, order-rating
- Created 4 new API routes: orders/[id]/rate, reviews, loyalty/check, loyalty/apply-discount
- Integrated WelcomeHero, TestimonialsSection, LoyaltyChecker into app-shell.tsx
- Added loyalty tab to navigation items
- Pushed commit 2993347 to GitHub main branch
- Sandbox limitation: 162 components + 35K globals.css too heavy for Turbopack in sandbox

Stage Summary:
- All code changes committed and pushed to GitHub
- Vercel auto-deployment will apply changes

---
Task ID: 10
Agent: Main Agent
Task: Complete replacement of customer-facing pages with matbaa-dhaki (7.zip) version

Work Log:
- Cloned both GitHub repos: zellouma2019/matbaa-dhaki (7.zip) and zellouma2019/tayf-saas
- Analyzed all 28 components in matbaa-dhaki, classified as customer-facing vs admin/merchant
- Identified key integration differences: matbaa-dhaki uses props, tayf-saas uses ShopProvider context
- Replaced app-shell.tsx: Adapted to use useShop() instead of AppShellProps, simplified 4-view navigation
- Replaced track-order.tsx: Added shopApi() for multi-tenant /api/track calls
- Replaced repeat-order.tsx: Added shopApi() for multi-tenant /api/orders/by-phone calls
- Replaced order-success.tsx: Direct copy from matbaa-dhaki
- Replaced intro.tsx: Added shopApi() for multi-tenant /api/settings calls
- Replaced theme-toggle.tsx: Direct copy from matbaa-dhaki
- Replaced floating-assistant.tsx: Dynamic WhatsApp from useShop(), shopApi() for AI APIs
- Replaced new-order-wizard.tsx: Added shopApi() for /api/orders and /api/settings, removed /api/orders/upload (doesn't exist), unified to chunked upload only
- Replaced upload-step.tsx: Direct copy (pure presentational component)
- Replaced offer-popup.tsx: Direct copy from matbaa-dhaki
- Replaced premium-feature.tsx: Direct copy from matbaa-dhaki
- Verified Prisma schema already has rating, review, editableUntil fields
- Verified no broken imports across all replaced components
- shop-page.tsx requires no changes (AppShell called without props)

Stage Summary:
- ALL 12 customer-facing components completely replaced with matbaa-dhaki versions
- Multi-tenancy maintained via shopApi() and useShop() context
- File upload unified to chunked upload (removes dependency on non-existent /api/orders/upload)
- Ready to push to GitHub for Vercel deployment
- 5-tier loyalty system: bronze(0)/silver(5,5%)/gold(15,10%)/platinum(30,15%)/diamond(50,20%)
- Customer reviews with star ratings on delivered orders
- Testimonials carousel in shop footer
- Welcome hero for first-time visitors
- WhatsApp floating button already existed in project

---
Task ID: 2
Agent: Main Agent
Task: Fix errors and build admin panel for root page

Work Log:
- Fixed Store View type to include "loyalty" in src/lib/store.ts
- Fixed WelcomeHero component to accept onDismiss prop
- Fixed reviews API response format (added id, serviceEmoji fields)
- Fixed LoyaltyChecker to read totalOrders instead of orderCount from API
- Built complete admin panel at root page (/) with:
  - Inline login gate with SHA-256 password authentication
  - Stats dashboard (orders, revenue, shops, today's orders)
  - Shops management tab (list, create, delete, view, admin links)
  - Orders tab (recent orders across all shops)
  - Settings tab
- Fixed multiple import errors (Dialog from wrong module, missing Lock import)
- Server compiles and returns HTTP 200 in ~7s

Stage Summary:
- Admin panel at / renders with login gate (password: Admin@2025)
- All TypeScript errors in customer page components fixed
- Reviews API now returns correct format for TestimonialsSection
- Loyalty system properly reads order count from API

---
Task ID: 3
Agent: Main Agent
Task: Fix light theme and admin sidebar issues

Work Log:
- Diagnosed two root causes:
  1. ThemeProvider missing from layout.tsx (next-themes was never initialized)
  2. CSS theme structure inverted: :root had dark values, .light had light values, but next-themes uses .dark class
- Created /src/components/theme-provider.tsx wrapping next-themes ThemeProvider with attribute="class", defaultTheme="dark"
- Updated layout.tsx: added ThemeProvider wrapper, changed lang to "ar" and added dir="rtl"
- Swapped globals.css theme structure:
  - :root now has LIGHT theme values (#faf8f2 background, cream/gold palette)
  - .dark now has DARK theme values (#0a0a0b background, dark/gold palette)
  - Changed .light references to .dark (scrollbar, premium-card)
  - :root.dark references remain correct (apply when dark mode active)
- Rebuilt standalone and verified via agent-browser:
  - Root admin (/): ThemeToggle switches between dark (#0a0a0b) and light (#faf8f2)
  - Merchant admin (/s/[slug]?admin=1): Sidebar visible with all sections, theme toggle works
  - Customer view (/s/[slug]): Theme toggle works

Stage Summary:
- Light theme now works across ALL levels (admin, merchant, customer)
- Merchant admin sidebar is present and functional (DashboardSidebar component)
- Sidebar sections: القائمة (الرئيسية/الطلبات/إعدادات), البيانات (العملاء/المصاريف), أدوات (مشاركة/معاينة)
- CSS variables verified: --sidebar dark=#0e0e10, light=#f5f0e5

---
Task ID: 3b
Agent: Main Agent
Task: Fix logo files, restore custom logo, comprehensive rebuild

Work Log:
- Diagnosed missing logo files: code referenced /n.png, /n-sm.png but files didn't exist
- Created logo symlinks: platform-logo.png→n.png, tayf-logo-sm.png→n-sm.png, tayf-logo-sm-dark.png→n-sm-dark.png, brand/tayf-logo-dark.png→n-dark.png, platform-logo.png→brand/n.png, favicon.svg→n.svg
- Updated admin page login gate: replaced 'ط' text character with <img src="/n.png"> actual logo
- Updated admin header: replaced 'ط' text with <img src="/n-sm.png"> actual logo
- Comprehensive rebuild: bun run build succeeded with 0 errors
- Verified via curl: ThemeProvider in HTML, lang=ar dir=rtl, logo files HTTP 200, API returns shops data

Stage Summary:
- Custom Tayf logo now appears in admin login page and header
- All logo file paths (/n.png, /n-sm.png, /brand/n.png, /n.svg) resolve correctly
- Ready for Vercel deployment

---
Task ID: 4
Agent: Agent 4
Task: Redesign customer intro splash screen + add sidebar layout to root admin page

Work Log:
- Redesigned `/src/components/app/intro.tsx` with SHEIN-inspired premium splash screen:
  - Replaced emoji/printer icon with actual `/n.png` logo via next/image
  - Added framer-motion animations: smooth scale+fade logo entrance, staggered text reveals
  - Dark background (#0a0a0b) with subtle radial golden glow behind logo
  - Brand name "طيف" in elegant gold typography (#D4AF37)
  - Tagline "منصة طباعة احترافية" in muted text below
  - Thin 2px golden progress bar at bottom with smooth fill animation
  - Theme-aware: adapts background/text colors via `useTheme()` (dark: #0a0a0b, light: #faf8f2)
  - Smooth fade-out exit animation with subtle scale-up before disappearing
  - Respects API settings (enabled/disabled, duration) via IntroSettings interface
  - Removed spinning ring, scattered dots, and pulsing background blobs for cleaner look
- Redesigned `/src/app/page.tsx` with proper sidebar layout:
  - Imported DashboardSidebar from `@/components/ui/dashboard-sidebar`
  - Created sidebar sections: القائمة (المتاجر, الطلبات, الإعدادات)
  - Sidebar logo uses `/n-sm.png` with brand name text
  - Sidebar footer includes admin name + ThemeToggle button
  - Replaced Tabs component with sidebar navigation (sidebar controls activeTab state)
  - Added mobile hamburger menu button in header (visible on md:hidden)
  - Sidebar is collapsible on desktop via toggle button, drawer on mobile (handled by DashboardSidebar)
  - Kept all existing functionality: login gate, shops CRUD, orders list, settings tab
  - Kept stats cards, search bar, create shop dialog, delete confirmation
  - Header shows active tab title, admin name, refresh button, logout button
  - Layout: `flex` with sidebar on right + main content area (RTL native)

Stage Summary:
- Intro screen now has a premium, minimal SHEIN-style design with smooth framer-motion animations
- Root admin page now has a proper collapsible sidebar matching the merchant dashboard pattern
- All existing API calls, state management, and functionality preserved unchanged
- Both files pass lint (only pre-existing lint warning in page.tsx fetchData effect)
- No new dependencies added (framer-motion, next/image, next-themes already available)

---
Task ID: 1-research
Agent: Explore Agent
Task: Research original admin dashboard features from 7z version and current root admin state

Work Log:
- Read worklog to understand full project context (Tasks 1-8, 10, 2, 3, 3b, 4)
- /tmp/extract-main/tayf-saas-main/ does NOT exist (not extracted)
- Analyzed /tmp/inspect-7z/my-project/ (the 7z/matbaa-dhaki original) as the reference
- Read all admin-related components:
  - admin-panel.tsx (1379 lines) — merchant admin with 6 tabs
  - admin-gate.tsx (127 lines) — PIN code authentication dialog
  - admin-settings.tsx (1728 lines) — 5 sub-tabs of settings
  - admin-analytics.tsx (979 lines) — full analytics with Recharts
  - admin-customers.tsx (555 lines) — customer CRUD with pagination
  - admin-expenses.tsx — expense management with categories
  - admin-shortcuts.tsx — keyboard shortcuts (invisible component)
  - kanban-board.tsx — dnd-kit drag-and-drop kanban
  - app-shell.tsx — 4 views: new, repeat, track, admin
  - dashboard.tsx — forms management dashboard (separate feature)
- Read current /home/z/my-project/src/app/page.tsx (583 lines) — root platform admin
- Read /tmp/inspect-7z/my-project/src/lib/default-settings.ts — AppSettings interface
- Read /tmp/inspect-7z/my-project/src/lib/print-config.ts — service definitions, pricing, status metadata
- Listed all 160+ components in /home/z/my-project/src/components/app/
- Listed all 38 API routes in /tmp/inspect-7z/my-project/src/app/api/

FINDINGS — ORIGINAL MERCHANT ADMIN (7z version, per-shop admin):

### A. Main Tab Navigation (6 tabs via Tabs component):
1. **الطلبات (Orders)** — ListOrdered icon
   - Search bar (order ref, customer name/phone)
   - Advanced filters (collapsible): status pills (5), service type pills (6), date range (from/to)
   - Notification bell with unread badge (polls /api/notifications every 30s)
   - Export to Excel button (POST /api/orders/export → .xlsx blob)
   - Desktop: full table (checkbox, order#, service, customer, phone, details, total, profit, status, date, actions)
   - Mobile: card-based order list with expandable details
   - Batch operations: select all, batch status change (dropdown), batch delete
   - Order detail modal (OrderDetailModal) on click
   - Per-order actions: status change dropdown, clone order, download invoice, download file
   - File preview: image thumbnails, PDF thumbnails, file type badges
   - Customer info display: name, phone, WhatsApp, email, address, delivery method

2. **سبورة الطلبات (Kanban Board)** — Table2 icon
   - @dnd-kit drag-and-drop columns
   - 4 status columns: pending, printing, ready, delivered (+ cancelled)
   - Cards: time-ago, price, customer, service emoji, file preview, priority
   - Drag order between columns to change status

3. **التحليلات (Analytics)** — BarChart3 icon
   - Monthly overview cards (4): revenue, orders count, avg order value, delivery rate — with trend %
   - 6-month revenue & orders BarChart (dual Y-axis, Recharts)
   - 14-day daily revenue AreaChart with gradient fill
   - Service distribution PieChart (donut) with labels
   - Status distribution PieChart (donut) with labels
   - Service revenue comparison horizontal BarChart
   - Top customers leaderboard (🥇🥈🥉 with name, phone, orders, total)
   - Weekly activity heatmap (4 weeks × 7 days, CSS grid, color intensity)

4. **العملاء (Customers)** — Users icon
   - Search by name or phone
   - Stats cards: total customers, total spending, avg per customer
   - Sync from orders button (POST /api/customers?action=sync)
   - Desktop table: name, phone, email, address, orders count, spending, last order, actions
   - Mobile cards with same info
   - Edit dialog: name, email, address, notes (phone is read-only)
   - Delete with AlertDialog confirmation
   - Pagination (20 per page)

5. **المصاريف (Expenses)** — Wallet icon
   - Categories: ورق(📄), حبر(🖤), صيانة(🔧), إيجار(🏠), أخرى(📦)
   - Add expense: category select, amount, description, date
   - Monthly summary: total, by-category breakdown
   - Desktop table with inline edit
   - Delete with confirmation
   - Pagination

6. **الإعدادات (Settings)** — Settings icon (5 sub-tabs):
   a. **الخدمات والأسعار** — Layers icon
      - Accordion per service (6: document, photo, binding, copy, card, poster)
      - Each service: name, emoji, description, isPopular badge, sections with options
      - Options include: multiplier, surcharge, label, emoji, values list
      - Add new service button, delete service with confirmation
   b. **خيارات التسليم** — Truck icon
      - Grid of delivery option cards
      - Each: label, emoji, badge, description, surcharge (DA)
      - Add/delete delivery options
   c. **الإعدادات العامة** — SlidersHorizontal icon
      - Shop identity: shopName, shopLogo (URL or emoji)
      - Discounts: quantityDiscount10(%), quantityDiscount50(%), sidesDiscount(%), minOrder(DA)
      - Contact: whatsappNumber, phoneNumber, email, address, workHours
      - Security: adminCode (PIN), autoDeleteDays, minOrder repeat
   d. **شاشة الإنترو** — Sparkles icon
      - Enable/disable toggle
      - Title, subtitle, emoji/icon, footerText
      - Color pickers: bgColor, accentColor
      - Duration (ms, 2000-10000)
      - Toggles: showProgress, showSpinningRing
      - Live preview panel
   e. **إعادة التعيين** — CircleAlert icon
      - Reset all settings to defaults (with AlertDialog confirmation)
      - Shows what will be reset
      - Reload from server button
      - Unsaved changes warning
   - Floating save bar (dark, sticky bottom, appears when unsaved changes)

### B. Stats Cards (always visible above tabs):
1. إجمالي الطلبات (Total Orders) — Package, blue
2. إجمالي الإيرادات (Total Revenue) — DollarSign, emerald
3. طلبات اليوم (Today's Orders) — TrendingUp, amber
4. قيد الطباعة (In Printing = pending+printing) — Clock, rose
5. صافي الربح (Net Profit = revenue - expenses) — Wallet, green/red dynamic

### C. Keyboard Shortcuts (AdminShortcuts, invisible component):
- Ctrl+K: Focus search input
- Ctrl+R: Refresh all data
- Keys 1-6: Switch to tabs (orders, kanban, analytics, customers, expenses, settings)

### D. Notification System:
- Types: new_order, status_change, stale_order, system
- Polls /api/notifications?since=... every 30 seconds
- Bell icon with red unread count badge
- Dropdown: notification list with emoji, title, body, time
- Click notification → opens related order detail
- "Mark all as read" button
- Max 30 notifications cached

### E. Authentication (AdminGate):
- Dialog modal with PIN input (4-digit, numeric)
- Loads admin code from /api/settings (general.adminCode)
- 3 attempts then 5-second temporary lockout
- Visual: Lock icon, error state, loading state

### F. API Endpoints Supporting Admin:
- /api/admin/stats — AdminStats (totalOrders, totalRevenue, totalExpenses, profit, todayOrders, statusCounts, serviceCounts, recentOrders)
- /api/admin/analytics — Analytics data
- /api/orders — CRUD, list with filters
- /api/orders/export — XLSX export
- /api/orders/[id] — Status change, delete
- /api/orders/[id]/invoice — PDF invoice
- /api/orders/[id]/file — File download
- /api/orders/[id]/thumbnail — PDF thumbnail
- /api/orders/[id]/notes — Admin notes
- /api/orders/[id]/audit — Audit trail
- /api/orders/[id]/preview — File preview
- /api/customers — List, search, sync, create
- /api/customers/[id] — Update, delete
- /api/expenses — List, create (CRUD with categories)
- /api/expenses/[id] — Update, delete
- /api/notifications — Poll for new notifications
- /api/settings — Get/put all settings (services, delivery, general, intro)
- /api/track — Order tracking
- /api/reviews — Customer reviews
- /api/loyalty/check, /api/loyalty/apply-discount — Loyalty system

GAP ANALYSIS — CURRENT ROOT ADMIN vs. WHAT IT SHOULD HAVE:

### Current State (/home/z/my-project/src/app/page.tsx):
- Sidebar: 3 items only (المتاجر, الطلبات, الإعدادات)
- Stats: 4 cards (Total Orders, Revenue, Shops, Today's Orders)
- Shops tab: CRUD (create, delete, view link, admin link) ✓ functional
- Orders tab: Simple read-only list of recent orders across all shops
- Settings tab: Only admin name card + logout button (essentially empty)
- Login: SHA-256 password auth (Admin@2025)

### What Root Admin (Platform Level) SHOULD Have (based on original + platform role):
1. **لوحة التحكم (Dashboard)** — Overview with enhanced platform stats
2. **المتاجر (Shops)** — ✓ exists, needs enrichment (performance metrics per shop)
3. **الطلبات (Orders)** — needs enrichment: filters, batch ops, export, detail modal
4. **العملاء (Customers)** — MISSING: platform-wide customer management
5. **التحليلات (Analytics)** — MISSING: platform-wide analytics with charts
6. **المصاريف (Expenses)** — MISSING: platform-wide expense tracking
7. **الإعدادات (Settings)** — MISSING: needs full implementation
8. **الإشعارات (Notifications)** — MISSING: notification center

### Recommended Sidebar Structure for Root Admin:
- القائمة (Main):
  - الرئيسية (Dashboard/Overview)
  - المتاجر (Shops) [exists]
  - الطلبات (Orders) [exists, needs enrichment]
- البيانات (Data):
  - العملاء (Customers) [MISSING]
  - المصاريف (Expenses) [MISSING]
  - التحليلات (Analytics) [MISSING]
- النظام (System):
  - الإعدادات (Settings) [exists but empty]
  - الإشعارات (Notifications) [MISSING]

Stage Summary:
- Original merchant admin has 6 rich tabs: Orders, Kanban, Analytics, Customers, Expenses, Settings(5 sub-tabs)
- Current root admin has 3 basic sidebar items: Shops, Orders, Settings(minimal)
- Major gaps: Analytics, Customers, Expenses, Notifications all missing from root admin
- Settings tab is essentially empty (just admin name + logout)
- Orders tab lacks: advanced filters, batch ops, export, detail modal, kanban view
- All original components exist in /home/z/my-project/src/components/app/ (admin-panel.tsx, admin-analytics.tsx, etc.) but are designed for per-shop use
- Root admin needs platform-level adaptations of these features
- Many stub/placeholder components already exist (160+ files) that could be leveraged

---
Task ID: 2-explore
Agent: Explore Agent
Task: Comprehensive exploration of existing APIs, merchant dashboard, lib utilities, Prisma schema, and UI components

Work Log:
- Read worklog.md for full project history context
- Analyzed all API routes under src/app/api/ (47+ routes found)
- Read merchant-dashboard.tsx (4178 lines, 8 tabs with full CRUD)
- Read Prisma schema (10 models: Shop, PrintOrder, Setting, SuperAdmin, Expense, Customer, AuditLog, FormTemplate, FileUpload, FileChunk, FormRecord)
- Analyzed 35 lib files (types, utils, configs, auth, turso-lite, features, themes, etc.)
- Inventoried 42 UI components under src/components/ui/
- Inventoried 160+ app components under src/components/app/

FINDINGS:

## 1. ALL API ROUTES (47+ endpoints)

### Core Platform Routes:
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/health` | GET | Health check endpoint |
| `/api/deploy` | POST | Deployment trigger/webhook |
| `/api/setup` | POST | Initial database setup |
| `/api/seed` | POST | Seed database with sample data |
| `/api/route` | GET | API root/discovery |

### Super Admin Routes (Platform-level):
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/super-admin/auth` | POST | Platform admin login (SHA-256 password auth) |
| `/api/super-admin/verify` | POST | Session verification (token+ts) |
| `/api/super-admin/team` | GET/POST/PUT/DELETE | Team members CRUD |
| `/api/super-admin/platform-settings` | GET/PUT | Platform-wide settings (name, logo, maintenance, defaults) |
| `/api/super-admin/password` | PUT | Change admin password |
| `/api/super-admin/upload-logo` | POST | Upload platform logo |

### Admin Routes (Shared merchant/platform):
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/admin/stats` | GET | Stats for specific shop or global (orders, revenue, expenses, status/service counts) |
| `/api/admin/analytics` | GET | Advanced analytics (monthly, daily, heatmap, top customers, service/status distribution) |
| `/api/admin/global-stats` | GET | Platform-wide stats (all shops, all orders, shopStats per-shop) |
| `/api/admin/daily-stats` | GET | Daily stats aggregation |
| `/api/admin/pdf-report` | GET | PDF stats report generation |
| `/api/admin/shops/[slug]` | GET/PUT/DELETE | Single shop management |

### Shop Routes:
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/shops` | GET/POST | List all shops / Create new shop |
| `/api/shops/[slug]` | GET | Get shop by slug (used by ShopProvider) |
| `/api/shops/[slug]/change-pin` | POST | Change shop admin PIN |

### Order Routes:
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/orders` | GET/POST | List orders (with filters) / Create order |
| `/api/orders/by-phone` | GET | Find orders by phone number |
| `/api/orders/export` | POST | Export orders to Excel (XLSX) |
| `/api/orders/bulk` | PUT/DELETE | Bulk status change / bulk delete |
| `/api/orders/bulk-status` | PUT | Bulk status update (alternative) |
| `/api/orders/pending-count` | GET | Count of pending orders (SSE compatible) |
| `/api/orders/report` | GET | Generate order report for date range |
| `/api/orders/upload-chunk` | POST | Upload file chunk (large file support) |
| `/api/orders/[id]` | GET/PUT/DELETE | Get/update/delete single order |
| `/api/orders/[id]/file` | GET | Download order file |
| `/api/orders/[id]/thumbnail` | GET | PDF thumbnail generation |
| `/api/orders/[id]/invoice` | GET | PDF invoice generation |
| `/api/orders/[id]/notes` | POST | Save admin notes on order |
| `/api/orders/[id]/audit` | GET | Order audit trail |
| `/api/orders/[id]/preview` | GET | File preview (image/PDF) |
| `/api/orders/[id]/rate` | POST | Customer rating/review |
| `/api/orders/[id]/verify-print` | POST | Verify print job |

### Customer Routes:
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/customers` | GET/POST | List/search customers / Create customer |
| `/api/customers/[id]` | PUT/DELETE | Update/delete customer |

### Expense Routes:
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/expenses` | GET/POST | List/create expenses |
| `/api/expenses/[id]` | PUT/DELETE | Update/delete expense |

### Notification Routes:
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/notifications` | GET | Poll notifications |
| `/api/notifications/stream` | GET | SSE stream for real-time notifications |

### Settings Routes:
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/settings` | GET/PUT | Get/update shop settings (services, delivery, general, intro) |

### Other Routes:
| Route | Methods | Description |
|-------|---------|-------------|
| `/api/track` | GET | Order tracking by reference |
| `/api/track/cancel` | POST | Cancel tracked order |
| `/api/reviews` | GET | Customer reviews |
| `/api/loyalty/check` | GET | Check loyalty tier |
| `/api/loyalty/apply-discount` | POST | Apply loyalty discount |
| `/api/file-preview` | GET | Generic file preview |
| `/api/convert` | POST | File conversion |
| `/api/templates` | GET/POST | Form templates CRUD |
| `/api/templates/reorder` | POST | Reorder form templates |
| `/api/records` | GET/POST | Form records CRUD |
| `/api/records/[id]` | PUT/DELETE | Update/delete form record |
| `/api/stats` | GET | Form/stats endpoint |
| `/api/stats/overview` | GET | Stats overview |
| `/api/ai/chat` | POST | AI chat |
| `/api/ai/web-search` | POST | AI web search |
| `/api/ai/analyze-file` | POST | AI file analysis |
| `/api/ai/tts` | POST | Text-to-speech |
| `/api/ai/asr` | POST | Speech recognition |
| `/api/ai/generate-image` | POST | AI image generation |
| `/api/uploadthing/core` | - | UploadThing core config |
| `/api/uploadthing` | - | UploadThing route |

## 2. MERCHANT DASHBOARD STRUCTURE (merchant-dashboard.tsx - 4178 lines)

### Tab Navigation (8 tabs via DashboardSidebar):
1. **الرئيسية (home)** — Dashboard overview
   - 5 stats cards: Total Orders, Revenue, Today Orders, In Printing (pending+printing), Net Profit
   - PrintQueueWidget (dynamic import)
   - RevenueGoalWidget (dynamic import)
   - Quick actions toolbar

2. **الطلبات (orders)** — Full order management
   - Search bar + status filter + sort (field/direction)
   - Quick date filter: all/today/week/favorites
   - View mode: table/card toggle
   - SSE real-time pending count with polling fallback
   - Batch operations: select all, bulk status change, bulk delete
   - Order detail modal with file preview
   - Per-order: status change, clone, invoice, file download, print receipt
   - Favorite orders (localStorage), admin notes (saved to API)
   - Export to PDF report (date range picker)

3. **التحليلات (analytics)** — Charts & insights (requires `advancedAnalytics` feature)
   - Recharts integration (AreaChart, BarChart)
   - Data from `/api/admin/analytics`

4. **العملاء (customers)** — Customer management
   - Embedded customer list component

5. **المصاريف (expenses)** — Expense tracking
   - Embedded expense management component

6. **إعدادات المتجر (settings)** — Basic shop settings

7. **إعدادات متقدمة (advancedSettings)** — Advanced settings

8. **أدوات (Tools)**:
   - **مشاركة الرابط (share)** — Share shop link dialog
   - **معاينة المتجر (preview)** — Preview customer view

### Sidebar Sections:
- القائمة (Main): home, orders, settings, advancedSettings
- البيانات (Data): customers, expenses, analytics (conditional)
- أدوات (Tools): share, preview

### Key Features:
- Uses `useShop()` context for multi-tenant data
- PIN authentication gate (4-digit)
- Dynamic imports for heavy components (PrintQueueWidget, RevenueGoalWidget)
- framer-motion animations
- RTL-aware throughout
- Real-time updates via SSE
- Feature gating via `hasFeature()` (e.g. advancedAnalytics)

## 3. LIBRARY FILES (src/lib/ — 35 files)

### Core Infrastructure:
| File | Purpose |
|------|---------|
| `db.ts` | Prisma client with Turso LibSQL adapter + ensureDb() for migrations |
| `turso-lite.ts` | Lightweight Turso HTTP client (bypasses Prisma, 10x faster on Vercel) |
| `db-migrations.ts` | Runtime ALTER TABLE migrations for SuperAdmin table |
| `store.ts` | Zustand store: view navigation, shop context, admin gate state, refresh |
| `shop-context.tsx` | React context: shop data, features, trial days, plan detection |
| `shop-api.ts` | shopApi() — fetch wrapper that auto-appends shopId query param |
| `middleware.ts` | Next.js middleware |

### Types & Schemas:
| File | Purpose |
|------|---------|
| `types.ts` | Form system types: FormField, FormSection, FormSchema, FormTemplateT, FormRecordT, status/priority metadata |
| `admin-types.ts` | Platform admin types: ShopItem, ShopStat, GlobalOrder, GlobalStats, TeamMember |
| `order-types.ts` | Order types: SmartAnalysis, PrintOrderCustomer, PrintOrderDelivery, PrintOrderOptions, PrintOrderPricing, PrintOrderLite |
| `print-config.ts` | Service definitions (7 services), pricing options (color, paper, sides, binding, delivery), STATUS_META, calculatePricing(), generateReference(), analyzeFileSmartly(), formatDA/DateAr |

### Auth & Security:
| File | Purpose |
|------|---------|
| `admin-auth.ts` | Server-side: getAdminCode(), verifyAdminRequest(), requireAdmin() — middleware helper for API routes |
| `admin-utils.ts` | Client-side: isAuthenticated(), verifySession(), markAuthenticated(), clearSession(), SESSION_KEY, getTimeAgo/Short, SERVICE_EMOJI, STATUS_COLORS/LABELS, TAB_TITLES, setFaviconBadge() |

### Business Logic:
| File | Purpose |
|------|---------|
| `default-settings.ts` | DEFAULT_SETTINGS: services, delivery options, general config, intro settings. AppSettings + IntroSettings interfaces |
| `service-specs.ts` | SPEC_LIST — detailed service specifications |
| `shop-features.ts` | 27 feature definitions (7 free + 20 paid), feature gating, plan-based feature resolution |
| `themes.ts` | SHOP_THEMES — 8 color themes for shops |
| `countries.ts` | ARAB_COUNTRIES — country configs (currency, locale) |
| `offers.ts` | applyOfferCode — discount code logic |
| `phone-validation.ts` | Phone number validation |
| `rate-limit.ts` | withRateLimit() — API rate limiting |
| `audit.ts` | Audit logging helpers |
| `order-lookup.ts` | Order lookup utilities |
| `cleanup.ts` | Data cleanup utilities |
| `i18n.ts` | Internationalization strings |
| `utils.ts` | cn() (Tailwind merge), general utilities |

### File & PDF:
| File | Purpose |
|------|---------|
| `file-analyzer.ts` | Smart file analysis (PDF page count, image detection) |
| `file-resolver.ts` | File resolution utilities |
| `uploadthing.ts` | UploadThing configuration |
| `pdf-invoice.ts` | PDF invoice generation |
| `pdf-stats-report.ts` | PDF stats report generation |
| `print-receipt.ts` | Thermal receipt printing |

### UI State:
| File | Purpose |
|------|---------|
| `sound-notifications.ts` | Sound notification helpers |
| `smart-assistant.ts` | AI assistant logic |
| `use-realtime-orders.ts` | Real-time order subscription hook |
| `content-classifier.ts` | Content classification for AI |
| `analysis-cache.ts` | Analysis result caching |
| `option-translations.ts` | Translation mappings for print options |
| `form-templates.ts` | Pre-built form template schemas |

## 4. PRISMA SCHEMA (10 models, SQLite+Turso)

### Models:
1. **Shop** (main entity)
   - id, slug(unique), name, adminPin, phone, whatsapp, email, address
   - logoUrl, logoIcon, primaryColor, themeId(1-8)
   - country(DZ), language(ar), customCurrency
   - settings(JSON), ownerName, ownerPhone
   - isActive, plan(free/paid), features(JSON)
   - trialDays, trialStartsAt, ownerNotes, paymentInfo
   - Relations: orders[], shopSettings[], expenses[], customers[], auditLogs[], formTemplates[], formRecords[]
   - Indexes: slug, isActive

2. **PrintOrder**
   - id, reference(unique), serviceType, serviceName
   - fileName, fileType, fileSize, fileData(base64), smartAnalysis(JSON)
   - options(JSON), customer(JSON), delivery(JSON), pricing(JSON)
   - estimatedHours, status(default:"pending"), pages, copies, total
   - readyAt, deliveredAt, startedPrintingAt, completedPrintingAt
   - cost, tags(JSON[]), adminNotes
   - rating(1-5), review, editableUntil
   - shopId(FK→Shop)
   - Indexes: status, createdAt, shopId

3. **Setting** (key-value per shop)
   - id, key(services/delivery/general), value(JSON)
   - shopId(FK→Shop), unique(shopId, key)

4. **SuperAdmin** (singleton)
   - id, key(unique:"main"), password, name
   - teamMembers(JSON), platformSettings(JSON)

5. **Expense**
   - id, shopId(FK→Shop), category, amount, description, date
   - Indexes: shopId, category, date

6. **Customer**
   - id, shopId(FK→Shop), name, phone(unique per shop), email, address, notes
   - totalOrders, totalSpent, lastOrderAt
   - Indexes: shopId, phone

7. **AuditLog**
   - id, shopId(FK→Shop), orderId, action, field, oldValue, newValue, details, userId
   - Indexes: shopId, orderId, createdAt

8. **FormTemplate**
   - id, shopId(FK→Shop), title, icon, category, fields(JSON), sortOrder, isActive
   - Index: shopId

9. **FileUpload** (chunked upload)
   - id, fileName, fileSize, fileExt, totalChunks, receivedCount, status, assembledBase64
   - Relations: chunks[]

10. **FileChunk**
    - id, uploadId(FK→FileUpload), chunkIndex, data(base64)

11. **FormRecord**
    - id, shopId(FK→Shop), templateId(FK→FormTemplate), title, data(JSON), status, priority
    - Indexes: shopId, status

## 5. UI COMPONENTS (src/components/ui/ — 42 shadcn components)

### Layout & Navigation:
- `dashboard-sidebar.tsx` — Custom collapsible sidebar (RTL, mobile drawer, badge support, glow indicators)
- `sidebar.tsx` — shadcn sidebar
- `sheet.tsx` — Slide-over panel
- `drawer.tsx` — Bottom drawer
- `tabs.tsx` — Tab navigation
- `breadcrumb.tsx` — Breadcrumb navigation
- `menubar.tsx` — Menu bar
- `resizable.tsx` — Resizable panels
- `collapsible.tsx` — Collapsible sections
- `separator.tsx` — Visual separator

### Data Display:
- `card.tsx` — Card container
- `table.tsx` — Data table
- `badge.tsx` — Status badges
- `avatar.tsx` — User avatars
- `skeleton.tsx` — Loading skeletons
- `tooltip.tsx` — Tooltips
- `carousel.tsx` — Image/content carousel
- `animated-counter.tsx` — Animated number counter
- `chart.tsx` — Recharts wrapper (shadcn)
- `scroll-area.tsx` — Custom scrollbar
- `hover-card.tsx` — Hover card
- `aspect-ratio.tsx` — Aspect ratio container

### Form Controls:
- `input.tsx` — Text input
- `textarea.tsx` — Multi-line input
- `select.tsx` — Dropdown select
- `checkbox.tsx` — Checkbox
- `radio-group.tsx` — Radio buttons
- `switch.tsx` — Toggle switch
- `slider.tsx` — Range slider
- `calendar.tsx` — Date picker calendar
- `input-otp.tsx` — OTP/PIN input
- `label.tsx` — Form label
- `form.tsx` — React Hook Form integration
- `pagination.tsx` — Pagination controls

### Feedback & Overlays:
- `dialog.tsx` — Modal dialog
- `alert-dialog.tsx` — Confirmation dialog
- `alert.tsx` — Alert banners
- `popover.tsx` — Popover overlay
- `dropdown-menu.tsx` — Dropdown menu
- `context-menu.tsx` — Right-click menu
- `command.tsx` — Command palette (Cmd+K)
- `toast.tsx` + `toaster.tsx` — Toast notifications
- `sonner.tsx` — Sonner toast integration
- `progress.tsx` — Progress bar

### Actions:
- `button.tsx` — Button component
- `toggle.tsx` + `toggle-group.tsx` — Toggle buttons
- `navigation-menu.tsx` — Navigation menu

## 6. KEY REUSABLE COMPONENTS (src/components/app/ — 160+ files)

### Admin Dashboard Components (already built, per-shop):
- `admin-panel.tsx` — Original merchant admin (1379 lines, 6 tabs)
- `admin-analytics.tsx` — Full analytics with Recharts (979 lines)
- `admin-settings.tsx` — 5 sub-tabs of settings (1728 lines)
- `admin-customers.tsx` — Customer CRUD with pagination (555 lines)
- `admin-expenses.tsx` — Expense management
- `admin-gate.tsx` — PIN code authentication dialog
- `admin-shortcuts.tsx` — Keyboard shortcuts
- `kanban-board.tsx` — Drag-and-drop kanban (@dnd-kit)

### Root Admin Components:
- `merchant-dashboard.tsx` — The NEW merchant dashboard (4178 lines, this is the main admin)
- `admin-login-gate.tsx` — Platform login gate
- `admin-overview-tab.tsx` — Overview/dashboard tab
- `admin-settings-tab.tsx` — Settings tab
- `admin-quick-actions.tsx` — Quick actions panel
- `admin-quick-actions-panel.tsx` — Quick actions panel
- `admin-quick-search.tsx` — Quick search
- `admin-create-shop.tsx` — Shop creation dialog
- `admin-shop-card.tsx` — Shop display card
- `admin-shop-dashboard.tsx` — Shop dashboard view
- `admin-notification-center.tsx` — Notification center
- `admin-notif-settings.tsx` — Notification settings
- `admin-activity-panel.tsx` — Activity feed
- `admin-platform-settings.tsx` — Platform settings
- `admin-security-tab.tsx` — Security settings
- `admin-settings-enhanced.tsx` — Enhanced settings
- `admin-stubs.tsx` — Stub/placeholder components
- `admin-section-boundary.tsx` — Section boundary component
- `admin-quick-order-btn.tsx` — Quick order button
- `admin-order-notes-panel.tsx` — Order notes panel
- `admin-shortcuts-overlay.tsx` — Shortcuts overlay

### Widget Components (reusable):
- `stats-overview.tsx`, `quick-stats-row.tsx`, `quick-stats-overview.tsx`
- `revenue-chart-widget.tsx`, `revenue-trend-mini.tsx`, `revenue-goal-widget.tsx`
- `revenue-forecast-widget.tsx`, `order-revenue-distribution.tsx`
- `shop-performance-card.tsx`, `shop-analytics-card.tsx`, `shop-comparison-widget.tsx`
- `top-customers-widget.tsx`, `customer-stats-widget.tsx`, `customer-reviews-widget.tsx`
- `customer-retention-widget.tsx`, `customer-feedback-chart.tsx`, `customer-loyalty-badge.tsx`
- `top-services-widget.tsx`, `service-popularity-chart.tsx`, `service-status-banner.tsx`
- `orders-heatmap.tsx`, `peak-hours-heatmap.tsx`
- `expense-categories-breakdown.tsx`, `expense-category-breakdown.tsx`, `expense-budget-tracker.tsx`
- `profit-margin-chart.tsx`, `cost-breakdown-widget.tsx`
- `print-queue-widget.tsx`, `print-queue-manager.tsx`, `print-quality-monitor.tsx`
- `activity-feed.tsx`, `live-activity-feed.tsx`, `shop-activity-feed.tsx`
- `notification-center.tsx`, `notification-badge.tsx`, `notification-preferences.tsx`
- `daily-performance-bar.tsx`, `daily-sales-summary.tsx`, `daily-goal-tracker.tsx`
- `monthly-target-progress.tsx`, `weekly-report-chart.tsx`
- `quick-search-widget.tsx`, `advanced-search-modal.tsx`, `command-palette.tsx`
- `quick-actions-toolbar.tsx`, `quick-actions-panel.tsx`
- `batch-status-updater.tsx`, `order-bulk-actions.tsx`
- `loyalty-checker.tsx`, `loyalty-badge.tsx`, `coupon-management-widget.tsx`
- `marketing-campaign-widget.tsx`, `referral-tracker-widget.tsx`, `seasonal-demand-widget.tsx`
- `schedule-calendar-widget.tsx`, `delivery-tracker-map.tsx`, `shipping-tracker-widget.tsx`
- `staff-activity-widget.tsx`, `employee-performance-chart.tsx`, `team-performance-chart.tsx`, `team-workload-widget.tsx`
- `machine-maintenance-widget.tsx`, `production-efficiency-dashboard.tsx`
- `business-hours-widget.tsx`, `live-clock.tsx`
- `smart-data-table.tsx`, `order-details-row.tsx`

### Customer-facing Components:
- `app-shell.tsx`, `shop-page.tsx`, `intro.tsx`, `new-order-wizard.tsx`, `upload-step.tsx`
- `track-order.tsx`, `repeat-order.tsx`, `order-success.tsx`, `track-page-client.tsx`
- `floating-assistant.tsx`, `welcome-hero.tsx`, `testimonials-section.tsx`
- `whatsapp-button.tsx`, `theme-toggle.tsx`, `offer-popup.tsx`, `premium-feature.tsx`

### Utility Components:
- `empty-state.tsx`, `page-skeleton.tsx`, `skeleton-cards.tsx`, `error-boundary.tsx`
- `back-to-top.tsx`, `keyboard-shortcuts-overlay.tsx`, `theme-provider.tsx`
- `order-detail-modal.tsx`, `order-confirm-dialog.tsx`, `order-invoice-card.tsx`
- `order-notes.tsx`, `order-tags.tsx`, `order-summary-card.tsx`, `order-rating.tsx`
- `order-timeline.tsx`, `order-status-timeline.tsx`, `order-progress-bar.tsx`
- `file-upload-preview.tsx`, `file-analysis-panel.tsx`
- `share-dialog.tsx`, `mobile-bottom-nav.tsx`

## INFRASTRUCTURE SUMMARY FOR ADMIN DASHBOARD REUSE:

### Database Access Patterns:
- **turso-lite.ts**: Primary data access layer — all API routes use tursoQuery/tursoExecute (bypasses Prisma, 10x faster)
- **db.ts (Prisma)**: Used only for write operations (create shop, migrations)
- **admin-auth.ts**: requireAdmin() middleware — accepts either x-admin-code header OR shopId query param

### Auth System:
- **Platform admin**: SHA-256 password via `/api/super-admin/auth` → localStorage token+ts → 4hr session
- **Merchant admin**: PIN code per shop via `/api/settings` general.adminCode → state-based unlock
- **Session verify**: `/api/super-admin/verify` with 5-min sessionStorage cache

### State Management:
- **Zustand store** (`store.ts`): View navigation, shopId, admin gate state
- **React Context** (`shop-context.tsx`): Shop data, features, trial, plan
- **shopApi()**: Auto-appends shopId to all API calls

### Feature Gating:
- 27 features defined (7 free + 20 paid)
- `hasFeature()` from ShopContext — supports plan-based feature resolution
- Paid plans unlock all features by default

### Available Data APIs:
- `/api/admin/global-stats` — Platform-wide (all shops stats, per-shop breakdown, recent orders)
- `/api/admin/stats` — Per-shop or global stats (with shopId param)
- `/api/admin/analytics` — Advanced analytics (monthly/daily/heatmap/customers/services)
- `/api/shops` — Shop CRUD
- `/api/orders` — Order CRUD with filters
- `/api/customers` — Customer management
- `/api/expenses` — Expense tracking
- `/api/notifications` — Notification system
- `/api/settings` — Shop settings (services, delivery, general, intro)

### UI Component Library (shadcn/ui + custom):
- Full set of 42 shadcn components available
- Custom `DashboardSidebar` with RTL, collapse, mobile drawer, badges
- Recharts integration for charts
- framer-motion for animations
- sonner for toasts
- @dnd-kit for kanban drag-and-drop

### Current Root Admin Gaps (vs. what merchant admin has):
| Feature | Merchant Dashboard | Root Admin (page.tsx) |
|---------|-------------------|----------------------|
| Sidebar | ✅ 8 tabs, 3 sections | ⚠️ 3 tabs only |
| Stats Cards | ✅ 5 cards | ⚠️ 4 cards (no profit) |
| Orders | ✅ Full CRUD, filters, batch, export | ⚠️ Read-only list |
| Analytics | ✅ Charts, heatmap, top customers | ❌ Missing |
| Customers | ✅ Full CRUD | ❌ Missing |
| Expenses | ✅ Full CRUD | ❌ Missing |
| Settings | ✅ 5 sub-tabs | ⚠️ Empty (name+logout) |
| Kanban | ✅ @dnd-kit | ❌ Missing |
| Notifications | ✅ Bell + polling | ❌ Missing |
| Real-time | ✅ SSE | ❌ Missing |

Stage Summary:
- Project has 47+ API routes, 42 UI components, 160+ app components, 35 lib files, 10 Prisma models
- Merchant dashboard is comprehensive (4178 lines, 8 tabs) — can serve as reference
- Root admin has basic shell but lacks most features
- All necessary infrastructure exists: turso-lite, admin auth, feature gating, sidebar component
- Massive library of pre-built widgets can be reused for root admin dashboard
- Dual DB access: turso-lite (reads, fast) + Prisma (writes, migrations)
- Auth: SHA-256 session for platform admin, PIN per shop for merchant admin
---
Task ID: 5
Agent: Main Agent
Task: Comprehensive admin dashboard rewrite with full settings and missing features

Work Log:
- Analyzed original admin dashboard (3 tabs: Shops, Orders, minimal Settings)
- Compared with merchant dashboard (8 tabs, 4178 lines) and identified missing features
- Created `/api/admin/global-daily-stats` endpoint for platform-wide daily stats (no shopId required)
- Completely rewrote `/src/app/page.tsx` with 7 comprehensive sidebar tabs:
  1. **الرئيسية (Dashboard)**: 4 KPI cards, 7-day mini bar charts, status distribution, top shops, recent activity
  2. **المتاجر (Shops)**: Enhanced shop cards with CRUD, search, status badges, owner info
  3. **الطلبات (Orders)**: Search, status filter (6 statuses), color-coded status bars, order details
  4. **التحليلات (Analytics)**: Monthly KPIs, daily revenue horizontal bar chart, status distribution, top customers
  5. **العملاء (Customers)**: Unique customer list derived from all orders, search, spending totals
  6. **الإعدادات (Settings)**: Full platform settings panel with 5 sub-sections:
     - Platform Info (name, tagline, email, phone, whatsapp, description)
     - General Settings (country, language, currency, trial days, max shops, welcome message)
     - Feature Toggles (6 toggles: whatsapp notifications, order tracking, dark mode, repeat orders, customer login, advanced analytics)
     - Notification Settings (4 toggles: new order sound, status change, daily summary, low balance)
     - Maintenance Mode (toggle + custom message, allow new shops toggle)
  7. **الفريق والأمان (Team & Security)**:
     - Password change form (current + new + confirm)
     - Team member management (add with name/email/role, remove, role badges)
     - System info panel (shops count, active shops, total orders, unique customers)
     - Logout button
- Sidebar: 3 sections (القائمة, البيانات, النظام) with proper icons and badges
- Uses existing APIs: /api/admin/global-stats, /api/admin/global-daily-stats, /api/shops, /api/super-admin/platform-settings, /api/super-admin/team, /api/super-admin/password
- Build succeeded with 0 errors
- API testing confirmed global-daily-stats returns correct data structure
- Logo files confirmed at /n.png, /n-sm.png, /platform-logo.png, /brand/tayf-logo.png
- Theme system verified: ThemeProvider in layout.tsx, CSS has proper :root (light) and .dark (dark) variables

Stage Summary:
- Admin dashboard expanded from 3 minimal tabs to 7 comprehensive tabs
- Settings tab expanded from 2 basic cards to full platform management panel
- All existing functionality preserved (login gate, shops CRUD, orders list)
- New features: analytics, customers, team management, password change, maintenance mode, feature toggles, notification settings
- Verification: Build passes, APIs work, HTML renders correctly. Agent-browser verification blocked by 4GB RAM OOM (Chrome + Node can't coexist in sandbox)

---
Task ID: 1-research
Agent: Explore Agent
Task: Research original admin dashboard features

Work Log:
- Analyzed extracted 7z project (matbaa-dhaki) merchant admin: 6 tabs with full features
- Compared with current root admin: only 3 tabs (shops/orders/minimal settings)
- Identified missing: Dashboard overview, Analytics, Customers, Expenses, Notifications, Full Settings
- Recommended 8-item sidebar structure for root admin

Stage Summary:
- Original merchant dashboard has: Orders (with filters/batch/export), Kanban, Analytics (charts), Customers, Expenses, Settings (5 sub-tabs)
- Root admin was missing most of these features
- Research findings documented for implementation

---
Task ID: 2-explore  
Agent: Explore Agent
Task: Explore existing APIs and infrastructure

Work Log:
- Found 47+ API routes across 9 route groups
- Confirmed Super Admin APIs: auth, session verify, team CRUD, platform settings, password change, logo upload
- Confirmed Admin APIs: stats, analytics, global-stats, daily-stats, PDF report
- Found 42 shadcn/ui components including custom DashboardSidebar
- Found 35+ lib files including turso-lite (10x faster than Prisma), admin-auth, admin-utils
- Prisma schema has 11 models (Shop, PrintOrder, Setting, Expense, Customer, AuditLog, etc.)

Stage Summary:
- Rich API layer already exists for all needed data
- DashboardSidebar component already supports RTL, collapse, mobile drawer, badges
- All infrastructure needed for comprehensive admin dashboard is available
