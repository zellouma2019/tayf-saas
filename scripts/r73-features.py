#!/usr/bin/env python3
"""R73: Add Calendar View, Status Flow Dots, Customer Quick Profile, Sound Toggle in FAB, CSS v6.9"""

import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    page = f.read()

# ===== 1. Bump version =====
page = page.replace('"v6.9-', '"v7.0-')

# ===== 2. Add Volume2 icon import =====
if 'Volume2' not in page:
    page = page.replace(
        '  StickyNote, UserCircle, BarChart2, Hash, Clock4, Send,\n',
        '  StickyNote, UserCircle, BarChart2, Hash, Clock4, Send, Volume2, VolumeX, ChevronLeft, ChevronRight,\n'
    )

# ===== 3. Add calendar state =====
new_states = '''  // Calendar view
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  // Customer quick profile
  const [customerProfile, setCustomerProfile] = useState<GlobalOrder | null>(null);
  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('sound-notifications') !== 'false';
    return true;
  });
'''

if 'calendarMonth' not in page:
    # Insert after showHeatmap state
    page = page.replace(
        '  const [showHeatmap, setShowHeatmap] = useState(false);',
        '  const [showHeatmap, setShowHeatmap] = useState(false);\n' + new_states
    )

# ===== 4. Add OrderCalendarView component =====
calendar_component = '''

// ===== Order Calendar View =====
function OrderCalendarView({ orders, month, year, onPrevMonth, onNextMonth, onDayClick }: {
  orders: GlobalOrder[]; month: number; year: number;
  onPrevMonth: () => void; onNextMonth: () => void;
  onDayClick?: (date: string) => void;
}) {
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const dayNames = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Build day data
  const days: { day: number; dateStr: string; orders: GlobalOrder[]; isToday: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      dateStr,
      orders: orders.filter(o => o.createdAt && o.createdAt.startsWith(dateStr)),
      isToday: dateStr === todayStr,
    });
  }

  const maxOrders = Math.max(...days.map(d => d.orders.length), 1);

  return (
    <div className="calendar-view-container">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrevMonth} className="calendar-nav-btn"><ChevronRight className="h-4 w-4" /></button>
        <h3 className="text-sm font-bold text-foreground calendar-month-title">
          {monthNames[month]} {year}
        </h3>
        <button onClick={onNextMonth} className="calendar-nav-btn"><ChevronLeft className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map(d => (
          <div key={d} className="calendar-day-header">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="calendar-day-cell calendar-day-empty" />
        ))}
        {days.map(({ day, dateStr, orders: dayOrders, isToday }) => (
          <button
            key={dateStr}
            onClick={() => dayOrders.length > 0 && onDayClick?.(dateStr)}
            className={cn(
              "calendar-day-cell",
              isToday && "calendar-day-today",
              dayOrders.length > 0 && "calendar-day-has-orders",
              dayOrders.length >= 5 && "calendar-day-busy"
            )}
            style={dayOrders.length > 0 ? {
              backgroundColor: `rgba(139, 92, 246, ${Math.min(0.08 + (dayOrders.length / maxOrders) * 0.25, 0.35)})`,
              animationDelay: `${day * 8}ms`,
            } : undefined}
          >
            <span className="calendar-day-number">{day}</span>
            {dayOrders.length > 0 && (
              <span className="calendar-day-count">{dayOrders.length}</span>
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground/60">
        <span>{days.reduce((s, d) => s + d.orders.length, 0)} طلب هذا الشهر</span>
        <span>{formatNumber(days.reduce((s, d) => s + d.orders.reduce((a, o) => a + (o.total || 0), 0), 0))} د.ج</span>
      </div>
    </div>
  );
}

// ===== Status Flow Mini Dots =====
const STATUS_FLOW_KEYS = ["pending", "confirmed", "printing", "ready", "delivered"];
function StatusFlowDots({ status }: { status: string }) {
  const currentIdx = STATUS_FLOW_KEYS.indexOf(status);
  return (
    <div className="status-flow-mini">
      {STATUS_FLOW_KEYS.map((key, i) => (
        <span
          key={key}
          className={cn(
            "flow-dot",
            i < currentIdx && "active",
            i === currentIdx && "current"
          )}
          title={STATUS_META[key as keyof typeof STATUS_META]?.label || key}
        />
      ))}
    </div>
  );
}

// ===== Customer Quick Profile =====
function CustomerQuickProfile({ order, allOrders, onClose }: {
  order: GlobalOrder; allOrders: GlobalOrder[];
  onClose: () => void;
}) {
  const custOrders = allOrders.filter(o =>
    (o.customer?.name || "") === (order.customer?.name || "") &&
    (o.customer?.phone || "") === (order.customer?.phone || "")
  );
  const totalSpent = custOrders.reduce((s, o) => s + (o.total || 0), 0);
  const statusCounts: Record<string, number> = {};
  custOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  return (
    <div className="customer-quick-profile" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="cq-avatar">
            <UserCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold">{order.customer?.name || "—"}</p>
            <p className="text-[10px] text-muted-foreground font-mono" dir="ltr">{order.customer?.phone || "—"}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="cq-stat-card">
          <span className="cq-stat-value">{custOrders.length}</span>
          <span className="cq-stat-label">طلب</span>
        </div>
        <div className="cq-stat-card">
          <span className="cq-stat-value cq-stat-gold">{formatNumber(totalSpent)}</span>
          <span className="cq-stat-label">د.ج</span>
        </div>
        <div className="cq-stat-card">
          <span className="cq-stat-value">{statusCounts['delivered'] || 0}</span>
          <span className="cq-stat-label">مُنجز</span>
        </div>
      </div>
      <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin-v2">
        {custOrders.slice(0, 8).map(o => (
          <div key={o.id} className="cq-order-row">
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
              STATUS_META[o.status as keyof typeof STATUS_META]?.color?.replace('text-', 'bg-') || "bg-muted"
            )} />
            <span className="text-[10px] truncate flex-1">{o.serviceName || o.serviceType}</span>
            <span className="text-[10px] font-mono tabular-nums revenue-gold">{formatNumber(o.total)}</span>
            <span className="text-[9px] text-muted-foreground">{formatDA(o.createdAt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

'''

if 'OrderCalendarView' not in page:
    page = page.replace(
        'function getTimeAgoStatic',
        calendar_component + 'function getTimeAgoStatic'
    )

# ===== 5. Add "calendar" to ordersView type =====
page = page.replace(
    'useState<"table" | "kanban" | "cards">("table")',
    'useState<"table" | "kanban" | "cards" | "calendar">("table")'
)

# ===== 6. Add Calendar toggle button after Cards button =====
calendar_btn = '''                <button
                  className={cn("view-toggle-btn", ordersView === "calendar" && "active")}
                  onClick={() => setOrdersView("calendar")}
                  title="عرض تقويم"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  تقويم
                </button>'''

if 'ordersView === "calendar"' not in page:
    # Insert after the Cards button
    page = page.replace(
        '                  بطاقات\n                </button>\n              </div>',
        '                  بطاقات\n                </button>\n' + calendar_btn + '\n              </div>'
    )

# ===== 7. Add Calendar view section after cards view closing =====
calendar_view_jsx = '''            ) : ordersView === "calendar" ? (
            <OrderCalendarView
              orders={safeOrders}
              month={calendarMonth}
              year={calendarYear}
              onPrevMonth={() => {
                if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
                else setCalendarMonth(m => m - 1);
              }}
              onNextMonth={() => {
                if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
                else setCalendarMonth(m => m + 1);
              }}
              onDayClick={(date) => { setDateFilter("custom"); setDateFrom(date); setDateTo(date); setOrdersView("table"); }}
            />
'''

if 'OrderCalendarView\n' not in page:
    # Insert after the cards view closing ")}" before Activity Panel
    page = page.replace(
        '            )}\n            {/* Activity Panel — side column',
        '            )}' + calendar_view_jsx + '            {/* Activity Panel — side column'
    )

# ===== 8. Add StatusFlowDots to table rows =====
# Find the status badge in table rows and add flow dots after it
if 'StatusFlowDots' in page and 'status-flow-dot-cell' not in page:
    # Add flow dots column after the status badge in table header and rows
    # Insert in the table header
    old_th = '''<TableHead className="text-left py-2 px-2">الحالة</TableHead>'''
    new_th = '''<TableHead className="text-left py-2 px-2">الحالة</TableHead>
                          <TableHead className="text-center py-2 px-1 w-28">المسار</TableHead>'''
    page = page.replace(old_th, new_th)
    
    # Insert in table rows - after the status badge
    old_td = '''                          </Badge>
                          {order.customer?.phone && ('''
    new_td = '''                          </Badge>
                          <TableCell className="text-center py-2 px-1 status-flow-dot-cell">
                            <StatusFlowDots status={order.status} />
                          </TableCell>
                          {order.customer?.phone && ('''
    page = page.replace(old_td, new_td)

# ===== 9. Make customer name clickable for quick profile =====
if 'setCustomerProfile' in page and 'cq-trigger' not in page:
    old_cust = '{order.customer?.name || "—"}'
    new_cust = '<button onClick={(e) => { e.stopPropagation(); setCustomerProfile(order); }} className="cq-trigger hover:text-primary transition-colors hover:underline text-right font-medium">{order.customer?.name || "—"}</button>'
    # Only replace the first occurrence in the table view
    page = page.replace(old_cust, new_cust, 1)

# ===== 10. Add Customer Quick Profile Dialog =====
profile_dialog = '''
      {/* Customer Quick Profile Dialog */}
      <Dialog open={!!customerProfile} onOpenChange={() => setCustomerProfile(null)}>
        <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden" dir="rtl">
          <DialogTitle className="sr-only">ملف الزبون</DialogTitle>
          {customerProfile && (
            <div className="p-4">
              <CustomerQuickProfile
                order={customerProfile}
                allOrders={safeOrders}
                onClose={() => setCustomerProfile(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
'''

if 'CustomerQuickProfile' in page and 'Customer Quick Profile Dialog' not in page:
    page = page.replace(
        '      {/* Keyboard shortcuts overlay */}',
        profile_dialog + '      {/* Keyboard shortcuts overlay */}'
    )

# ===== 11. Add Sound Toggle to FAB =====
sound_toggle = '''            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                localStorage.setItem('sound-notifications', String(next));
                toast.success(next ? 'الإشعارات الصوتية مفعّلة' : 'الإشعارات الصوتية مُعطّلة');
                setFabOpen(false);
              }}
              className="fab-action-item fab-action-cyan"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span>{soundEnabled ? 'الصوت مفعّل' : 'الصوت مُعطّل'}</span>
            </button>'''

if 'Volume2' in page and 'الصوت مفعّل' not in page:
    # Insert before the refresh button in FAB
    page = page.replace(
        '            <button\n              onClick={() => { setActiveTab("orders"); setPriorityFilter("urgent"); setFabOpen(false); }}\n              className="fab-action-item fab-action-rose"',
        sound_toggle + '\n            <button\n              onClick={() => { setActiveTab("orders"); setPriorityFilter("urgent"); setFabOpen(false); }}\n              className="fab-action-item fab-action-rose"'
    )

# ===== 12. Update version files =====
for vf in ['src/components/app/admin-login-gate.tsx', 'src/components/app/error-boundary.tsx']:
    try:
        with open(vf, 'r', encoding='utf-8') as f:
            content = f.read()
        content = content.replace('6.9', '7.0')
        with open(vf, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {vf}')
    except Exception as e:
        print(f'Error {vf}: {e}')

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page)
print(f'page.tsx updated ({len(page)} chars)')
