#!/usr/bin/env python3
"""R76 Features: Customer Insights, Service Tags, Quick Actions Menu, CSS v7.2"""

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

# ===== STEP 1: Add MoreLucide icon imports =====
print("Step 1: Adding imports...")
old_import = 'StickyNote, UserCircle, BarChart2, Hash, Clock4, Send, Volume2, VolumeX, Tag, Timer, ClipboardList, FileBarChart,'
new_import = 'StickyNote, UserCircle, BarChart2, Hash, Clock4, Send, Volume2, VolumeX, Tag, Timer, ClipboardList, FileBarChart, MoreHorizontal, Star, Crown, Award, ChevronLeft, ChevronRight,'
page = page.replace(old_import, new_import, 1)

# ===== STEP 2: Add CustomerInsightsWidget component before DuplicateWarning =====
print("Step 2: Adding CustomerInsightsWidget...")

ciw = r'''
// ===== Customer Insights Widget =====
function CustomerInsightsWidget({ orders }: { orders: GlobalOrder[] }) {
  const customerMap = new Map<string, { name: string; phone: string; total: number; count: number; delivered: number; lastOrder: string }>();
  orders.forEach(o => {
    const key = o.customer?.phone || o.customer?.name || 'unknown';
    if (!o.customer?.name) return;
    const existing = customerMap.get(key);
    if (existing) {
      existing.total += (o.total || 0);
      existing.count += 1;
      if (o.status === 'delivered') existing.delivered += 1;
      if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt;
    } else {
      customerMap.set(key, {
        name: o.customer.name,
        phone: o.customer?.phone || '',
        total: o.total || 0,
        count: 1,
        delivered: o.status === 'delivered' ? 1 : 0,
        lastOrder: o.createdAt,
      });
    }
  });

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  if (topCustomers.length === 0) return null;
  const maxTotal = topCustomers[0].total;

  return (
    <div className="customer-insights-widget">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
          <Crown className="h-3.5 w-3.5 text-amber-500" />
          أفضل الزبائن
        </h3>
        <span className="text-[10px] text-muted-foreground/50">حسب الإنفاق</span>
      </div>
      <div className="space-y-2">
        {topCustomers.map((cust, i) => {
          const rankIcons = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
          const rankColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
          return (
            <div key={cust.phone || cust.name} className="ci-customer-row" style={{animationDelay: `${i * 50}ms`}}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={cn("ci-rank", i < 3 && rankColors[i])}>
                  {i < 3 ? rankIcons[i] : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-medium truncate max-w-[110px]">{cust.name}</span>
                    <span className="text-[10px] font-bold tabular-data revenue-gold">{cust.total.toLocaleString("ar-DZ")} د.ج</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="ci-progress-bg">
                      <div className="ci-progress-fill" style={{ width: `${(cust.total / maxTotal) * 100}%` }} />
                    </div>
                    <span className="text-[8px] text-muted-foreground/50 tabular-nums whitespace-nowrap">{cust.count} طلب</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'''

page = page.replace(
    '// ===== Duplicate Warning =====',
    ciw + '// ===== Duplicate Warning ====='
)

# ===== STEP 3: Add QuickActionsMenu component =====
print("Step 3: Adding QuickActionsMenu...")

qam = r'''
// ===== Quick Actions Menu =====
function QuickActionsMenu({ order, onStatusChange, onView, onComment }: { order: GlobalOrder; onStatusChange: (id: string, status: string) => void; onView: (o: GlobalOrder) => void; onComment: (o: GlobalOrder) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const nextStatus = (() => {
    const flow = ['pending', 'confirmed', 'printing', 'ready', 'delivered'];
    const idx = flow.indexOf(order.status);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;
  })();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const actions = [
    { label: 'عرض التفاصيل', icon: Eye, onClick: () => { onView(order); setOpen(false); }, color: 'text-blue-500' },
    nextStatus && { label: `تقدم \u2192 ${STATUS_META[nextStatus as keyof typeof STATUS_META]?.label}`, icon: Play, onClick: () => { onStatusChange(order.id, nextStatus); setOpen(false); }, color: 'text-emerald-500' },
    { label: 'إضافة ملاحظة', icon: StickyNote, onClick: () => { onComment(order); setOpen(false); }, color: 'text-violet-500' },
    ...(order.customer?.phone ? [{ label: 'واتساب', icon: MessageCircle, onClick: () => { window.open(`https://wa.me/213${order.customer.phone.replace(/^0/, "")}`, '_blank'); setOpen(false); }, color: 'text-green-500' }] : []),
    { label: 'نسخ الرقم المرجعي', icon: Copy, onClick: () => { navigator.clipboard.writeText(order.reference || order.id); toast.success('تم نسخ الرقم المرجعي'); setOpen(false); }, color: 'text-slate-500' },
  ].filter(Boolean);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="quick-actions-trigger btn-press-effect"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="quick-actions-dropdown" onClick={e => e.stopPropagation()}>
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className="quick-actions-item"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <action.icon className={cn("h-3.5 w-3.5", action.color)} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'''

page = page.replace(
    '// ===== Duplicate Warning =====',
    qam + '// ===== Duplicate Warning ====='
)

# ===== STEP 4: Add CustomerInsightsWidget in overview tab =====
print("Step 4: Adding CustomerInsights to overview...")

ci_insert = '''            {/* Customer Insights Widget */}
            <CustomerInsightsWidget orders={safeOrders} />

'''

page = page.replace(
    '            {/* Weekly Order Heatmap */}',
    ci_insert + '            {/* Weekly Order Heatmap */}'
)

# ===== STEP 5: Add service tag to table service column =====
print("Step 5: Adding service tags to table...")

old_service_cell = '''                        <TableCell>
                          <span className="overflow-marquee inline-block max-w-[120px]" title={order.serviceName || order.serviceType || ""}>
                            {order.serviceName || order.serviceType || "—"}
                          </span>
                        </TableCell>'''

FILE_EMOJI = '\U0001f4c4'
new_service_cell = f'''                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="tag-chip tag-chip-blue svc-type-tag">
                              {{SERVICE_EMOJI[order.serviceType as keyof typeof SERVICE_EMOJI] || '{FILE_EMOJI}'}}
                              <span className="overflow-marquee inline-block max-w-[90px]" title={{order.serviceName || order.serviceType || ""}}>
                                {{order.serviceName || order.serviceType || "—"}}
                              </span>
                            </span>
                          </div>
                        </TableCell>'''

page = page.replace(old_service_cell, new_service_cell, 1)

# ===== STEP 6: Add QuickActionsMenu to table action column =====
print("Step 6: Adding QuickActionsMenu to table...")

# Find the action buttons area and add quick actions menu
old_actions = '''                          <button onClick={(e) => { e.stopPropagation(); setQuickViewOrder(order); setSelectedOrder(order); }} className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" title="عرض سريع">
                            <Eye className="h-3.5 w-3.5" />
                          </button>'''

new_actions = '''                          <QuickActionsMenu order={order} onStatusChange={changeOrderStatus} onView={(o) => { setQuickViewOrder(o); setSelectedOrder(o); }} onComment={(o) => { setQuickViewOrder(o); setSelectedOrder(o); }} />
                          <button onClick={(e) => { e.stopPropagation(); setQuickViewOrder(order); setSelectedOrder(order); }} className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" title="عرض سريع">
                            <Eye className="h-3.5 w-3.5" />
                          </button>'''

page = page.replace(old_actions, new_actions, 1)

# ===== STEP 7: Update version =====
print("Step 7: Updating version to v7.3...")
page = page.replace('const BUILD_HASH = "v7.2-', 'const BUILD_HASH = "v7.3-', 1)

write_file(PAGE_FILE, page)
print(f"page.tsx: {len(page.splitlines())} lines")

# ===== STEP 8: Update other files =====
print("Step 8: Updating versions...")
lg = lg.replace('v7.2', 'v7.3')
write_file(LOGIN_GATE, lg)
eb = eb.replace('v7.2', 'v7.3').replace('7.2', '7.3')
write_file(ERROR_BOUNDARY, eb)

print("\n=== R76 page.tsx features complete ===")
