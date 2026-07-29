#!/usr/bin/env python3
"""Generate CSS Round 37 for Tayf SaaS Platform - append to globals.css"""

css_content = r"""
/* ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
/* CSS Round 37 — Advanced Patterns, Print Industry, Data Viz, Forms, Navigation, Notifications, Micro-interactions, Typography   */
/* جولة CSS 37 — أنماط متقدمة، صناعة الطباعة، تصوير البيانات، النماذج، التنقل، الإشعارات، التفاعلات الصغيرة، الطباعة          */
/* ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/* 1. Advanced Card Patterns — أنماط البطاقات المتقدمة                                                                     */
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */

/* Card Spotlight — بطاقة مع تأثير بقعة ضوء تتبع الماوس */
.card-spotlight {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl, 16px);
  background-color: var(--bg-card, #ffffff);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card-spotlight::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(
    600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
    var(--spotlight-color, rgba(99, 102, 241, 0.08)),
    transparent 40%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  z-index: 1;
}
.card-spotlight:hover::before {
  opacity: 1;
}
.card-spotlight:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

/* Card Holographic — بطاقة هولوغرافية */
.card-holographic {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl, 16px);
  background: linear-gradient(
    135deg,
    var(--holo-start, #667eea) 0%,
    var(--holo-mid, #764ba2) 25%,
    var(--holo-end, #f093fb) 50%,
    var(--holo-start, #667eea) 75%,
    var(--holo-mid, #764ba2) 100%
  );
  background-size: 400% 400%;
  animation: holo-shift 8s ease infinite;
}
.card-holographic::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    125deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.1) 75%,
    transparent 100%
  );
  background-size: 200% 200%;
  animation: holo-sheen 4s ease infinite;
  pointer-events: none;
}
@keyframes holo-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes holo-sheen {
  0%, 100% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
}

/* Card Gradient Border — بطاقة بحد متدرج */
.card-gradient-border {
  position: relative;
  border-radius: var(--radius-xl, 16px);
  background: var(--bg-card, #ffffff);
  padding: 1px;
}
.card-gradient-border::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    var(--gradient-angle, 135deg),
    var(--gradient-start, #667eea),
    var(--gradient-mid, #764ba2),
    var(--gradient-end, #f093fb)
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: gradient-rotate 6s linear infinite;
}
@keyframes gradient-rotate {
  0% { --gradient-angle: 0deg; }
  100% { --gradient-angle: 360deg; }
}
@property --gradient-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
.card-gradient-border > * {
  position: relative;
  z-index: 1;
  border-radius: calc(var(--radius-xl, 16px) - 1px);
}

/* Card 3D Tilt — بطاقة بإمالة ثلاثية الأبعاد */
.card-3d-tilt {
  position: relative;
  border-radius: var(--radius-xl, 16px);
  background-color: var(--bg-card, #ffffff);
  transform-style: preserve-3d;
  perspective: 800px;
  transition: transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99),
              box-shadow 0.4s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.card-3d-tilt:hover {
  transform: rotateY(var(--tilt-x, -3deg)) rotateX(var(--tilt-y, 3deg)) translateZ(8px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
}
.card-3d-tilt__inner {
  transform: translateZ(20px);
}

/* Card Stacked — بطاقات متراصة */
.card-stacked {
  position: relative;
}
.card-stacked::before,
.card-stacked::after {
  content: "";
  position: absolute;
  left: 4px;
  right: 4px;
  height: 100%;
  border-radius: var(--radius-xl, 16px);
  background: var(--bg-card, #ffffff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.card-stacked::before {
  bottom: -4px;
  z-index: -2;
  opacity: 0.5;
}
.card-stacked::after {
  bottom: -8px;
  z-index: -3;
  opacity: 0.25;
}
.card-stacked:hover::before {
  transform: translateY(-4px);
  opacity: 0.7;
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.card-stacked:hover::after {
  transform: translateY(-8px);
  opacity: 0.4;
  transition: transform 0.3s ease, opacity 0.3s ease;
}

/* Card Morph — بطاقة تغيّر شكلها */
.card-morph {
  border-radius: var(--radius-xl, 16px);
  background-color: var(--bg-card, #ffffff);
  transition: border-radius 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.4s ease,
              transform 0.3s ease;
}
.card-morph:hover {
  border-radius: var(--radius-2xl, 24px) var(--radius-xl, 16px) var(--radius-2xl, 24px) var(--radius-xl, 16px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  transform: scale(1.02);
}

/* Card News — بطاقة خبر/مقال */
.card-news {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl, 16px);
  background-color: var(--bg-card, #ffffff);
}
.card-news__image {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.card-news__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.card-news:hover .card-news__image img {
  transform: scale(1.05);
}
.card-news__category {
  position: absolute;
  top: 12px;
  inset-inline-end: 12px;
  padding: 4px 12px;
  border-radius: var(--radius-full, 9999px);
  background: var(--accent, #6366f1);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 2;
}
.card-news__content {
  padding: 16px;
}

/* Card Ecommerce — بطاقة منتج */
.card-ecommerce {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl, 16px);
  background-color: var(--bg-card, #ffffff);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card-ecommerce:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
}
.card-ecommerce__image {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background-color: var(--bg-muted, #f5f5f5);
}
.card-ecommerce__actions {
  position: absolute;
  top: 8px;
  inset-inline-end: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transform: translateX(8px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.card-ecommerce:hover .card-ecommerce__actions {
  opacity: 1;
  transform: translateX(0);
}
.card-ecommerce__action-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full, 9999px);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.card-ecommerce__action-btn:hover {
  background: #ffffff;
  transform: scale(1.1);
}
.card-ecommerce__badge {
  position: absolute;
  top: 8px;
  inset-inline-start: 8px;
  padding: 4px 10px;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.7rem;
  font-weight: 700;
  z-index: 2;
}
.card-ecommerce__badge--sale {
  background: #ef4444;
  color: #ffffff;
}
.card-ecommerce__badge--new {
  background: #22c55e;
  color: #ffffff;
}
.card-ecommerce__body {
  padding: 14px;
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/* 2. Data Visualization Helpers — أدوات تصوير البيانات                                                                    */
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */

/* Chart Container — حاوية الرسم البياني */
.chart-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-lg, 12px);
  background-color: var(--bg-card, #ffffff);
}
.chart-container--aspect-16-9 { aspect-ratio: 16 / 9; }
.chart-container--aspect-4-3 { aspect-ratio: 4 / 3; }
.chart-container--aspect-1-1 { aspect-ratio: 1 / 1; }
.chart-container--aspect-2-1 { aspect-ratio: 2 / 1; }

/* Chart Tooltip — تلميح الرسم البياني */
.chart-tooltip {
  position: absolute;
  padding: 8px 14px;
  border-radius: var(--radius-lg, 12px);
  background-color: var(--bg-popover, #1e293b);
  color: var(--text-popover, #f8fafc);
  font-size: 0.8rem;
  line-height: 1.4;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 50;
  white-space: nowrap;
}
.chart-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--bg-popover, #1e293b);
}
.chart-tooltip__label { font-weight: 600; margin-block-end: 2px; }
.chart-tooltip__value { color: var(--accent, #6366f1); }

/* Chart Legend — وسيلة إيضاح الرسم البياني */
.chart-legend-horizontal {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  padding: 12px 16px;
}
.chart-legend-vertical {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
}
.chart-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  transition: opacity 0.2s ease;
}
.chart-legend-item:hover { opacity: 0.7; }
.chart-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full, 9999px);
  flex-shrink: 0;
}

/* Data Bar — شريط البيانات الأفقي */
.data-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.data-bar__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.85rem;
}
.data-bar__label { color: var(--text-primary, #0f172a); font-weight: 500; }
.data-bar__value { color: var(--text-secondary, #64748b); font-weight: 600; }
.data-bar__track {
  width: 100%;
  height: 8px;
  border-radius: var(--radius-full, 9999px);
  background-color: var(--bg-muted, #e2e8f0);
  overflow: hidden;
}
.data-bar__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--bar-start, #6366f1), var(--bar-end, #8b5cf6));
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Data Bar Stacked — أشرطة بيانات متراصة */
.data-bar-stacked {
  display: flex;
  gap: 2px;
  height: 24px;
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  background-color: var(--bg-muted, #e2e8f0);
}
.data-bar-stacked__segment {
  height: 100%;
  transition: width 0.6s ease;
  position: relative;
}
.data-bar-stacked__segment:hover { filter: brightness(1.1); }

/* Data Bar Animated — شريط بيانات متحرك */
.data-bar-animated .data-bar__fill {
  animation: bar-fill-slide 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
@keyframes bar-fill-slide {
  from { width: 0 !important; }
}

/* Data Summary Box — صندوق ملخص البيانات */
.data-summary {
  padding: 20px;
  border-radius: var(--radius-xl, 16px);
  background-color: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}
.data-summary:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}
.data-summary__label {
  font-size: 0.8rem;
  color: var(--text-tertiary, #94a3b8);
  font-weight: 500;
  margin-block-end: 8px;
}
.data-summary__value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  line-height: 1;
  margin-block-end: 8px;
}
.data-summary__trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full, 9999px);
}
.data-summary__trend--up { color: #16a34a; background-color: #f0fdf4; }
.data-summary__trend--down { color: #dc2626; background-color: #fef2f2; }
.data-summary__trend--neutral { color: #64748b; background-color: #f1f5f9; }

/* Data Grid — شبكة البيانات */
.data-grid-cell {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  font-size: 0.85rem;
  transition: background-color 0.15s ease;
}
.data-grid-row:hover .data-grid-cell {
  background-color: var(--bg-hover, #f8fafc);
}
.data-grid-row:nth-child(even) .data-grid-cell {
  background-color: var(--bg-stripe, #f8fafc);
}
.data-grid-row:nth-child(even):hover .data-grid-cell {
  background-color: var(--bg-hover, #f1f5f9);
}

/* Data Ring — حلقة البيانات الدائرية */
.data-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.data-ring svg { transform: rotate(-90deg); }
.data-ring__track {
  fill: none;
  stroke: var(--ring-track, #e2e8f0);
  stroke-width: var(--ring-width, 8);
}
.data-ring__fill {
  fill: none;
  stroke: var(--ring-color, #6366f1);
  stroke-width: var(--ring-width, 8);
  stroke-linecap: round;
  transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.data-ring__label {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.data-ring__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}
.data-ring__text {
  font-size: 0.75rem;
  color: var(--text-tertiary, #94a3b8);
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/* 3. Form & Input Enhancements — تحسينات النماذج والمدخلات                                                                  */
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */

/* Input Group Merged — مجموعة مدخلات مدمجة */
.input-group-merged {
  display: flex;
  border-radius: var(--radius-lg, 12px);
  overflow: hidden;
  border: 1px solid var(--border-color, #e2e8f0);
  background-color: var(--bg-input, #ffffff);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input-group-merged:focus-within {
  border-color: var(--ring-color, #6366f1);
  box-shadow: 0 0 0 3px var(--ring-color-alpha, rgba(99, 102, 241, 0.1));
}
.input-group-merged input {
  border: none;
  outline: none;
  flex: 1;
  padding: 10px 14px;
  background: transparent;
  color: var(--text-primary, #0f172a);
  font-size: 0.9rem;
}
.input-group-merged__addon {
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: var(--text-tertiary, #94a3b8);
  font-size: 0.85rem;
  border-inline-start: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-addon, #f8fafc);
  white-space: nowrap;
}
.input-group-merged__addon--prefix {
  border-inline-start: none;
  border-inline-end: 1px solid var(--border-color, #e2e8f0);
}

/* Input OTP — مدخلات رمز التحقق */
.input-otp {
  display: flex;
  gap: 8px;
  direction: ltr;
}
.input-otp__field {
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 1.25rem;
  font-weight: 700;
  border: 2px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-input, #ffffff);
  color: var(--text-primary, #0f172a);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input-otp__field:focus {
  border-color: var(--ring-color, #6366f1);
  box-shadow: 0 0 0 3px var(--ring-color-alpha, rgba(99, 102, 241, 0.1));
}
.input-otp__field--filled {
  border-color: var(--accent, #6366f1);
  background-color: var(--accent-bg, rgba(99, 102, 241, 0.05));
}

/* Input Toggle Group — مجموعة التبديل */
.input-toggle-group {
  display: inline-flex;
  padding: 4px;
  border-radius: var(--radius-lg, 12px);
  background-color: var(--bg-muted, #f1f5f9);
  gap: 2px;
}
.input-toggle-group__option {
  padding: 8px 20px;
  border-radius: var(--radius-md, 8px);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  transition: all 0.25s ease;
  border: none;
  background: transparent;
  white-space: nowrap;
}
.input-toggle-group__option:hover { color: var(--text-primary, #0f172a); }
.input-toggle-group__option--active {
  background-color: var(--bg-card, #ffffff);
  color: var(--text-primary, #0f172a);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* Input Slider Custom — شريط تمرير مخصص */
.input-slider-custom {
  position: relative;
  width: 100%;
}
.input-slider-custom input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: var(--radius-full, 9999px);
  background: var(--bg-muted, #e2e8f0);
  outline: none;
  cursor: pointer;
}
.input-slider-custom input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent, #6366f1);
  border: 3px solid var(--bg-card, #ffffff);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.input-slider-custom input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}
.input-slider-custom input[type="range"]::-moz-range-thumb {
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--accent, #6366f1); border: 3px solid var(--bg-card, #ffffff);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3); cursor: pointer;
}
.input-slider-custom__labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--text-tertiary, #94a3b8);
}

/* Input File Styled — مدخل ملف منسّق */
.input-file-styled {
  position: relative;
  border: 2px dashed var(--border-color, #d1d5db);
  border-radius: var(--radius-xl, 16px);
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease, background-color 0.3s ease;
  background-color: var(--bg-card, #ffffff);
}
.input-file-styled:hover,
.input-file-styled--dragover {
  border-color: var(--accent, #6366f1);
  background-color: var(--accent-bg, rgba(99, 102, 241, 0.04));
}
.input-file-styled__icon { font-size: 2rem; margin-block-end: 12px; }
.input-file-styled__text { font-size: 0.9rem; color: var(--text-secondary, #64748b); }
.input-file-styled__hint { font-size: 0.75rem; color: var(--text-tertiary, #94a3b8); margin-block-start: 4px; }

/* Input Tags — مدخل وسوم */
.input-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  background-color: var(--bg-input, #ffffff);
  min-height: 44px;
  align-items: center;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input-tags:focus-within {
  border-color: var(--ring-color, #6366f1);
  box-shadow: 0 0 0 3px var(--ring-color-alpha, rgba(99, 102, 241, 0.1));
}
.input-tags__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-full, 9999px);
  background: var(--accent-bg, rgba(99, 102, 241, 0.1));
  color: var(--accent, #6366f1);
  font-size: 0.8rem;
  font-weight: 500;
}
.input-tags__tag-remove {
  cursor: pointer; opacity: 0.6; transition: opacity 0.2s ease;
  border: none; background: none; padding: 0; font-size: 1rem; line-height: 1;
}
.input-tags__tag-remove:hover { opacity: 1; }
.input-tags__input {
  border: none; outline: none; flex: 1; min-width: 120px; padding: 4px 0;
  font-size: 0.85rem; background: transparent; color: var(--text-primary, #0f172a);
}

/* Input Rating Stars — تقييم بالنجوم */
.input-rating-stars {
  display: inline-flex;
  gap: 4px;
  direction: ltr;
}
.input-rating-stars__star {
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s ease, color 0.2s ease;
  color: var(--border-color, #d1d5db);
}
.input-rating-stars__star:hover { transform: scale(1.2); }
.input-rating-stars__star--active { color: #f59e0b; }

/* Form Section — قسم نموذج */
.form-section {
  padding-block: 20px;
  border-block-end: 1px solid var(--border-color, #e2e8f0);
}
.form-section__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  margin-block-end: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.form-section__title::after {
  content: "";
  flex: 1;
  height: 1px;
  background-color: var(--border-color, #e2e8f0);
  margin-inline-start: 12px;
}

/* Form Step Indicator — مؤشر خطوات النموذج */
.form-step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 100%;
  padding: 16px 0;
}
.form-step-indicator__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}
.form-step-indicator__circle {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 600;
  border: 2px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  color: var(--text-secondary, #64748b);
  transition: all 0.3s ease;
}
.form-step-indicator__step--active .form-step-indicator__circle {
  border-color: var(--accent, #6366f1);
  background: var(--accent, #6366f1);
  color: #ffffff;
  box-shadow: 0 0 0 4px var(--accent-bg, rgba(99, 102, 241, 0.2));
}
.form-step-indicator__step--completed .form-step-indicator__circle {
  border-color: #22c55e; background: #22c55e; color: #ffffff;
}
.form-step-indicator__label {
  font-size: 0.75rem; color: var(--text-tertiary, #94a3b8); font-weight: 500;
  transition: color 0.3s ease;
}
.form-step-indicator__step--active .form-step-indicator__label {
  color: var(--accent, #6366f1); font-weight: 600;
}
.form-step-indicator__line {
  flex: 1; height: 2px; background-color: var(--border-color, #e2e8f0);
  margin: 0 -8px; align-self: flex-start; margin-top: 17px;
  transition: background-color 0.3s ease;
}
.form-step-indicator__line--completed { background-color: #22c55e; }

/* Input Autocomplete — مدخل إكمال تلقائي */
.input-autocomplete { position: relative; }
.input-autocomplete__dropdown {
  position: absolute; top: 100%; inset-inline: 0; margin-top: 4px;
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 50; max-height: 240px; overflow-y: auto;
}
.input-autocomplete__option {
  padding: 10px 14px; font-size: 0.85rem; cursor: pointer;
  transition: background-color 0.15s ease; color: var(--text-primary, #0f172a);
}
.input-autocomplete__option:hover,
.input-autocomplete__option--highlighted {
  background-color: var(--accent-bg, rgba(99, 102, 241, 0.08));
}

/* Input Color Picker — منتقي الألوان */
.input-color-picker { display: flex; align-items: center; gap: 10px; }
.input-color-picker__swatch {
  width: 36px; height: 36px; border-radius: var(--radius-md, 8px);
  border: 2px solid var(--border-color, #e2e8f0); cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.input-color-picker__swatch:hover { transform: scale(1.1); border-color: var(--accent, #6366f1); }

/* Input Date Range — مدخل نطاق تاريخ */
.input-date-range { display: flex; align-items: center; gap: 8px; }
.input-date-range input {
  flex: 1; padding: 10px 14px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-input, #ffffff);
  color: var(--text-primary, #0f172a);
  font-size: 0.85rem; outline: none;
  transition: border-color 0.2s ease;
}
.input-date-range input:focus {
  border-color: var(--ring-color, #6366f1);
  box-shadow: 0 0 0 3px var(--ring-color-alpha, rgba(99, 102, 241, 0.1));
}
.input-date-range__separator { color: var(--text-tertiary, #94a3b8); font-size: 0.85rem; }

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/* 4. Navigation Patterns — أنماط التنقل                                                                                 */
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */

/* Breadcrumb — مسار التنقل */
.nav-breadcrumb {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.85rem; color: var(--text-tertiary, #94a3b8);
  padding: 8px 0; flex-wrap: wrap;
}
.nav-breadcrumb__item { display: flex; align-items: center; gap: 8px; }
.nav-breadcrumb__link { color: var(--text-secondary, #64748b); text-decoration: none; transition: color 0.2s ease; }
.nav-breadcrumb__link:hover { color: var(--accent, #6366f1); }
.nav-breadcrumb__current { color: var(--text-primary, #0f172a); font-weight: 600; }
.nav-breadcrumb__separator { color: var(--text-tertiary, #94a3b8); font-size: 0.7rem; }

/* Tabs Vertical — تبويبات عمودية */
.nav-tabs-vertical {
  display: flex; flex-direction: column; gap: 2px;
  border-inline-end: 1px solid var(--border-color, #e2e8f0);
  padding-inline-end: 16px;
}
.nav-tabs-vertical__tab {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-radius: var(--radius-lg, 12px);
  font-size: 0.85rem; color: var(--text-secondary, #64748b);
  cursor: pointer; transition: all 0.2s ease;
  border: none; background: transparent; text-align: start; width: 100%;
}
.nav-tabs-vertical__tab:hover { background-color: var(--bg-hover, #f8fafc); color: var(--text-primary, #0f172a); }
.nav-tabs-vertical__tab--active {
  background-color: var(--accent-bg, rgba(99, 102, 241, 0.08));
  color: var(--accent, #6366f1); font-weight: 600;
}

/* Tabs Pill — تبويبات حبوبية */
.nav-tabs-pill {
  display: inline-flex; gap: 4px; padding: 4px;
  border-radius: var(--radius-full, 9999px);
  background-color: var(--bg-muted, #f1f5f9);
}
.nav-tabs-pill__tab {
  padding: 8px 20px; border-radius: var(--radius-full, 9999px);
  font-size: 0.85rem; font-weight: 500;
  color: var(--text-secondary, #64748b); cursor: pointer;
  border: none; background: transparent;
  transition: all 0.25s ease; white-space: nowrap;
}
.nav-tabs-pill__tab:hover { color: var(--text-primary, #0f172a); }
.nav-tabs-pill__tab--active {
  background-color: var(--bg-card, #ffffff);
  color: var(--text-primary, #0f172a); font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

/* Mega Menu — قائمة ميغا */
.nav-mega-menu {
  position: absolute; top: 100%; inset-inline-start: 0;
  width: min(600px, calc(100vw - 32px)); padding: 24px;
  border-radius: var(--radius-xl, 16px);
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  opacity: 0; visibility: hidden; transform: translateY(8px);
  transition: opacity 0.25s ease, transform 0.25s ease, visibility 0.25s ease;
  z-index: 100;
}
.nav-mega-menu--open { opacity: 1; visibility: visible; transform: translateY(0); }
.nav-mega-menu__grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px;
}
.nav-mega-menu__item {
  display: flex; flex-direction: column; gap: 6px;
  padding: 12px; border-radius: var(--radius-lg, 12px);
  transition: background-color 0.2s ease;
  text-decoration: none; color: var(--text-primary, #0f172a);
}
.nav-mega-menu__item:hover { background-color: var(--bg-hover, #f8fafc); }
.nav-mega-menu__item-icon { font-size: 1.5rem; }
.nav-mega-menu__item-title { font-weight: 600; font-size: 0.9rem; }
.nav-mega-menu__item-desc { font-size: 0.75rem; color: var(--text-tertiary, #94a3b8); }

/* Stepper Horizontal — خطوات أفقية */
.nav-stepper-horizontal {
  display: flex; align-items: center; width: 100%; padding: 20px 0;
}
.nav-stepper-horizontal__step {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; flex: 1; position: relative;
}
.nav-stepper-horizontal__circle {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.9rem;
  border: 2px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff); color: var(--text-secondary, #64748b);
  transition: all 0.3s ease; position: relative; z-index: 2;
}
.nav-stepper-horizontal__step--active .nav-stepper-horizontal__circle {
  border-color: var(--accent, #6366f1);
  background: var(--accent, #6366f1); color: #ffffff;
  box-shadow: 0 0 0 4px var(--accent-bg, rgba(99, 102, 241, 0.15));
}
.nav-stepper-horizontal__step--completed .nav-stepper-horizontal__circle {
  border-color: #22c55e; background: #22c55e; color: #ffffff;
}
.nav-stepper-horizontal__connector {
  position: absolute; top: 20px;
  left: calc(50% + 20px); right: calc(-50% + 20px);
  height: 2px; background: var(--border-color, #e2e8f0); z-index: 1;
}
.nav-stepper-horizontal__connector--completed { background: #22c55e; }
.nav-stepper-horizontal__label {
  font-size: 0.8rem; color: var(--text-tertiary, #94a3b8);
  text-align: center; font-weight: 500;
}
.nav-stepper-horizontal__step--active .nav-stepper-horizontal__label {
  color: var(--accent, #6366f1); font-weight: 600;
}

/* Stepper Vertical — خطوات عمودية */
.nav-stepper-vertical { display: flex; flex-direction: column; gap: 0; padding: 8px 0; }
.nav-stepper-vertical__step { display: flex; gap: 16px; position: relative; padding-block: 12px 24px; }
.nav-stepper-vertical__line {
  position: absolute; top: 36px; bottom: 0; left: 15px;
  width: 2px; background: var(--border-color, #e2e8f0);
}
.nav-stepper-vertical__line--completed { background: #22c55e; }
.nav-stepper-vertical__circle {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
  border: 2px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff); color: var(--text-secondary, #64748b);
  z-index: 2; transition: all 0.3s ease;
}
.nav-stepper-vertical__step--active .nav-stepper-vertical__circle {
  border-color: var(--accent, #6366f1); background: var(--accent, #6366f1); color: #ffffff;
}
.nav-stepper-vertical__step--completed .nav-stepper-vertical__circle {
  border-color: #22c55e; background: #22c55e; color: #ffffff;
}
.nav-stepper-vertical__content { padding-block-start: 4px; }
.nav-stepper-vertical__title { font-weight: 600; font-size: 0.9rem; color: var(--text-primary, #0f172a); }
.nav-stepper-vertical__desc { font-size: 0.8rem; color: var(--text-tertiary, #94a3b8); margin-block-start: 2px; }

/* Sticky Glass Nav — تنقل زجاجي ثابت */
.nav-sticky-glass {
  position: sticky; top: 0; z-index: 50;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-block-end: 1px solid rgba(226, 232, 240, 0.6);
}

/* Fullscreen Overlay Nav — تنقل شاشة كاملة */
.nav-fullscreen-overlay {
  position: fixed; inset: 0;
  background: var(--bg-card, #ffffff); z-index: 200;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px;
  opacity: 0; visibility: hidden;
  transition: opacity 0.4s ease, visibility 0.4s ease;
}
.nav-fullscreen-overlay--open { opacity: 1; visibility: visible; }
.nav-fullscreen-overlay__link {
  font-size: 2rem; font-weight: 700;
  color: var(--text-primary, #0f172a); text-decoration: none;
  transition: color 0.2s ease;
}
.nav-fullscreen-overlay__link:hover { color: var(--accent, #6366f1); }

/* Floating Nav — تنقل عائم */
.nav-floating {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  padding: 8px; border-radius: var(--radius-full, 9999px);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex; gap: 4px; z-index: 50;
}
.nav-floating__item {
  padding: 10px 20px; border-radius: var(--radius-full, 9999px);
  font-size: 0.85rem; font-weight: 500;
  color: var(--text-secondary, #64748b); cursor: pointer;
  border: none; background: transparent;
  transition: all 0.25s ease; white-space: nowrap;
}
.nav-floating__item:hover { background-color: var(--bg-hover, #f1f5f9); color: var(--text-primary, #0f172a); }
.nav-floating__item--active { background-color: var(--accent, #6366f1); color: #ffffff; }

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/* 5. Notification & Feedback — الإشعارات والتعليقات                                                                        */
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */

/* Badge Notification Dot — شارة نقطة إشعار */
.badge-notification-dot { position: relative; }
.badge-notification-dot::after {
  content: ""; position: absolute; top: -2px; inset-inline-end: -2px;
  width: 10px; height: 10px; border-radius: 50%;
  background: #ef4444; border: 2px solid var(--bg-card, #ffffff);
  animation: dot-pulse 2s infinite;
}
@keyframes dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.15); }
}

/* Badge Counter — شارة عداد */
.badge-counter { position: relative; }
.badge-counter::after {
  content: var(--badge-count, "0");
  position: absolute; top: -6px; inset-inline-end: -8px;
  min-width: 18px; height: 18px; border-radius: var(--radius-full, 9999px);
  background: #ef4444; color: #ffffff; font-size: 0.65rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  padding: 0 5px; border: 2px solid var(--bg-card, #ffffff);
}

/* Status Indicators — مؤشرات الحالة */
.badge-status-online::before {
  content: ""; display: inline-block; width: 8px; height: 8px;
  border-radius: 50%; background: #22c55e; margin-inline-end: 6px;
  animation: status-blink 2s infinite;
}
.badge-status-busy::before {
  content: ""; display: inline-block; width: 8px; height: 8px;
  border-radius: 50%; background: #f59e0b; margin-inline-end: 6px;
}
.badge-status-offline::before {
  content: ""; display: inline-block; width: 8px; height: 8px;
  border-radius: 50%; background: #94a3b8; margin-inline-end: 6px;
}
@keyframes status-blink {
  0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
}

/* Toast Stack — حزمة التنبيهات */
.toast-stack {
  position: fixed; bottom: 24px; inset-inline-end: 24px;
  display: flex; flex-direction: column-reverse; gap: 8px;
  z-index: 1000; max-width: 380px; width: 100%;
}
.toast-stack__item {
  padding: 14px 18px; border-radius: var(--radius-lg, 12px);
  background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  display: flex; align-items: flex-start; gap: 12px;
  animation: toast-in 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
}
.toast-stack__item--removing { animation: toast-out 0.25s ease forwards; }
@keyframes toast-in {
  from { opacity: 0; transform: translateY(16px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(8px) scale(0.95); }
}

/* Toast with Progress Bar — تنبيه مع شريط تقدم */
.toast-progress-bar { position: relative; overflow: hidden; }
.toast-progress-bar::after {
  content: ""; position: absolute; bottom: 0; inset-inline: 0; height: 3px;
  background: var(--accent, #6366f1);
  animation: toast-progress var(--toast-duration, 5s) linear forwards;
  transform-origin: bottom;
}
@keyframes toast-progress {
  from { transform: scaleX(1); } to { transform: scaleX(0); }
}

/* Tooltip Multiline — تلميح متعدد الأسطر */
.tooltip-multiline { position: relative; display: inline-block; }
.tooltip-multiline::after {
  content: attr(data-tooltip);
  position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
  padding: 8px 14px; border-radius: var(--radius-lg, 12px);
  background: var(--bg-popover, #1e293b); color: var(--text-popover, #f8fafc);
  font-size: 0.8rem; line-height: 1.5; max-width: 260px;
  white-space: normal; text-align: center;
  opacity: 0; visibility: hidden; transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 100; pointer-events: none;
}
.tooltip-multiline:hover::after { opacity: 1; visibility: visible; }

/* Skeleton Patterns — أنماط الهيكل العظمي */
.skeleton-shimmer {
  background: linear-gradient(90deg, var(--bg-muted, #e2e8f0) 25%, var(--bg-shimmer, #f0f0f0) 50%, var(--bg-muted, #e2e8f0) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.8s ease infinite;
  border-radius: var(--radius-md, 8px);
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skeleton-card {
  border-radius: var(--radius-xl, 16px); overflow: hidden;
  background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0);
}
.skeleton-card__image { width: 100%; aspect-ratio: 16 / 9; }
.skeleton-card__title { width: 70%; height: 16px; margin: 16px 16px 8px; }
.skeleton-card__text { width: 100%; height: 12px; margin: 0 16px 12px; }
.skeleton-card__text--short { width: 50%; }
.skeleton-table { width: 100%; }
.skeleton-table__row {
  display: flex; gap: 16px; padding: 12px 16px;
  border-block-end: 1px solid var(--border-color, #e2e8f0);
}
.skeleton-table__header {
  display: flex; gap: 16px; padding: 12px 16px;
  border-block-end: 2px solid var(--border-color, #e2e8f0);
  background: var(--bg-muted, #f1f5f9);
}
.skeleton-table__cell { height: 14px; border-radius: var(--radius-sm, 4px); }

/* Badge Progress — شارة التقدم */
.badge-progress {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: var(--radius-full, 9999px);
  font-size: 0.75rem; font-weight: 600;
}
.badge-progress--low { background: #fef2f2; color: #dc2626; }
.badge-progress--medium { background: #fefce8; color: #ca8a04; }
.badge-progress--high { background: #f0fdf4; color: #16a34a; }

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/* 6. Layout & Grid Patterns — أنماط التخطيط والشبكة                                                                       */
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */

.grid-masonry { columns: 3; column-gap: 16px; }
.grid-masonry > * { break-inside: avoid; margin-block-end: 16px; }

.grid-auto-fill-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--grid-min, 280px), 1fr));
  gap: var(--grid-gap, 16px);
}

.grid-dashlet { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.grid-dashlet > :first-child { grid-column: span 2; }

.layout-split-screen { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
.layout-split-screen__panel { display: flex; flex-direction: column; justify-content: center; padding: 40px; }

.layout-overlay-panel {
  position: fixed; top: 0; inset-inline-end: 0; bottom: 0;
  width: min(420px, 85vw); background: var(--bg-card, #ffffff);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.1); z-index: 100;
  transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto; padding: 24px;
}
.layout-overlay-panel--open { transform: translateX(0); }

.layout-horizontal-scroll-snap {
  display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
  gap: 16px; -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.layout-horizontal-scroll-snap::-webkit-scrollbar { display: none; }
.layout-horizontal-scroll-snap > * { scroll-snap-align: start; flex-shrink: 0; }

.layout-fullscreen-hero {
  min-height: 100vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center;
  padding: 40px 20px; position: relative; overflow: hidden;
}

.grid-sidebar-content {
  display: grid; grid-template-columns: var(--sidebar-width, 280px) 1fr; gap: 0; min-height: 100vh;
}

.layout-with-aside {
  display: grid; grid-template-columns: 1fr var(--aside-width, 320px); gap: 24px; align-items: start;
}

.grid-media {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;
}
.grid-media--portrait {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  grid-auto-rows: 260px;
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/* 7. Print & Document Industry Specific — خاص بصناعة الطباعة والمستندات                                                    */
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */

.print-preview-page {
  position: relative; background: #ffffff; border-radius: 2px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.print-preview-page--a4 { aspect-ratio: 210 / 297; max-width: 595px; }
.print-preview-page--a3 { aspect-ratio: 297 / 420; max-width: 842px; }
.print-preview-page--letter { aspect-ratio: 8.5 / 11; max-width: 612px; }
.print-preview-page__margins {
  position: absolute; inset: 10%;
  border: 1px dashed rgba(0, 0, 0, 0.1); pointer-events: none;
}

.print-spec-card {
  padding: 16px; border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
  display: flex; flex-direction: column; gap: 12px;
}
.print-spec-card__row { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; }
.print-spec-card__label { color: var(--text-tertiary, #94a3b8); }
.print-spec-card__value { font-weight: 600; color: var(--text-primary, #0f172a); }

.binding-preview { position: relative; display: flex; align-items: center; gap: 0; perspective: 600px; }
.binding-preview__page {
  width: 60px; height: 80px; background: #f8fafc;
  border: 1px solid #e2e8f0; position: relative; transition: transform 0.3s ease;
}
.binding-preview__page:first-child { border-radius: 4px 0 0 4px; }
.binding-preview__page:last-child { border-radius: 0 4px 4px 0; }
.binding-preview--spiral .binding-preview__page { margin-inline-end: -8px; }
.binding-preview--spiral::before {
  content: ""; position: absolute; top: 8px; bottom: 8px;
  left: calc(50% - 1px); width: 2px; background: #64748b; z-index: 2;
}
.binding-preview--staple::after {
  content: " staples "; position: absolute; top: -8px; left: 50%;
  transform: translateX(-50%); font-size: 0.6rem; color: #94a3b8;
}
.binding-preview--perfect { gap: 2px; }
.binding-preview--perfect::after {
  content: ""; position: absolute; top: 10px; bottom: 10px;
  left: calc(50% - 3px); width: 6px; background: #1e293b; border-radius: 2px; z-index: 2;
}

.color-separation-preview { display: flex; gap: 4px; height: 32px; border-radius: var(--radius-md, 8px); overflow: hidden; }
.color-separation-preview__channel {
  height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 700; color: #ffffff; flex: 1;
}
.color-separation-preview__channel--c { background: #00a0e9; }
.color-separation-preview__channel--m { background: #ed1c24; }
.color-separation-preview__channel--y { background: #fff200; color: #333; }
.color-separation-preview__channel--k { background: #1e293b; }

.trim-mark-overlay { position: absolute; inset: 0; pointer-events: none; }
.trim-mark-overlay::before,
.trim-mark-overlay::after {
  content: ""; position: absolute; background: rgba(0, 0, 0, 0.3);
}
.trim-mark-overlay::before {
  top: 0; left: 50%; transform: translateX(-50%);
  width: 1px; height: 16px;
  box-shadow: calc(var(--bleed, 12px)) 0 0 0 rgba(0, 0, 0, 0.3),
              calc(var(--bleed, 12px) * 2) 0 0 0 rgba(0, 0, 0, 0.3);
}
.trim-mark-overlay::after {
  left: 0; top: 50%; transform: translateY(-50%);
  height: 1px; width: 16px;
  box-shadow: 0 calc(var(--bleed, 12px)) 0 0 rgba(0, 0, 0, 0.3),
              0 calc(var(--bleed, 12px) * 2) 0 0 rgba(0, 0, 0, 0.3);
}

.paper-texture--smooth {
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
}
.paper-texture--linen {
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
}
.paper-texture--laid {
  background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.015) 2px, rgba(0, 0, 0, 0.015) 3px);
}
.paper-texture--vellum {
  background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
}
.paper-texture--kraft {
  background-color: #d4c5a9;
  background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
}

.ink-coverage-indicator {
  display: flex; gap: 4px; height: 8px;
  border-radius: var(--radius-full, 9999px); overflow: hidden; background: #e2e8f0;
}
.ink-coverage-indicator__segment { height: 100%; transition: width 0.5s ease; }

.proof-stamp {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  padding: 12px 32px; border: 4px double;
  border-radius: var(--radius-lg, 12px);
  font-size: 1.5rem; font-weight: 900; text-transform: uppercase;
  letter-spacing: 4px; opacity: 0.4; pointer-events: none;
}
.proof-stamp--approved { border-color: #22c55e; color: #22c55e; }
.proof-stamp--rejected { border-color: #ef4444; color: #ef4444; }
.proof-stamp--pending { border-color: #f59e0b; color: #f59e0b; }

.fold-guide { position: absolute; pointer-events: none; }
.fold-guide--half { top: 0; bottom: 0; left: 50%; width: 1px; border-top: 1px dashed rgba(0, 0, 0, 0.2); border-bottom: 1px dashed rgba(0, 0, 0, 0.2); }

.print-job-ticket {
  padding: 16px; border: 2px solid var(--border-color, #e2e8f0);
  border-radius: var(--radius-lg, 12px); position: relative;
  background: var(--bg-card, #ffffff);
}
.print-job-ticket::before {
  content: ""; position: absolute; top: -1px; left: 20%; right: 20%;
  height: 0; border-top: 2px dashed var(--border-color, #e2e8f0);
}
.print-job-ticket__header {
  display: flex; justify-content: space-between; align-items: center;
  margin-block-end: 12px; padding-block-end: 12px;
  border-block-end: 1px dashed var(--border-color, #e2e8f0);
}
.print-job-ticket__id { font-weight: 700; font-size: 0.85rem; color: var(--text-primary, #0f172a); }
.print-job-ticket__priority {
  padding: 2px 10px; border-radius: var(--radius-full, 9999px);
  font-size: 0.7rem; font-weight: 700;
}
.print-job-ticket__priority--urgent { background: #fef2f2; color: #dc2626; }
.print-job-ticket__priority--high { background: #fefce8; color: #ca8a04; }
.print-job-ticket__priority--normal { background: #f0fdf4; color: #16a34a; }

.color-pantone-swatch {
  display: flex; align-items: center; gap: 10px; padding: 8px;
  border-radius: var(--radius-md, 8px); border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-card, #ffffff);
}
.color-pantone-swatch__color {
  width: 40px; height: 40px; border-radius: var(--radius-md, 8px); flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
}
.color-pantone-swatch__info { display: flex; flex-direction: column; gap: 2px; }
.color-pantone-swatch__name { font-weight: 600; font-size: 0.85rem; color: var(--text-primary, #0f172a); }
.color-pantone-swatch__code { font-size: 0.75rem; color: var(--text-tertiary, #94a3b8); }

.gang-sheet-layout {
  display: grid; grid-template-columns: repeat(var(--gang-cols, 3), 1fr);
  gap: 8px; padding: 16px; background: #f8fafc;
  border-radius: var(--radius-lg, 12px); border: 1px dashed var(--border-color, #e2e8f0);
}
.gang-sheet-layout__item {
  aspect-ratio: 1; border-radius: var(--radius-sm, 4px);
  background: var(--bg-card, #ffffff); border: 1px solid var(--border-color, #e2e8f0);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; color: var(--text-tertiary, #94a3b8);
}

.bleed-indicator { position: relative; }
.bleed-indicator::before {
  content: ""; position: absolute; inset: -3px;
  border: 1px dashed rgba(239, 68, 68, 0.3); border-radius: inherit; pointer-events: none;
}
.bleed-indicator::after {
  content: ""; position: absolute; inset: 3px;
  border: 1px solid rgba(34, 197, 94, 0.3); border-radius: inherit; pointer-events: none;
}

.imposition-layout {
  display: grid; gap: 0; background: var(--bg-muted, #e2e8f0);
  padding: 2px; border-radius: var(--radius-md, 8px);
}
.imposition-layout--2x2 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
.imposition-layout--2x1 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; }
.imposition-layout__page {
  background: var(--bg-card, #ffffff); margin: 2px; aspect-ratio: 210 / 297;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; color: var(--text-tertiary, #94a3b8); border-radius: 2px;
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/* 8. Micro-interactions & State CSS — التفاعلات الصغيرة وحالات CSS                                                           */
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */

.state-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 24px; text-align: center; gap: 16px;
}
.state-empty__icon { font-size: 3rem; opacity: 0.5; }
.state-empty__title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary, #0f172a); }
.state-empty__description { font-size: 0.85rem; color: var(--text-tertiary, #94a3b8); max-width: 320px; }

.state-error {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 24px; text-align: center; gap: 16px;
}
.state-error__icon { font-size: 3rem; animation: error-shake 0.5s ease; }
@keyframes error-shake {
  0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); } 60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.state-success {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 24px; text-align: center; gap: 16px;
}
.state-success__icon { font-size: 3rem; animation: success-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes success-pop {
  0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; }
}

.state-loading-circular {
  display: inline-block; width: var(--loader-size, 32px); height: var(--loader-size, 32px);
  border: 3px solid var(--loader-track, #e2e8f0); border-top-color: var(--loader-color, #6366f1);
  border-radius: 50%; animation: loader-spin 0.7s linear infinite;
}
@keyframes loader-spin { to { transform: rotate(360deg); } }

.state-loading-dots { display: inline-flex; gap: 6px; align-items: center; }
.state-loading-dots__dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent, #6366f1); animation: dot-bounce 1.4s ease infinite;
}
.state-loading-dots__dot:nth-child(2) { animation-delay: 0.16s; }
.state-loading-dots__dot:nth-child(3) { animation-delay: 0.32s; }
@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.hover-card-lift {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
}
.hover-card-lift:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12); }

.hover-glow { transition: box-shadow 0.3s ease; }
.hover-glow:hover {
  box-shadow: 0 0 20px var(--glow-color, rgba(99, 102, 241, 0.3)),
              0 0 40px var(--glow-color, rgba(99, 102, 241, 0.15));
}

.hover-underline-grow { position: relative; display: inline-block; }
.hover-underline-grow::after {
  content: ""; position: absolute; bottom: -2px; left: 50%; width: 0; height: 2px;
  background: var(--accent, #6366f1); transition: width 0.3s ease, left 0.3s ease;
}
.hover-underline-grow:hover::after { width: 100%; left: 0; }

.hover-icon-bounce { display: inline-block; transition: transform 0.2s ease; }
.hover-icon-bounce:hover { animation: icon-bounce 0.6s ease; }
@keyframes icon-bounce {
  0%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); }
  50% { transform: translateY(-2px); } 70% { transform: translateY(-4px); }
}

.focus-ring-custom:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring-color, #6366f1),
              0 0 0 5px var(--ring-color-alpha, rgba(99, 102, 241, 0.2));
  border-radius: inherit;
}

.active-press { transition: transform 0.15s ease; }
.active-press:active { transform: scale(0.97); }

.disabled-blur { opacity: 0.5; filter: blur(1px); pointer-events: none; user-select: none; }

.selected-highlight {
  background-color: var(--accent-bg, rgba(99, 102, 241, 0.08));
  border-color: var(--accent, #6366f1) !important;
  box-shadow: 0 0 0 2px var(--accent-alpha, rgba(99, 102, 241, 0.15));
}

.drag-ghost { opacity: 0.8; transform: rotate(3deg); box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15); }

.drop-target-active { border: 2px dashed var(--accent, #6366f1); background-color: var(--accent-bg, rgba(99, 102, 241, 0.04)); }

.expand-collapse { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.35s ease; }
.expand-collapse--open { grid-template-rows: 1fr; }
.expand-collapse > * { overflow: hidden; }

.resizable-handle {
  width: 100%; height: 6px; cursor: row-resize;
  display: flex; align-items: center; justify-content: center; position: relative;
}
.resizable-handle::after {
  content: ""; width: 40px; height: 3px;
  border-radius: var(--radius-full, 9999px); background: var(--border-color, #d1d5db);
  transition: background-color 0.2s ease;
}
.resizable-handle:hover::after { background: var(--accent, #6366f1); }

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/* 9. Typography Enhancements — تحسينات الطباعة                                                                             */
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */

.text-gradient {
  background: linear-gradient(135deg, var(--gradient-from, #6366f1), var(--gradient-to, #8b5cf6));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.text-gradient--accent {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.text-gradient--emerald {
  background: linear-gradient(135deg, #10b981, #06b6d4);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

.text-outline { -webkit-text-stroke: 1.5px var(--text-primary, #0f172a); -webkit-text-fill-color: transparent; }
.text-shadow-soft { text-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); }
.text-shadow-glow { text-shadow: 0 0 10px var(--glow-color, rgba(99, 102, 241, 0.4)), 0 0 20px var(--glow-color, rgba(99, 102, 241, 0.2)); }
.text-shadow-retro { text-shadow: 3px 3px 0 var(--retro-color, #e2e8f0), 6px 6px 0 rgba(0, 0, 0, 0.05); }

.text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.text-truncate-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.text-truncate-4 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.text-truncate-5 { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }

.text-highlight-marker {
  background: linear-gradient(120deg, transparent 0%, transparent 40%, rgba(250, 204, 21, 0.3) 40%, rgba(250, 204, 21, 0.3) 100%);
  padding-inline: 2px;
}

.heading-display {
  font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800;
  line-height: 1.1; letter-spacing: -0.02em; color: var(--text-primary, #0f172a);
}

.heading-section {
  font-size: 1.25rem; font-weight: 700; color: var(--text-primary, #0f172a);
  display: flex; align-items: center; gap: 12px; margin-block-end: 16px;
}
.heading-section::after {
  content: ""; flex: 1; height: 2px;
  background: linear-gradient(90deg, var(--accent, #6366f1), transparent);
}

.heading-accent { position: relative; display: inline-block; }
.heading-accent::after {
  content: ""; position: absolute; bottom: -4px; inset-inline-start: 0;
  width: 40%; height: 3px; background: var(--accent, #6366f1);
  border-radius: var(--radius-full, 9999px);
}

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */
/* 10. Responsive & Breakpoint Utilities — أدوات الاستجابة ونقاط الكسر                                                      */
/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────── */

@media (max-width: 639px) {
  .hide-mobile { display: none !important; }
  .show-mobile { display: block !important; }
}
@media (min-width: 640px) and (max-width: 1023px) {
  .hide-tablet { display: none !important; }
  .show-tablet { display: block !important; }
}
@media (min-width: 1024px) {
  .hide-desktop { display: none !important; }
  .show-desktop { display: block !important; }
}
@media (min-width: 640px) { .show-mobile { display: none !important; } }
@media (max-width: 639px), (min-width: 1024px) { .show-tablet { display: none !important; } }
@media (max-width: 1023px) { .show-desktop { display: none !important; } }

.container-narrow { max-width: 640px; margin-inline: auto; padding-inline: 16px; }
.container-wide { max-width: 1400px; margin-inline: auto; padding-inline: 24px; }

.scrollable-x {
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb, #cbd5e1) transparent;
}
.scrollable-x::-webkit-scrollbar { height: 6px; }
.scrollable-x::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb, #cbd5e1); border-radius: var(--radius-full, 9999px); }

.scrollable-y {
  overflow-y: auto; -webkit-overflow-scrolling: touch;
  scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb, #cbd5e1) transparent;
}
.scrollable-y::-webkit-scrollbar { width: 6px; }
.scrollable-y::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb, #cbd5e1); border-radius: var(--radius-full, 9999px); }

.safe-area-inset {
  padding-top: env(safe-area-inset-top, 0); padding-bottom: env(safe-area-inset-bottom, 0);
  padding-left: env(safe-area-inset-left, 0); padding-right: env(safe-area-inset-right, 0);
}

.aspect-ratio-16-9 { aspect-ratio: 16 / 9; }
.aspect-ratio-4-3 { aspect-ratio: 4 / 3; }
.aspect-ratio-1-1 { aspect-ratio: 1 / 1; }
.aspect-ratio-3-4 { aspect-ratio: 3 / 4; }
.aspect-ratio-9-16 { aspect-ratio: 9 / 16; }
.aspect-ratio-21-9 { aspect-ratio: 21 / 9; }

.grid-cols-responsive { display: grid; grid-template-columns: repeat(1, 1fr); gap: 16px; }
@media (min-width: 640px) { .grid-cols-responsive { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .grid-cols-responsive { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1280px) { .grid-cols-responsive { grid-template-columns: repeat(4, 1fr); } }

.text-responsive-xs { font-size: clamp(0.7rem, 1.5vw, 0.8rem); }
.text-responsive-sm { font-size: clamp(0.8rem, 1.8vw, 0.9rem); }
.text-responsive-base { font-size: clamp(0.875rem, 2vw, 1rem); }
.text-responsive-lg { font-size: clamp(1rem, 2.5vw, 1.25rem); }
.text-responsive-xl { font-size: clamp(1.25rem, 3vw, 1.75rem); }
.text-responsive-2xl { font-size: clamp(1.5rem, 4vw, 2.25rem); }

/* ═══ End CSS Round 37 ═══ */

@media (prefers-reduced-motion: reduce) {
  .card-holographic, .card-holographic::after, .card-gradient-border::before { animation: none !important; }
  .state-loading-circular, .state-loading-dots__dot, .badge-notification-dot::after, .badge-status-online::before { animation: none !important; }
  .hover-card-lift:hover, .hover-glow:hover, .hover-icon-bounce:hover, .card-3d-tilt:hover, .card-morph:hover, .card-spotlight:hover { transform: none !important; }
  .expand-collapse { transition: none !important; }
}
"""

# Append to globals.css
with open('/home/z/my-project/src/app/globals.css', 'a') as f:
    f.write(css_content)

# Count new lines
new_lines = css_content.count('\n')
print(f"CSS Round 37 appended: {new_lines} lines")

# Count total lines
with open('/home/z/my-project/src/app/globals.css', 'r') as f:
    total = sum(1 for _ in f)
print(f"Total globals.css lines: {total}")
