// ============================================================
// نظام الميزات — تعريفات وأدوات مساعدة
// Print Shop SaaS Feature System
// ============================================================

/// مفاتيح الميزات
export type FeatureKey =
  // ===== ميزات مجانية (8) — مفعّلة تلقائياً =====
  | "orderCreation"          // إنشاء الطلبات
  | "orderTracking"          // تتبع الطلبات
  | "smartFileAnalysis"      // تحليل الملفات المرفوعة
  | "darkMode"               // الوضع الداكن
  | "webNotifications"       // إشعارات الويب
  | "directTrackingLink"     // تتبع الطلب بالرابط
  | "rtlSupport"             // دعم RTL
  // ===== ميزات مدفوعة (18) =====
  | "whatsappNotifications"  // إشعارات واتساب
  | "advancedAnalytics"      // تحليلات متقدمة
  | "receiptPrinting"        // طباعة إيصال حراري
  | "exportExcel"            // تصدير Excel
  | "orderKanban"            // لوحة كانبان
  | "customerCrm"            // إدارة العملاء
  | "expenseTracking"        // إدارة المصاريف
  | "formTemplates"          // قوالب النماذج
  | "orderInvoice"           // فواتير PDF
  | "aiAssistant"            // المساعد الذكي
  | "customTheme"            // تخصيص السمة
  | "customLogo"             // شعار مخصص
  | "customDomain"           // مجال خاص
  | "prioritySupport"        // أولوية الدعم
  // ===== ميزات مدفوعة إضافية (مستخدمة في الكود) =====
  | "bulkActions"            // إجراءات جماعية
  | "customPricing"          // أسعار مخصصة
  | "serviceToggle"          // تفعيل/تعطيل الخدمات
  | "merchantFileDownload"   // تنزيل ملفات الطلبات
  | "discountCodes"           // أكواد الخصم
  | "directPrinting"          // الطباعة المباشرة
  ;

/// فئة الميزة
export type FeatureCategory = "core" | "analytics" | "notifications" | "printing" | "export" | "management" | "branding" | "support" | "marketing" | "operations";

/// تعريف ميزة واحدة
export interface FeatureDef {
  key: FeatureKey;
  label: string;
  description: string;
  icon: string;
  category: FeatureCategory;
  isFree: boolean;
  order: number;
}

/// كل الميزات المعرّفة
export const FEATURES: FeatureDef[] = [
  // ===== ميزات مجانية (8) =====
  {
    key: "orderCreation",
    label: "إنشاء الطلبات",
    description: "إنشاء طلبات طباعة جديدة بسهولة وسرعة عبر واجهة بسيطة",
    icon: "Plus",
    category: "core",
    isFree: true,
    order: 1,
  },
  {
    key: "orderTracking",
    label: "تتبع الطلبات",
    description: "تتبع حالة الطلب لحظة بلحظة مع إشعارات تلقائية عند تغيير الحالة",
    icon: "MapPin",
    category: "core",
    isFree: true,
    order: 2,
  },
  {
    key: "smartFileAnalysis",
    label: "تحليل الملفات",
    description: "تحليل ذكي للملفات المرفوعة لتحديد عدد الصفحات والحجم والنوع تلقائياً",
    icon: "ScanSearch",
    category: "core",
    isFree: true,
    order: 3,
  },
  {
    key: "darkMode",
    label: "الوضع الداكن",
    description: "إمكانية التبديل بين الوضع الفاتح والداكن في واجهة المتجر",
    icon: "Moon",
    category: "core",
    isFree: true,
    order: 4,
  },
  {
    key: "webNotifications",
    label: "إشعارات الويب",
    description: "إشعارات المتصفح عند تغيير حالة الطلب أو وصول طلب جديد",
    icon: "Bell",
    category: "notifications",
    isFree: true,
    order: 5,
  },
  {
    key: "directTrackingLink",
    label: "تتبع الطلب بالرابط",
    description: "رابط فريد لكل طلب يمكن للزبون استخدامه لتتبع طلبه مباشرة",
    icon: "Link2",
    category: "core",
    isFree: true,
    order: 6,
  },
  {
    key: "rtlSupport",
    label: "دعم RTL",
    description: "دعم كامل للكتابة من اليمين لليسار للغات العربية والعبرية",
    icon: "AlignRight",
    category: "core",
    isFree: true,
    order: 7,
  },

  // ===== ميزات مدفوعة (18) =====
  {
    key: "whatsappNotifications",
    label: "إشعارات واتساب",
    description: "إرسال إشعارات واتساب تلقائية للزبون عند تغيير حالة الطلب",
    icon: "MessageCircle",
    category: "notifications",
    isFree: false,
    order: 101,
  },
  {
    key: "advancedAnalytics",
    label: "تحليلات متقدمة",
    description: "رسوم بيانية تفصيلية وتحليل الاتجاهات وأفضل الزبائن",
    icon: "BarChart3",
    category: "analytics",
    isFree: false,
    order: 102,
  },
  {
    key: "receiptPrinting",
    label: "طباعة إيصال حراري",
    description: "طباعة إيصال حراري مباشرة لكل طلب جاهز",
    icon: "Receipt",
    category: "printing",
    isFree: false,
    order: 103,
  },
  {
    key: "exportExcel",
    label: "تصدير Excel",
    description: "تصدير الطلبات والزبائن إلى ملف CSV/Excel",
    icon: "FileSpreadsheet",
    category: "export",
    isFree: false,
    order: 104,
  },
  {
    key: "orderKanban",
    label: "لوحة كانبان",
    description: "لوحة كانبان لإدارة الطلبات بسحب وإفلات بين الحالات",
    icon: "Columns3",
    category: "management",
    isFree: false,
    order: 105,
  },
  {
    key: "customerCrm",
    label: "إدارة العملاء",
    description: "قاعدة بيانات شاملة للعملاء مع سجل المبيعات والتفضيلات",
    icon: "Users",
    category: "management",
    isFree: false,
    order: 106,
  },
  {
    key: "expenseTracking",
    label: "إدارة المصاريف",
    description: "تتبع المصاريف التشغيلية وحساب الأرباح الصافية",
    icon: "Wallet",
    category: "management",
    isFree: false,
    order: 107,
  },
  {
    key: "formTemplates",
    label: "قوالب النماذج",
    description: "قوالب جاهزة للنماذج الرسمية مثل طلبات التوظيف والسيرة الذاتية",
    icon: "FileStack",
    category: "management",
    isFree: false,
    order: 108,
  },
  {
    key: "orderInvoice",
    label: "فواتير PDF",
    description: "تنزيل فاتورة PDF احترافية لكل طلب مع تفاصيل كاملة",
    icon: "FileText",
    category: "export",
    isFree: false,
    order: 109,
  },
  {
    key: "aiAssistant",
    label: "المساعد الذكي",
    description: "مساعد ذكي بالذكاء الاصطناعي يجيب على أسئلة الزبائن ويوجههم",
    icon: "Bot",
    category: "support",
    isFree: false,
    order: 110,
  },
  {
    key: "customTheme",
    label: "تخصيص السمة",
    description: "تخصيص ألوان ومظهر المتجر حسب الهوية البصرية",
    icon: "Palette",
    category: "branding",
    isFree: true,
    order: 111,
  },
  {
    key: "customLogo",
    label: "شعار مخصص",
    description: "إضافة شعار المتجر في واجهة الزبائن والفاتورة",
    icon: "Image",
    category: "branding",
    isFree: false,
    order: 112,
  },
  {
    key: "customDomain",
    label: "مجال خاص",
    description: "ربط المتجر بمجال خاص مثل print.yourdomain.com",
    icon: "Globe",
    category: "branding",
    isFree: false,
    order: 113,
  },
  {
    key: "prioritySupport",
    label: "أولوية الدعم",
    description: "دعم فني ذو أولوية مع استجابة سريعة",
    icon: "Headset",
    category: "support",
    isFree: false,
    order: 114,
  },

  // ===== ميزات مدفوعة إضافية =====
  {
    key: "bulkActions",
    label: "إجراءات جماعية",
    description: "تحديد عدة طلبات وتغيير حالتها دفعة واحدة أو حذفها",
    icon: "ListChecks",
    category: "management",
    isFree: false,
    order: 201,
  },
  {
    key: "customPricing",
    label: "أسعار مخصصة",
    description: "تعديل سعر كل خدمة ونوع ورق وتجليد حسب رغبتك",
    icon: "DollarSign",
    category: "management",
    isFree: false,
    order: 202,
  },
  {
    key: "serviceToggle",
    label: "تفعيل/تعطيل الخدمات",
    description: "اختيار الخدمات المتاحة للزبائن وإخفاء غير المطلوبة",
    icon: "ToggleLeft",
    category: "management",
    isFree: false,
    order: 203,
  },
  {
    key: "merchantFileDownload",
    label: "تنزيل ملفات الطلبات",
    description: "تنزيل ملفات الزبائن مباشرة من لوحة التحكم لطباعتها فوراً",
    icon: "Download",
    category: "export",
    isFree: false,
    order: 204,
  },
  {
    key: "discountCodes",
    label: "أكواد الخصم",
    description: "إنشاء أكواد خصم قابلة للتخصيص لجذب العملاء",
    icon: "Percent",
    category: "marketing",
    isFree: false,
    order: 205,
  },
  {
    key: "directPrinting",
    label: "الطباعة المباشرة",
    description: "طباعة الطلبات مباشرة على الطابعة بعد المراجعة",
    icon: "Printer",
    category: "operations",
    isFree: false,
    order: 206,
  },
];

/// خريطة سريعة: key → FeatureDef
const FEATURES_MAP = new Map(FEATURES.map((f) => [f.key, f]));

/// جلب تعريف ميزة بالاسم
export function getFeatureDef(key: FeatureKey): FeatureDef | undefined {
  return FEATURES_MAP.get(key);
}

/// هل ميزة مجانية؟
export function isFeatureFree(key: FeatureKey): boolean {
  const def = FEATURES_MAP.get(key);
  return def?.isFree ?? false;
}

/// ميزات مجانية فقط
export const FREE_FEATURES: FeatureKey[] = FEATURES
  .filter((f) => f.isFree)
  .map((f) => f.key);

/// ميزات مدفوعة فقط
export const PAID_FEATURES: FeatureKey[] = FEATURES
  .filter((f) => !f.isFree)
  .map((f) => f.key);

/// نوع خطة المتجر
export type ShopPlan = "free" | "paid";

/// شكل الـ features JSON
export interface ShopFeatures {
  [key: string]: boolean;
}

/// الـ features الافتراضية (كل شيء مقفل)
export const DEFAULT_FEATURES: ShopFeatures = {};
FEATURES.forEach((f) => {
  DEFAULT_FEATURES[f.key] = false;
});

/// الـ features الافتراضية للخطة المجانية (مع الميزات المجانية مفتوحة)
export const FREE_DEFAULT_FEATURES: ShopFeatures = { ...DEFAULT_FEATURES };
FREE_FEATURES.forEach((key) => {
  FREE_DEFAULT_FEATURES[key] = true;
});

/// مجموعة المفاتيح الصالحة — لتنظيف البيانات القديمة
const VALID_KEYS = new Set(FEATURES.map((f) => f.key));

/// تنظيف كائن الميزات من المفاتيح القديمة غير الصالحة
function cleanFeatures(raw: Record<string, unknown>): ShopFeatures {
  const clean: ShopFeatures = { ...DEFAULT_FEATURES };
  for (const [k, v] of Object.entries(raw)) {
    if (VALID_KEYS.has(k as FeatureKey)) {
      clean[k] = v === true;
    }
  }
  // تأكد أن الميزات المجانية مفعّلة
  FREE_FEATURES.forEach((key) => {
    clean[key] = true;
  });
  return clean;
}

/// تحليل ميزات المتجر من JSON string
export function parseFeatures(featuresJson: string | null | undefined, plan: string): ShopFeatures {
  // الخطة المدفوعة تعطي كل شيء مفتوح افتراضياً
  if (plan === "paid") {
    const all: ShopFeatures = {};
    FEATURES.forEach((f) => {
      all[f.key] = true;
    });
    // إذا كان هناك تعطيل يدوي، نحترمه
    if (featuresJson) {
      try {
        const parsed = JSON.parse(featuresJson) as Record<string, unknown>;
        for (const [k, v] of Object.entries(parsed)) {
          if (VALID_KEYS.has(k as FeatureKey) && v === false) {
            all[k] = false;
          }
        }
      } catch {}
    }
    return all;
  }

  // الخطة المجانية — نقرأ ما هو مفعّل فقط (مع تنظيف المفاتيح القديمة)
  if (featuresJson) {
    try {
      return cleanFeatures(JSON.parse(featuresJson));
    } catch {
      return { ...FREE_DEFAULT_FEATURES };
    }
  }

  // لا توجد بيانات ميزات محفوظة — نستخدم افتراضيات المجاني
  return { ...FREE_DEFAULT_FEATURES };
}

/// هل ميزة معينة مفعّلة؟
export function isFeatureEnabled(
  features: ShopFeatures | null | undefined,
  key: FeatureKey,
): boolean {
  if (!features) return false;
  return features[key] === true;
}

/// هل ميزة معينة مفعّلة؟ (يقبل JSON string)
export function isFeatureEnabledStr(
  featuresJson: string | null | undefined,
  featureId: string,
  plan: string,
): boolean {
  if (!featuresJson) return false;
  const parsed = parseFeatures(featuresJson, plan);
  return parsed[featureId] === true;
}

/// عدد الميزات المفعّلة
export function countEnabledFeatures(features: ShopFeatures | null | undefined): number {
  if (!features) return 0;
  return Object.values(features).filter(Boolean).length;
}

/// عدد الميزات الكلي
export const TOTAL_FEATURES = FEATURES.length;

/// عدد الميزات المجانية
export const TOTAL_FREE_FEATURES = FREE_FEATURES.length;

/// عدد الميزات المدفوعة
export const TOTAL_PAID_FEATURES = PAID_FEATURES.length;

// ============================================================
// Backward compatibility — أسماء قديمة
// ============================================================

/** @deprecated استخدم FEATURES بدلاً منه */
export const FEATURE_DEFINITIONS = FEATURES;

/** @deprecated استخدم isFeatureFree() بدلاً من الفلترة يدوياً */
export const CUSTOMER_FEATURES = FEATURES;
/** @deprecated استخدم isFeatureFree() بدلاً من الفلترة يدوياً */
export const MERCHANT_FEATURES = FEATURES;