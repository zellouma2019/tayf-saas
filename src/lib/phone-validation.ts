// التحقق من أرقام الهاتف السعودية

/**
 * التحقق من صحة رقم الهاتف السعودي
 * - 05XXXXXXXX (10 أرقام) - موبايل محلي
 * - 9665XXXXXXXX (12 رقم) - صيغة دولية
 */
export function isValidSaudiPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-+()]/g, "");

  // صيغة محلية: 05XXXXXXXX = 10 أرقام
  if (/^05\d{8}$/.test(cleaned)) return true;

  // صيغة دولية: 9665XXXXXXXX = 12 رقم
  if (/^9665\d{8}$/.test(cleaned)) return true;

  return false;
}

// للتوافق مع الكود القديم
export const isValidAlgerianPhone = isValidSaudiPhone;

/**
 * تنسيق رقم الهاتف للعرض
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-+()]/g, "");
  if (/^05\d{8}$/.test(cleaned)) {
    return cleaned.replace(/(05)(\d{4})(\d{4})/, "$1 $2 $3");
  }
  return phone;
}

/**
 * رسالة خطأ التحقق
 */
export function getPhoneErrorMessage(phone: string): string | null {
  if (!phone.trim()) return "رقم الهاتف مطلوب";

  const cleaned = phone.replace(/[\s\-+()]/g, "");

  if (cleaned.length < 10) {
    return `رقم الهاتف قصير جداً (${cleaned.length} أرقام) — يجب أن يكون 10 أرقام تبدأ بـ 05`;
  }
  if (cleaned.length > 10 && !cleaned.startsWith("966")) {
    return `رقم الهاتف طويل جداً (${cleaned.length} أرقام) — يجب أن يكون 10 أرقام تبدأ بـ 05`;
  }

  if (!isValidSaudiPhone(phone)) {
    return "رقم هاتف سعودي غير صحيح — يجب 10 أرقام تبدأ بـ 05";
  }
  return null;
}
