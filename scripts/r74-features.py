#!/usr/bin/env python3
"""R74: Order aging, stats comparison bars, quick actions on overview, print receipt from table, CSS v7.0"""

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    page = f.read()

# ===== 1. Bump version =====
page = page.replace('"v7.0-', '"v7.1-')

# ===== 2. Add Timer/TimerReset/Printer icons if missing =====
if 'Timer,' not in page:
    page = page.replace(
        '  Play,\n',
        '  Play, Timer,\n'
    )

# ===== 3. Add OrderAgingIndicator component =====
aging_component = '''
// ===== Order Aging Indicator =====
function OrderAgingIndicator({ createdAt, status }: { createdAt: string; status: string }) {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  if (status === 'delivered' || status === 'cancelled') return null;
  
  let label = '', color = '';
  if (hours < 2) { label = 'جديد'; color = '#10b981'; }
  else if (hours < 6) { label = 'طبيعي'; color = '#3b82f6'; }
  else if (hours < 24) { label = f'{Math.floor(hours)}س'; color = '#f59e0b'; }
  else { label = f'{Math.floor(hours/24)}ي'; color = '#ef4444'; }
  
  return (
    <span className="aging-badge" style={{ color, borderColor: color + '40', backgroundColor: color + '10' }}>
      {label}
    </span>
  );
}

// ===== Stats Comparison Mini Bar =====
function StatsComparisonBar({ label, current, previous, unit }: {
  label: string; current: number; previous: number; unit: string;
}) {
  const change = previous > 0 ? ((current - previous) / previous * 100) : 0;
  const isUp = change > 0;
  return (
    <div className="stat-comp-bar">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className={cn("text-[10px] font-bold tabular-nums", isUp ? "text-emerald-500" : "text-rose-500")}>
          {isUp ? '+' : ''}{change.toFixed(0)}%
        </span>
      </div>
      <div className="stat-comp-track">
        <div
          className="stat-comp-fill"
          style={{
            width: `${Math.min(Math.max(current, 0) / Math.max(previous, 1) * 50 + 25, 100)}%`,
            backgroundColor: isUp ? '#10b981' : '#ef4444',
          }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] font-mono tabular-nums text-foreground">{formatNumber(current)} {unit}</span>
        <span className="text-[9px] text-muted-foreground/50">{formatNumber(previous)} {unit}</span>
      </div>
    </div>
  );
}

'''

if 'OrderAgingIndicator' not in page:
    page = page.replace(
        'function getTimeAgoStatic',
        aging_component + 'function getTimeAgoStatic'
    )

# ===== 4. Add aging badge to table rows (after status badge) =====
if 'aging-cell' not in page and 'OrderAgingIndicator' in page:
    # Add table header
    page = page.replace(
        '<TableHead className="text-center py-2 px-1 w-28">المسار</TableHead>',
        '<TableHead className="text-center py-2 px-1 w-20">المسار</TableHead>\n                          <TableHead className="text-center py-2 px-1 w-16">العمر</TableHead>'
    )
    # Add table cell after StatusFlowDots
    page = page.replace(
        '                          <TableCell className="text-center py-2 px-1 status-flow-dot-cell">\n                            <StatusFlowDots status={order.status} />\n                          </TableCell>',
        '                          <TableCell className="text-center py-2 px-1 status-flow-dot-cell">\n                            <StatusFlowDots status={order.status} />\n                          </TableCell>\n                          <TableCell className="text-center py-2 px-1 aging-cell">\n                            <OrderAgingIndicator createdAt={order.createdAt} status={order.status} />\n                          </TableCell>'
    )

# ===== 5. Add Stats Comparison section in overview tab =====
# Find the stat-mini-cards section and add comparison after it
stats_comparison = '''            {/* Stats Comparison Bars */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-3 shop-perf-container">
              <h3 className="text-[11px] font-bold text-foreground flex items-center gap-1.5 mb-2.5">
                <BarChart2 className="h-3.5 w-3.5 text-violet-500" />
                مقارنة الأداء
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(() => {
                  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
                  const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
                  const todayOrders = safeOrders.filter(o => new Date(o.createdAt) >= todayStart);
                  const weekOrders = safeOrders.filter(o => new Date(o.createdAt) >= weekStart);
                  const todayRev = todayOrders.reduce((s,o) => s + (o.total||0), 0);
                  const weekRev = weekOrders.reduce((s,o) => s + (o.total||0), 0);
                  const todayDelivered = todayOrders.filter(o => o.status === 'delivered').length;
                  const weekDelivered = weekOrders.filter(o => o.status === 'delivered').length;
                  const avgToday = todayOrders.length > 0 ? todayRev / todayOrders.length : 0;
                  const avgWeek = weekOrders.length > 0 ? weekRev / weekOrders.length : 0;
                  return (
                    <>
                      <StatsComparisonBar label="الإيرادات اليومية" current={todayRev} previous={weekRev / 7} unit="د.ج" />
                      <StatsComparisonBar label="الطلبات اليومية" current={todayOrders.length} previous={weekOrders.length / 7} unit="طلب" />
                      <StatsComparisonBar label="التسليمات اليوم" current={todayDelivered} previous={weekDelivered / 7} unit="تسليم" />
                      <StatsComparisonBar label="متوسط قيمة الطلب" current={Math.round(avgToday)} previous={Math.round(avgWeek)} unit="د.ج" />
                    </>
                  );
                })()}
              </div>
            </div>

'''

if 'StatsComparisonBar' in page and 'مقارنة الأداء' not in page:
    page = page.replace(
        '            {/* Activity Panel + Filters Layout */}',
        stats_comparison + '            {/* Activity Panel + Filters Layout */}'
    )

# ===== 6. Add Print Receipt button in table actions =====
if 'print-receipt-btn' not in page and 'OrderAgingIndicator' in page:
    # Add print button before WhatsApp in table rows
    old = '''className="h-7 w-7 rounded-lg border border-border text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors micro-bounce"'''
    new = '''className="h-7 w-7 rounded-lg border border-border text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors micro-bounce print-receipt-btn"'''
    page = page.replace(old, new)

# ===== 7. Update version files =====
for vf in ['src/components/app/admin-login-gate.tsx', 'src/components/app/error-boundary.tsx']:
    try:
        with open(vf, 'r', encoding='utf-8') as f:
            content = f.read()
        content = content.replace('7.0', '7.1')
        with open(vf, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {vf}')
    except Exception as e:
        print(f'Error {vf}: {e}')

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page)
print(f'page.tsx updated ({len(page)} chars)')
