#!/usr/bin/env python3
"""R76 Features: Customer Insights, Service Tags, Quick Actions Menu"""

PAGE_FILE = "/home/z/my-project/src/app/page.tsx"
LOGIN_GATE = "/home/z/my-project/src/components/app/admin-login-gate.tsx"
ERROR_BOUNDARY = "/home/z/my-project/src/components/app/error-boundary.tsx"

def rf(p):
    with open(p, 'r', encoding='utf-8') as f: return f.read()
def wf(p, c):
    with open(p, 'w', encoding='utf-8') as f: f.write(c)

page = rf(PAGE_FILE)

# STEP 1: Add imports
print("Step 1: Imports...")
page = page.replace(
    'StickyNote, UserCircle, BarChart2, Hash, Clock4, Send, Volume2, VolumeX, Tag, Timer, ClipboardList, FileBarChart,',
    'StickyNote, UserCircle, BarChart2, Hash, Clock4, Send, Volume2, VolumeX, Tag, Timer, ClipboardList, FileBarChart, MoreHorizontal, Crown,',
    1
)

# STEP 2: Add components before DuplicateWarning
print("Step 2: Components...")

# Read component code from separate file
with open('/home/z/my-project/scripts/r76-components.tsx', 'r') as f:
    components = f.read()

page = page.replace('// ===== Duplicate Warning =====', components + '// ===== Duplicate Warning =====')

# STEP 3: Add CustomerInsights widget in overview
print("Step 3: Widget in overview...")
page = page.replace(
    '            {/* Weekly Order Heatmap */}',
    '            {/* Customer Insights Widget */}\n            <CustomerInsightsWidget orders={safeOrders} />\n\n            {/* Weekly Order Heatmap */}'
)

# STEP 4: Add service tag in table
print("Step 4: Service tag in table...")
page = page.replace(
    '<span className="overflow-marquee inline-block max-w-[120px]" title={order.serviceName || order.serviceType || ""}>\n                            {order.serviceName || order.serviceType || "\u2014"}\n                          </span>',
    '<span className="tag-chip tag-chip-blue svc-type-tag">\n                            {SERVICE_EMOJI[order.serviceType as keyof typeof SERVICE_EMOJI] || "\U0001f4c4"}\n                            <span className="overflow-marquee inline-block max-w-[90px]" title={order.serviceName || order.serviceType || ""}>\n                              {order.serviceName || order.serviceType || "\u2014"}\n                            </span>\n                          </span>'
)

# STEP 5: Add QuickActionsMenu in table action column
print("Step 5: QuickActions in table...")
page = page.replace(
    '<button onClick={(e) => { e.stopPropagation(); setQuickViewOrder(order); setSelectedOrder(order); }} className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" title="\u0639\u0631\u0636 \u0633\u0631\u064a\u0639">',
    '<QuickActionsMenu order={order} onStatusChange={changeOrderStatus} onView={(o) => { setQuickViewOrder(o); setSelectedOrder(o); }} onComment={(o) => { setQuickViewOrder(o); setSelectedOrder(o); }} />\n                          <button onClick={(e) => { e.stopPropagation(); setQuickViewOrder(order); setSelectedOrder(order); }} className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" title="\u0639\u0631\u0636 \u0633\u0631\u064a\u0639">'
)

# STEP 6: Version
print("Step 6: Version...")
page = page.replace('const BUILD_HASH = "v7.2-', 'const BUILD_HASH = "v7.3-', 1)
wf(PAGE_FILE, page)
print(f"page.tsx: {len(page.splitlines())} lines")

# STEP 7: Version updates
print("Step 7: Version updates...")
lg = rf(LOGIN_GATE).replace('v7.2', 'v7.3')
wf(LOGIN_GATE, lg)
eb = rf(ERROR_BOUNDARY).replace('v7.2', 'v7.3').replace('7.2', '7.3')
wf(ERROR_BOUNDARY, eb)

print("\n=== R76 page features complete ===")
