#!/usr/bin/env python3
"""R80 CSS: Add ~350 lines of CSS v7.6 styles"""

CSS_FILE = '/home/z/my-project/src/app/globals.css'

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

css = read_file(CSS_FILE)

new_css = r'''
/* ================================================================
   CSS v7.6 — Revenue Forecast, Priority Stars, Enhanced Kanban, Status Bar, R80
   ================================================================ */

/* ===== Revenue Forecast Widget ===== */
.revenue-forecast-widget {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid hsl(var(--border) / 0.4);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, hsl(var(--card)) 100%);
  animation: forecastFadeIn 0.5s ease-out;
  position: relative;
  overflow: hidden;
}
.revenue-forecast-widget::before {
  content: '';
  position: absolute;
  top: -20px; left: -20px; width: 80px; height: 80px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.08), transparent);
  pointer-events: none;
}
.dark .revenue-forecast-widget {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, hsl(var(--card) / 0.6) 100%);
  border-color: hsl(var(--border) / 0.25);
}
@keyframes forecastFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== Forecast Progress Bar ===== */
.forecast-bar-track {
 width: 100%;
  height: 6px;
  border-radius: 3px;
  background: hsl(var(--muted) / 0.4);
  overflow: hidden;
  position: relative;
}
.forecast-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}
.forecast-bar-fill::after {
  content: '';
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: forecastBarShimmer 2s ease-in-out infinite;
}
@keyframes forecastBarShimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* ===== Priority Stars ===== */
.priority-stars {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  font-size: 9px;
  filter: drop-shadow(0 0 3px rgba(245, 158, 11, 0.5));
  animation: starsPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.priority-medium-stars {
  opacity: 0.7;
  filter: drop-shadow(0 0 2px rgba(245, 158, 11, 0.3));
}
@keyframes starsPop {
  0% { transform: scale(0); }
  70% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* ===== Enhanced Kanban Column ===== */
.kanban-col-header {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-right: 3px solid;
  border-radius: 12px 12px 0 0;
  position: relative;
  overflow: hidden;
}
.kanban-col-header::after {
  content: '';
  position: absolute;
  bottom: 0; right: 0; left: 0; height: 1px;
  background: linear-gradient(90deg, transparent, hsl(var(--border)), transparent);
}

/* ===== Glass Card v10 ===== */
.glass-card-v10 {
  background: linear-gradient(135deg, hsl(var(--card) / 0.9) 0%, hsl(var(--card) / 0.4) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid hsl(var(--border) / 0.3);
  border-radius: 18px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.06), inset 0 1px 0 hsl(var(--foreground) / 0.04);
  transition: all 0.35s ease;
}
.glass-card-v10:hover {
  box-shadow: 0 16px 48px rgba(0,0,0,0.1), inset 0 1px 0 hsl(var(--foreground) / 0.06);
  border-color: hsl(var(--border) / 0.5);
  transform: translateY(-2px);
}
.dark .glass-card-v10 {
  background: linear-gradient(135deg, hsl(var(--card) / 0.5) 0%, hsl(var(--card) / 0.15) 100%);
  box-shadow: 0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03);
}

/* ===== Neon Glow Rose ===== */
.neon-glow-rose {
  box-shadow: 0 0 12px rgba(244, 63, 94, 0.4), 0 0 30px rgba(244, 63, 94, 0.15);
}
.dark .neon-glow-rose {
  box-shadow: 0 0 16px rgba(244, 63, 94, 0.5), 0 0 40px rgba(244, 63, 94, 0.2);
}

/* ===== Gradient Text Orange ===== */
.gradient-text-orange {
  background: linear-gradient(135deg, #f97316, #ea580c, #c2410c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== Hover Glow Rose ===== */
.hover-glow-rose {
  transition: box-shadow 0.3s ease;
}
.hover-glow-rose:hover {
  box-shadow: 0 0 15px rgba(244, 63, 94, 0.35), 0 0 35px rgba(244, 63, 94, 0.12);
}

/* ===== Shimmer v7 ===== */
.shimmer-v7 {
  position: relative;
  overflow: hidden;
}
.shimmer-v7::after {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  animation: shimmerSlideV7 3s ease-in-out infinite;
}
@keyframes shimmerSlideV7 {
  0% { left: -100%; }
 100% { left: 200%; }
}

/* ===== Skeleton v9 ===== */
.skeleton-v9 {
  background: linear-gradient(90deg, hsl(var(--muted)) 20%, hsl(var(--muted) / 0.5) 50%, hsl(var(--muted)) 80%);
  background-size: 200% 100%;
  animation: skeletonPulseV9 2s ease-in-out infinite;
  border-radius: 10px;
}
@keyframes skeletonPulseV9 {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== Hover Underline v4 ===== */
.hover-underline-4 {
  position: relative;
  display: inline-block;
}
.hover-underline-4::after {
  content: '';
  position: absolute;
  bottom: -2px; right: 0; width: 0; height: 2px;
  background: linear-gradient(90deg, #f43f5e, #8b5cf6);
  border-radius: 1px;
  transition: width 0.3s ease;
}
.hover-underline-4:hover::after {
  width: 100%;
}

/* ===== Tag Chip Rose ===== */
.tag-chip-rose {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(244, 63, 94, 0.1);
  color: #f43f5e;
  border: 1px solid rgba(244, 63, 94, 0.2);
  transition: all 0.2s ease;
}
.tag-chip-rose:hover {
  background: rgba(244, 63, 94, 0.2);
  box-shadow: 0 0 12px rgba(244, 63, 94, 0.3);
}

/* ===== Tag Chip Orange ===== */
.tag-chip-orange {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
  border: 1px solid rgba(249, 115, 22, 0.2);
  transition: all 0.2s ease;
}
.tag-chip-orange:hover {
  background: rgba(249, 115, 22, 0.2);
  box-shadow: 0 0 12px rgba(249, 115, 22, 0.3);
}

/* ===== Pulse Soft v4 ===== */
.pulse-soft-v4 {
  animation: pulseSoftV4 4s ease-in-out infinite;
}
@keyframes pulseSoftV4 {
  0%, 100% { opacity: 1; transform: scale(1); }
 50% { opacity: 0.6; transform: scale(1.04); }
}

/* ===== Scrollbar v6 ===== */
.scrollbar-v6::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-v6::-webkit-scrollbar-track {
  background: hsl(var(--muted) / 0.1);
  border-radius: 10px;
}
.scrollbar-v6::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #f43f5e, #8b5cf6);
  border-radius: 10px;
}
.scrollbar-v6::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #e11d48, #7c3aed);
}

/* ===== Focus Ring v5 ===== */
.focus-ring-v5 {
  outline: none;
}
.focus-ring-v5:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 3px;
  border-radius: 12px;
  box-shadow: 0 0 0 5px rgba(244, 63, 94, 0.12);
}

/* ===== Hover Scale Bounce v3 ===== */
.hover-scale-bounce-v3 {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hover-scale-bounce-v3:hover {
  transform: scale(1.05);
}
.hover-scale-bounce-v3:active {
  transform: scale(0.95);
}

/* ===== Breathe Border v3 ===== */
.breathe-border-v3 {
  border: 1px solid hsl(var(--border));
  animation: breatheBorderV3 5s ease-in-out infinite;
}
@keyframes breatheBorderV3 {
  0%, 100% { border-color: hsl(var(--border) / 0.25); }
 33% { border-color: hsl(var(--primary) / 0.35); }
 66% { border-color: hsl(var(--primary) / 0.2); }
}

/* ===== Card Shine v3 ===== */
.card-shine-v3 {
  position: relative;
  overflow: hidden;
}
.card-shine-v3::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%; width: 200%; height: 200%;
  background: radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.08), transparent 55%);
  transform: rotate(20deg);
  transition: opacity 0.5s ease;
  opacity: 0;
  pointer-events: none;
}
.card-shine-v3:hover::before {
  opacity: 1;
}

/* ===== Hover Lift 5 ===== */
.hover-lift-5 {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hover-lift-5:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.12);
}

/* ===== Gradient Border Animated v3 ===== */
.gradient-border-animated-v3 {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
}
.gradient-border-animated-v3::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: linear-gradient(135deg, #f43f5e, #8b5cf6, #06b6d4, #10b981);
  background-size: 400% 400%;
  animation: gradientBorderRotateV3 8s ease infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
@keyframes gradientBorderRotateV3 {
  0% { background-position: 0% 50%; }
 25% { background-position: 100% 0%; }
 50% { background-position: 100% 100%; }
 75% { background-position: 0% 100%; }
  100% { background-position: 0% 50%; }
}

/* ===== Neon Glow Emerald ===== */
.neon-glow-emerald {
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.15);
}
.dark .neon-glow-emerald {
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.2);
}

/* ===== Gradient Text Rose ===== */
.gradient-text-rose {
  background: linear-gradient(135deg, #f43f5e, #e11d48, #be123c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== Stagger Grid 25 ===== */
.stagger-grid-25 > * {
  animation: staggerFadeIn 0.3s ease-out both;
}
.stagger-grid-25 > *:nth-child(1) { animation-delay: 0ms; }
.stagger-grid-25 > *:nth-child(2) { animation-delay: 25ms; }
.stagger-grid-25 > *:nth-child(3) { animation-delay: 50ms; }
.stagger-grid-25 > *:nth-child(4) { animation-delay: 75ms; }
.stagger-grid-25 > *:nth-child(5) { animation-delay: 100ms; }

/* ===== Badge Bounce In v3 ===== */
.badge-bounce-in-v3 {
  animation: badgeBounceV3 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes badgeBounceV3 {
 0% { transform: scale(0) rotate(-10deg); opacity: 0; }
 60% { transform: scale(1.25) rotate(3deg); }
 100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

/* ===== Row Hover Glow v4 ===== */
.row-hover-glow-v4 {
  transition: all 0.25s ease;
  position: relative;
}
.row-hover-glow-v4:hover {
  background: hsl(var(--muted) / 0.35);
  box-shadow: inset 3px 0 0 #f43f5e, 0 4px 12px rgba(0,0,0,0.06);
}

/* ===== Separator Gradient v3 ===== */
.separator-gradient-v3 {
 height: 1px;
  background: linear-gradient(90deg, transparent, hsl(var(--border)), hsl(var(--primary) / 0.4), hsl(var(--border)), transparent);
  border: none;
}

/* ===== Text Glow Rose ===== */
.text-glow-rose {
  text-shadow: 0 0 8px rgba(244, 63, 94, 0.5), 0 0 16px rgba(244, 63, 94, 0.2);
}

/* ===== Hover Glow Emerald ===== */
.hover-glow-emerald {
  transition: box-shadow 0.3s ease;
}
.hover-glow-emerald:hover {
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.35), 0 0 35px rgba(16, 185, 129, 0.12);
}

/* ===== Priority Row Indicator ===== */
.priority-row-indicator {
  position: relative;
}
.priority-row-indicator::before {
  content: '';
  position: absolute;
  top: 4px; bottom: 4px; right: 0;
  width: 3px;
  border-radius: 2px;
  transition: all 0.2s ease;
}
.priority-row-indicator.priority-urgent-row::before {
  background: linear-gradient(180deg, #ef4444, #f97316);
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
}
.priority-row-indicator.priority-medium-row::before {
  background: linear-gradient(180deg, #f59e0b, #eab308);
}

/* ===== Mini Progress Bar Inline (Table) ===== */
.inline-status-bar {
 width: 100%;
  height: 3px;
  border-radius: 2px;
  background: hsl(var(--muted) / 0.3);
  overflow: hidden;
  margin-top: 4px;
}
.inline-status-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease-out;
}

/* ===== Responsive R80 ===== */
@media (max-width: 640px) {
 .revenue-forecast-widget { padding: 10px; }
  .priority-stars { font-size: 7px; }
}

@media (prefers-reduced-motion: reduce) {
  .revenue-forecast-widget, .forecast-bar-fill, .priority-stars, .badge-bounce-in-v3 {
    animation: none !important;
  }
  .forecast-bar-fill::after { animation: none !important; }
  .pulse-soft-v4 { animation: none !important; }
  .breathe-border-v3 { animation: none !important; }
  .bg-dot-grid-v2 { animation: none !important; }
  .gradient-border-animated-v3::before { animation: none !important; }
}
'''

css += new_css
write_file(CSS_FILE, css)
print(f'CSS v7.6 added successfully! Total lines: {len(css.splitlines())}')
