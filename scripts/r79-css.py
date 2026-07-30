#!/usr/bin/env python3
"""R79 CSS: Add ~300 lines of CSS v7.5 styles"""

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
   CSS v7.5 — Activity Feed, Shop Performance Rings, Enhanced Styles (R79)
   ================================================================ */

/* ===== Activity Feed Widget ===== */
.activity-feed-widget {
  background: linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.7) 100%);
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(12px);
  animation: widgetFade 0.4s ease-out;
}
.dark .activity-feed-widget {
  background: linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.4) 100%);
  border-color: hsl(var(--border) / 0.3);
}
.activity-feed-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 18px;
  border-radius: 9px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 0 6px;
}
.activity-feed-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.activity-feed-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  transition: all 0.2s ease;
  animation: feedItemSlide 0.3s ease-out both;
}
.activity-feed-item:hover {
  background: hsl(var(--muted) / 0.5);
}
@keyframes feedItemSlide {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}
.activity-feed-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
  box-shadow: 0 0 8px var(--tw-shadow-color, currentColor);
  animation: feedDotPulse 2s ease-in-out infinite;
}
@keyframes feedDotPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.activity-feed-emoji {
  font-size: 13px;
  line-height: 1;
}
.activity-feed-text {
  font-size: 11px;
  line-height: 1.5;
}
.activity-feed-meta {
  font-size: 9px;
  color: hsl(var(--muted-foreground) / 0.6);
}
.activity-feed-revenue {
  font-size: 9px;
  font-weight: 700;
  color: #f59e0b;
}
.activity-feed-time {
  font-size: 9px;
  color: hsl(var(--muted-foreground) / 0.5);
  white-space: nowrap;
  margin-top: 2px;
}
.activity-feed-note {
  font-size: 9px;
  color: #8b5cf6;
  background: #8b5cf6 / 0.1;
  padding: 1px 6px;
  border-radius: 4px;
}

/* ===== Shop Performance Rings ===== */
.shop-rings-widget {
  background: linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.7) 100%);
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(12px);
  animation: widgetFade 0.4s ease-out;
}
.dark .shop-rings-widget {
  background: linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.4) 100%);
  border-color: hsl(var(--border) / 0.3);
}
.shop-rings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}
.shop-ring-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid hsl(var(--border) / 0.3);
  background: hsl(var(--muted) / 0.15);
  transition: all 0.25s ease;
  animation: ringItemFade 0.4s ease-out both;
}
.shop-ring-item:hover {
  background: hsl(var(--muted) / 0.3);
  border-color: hsl(var(--border) / 0.6);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
@keyframes ringItemFade {
  from { opacity: 0; transform: translateY(8px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.shop-ring-svg-wrap {
  flex-shrink: 0;
  position: relative;
}
.shop-ring-svg {
  display: block;
}
.shop-ring-progress {
  transition: stroke-dashoffset 1s ease-out;
  filter: drop-shadow(0 0 3px currentColor);
}
.shop-ring-text {
  font-family: var(--font-cairo, sans-serif);
}

/* ===== Glass Card v9 ===== */
.glass-card-v9 {
  background: linear-gradient(135deg, hsl(var(--card) / 0.85) 0%, hsl(var(--card) / 0.5) 100%);
  backdrop-filter: blur(16px);
  border: 1px solid hsl(var(--border) / 0.4);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.06);
  transition: all 0.3s ease;
}
.glass-card-v9:hover {
  box-shadow: 0 12px 40px rgba(0,0,0,0.1);
  border-color: hsl(var(--border) / 0.7);
}
.dark .glass-card-v9 {
  background: linear-gradient(135deg, hsl(var(--card) / 0.6) 0%, hsl(var(--card) / 0.25) 100%);
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

/* ===== Neon Glow Cyan ===== */
.neon-glow-cyan {
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.4), 0 0 30px rgba(6, 182, 212, 0.15);
}
.dark .neon-glow-cyan {
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.2);
}

/* ===== Gradient Text Amber ===== */
.gradient-text-amber {
  background: linear-gradient(135deg, #f59e0b, #d97706, #b45309);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== Hover Glow Cyan ===== */
.hover-glow-cyan {
  transition: box-shadow 0.3s ease;
}
.hover-glow-cyan:hover {
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.4), 0 0 35px rgba(6, 182, 212, 0.15);
}

/* ===== Shimmer v6 ===== */
.shimmer-v6 {
  position: relative;
  overflow: hidden;
}
.shimmer-v6::after {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
  animation: shimmerSlideV6 2.5s ease-in-out infinite;
}
@keyframes shimmerSlideV6 {
  0% { left: -100%; }
  100% { left: 200%; }
}

/* ===== Skeleton v8 ===== */
.skeleton-v8 {
  background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted) / 0.6) 50%, hsl(var(--muted)) 75%);
  background-size: 200% 100%;
  animation: skeletonPulseV8 1.8s ease-in-out infinite;
  border-radius: 8px;
}
@keyframes skeletonPulseV8 {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ===== Hover Underline v3 ===== */
.hover-underline-3 {
  position: relative;
  display: inline-block;
}
.hover-underline-3::after {
  content: '';
  position: absolute;
  bottom: -2px; right: 0; width: 0; height: 2px;
  background: linear-gradient(90deg, #06b6d4, #8b5cf6);
  border-radius: 1px;
  transition: width 0.3s ease;
}
.hover-underline-3:hover::after {
  width: 100%;
}

/* ===== Tag Chip Cyan ===== */
.tag-chip-cyan {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.2);
  transition: all 0.2s ease;
}
.tag-chip-cyan:hover {
  background: rgba(6, 182, 212, 0.2);
  box-shadow: 0 0 12px rgba(6, 182, 212, 0.3);
}

/* ===== Pulse Soft v3 ===== */
.pulse-soft-v3 {
  animation: pulseSoftV3 3s ease-in-out infinite;
}
@keyframes pulseSoftV3 {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.03); }
}

/* ===== Scrollbar v5 ===== */
.scrollbar-v5::-webkit-scrollbar {
  width: 5px;
}
.scrollbar-v5::-webkit-scrollbar-track {
  background: hsl(var(--muted) / 0.15);
  border-radius: 10px;
}
.scrollbar-v5::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #8b5cf6, #06b6d4);
  border-radius: 10px;
}
.scrollbar-v5::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #7c3aed, #0891b2);
}

/* ===== Focus Ring v4 ===== */
.focus-ring-v4 {
  outline: none;
}
.focus-ring-v4:focus-visible {
  outline: 2px solid #06b6d4;
  outline-offset: 2px;
  border-radius: 10px;
  box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.15);
}

/* ===== Hover Scale Bounce v2 ===== */
.hover-scale-bounce-v2 {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hover-scale-bounce-v2:hover {
  transform: scale(1.04);
}
.hover-scale-bounce-v2:active {
  transform: scale(0.97);
}

/* ===== Breathe Border v2 ===== */
.breathe-border-v2 {
  border: 1px solid hsl(var(--border));
  animation: breatheBorderV2 4s ease-in-out infinite;
}
@keyframes breatheBorderV2 {
  0%, 100% { border-color: hsl(var(--border) / 0.3); }
  50% { border-color: hsl(var(--primary) / 0.4); }
}

/* ===== Card Shine v2 ===== */
.card-shine-v2 {
  position: relative;
  overflow: hidden;
}
.card-shine-v2::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%; width: 200%; height: 200%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.06), transparent 60%);
  transform: rotate(25deg);
  transition: opacity 0.4s ease;
  opacity: 0;
  pointer-events: none;
}
.card-shine-v2:hover::before {
  opacity: 1;
}

/* ===== Hover Lift 4 ===== */
.hover-lift-4 {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hover-lift-4:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.12);
}

/* ===== Gradient Border Animated v2 ===== */
.gradient-border-animated-v2 {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
}
.gradient-border-animated-v2::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6, #f59e0b, #ef4444);
  background-size: 300% 300%;
  animation: gradientBorderRotate 6s ease infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
@keyframes gradientBorderRotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ===== Neon Glow Orange ===== */
.neon-glow-orange {
  box-shadow: 0 0 10px rgba(249, 115, 22, 0.4), 0 0 30px rgba(249, 115, 22, 0.15);
}
.dark .neon-glow-orange {
  box-shadow: 0 0 15px rgba(249, 115, 22, 0.5), 0 0 40px rgba(249, 115, 22, 0.2);
}

/* ===== Gradient Text Emerald ===== */
.gradient-text-emerald {
  background: linear-gradient(135deg, #10b981, #059669, #047857);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== Stat Mini Card Enhanced ===== */
.stat-mini-card {
  position: relative;
  overflow: hidden;
}
.stat-mini-card::before {
  content: '';
  position: absolute;
  top: 0; right: 0; width: 40px; height: 40px;
  background: radial-gradient(circle, hsl(var(--primary) / 0.08), transparent);
  pointer-events: none;
}

/* ===== Stagger Grid 20 ===== */
.stagger-grid-20 > * {
  animation: staggerFadeIn 0.3s ease-out both;
}
.stagger-grid-20 > *:nth-child(1) { animation-delay: 0ms; }
.stagger-grid-20 > *:nth-child(2) { animation-delay: 20ms; }
.stagger-grid-20 > *:nth-child(3) { animation-delay: 40ms; }
.stagger-grid-20 > *:nth-child(4) { animation-delay: 60ms; }
.stagger-grid-20 > *:nth-child(5) { animation-delay: 80ms; }

/* ===== Line Clamp 4 ===== */
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ===== Badge Bounce In v2 ===== */
.badge-bounce-in-v2 {
  animation: badgeBounceV2 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes badgeBounceV2 {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

/* ===== Dot Grid v2 (animated) ===== */
.bg-dot-grid-v2 {
  background-image: radial-gradient(circle, hsl(var(--muted-foreground) / 0.12) 1px, transparent 1px);
  background-size: 20px 20px;
  animation: dotGridShift 20s linear infinite;
}
@keyframes dotGridShift {
  0% { background-position: 0 0; }
  100% { background-position: 20px 20px; }
}

/* ===== Row Hover Glow v3 ===== */
.row-hover-glow-v3 {
  transition: all 0.25s ease;
  position: relative;
}
.row-hover-glow-v3:hover {
  background: hsl(var(--muted) / 0.4);
  box-shadow: inset 3px 0 0 #06b6d4, 0 2px 8px rgba(0,0,0,0.05);
}

/* ===== Separator Gradient v2 ===== */
.separator-gradient-v2 {
 height: 1px;
  background: linear-gradient(90deg, transparent, hsl(var(--border)), hsl(var(--primary) / 0.3), hsl(var(--border)), transparent);
  border: none;
}

/* ===== FAB Action Item Enhanced ===== */
.fab-action-item-v2 {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  transition: all 0.2s ease;
  animation: fabItemSlide 0.25s ease-out both;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.fab-action-item-v2:hover {
  transform: scale(1.04);
}
@keyframes fabItemSlide {
  from { opacity: 0; transform: translateX(20px) scale(0.9); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

/* ===== Quick Duplicate Highlight ===== */
.quick-duplicate-flash {
  animation: dupFlash 0.6s ease-out;
}
@keyframes dupFlash {
  0% { background: rgba(139, 92, 246, 0.3); }
  100% { background: transparent; }
}

/* ===== Responsive Activity Feed ===== */
@media (max-width: 640px) {
  .activity-feed-widget { padding: 12px; }
  .activity-feed-item { padding: 6px 8px; gap: 8px; }
  .activity-feed-time { display: none; }
  .activity-feed-revenue { display: none; }
  .shop-rings-grid { grid-template-columns: 1fr; }
  .shop-ring-item { padding: 6px 8px; }
}

@media (prefers-reduced-motion: reduce) {
  .activity-feed-item, .shop-ring-item, .badge-bounce-in-v2, .fab-action-item-v2, .quick-duplicate-flash {
    animation: none !important;
  }
  .activity-feed-dot { animation: none !important; }
  .shop-ring-progress { transition: none !important; }
  .bg-dot-grid-v2 { animation: none !important; }
  .pulse-soft-v3 { animation: none !important; }
  .breathe-border-v2 { animation: none !important; }
}
'''

css += new_css
write_file(CSS_FILE, css)
print(f'CSS v7.5 added successfully! Total lines: {len(css.splitlines())}')
