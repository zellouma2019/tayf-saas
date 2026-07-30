#!/usr/bin/env python3
"""Add CSS v7.2"""

CSS_FILE = "/home/z/my-project/src/app/globals.css"

with open(CSS_FILE, 'r', encoding='utf-8') as f:
    css = f.read()

css_new = """
/* ===== CSS v7.2 — R76 Styling ===== */

/* Customer Insights Widget */
.customer-insights-widget {
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border, rgba(0,0,0,0.1));
  background: var(--card, #fff);
  animation: widgetFade 0.4s ease-out;
}
.ci-customer-row {
  padding: 0.5rem 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  animation: slideInRight 0.3s ease-out both;
}
.ci-customer-row:hover {
  background: var(--muted, rgba(0,0,0,0.03));
  transform: translateX(-2px);
}
.ci-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: var(--muted, rgba(0,0,0,0.04));
  font-size: 14px;
  flex-shrink: 0;
}
.ci-progress-bg {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: var(--muted, rgba(0,0,0,0.06));
  overflow: hidden;
}
.ci-progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #f59e0b, #ef4444);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Quick Actions Menu */
.quick-actions-trigger {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted-foreground, #666);
  cursor: pointer;
  transition: all 0.15s ease;
}
.quick-actions-trigger:hover {
  background: var(--muted, rgba(0,0,0,0.06));
  border-color: var(--border, rgba(0,0,0,0.1));
  color: var(--foreground, #111);
}
.quick-actions-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 60;
  min-width: 180px;
  padding: 0.375rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border, rgba(0,0,0,0.1));
  background: var(--card, #fff);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.04);
  animation: dropIn 0.15s ease-out;
}
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-4px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.quick-actions-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border-radius: 0.5rem;
  border: none;
  background: transparent;
  text-align: right;
  font-size: 11px;
  color: var(--foreground, #333);
  cursor: pointer;
  transition: background 0.15s ease;
  animation: slideInRight 0.15s ease-out both;
}
.quick-actions-item:hover {
  background: var(--muted, rgba(0,0,0,0.04));
}

/* Service type tag in table */
.svc-type-tag {
  font-size: 10px !important;
  padding: 1px 6px !important;
  border-radius: 6px !important;
  max-width: 160px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  transition: all 0.2s ease;
}
.svc-type-tag:hover {
  transform: scale(1.03);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

/* Enhanced hover row glow v2 */
.row-hover-glow-v2 {
  position: relative;
  overflow: hidden;
}
.row-hover-glow-v2::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0;
  background: radial-gradient(ellipse at 50% 0%, rgba(139, 92, 246, 0.06), transparent 70%);
  transition: opacity 0.3s ease;
  pointer-events: none;
}
.row-hover-glow-v2:hover::after {
  opacity: 1;
}

/* Glass panel v4 */
.glass-panel-v4 {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
}
@media (prefers-color-scheme: dark) {
  .glass-panel-v4 {
    background: rgba(15, 23, 42, 0.5);
    border-color: rgba(255, 255, 255, 0.06);
  }
}

/* Animated gradient border v3 */
@keyframes borderGradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.border-gradient-shift {
  background-size: 300% 300%;
  animation: borderGradientShift 6s ease infinite;
}

/* Shimmer effect v4 */
.shimmer-v4 {
  position: relative;
  overflow: hidden;
}
.shimmer-v4::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
  animation: shimmerSlide 2s infinite;
  pointer-events: none;
}

/* Hover scale subtle */
.hover-scale-subtle {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-scale-subtle:hover {
  transform: scale(1.02);
}

/* Card shine effect */
.card-shine {
  position: relative;
  overflow: hidden;
}
.card-shine::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
  transition: transform 0.6s ease;
  transform: translateX(-100%);
  pointer-events: none;
}
.card-shine:hover::before {
  transform: translateX(100%);
}

/* Glow dot indicator */
.glow-dot {
  position: relative;
}
.glow-dot::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 3px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.4;
}

/* Animated underline */
.animated-underline {
  position: relative;
}
.animated-underline::after {
  content: '';
  position: absolute;
  bottom: -2px;
  right: 0;
  width: 0;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #8b5cf6, #06b6d4);
  transition: width 0.3s ease;
}
.animated-underline:hover::after {
  width: 100%;
}

/* Pulse soft */
@keyframes pulseSoft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
.pulse-soft {
  animation: pulseSoft 2.5s ease-in-out infinite;
}

/* Breathe border */
@keyframes breatheBorder {
  0%, 100% { border-color: rgba(139, 92, 246, 0.2); }
  50% { border-color: rgba(139, 92, 246, 0.5); }
}
.breathe-border {
  animation: breatheBorder 4s ease-in-out infinite;
}

/* Tag chip hover glow */
.tag-chip-amber:hover { box-shadow: 0 0 8px rgba(245, 158, 11, 0.2); }
.tag-chip-blue:hover { box-shadow: 0 0 8px rgba(59, 130, 246, 0.2); }
.tag-chip-emerald:hover { box-shadow: 0 0 8px rgba(16, 185, 129, 0.2); }
.tag-chip-rose:hover { box-shadow: 0 0 8px rgba(244, 63, 94, 0.2); }
.tag-chip-violet:hover { box-shadow: 0 0 8px rgba(139, 92, 246, 0.2); }

/* Responsive */
@media (max-width: 640px) {
  .ci-rank { width: 20px; height: 20px; font-size: 12px; }
  .quick-actions-dropdown { min-width: 160px; left: auto; right: 0; }
  .svc-type-tag { max-width: 100px; }
}

@media (prefers-reduced-motion: reduce) {
  .ci-progress-fill, .quick-actions-item, .ci-customer-row, .shimmer-v4::after, .card-shine::before {
    animation: none;
  }
}
"""

css = css.rstrip() + "\n" + css_new

with open(CSS_FILE, 'w', encoding='utf-8') as f:
    f.write(css)

print(f"globals.css: {len(css.splitlines())} lines (+{len(css_new.splitlines())})")
