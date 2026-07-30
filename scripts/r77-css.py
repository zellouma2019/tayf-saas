#!/usr/bin/env python3
"""Add CSS v7.3"""

CSS_FILE = "/home/z/my-project/src/app/globals.css"

with open(CSS_FILE, 'r', encoding='utf-8') as f:
    css = f.read()

css_new = r'''
/* ===== CSS v7.3 — R77 Styling ===== */

/* Tab Pending Dot */
.tab-pending-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #f59e0b;
  display: inline-block;
  margin-inline-start: 4px;
  flex-shrink: 0;
}

/* Notes Panel Widget */
.notes-panel-widget {
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border, rgba(0,0,0,0.1));
  background: var(--card, #fff);
  animation: widgetFade 0.4s ease-out 0.15s both;
}
.notes-panel-item {
  display: block;
  width: 100%;
  text-align: right;
  padding: 0.5rem 0.625rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: slideInRight 0.25s ease-out both;
}
.notes-panel-item:hover {
  background: var(--muted, rgba(0,0,0,0.04));
  border-color: rgba(139, 92, 246, 0.15);
  transform: translateX(-2px);
}
.notes-panel-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}
.notes-panel-ref {
  font-size: 10px;
  font-family: monospace;
  font-variant-numeric: tabular-nums;
  color: #8b5cf6;
  font-weight: 600;
}
.notes-panel-text {
  font-size: 10px;
  color: var(--muted-foreground, #666);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
}

/* Enhanced pill tab with dot */
.pill-tab {
  position: relative;
}
.pill-tab .tab-pending-dot {
  animation: pulseDot 2s ease-in-out infinite;
}
@keyframes pulseDot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.6; }
}

/* Card hover lift v3 */
.hover-lift-3 {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
}
.hover-lift-3:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.06);
}

/* Gradient border animated v2 */
@keyframes gradientBorderRotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.gradient-border-animated {
  background-size: 300% 300%;
  animation: gradientBorderRotate 5s ease infinite;
}

/* Glass card v7 */
.glass-card-v7 {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px) saturate(200%);
  -webkit-backdrop-filter: blur(20px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.6);
}
@media (prefers-color-scheme: dark) {
  .glass-card-v7 {
    background: rgba(15, 23, 42, 0.55);
    border-color: rgba(255, 255, 255, 0.06);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.04);
  }
}

/* Neon glow pink */
.neon-glow-pink {
  box-shadow: 0 0 8px rgba(236, 72, 153, 0.3), 0 0 24px rgba(236, 72, 153, 0.1);
  animation: neonPulsePink 3s ease-in-out infinite;
}
@keyframes neonPulsePink {
  0%, 100% { box-shadow: 0 0 8px rgba(236, 72, 153, 0.3), 0 0 24px rgba(236, 72, 153, 0.1); }
  50% { box-shadow: 0 0 12px rgba(236, 72, 153, 0.5), 0 0 36px rgba(236, 72, 153, 0.2); }
}

/* Neon glow lime */
.neon-glow-lime {
  box-shadow: 0 0 8px rgba(132, 204, 22, 0.3), 0 0 24px rgba(132, 204, 22, 0.1);
  animation: neonPulseLime 3s ease-in-out infinite;
}
@keyframes neonPulseLime {
  0%, 100% { box-shadow: 0 0 8px rgba(132, 204, 22, 0.3), 0 0 24px rgba(132, 204, 22, 0.1); }
  50% { box-shadow: 0 0 12px rgba(132, 204, 22, 0.5), 0 0 36px rgba(132, 204, 22, 0.2); }
}

/* Gradient text pink */
.gradient-text-pink {
  background: linear-gradient(135deg, #ec4899, #f43f5e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
/* Gradient text sky */
.gradient-text-sky {
  background: linear-gradient(135deg, #0ea5e9, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Hover glow pink */
.hover-glow-pink:hover {
  box-shadow: 0 0 16px rgba(236, 72, 153, 0.25);
  transition: box-shadow 0.3s ease;
}

/* Skeleton v6 */
.skeleton-v6 {
  background: linear-gradient(90deg, var(--muted, #f0f0f0) 25%, rgba(255,255,255,0.6) 50%, var(--muted, #f0f0f0) 75%);
  background-size: 200% 100%;
  animation: skeletonWave 1.5s ease-in-out infinite;
  border-radius: 0.625rem;
}

/* Micro bounce v2 */
@keyframes microBounce2 {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.06); }
}
.micro-bounce-2 {
  animation: microBounce2 0.3s ease;
}

/* Fade up stagger */
@keyframes fadeUpStagger {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-up-stagger > * {
  animation: fadeUpStagger 0.4s ease-out both;
}
.fade-up-stagger > *:nth-child(1) { animation-delay: 0ms; }
.fade-up-stagger > *:nth-child(2) { animation-delay: 60ms; }
.fade-up-stagger > *:nth-child(3) { animation-delay: 120ms; }
.fade-up-stagger > *:nth-child(4) { animation-delay: 180ms; }
.fade-up-stagger > *:nth-child(5) { animation-delay: 240ms; }

/* Scrollbar v3 */
.scrollbar-v3::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.scrollbar-v3::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-v3::-webkit-scrollbar-thumb {
  background: var(--border, rgba(0,0,0,0.15));
  border-radius: 999px;
}
.scrollbar-v3::-webkit-scrollbar-thumb:hover {
  background: var(--muted-foreground, rgba(0,0,0,0.3));
}

/* Tag chip pink */
.tag-chip-pink {
  background: rgba(236, 72, 153, 0.1);
  color: #db2777;
  border: 1px solid rgba(236, 72, 153, 0.2);
}
.tag-chip-pink:hover {
  box-shadow: 0 0 8px rgba(236, 72, 153, 0.2);
}

/* Tag chip sky */
.tag-chip-sky {
  background: rgba(14, 165, 233, 0.1);
  color: #0284c7;
  border: 1px solid rgba(14, 165, 233, 0.2);
}
.tag-chip-sky:hover {
  box-shadow: 0 0 8px rgba(14, 165, 233, 0.2);
}

/* Hover scale bounce */
@keyframes hoverScaleBounce {
  0% { transform: scale(1); }
  40% { transform: scale(1.04); }
  100% { transform: scale(1.02); }
}
.hover-scale-bounce {
  transition: transform 0.2s ease;
}
.hover-scale-bounce:hover {
  animation: hoverScaleBounce 0.3s ease forwards;
}

/* Line clamp utilities */
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

/* Focus ring amber */
.focus-ring-amber:focus-visible {
  outline: 2px solid rgba(245, 158, 11, 0.5);
  outline-offset: 2px;
  border-radius: inherit;
}

/* Badge bounce in v2 */
@keyframes badgeBounceIn2 {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
.badge-bounce-in {
  animation: badgeBounceIn2 0.4s ease-out;
}

/* Responsive */
@media (max-width: 640px) {
  .notes-panel-text { -webkit-line-clamp: 1; }
  .hover-lift-3:hover { transform: translateY(-2px); }
}

@media (prefers-reduced-motion: reduce) {
  .tab-pending-dot, .neon-glow-pink, .neon-glow-lime, .micro-bounce-2, .hover-scale-bounce {
    animation: none;
  }
  .fade-up-stagger > * {
    animation: none;
    opacity: 1;
  }
}
'''

css = css.rstrip() + "\n" + css_new

with open(CSS_FILE, 'w', encoding='utf-8') as f:
    f.write(css)

print(f"globals.css: {len(css.splitlines())} lines (+{len(css_new.splitlines())})")
