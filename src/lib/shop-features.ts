// ============================================================
// نظام الميزات المدفوعة — تعريفات وأدوات مساعدة
// فقط الميزات المُنفَّذة فعلياً
// ============================================================

/// مفاتيح الميزات المدفوعة — كل مفتاح يمثل ميزة مُنفَّذة فعلياً
export type FeatureKey =
  // ===== ميزات واجهة الزبون =====
  | "directTrackingLink"     // رابط تتبع مباشر فريد لكل طلب
  | "couponCode"             // كوبون خصم عند تقديم الطلب
  | "specialOffers"          // العروض الخاصة التلقائية
  | "customLogo"             // شعار مخصص للمتجر
  | "customFooter"           // تذييل مخصص مع ساعات العمل والتواصل
  | "darkMode"               // الوضع الداكن لواجهة الزبائن
  | "invoiceBranding"        // فاتورة PDF بالشعار والألوان المخصصة
  | "whatsappLink"           // رابط واتساب مباشر في صفحة نجاح الطلب
  | "orderTracking"          // تتبع حالة الطلب
  | "repeatOrder"            // إعادة طلب سابق بضغطة واحدة
  | "smartFileAnalysis"      // تحليل ذكي للملفات المرفوعة
  | "orderInvoice"           // تنزيل فاتورة PDF
  | "aiAssistant"            // المساعد الذكي (AI)
  | "voiceInput"             // الإدخال الصوتي
  | "imageGeneration"        // توليد التصميم بالذكاء الاصطناعي
  | "competitorSearch"       // بحث أسعار المنافسين
  | "introAnimation"         // شاشة ترحيب متحركة
  // ===== ميزات لوحة التاجر =====
  | "merchantFileDownload"   // تنزيل ملف الزبون لطباعته من لوحة التاجر
  | "exportExcel"            // تصدير الطلبات CSV/Excel
  | "customPricing"          // أسعار مخصصة لكل خدمة
  | "serviceToggle"          // تفعيل/تعطيل الخدمات
  | "customerCrm"            // قاعدة بيانات الزبائن
  | "bulkActions"            // إجراءات جماعية على الطلبات
  | "advancedAnalytics"      // تحليلات متقدمة (رسوم بيانية)
  | "whiteLabel"             // إزالة علامة "طيف"
  | "orderKanban"            // لوحة كانبان لإدارة الطلبات
  | "receiptPrinting"        // طباعة إيصال حراري
  | "expenseTracking"        // تتبع المصاريف والأرباح
  | "customerDatabase"       // قاعدة بيانات العملاء
  | "formTemplates"          // قوالب النماذج الرسمية
  | "analyticsDashboard"     // لوحة التحليلات التفصيلية
  | "whatsappNotifications"  // إشعارات واتساب تلقائية
  | "customTheme"            // تخصيص الألوان والمظهر
  | "autoBackup"             // نسخ احتياطي تلقائي
  | "prioritySupport"        // دعم فني ذو أولوية
  ;

/// تعريف ميزة واحدة
export interface FeatureDef {
  key: FeatureKey;
  label: string;
  description: string;
  /// أي مستوى يظهر فيه: "customer" | "merchant"
  level: "customer" | "merchant";
  /// أيقونة من lucide (اسمها كنص)
  icon: string;
  /// ترتيب العرض
  order: number;
}

/// كل الميزات المعرّفة — مُنفَّذة فعلياً
export const FEATURE_DEFINITIONS: FeatureDef[] = [
  // ===== ميزات واجهة الزبون (17) =====
  {
    key: "directTrackingLink",
    label: "رابط تتبع مباشر",
    description: "رابط فريد لكل طلب يمكن للزبون استخدامه لتتبع طلبه بدون إدخال بيانات",
    level: "customer",
    icon: "Link2",
    order: 1,
  },
  {
    key: "couponCode",
    label: "كوبون خصم",
    description: "إمكانية إدخال كود خصم عند تقديم الطلب مع تحكم كامل بالكوبونات",
    level: "customer",
    icon: "Percent",
    order: 2,
  },
  {
    key: "specialOffers",
    label: "العروض الخاصة",
    description: "عرض عروض وخصومات تلقائية للزبائن مثل خصم الكميات وعرض اليوم",
    level: "customer",
    icon: "Sparkles",
    order: 3,
  },
  {
    key: "customLogo",
    label: "شعار مخصص",
    description: "إضافة شعار المتجر في واجهة الزبائن والفاتورة بدلاً من الأيقونة الافتراضية",
    level: "customer",
    icon: "Image",
    order: 4,
  },
  {
    key: "customFooter",
    label: "تذييل مخصص",
    description: "تذييل غني مع ساعات العمل وروابط التواصل الاجتماعي ومعلومات الاتصال",
    level: "customer",
    icon: "Layout",
    order: 5,
  },
  {
    key: "darkMode",
    label: "الوضع الداكن",
    description: "إمكانية التبديل بين الوضع الفاتح والداكن في واجهة الزبائن",
    level: "customer",
    icon: "Moon",
    order: 6,
  },
  {
    key: "invoiceBranding",
    label: "فاتورة احترافية",
    description: "فاتورة PDF بالشعار والألوان المخصصة وبيانات المتجر الكاملة",
    level: "customer",
    icon: "FileText",
    order: 7,
  },
  {
    key: "whatsappLink",
    label: "رابط واتساب",
    description: "زر واتساب مباشر في صفحة نجاح الطلب لتمكين الزبون من التواصل",
    level: "customer",
    icon: "MessageCircle",
    order: 8,
  },
  {
    key: "orderTracking",
    label: "تتبع حالة الطلب",
    description: "تتبع حالة الطلب لحظة بلحظة مع إشعارات تلقائية عند تغيير الحالة",
    level: "customer",
    icon: "MapPin",
    order: 9,
  },
  {
    key: "repeatOrder",
    label: "إعادة طلب سابق",
    description: "إعادة طلب سابق بضغطة واحدة بدون إعادة إدخال البيانات",
    level: "customer",
    icon: "RotateCcw",
    order: 10,
  },
  {
    key: "smartFileAnalysis",
    label: "تحليل ذكي للملفات",
    description: "تحليل ذكي للملفات المرفوعة لتحديد عدد الصفحات والحجم والنوع تلقائياً",
    level: "customer",
    icon: "ScanSearch",
    order: 11,
  },
  {
    key: "orderInvoice",
    label: "تنزيل فاتورة PDF",
    description: "تنزيل فاتورة PDF احترافية لكل طلب مع تفاصيل كاملة",
    level: "customer",
    icon: "FileDown",
    order: 12,
  },
  {
    key: "aiAssistant",
    label: "المساعد الذكي",
    description: "مساعد ذكي بالذكاء الاصطناعي يجيب على أسئلة الزبائن ويوجههم",
    level: "customer",
    icon: "Bot",
    order: 13,
  },
  {
    key: "voiceInput",
    label: "الإدخال الصوتي",
    description: "إمكانية إدخال البيانات بالصوت بدلاً من الكتابة",
    level: "customer",
    icon: "Mic",
    order: 14,
  },
  {
    key: "imageGeneration",
    label: "توليد التصميم بالذكاء الاصطناعي",
    description: "توليد تصاميم بالذكاء الاصطناعي بناءً على وصف نصي",
    level: "customer",
    icon: "ImagePlus",
    order: 15,
  },
  {
    key: "competitorSearch",
    label: "بحث أسعار المنافسين",
    description: "بحث أسعار المنافسين وعرض مقارنة الأسعار للزبائن",
    level: "customer",
    icon: "Search",
    order: 16,
  },
  {
    key: "introAnimation",
    label: "شاشة ترحيب متحركة",
    description: "شاشة ترحيب متحركة تعرض عند أول زيارة للمتجر",
    level: "customer",
    icon: "Play",
    order: 17,
  },
  // ===== ميزات لوحة التاجر (19) =====
  {
    key: "merchantFileDownload",
    label: "تنزيل ملفات الطلبات",
    description: "تنزيل ملفات الزبائن مباشرة من لوحة التحكم لطباعتها فوراً دون البحث عنها",
    level: "merchant",
    icon: "Download",
    order: 100,
  },
  {
    key: "exportExcel",
    label: "تصدير Excel",
    description: "تصدير الطلبات والزبائن إلى ملف CSV",
    level: "merchant",
    icon: "FileSpreadsheet",
    order: 101,
  },
  {
    key: "customPricing",
    label: "أسعار مخصصة",
    description: "تعديل سعر كل خدمة ونوع ورق وتجليد حسب رغبتك",
    level: "merchant",
    icon: "DollarSign",
    order: 102,
  },
  {
    key: "serviceToggle",
    label: "تفعيل/تعطيل الخدمات",
    description: "اختيار الخدمات المتاحة للزبائن وإخفاء غير المطلوبة",
    level: "merchant",
    icon: "ToggleLeft",
    order: 103,
  },
  {
    key: "customerCrm",
    label: "قاعدة بيانات الزبائن",
    description: "عرض كل الزبائن مع إحصائيات لكل واحد وتاريخ الطلبات",
    level: "merchant",
    icon: "Users",
    order: 104,
  },
  {
    key: "bulkActions",
    label: "إجراءات جماعية",
    description: "تحديد عدة طلبات وتغيير حالتها دفعة واحدة أو حذفها",
    level: "merchant",
    icon: "ListChecks",
    order: 105,
  },
  {
    key: "advancedAnalytics",
    label: "تحليلات متقدمة",
    description: "رسوم بيانية تفصيلية وتحليل الاتجاهات وأفضل الزبائن",
    level: "merchant",
    icon: "BarChart3",
    order: 106,
  },
  {
    key: "whiteLabel",
    label: "إزالة العلامة التجارية",
    description: "إزالة علامة 'طيف' وجعل النظام بالكامل بعلامتك التجارية",
    level: "merchant",
    icon: "EyeOff",
    order: 107,
  },
  {
    key: "orderKanban",
    label: "لوحة كانبان",
    description: "لوحة كانبان لإدارة الطلبات بسحب وإفلات بين الحالات",
    level: "merchant",
    icon: "Columns",
    order: 108,
  },
  {
    key: "receiptPrinting",
    label: "طباعة إيصال حراري",
    description: "طباعة إيصال حراري مباشرة لكل طلب جاهز",
    level: "merchant",
    icon: "Receipt",
    order: 109,
  },
  {
    key: "expenseTracking",
    label: "تتبع المصاريف والأرباح",
    description: "تتبع المصاريف التشغيلية وحساب الأرباح الصافية",
    level: "merchant",
    icon: "Wallet",
    order: 110,
  },
  {
    key: "customerDatabase",
    label: "قاعدة بيانات العملاء",
    description: "قاعدة بيانات شاملة للعملاء مع سجل المبيعات والتفضيلات",
    level: "merchant",
    icon: "Database",
    order: 111,
  },
  {
    key: "formTemplates",
    label: "قوالب النماذج الرسمية",
    description: "قوالب جاهزة للنماذج الرسمية مثل طلبات التوظيف والسيرة الذاتية",
    level: "merchant",
    icon: "FileStack",
    order: 112,
  },
  {
    key: "analyticsDashboard",
    label: "لوحة التحليلات التفصيلية",
    description: "لوحة تحليلات تفصيلية مع مؤشرات الأداء والتقارير اليومية",
    level: "merchant",
    icon: "LineChart",
    order: 113,
  },
  {
    key: "whatsappNotifications",
    label: "إشعارات واتساب تلقائية",
    description: "إرسال إشعارات واتساب تلقائية عند تغيير حالة الطلب",
    level: "merchant",
    icon: "Bell",
    order: 114,
  },
  {
    key: "customTheme",
    label: "تخصيص الألوان والمظهر",
    description: "تخصيص ألوان ومظهر المتجر حسب الهوية البصرية",
    level: "merchant",
    icon: "Palette",
    order: 115,
  },
  {
    key: "autoBackup",
    label: "نسخ احتياطي تلقائي",
    description: "نسخ احتياطي تلقائي يومي للبيانات والطلبات",
    level: "merchant",
    icon: "HardDrive",
    order: 116,
  },
  {
    key: "prioritySupport",
    label: "دعم فني ذو أولوية",
    description: "دعم فني ذو أولوية مع استجابة سريعة",
    level: "merchant",
    icon: "Headset",
    order: 117,
  },
];

/// خريطة سريعة: key → FeatureDef
const FEATURES_MAP = new Map(FEATURE_DEFINITIONS.map((f) => [f.key, f]));

/// جلب تعريف ميزة بالاسم
export function getFeatureDef(key: FeatureKey): FeatureDef | undefined {
  return FEATURES_MAP.get(key);
}

/// ميزات واجهة الزبون فقط
export const CUSTOMER_FEATURES = FEATURE_DEFINITIONS.filter((f) => f.level === "customer");

/// ميزات لوحة التاجر فقط
export const MERCHANT_FEATURES = FEATURE_DEFINITIONS.filter((f) => f.level === "merchant");

/// نوع خطة المتجر
export type ShopPlan = "free" | "paid";

/// شكل الـ features JSON
export interface ShopFeatures {
  [key: string]: boolean;
}

/// الـ features الافتراضية (كل شيء مقفل)
export const DEFAULT_FEATURES: ShopFeatures = {};
FEATURE_DEFINITIONS.forEach((f) => {
  DEFAULT_FEATURES[f.key] = false;
});

/// الميزات المفتوحة تلقائياً في الخطة المجانية
export const FREE_FEATURES: FeatureKey[] = [
  // Basic features every shop needs
  "orderTracking",
  "repeatOrder",
  "orderInvoice",
  "whatsappLink",
  "directTrackingLink",
  // Some nice-to-haves to show value
  "smartFileAnalysis",
  "introAnimation",
];

/// الـ features الافتراضية للخطة المجانية (مع الميزات المفتوحة تلقائياً)
export const FREE_DEFAULT_FEATURES: ShopFeatures = { ...DEFAULT_FEATURES };
FREE_FEATURES.forEach((key) => {
  FREE_DEFAULT_FEATURES[key] = true;
});

/// مجموعة المفاتيح الصالحة — لتنظيف البيانات القديمة
const VALID_KEYS = new Set(FEATURE_DEFINITIONS.map((f) => f.key));

/// تنظيف كائن الميزات من المفاتيح القديمة غير الصالحة
function cleanFeatures(raw: Record<string, unknown>): ShopFeatures {
  const clean: ShopFeatures = { ...DEFAULT_FEATURES };
  for (const [k, v] of Object.entries(raw)) {
    if (VALID_KEYS.has(k as FeatureKey)) {
      clean[k] = v === true;
    }
  }
  return clean;
}

/// تحليل ميزات المتجر من JSON string
export function parseFeatures(featuresJson: string | null | undefined, plan: string): ShopFeatures {
  // الخطة المدفوعة تعطي كل شيء مفتوح افتراضياً
  if (plan === "paid") {
    const all: ShopFeatures = {};
    FEATURE_DEFINITIONS.forEach((f) => {
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

/// عدد الميزات المفعّلة
export function countEnabledFeatures(features: ShopFeatures | null | undefined): number {
  if (!features) return 0;
  return Object.values(features).filter(Boolean).length;
}

/// عدد الميزات الكلي
export const TOTAL_FEATURES = FEATURE_DEFINITIONS.length;