#!/usr/bin/env python3
"""R79 Features: Activity Feed, Status Distribution Bar, Shop Performance Rings, Quick Duplicate"""
import sys

PAGE_FILE = '/home/z/my-project/src/app/page.tsx'

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

content = read_file(PAGE_FILE)

# 1. Add Activity icon to lucide imports
old_icons = 'StickyNote, UserCircle, BarChart2, Hash, Clock4, Send, Volume2, VolumeX, Tag, Timer, ClipboardList, FileBarChart, MoreHorizontal, Crown, CircleDot,'
new_icons = 'StickyNote, UserCircle, BarChart2, Hash, Clock4, Send, Volume2, VolumeX, Tag, Timer, ClipboardList, FileBarChart, MoreHorizontal, Crown, CircleDot, Target, Repeat, PieChart as PieChartIcon,'
content = content.replace(old_icons, new_icons)

# 2. Add GlobalOrder type augmentation for statusHistory
# Find the import of GlobalOrder and add a type note

# 3. Read template files
activity_feed = read_file('/home/z/my-project/scripts/r79-activity-feed.txt').strip()
status_bar = read_file('/home/z/my-project/scripts/r79-status-bar.txt').strip()
shop_rings = read_file('/home/z/my-project/scripts/r79-shop-rings.txt').strip()

# 4. Add ActivityFeedTimeline component after QuickActionsMenu function
# Find the end of QuickActionsMenu function (the closing of the component)
qam_end_marker = '/* Customer Quick Profile Dialog */'
if 'ActivityFeedTimeline' not in content:
    # Insert before the Customer Quick Profile Dialog comment
    content = content.replace(
        qam_end_marker,
        activity_feed + '\n\n        ' + qam_end_marker
    )

# 5. Add Status Distribution Bar after the Revenue Timeline Widget in Orders tab
# Find the right insertion point - after the revenue timeline row
rt_marker = '          {/* Quick Stats Bar (R75) */}'
if 'status-dist-bar-container' not in content:
    content = content.replace(
        rt_marker,
        status_bar + '\n\n' + rt_marker
    )

# 6. Add Shop Performance Rings after Status Distribution Bar
if 'shop-rings-widget' not in content:
    content = content.replace(
        rt_marker,
        shop_rings + '\n\n' + rt_marker
    )

# 7. Add Quick Duplicate to QuickActionsMenu actions
# Find the 'نسخ الرقم المرجعي' action in QuickActionsMenu and add duplicate after it
dup_marker = r"{ label: 'نسخ الرقم المرجعي', icon: <Copy className=\"h-3.5 w-3.5\" />, onClick: () => { navigator.clipboard.writeText(order.ref || ''); toast.success('\u062aم النسخ'); setOpen(false); } },"

if 'Quick Duplicate' not in content or 'تكرار الطلب' not in content:
    dup_action = r"{ label: 'نسخ الرقم المرجعي', icon: <Copy className=\"h-3.5 w-3.5\" />, onClick: () => { navigator.clipboard.writeText(order.ref || ''); toast.success('\u062aم النسخ'); setOpen(false); } },"
    new_dup = dup_action + "\n              { label: '\u062a\u0643\u0631\u0627\u0631 \u0627\u0644\u0637\u0644\u0628', icon: <Repeat className=\"h-3.5 w-3.5 text-violet-500\" />, onClick: () => { toast.info('\u062a\u0645 \u0646\u0633\u062e \u0627\u0644\u0637\u0644\u0628 \u0644\u0644\u062d\u0627\u0641\u0638\u0629'); navigator.clipboard.writeText(JSON.stringify({ customerName: order.customer?.name, customerPhone: order.customer?.phone, serviceType: order.serviceType || order.serviceName, shopSlug: order.shopSlug, copies: order.copies, total: order.total, notes: order.notes }, null, 2)); setOpen(false); } },"
    content = content.replace(dup_action, new_dup)

# 8. Add Activity Feed in the overview section (before the existing notes panel)
# We need to add it inside the overview tab area - but that's in admin-overview-tab
# Instead, let's add it in the Orders tab above the table, between status bar and quick stats
qs_marker = '          {/* Quick Stats Bar (R75) */}'
if 'activity-feed-widget' not in content:
    activity_usage = '''          {/* Activity Feed Timeline (R79) */}
          {safeOrders.length > 0 && (
            <ActivityFeedTimeline orders={safeOrders} />
          )}

''' + qs_marker
    content = content.replace(qs_marker, activity_usage)

# 9. Update BUILD_HASH
content = content.replace('"v7.5-"', '"v7.6-"')

write_file(PAGE_FILE, content)
print('R79 features added successfully!')
print(f'Activity Feed: {"OK" if "ActivityFeedTimeline" in content else "MISSING"}')
print(f'Status Distribution Bar: {"OK" if "status-dist-bar-container" in content else "MISSING"}')
print(f'Shop Performance Rings: {"OK" if "shop-rings-widget" in content else "MISSING"}')
print(f'Quick Duplicate: {"OK" if "\u062a\u0643\u0631\u0627\u0631" in content else "MISSING"}')
print(f'Version: {"v7.6" if "v7.6" in content else "v7.5"}')
