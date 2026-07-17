// التحقق من أرقام الهاتف — يدعم جميع الدول العربية

import { getCountry } from "@/lib/countries";

/**
 * عدد الأرقام المطلوب لكل دولة عربية (بدون رمز الدولة)
 */
const PHONE_LENGTHS: Record<string, { min: number; max: number; local: number }> = {
  DZ: { min: 9, max: 10, local: 10 },  // Algeria: 0XXXXXXXXX (10) or 213XXXXXXXXX (12)
  BH: { min: 8, max: 8, local: 8 },     // Bahrain: 8 digits
  TD: { min: 7, max: 8, local: 7 },     // Chad: 7-8 digits
  KM: { min: 7, max: 7, local: 7 },     // Comoros: 7 digits
  DJ: { min: 7, max: 8, local: 8 },     // Djibouti: 8 digits
  EG: { min: 10, max: 11, local: 11 },  // Egypt: 010XXXXXXXX (11) or 10XXXXXXXX (10)
  IQ: { min: 10, max: 10, local: 10 },  // Iraq: 10 digits
  JO: { min: 9, max: 10, local: 10 },   // Jordan: 10 digits
  KW: { min: 8, max: 8, local: 8 },     // Kuwait: 8 digits
  LB: { min: 7, max: 8, local: 8 },     // Lebanon: 7-8 digits
  LY: { min: 9, max: 10, local: 10 },   // Libya: 10 digits
  MR: { min: 8, max: 8, local: 8 },     // Mauritania: 8 digits
  MA: { min: 9, max: 10, local: 10 },   // Morocco: 10 digits
  OM: { min: 8, max: 9, local: 9 },     // Oman: 9 digits
  PS: { min: 9, max: 10, local: 10 },   // Palestine: 10 digits
  QA: { min: 7, max: 8, local: 8 },     // Qatar: 8 digits
  SA: { min: 9, max: 10, local: 10 },   // Saudi: 10 digits
  SO: { min: 7, max: 9, local: 9 },     // Somalia: 9 digits
  SD: { min: 9, max: 10, local: 10 },   // Sudan: 10 digits
  SY: { min: 9, max: 10, local: 10 },   // Syria: 10 digits
  TN: { min: 8, max: 8, local: 8 },     // Tunisia: 8 digits
  AE: { min: 9, max: 10, local: 10 },   // UAE: 10 digits
  YE: { min: 9, max: 9, local: 9 },     // Yemen: 9 digits
};

/**
 * تنظيف رقم الهاتف من الأحرف غير الرقمية
 */
function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-+()]/g, "");
}

/**
 * التحقق من صحة رقم الهاتف حسب البلد
 * إذا لم يُحدد البلد، يقبل أي رقم بين 7-15 رقماً
 */
export function isValidPhone(phone: string, countryCode?: string | null): boolean {
  const cleaned = cleanPhone(phone);
  if (!cleaned || !/^\d+$/.test(cleaned)) return false;

  const lengths = countryCode ? PHONE_LENGTHS[countryCode] : undefined;
  if (lengths) {
    return cleaned.length >= lengths.min && cleaned.length <= lengths.max;
  }

  // بدون بلد محدد — قبول أي رقم بين 7-15
  return cleaned.length >= 7 && cleaned.length <= 15;
}

/**
 * @deprecated استخدم isValidPhone بدلاً منه
 */
export function isValidAlgerianPhone(phone: string): boolean {
  return isValidPhone(phone);
}

/**
 * تنسيق رقم الهاتف للعرض
 */
export function formatPhone(phone: string, countryCode?: string | null): string {
  const cleaned = cleanPhone(phone);

  // تنسيق خاص بالجزائر
  if (countryCode === "DZ" && /^0(5|6|7|3)\d{8}$/.test(cleaned)) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{2})(\d{2})(\d{1})/, "$1 $2 $3 $4 $5");
  }

  // تنسيق عام: تجميع كل 3 أرقام من اليمين
  if (cleaned.length >= 8) {
    return cleaned.replace(/(\d+)(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3 $4");
  }
  return phone;
}

/**
 * معلومات التحقق التفصيلية لرقم الهاتف
 */
export function getPhoneValidationInfo(phone: string, countryCode?: string | null): {
  isValid: boolean;
  digitCount: number;
  expectedMin: number;
  expectedMax: number;
  message: string | null;
  countryName: string | null;
} {
  const trimmed = phone.trim();

  // فارغ
  if (!trimmed) {
    return {
      isValid: false,
      digitCount: 0,
      expectedMin: 7,
      expectedMax: 15,
      message: "رقم الهاتف مطلوب",
      countryName: null,
    };
  }

  const cleaned = cleanPhone(trimmed);
  const country = getCountry(countryCode || undefined);
  const countryName = country?.nameAr || null;
  const lengths = countryCode ? PHONE_LENGTHS[countryCode] : undefined;

  // يحتوي على أحرف غير أرقام
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      digitCount: 0,
      expectedMin: lengths?.min ?? 7,
      expectedMax: lengths?.max ?? 15,
      message: "رقم الهاتف يجب أن يحتوي على أرقام فقط",
      countryName,
    };
  }

  const digitCount = cleaned.length;

  // بدون بلد محدد
  if (!lengths) {
    if (digitCount < 7) {
      return {
        isValid: false,
        digitCount,
        expectedMin: 7,
        expectedMax: 15,
        message: "رقم الهاتف يجب أن يكون بين 7-15 رقماً",
        countryName: null,
      };
    }
    if (digitCount > 15) {
      return {
        isValid: false,
        digitCount,
        expectedMin: 7,
        expectedMax: 15,
        message: "رقم الهاتف يجب أن يكون بين 7-15 رقماً",
        countryName: null,
      };
    }
    return {
      isValid: true,
      digitCount,
      expectedMin: 7,
      expectedMax: 15,
      message: null,
      countryName: null,
    };
  }

  // بلد محدد
  if (digitCount < lengths.min) {
    return {
      isValid: false,
      digitCount,
      expectedMin: lengths.min,
      expectedMax: lengths.max,
      message: `رقم الهاتف في ${countryName} يحتاج ${lengths.local} أرقام، أدخلت ${digitCount} أرقام فقط`,
      countryName,
    };
  }
  if (digitCount > lengths.max) {
    return {
      isValid: false,
      digitCount,
      expectedMin: lengths.min,
      expectedMax: lengths.max,
      message: `رقم الهاتف طويل جداً (${digitCount} أرقام)، المطلوب ${lengths.local} أرقام`,
      countryName,
    };
  }

  return {
    isValid: true,
    digitCount,
    expectedMin: lengths.min,
    expectedMax: lengths.max,
    message: null,
    countryName,
  };
}

/**
 * رسالة خطأ التحقق
 */
export function getPhoneErrorMessage(phone: string, countryCode?: string | null): string | null {
  const info = getPhoneValidationInfo(phone, countryCode);
  return info.message;
}