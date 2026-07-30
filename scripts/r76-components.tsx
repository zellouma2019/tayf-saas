
// ===== Customer Insights Widget =====
function CustomerInsightsWidget({ orders }: { orders: GlobalOrder[] }) {
  const customerMap = new Map<string, { name: string; phone: string; total: number; count: number; lastOrder: string }>();
  orders.forEach(o => {
    if (!o.customer?.name) return;
    const key = o.customer.phone || o.customer.name || 'unknown';
    const existing = customerMap.get(key);
    if (existing) {
      existing.total += (o.total || 0);
      existing.count += 1;
      if (o.createdAt > existing.lastOrder) existing.lastOrder = o.createdAt;
    } else {
      customerMap.set(key, { name: o.customer.name, phone: o.customer?.phone || '', total: o.total || 0, count: 1, lastOrder: o.createdAt });
    }
  });
  const topCustomers = Array.from(customerMap.values()).sort((a, b) => b.total - a.total).slice(0, 5);
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
        {topCustomers.map((cust, i) => (
          <div key={cust.phone || cust.name} className="ci-customer-row" style={{animationDelay: `${i * 50}ms`}}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={cn("ci-rank", i === 0 && "text-amber-500", i === 1 && "text-slate-400", i === 2 && "text-amber-700")}>
                {i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : i + 1}
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
        ))}
      </div>
    </div>
  );
}

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
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="quick-actions-trigger btn-press-effect">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="quick-actions-dropdown" onClick={e => e.stopPropagation()}>
          {actions.map((action, i) => (
            <button key={i} onClick={action.onClick} className="quick-actions-item" style={{ animationDelay: `${i * 30}ms` }}>
              <action.icon className={cn("h-3.5 w-3.5", action.color)} />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

