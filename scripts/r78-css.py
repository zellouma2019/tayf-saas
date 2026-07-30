# Read the current CSS file
with open('/home/z/my-project/src/app/globals.css', 'r', encoding='utf-8') as f:
    css = f.read()

css_v74 = r'''
/* ===== CSS v7.4 — R78 Styling ===== */

/* --- Advanced Search Dialog --- */
.search-dialog-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: 12vh;
  animation: searchOverlayIn 0.15s ease-out;
}
@keyframes searchOverlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.search-dialog-container {
  width: min(640px, 92vw);
  max-height: 70vh;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px hsl(var(--border)/0.1);
  animation: searchContainerIn 0.2s ease-out;
  display: flex; flex-direction: column;
}
@keyframes searchContainerIn {
  from { opacity: 0; transform: translateY(-12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.search-dialog-input-wrap {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid hsl(var(--border)/0.5);
}
.search-dialog-icon {
  width: 18px; height: 18px; color: hsl(var(--muted-foreground));
  flex-shrink: 0;
}
.search-dialog-input {
  flex: 1; background: none; border: none; outline: none;
  font-size: 15px; color: hsl(var(--foreground));
  font-family: inherit;
}
.search-dialog-input::placeholder {
  color: hsl(var(--muted-foreground)/0.5);
}
.search-dialog-kbd {
  font-size: 10px; padding: 2px 6px;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 4px; color: hsl(var(--muted-foreground));
  font-family: inherit;
}
.search-dialog-filters {
  display: flex; gap: 6px; padding: 8px 16px;
  border-bottom: 1px solid hsl(var(--border)/0.3);
  overflow-x: auto;
}
.search-dialog-filter-btn {
  font-size: 11px; padding: 3px 10px;
  border-radius: 999px; border: 1px solid hsl(var(--border));
  background: transparent; color: hsl(var(--muted-foreground));
  cursor: pointer; white-space: nowrap;
  transition: all 0.15s;
}
.search-dialog-filter-btn:hover {
  background: hsl(var(--muted));
}
.search-dialog-filter-active {
  background: hsl(var(--accent)/0.1) !important;
  color: hsl(var(--foreground)) !important;
  font-weight: 600;
}
.search-dialog-results {
  flex: 1; overflow-y: auto; padding: 8px;
}
.search-dialog-empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 20px; gap: 8px;
}
.search-dialog-result-item {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 10px 12px;
  border-radius: 10px; border: 1px solid transparent;
  cursor: pointer; text-align: right;
  transition: all 0.12s;
  animation: searchResultIn 0.15s ease-out both;
}
@keyframes searchResultIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.search-dialog-result-item:hover,
.search-dialog-result-selected {
  background: hsl(var(--accent)/0.08);
  border-color: hsl(var(--accent)/0.2);
}
.search-dialog-result-left {
  display: flex; flex-direction: column; gap: 2px;
  min-width: 0;
}
.search-dialog-result-name {
  font-size: 13px; font-weight: 600; color: hsl(var(--foreground));
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.search-dialog-result-sub {
  font-size: 11px; color: hsl(var(--muted-foreground));
}
.search-dialog-result-right {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.search-dialog-result-service {
  max-width: 120px; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.search-dialog-result-amount {
  font-size: 12px; font-weight: 700;
}
.search-dialog-result-status {
  font-size: 10px; padding: 2px 8px;
  border-radius: 999px; color: #fff; font-weight: 600;
  white-space: nowrap;
}
.search-dialog-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid hsl(var(--border)/0.3);
}
.search-dialog-footer-hint {
  font-size: 10px; color: hsl(var(--muted-foreground)/0.5);
}
.search-dialog-footer-count {
  font-size: 10px; color: hsl(var(--muted-foreground));
  font-weight: 600; tabular-nums: true;
}

/* --- Revenue Donut Chart --- */
.donut-chart-container {
  background: hsl(var(--card)/0.8);
  border: 1px solid hsl(var(--border)/0.6);
  border-radius: 12px; padding: 12px;
}
.donut-chart-body {
  display: flex; align-items: center; gap: 16px;
}
.donut-chart-svg {
  width: 120px; height: 120px; flex-shrink: 0;
}
.donut-chart-segment {
  transition: all 0.2s ease;
  cursor: pointer;
}
.donut-chart-center-value {
  font-family: inherit;
}
.donut-chart-center-label {
  font-family: inherit;
}
.donut-chart-legend {
  flex: 1; display: flex; flex-direction: column; gap: 4px;
  min-width: 0;
}
.donut-legend-item {
  display: flex; align-items: center; gap: 6px;
  padding: 3px 6px; border-radius: 6px;
  transition: all 0.15s; cursor: default;
}
.donut-legend-item-active {
  background: hsl(var(--muted)/0.5);
}
.donut-legend-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.donut-legend-name {
  font-size: 11px; color: hsl(var(--foreground));
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  min-width: 0;
}
.donut-legend-pct {
  font-size: 10px; color: hsl(var(--muted-foreground));
  margin-right: auto; flex-shrink: 0;
}
.donut-legend-value {
  font-size: 10px; color: hsl(var(--muted-foreground)/0.7);
  flex-shrink: 0;
}

/* --- Performance Metrics Cards --- */
.perf-metrics-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
}
@media (min-width: 640px) {
  .perf-metrics-grid { grid-template-columns: repeat(4, 1fr); }
}
.perf-metric-card {
  position: relative; overflow: hidden;
  background: hsl(var(--card)/0.8);
  border: 1px solid hsl(var(--border)/0.6);
  border-radius: 12px; padding: 12px;
  display: flex; flex-direction: column; gap: 8px;
  animation: perfCardIn 0.4s ease-out both;
  transition: all 0.2s;
}
.perf-metric-card:hover {
  border-color: var(--metric-color, #8b5cf6);
  box-shadow: 0 4px 20px color-mix(in srgb, var(--metric-color, #8b5cf6) 15%, transparent);
  transform: translateY(-2px);
}
@keyframes perfCardIn {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.perf-metric-content {
  display: flex; flex-direction: column; gap: 1px;
}
.perf-metric-value {
  color: var(--metric-color, #8b5cf6);
  line-height: 1.2;
}
.perf-metric-bar-track {
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 3px; background: hsl(var(--muted)/0.3);
}
.perf-metric-bar-fill {
  height: 100%; width: 0%;
  animation: perfBarFill 1s ease-out 0.5s forwards;
  border-radius: 0 3px 0 0;
}
@keyframes perfBarFill {
  to { width: var(--bar-width, 70%); }
}

/* --- Bulk Selection Toolbar --- */
.bulk-select-toolbar {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
  padding: 10px 14px;
  background: hsl(var(--primary)/0.06);
  border: 1px solid hsl(var(--primary)/0.2);
  border-radius: 12px;
  animation: bulkToolbarIn 0.25s ease-out;
}
@keyframes bulkToolbarIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.bulk-select-info {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: hsl(var(--primary));
}
.bulk-select-actions {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.bulk-select-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; padding: 6px 12px;
  border-radius: 8px; border: none;
  cursor: pointer; font-weight: 600;
  font-family: inherit;
  transition: all 0.15s;
}
.bulk-select-btn-secondary {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}
.bulk-select-btn-secondary:hover {
  background: hsl(var(--muted)/0.8);
}
.bulk-select-btn-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
.bulk-select-btn-primary:hover {
  opacity: 0.9;
}
.bulk-select-btn-danger {
  background: hsl(var(--destructive)/0.1);
  color: hsl(var(--destructive));
}
.bulk-select-btn-danger:hover {
  background: hsl(var(--destructive)/0.2);
}
.bulk-select-status-trigger {
  width: 150px; height: 32px; font-size: 12px;
}
.bulk-row-checkbox {
  width: 15px; height: 15px; cursor: pointer;
  accent-color: hsl(var(--primary));
  border-radius: 4px;
}
.row-selected {
  position: relative;
}
.row-selected::before {
  content: '';
  position: absolute; inset: 0;
  background: hsl(var(--primary)/0.03);
  pointer-events: none;
}

/* --- Enhanced Animations --- */
@keyframes searchPulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary)/0.3); }
  50% { box-shadow: 0 0 0 6px hsl(var(--primary)/0); }
}
.search-pulse-glow {
  animation: searchPulseGlow 2s infinite;
}

@keyframes donutSegmentIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
.donut-chart-segment {
  animation: donutSegmentIn 0.5s ease-out both;
}

@keyframes metricNumberPop {
  0% { transform: scale(0.8); opacity: 0; }
  60% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
.perf-metric-value {
  animation: metricNumberPop 0.4s ease-out both;
}

/* --- Additional Styling Utilities --- */
.glass-card-v8 {
  background: hsl(var(--card)/0.6);
  backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid hsl(var(--border)/0.4);
  border-radius: 12px;
}
.dark .glass-card-v8 {
  background: hsl(var(--card)/0.3);
  border-color: hsl(var(--border)/0.2);
}

.neon-glow-amber {
  box-shadow: 0 0 15px hsl(var(--amber)/0.3), 0 0 40px hsl(var(--amber)/0.1);
}

.gradient-text-cyan {
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hover-glow-amber:hover {
  box-shadow: 0 4px 20px hsl(var(--amber)/0.2);
}

.shimmer-v5 {
  position: relative; overflow: hidden;
}
.shimmer-v5::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, hsl(var(--foreground)/0.04) 50%, transparent 100%);
  animation: shimmerSlide 2s infinite;
}
@keyframes shimmerSlide {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}

.skeleton-v7 {
  background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.6) 50%, hsl(var(--muted)) 75%);
  background-size: 200% 100%;
  animation: skeletonShimmer 1.5s infinite;
  border-radius: 8px;
}

.hover-underline-2 {
  position: relative;
}
.hover-underline-2::after {
  content: '';
  position: absolute; bottom: -2px; left: 0; right: 0;
  height: 2px; background: hsl(var(--primary));
  transform: scaleX(0); transform-origin: right;
  transition: transform 0.3s ease;
}
.hover-underline-2:hover::after {
  transform: scaleX(1);
}

.pulse-soft-v2 {
  animation: pulseSoftV2 3s infinite;
}
@keyframes pulseSoftV2 {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.tag-chip-cyan {
  background: hsl(var(--cyan)/0.1);
  color: hsl(var(--cyan));
  border: 1px solid hsl(var(--cyan)/0.2);
  font-size: 10px; padding: 2px 8px; border-radius: 999px;
  font-weight: 600; white-space: nowrap;
}

.scrollbar-v4 {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}
.scrollbar-v4::-webkit-scrollbar { width: 6px; }
.scrollbar-v4::-webkit-scrollbar-track { background: transparent; }
.scrollbar-v4::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 3px; }

.focus-ring-v3 {
 outline: none;
}
.focus-ring-v3:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
  border-radius: 8px;
}

@media (prefers-reduced-motion: reduce) {
  .search-dialog-overlay, .search-dialog-container, .search-dialog-result-item,
  .perf-metric-card, .donut-chart-segment, .bulk-select-toolbar {
    animation: none !important;
  }
  .perf-metric-bar-fill {
    animation: none !important;
    width: var(--bar-width, 70%) !important;
  }
}

/* Responsive search dialog */
@media (max-width: 640px) {
  .search-dialog-overlay { padding-top: 5vh; }
  .search-dialog-container { width: 96vw; max-height: 80vh; border-radius: 12px; }
  .donut-chart-body { flex-direction: column; }
  .donut-chart-svg { width: 100px; height: 100px; }
  .perf-metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .bulk-select-toolbar { flex-direction: column; align-items: stretch; }
  .bulk-select-actions { justify-content: center; }
}
'''

# Append to CSS file
css += css_v74

with open('/home/z/my-project/src/app/globals.css', 'w', encoding='utf-8') as f:
    f.write(css)

# Count new lines
new_lines = css_v74.count('\n')
print(f'CSS v7.4 appended: {new_lines} lines')
