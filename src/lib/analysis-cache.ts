// ═══════════════════════════════════════════════════════════════
// تخزين مؤقت لنتائج تحليل الملفات — بمفتاح هاش محتوى الملف.
// الفائدة: لو أعاد المستخدم اختيار نفس الملف (رجوع خطوة، تعديل الطلب، إلخ)
// نتجنّب إعادة قراءة PDF بالكامل أو استدعاء VLM من جديد → أسرع وأرخص.
// يُخزَّن في الذاكرة (تدوم طوال الجلسة) وأيضاً sessionStorage لنتائج VLM
// الخفيفة (بدون الصور الكبيرة) للحفاظ على النتيجة عبر إعادة تحميل الصفحة.
// ═══════════════════════════════════════════════════════════════

const MAX_MEMORY_ENTRIES = 20;

class FileAnalysisCache<T> {
  private store = new Map<string, T>();
  private order: string[] = [];

  get(key: string): T | undefined {
    return this.store.get(key);
  }

  set(key: string, value: T): void {
    if (!this.store.has(key)) {
      this.order.push(key);
      if (this.order.length > MAX_MEMORY_ENTRIES) {
        const oldest = this.order.shift();
        if (oldest) this.store.delete(oldest);
      }
    }
    this.store.set(key, value);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  clear(): void {
    this.store.clear();
    this.order = [];
  }
}

// تخزين مشترك عبر التطبيق لنتائج analyzeFileReal (ومستقبلاً analyzeFileWithAI إن أردنا)
export const fileAnalysisCache = new FileAnalysisCache<unknown>();

/**
 * هاش سريع وخفيف لمحتوى الملف (لا نحتاج تشفيراً قوياً، فقط تمييز موثوق بين الملفات).
 * نجمع بين الاسم/الحجم/تاريخ التعديل (سريع فوراً) وهاش جزئي من أول ٦٤ كيلوبايت من المحتوى
 * (لتفادي الالتباس عند وجود ملفين بنفس الاسم والحجم لكن محتوى مختلف).
 */
export async function computeFileKey(file: File): Promise<string> {
  const basic = `${file.name}:${file.size}:${file.lastModified}`;
  try {
    const sampleSize = Math.min(file.size, 65536);
    const sampleBuffer = await file.slice(0, sampleSize).arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", sampleBuffer);
    const hashHex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 24); // نكتفي بجزء من الهاش — كافٍ للتمييز مع سرعة أعلى
    return `${basic}:${hashHex}`;
  } catch {
    // إن فشل Web Crypto لأي سبب (بيئة قديمة)، نكتفي بالمفتاح الأساسي
    return basic;
  }
}
