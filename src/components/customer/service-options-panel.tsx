"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronDown, ChevronUp, AlertTriangle, Lightbulb,
  Sparkles, Info,
} from "lucide-react";
import {
  SERVICE_SPECS,
  SPEC_LIST,
  type ServiceSpec,
  type SpecSection,
  type SpecOption,
  type ServiceType,
  type SmartRule,
} from "@/lib/customer/service-specs";

// ===== أنواع الخدمات من print-config (الذي يستخدمه file-analyzer) =====
type AnalyzerServiceType = "document" | "photo" | "binding" | "copy" | "card" | "poster";

/** تحويل نوع الخدمة من المحلل إلى نوع service-specs */
function mapToSpecService(analyzerType: string): ServiceType {
  const validTypes: ServiceType[] = ["document", "photo", "binding", "copy", "card", "poster", "custom-design"];
  if (validTypes.includes(analyzerType as ServiceType)) return analyzerType as ServiceType;
  // AI, EPS, PSD, CDR, INDD → custom-design
  return "document";
}

export interface ServiceOptionsState {
  serviceType: ServiceType;
  selectedOptions: Record<string, string>;
  copies: number;
}

interface ServiceOptionsPanelProps {
  detectedService: string;
  detectedServiceName: string;
  analysisData?: {
    suggestedColor?: string;
    suggestedPaperSize?: string;
    suggestedPaperType?: string;
    suggestedBinding?: string;
    suggestedPhotoSize?: string;
    isColor?: boolean;
    pageCount?: number;
    closestPaperSize?: string;
  };
  copies: number;
  onCopiesChange: (copies: number) => void;
  onOptionsChange: (state: ServiceOptionsState) => void;
  /** لون التصنيف (emerald / amber / violet) */
  colorScheme?: "emerald" | "amber" | "violet";
  /** طي مبدئي */
  defaultOpen?: boolean;
}

// ===== خرائط الألوان حسب المخطط =====
const COLOR_MAPS = {
  emerald: {
    active: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-2 border-emerald-400",
    inactive: "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
    accent: "text-emerald-500",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    countBorder: "border-emerald-200 dark:border-emerald-800",
    countBg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    countText: "text-emerald-700 dark:text-emerald-300",
    countAccent: "text-emerald-500",
    infoBg: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
    suggestBg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30",
    suggestText: "text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    active: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-2 border-amber-400",
    inactive: "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    accent: "text-amber-500",
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    countBorder: "border-amber-200 dark:border-amber-800",
    countBg: "bg-amber-50/50 dark:bg-amber-950/20",
    countText: "text-amber-700 dark:text-amber-300",
    countAccent: "text-amber-500",
    infoBg: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
    suggestBg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30",
    suggestText: "text-amber-700 dark:text-amber-300",
  },
  violet: {
    active: "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-2 border-violet-400",
    inactive: "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800",
    accent: "text-violet-500",
    bg: "bg-violet-50/50 dark:bg-violet-950/20",
    countBorder: "border-violet-200 dark:border-violet-800",
    countBg: "bg-violet-50/50 dark:bg-violet-950/20",
    countText: "text-violet-700 dark:text-violet-300",
    countAccent: "text-violet-500",
    infoBg: "bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400",
    suggestBg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-800/30",
    suggestText: "text-violet-700 dark:text-violet-300",
  },
};

export function ServiceOptionsPanel({
  detectedService,
  detectedServiceName,
  analysisData,
  copies,
  onCopiesChange,
  onOptionsChange,
  colorScheme = "amber",
  defaultOpen = true,
}: ServiceOptionsPanelProps) {
  const colors = COLOR_MAPS[colorScheme];

  // نوع الخدمة الفعّل (يمكن للمستخدم تغييره)
  const [activeServiceType, setActiveServiceType] = useState<ServiceType>(() =>
    mapToSpecService(detectedService),
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartRule[]>([]);

  // المواصفات الفعّالة
  const activeSpec = useMemo(
    () => SERVICE_SPECS[activeServiceType],
    [activeServiceType],
  );

  // ===== تطبيق الاختيارات الافتراضية من التحليل =====
  useEffect(() => {
    if (!analysisData) return;
    const defaults: Record<string, string> = {};

    if (analysisData.suggestedColor) {
      defaults["color"] = analysisData.suggestedColor;
    }
    if (analysisData.suggestedPaperSize) {
      defaults["paperSize"] = analysisData.suggestedPaperSize;
    }
    if (analysisData.suggestedPaperType) {
      defaults["paperType"] = analysisData.suggestedPaperType;
    }
    if (analysisData.suggestedBinding) {
      defaults["binding"] = analysisData.suggestedBinding;
      defaults["bindingType"] = analysisData.suggestedBinding;
    }
    if (analysisData.suggestedPhotoSize) {
      defaults["photoSize"] = analysisData.suggestedPhotoSize;
    }

    setSelectedOptions((prev) => {
      const merged = { ...defaults, ...prev };
      // فقط نحدّث إذا لم يكن المستخدم قد اختار بالفعل
      return merged;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detectedService]);

  // ===== اختيار خيار =====
  const selectOption = useCallback(
    (optionKey: string, optionId: string) => {
      setSelectedOptions((prev) => {
        const next = { ...prev, [optionKey]: optionId };
        return next;
      });
    },
  );

  // ===== فحص القواعد الذكية =====
  useEffect(() => {
    if (!activeSpec?.smartRules) {
      setSmartSuggestions([]);
      return;
    }
    const triggered: SmartRule[] = [];
    for (const rule of activeSpec.smartRules) {
      if (selectedOptions[rule.when.optionKey] === rule.when.optionId) {
        triggered.push(rule);
      }
    }
    setSmartSuggestions(triggered);
  }, [selectedOptions, activeSpec]);

  // ===== إرسال الحالة للأب =====
  useEffect(() => {
    onOptionsChange({
      serviceType: activeServiceType,
      selectedOptions,
      copies,
    });
  }, [activeServiceType, selectedOptions, copies, onOptionsChange]);

  // ===== تغيير نوع الخدمة =====
  const handleServiceChange = useCallback((type: ServiceType) => {
    setActiveServiceType(type);
    setSelectedOptions({}); // إعادة تعيين الاختيارات
    setSmartSuggestions([]);
  }, []);

  if (!activeSpec) return null;

  return (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      {/* الرأس — نوع الخدمة */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className={`h-4 w-4 ${colors.accent}`} />
          <span>خيارات الطباعة</span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors.badge}`}
          >
            {activeSpec.emoji} {activeSpec.name}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t">
              {/* ===== محدد نوع الخدمة ===== */}
              <div className="pt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  نوع الخدمة
                  {detectedService !== activeServiceType && (
                    <span className="text-muted-foreground/60 mr-1">
                      (تلقائي: {detectedServiceName})
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SPEC_LIST.map((spec) => (
                    <button
                      key={spec.type}
                      onClick={() => handleServiceChange(spec.type)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                        activeServiceType === spec.type
                          ? colors.active
                          : colors.inactive
                      }`}
                    >
                      <span>{spec.emoji}</span>
                      <span>{spec.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ===== عدد النسخ ===== */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  عدد النسخ
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onCopiesChange(Math.max(1, copies - 1))}
                    disabled={copies <= 1}
                    className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                  </button>
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${colors.countBorder} ${colors.countBg} min-w-[70px] justify-center`}
                  >
                    <span className={`text-lg font-bold tabular-nums ${colors.countText}`}>
                      {copies}
                    </span>
                  </div>
                  <button
                    onClick={() => onCopiesChange(Math.min(99, copies + 1))}
                    disabled={copies >= 99}
                    className="w-9 h-9 rounded-xl border flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  </button>
                  {copies > 1 && (
                    <button
                      onClick={() => onCopiesChange(1)}
                      className="text-[10px] text-muted-foreground hover:text-rose-500 transition-colors"
                    >
                      إعادة تعيين
                    </button>
                  )}
                </div>
              </div>

              {/* ===== أقسام الخدمة الديناميكية ===== */}
              {activeSpec.sections.map((section) => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  selectedId={selectedOptions[section.optionKey]}
                  onSelect={(id) => selectOption(section.optionKey, id)}
                  colors={colors}
                />
              ))}

              {/* ===== اقتراحات ذكية ===== */}
              <AnimatePresence>
                {smartSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={`rounded-xl ${colors.suggestBg} p-3 space-y-2`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Lightbulb className={`h-3.5 w-3.5 ${colors.countAccent}`} />
                      <span className={`text-[11px] font-semibold ${colors.suggestText}`}>
                        اقتراحات ذكية
                      </span>
                    </div>
                    {smartSuggestions.map((rule, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <button
                          onClick={() =>
                            selectOption(rule.suggest.optionKey, rule.suggest.optionId)
                          }
                          className="shrink-0 mt-0.5 w-5 h-5 rounded-md bg-background/80 border border-current/20 flex items-center justify-center hover:bg-background transition-colors"
                        >
                          <Check className={`h-3 w-3 ${colors.countAccent}`} />
                        </button>
                        <div className="text-[11px]">
                          <span className={colors.suggestText}>
                            {rule.suggest.message}
                          </span>
                          {rule.warn && (
                            <span className="text-amber-600 dark:text-amber-400 block mt-0.5">
                              ⚠️ {rule.warn}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ===== اختيارات سريعة ===== */}
              {activeSpec.quickPicks && (
                <QuickPicks
                  spec={activeSpec}
                  onApply={(opts) => setSelectedOptions({ ...opts })}
                  colors={colors}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SectionRenderer — يرسم قسم واحد من الخدمة
// ═══════════════════════════════════════════════════════════
interface SectionRendererProps {
  section: SpecSection;
  selectedId?: string;
  onSelect: (id: string) => void;
  colors: (typeof COLOR_MAPS)["amber"];
}

function SectionRenderer({ section, selectedId, onSelect, colors }: SectionRendererProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // عدد الخيارات = نقرات (صغيرة) نعرضها في شبكة، كثيرة = قائمة
  const isGrid = section.options.length <= 5;

  if (section.info) {
    // قسم معلوماتي فقط (بدون اختيار)
    return (
      <div className={`rounded-xl ${colors.infoBg} px-3 py-2 flex items-center gap-2`}>
        <Info className={`h-3.5 w-3.5 shrink-0 ${colors.accent}`} />
        <span className="text-xs">{section.title}</span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2 group"
      >
        <div className="flex items-center gap-2">
          <span>{section.title}</span>
          {selectedId && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${colors.badge}`}>
              {section.options.find((o) => o.id === selectedId)?.label || ""}
            </span>
          )}
        </div>
        {section.hint && (
          <span className="text-[10px] text-muted-foreground/60 group-hover:hidden">
            {section.hint}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {isGrid ? (
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(section.options.length, 4)}, 1fr)` }}>
                {section.options.map((opt) => (
                  <OptionCard
                    key={opt.id}
                    option={opt}
                    isSelected={selectedId === opt.id}
                    onSelect={() => onSelect(opt.id)}
                    colors={colors}
                    compact={section.options.length > 3}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {section.options.map((opt) => (
                  <OptionRow
                    key={opt.id}
                    option={opt}
                    isSelected={selectedId === opt.id}
                    onSelect={() => onSelect(opt.id)}
                    colors={colors}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// OptionCard — بطاقة خيار (للشبكة)
// ═══════════════════════════════════════════════════════════
interface OptionCardProps {
  option: SpecOption;
  isSelected: boolean;
  onSelect: () => void;
  colors: (typeof COLOR_MAPS)["amber"];
  compact?: boolean;
}

function OptionCard({ option, isSelected, onSelect, colors, compact }: OptionCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl text-[10px] transition-all duration-200 text-center
        ${isSelected ? colors.active : colors.inactive}
        ${compact ? "py-2 px-1.5" : ""}
      `}
    >
      {option.emoji && <span className="text-base leading-none">{option.emoji}</span>}
      <span className="font-medium leading-tight">{option.label}</span>
      {option.description && !compact && (
        <span className="text-[9px] opacity-70 leading-tight">{option.description}</span>
      )}
      {option.note && (
        <span className="text-[8px] font-bold opacity-80 leading-tight">{option.note}</span>
      )}
      {option.price !== undefined && option.price > 0 && (
        <span className="text-[9px] font-mono opacity-80">+{option.price} ر.س</span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// OptionRow — صف خيار (للقائمة الطويلة)
// ═══════════════════════════════════════════════════════════
interface OptionRowProps {
  option: SpecOption;
  isSelected: boolean;
  onSelect: () => void;
  colors: (typeof COLOR_MAPS)["amber"];
}

function OptionRow({ option, isSelected, onSelect, colors }: OptionRowProps) {
  return (
    <button
      onClick={onSelect}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 text-right
        ${isSelected ? colors.active : "border border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"}
      `}
    >
      {option.emoji && <span className="text-base shrink-0">{option.emoji}</span>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{option.label}</span>
          {option.note && (
            <span className="text-[9px] font-bold opacity-70">{option.note}</span>
          )}
        </div>
        {option.description && (
          <p className="text-[10px] opacity-60 mt-0.5">{option.description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {(option.price !== undefined && option.price > 0) && (
          <span className="text-[10px] font-mono opacity-70">+{option.price} ر.س</span>
        )}
        {(option.pricePerPage !== undefined && option.pricePerPage > 0) && (
          <span className="text-[10px] font-mono opacity-70">+{option.pricePerPage}/صفحة</span>
        )}
        {(option.pricePerPage !== undefined && option.pricePerPage < 0) && (
          <span className="text-[10px] font-mono text-emerald-600">{option.pricePerPage}/صفحة</span>
        )}
        {isSelected && <Check className={`h-4 w-4 ${colors.accent}`} />}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// QuickPicks — اختيارات سريعة (اقتصادي / فاخر)
// ═══════════════════════════════════════════════════════════
interface QuickPicksProps {
  spec: ServiceSpec;
  onApply: (options: Record<string, string>) => void;
  colors: (typeof COLOR_MAPS)["amber"];
}

function QuickPicks({ spec, onApply, colors }: QuickPicksProps) {
  if (!spec.quickPicks) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">اختيارات سريعة</p>
      <div className="grid grid-cols-2 gap-2">
        {spec.quickPicks.economic && (
          <button
            onClick={() => onApply(spec.quickPicks!.economic!)}
            className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl text-[11px] transition-all duration-200 border hover:bg-muted ${colors.inactive}`}
          >
            <span className="text-base">💰</span>
            <span className="font-medium">اقتصادي</span>
            <span className="text-[9px] opacity-60">أقل تكلفة</span>
          </button>
        )}
        {spec.quickPicks.premium && (
          <button
            onClick={() => onApply(spec.quickPicks!.premium!)}
            className={`flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl text-[11px] transition-all duration-200 border hover:bg-muted ${colors.inactive}`}
          >
            <span className="text-base">💎</span>
            <span className="font-medium">فاخر</span>
            <span className="text-[9px] opacity-60">أعلى جودة</span>
          </button>
        )}
      </div>
    </div>
  );
}
