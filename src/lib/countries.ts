// ============================================================
// بيانات الدول العربية والعملات
// ============================================================

export interface ArabCountry {
  /// كود ISO 3166-1 alpha-2
  code: string;
  /// كود العملة ISO 4217
  currencyCode: string;
  /// رمز العملة بالعربية (مثل: د.ج)
  currencySymbol: string;
  /// رمز العملة بالإنجليزية (مثل: DZD)
  currencyEn: string;
  /// اسم البلد بالعربية
  nameAr: string;
  /// اسم البلد بالإنجليزية
  nameEn: string;
  /// اسم البلد بالفرنسية
  nameFr: string;
  /// رمز الهاتف الدولي
  phonePrefix: string;
  /// اتجاه النص الرئيسي: "rtl" أو "ltr"
  dir: "rtl" | "ltr";
  /// اللغة الافتراضية
  defaultLang: string;
  /// تنسيق الأرقام: "ar" للعربية، "en" للغربية
  numberFormat: "ar" | "en" | "fr";
  /// علم البلد (إيموجي)
  flag: string;
  /// عدد المنازل العشرية للعملة
  decimals: number;
}

/// قائمة الدول العربية الأعضاء في جامعة الدول العربية
export const ARAB_COUNTRIES: ArabCountry[] = [
  { code: "DZ", currencyCode: "DZD", currencySymbol: "د.ج", currencyEn: "DZD", nameAr: "الجزائر", nameEn: "Algeria", nameFr: "Algérie", phonePrefix: "+213", dir: "ltr", defaultLang: "ar", numberFormat: "fr", flag: "🇩🇿", decimals: 2 },
  { code: "BH", currencyCode: "BHD", currencySymbol: "د.ب", currencyEn: "BHD", nameAr: "البحرين", nameEn: "Bahrain", nameFr: "Bahreïn", phonePrefix: "+973", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇧🇭", decimals: 3 },
  { code: "TD", currencyCode: "XAF", currencySymbol: "ف.ج", currencyEn: "XAF", nameAr: "تشاد", nameEn: "Chad", nameFr: "Tchad", phonePrefix: "+235", dir: "ltr", defaultLang: "ar", numberFormat: "fr", flag: "🇹🇩", decimals: 0 },
  { code: "KM", currencyCode: "KMF", currencySymbol: "ف.ج", currencyEn: "KMF", nameAr: "جزر القمر", nameEn: "Comoros", nameFr: "Comores", phonePrefix: "+269", dir: "ltr", defaultLang: "ar", numberFormat: "fr", flag: "🇰🇲", decimals: 0 },
  { code: "DJ", currencyCode: "DJF", currencySymbol: "ف.ج", currencyEn: "DJF", nameAr: "جيبوتي", nameEn: "Djibouti", nameFr: "Djibouti", phonePrefix: "+253", dir: "ltr", defaultLang: "ar", numberFormat: "fr", flag: "🇩🇯", decimals: 0 },
  { code: "EG", currencyCode: "EGP", currencySymbol: "ج.م", currencyEn: "EGP", nameAr: "مصر", nameEn: "Egypt", nameFr: "Égypte", phonePrefix: "+20", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇪🇬", decimals: 2 },
  { code: "IQ", currencyCode: "IQD", currencySymbol: "د.ع", currencyEn: "IQD", nameAr: "العراق", nameEn: "Iraq", nameFr: "Irak", phonePrefix: "+964", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇮🇶", decimals: 3 },
  { code: "JO", currencyCode: "JOD", currencySymbol: "د.أ", currencyEn: "JOD", nameAr: "الأردن", nameEn: "Jordan", nameFr: "Jordanie", phonePrefix: "+962", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇯🇴", decimals: 3 },
  { code: "KW", currencyCode: "KWD", currencySymbol: "د.ك", currencyEn: "KWD", nameAr: "الكويت", nameEn: "Kuwait", nameFr: "Koweït", phonePrefix: "+965", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇰🇼", decimals: 3 },
  { code: "LB", currencyCode: "LBP", currencySymbol: "ل.ل", currencyEn: "LBP", nameAr: "لبنان", nameEn: "Lebanon", nameFr: "Liban", phonePrefix: "+961", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇱🇧", decimals: 0 },
  { code: "LY", currencyCode: "LYD", currencySymbol: "د.ل", currencyEn: "LYD", nameAr: "ليبيا", nameEn: "Libya", nameFr: "Libye", phonePrefix: "+218", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇱🇾", decimals: 3 },
  { code: "MR", currencyCode: "MRU", currencySymbol: "أ.م", currencyEn: "MRU", nameAr: "موريتانيا", nameEn: "Mauritania", nameFr: "Mauritanie", phonePrefix: "+222", dir: "ltr", defaultLang: "ar", numberFormat: "fr", flag: "🇲🇷", decimals: 2 },
  { code: "MA", currencyCode: "MAD", currencySymbol: "د.م", currencyEn: "MAD", nameAr: "المغرب", nameEn: "Morocco", nameFr: "Maroc", phonePrefix: "+212", dir: "ltr", defaultLang: "ar", numberFormat: "fr", flag: "🇲🇦", decimals: 2 },
  { code: "OM", currencyCode: "OMR", currencySymbol: "ر.ع", currencyEn: "OMR", nameAr: "عُمان", nameEn: "Oman", nameFr: "Oman", phonePrefix: "+968", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇴🇲", decimals: 3 },
  { code: "PS", currencyCode: "ILS", currencySymbol: "ش.إ", currencyEn: "ILS", nameAr: "فلسطين", nameEn: "Palestine", nameFr: "Palestine", phonePrefix: "+970", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇵🇸", decimals: 2 },
  { code: "QA", currencyCode: "QAR", currencySymbol: "ر.ق", currencyEn: "QAR", nameAr: "قطر", nameEn: "Qatar", nameFr: "Qatar", phonePrefix: "+974", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇶🇦", decimals: 2 },
  { code: "SA", currencyCode: "SAR", currencySymbol: "ر.س", currencyEn: "SAR", nameAr: "السعودية", nameEn: "Saudi Arabia", nameFr: "Arabie Saoudite", phonePrefix: "+966", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇸🇦", decimals: 2 },
  { code: "SO", currencyCode: "SOS", currencySymbol: "ش.ص", currencyEn: "SOS", nameAr: "الصومال", nameEn: "Somalia", nameFr: "Somalie", phonePrefix: "+252", dir: "ltr", defaultLang: "ar", numberFormat: "en", flag: "🇸🇴", decimals: 0 },
  { code: "SD", currencyCode: "SDG", currencySymbol: "ج.س", currencyEn: "SDG", nameAr: "السودان", nameEn: "Sudan", nameFr: "Soudan", phonePrefix: "+249", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇸🇩", decimals: 2 },
  { code: "SY", currencyCode: "SYP", currencySymbol: "ل.س", currencyEn: "SYP", nameAr: "سوريا", nameEn: "Syria", nameFr: "Syrie", phonePrefix: "+963", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇸🇾", decimals: 0 },
  { code: "TN", currencyCode: "TND", currencySymbol: "د.ت", currencyEn: "TND", nameAr: "تونس", nameEn: "Tunisia", nameFr: "Tunisie", phonePrefix: "+216", dir: "ltr", defaultLang: "ar", numberFormat: "fr", flag: "🇹🇳", decimals: 3 },
  { code: "AE", currencyCode: "AED", currencySymbol: "د.إ", currencyEn: "AED", nameAr: "الإمارات", nameEn: "UAE", nameFr: "Émirats Arabes Unis", phonePrefix: "+971", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇦🇪", decimals: 2 },
  { code: "YE", currencyCode: "YER", currencySymbol: "ر.ي", currencyEn: "YER", nameAr: "اليمن", nameEn: "Yemen", nameFr: "Yémen", phonePrefix: "+967", dir: "rtl", defaultLang: "ar", numberFormat: "ar", flag: "🇾🇪", decimals: 0 },
];

/// خريطة سريعة: code → ArabCountry
const COUNTRIES_MAP = new Map(ARAB_COUNTRIES.map((c) => [c.code, c]));

/// جلب بلد بالكود
export function getCountry(code: string | null | undefined): ArabCountry | undefined {
  if (!code) return undefined;
  return COUNTRIES_MAP.get(code);
}

/// جلب بلد افتراضي
export function getDefaultCountry(): ArabCountry {
  return ARAB_COUNTRIES[0];
}

/// تنسيق المبلغ بالعملة حسب البلد
export function formatCurrency(
  amount: number | undefined | null,
  countryCode?: string | null,
): string {
  const defaultCountry = getDefaultCountry();
  if (amount == null || isNaN(amount)) {
    const c = getCountry(countryCode) || defaultCountry;
    return `0 ${c.currencySymbol}`;
  }

  const c = getCountry(countryCode) || defaultCountry;
  const formatted = amount.toLocaleString(
    c.numberFormat === "ar" ? "ar-SA-u-nu-latn" : c.numberFormat === "fr" ? "fr-FR" : "en-US",
    { minimumFractionDigits: c.decimals > 0 ? Math.min(c.decimals, 2) : 0, maximumFractionDigits: c.decimals > 0 ? Math.min(c.decimals, 2) : 0 },
  );
  return `${formatted} ${c.currencySymbol}`;
}

/// بديل متوافق مع formatDA القديم
export function formatDA(n: number | undefined | null, countryCode?: string | null): string {
  return formatCurrency(n, countryCode);
}

/// اللغات المدعومة
export interface AppLanguage {
  code: string;
  nameAr: string;
  nameEn: string;
  nameNative: string;
  dir: "rtl" | "ltr";
  flag: string;
}

export const APP_LANGUAGES: AppLanguage[] = [
  { code: "ar", nameAr: "العربية", nameEn: "Arabic", nameNative: "العربية", dir: "rtl", flag: "🌍" },
  { code: "fr", nameAr: "الفرنسية", nameEn: "French", nameNative: "Français", dir: "ltr", flag: "🇫🇷" },
  { code: "en", nameAr: "الإنجليزية", nameEn: "English", nameNative: "English", dir: "ltr", flag: "🇬🇧" },
  { code: "tr", nameAr: "التركية", nameEn: "Turkish", nameNative: "Türkçe", dir: "ltr", flag: "🇹🇷" },
  { code: "es", nameAr: "الإسبانية", nameEn: "Spanish", nameNative: "Español", dir: "ltr", flag: "🇪🇸" },
];

export function getLanguage(code: string | null | undefined): AppLanguage | undefined {
  return APP_LANGUAGES.find((l) => l.code === code);
}

export function getDefaultLanguage(): AppLanguage {
  return APP_LANGUAGES[0]; // العربية
}