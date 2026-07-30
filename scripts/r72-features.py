#!/usr/bin/env python3
"""R72: Add new features to page.tsx and CSS v6.7 to globals.css"""

import re

# ===== 1. Add new features to page.tsx =====
with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    page = f.read()

# --- 1a. Bump version ---
page = page.replace(
    'const BUILD_HASH = "v6.8-',
    'const BUILD_HASH = "v6.9-'
)

# --- 1b. Add Send icon to imports ---
if 'Send,' not in page:
    page = page.replace(
        '  StickyNote, UserCircle, BarChart2, Hash, Clock4,\n',
        '  StickyNote, UserCircle, BarChart2, Hash, Clock4, Send,\n'
    )

# --- 1c. Add new state variables after priorityFilter ---
new_states = '''  // Order comments
  const [orderComments, setOrderComments] = useState<Record<string, string>>({});
  const [qvComment, setQvComment] = useState("");
  // Weekly heatmap data
  const [showHeatmap, setShowHeatmap] = useState(false);
'''

if 'orderComments' not in page:
    page = page.replace(
        '  const [priorityFilter, setPriorityFilter]',
        new_states + '  const [priorityFilter, setPriorityFilter]'
    )

# --- 1d. Add saveComment callback after activeFilterCount ---
save_comment_fn = '''
  // Save comment for an order
  const saveComment = useCallback(async (orderId: string, comment: string) => {
    setOrderComments(prev => ({ ...prev, [orderId]: comment }));
    try {
      await fetch(`/api/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      });
    } catch {}
  }, []);

  // Get time spent in current status
  const getTimeInStatus = useCallback((order: GlobalOrder) => {
    const created = new Date(order.createdAt).getTime();
    const now = Date.now();
    const hours = Math.floor((now - created) / 3600000);
    if (hours < 1) return 'أقل من ساعة';
    if (hours < 24) return `${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `${days} يوم`;
  }, []);

'''

if 'saveComment' not in page:
    page = page.replace(
        '  const activeFilterCount = ',
        save_comment_fn + '  const activeFilterCount = '
    )

# --- 1e. Add WeeklyOrderHeatmap component after getTimeAgoStatic ---
heatmap_component = '''

// ===== Weekly Order Heatmap =====
function WeeklyOrderHeatmap({ orders, onDayClick }: { orders: GlobalOrder[]; onDayClick?: (day: string) => void }) {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const today = new Date();
  const weekDays: { label: string; date: string; count: number; total: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(dateStr));
    weekDays.push({
      label: days[d.getDay()],
      date: dateStr,
      count: dayOrders.length,
      total: dayOrders.reduce((s, o) => s + (o.total || 0), 0),
    });
  }

  const maxCount = Math.max(...weekDays.map(d => d.count), 1);

  return (
    <div className="weekly-heatmap-container">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">خريطة الأسبوع</span>
        <span className="text-[9px] text-muted-foreground/50">آخر 7 أيام</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => {
          const intensity = day.count / maxCount;
          return (
            <button
              key={day.date}
              onClick={() => onDayClick?.(day.date)}
              className="heatmap-cell group relative"
              title={`${day.label}: ${day.count} طلب`}
              style={{
                backgroundColor: day.count === 0
                  ? 'var(--muted, #f0f0f0)'
                  : `rgba(245, 158, 11, ${0.15 + intensity * 0.85})`,
                animationDelay: `${weekDays.indexOf(day) * 60}ms`,
              }}
            >
              <span className="heatmap-cell-label">{day.label.slice(0, 2)}</span>
              {day.count > 0 && (
                <span className="heatmap-cell-count">{day.count}</span>
              )}
              <div className="heatmap-tooltip">
                <p className="font-medium text-[10px]">{day.label} — {day.date}</p>
                <p className="text-[9px] text-muted-foreground">{day.count} طلب</p>
                {day.total > 0 && (
                  <p className="text-[9px] font-mono text-amber-500">{day.total.toLocaleString("ar-DZ")} د.ج</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-muted-foreground/40">أقل</span>
          {[0.15, 0.4, 0.65, 0.9].map((o, i) => (
            <span key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(245, 158, 11, ${o})` }} />
          ))}
          <span className="text-[8px] text-muted-foreground/40">أكثر</span>
        </div>
        <span className="text-[9px] text-muted-foreground/50">المجموع: {weekDays.reduce((s,d)=>s+d.count,0)} طلب</span>
      </div>
    </div>
  );
}

// ===== Duplicate Order Warning =====
function DuplicateWarning({ order, allOrders }: { order: GlobalOrder; allOrders: GlobalOrder[] }) {
  const duplicates = allOrders.filter(o =>
    o.id !== order.id &&
    (o.customer?.name || "") === (order.customer?.name || "") &&
    (o.customer?.phone || "") === (order.customer?.phone || "") &&
    (o.serviceType || o.serviceName) === (order.serviceType || order.serviceName) &&
    Math.abs(new Date(o.createdAt).getTime() - new Date(order.createdAt).getTime()) < 86400000
  );

  if (duplicates.length === 0) return null;

  return (
    <div className="duplicate-warning-bar">
      <AlertTriangle className="h-3 w-3 flex-shrink-0 duplicate-warning-icon" />
      <span className="text-[10px]">{duplicates.length} طلب مكرر مشابه اليوم</span>
    </div>
  );
}

'''

if 'WeeklyOrderHeatmap' not in page:
    page = page.replace(
        'function getTimeAgoStatic',
        heatmap_component + 'function getTimeAgoStatic'
    )

# --- 1f. Add heatmap to orders tab, after service distribution section ---
heatmap_insertion = '''
            {/* Weekly Order Heatmap */}
            <div className="rounded-xl border border-border/60 bg-card/80 p-3 svc-dist-container">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  خريطة الطلبات الأسبوعية
                </h3>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showHeatmap ? 'إخفاء ▲' : 'عرض ▼'}
                </button>
              </div>
              {showHeatmap && (
                <WeeklyOrderHeatmap
                  orders={safeOrders}
                  onDayClick={(day) => { setDateFilter("custom"); setDateFrom(day); setDateTo(day); setShowHeatmap(false); }}
                />
              )}
            </div>

'''

# Insert before the Activity Panel + Filters Layout section
if 'WeeklyOrderHeatmap' in page and 'خريطة الطلبات الأسبوعية' not in page:
    page = page.replace(
        '            {/* Activity Panel + Filters Layout */}',
        heatmap_insertion + '            {/* Activity Panel + Filters Layout */}'
    )

# --- 1g. Add comment section to Quick View dialog ---
# Find the quick view dialog and add comment section before the closing </div> of the dialog content
quick_view_comment = '''
              {/* Order comment in quick view */}
              <div className="mt-3 pt-3 border-t border-border/60">
                <div className="flex items-center gap-1.5 mb-2">
                  <StickyNote className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground">ملاحظة</span>
                </div>
                <div className="flex gap-1.5">
                  <input
                    value={qvComment}
                    onChange={(e) => setQvComment(e.target.value)}
                    placeholder="أضف ملاحظة سريعة..."
                    className="flex-1 h-7 px-2 rounded-lg border border-border/60 bg-muted/30 text-[11px] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 comment-input-mini"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && qvComment.trim() && quickViewOrder) {
                        saveComment(quickViewOrder.id, qvComment.trim());
                        setQvComment("");
                        toast.success("تم حفظ الملاحظة");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (qvComment.trim() && quickViewOrder) {
                        saveComment(quickViewOrder.id, qvComment.trim());
                        setQvComment("");
                        toast.success("تم حفظ الملاحظة");
                      }
                    }}
                    disabled={!qvComment.trim()}
                    className="h-7 w-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed micro-bounce"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
                {orderComments[quickViewOrder?.id || ""] && (
                  <p className="mt-1.5 text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-2 py-1.5 comment-saved-text">
                    {orderComments[quickViewOrder?.id || ""]}
                  </p>
                )}
              </div>
              {/* Time in status */}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground/50">المدة</span>
                <span className="text-[10px] font-medium text-muted-foreground time-in-status-badge">
                  {quickViewOrder && getTimeInStatus(quickViewOrder)}
                </span>
              </div>
              {/* Duplicate warning */}
              {quickViewOrder && <DuplicateWarning order={quickViewOrder} allOrders={safeOrders} />}
'''

# Insert before the closing div of the quick view's inner p-4 div
if 'comment-input-mini' not in page and 'saveComment' in page:
    # Find the quick view's status change section and add after the button row
    old_qv_end = '''                <button
                  onClick={() => { setQuickViewOrder(null); setSelectedOrder(quickViewOrder); }}
                  className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1 micro-bounce press-feedback"
                >
                  <Eye className="h-3 w-3" />
                  المزيد
                </button>
              </div>'''
    new_qv_end = '''                <button
                  onClick={() => { setQuickViewOrder(null); setSelectedOrder(quickViewOrder); }}
                  className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1 micro-bounce press-feedback"
                >
                  <Eye className="h-3 w-3" />
                  المزيد
                </button>
              </div>
''' + quick_view_comment

    page = page.replace(old_qv_end, new_qv_end)

# --- 1h. Add inline comment icon to order table rows ---
# Find the order row's action buttons and add a comment button
if 'comment-row-btn' not in page:
    # Add comment button next to the WhatsApp link in order rows
    old_wa = '''href={`https://wa.me/213${order.customer.phone.replace(/^0/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 rounded-lg border border-border text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors micro-bounce"'''
    new_wa = '''onClick={() => { setQvComment(orderComments[order.id] || ""); setQuickViewOrder(order); }}
                  className="h-7 w-7 rounded-lg border border-border text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors micro-bounce comment-row-btn"
                  title="ملاحظة سريعة"
                >
                  <StickyNote className="h-3.5 w-3.5" />
                </button>
                <a
                  href={`https://wa.me/213${order.customer.phone.replace(/^0/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 rounded-lg border border-border text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors micro-bounce"'''
    page = page.replace(old_wa, new_wa)

# --- 1i. Update version in admin-login-gate.tsx and error-boundary.tsx ---
for vf in ['src/components/app/admin-login-gate.tsx', 'src/components/app/error-boundary.tsx']:
    try:
        with open(vf, 'r', encoding='utf-8') as f:
            content = f.read()
        content = content.replace('6.8', '6.9').replace('v6.8', 'v6.9')
        with open(vf, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated version in {vf}')
    except Exception as e:
        print(f'Error updating {vf}: {e}')

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(page)
print('Updated page.tsx with new features')

# ===== 2. Add CSS v6.7 to globals.css =====
with open('src/app/globals.css', 'r', encoding='utf-8') as f:
    css = f.read()

css_v67 = '''
/* ═══════════════════════════════════════════════════════════
   CSS v6.7 — R72: Heatmap, Comments, Duplicate Warning, Enhanced Animations
   ═══════════════════════════════════════════════════════════ */

/* ──── Weekly Heatmap ──── */
.weekly-heatmap-container {
  padding: 0.5rem;
}

.heatmap-cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: heatmapCellEnter 0.4s ease-out both;
  border: 1px solid transparent;
}

.heatmap-cell:hover {
  transform: scale(1.15);
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
  z-index: 2;
}

.heatmap-cell:active {
  transform: scale(0.95);
}

.heatmap-cell-label {
  font-size: 8px;
  font-weight: 600;
  color: var(--foreground, #171717);
  opacity: 0.6;
  line-height: 1;
}

.heatmap-cell-count {
  font-size: 9px;
  font-weight: 700;
  color: var(--foreground, #171717);
  line-height: 1;
  margin-top: 1px;
  font-variant-numeric: tabular-nums;
}

.heatmap-tooltip {
  display: none;
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--popover, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 0.5rem;
  padding: 0.4rem 0.6rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 50;
  white-space: nowrap;
  pointer-events: none;
}

.heatmap-cell:hover .heatmap-tooltip {
  display: block;
  animation: tooltipFadeIn 0.15s ease-out;
}

@keyframes heatmapCellEnter {
  0% { opacity: 0; transform: scale(0.6) translateY(6px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes tooltipFadeIn {
  0% { opacity: 0; transform: translateX(-50%) translateY(4px) scale(0.95); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}

/* ──── Duplicate Warning ──── */
.duplicate-warning-bar {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.35rem 0.6rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  color: #ef4444;
  animation: dupWarningSlide 0.3s ease-out;
}

.duplicate-warning-icon {
  animation: dupWarningPulse 2s ease-in-out infinite;
}

@keyframes dupWarningSlide {
  0% { opacity: 0; transform: translateY(-6px); max-height: 0; }
  100% { opacity: 1; transform: translateY(0); max-height: 40px; }
}

@keyframes dupWarningPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ──── Comment Input ──── */
.comment-input-mini {
  transition: all 0.2s ease;
}

.comment-input-mini:focus {
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}

.comment-input-mini::placeholder {
  font-size: 10px;
}

.comment-saved-text {
  animation: commentSavedFade 0.3s ease-out;
  border-right: 2px solid rgba(245, 158, 11, 0.4);
}

@keyframes commentSavedFade {
  0% { opacity: 0; transform: translateX(8px); }
  100% { opacity: 1; transform: translateX(0); }
}

/* ──── Comment Row Button ──── */
.comment-row-btn {
  position: relative;
  overflow: hidden;
}

.comment-row-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity 0.2s;
}

.comment-row-btn:hover::after {
  opacity: 0.06;
}

/* ──── Time In Status Badge ──── */
.time-in-status-badge {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(59, 130, 246, 0.08));
  padding: 0.1rem 0.4rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(139, 92, 246, 0.15);
}

/* ──── Enhanced Card Hover v2 ──── */
.card-hover-glow {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.card-hover-glow::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
  transition: left 0.5s ease;
}

.card-hover-glow:hover::before {
  left: 100%;
}

.card-hover-glow:hover {
  border-color: rgba(139, 92, 246, 0.25);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.08), 0 0 0 1px rgba(139, 92, 246, 0.05);
}

/* ──── Micro-interaction: Press Feedback v2 ──── */
.press-feedback {
  transition: all 0.15s ease;
}

.press-feedback:active {
  transform: scale(0.96);
  opacity: 0.85;
}

/* ──── Stagger Children Animation v2 ──── */
.stagger-children > * {
  animation: staggerItemIn 0.35s ease-out both;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 40ms; }
.stagger-children > *:nth-child(3) { animation-delay: 80ms; }
.stagger-children > *:nth-child(4) { animation-delay: 120ms; }
.stagger-children > *:nth-child(5) { animation-delay: 160ms; }
.stagger-children > *:nth-child(6) { animation-delay: 200ms; }
.stagger-children > *:nth-child(7) { animation-delay: 240ms; }
.stagger-children > *:nth-child(8) { animation-delay: 280ms; }

@keyframes staggerItemIn {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* ──── Neon Glow Variants (enhanced) ──── */
.neon-glow-rose {
  animation: neonRose 2.5s ease-in-out infinite;
}

@keyframes neonRose {
  0%, 100% { box-shadow: 0 0 5px rgba(244, 63, 94, 0.3), 0 0 15px rgba(244, 63, 94, 0.1); }
  50% { box-shadow: 0 0 12px rgba(244, 63, 94, 0.5), 0 0 30px rgba(244, 63, 94, 0.2); }
}

.neon-glow-cyan {
  animation: neonCyan 2.5s ease-in-out infinite;
}

@keyframes neonCyan {
  0%, 100% { box-shadow: 0 0 5px rgba(6, 182, 212, 0.3), 0 0 15px rgba(6, 182, 212, 0.1); }
  50% { box-shadow: 0 0 12px rgba(6, 182, 212, 0.5), 0 0 30px rgba(6, 182, 212, 0.2); }
}

/* ──── Gradient Border Spinner ──── */
.gradient-border-spinner {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
}

.gradient-border-spinner::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: conic-gradient(from 0deg, #f59e0b, #8b5cf6, #3b82f6, #10b981, #f59e0b);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: borderSpin 4s linear infinite;
}

@keyframes borderSpin {
  0% { background: conic-gradient(from 0deg, #f59e0b, #8b5cf6, #3b82f6, #10b981, #f59e0b); }
  25% { background: conic-gradient(from 90deg, #f59e0b, #8b5cf6, #3b82f6, #10b981, #f59e0b); }
  50% { background: conic-gradient(from 180deg, #f59e0b, #8b5cf6, #3b82f6, #10b981, #f59e0b); }
  75% { background: conic-gradient(from 270deg, #f59e0b, #8b5cf6, #3b82f6, #10b981, #f59e0b); }
  100% { background: conic-gradient(from 360deg, #f59e0b, #8b5cf6, #3b82f6, #10b981, #f59e0b); }
}

/* ──── Liquid Fill Progress ──── */
.liquid-progress {
  position: relative;
  overflow: hidden;
  border-radius: 999px;
}

.liquid-progress::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 70%);
  animation: liquidWobble 3s ease-in-out infinite;
}

@keyframes liquidWobble {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(2%, -2%) rotate(1deg); }
  50% { transform: translate(-1%, 2%) rotate(-0.5deg); }
  75% { transform: translate(-2%, -1%) rotate(0.5deg); }
}

/* ──── 3D Card Tilt on Hover ──── */
.tilt-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  transform-style: preserve-3d;
  perspective: 800px;
}

.tilt-card:hover {
  transform: translateY(-4px) rotateX(2deg);
  box-shadow: 0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
}

/* ──── Typing Indicator Dots ──── */
.typing-dots {
  display: inline-flex;
  gap: 3px;
  align-items: center;
}

.typing-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--muted-foreground, #737373);
  animation: typingBounce 1.2s ease-in-out infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.15s; }
.typing-dots span:nth-child(3) { animation-delay: 0.3s; }

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
}

/* ──── Morphing Background Blob ──── */
.morph-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.15;
  animation: morphBlob 8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes morphBlob {
  0%, 100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; transform: translate(0, 0) scale(1); }
  25% { border-radius: 55% 45% 35% 65% / 60% 40% 60% 40%; transform: translate(5%, -5%) scale(1.05); }
  50% { border-radius: 35% 65% 55% 45% / 40% 60% 40% 60%; transform: translate(-3%, 3%) scale(0.95); }
  75% { border-radius: 60% 40% 45% 55% / 55% 45% 55% 45%; transform: translate(-2%, -2%) scale(1.02); }
}

/* ──── Glassmorphism Panel v3 ──── */
.glass-panel-v3 {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

@media (prefers-color-scheme: dark) {
  .glass-panel-v3 {
    background: rgba(15, 15, 15, 0.6);
    border-color: rgba(255, 255, 255, 0.08);
  }
}

/* ──── Shimmer Text ──── */
.shimmer-text {
  background: linear-gradient(90deg, var(--foreground) 0%, var(--primary) 50%, var(--foreground) 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmerText 3s linear infinite;
}

@keyframes shimmerText {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

/* ──── Scale In Animation ──── */
@keyframes scaleIn {
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

.scale-in {
  animation: scaleIn 0.25s ease-out;
}

/* ──── Slide Down Reveal ──── */
@keyframes slideDownReveal {
  0% { opacity: 0; max-height: 0; transform: translateY(-8px); }
  100% { opacity: 1; max-height: 200px; transform: translateY(0); }
}

.slide-down-reveal {
  animation: slideDownReveal 0.35s ease-out;
  overflow: hidden;
}

/* ──── Pulse Dot (status indicator) ──── */
.pulse-dot {
  position: relative;
}

.pulse-dot::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  animation: pulseDotExpand 1.5s ease-out infinite;
}

@keyframes pulseDotExpand {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* ──── Scroll Progress Indicator ──── */
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  background: linear-gradient(90deg, #f59e0b, #8b5cf6, #3b82f6);
  z-index: 9999;
  transition: width 0.1s linear;
}

/* ──── Hover Underline Animation ──── */
.hover-underline-animated {
  position: relative;
  display: inline-block;
}

.hover-underline-animated::after {
  content: '';
  position: absolute;
  bottom: -2px;
  right: 0;
  width: 0;
  height: 1.5px;
  background: linear-gradient(90deg, #f59e0b, #8b5cf6);
  transition: width 0.3s ease;
}

.hover-underline-animated:hover::after {
  width: 100%;
}

/* ──── Focus Visible Ring v2 ──── */
*:focus-visible {
  outline: 2px solid rgba(245, 158, 11, 0.5);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ──── Skeleton Pulse v3 (enhanced) ──── */
.skeleton-pulse-v3 {
 background: linear-gradient(90deg, var(--muted) 25%, rgba(245, 158, 11, 0.06) 50%, var(--muted) 75%);
  background-size: 200% 100%;
  animation: skeletonPulseV3 1.5s ease-in-out infinite;
  border-radius: 0.5rem;
}

@keyframes skeletonPulseV3 {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ──── Responsive Touch Optimizations ──── */
@media (max-width: 640px) {
  .heatmap-cell {
    border-radius: 0.375rem;
  }
  
  .heatmap-cell:hover {
    transform: none;
  }

  .tilt-card:hover {
    transform: none;
  }

  .card-hover-glow:hover {
    box-shadow: none;
  }
}

/* ──── Notification Counter Badge v2 ──── */
.notif-badge-v2 {
  position: relative;
}

.notif-badge-v2::after {
  content: attr(data-count);
  position: absolute;
  top: -4px;
  left: -4px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: #ef4444;
  color: white;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  line-height: 1;
  animation: badgeBounceIn 0.3s ease-out;
}

@keyframes badgeBounceIn {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* ──── Smooth Number Transition ──── */
.number-transition {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-variant-numeric: tabular-nums;
}

/* ──── Order Row Hover Strip ──── */
.order-row-hover-strip {
  position: relative;
}

.order-row-hover-strip::before {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, #f59e0b, #8b5cf6);
  border-radius: 0 3px 3px 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.order-row-hover-strip:hover::before {
  opacity: 1;
}

/* ──── Glassmorphism Card v4 ──── */
.glass-card-v4 {
  background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4));
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.25);
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}

@media (prefers-color-scheme: dark) {
  .glass-card-v4 {
    background: linear-gradient(135deg, rgba(20,20,20,0.7), rgba(20,20,20,0.4));
    border-color: rgba(255,255,255,0.06);
  }
}

/* ──── Hover Glow Ring ──── */
.hover-glow-ring {
  transition: box-shadow 0.3s ease;
}

.hover-glow-ring:hover {
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15), 0 0 20px rgba(139, 92, 246, 0.1);
}

/* ──── Animated Divider ──── */
.animated-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border, #e5e7eb), transparent);
  position: relative;
  overflow: hidden;
}

.animated-divider::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.4), transparent);
  animation: dividerSlide 3s ease-in-out infinite;
}

@keyframes dividerSlide {
 0% { left: -50%; }
 100% { left: 150%; }
}

/* ──── Quick View Dialog Enhanced ──── */
.quick-view-dialog {
  animation: quickViewIn 0.25s ease-out;
}

@keyframes quickViewIn {
  0% { opacity: 0; transform: scale(0.95) translateY(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* ──── Status Flow Mini ──── */
.status-flow-mini {
  display: flex;
  align-items: center;
  gap: 2px;
}

.status-flow-mini .flow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--muted, #e5e7eb);
  transition: all 0.2s;
}

.status-flow-mini .flow-dot.active {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
}

.status-flow-mini .flow-dot.current {
  background: #f59e0b;
  animation: flowDotPulse 1.5s ease-in-out infinite;
}

@keyframes flowDotPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.4); }
}

/* ──── Text Glow Effect ──── */
.text-glow-amber {
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
}

.text-glow-emerald {
  text-shadow: 0 0 8px rgba(10, 185, 129, 0.3);
}

.text-glow-violet {
  text-shadow: 0 0 8px rgba(139, 92, 246, 0.3);
}

/* ──── Breathing Box Shadow ──── */
.breathing-shadow {
  animation: breatheShadow 4s ease-in-out infinite;
}

@keyframes breatheShadow {
  0%, 100% { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  50% { box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1); }
}

/* ──── Hover Scale Bounce ──── */
.hover-scale-bounce {
  transition: transform 0.2s ease;
}

.hover-scale-bounce:hover {
  animation: scaleBounce 0.4s ease;
}

@keyframes scaleBounce {
  0% { transform: scale(1); }
  40% { transform: scale(1.06); }
  70% { transform: scale(0.98); }
  100% { transform: scale(1.03); }
}

/* ──── Scrollbar Thin v2 ──── */
.scrollbar-thin-v2::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.scrollbar-thin-v2::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin-v2::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #f59e0b, #8b5cf6);
  border-radius: 4px;
}

.scrollbar-thin-v2::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #fbbf24, #a78bfa);
}

/* ──── Hover Color Shift ──── */
.hover-color-shift {
  transition: color 0.3s ease, background-color 0.3s ease;
}

.hover-color-shift:hover {
  color: #8b5cf6;
}

/* ──── Cinematic Entrance v2 ──── */
@keyframes cinematicInV2 {
  0% { opacity: 0; transform: translateY(16px) scale(0.98); filter: blur(4px); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}

.anim-cinematic-in-v2 {
  animation: cinematicInV2 0.5s ease-out;
}

/* ──── Floating Action Button Glow ──── */
.fab-glow {
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3), 0 0 0 0 rgba(245, 158, 11, 0.2);
  animation: fabGlowPulse 2s ease-in-out infinite;
}

@keyframes fabGlowPulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3), 0 0 0 0 rgba(245, 158, 11, 0.2); }
  50% { box-shadow: 0 4px 24px rgba(245, 158, 11, 0.4), 0 0 0 8px rgba(245, 158, 11, 0); }
}

'''

if 'CSS v6.7' not in css:
    css += css_v67
    print(f'Added CSS v6.7 ({len(css_v67)} chars)')
else:
    print('CSS v6.7 already exists')

with open('src/app/globals.css', 'w', encoding='utf-8') as f:
    f.write(css)

print(f'globals.css now: {len(css)} chars')
print('All done!')
