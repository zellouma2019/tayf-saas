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

/// تنسيق المبلغ بالعملة حسب البلد أو عملة مخصصة
export function formatCurrency(
  amount: number | undefined | null,
  countryCode?: string | null,
  customCurrencyCode?: string | null,
): string {
  // إذا كانت هناك عملة مخصصة، استخدمها
  if (customCurrencyCode) {
    return formatCustomCurrency(amount, customCurrencyCode);
  }

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
export function formatDA(n: number | undefined | null, countryCode?: string | null, customCurrencyCode?: string | null): string {
  return formatCurrency(n, countryCode, customCurrencyCode);
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

// ============================================================
// عملات أجنبية إضافية
// ============================================================

export interface ForeignCurrency {
  code: string;
  symbol: string;
  nameAr: string;
  nameEn: string;
  flag: string;
  decimals: number;
  numberFormat: "en" | "fr" | "ar";
}

export const FOREIGN_CURRENCIES: ForeignCurrency[] = [
  { code: "USD", symbol: "$", nameAr: "دولار أمريكي", nameEn: "US Dollar", flag: "🇺🇸", decimals: 2, numberFormat: "en" },
  { code: "EUR", symbol: "€", nameAr: "يورو", nameEn: "Euro", flag: "🇪🇺", decimals: 2, numberFormat: "fr" },
  { code: "GBP", symbol: "£", nameAr: "جنيه إسترليني", nameEn: "British Pound", flag: "🇬🇧", decimals: 2, numberFormat: "en" },
  { code: "TRY", symbol: "₺", nameAr: "ليرة تركية", nameEn: "Turkish Lira", flag: "🇹🇷", decimals: 2, numberFormat: "en" },
  { code: "CNY", symbol: "¥", nameAr: "يوان صيني", nameEn: "Chinese Yuan", flag: "🇨🇳", decimals: 2, numberFormat: "en" },
  { code: "INR", symbol: "₹", nameAr: "روبية هندية", nameEn: "Indian Rupee", flag: "🇮🇳", decimals: 2, numberFormat: "en" },
  { code: "JPY", symbol: "¥", nameAr: "ين ياباني", nameEn: "Japanese Yen", flag: "🇯🇵", decimals: 0, numberFormat: "en" },
  { code: "CAD", symbol: "C$", nameAr: "دولار كندي", nameEn: "Canadian Dollar", flag: "🇨🇦", decimals: 2, numberFormat: "en" },
  { code: "AUD", symbol: "A$", nameAr: "دولار أسترالي", nameEn: "Australian Dollar", flag: "🇦🇺", decimals: 2, numberFormat: "en" },
  { code: "CHF", symbol: "Fr", nameAr: "فرنك سويسري", nameEn: "Swiss Franc", flag: "🇨🇭", decimals: 2, numberFormat: "en" },
  { code: "MAD", symbol: "د.م", nameAr: "درهم مغربي", nameEn: "Moroccan Dirham", flag: "🇲🇦", decimals: 2, numberFormat: "fr" },
  { code: "TND", symbol: "د.ت", nameAr: "دينار تونسي", nameEn: "Tunisian Dinar", flag: "🇹🇳", decimals: 3, numberFormat: "fr" },
  { code: "LYD", symbol: "د.ل", nameAr: "دينار ليبي", nameEn: "Libyan Dinar", flag: "🇱🇾", decimals: 3, numberFormat: "ar" },
  { code: "SAR", symbol: "ر.س", nameAr: "ريال سعودي", nameEn: "Saudi Riyal", flag: "🇸🇦", decimals: 2, numberFormat: "ar" },
  { code: "AED", symbol: "د.إ", nameAr: "درهم إماراتي", nameEn: "UAE Dirham", flag: "🇦🇪", decimals: 2, numberFormat: "ar" },
  { code: "QAR", symbol: "ر.ق", nameAr: "ريال قطري", nameEn: "Qatari Riyal", flag: "🇶🇦", decimals: 2, numberFormat: "ar" },
  { code: "KWD", symbol: "د.ك", nameAr: "دينار كويتي", nameEn: "Kuwaiti Dinar", flag: "🇰🇼", decimals: 3, numberFormat: "ar" },
  { code: "BHD", symbol: "د.ب", nameAr: "دينار بحريني", nameEn: "Bahraini Dinar", flag: "🇧🇭", decimals: 3, numberFormat: "ar" },
  { code: "OMR", symbol: "ر.ع", nameAr: "ريال عماني", nameEn: "Omani Rial", flag: "🇴🇲", decimals: 3, numberFormat: "ar" },
  { code: "JOD", symbol: "د.أ", nameAr: "دينار أردني", nameEn: "Jordanian Dinar", flag: "🇯🇴", decimals: 3, numberFormat: "ar" },
  { code: "EGP", symbol: "ج.م", nameAr: "جنيه مصري", nameEn: "Egyptian Pound", flag: "🇪🇬", decimals: 2, numberFormat: "ar" },
  { code: "IQD", symbol: "د.ع", nameAr: "دينار عراقي", nameEn: "Iraqi Dinar", flag: "🇮🇶", decimals: 3, numberFormat: "ar" },
  { code: "LBP", symbol: "ل.ل", nameAr: "ليرة لبنانية", nameEn: "Lebanese Pound", flag: "🇱🇧", decimals: 0, numberFormat: "ar" },
  { code: "SYP", symbol: "ل.س", nameAr: "ليرة سورية", nameEn: "Syrian Pound", flag: "🇸🇾", decimals: 0, numberFormat: "ar" },
  { code: "YER", symbol: "ر.ي", nameAr: "ريال يمني", nameEn: "Yemeni Rial", flag: "🇾🇪", decimals: 0, numberFormat: "ar" },
  { code: "SDG", symbol: "ج.س", nameAr: "جنيه سوداني", nameEn: "Sudanese Pound", flag: "🇸🇩", decimals: 2, numberFormat: "ar" },
  { code: "DZD", symbol: "د.ج", nameAr: "دينار جزائري", nameEn: "Algerian Dinar", flag: "🇩🇿", decimals: 2, numberFormat: "fr" },
  { code: "MRU", symbol: "أ.م", nameAr: "أوقية موريتانية", nameEn: "Mauritanian Ouguiya", flag: "🇲🇷", decimals: 2, numberFormat: "fr" },
  { code: "SOS", symbol: "ش.ص", nameAr: "شلن صومالي", nameEn: "Somali Shilling", flag: "🇸🇴", decimals: 0, numberFormat: "en" },
  { code: "XAF", symbol: "ف.ج", nameAr: "فرنك أفريقي", nameEn: "CFA Franc", flag: "🌍", decimals: 0, numberFormat: "fr" },
];

export function getForeignCurrency(code: string): ForeignCurrency | undefined {
  return FOREIGN_CURRENCIES.find((c) => c.code === code);
}

/// تنسيق المبلغ بعملة مخصصة
export function formatCustomCurrency(
  amount: number | undefined | null,
  currencyCode: string,
): string {
  if (amount == null || isNaN(amount)) {
    const fc = getForeignCurrency(currencyCode);
    return `0 ${fc?.symbol || currencyCode}`;
  }
  const fc = getForeignCurrency(currencyCode);
  if (!fc) return `${amount} ${currencyCode}`;
  const formatted = amount.toLocaleString(
    fc.numberFormat === "ar" ? "ar-SA-u-nu-latn" : fc.numberFormat === "fr" ? "fr-FR" : "en-US",
    { minimumFractionDigits: fc.decimals > 0 ? Math.min(fc.decimals, 2) : 0, maximumFractionDigits: fc.decimals > 0 ? Math.min(fc.decimals, 2) : 0 },
  );
  return `${formatted} ${fc.symbol}`;
}