// المواصفات المخصصة لكل نوع خدمة - كل خدمة لها خيارات طباعة وتجليد مختلفة

export type ServiceType =
  | "document"
  | "photo"
  | "binding"
  | "copy"
  | "card"
  | "poster"
  | "custom-design";

// ===== أنواع الخيارات =====
export interface SpecOption {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
  price?: number; // سعر إضافي ثابت
  pricePerPage?: number; // سعر إضافي لكل صفحة
  multiplier?: number; // مضاعف سعر الصفحة
  note?: string;
}

export interface ServiceSpec {
  type: ServiceType;
  name: string;
  emoji: string;
  description: string;
  popularity: number;
  basePricePerPage: number;
  accepts: string[];
  isPopular?: boolean;
  // الأقسام المعروضة في الإعدادات
  sections: SpecSection[];
  /** هل الخدمة تعتمد على عدد الصفحات؟ (الصور لا) */
  hasPageCount?: boolean;
  /** هل تسمح بنطاق طباعة (كامل/صفحات معينة)؟ */
  hasPrintRange?: boolean;
  /** الوحدة المستخدمة (صفحة، صورة، بطاقة، نسخة) */
  unit?: string;
  /** قوالب الإعدادات السريعة */
  quickPicks?: {
    economic?: Record<string, string | string[]>; // optionKey -> optionId
    premium?: Record<string, string | string[]>;
  };
  /** قواعد الارتباطات الذكية */
  smartRules?: SmartRule[];
}

export interface SpecSection {
  id: string;
  title: string;
  hint?: string;
  options: SpecOption[];
  /** المعرّف المستخدم في options JSON */
  optionKey: string;
  /** اختيار واحد أو متعدد */
  multiple?: boolean;
  /** إظهار فقط (مثلاً معلومات) */
  info?: boolean;
}

/** قواعد الارتباطات الذكية */
export interface SmartRule {
  /** عندما يختار هذا */
  when: { optionKey: string; optionId: string };
  /** اقترح هذا */
  suggest: { optionKey: string; optionId: string; message: string };
  /** تحذير (اختياري) */
  warn?: string;
}

// ============================================================
// طباعة المستندات - PDF، وورد، تقارير، مذكرات
// ============================================================
export const DOCUMENT_SPEC: ServiceSpec = {
  type: "document",
  name: "طباعة مستند",
  emoji: "🖨️",
  description: "PDF، وورد، تقارير، مذكرات",
  popularity: 95,
  basePricePerPage: 0.50,
  accepts: ["PDF", "DOCX", "JPG", "PNG", "WEBP"],
  hasPageCount: true,
  hasPrintRange: true,
  unit: "صفحة",
  isPopular: true,
  sections: [
    {
      id: "color",
      title: "نوع الطباعة",
      hint: "اختر اللون المناسب لطباعتك",
      optionKey: "color",
      options: [
        { id: "bw", label: "أبيض وأسود", emoji: "⬛", description: "اقتصادي للمستندات النصية", multiplier: 1 },
        { id: "color", label: "ملون", emoji: "🎨", description: "للعروض والرسوم", multiplier: 3 },
      ],
    },
    {
      id: "paperSize",
      title: "حجم الورق",
      hint: "A4 هو الأكثر شيوعاً",
      optionKey: "paperSize",
      options: [
        { id: "A4", label: "A4", description: "21×29.7 سم", note: "الأكثر استخداماً", multiplier: 1 },
        { id: "A3", label: "A3", description: "29.7×42 سم", multiplier: 2 },
        { id: "A5", label: "A5", description: "14.8×21 سم", multiplier: 0.6 },
      ],
    },
    {
      id: "sides",
      title: "طباعة الوجهين",
      hint: "الوجهان يوفر الورق",
      optionKey: "sides",
      options: [
        { id: "single", label: "وجه واحد", emoji: "📄", description: "طباعة على وجه واحد فقط" },
        { id: "double", label: "وجهان", emoji: "📑", description: "توفير 50% من الأوراق", note: "تخفيض 50%" },
      ],
    },
    {
      id: "paperType",
      title: "نوع الورق",
      hint: "للأوراق العادية والأبحاث",
      optionKey: "paperType",
      options: [
        { id: "normal", label: "عادي", emoji: "📄", description: "80 غرام — الأكثر طلباً", pricePerPage: 0 },
        { id: "glossy", label: "لامع", emoji: "✨", description: "لمعان عالي", pricePerPage: 0.10 },
        { id: "matte", label: "مطفي", emoji: "🔲", description: "مظهر راقي", pricePerPage: 0.08 },
        { id: "cardboard", label: "مقوّى", emoji: "💳", description: "ورق سميك 200 غرام", pricePerPage: 0.15 },
      ],
    },
    {
      id: "printMethod",
      title: "طريقة الطباعة",
      hint: "حسب الكمية المطلوبة",
      optionKey: "printMethod",
      options: [
        { id: "digital", label: "رقمية عادية", emoji: "🖨️", description: "للطلبات القليلة (1-500 نسخة)", multiplier: 1, note: "الأكثر شيوعاً" },
        { id: "offset", label: "أوفست", emoji: "🏭", description: "للكميات الكبيرة (500+ نسخة)", multiplier: 0.6, note: "أرخص للكميات الكبيرة" },
        { id: "large-format", label: "طباعة كبيرة", emoji: "📐", description: "للمستندات الكبيرة جدًا", multiplier: 3, price: 20 },
      ],
    },
    {
      id: "colorProcessing",
      title: "معالجة الألوان",
      hint: "ضبط الألوان قبل الطباعة",
      optionKey: "colorProcessing",
      options: [
        { id: "as-is", label: "كما هو", emoji: "✅", description: "بدون تعديل", price: 0 },
        { id: "force-bw", label: "تحويل أبيض/أسود", emoji: "⬛", description: "يوفر ~50% من التكلفة", price: 0, note: "اقتصادي" },
        { id: "enhance", label: "تعزيز الألوان", emoji: "🎨", description: "تشبع أعلى وجودة أفضل", price: 0.50, pricePerPage: 0.50 },
        { id: "color-correct", label: "تصحيح ألوان احترافي", emoji: "🎯", description: "ضبط دقيق للألوان الفوتوغرافية", price: 1.50, pricePerPage: 1.50 },
      ],
    },
    {
      id: "bleedCut",
      title: "خيارات القص والحواف",
      hint: "كيفية قص الورق بعد الطباعة",
      optionKey: "bleedCut",
      options: [
        { id: "auto-cut", label: "قص تلقائي", emoji: "✂️", description: "قص دقيق للحجم المطلوب", price: 1 },
        { id: "margin-5", label: "مع هامش 5 مم", emoji: "📐", description: "مساحة بيضاء حول المحتوى", price: 0 },
        { id: "bleed", label: "بدون حواف", emoji: "⬜", description: "الطباعة تمتد حتى حواف الورقة", price: 1.50, note: "للتصاميم" },
        { id: "safe-margin", label: "حواف آمنة 10 مم", emoji: "🛡️", description: "للمستندات المهمة", price: 0 },
      ],
    },
    {
      id: "binding",
      title: "التجليد",
      hint: "اختر طريقة تجليد الملف",
      optionKey: "binding",
      options: [
        { id: "none", label: "بدون", emoji: "📄", description: "بدون تجليد", price: 0 },
        { id: "staple", label: "تدبيس", emoji: "📌", description: "سريع وبسيط", price: 2 },
        { id: "spiral", label: "لولبي", emoji: "🌀", description: "يُفتح 360°", price: 15 },
        { id: "glue", label: "غراء", emoji: "📚", description: "احترافي وفاخر", price: 20 },
      ],
    },
  ],
  quickPicks: {
    economic: { color: "bw", paperSize: "A4", sides: "single", paperType: "normal", binding: "none" },
    premium: { color: "color", paperSize: "A4", sides: "double", paperType: "cardboard", binding: "glue" },
  },
  smartRules: [
    { when: { optionKey: "paperType", optionId: "glossy" }, suggest: { optionKey: "color", optionId: "color", message: "الورق اللامع يُظهر الألوان بشكل أفضل" } },
    { when: { optionKey: "paperType", optionId: "cardboard" }, suggest: { optionKey: "binding", optionId: "spiral", message: "الورق المقوّى يتناسب مع التجليد" } },
    { when: { optionKey: "binding", optionId: "glue" }, suggest: { optionKey: "paperType", optionId: "cardboard", message: "يُنصح بورق مقوّى مع التجليد بالغراء" } },
    { when: { optionKey: "paperSize", optionId: "A3" }, warn: "الطباعة على A3 متاحة بوجه واحد فقط", suggest: { optionKey: "sides", optionId: "single", message: "A3 غير متاح بالوجهين" } },
  ],
};

// ============================================================
// طباعة الصور - تختلف تماماً عن المستندات
// ============================================================
export const PHOTO_SPEC: ServiceSpec = {
  type: "photo",
  name: "طباعة صور",
  emoji: "🖼️",
  description: "صور شخصية، فنية، لوحات",
  popularity: 60,
  basePricePerPage: 2.50,
  accepts: ["JPG", "PNG", "WEBP", "PDF"],
  hasPageCount: false, // الصور لا تحتوي على صفحات
  hasPrintRange: false,
  unit: "صورة",
  sections: [
    {
      id: "photoSize",
      title: "حجم الصورة",
      hint: "مقاسات الصور القياسية",
      optionKey: "photoSize",
      options: [
        { id: "10x15", label: "10×15 سم", emoji: "📸", description: "صورة جيب", multiplier: 0.4, note: "الأكثر طلباً" },
        { id: "13x18", label: "13×18 سم", emoji: "🖼️", description: "صورة متوسطة", multiplier: 0.6 },
        { id: "15x21", label: "15×21 سم", emoji: "🖼️", description: "صورة كبيرة", multiplier: 0.8 },
        { id: "20x30", label: "20×30 سم", emoji: "🖼️", description: "بوستر صغير", multiplier: 1.2 },
        { id: "A4", label: "A4", emoji: "📄", description: "21×29.7 سم", multiplier: 1 },
      ],
    },
    {
      id: "paperType",
      title: "نوع ورق الصور",
      hint: "أنواع خاصة بالصور",
      optionKey: "paperType",
      options: [
        { id: "glossy", label: "لامع فوتوغرافي", emoji: "✨", description: "لمعان عالي — للألوان الزاهية", pricePerPage: 0, note: "الأفضل للصور" },
        { id: "matte", label: "مطفي فوتوغرافي", emoji: "🔲", description: "غير عاكس — أناقة ورقيّة", pricePerPage: 0.50 },
        { id: "premium", label: "فاخر برو", emoji: "💎", description: "حريري عالي الجودة", pricePerPage: 1.50 },
        { id: "metallic", label: "معدني", emoji: "🥇", description: "لمعة معدنية خاصة", pricePerPage: 2.50 },
      ],
    },
    {
      id: "dpiBoost",
      title: "ضبط الدقة",
      hint: "جودة الدقة للطباعة",
      optionKey: "dpiBoost",
      options: [
        { id: "auto", label: "تلقائي", emoji: "🔄", description: "حسب الصورة الأصلية", price: 0, note: "موصى به" },
        { id: "dpi-150", label: "رفع إلى 150 DPI", emoji: "🖼️", description: "جودة متوسطة", price: 1 },
        { id: "dpi-300", label: "رفع إلى 300 DPI", emoji: "💎", description: "جودة عالية احترافية", price: 3, note: "الأفضل للطباعة" },
      ],
    },
    {
      id: "imageFit",
      title: "ملائمة الصورة",
      hint: "كيفية ملاءمة الصورة على الورق",
      optionKey: "imageFit",
      options: [
        { id: "keep-ratio", label: "حفظ النسبة", emoji: "📐", description: "بدون تشويه", price: 0, note: "موصى به" },
        { id: "fill", label: "ملء الصفحة", emoji: "⬜", description: "الصورة تمتلئ الورقة كاملة", price: 0 },
        { id: "white-bg", label: "مع خلفية بيضاء", emoji: "⬜", description: "حفظ النسبة مع خلفية", price: 0 },
        { id: "crop-fill", label: "اقتصاص وملء", emoji: "✂️", description: "قص + ملء بدون تشويه", price: 0.50 },
      ],
    },
    {
      id: "finish",
      title: "التشطيب",
      hint: "خيارات خاصة بالصور",
      optionKey: "finish",
      options: [
        { id: "borderless", label: "بلا إطار", emoji: "⬜", description: "حتى الحواف", price: 0 },
        { id: "border", label: "مع إطار أبيض", emoji: "▭", description: "هامش أبيض حول الصورة", price: 0 },
        { id: "whiteframe", label: "إطار عريض", emoji: "🖼️", description: "إطار أبيض عريض", price: 3 },
      ],
    },
    {
      id: "retouch",
      title: "تحسينات اختيارية",
      hint: "تحسين جودة الصورة",
      optionKey: "retouch",
      options: [
        { id: "none", label: "بدون تعديل", emoji: "✅", description: "طباعة كما هي", price: 0 },
        { id: "auto", label: "تعديل تلقائي", emoji: "🎨", description: "سطوع وتباين وحدة لون", price: 2 },
        { id: "removebg", label: "إزالة الخلفية", emoji: "✂️", description: "خلفية بيضاء/شفافة", price: 5 },
        { id: "restore", label: "ترميم الصور", emoji: "🔧", description: "للصور القديمة والتالفة", price: 10 },
      ],
    },
  ],
  quickPicks: {
    economic: { photoSize: "10x15", paperType: "glossy", dpiBoost: "auto", imageFit: "keep-ratio", finish: "borderless", retouch: "none" },
    premium: { photoSize: "20x30", paperType: "premium", dpiBoost: "dpi-300", imageFit: "keep-ratio", finish: "borderless", retouch: "auto" },
  },
  smartRules: [
    { when: { optionKey: "photoSize", optionId: "20x30" }, suggest: { optionKey: "dpiBoost", optionId: "dpi-300", message: "الحجم الكبير يحتاج دقة عالية" } },
    { when: { optionKey: "paperType", optionId: "metallic" }, suggest: { optionKey: "dpiBoost", optionId: "dpi-300", message: "الورق المعدني يحتاج دقة 300 DPI" } },
  ],
};

// ============================================================
// تجليد الكتب والبحوث - الخدمة الأساسية هي التجليد نفسه
// ============================================================
export const BINDING_SPEC: ServiceSpec = {
  type: "binding",
  name: "تجليد",
  emoji: "📚",
  description: "تدبيس، لولبي، غراء، حراري",
  popularity: 40,
  basePricePerPage: 0,
  accepts: ["PDF", "DOCX"],
  hasPageCount: true,
  hasPrintRange: false,
  unit: "نسخة",
  sections: [
    {
      id: "bindingType",
      title: "نوع التجليد",
      hint: "الأساسية لهذه الخدمة",
      optionKey: "bindingType",
      options: [
        { id: "staple", label: "تدبيس", emoji: "📌", description: "سريع وبسيط — للأوراق القليلة", price: 2 },
        { id: "spiral", label: "لولبي بلاستيكي", emoji: "🌀", description: "يُفتح 360° — مرونة كاملة", price: 15, note: "الأكثر طلباً" },
        { id: "spiral-metal", label: "لولبي معدني", emoji: "⛓️", description: "متين وفاخر — للكتب الثقيلة", price: 25 },
        { id: "glue", label: "غراء حراري", emoji: "📚", description: "احترافي — للكتب والروايات", price: 20 },
        { id: "thermal", label: "حراري بغلاف", emoji: "📕", description: "غلاف أمامي خلفي — مظهر كتاب", price: 35 },
        { id: "hardcover", label: "غلاف مقوّى فاخر", emoji: "📖", description: "تجليد فاخر بكتاب كامل", price: 80 },
      ],
    },
    {
      id: "coverColor",
      title: "لون الغلاف",
      hint: "للأغلفة الأمامية والخلفية",
      optionKey: "coverColor",
      options: [
        { id: "transparent", label: "شفاف", emoji: "⬜", description: "غلاف بلاستيكي شفاف", price: 0 },
        { id: "black", label: "أسود", emoji: "⬛", description: "غلاف أسود كلاسيكي", price: 0 },
        { id: "blue", label: "أزرق", emoji: "🟦", description: "غلاف أزرق", price: 0 },
        { id: "red", label: "أحمر", emoji: "🟥", description: "غلاف أحمر", price: 0 },
        { id: "leather", label: "جلد صناعي", emoji: "🟫", description: "مظهر جلدي فاخر", price: 10 },
      ],
    },
    {
      id: "coverPrint",
      title: "طباعة الغلاف",
      hint: "إضافة عنوان للغلاف",
      optionKey: "coverPrint",
      options: [
        { id: "none", label: "بدون طباعة", emoji: "📄", description: "غلاف فارغ", price: 0 },
        { id: "bw-title", label: "عنوان أبيض وأسود", emoji: "🏷️", description: "طباعة عنوان بسيط", price: 5 },
        { id: "color-title", label: "عنوان ملون", emoji: "🎨", description: "طباعة عنوان ملون", price: 10 },
        { id: "full-design", label: "تصميم كامل", emoji: "💎", description: "تصميم غلاف احترافي كامل", price: 25 },
      ],
    },
    {
      id: "pageNumbering",
      title: "ترقيم الصفحات",
      hint: "إضافة أرقام للصفحات",
      optionKey: "pageNumbering",
      options: [
        { id: "none", label: "بدون ترقيم", emoji: "📄", description: "بدون أرقام", price: 0 },
        { id: "simple", label: "ترقيم بسيط", emoji: "🔢", description: "أرقام في الأسفل", price: 2 },
        { id: "with-header", label: "ترقيم مع عنوان", emoji: "📋", description: "رقم الصفحة + عنوان", price: 5 },
        { id: "center", label: "ترقيم مركزي", emoji: "📊", description: "أرقام في المنتصف السفلي", price: 3 },
      ],
    },
    {
      id: "extras",
      title: "إضافات",
      hint: "لمسات احترافية",
      optionKey: "extras",
      options: [
        { id: "tabs", label: "فواصم ملونة", emoji: "🔖", description: "فواصل بين الفصول", price: 8 },
        { id: "lamination", label: "تغليف حراري", emoji: "♻️", description: "حماية الغلاف", price: 6 },
        { id: "ribbon", label: "إشارة مرجعية", emoji: "🎀", description: "شريط علامة للصفحات", price: 4 },
      ],
    },
  ],
  quickPicks: {
    economic: { bindingType: "staple", coverColor: "transparent", coverPrint: "none", pageNumbering: "none", extras: [] },
    premium: { bindingType: "thermal", coverColor: "leather", coverPrint: "color-title", pageNumbering: "simple", extras: [] },
  },
};

// ============================================================
// نسخ المستندات
// ============================================================
export const COPY_SPEC: ServiceSpec = {
  type: "copy",
  name: "نسخ مستندات",
  emoji: "📄",
  description: "نسخ سريعة متعددة",
  popularity: 35,
  basePricePerPage: 0.40,
  accepts: ["PDF", "JPG", "PNG"],
  hasPageCount: true,
  hasPrintRange: true,
  unit: "صفحة",
  sections: [
    {
      id: "color",
      title: "نوع النسخ",
      hint: "نسخ ملون أو أبيض وأسود",
      optionKey: "color",
      options: [
        { id: "bw", label: "أبيض وأسود", emoji: "⬛", description: "اقتصادي — للنصوص", multiplier: 1 },
        { id: "color", label: "ملون", emoji: "🎨", description: "نسخة طبق الأصل", multiplier: 2.5 },
      ],
    },
    {
      id: "paperSize",
      title: "حجم الورق",
      hint: "",
      optionKey: "paperSize",
      options: [
        { id: "A4", label: "A4", description: "21×29.7 سم", multiplier: 1, note: "الأكثر طلباً" },
        { id: "A3", label: "A3", description: "29.7×42 سم", multiplier: 2 },
        { id: "Legal", label: "Legal", description: "21×35.6 سم", multiplier: 1.3 },
      ],
    },
    {
      id: "sides",
      title: "الوجهين",
      hint: "",
      optionKey: "sides",
      options: [
        { id: "single", label: "وجه واحد", emoji: "📄", description: "طباعة وجه واحد" },
        { id: "double", label: "وجهان", emoji: "📑", description: "توفير 50%", note: "تخفيض 50%" },
      ],
    },
    {
      id: "paperType",
      title: "نوع الورق",
      hint: "",
      optionKey: "paperType",
      options: [
        { id: "normal", label: "عادي", emoji: "📄", description: "80 غرام", pricePerPage: 0 },
        { id: "recycled", label: "مُعاد تدويره", emoji: "♻️", description: "صديق للبيئة", pricePerPage: -0.10, note: "خصم" },
      ],
    },
    {
      id: "sorting",
      title: "ترتيب النسخ",
      hint: "كيف ترتيب الصفحات",
      optionKey: "sorting",
      options: [
        { id: "collated", label: "مرتبة", emoji: "📑", description: "نسخة كاملة ثم الأخرى", price: 0 },
        { id: "uncollated", label: "غير مرتبة", emoji: "📄", description: "كل الصفحات معاً", price: 0 },
      ],
    },
  ],
  quickPicks: {
    economic: { color: "bw", paperSize: "A4", sides: "double", paperType: "normal", sorting: "collated" },
    premium: { color: "color", paperSize: "A4", sides: "double", paperType: "normal", sorting: "collated" },
  },
};

// ============================================================
// البطاقات - بطاقات عمل، دعوات، هوية
// ============================================================
export const CARD_SPEC: ServiceSpec = {
  type: "card",
  name: "بطاقات",
  emoji: "🪪",
  description: "بطاقات عمل، دعوات، هوية",
  popularity: 25,
  basePricePerPage: 3,
  accepts: ["PDF", "JPG", "PNG"],
  hasPageCount: false, // البطاقات تُحسب بالقطعة
  hasPrintRange: false,
  unit: "بطاقة",
  sections: [
    {
      id: "cardType",
      title: "نوع البطاقة",
      hint: "حسب الاستخدام",
      optionKey: "cardType",
      options: [
        { id: "business", label: "بطاقة عمل", emoji: "💼", description: "9×5.5 سم", multiplier: 1, note: "الأكثر طلباً" },
        { id: "id", label: "بطاقة هوية", emoji: "🪪", description: "8.5×5.4 سم", multiplier: 1 },
        { id: "invitation", label: "دعوة", emoji: "💌", description: "A6 (10.5×14.8 سم)", multiplier: 1.5 },
        { id: "greeting", label: "بطاقة تهنئة", emoji: "🎉", description: "A5 مطوية", multiplier: 2 },
        { id: "loyalty", label: "بطاقة ولاء", emoji: "⭐", description: "بطاقة بلاستيكية", multiplier: 1.5 },
      ],
    },
    {
      id: "paperType",
      title: "نوع الورق",
      hint: "أوراق سميكة للبطاقات",
      optionKey: "paperType",
      options: [
        { id: "cardboard-250", label: "مقوّى 250 غرام", emoji: "💳", description: "وزن قياسي للبطاقات", pricePerPage: 0, note: "القياسي" },
        { id: "cardboard-300", label: "مقوّى 300 غرام", emoji: "💳", description: "أثقل وأفخم", pricePerPage: 1 },
        { id: "cardboard-350", label: "مقوّى 350 غرام", emoji: "💳", description: "وزن فاخر", pricePerPage: 2 },
        { id: "pvc", label: "بلاستيك PVC", emoji: "🪪", description: "بطاقة بلاستيكية متينة", pricePerPage: 5 },
      ],
    },
    {
      id: "lamination",
      title: "التغليف (لمنيشن)",
      hint: "حماية ولمعان إضافي",
      optionKey: "lamination",
      options: [
        { id: "none", label: "بدون", emoji: "📄", description: "بدون تغليف", price: 0 },
        { id: "glossy-lam", label: "تغليف لامع", emoji: "✨", description: "لمعان وحماية", price: 1.50 },
        { id: "matte-lam", label: "تغليف مطفي", emoji: "🔲", description: "مظهر راقي غير عاكس", price: 1.50 },
        { id: "soft-touch", label: "لمسة ناعمة", emoji: "🤚", description: "ملمس حريري فاخر", price: 3 },
        { id: "spot-uv", label: "UV بارز", emoji: "💎", description: "لمعان بارز على عناصر محددة", price: 5 },
      ],
    },
    {
      id: "printMethod",
      title: "طريقة الطباعة",
      hint: "حسب الكمية المطلوبة",
      optionKey: "printMethod",
      options: [
        { id: "digital", label: "رقمية", emoji: "🖨️", description: "للكميات القليلة السريعة", multiplier: 1, note: "الأسرع" },
        { id: "offset", label: "أوفست", emoji: "🏭", description: "للكميات الكبيرة (100+)", multiplier: 0.5, note: "أرخص" },
      ],
    },
    {
      id: "finish",
      title: "التشطيب",
      hint: "لمسات نهائية",
      optionKey: "finish",
      options: [
        { id: "standard", label: "حروف قياسية", emoji: "✏️", description: "بدون تشطيب خاص", price: 0 },
        { id: "foil", label: "ختم ذهبي/فضي", emoji: "🥇", description: "حروف بريق معدني", price: 4 },
        { id: "emboss", label: "نقش بارز", emoji: "🔝", description: "حروف بارزة لمسة", price: 6 },
        { id: "rounded", label: "حواف مدورة", emoji: "⬭", description: "زوايا دائرية", price: 1 },
      ],
    },
    {
      id: "sides",
      title: "الوجهين",
      hint: "طباعة وجه أو وجهين",
      optionKey: "sides",
      options: [
        { id: "single", label: "وجه واحد", emoji: "📄", description: "الوجه الأمامي فقط" },
        { id: "double", label: "وجهان", emoji: "📑", description: "أمامي وخلفي", multiplier: 1.5 },
      ],
    },
  ],
  quickPicks: {
    economic: { cardType: "business", paperType: "cardboard-250", lamination: "none", printMethod: "digital", finish: "standard", sides: "single" },
    premium: { cardType: "business", paperType: "cardboard-350", lamination: "soft-touch", printMethod: "digital", finish: "foil", sides: "double" },
  },
};

// ============================================================
// الملصقات والبوسترات
// ============================================================
export const POSTER_SPEC: ServiceSpec = {
  type: "poster",
  name: "ملصقات",
  emoji: "📜",
  description: "ملصقات كبيرة، لافتات، إعلانات",
  popularity: 20,
  basePricePerPage: 5,
  accepts: ["PDF", "JPG", "PNG"],
  hasPageCount: false, // الملصقات تُحسب بالقطعة
  hasPrintRange: false,
  unit: "ملصق",
  sections: [
    {
      id: "posterSize",
      title: "حجم الملصق",
      hint: "حسب الاستخدام",
      optionKey: "posterSize",
      options: [
        { id: "A3", label: "A3", emoji: "📜", description: "29.7×42 سم", multiplier: 1, note: "صغير" },
        { id: "A2", label: "A2", emoji: "📜", description: "42×59.4 سم", multiplier: 2 },
        { id: "A1", label: "A1", emoji: "📜", description: "59.4×84 سم", multiplier: 3.5, note: "الأكثر طلباً" },
        { id: "A0", label: "A0", emoji: "📜", description: "84×118.9 سم", multiplier: 6 },
        { id: "custom", label: "حجم مخصص", emoji: "📐", description: "حسب الطلب", multiplier: 4 },
      ],
    },
    {
      id: "material",
      title: "الخامة",
      hint: "نوع المادة المطبوع عليها",
      optionKey: "material",
      options: [
        { id: "glossy-paper", label: "ورق لامع", emoji: "✨", description: "لمعان عالي — للألوان الزاهية", pricePerPage: 0, note: "القياسي" },
        { id: "matte-paper", label: "ورق مطفي", emoji: "🔲", description: "غير عاكس — لمسحة راقية", pricePerPage: 1 },
        { id: "photo-paper", label: "ورق فوتوغرافي", emoji: "📷", description: "جودة صورة عالية", pricePerPage: 2.50 },
        { id: "vinyl", label: "فينيل (PVC)", emoji: "🏷️", description: "مقاوم للماء — للخارج", pricePerPage: 6 },
        { id: "canvas", label: "قماش كانفاس", emoji: "🖼️", description: "لللوحات الفنية", pricePerPage: 8 },
        { id: "fabric", label: "قماش", emoji: "🧵", description: "لللافتات القماشية", pricePerPage: 7 },
      ],
    },
    {
      id: "colorProcessing",
      title: "معالجة الألوان",
      hint: "ضبط الألوان للملصق",
      optionKey: "colorProcessing",
      options: [
        { id: "as-is", label: "كما هو", emoji: "✅", description: "بدون تعديل", price: 0 },
        { id: "enhance", label: "تعزيز الألوان", emoji: "🎨", description: "تشبع عالي", pricePerPage: 3 },
        { id: "color-correct", label: "تصحيح ألوان", emoji: "🎯", description: "ضبط دقيق", pricePerPage: 6 },
      ],
    },
    {
      id: "lamination",
      title: "التغليف الواقي",
      hint: "حماية إضافية",
      optionKey: "lamination",
      options: [
        { id: "none", label: "بدون", emoji: "📄", description: "بدون تغليف", price: 0 },
        { id: "glossy-lam", label: "تغليف لامع", emoji: "✨", description: "حماية ولمعان", price: 10 },
        { id: "matte-lam", label: "تغليف مطفي", emoji: "🔲", description: "حماية بدون لمعان", price: 10 },
        { id: "uv-resist", label: "مقاوم UV", emoji: "☀️", description: "ضد الشمس — للخارج", price: 20 },
      ],
    },
    {
      id: "printMethod",
      title: "طريقة الطباعة",
      hint: "حسب حجم الملصق والكمية",
      optionKey: "printMethod",
      options: [
        { id: "digital", label: "رقمية", emoji: "🖨️", description: "سريع للكميات القليلة", multiplier: 1, note: "القياسي" },
        { id: "offset", label: "أوفست", emoji: "🏭", description: "للكميات الكبيرة", multiplier: 0.7 },
        { id: "large-format", label: "طباعة كبيرة", emoji: "📐", description: "مباشر للملصقات الكبيرة", multiplier: 1.2, note: "موصى به" },
      ],
    },
    {
      id: "finish",
      title: "التشطيب",
      hint: "تحضير للتعليق",
      optionKey: "finish",
      options: [
        { id: "plain", label: "عادي", emoji: "📄", description: "بدون تشطيب", price: 0 },
        { id: "grommets", label: "حلقات معدنية", emoji: "⭕", description: "ثقوب للحلقات — للتعليق", price: 5 },
        { id: "rod", label: "مع عصا", emoji: "🪵", description: "عصا علوية وسفلية", price: 15 },
        { id: "frame", label: "بإطار", emoji: "🖼️", description: "إطار جاهز للتعليق", price: 30 },
      ],
    },
  ],
  quickPicks: {
    economic: { posterSize: "A3", material: "glossy-paper", colorProcessing: "as-is", lamination: "none", printMethod: "digital", finish: "plain" },
    premium: { posterSize: "A1", material: "photo-paper", colorProcessing: "enhance", lamination: "glossy-lam", printMethod: "large-format", finish: "grommets" },
  },
};

// ============================================================
// تصميم مخصص — بنرات، هدايا تخرج 3D، أشكال، تصاميم حسب الطلب
// ============================================================
export const CUSTOM_DESIGN_SPEC: ServiceSpec = {
  type: "custom-design",
  name: "تصميم مخصص",
  emoji: "🎨",
  description: "بنرات، هدايا تخرج ثلاثية الأبعاد، أشكال مخصصة، وتصاميم حسب الطلب",
  popularity: 80,
  basePricePerPage: 10,
  accepts: ["pdf", "jpg", "jpeg", "png", "webp"],
  isPopular: true,
  hasPageCount: false,
  hasPrintRange: false,
  unit: "تصميم",
  sections: [
    {
      id: "design-type",
      title: "نوع التصميم",
      hint: "اختر نوع المنتج النهائي",
      optionKey: "designType",
      options: [
        { id: "banner", label: "بنر إعلاني", emoji: "🏷️", price: 20 },
        { id: "rollup", label: "ستاند رول أب", emoji: "📐", price: 50 },
        { id: "graduation-3d", label: "هدية تخرج 3D", emoji: "🎓", price: 30 },
        { id: "sticker", label: "ملصق مخصص", emoji: "⭐", price: 5 },
        { id: "card-custom", label: "بطاقة دعوة/شكر", emoji: "💌", price: 4 },
        { id: "photo-frame", label: "إطار صورة", emoji: "🖼️", price: 8 },
        { id: "poster-custom", label: "ملصق مخصص الحجم", emoji: "📐", price: 15 },
        { id: "other", label: "تصميم آخر", emoji: "✨", price: 10 },
      ],
    },
    {
      id: "dimensions",
      title: "الأبعاد",
      hint: "حدد حجم التصميم",
      optionKey: "dimensions",
      options: [
        { id: "a3", label: "A3 (29.7 × 42 سم)", emoji: "📄", multiplier: 1 },
        { id: "a2", label: "A2 (42 × 59.4 سم)", emoji: "📄", multiplier: 1.8 },
        { id: "a1", label: "A1 (59.4 × 84.1 سم)", emoji: "📄", multiplier: 3 },
        { id: "a0", label: "A0 (84.1 × 118.9 سم)", emoji: "📄", multiplier: 5 },
        { id: "custom-sm", label: "صغير (حتى 20×30 سم)", emoji: "📏", price: 5 },
        { id: "custom-md", label: "متوسط (حتى 50×70 سم)", emoji: "📏", price: 10 },
        { id: "custom-lg", label: "كبير (حتى 100×150 سم)", emoji: "📏", price: 20 },
        { id: "custom-xl", label: "كبير جداً (حتى 200×300 سم)", emoji: "📏", price: 40 },
      ],
    },
    {
      id: "material",
      title: "المادة",
      optionKey: "material",
      options: [
        { id: "paper-glossy", label: "ورق لامع", emoji: "✨", pricePerPage: 1 },
        { id: "paper-matte", label: "ورق مطفي", emoji: "📄", pricePerPage: 0.50 },
        { id: "vinyl", label: "فينيل (ملصقات)", emoji: "🔧", pricePerPage: 3 },
        { id: "pvc", label: "PVC (بنرات)", emoji: "🏗️", pricePerPage: 5 },
        { id: "foam-board", label: "فوم بورد (3D)", emoji: "📦", pricePerPage: 8 },
        { id: "flex", label: "فلكس (بنرات خارجية)", emoji: "🏗️", pricePerPage: 4 },
        { id: "canvas", label: "قماش كانفاس", emoji: "🎨", pricePerPage: 6 },
        { id: "sticker-paper", label: "ورق ملصقات", emoji: "⭐", pricePerPage: 1.50 },
      ],
    },
    {
      id: "print-quality",
      title: "جودة الطباعة",
      optionKey: "printQuality",
      options: [
        { id: "normal", label: "عادية (72 DPI)", emoji: "📋", multiplier: 1 },
        { id: "high", label: "عالية (150 DPI)", emoji: "📐", multiplier: 1.5 },
        { id: "photo", label: "فوتوغرافية (300 DPI)", emoji: "🖼️", multiplier: 2.5 },
        { id: "ultra", label: "فائقة الدقة", emoji: "💎", multiplier: 4 },
      ],
    },
    {
      id: "finishing",
      title: "التشطيب",
      optionKey: "finishing",
      options: [
        { id: "none", label: "بدون", emoji: "➖" },
        { id: "laminate", label: "لمينات (حماية)", emoji: "🛡️", price: 5 },
        { id: "glossy", label: "لمعان", emoji: "✨", price: 3 },
        { id: "matte", label: "مطفي", emoji: "🌫️", price: 3 },
        { id: "uv-coat", label: "طباعة UV", emoji: "☀️", price: 8 },
        { id: "cut", label: "قص على الشكل", emoji: "✂️", price: 10, note: "قص حسب حدود التصميم" },
        { id: "fold", label: "طيّ", emoji: "📐", price: 4 },
        { id: "mount", label: "تركيب على لوح", emoji: "🏗️", price: 12 },
      ],
    },
  ],
  quickPicks: {
    economic: { designType: "sticker", dimensions: "custom-sm", material: "sticker-paper", printQuality: "normal", finishing: "none" },
    premium: { designType: "banner", dimensions: "a1", material: "pvc", printQuality: "high", finishing: "laminate" },
  },
};

export const SERVICE_SPECS: Record<ServiceType, ServiceSpec> = {
  document: DOCUMENT_SPEC,
  photo: PHOTO_SPEC,
  binding: BINDING_SPEC,
  copy: COPY_SPEC,
  card: CARD_SPEC,
  poster: POSTER_SPEC,
  "custom-design": CUSTOM_DESIGN_SPEC,
};

export const SPEC_LIST: ServiceSpec[] = [
  DOCUMENT_SPEC,
  PHOTO_SPEC,
  BINDING_SPEC,
  COPY_SPEC,
  CARD_SPEC,
  POSTER_SPEC,
  CUSTOM_DESIGN_SPEC,
];

// ============================================================
// حساب السعر بالمواصفات المخصصة
// ============================================================
export interface PricingResult {
  perPage: number;
  pagesCost: number;
  copiesCost: number;
  sidesSaving: number;
  extrasCost: number;
  finishingCost: number;
  deliveryCost: number;
  discount: number;
  total: number;
  breakdown: { label: string; amount: number }[];
}

export interface PricingRequest {
  serviceType: string;
  pages: number;
  copies: number;
  delivery: string;
  selectedOptions: Record<string, string>; // optionKey -> optionId
  /** مواصفات الخدمة — إذا لم تُمرَّر، يُستخدم SERVICE_SPECS[serviceType] */
  spec?: ServiceSpec;
}

const DELIVERY_SURCHARGE: Record<string, number> = {
  hour: 10,
  today: 0,
  tomorrow: 0,
  scheduled: 0,
};

export function calculatePricingCustom(req: PricingRequest): PricingResult {
  const spec = req.spec || (SERVICE_SPECS as Record<string, ServiceSpec>)[req.serviceType];
  if (!spec) {
    // خدمة غير موجودة — نُرجع سعر صفري مع تفاصيل
    return {
      perPage: 0,
      pagesCost: 0,
      copiesCost: 0,
      sidesSaving: 0,
      extrasCost: 0,
      finishingCost: 0,
      deliveryCost: 0,
      discount: 0,
      total: 0,
      breakdown: [{ label: "خدمة غير معروفة", amount: 0 }],
    };
  }
  const basePerPage = spec.basePricePerPage;
  const breakdown: { label: string; amount: number }[] = [];

  // حساب سعر الصفحة من كل الخيارات
  let perPageMultiplier = 1;
  let perPageAddition = 0;
  let flatExtras = 0;

  spec.sections.forEach((section) => {
    const selectedId = req.selectedOptions[section.optionKey];
    if (!selectedId) return;
    const opt = section.options.find((o) => o.id === selectedId);
    if (!opt) return;

    if (opt.multiplier) perPageMultiplier *= opt.multiplier;
    if (opt.pricePerPage) {
      perPageAddition += opt.pricePerPage;
      // إضافة تفصيل التكلفة لكل صفحة في البحث
      const pageCost = (opt.pricePerPage > 0 ? opt.pricePerPage : opt.pricePerPage) * req.pages * req.copies;
      if (pageCost !== 0) {
        breakdown.push({
          label: `${section.title}: ${opt.label}`,
          amount: Math.round(pageCost),
        });
      }
    }
    if (opt.price) {
      flatExtras += opt.price;
      if (opt.price > 0) {
        breakdown.push({ label: `${section.title}: ${opt.label}`, amount: opt.price * req.copies });
      }
    }
  });

  // تطبيق خصم الوجهين (50% على عدد الصفحات)
  const sidesOpt = req.selectedOptions.sides;
  let sidesSaving = 0;
  let effectivePages = req.pages;
  if (sidesOpt === "double") {
    sidesSaving = Math.floor(req.pages / 2) * 0; // الورق موفّر لكن السعر نفسه عادةً
    effectivePages = Math.ceil(req.pages / 2);
  }

  const perPage = Math.max(0, Math.round(basePerPage * perPageMultiplier + perPageAddition));
  const pagesCost = perPage * effectivePages;
  let copiesCost = pagesCost * req.copies;

  if (sidesSaving > 0) {
    copiesCost -= sidesSaving * req.copies;
  }

  breakdown.unshift({ label: `طباعة (${effectivePages} صفحة × ${req.copies} نسخة)`, amount: copiesCost });

  const finishingCost = flatExtras * req.copies;
  const deliveryCost = DELIVERY_SURCHARGE[req.delivery] || 0;
  if (deliveryCost > 0) breakdown.push({ label: "توصيل عاجل", amount: deliveryCost });

  // خصم الكمية
  let discount = 0;
  if (req.copies >= 50) discount = Math.round(copiesCost * 0.15);
  else if (req.copies >= 10) discount = Math.round(copiesCost * 0.1);
  if (discount > 0) breakdown.push({ label: "خصم الكمية", amount: -discount });

  const total = Math.max(1, copiesCost + finishingCost + deliveryCost - discount);

  return {
    perPage,
    pagesCost,
    copiesCost,
    sidesSaving,
    extrasCost: 0,
    finishingCost,
    deliveryCost,
    discount,
    total,
    breakdown,
  };
}
