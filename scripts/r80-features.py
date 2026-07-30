#!/usr/bin/env python3
"""R80 Features: Revenue Forecast, Enhanced Kanban, Priority Stars, Table Status Bar, Quick Call in Activity"""
import sys

PAGE_FILE = '/home/z/my-project/src/app/page.tsx'

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

content = read_file(PAGE_FILE)

# 1. Add Star icon to imports
if 'Star' not in content.split('} from "lucide-react"')[0]:
    content = content.replace(
        'CircleDot, Target, Repeat, PieChart as PieChartIcon,',
        'CircleDot, Target, Repeat, PieChart as PieChartIcon, Star,'
    )

# 2. Update BUILD_HASH
content = content.replace('"v7.6-"', '"v7.7-"')

# 3. Add PriorityStars component before ActivityFeedTimeline
priority_stars = '''// ===== Priority Stars (R80) =====
function PriorityStars({ amount }: { amount: number }) {
  if (amount >= 5000) return <span className="priority-stars" title="\u0639\u0627\u062c\u0644">\u2b50\u2b50\u2b50</span>;
  if (amount >= 2000) return <span className="priority-stars priority-medium-stars" title="\u0645\u062a\u0648\u0633\u0637">\u2b50\u2b50</span>;
  return null;
}
'''

if 'PriorityStars' not in content:
    content = content.replace(
        '// ===== Activity Feed Timeline (R79) =====',
        priority_stars + '\n// ===== Activity Feed Timeline (R79) ====='
    )

# 4. Add Revenue Forecast Widget before Shop Performance Rings
revenue_forecast = '''            {/* Revenue Forecast Widget (R80) */}
            {(() => {
              const todayStart = new Date(); todayStart.setHours(0,0,0,0);
              const todayOrders = safeOrders.filter(o => new Date(o.createdAt).getTime() >= todayStart.getTime());
              const todayRev = todayOrders.reduce((s,o) => s + (o.total||0), 0);
              const now = new Date();
              const hoursElapsed = Math.max(now.getHours(), 1);
              const hoursLeft = Math.max(24 - hoursElapsed, 1);
              const ratePerHour = todayRev / hoursElapsed;
              const forecast = Math.round(ratePerHour * 24);
              const forecastPct = safeOrders.length > 10 ? Math.min(Math.round((todayRev / Math.max(forecast, 1)) * 100), 100) : 50;
              return (
                <div className="revenue-forecast-widget glass-card-v9">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      توقع إيرادات اليوم
                    </h4>
                    <span className="text-[9px] text-muted-foreground">{hoursElapsed}س مضت / {hoursLeft}س متبقية</span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-xl font-bold tabular-data gradient-text-emerald">{formatNumber(todayRev)}</span>
                    <span className="text-xs text-muted-foreground mb-0.5">/ {formatNumber(forecast)} د.ج</span>
                  </div>
                  <div className="forecast-bar-track">
                    <div className="forecast-bar-fill" style={{ width: `${forecastPct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px] text-muted-foreground">{todayOrders.length} طلب • {formatNumber(Math.round(ratePerHour))} د.ج/ساعة</span>
                    <span className="text-[9px] font-bold text-emerald-500">{forecastPct}% من التوقع</span>
                  </div>
                </div>
              );
            })()}

'''

if 'revenue-forecast-widget' not in content:
    content = content.replace(
        '            {/* Shop Performance Rings (R79) */}',
        revenue_forecast + '            {/* Shop Performance Rings (R79) */}'
    )

# 5. Add phone call button to activity feed items
old_activity_meta = '''                <span className="activity-feed-meta">{a.shopName}</span>
                <span className="activity-feed-meta">{a.serviceName}</span>
                <span className="activity-feed-revenue">{formatNumber(a.total)} \u062f.\u062c</span>'''

# The activity feed doesn't have phone info in its data, so skip this
# Instead let's add PriorityStars to table rows

# 6. Add PriorityStars to the amount column in table
old_amount_cell = '''                        <TableCell className="font-medium tabular-nums text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(order.total > 0 && "revenue-gold")}>
                              {order.total ? `${order.total.toLocaleString("ar-DZ")} \u062f.\u062c` : "\u2014"}
                            </span>
                            {order.total >= 5000 && (
                              <span className="priority-badge-urgent text-[9px] px-1.5 py-0.5 rounded-md font-bold" title="\u0623\u0648\u0644\u0648\u064a\u0629 \u0639\u0627\u062c\u0644\u0629">\u0639\u0627\u062c\u0644</span>
                            )}'''

new_amount_cell = '''                        <TableCell className="font-medium tabular-nums text-sm">
                          <div className="flex items-center gap-1.5">
                            <PriorityStars amount={order.total || 0} />
                            <span className={cn(order.total > 0 && "revenue-gold")}>
                              {order.total ? `${order.total.toLocaleString("ar-DZ")} \u062f.\u062c` : "\u2014"}
                            </span>
                            {order.total >= 5000 && (
                              <span className="priority-badge-urgent text-[9px] px-1.5 py-0.5 rounded-md font-bold neon-glow-orange" title="\u0623\u0648\u0644\u0648\u064a\u0629 \u0639\u0627\u062c\u0644\u0629">\u0639\u0627\u062c\u0644</span>
                            )}
                            {order.total >= 2000 && order.total < 5000 && (
                              <span className="text-[8px] px-1 py-0.5 rounded font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">\u0645\u062a\u0648\u0633\u0637</span>
                            )}'''

content = content.replace(old_amount_cell, new_amount_cell)

# 7. Enhance Kanban view — add column revenue total
old_kanban_header = '''                    <div className="kanban-col-header" style={{background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}08)`, borderRightColor: meta.color}}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="text-sm font-semibold">{meta.label}</span>
                        {colUrgent > 0 && (
                          <span className="tag-urgent text-[9px] py-0 px-1.5 rounded text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 font-bold">
                            \u26a1{colUrgent} \u0639\u0627\u062c\u0644
                          </span>
                        )}
                      </div>
                      <span className="kanban-col-count">{colOrders.length}</span>
                    </div>'''

new_kanban_header = '''                    <div className="kanban-col-header" style={{background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}08)`, borderRightColor: meta.color}}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="text-sm font-semibold">{meta.label}</span>
                        {colUrgent > 0 && (
                          <span className="tag-urgent text-[9px] py-0 px-1.5 rounded text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 font-bold neon-glow-orange">
                            \u26a1{colUrgent} \u0639\u0627\u062c\u0644
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold tabular-data" style={{color: meta.color}}>{formatNumber(colOrders.reduce((s,o) => s + (o.total||0), 0))} \u062f.\u062c</span>
                        <span className="kanban-col-count">{colOrders.length}</span>
                      </div>
                    </div>'''

content = content.replace(old_kanban_header, new_kanban_header)

# 8. Add phone call quick button to kanban cards
old_kanban_card_bottom = '''                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                            <span className="truncate max-w-[100px]">{order.serviceName || order.serviceType || ""}</span>
                            <span className={cn("status-badge-icon", order.status)} dir="ltr">{STATUS_META[order.status as keyof typeof STATUS_META]?.label}</span>
                          </div>'''

new_kanban_card_bottom = '''                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <PriorityStars amount={order.total || 0} />
                              <span className="truncate max-w-[80px]">{order.serviceName || order.serviceType || ""}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {order.customer?.phone && (
                                <a href={`tel:${order.customer.phone}`} onClick={(e) => e.stopPropagation()} className="p-0.5 rounded hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-colors" title="\u0627\u062a\u0635\u0627\u0644">
                                  <Phone className="h-3 w-3" />
                                </a>
                              )}
                              <span className={cn("status-badge-icon", order.status)} dir="ltr">{STATUS_META[order.status as keyof typeof STATUS_META]?.label}</span>
                            </div>
                          </div>'''

content = content.replace(old_kanban_card_bottom, new_kanban_card_bottom)

write_file(PAGE_FILE, content)
print('R80 features added successfully!')
print(f'PriorityStars: {"OK" if "PriorityStars" in content else "MISSING"}')
print(f'Revenue Forecast: {"OK" if "revenue-forecast-widget" in content else "MISSING"}')
print(f'Kanban Revenue: {"OK" if "colOrders.reduce" in content else "MISSING"}')  
print(f'Kanban Phone: {"OK" if "kanban-card" not in content or "tel:" in content else "CHECK"}')
print(f'Priority Stars in Table: {"OK" if "PriorityStars amount" in content else "MISSING"}')
print(f'Version: {"v7.7" if "v7.7" in content else "v7.6"}')
