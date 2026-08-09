// ============================================================
// نظام الترجمة — طيف
// ============================================================

type TranslationDict = Record<string, string>;

const ar: TranslationDict = {
  // ===== عام =====
  "app.name": "طيف",
  "app.tagline": "منصة إدارة المطابع",
  "common.loading": "جارٍ التحميل...",
  "common.save": "حفظ",
  "common.cancel": "إلغاء",
  "common.delete": "حذف",
  "common.edit": "تعديل",
  "common.close": "إغلاق",
  "common.search": "بحث...",
  "common.noResults": "لا توجد نتائج",
  "common.confirm": "تأكيد",
  "common.back": "رجوع",
  "common.next": "التالي",
  "common.done": "تم",
  "common.error": "حدث خطأ",
  "common.success": "تم بنجاح",

  // ===== التتبع =====
  "track.title": "تتبّع طلبك",
  "track.placeholder": "مثال: A-1050 أو 0560...",
  "track.button": "تتبّع",
  "track.searching": "جارٍ البحث...",
  "track.noOrders": "لا توجد طلبات مطابقة",
  "track.noOrdersHint": "تأكد من رقم الطلب أو رقم الهاتف وحاول مرة أخرى",
  "track.customer": "العميل",
  "track.phone": "الهاتف",
  "track.pages": "عدد الصفحات",
  "track.delivery": "التسليم",
  "track.total": "المجموع",
  "track.estimatedTime": "الوقت المتوقع للتسليم",
  "track.hours": "ساعة",
  "track.invoice": "تنزيل الفاتورة PDF",
  "track.invoiceReady": "ملف PDF جاهز",
  "track.invoiceGenerating": "جارٍ الإنشاء...",
  "track.qrCode": "رمز QR",
  "track.qrDesc": "للاستلام السريع",

  // ===== حالات الطلب =====
  "status.pending": "جديد",
  "status.confirmed": "مؤكد",
  "status.printing": "قيد الطباعة",
  "status.ready": "جاهز",
  "status.delivered": "تم التسليم",
  "status.cancelled": "ملغي",

  // ===== الطلب الجديد =====
  "newOrder.title": "طلب طباعة جديد",
  "newOrder.uploadTitle": "رفع الملف والتحليل",
  "newOrder.uploadHint": "اسحب وأفلت ملفك هنا أو انقر للاختيار من جهازك",
  "newOrder.urlPlaceholder": "أدخل رابطاً لملف أو صورة هنا",
  "newOrder.chooseFile": "اختر ملف",
  "newOrder.paste": "الصق (Ctrl+V)",
  "newOrder.settingsTitle": "إعدادات الطباعة",
  "newOrder.deliveryTitle": "وقت التسليم",
  "newOrder.contactTitle": "معلومات التواصل",
  "newOrder.reviewTitle": "مراجعة الطلب",
  "newOrder.submit": "إرسال الطلب",
  "newOrder.name": "الاسم",
  "newOrder.namePlaceholder": "الاسم الكامل",
  "newOrder.phone": "رقم الهاتف",
  "newOrder.email": "البريد الإلكتروني",
  "newOrder.address": "العنوان",
  "newOrder.pickup": "استلام يدوي",
  "newOrder.delivery": "توصيل",
  "newOrder.pages": "صفحات",
  "newOrder.copies": "نسخ",
  "newOrder.pagesCopies": "صفحة × نسخة",
  "newOrder.hour": "خلال ساعة",
  "newOrder.today": "اليوم",
  "newOrder.tomorrow": "غداً",

  // ===== لوحة التاجر =====
  "merchant.dashboard": "لوحة تحكم المتجر",
  "merchant.login": "أدخل كلمة المرور للوصول",
  "merchant.loginButton": "دخول",
  "merchant.wrongPin": "كلمة المرور غير صحيحة",
  "merchant.attemptsLeft": "المتبقي {n} محاولات",
  "merchant.lastAttempt": "محاولة أخيرة قبل القفل المؤقت",
  "merchant.orders": "الطلبات",
  "merchant.settings": "الإعدادات",
  "merchant.totalOrders": "إجمالي الطلبات",
  "merchant.todayOrders": "طلبات اليوم",
  "merchant.revenue": "الإيرادات",
  "merchant.changeStatus": "تغيير الحالة",
  "merchant.invoice": "الفاتورة",
  "merchant.customerFile": "ملف الزبون",
  "merchant.fileWarning": "الملفات لا تُحفظ على السيرفر. يُرجى تنزيل الملف وحفظه على جهازك فوراً بعد استلام الطلب.",
  "merchant.download": "تنزيل",
  "merchant.printSpecs": "مواصفات الطباعة",
  "merchant.tags": "الوسوم",
  "merchant.internalNotes": "ملاحظات داخلية",
  "merchant.printingStages": "مراحل الطباعة",
  "merchant.started": "بدأ",
  "merchant.completed": "انتهى",
  "merchant.newOrder": "طلب جديد",

  // ===== واجهة المتجر =====
  "shop.newOrder": "طلب جديد",
  "shop.track": "تتبّع",
  "shop.repeatOrder": "تكرار طلب",
  "shop.quickLinks": "روابط سريعة",
  "shop.ourServices": "خدماتنا",
  "shop.uploadsHere": "ارفع ملفك هنا",
  "shop.welcome": "مرحباً بك",
  "shop.printEasily": "اطبع بسهولة — أسرع من واتساب",
};

/// جميع الترجمات
const TRANSLATIONS: Record<string, TranslationDict> = { ar };

/// دالة الترجمة
export function t(key: string, lang?: string | null, vars?: Record<string, string | number>): string {
  const dict = TRANSLATIONS.ar;
  let text = dict[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

/// جلب جميع مفاتيح الترجمة
export function getAllTranslationKeys(): string[] {
  return Object.keys(TRANSLATIONS.ar);
}

export type { TranslationDict };