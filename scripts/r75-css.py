#!/usr/bin/env python3
"""Add CSS v7.1 to globals.css"""

CSS_FILE = "/home/z/my-project/src/app/globals.css"

with open(CSS_FILE, 'r', encoding='utf-8') as f:
    css = f.read()

css_v71 = r'''
/* ===== CSS v7.1 — R75 Styling ===== */

/* Print Queue Manager */
.print-queue-widget {
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border, rgba(0,0,0,0.1));
  background: var(--card, #fff);
  animation: widgetFade 0.4s ease-out;
}
.print-queue-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  font-size: 10px;
  font-weight: 700;
  padding: 0 5px;
  margin-inline-start: 4px;
}
.print-queue-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.625rem;
  border: 1px solid transparent;
  background: transparent;
  text-align: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: slideInRight 0.3s ease-out both;
}
.print-queue-item:hover {
  background: var(--muted, rgba(0,0,0,0.04));
  border-color: rgba(59, 130, 246, 0.15);
  transform: translateX(-2px);
}
.print-queue-progress {
  width: 4px;
  height: 32px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}
.print-queue-progress-fill {
  width: 100%;
  border-radius: 999px;
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  animation: printProgress 8s ease-in-out infinite;
}
@keyframes printProgress {
  0%, 100% { height: 20%; }
  50% { height: 80%; }
}

/* Mini Sparkline */
.mini-sparkline {
  width: 100%;
  height: auto;
  display: block;
  margin-top: 0.25rem;
  border-radius: 4px;
  overflow: visible;
}
.mini-sparkline-dot {
  animation: sparkDotPulse 2s ease-in-out infinite;
}
@keyframes sparkDotPulse {
  0%, 100% { r: 2; opacity: 1; }
  50% { r: 3.5; opacity: 0.7; }
}

/* Trend Badge */
.trend-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.trend-up {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}
.trend-down {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.trend-neutral {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

/* Trend Cards Container */
.trend-cards-container {
  animation: widgetFade 0.4s ease-out 0.1s both;
}
.trend-card {
  padding: 0.625rem;
  border-radius: 0.625rem;
  border: 1px solid var(--border, rgba(0,0,0,0.08));
  background: var(--muted, rgba(0,0,0,0.02));
  transition: all 0.2s ease;
}
.trend-card:hover {
  border-color: rgba(139, 92, 246, 0.2);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.08);
  transform: translateY(-1px);
}

/* Quick Stats Bar */
.quick-stats-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  background: var(--muted, rgba(0,0,0,0.03));
  border: 1px solid var(--border, rgba(0,0,0,0.06));
  animation: fadeIn 0.3s ease-out;
}
.quick-stats-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--muted-foreground, #666);
  white-space: nowrap;
}
.quick-stats-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  display: inline-block;
  flex-shrink: 0;
}

/* Quick View Status Timeline */
.qv-status-timeline {
  max-height: 160px;
  overflow-y: auto;
  padding-inline-start: 0.5rem;
}
.qv-timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.375rem 0;
  position: relative;
  animation: slideInRight 0.2s ease-out both;
}
.qv-timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 20px;
  right: 5px;
  width: 1px;
  height: calc(100% - 12px);
  background: var(--border, rgba(0,0,0,0.1));
}
.qv-timeline-dot {
  width: 11px;
  height: 11px;
  border-radius: 999px;
  flex-shrink: 0;
  margin-top: 1px;
  border: 2px solid var(--card, #fff);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.05);
}

/* Enhanced Animations */
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(8px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes widgetFade {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Glass Card v6 */
.glass-card-v6 {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.5);
}
@media (prefers-color-scheme: dark) {
  .glass-card-v6 {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05);
  }
}

/* Neon Glow variations */
.neon-glow-violet {
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.3), 0 0 24px rgba(139, 92, 246, 0.1);
  animation: neonPulseViolet 3s ease-in-out infinite;
}
@keyframes neonPulseViolet {
  0%, 100% { box-shadow: 0 0 8px rgba(139, 92, 246, 0.3), 0 0 24px rgba(139, 92, 246, 0.1); }
  50% { box-shadow: 0 0 12px rgba(139, 92, 246, 0.5), 0 0 36px rgba(139, 92, 246, 0.2); }
}
.neon-glow-teal {
  box-shadow: 0 0 8px rgba(20, 184, 166, 0.3), 0 0 24px rgba(20, 184, 166, 0.1);
  animation: neonPulseTeal 3s ease-in-out infinite;
}
@keyframes neonPulseTeal {
  0%, 100% { box-shadow: 0 0 8px rgba(20, 184, 166, 0.3), 0 0 24px rgba(20, 184, 166, 0.1); }
  50% { box-shadow: 0 0 12px rgba(20, 184, 166, 0.5), 0 0 36px rgba(20, 184, 166, 0.2); }
}

/* Gradient text variations */
.gradient-text-teal {
  background: linear-gradient(135deg, #14b8a6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.gradient-text-rose {
  background: linear-gradient(135deg, #f43f5e, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.gradient-text-lime {
  background: linear-gradient(135deg, #84cc16, #22c55e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Hover effects */
.hover-glow-violet:hover {
  box-shadow: 0 0 16px rgba(139, 92, 246, 0.25);
  transition: box-shadow 0.3s ease;
}
.hover-glow-teal:hover {
  box-shadow: 0 0 16px rgba(20, 184, 166, 0.25);
  transition: box-shadow 0.3s ease;
}

/* Animated border gradient */
.border-gradient-animate {
  position: relative;
  overflow: hidden;
}
.border-gradient-animate::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(var(--border-angle, 0deg), #8b5cf6, #06b6d4, #f59e0b, #ef4444, #8b5cf6);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: borderRotate 4s linear infinite;
}
@keyframes borderRotate {
  to { --border-angle: 360deg; }
}
@property --border-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

/* Skeleton loading v5 */
.skeleton-v5 {
  background: linear-gradient(90deg, var(--muted, #f0f0f0) 25%, rgba(255,255,255,0.5) 50%, var(--muted, #f0f0f0) 75%);
  background-size: 200% 100%;
  animation: skeletonWave 1.5s ease-in-out infinite;
  border-radius: 0.5rem;
}

/* Floating animation variants */
.float-gentle {
  animation: floatGentle 4s ease-in-out infinite;
}
@keyframes floatGentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.float-slow {
  animation: floatSlow 6s ease-in-out infinite;
}
@keyframes floatSlow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  33% { transform: translateY(-6px) rotate(1deg); }
  66% { transform: translateY(-3px) rotate(-1deg); }
}

/* Pulse ring v2 */
.pulse-ring-v2 {
  position: relative;
}
.pulse-ring-v2::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  border: 2px solid currentColor;
  opacity: 0;
  animation: pulseRingV2 2s ease-out infinite;
}
@keyframes pulseRingV2 {
  0% { transform: scale(0.9); opacity: 0.6; }
  100% { transform: scale(1.15); opacity: 0; }
}

/* Card depth effect v2 */
.card-depth-v2 {
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card-depth-v2:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
}

/* Scrollbar gradient */
.scrollbar-gradient::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-gradient::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-gradient::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #8b5cf6, #3b82f6);
  border-radius: 999px;
}

/* Badge glow v2 */
.badge-glow-v2 {
  position: relative;
}
.badge-glow-v2::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: inherit;
  filter: blur(6px);
  opacity: 0.4;
  z-index: -1;
}

/* Micro interaction: button press */
.btn-press-effect {
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.btn-press-effect:active {
  transform: scale(0.96);
  box-shadow: none !important;
}

/* Text glow effects */
.text-glow-blue {
  text-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}
.text-glow-violet {
  text-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
}
.text-glow-emerald {
  text-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

/* Hover border color shift */
.hover-border-shift {
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.hover-border-shift:hover {
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.1);
}

/* Data grid pattern background */
.bg-grid-pattern {
  background-image: 
    linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Animated dot grid */
.bg-dot-grid {
  background-image: radial-gradient(circle, rgba(139, 92, 246, 0.08) 1px, transparent 1px);
  background-size: 16px 16px;
}

/* Stripe background */
.bg-stripe {
  background-image: repeating-linear-gradient(
    -45deg,
    transparent,
    transparent 4px,
    rgba(139, 92, 246, 0.03) 4px,
    rgba(139, 92, 246, 0.03) 8px
  );
}

/* Focus visible ring v2 */
.focus-ring-v2:focus-visible {
  outline: 2px solid rgba(139, 92, 246, 0.5);
  outline-offset: 2px;
  border-radius: inherit;
}

/* Smooth number transition */
.number-smooth {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Separator with gradient */
.separator-gradient {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border, rgba(0,0,0,0.1)), transparent);
  margin: 0.5rem 0;
}

/* Row hover glow strip */
.row-hover-glow {
  position: relative;
  transition: all 0.2s ease;
}
.row-hover-glow::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.04), transparent);
  transition: opacity 0.2s ease;
  pointer-events: none;
}
.row-hover-glow:hover::before {
  opacity: 1;
}

/* Container with decorative corners */
.corner-decor {
  position: relative;
}
.corner-decor::before, .corner-decor::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-color: rgba(139, 92, 246, 0.2);
  border-style: solid;
}
.corner-decor::before {
  top: -1px;
  right: -1px;
  border-width: 2px 0 0 2px;
  border-radius: 0 8px 0 0;
}
.corner-decor::after {
  bottom: -1px;
  left: -1px;
  border-width: 0 2px 2px 0;
  border-radius: 0 0 0 8px;
}

/* Tag chip styles */
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.tag-chip:hover {
  transform: scale(1.05);
}
.tag-chip-amber { background: rgba(245, 158, 11, 0.1); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.2); }
.tag-chip-blue { background: rgba(59, 130, 246, 0.1); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.2); }
.tag-chip-emerald { background: rgba(16, 185, 129, 0.1); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); }
.tag-chip-rose { background: rgba(244, 63, 94, 0.1); color: #e11d48; border: 1px solid rgba(244, 63, 94, 0.2); }
.tag-chip-violet { background: rgba(139, 92, 246, 0.1); color: #7c3aed; border: 1px solid rgba(139, 92, 246, 0.2); }

/* Enhanced card hover with border glow */
.card-border-glow {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border, rgba(0,0,0,0.08));
  transition: all 0.3s ease;
}
.card-border-glow::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: conic-gradient(from var(--glow-angle, 0deg), transparent 60%, rgba(139, 92, 246, 0.3), transparent 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.card-border-glow:hover::before {
  opacity: 1;
  animation: glowRotate 3s linear infinite;
}
@keyframes glowRotate {
  to { --glow-angle: 360deg; }
}
@property --glow-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

/* Responsive reduced motion */
@media (max-width: 640px) {
  .print-queue-progress { height: 24px; }
  .quick-stats-bar { gap: 0.375rem; padding: 0.25rem 0.5rem; font-size: 8px; }
  .trend-card { padding: 0.5rem; }
}

@media (prefers-reduced-motion: reduce) {
  .print-queue-progress-fill,
  .mini-sparkline-dot,
  .float-gentle,
  .float-slow,
  .pulse-ring-v2::after,
  .card-border-glow:hover::before,
  .border-gradient-animate::before {
    animation: none;
  }
}
'''

css = css.rstrip() + "\n" + css_v71

with open(CSS_FILE, 'w', encoding='utf-8') as f:
    f.write(css)

print(f"globals.css updated: {len(css.splitlines())} lines")
print(f"Added CSS v7.1: ~{len(css_v71.splitlines())} lines")
