#!/usr/bin/env python3
"""R75 Features: Print Queue Manager, Mini Sparklines, Enhanced Quick View, CSS v7.1"""

PAGE_FILE = "/home/z/my-project/src/app/page.tsx"
CSS_FILE = "/home/z/my-project/src/app/globals.css"
LOGIN_GATE = "/home/z/my-project/src/components/app/admin-login-gate.tsx"
ERROR_BOUNDARY = "/home/z/my-project/src/components/app/error-boundary.tsx"

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Reading files...")
page = read_file(PAGE_FILE)
css = read_file(CSS_FILE)
lg = read_file(LOGIN_GATE)
eb = read_file(ERROR_BOUNDARY)

# ===== STEP 1: Add imports =====
print("Step 1: Adding imports...")
old_import = 'StickyNote, UserCircle, BarChart2, Hash, Clock4, Send, Volume2, VolumeX,'
new_import = 'StickyNote, UserCircle, BarChart2, Hash, Clock4, Send, Volume2, VolumeX, Tag, Timer, ClipboardList, FileBarChart,'
page = page.replace(old_import, new_import, 1)

# ===== STEP 2: Add PrintQueueManager before DuplicateWarning =====
print("Step 2: Adding PrintQueueManager component...")

pqm = r'''
// ===== Print Queue Manager =====
function PrintQueueManager({ orders, onOrderClick }: { orders: GlobalOrder[]; onOrderClick: (o: GlobalOrder) => void }) {
  const printingOrders = orders
    .filter(o => o.status === 'printing')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (printingOrders.length === 0) return null;

  const totalAmount = printingOrders.reduce((s, o) => s + (o.total || 0), 0);

  return (
    <div className="print-queue-widget">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
          <Printer className="h-3.5 w-3.5 text-blue-500" />
          طابور الطباعة
          <span className="print-queue-count">{printingOrders.length}</span>
        </h3>
        <span className="text-[10px] text-muted-foreground/50 tabular-data">{formatNumber(totalAmount)} د.ج</span>
      </div>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto scrollbar-thin">
        {printingOrders.map((order, i) => (
          <button
            key={order.id}
            onClick={() => onOrderClick(order)}
            className="print-queue-item w-full text-right"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center gap-2">
              <div className="print-queue-progress">
                <div className="print-queue-progress-fill" style={{ animationDuration: `${8 + i * 3}s` }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium truncate max-w-[130px]">
                    {SERVICE_EMOJI[order.serviceType as keyof typeof SERVICE_EMOJI] || ' '} {order.serviceName || order.serviceType || '—'}
                  </span>
                  <span className="text-[10px] font-bold tabular-data revenue-gold">{order.total?.toLocaleString("ar-DZ")} د.ج</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-muted-foreground truncate">{order.customer?.name || '—'}</span>
                  <span className="text-[8px] text-muted-foreground/30">\u2022</span>
                  <span className="text-[9px] text-muted-foreground/60" dir="ltr">{order.reference || order.id.slice(0,8)}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

'''

page = page.replace(
    '// ===== Duplicate Warning =====',
    pqm + '// ===== Duplicate Warning ====='
)

# ===== STEP 3: Add MiniSparkline + TrendBadge components =====
print("Step 3: Adding MiniSparkline component...")

sparkline = r'''
// ===== Mini Sparkline Chart =====
function MiniSparkline({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100;
  const h = height;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  const gradId = `sg-${color.replace('#','')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mini-sparkline" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.length > 0 && (
        <circle cx={(data.length-1) / (data.length-1) * w} cy={h - ((data[data.length-1] - min) / range) * (h-4) - 2} r="2" fill={color} className="mini-sparkline-dot" />
      )}
    </svg>
  );
}

// ===== Trend Badge =====
function TrendBadge({ current, previous }: { current: number; previous: number; unit?: string }) {
  if (previous === 0 && current === 0) return <span className="trend-badge trend-neutral">—</span>;
  const change = previous > 0 ? ((current - previous) / previous * 100) : (current > 0 ? 100 : 0);
  const isUp = change >= 0;
  return (
    <span className={cn("trend-badge", isUp ? "trend-up" : "trend-down")}>
      {isUp ? '\u2191' : '\u2193'} {Math.abs(change).toFixed(0)}%
    </span>
  );
}

'''

page = page.replace(
    '// ===== Duplicate Warning =====',
    sparkline + '// ===== Duplicate Warning ====='
)

# ===== STEP 4: Add Print Queue + Trend Cards after Stats Comparison =====
print("Step 4: Adding print queue + trend cards in overview...")

# Read the trend cards from a separate template
with open('/home/z/my-project/scripts/r75-trend-cards.txt', 'r') as f:
    trend_cards_text = f.read()

marker = '            {/* Activity Panel + Filters Layout */}'
page = page.replace(marker, trend_cards_text + marker)

# ===== STEP 5: Add status history in quick view =====
print("Step 5: Adding status history in quick view...")

status_history = r'''              {/* Status History Timeline */}
              {quickViewOrder.statusHistory && quickViewOrder.statusHistory.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Timer className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-bold text-muted-foreground">سجل الحالات</span>
                  </div>
                  <div className="space-y-1.5 qv-status-timeline">
                    {quickViewOrder.statusHistory.map((entry: {status: string; timestamp: string; note?: string}, i: number) => {
                      const meta = STATUS_META[entry.status as keyof typeof STATUS_META];
                      return (
                        <div key={i} className="qv-timeline-item" style={{animationDelay: `${i * 30}ms`}}>
                          <div className="qv-timeline-dot" style={{backgroundColor: meta?.color || '#888'}} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-medium">{meta?.label || entry.status}</span>
                              <span className="text-[8px] text-muted-foreground/50" dir="ltr">{formatDateTimeAr(entry.timestamp)}</span>
                            </div>
                            {entry.note && <p className="text-[8px] text-muted-foreground/60 mt-0.5 truncate">{entry.note}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

'''

page = page.replace(
    '              {/* Order comment in quick view */}',
    status_history + '              {/* Order comment in quick view */}'
)

# ===== STEP 6: Add FAB actions =====
print("Step 6: Adding FAB actions...")

fab_actions = r'''            <button
              onClick={() => { toast.info("\u0637\u0628\u0627\u0639\u0629 \u0645\u0644\u0635\u0642\u0627\u062a \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0642\u064a\u062f \u0627\u0644\u062a\u0637\u0648\u064a\u0631"); setFabOpen(false); }}
              className="fab-action-item fab-action-violet"
            >
              <Tag className="h-4 w-4" />
              <span>طباعة ملصقات</span>
            </button>
            <button
              onClick={() => { exportAdminReport(); setFabOpen(false); }}
              className="fab-action-item fab-action-emerald"
            >
              <FileBarChart className="h-4 w-4" />
              <span>تصدير تقرير</span>
            </button>
'''

page = page.replace(
    '            <button\n              onClick={() => {\n                const next = !soundEnabled;',
    fab_actions + '            <button\n              onClick={() => {\n                const next = !soundEnabled;'
)

# ===== STEP 7: Add quick stats bar before view toggle =====
print("Step 7: Adding quick stats bar...")

qsb = r'''            {/* Quick Stats Bar */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <div className="quick-stats-bar">
                <span className="quick-stats-item"><span className="quick-stats-dot bg-amber-500" />{safeOrders.filter(o => o.status === 'pending').length} معلق</span>
                <span className="quick-stats-item"><span className="quick-stats-dot bg-blue-500" />{safeOrders.filter(o => o.status === 'printing').length} طباعة</span>
                <span className="quick-stats-item"><span className="quick-stats-dot bg-emerald-500" />{safeOrders.filter(o => o.status === 'ready').length} جاهز</span>
                <span className="quick-stats-item"><span className="quick-stats-dot bg-violet-500" />{safeOrders.filter(o => o.status === 'delivered').length} مُسلّم</span>
              </div>
              <div className="flex-1" />
              <span className="text-[9px] text-muted-foreground/40 tabular-data">{filteredOrders.length} من {safeOrders.length} طلب</span>
            </div>

'''

page = page.replace(
    '            {/* View Toggle: Table / Kanban / Cards / Calendar */}',
    qsb + '            {/* View Toggle: Table / Kanban / Cards / Calendar */}'
)

# ===== STEP 8: Update version =====
print("Step 8: Updating version to v7.2...")
page = page.replace('const BUILD_HASH = "v7.1-', 'const BUILD_HASH = "v7.2-', 1)

write_file(PAGE_FILE, page)
print(f"page.tsx: {len(page.splitlines())} lines")

# ===== STEP 9: Update other files =====
print("Step 9: Updating versions...")
lg = lg.replace('v7.1', 'v7.2')
write_file(LOGIN_GATE, lg)
eb = eb.replace('v7.1', 'v7.2').replace('7.1', '7.2')
write_file(ERROR_BOUNDARY, eb)

# ===== STEP 10: CSS v7.1 will be added separately =====
print("Step 10: CSS v7.1 will be added separately...")

print("\n=== R75 page.tsx features complete ===")
