// التحقق من أرقام الهاتف — يدعم جميع الدول العربية

/**
 * التحقق من صحة رقم الهاتف حسب البلد
 * إذا لم يُحدد البلد، يقبل أي رقم بين 7-15 رقماً
 */
export function isValidPhone(phone: string, countryCode?: string | null): boolean {
  const cleaned = phone.replace(/[\s\-+()]/g, "");
  if (!cleaned || cleaned.length < 7 || cleaned.length > 15) return false;
  if (!/^\d+$/.test(cleaned)) return false;

  // تحقق خاص بالجزائر (مثال - يمكن إضافة تحقق لكل بلد)
  if (countryCode === "DZ") {
    if (/^0(5|6|7|3)\d{8}$/.test(cleaned)) return true;
    if (/^213(5|6|7|3)\d{8}$/.test(cleaned)) return true;
    return false;
  }

  // باقي الدول — قبول أي رقم صالح
  return true;
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
  const cleaned = phone.replace(/[\s\-+()]/g, "");

  // تنسيق خاص بالجزائر (مثال)
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
 * رسالة خطأ التحقق
 */
export function getPhoneErrorMessage(phone: string, countryCode?: string | null): string | null {
  if (!phone.trim()) return "رقم الهاتف مطلوب";

  const cleaned = phone.replace(/[\s\-+()]/g, "");

  if (!/^\d+$/.test(cleaned)) {
    return "رقم الهاتف يجب أن يحتوي على أرقام فقط";
  }
  if (cleaned.length < 7) {
    return `رقم الهاتف قصير جداً (${cleaned.length} أرقام)`;
  }
  if (cleaned.length > 15) {
    return `رقم الهاتف طويل جداً (${cleaned.length} أرقام)`;
  }

  return null;
}