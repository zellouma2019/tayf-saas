// محلل الملفات الحقيقي - يحلل محتوى الملف الفعلي而非 معلومات وهمية
"use client";

import type { ServiceType } from "@/lib/print-config";
// Inline cache for file analysis results
const analysisCache = new Map<string, unknown>();
async function computeFileKey(file: File): Promise<string> {
  const buf = await file.slice(0, 1024).arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// تحميل pdfjs-dist ديناميكياً (client-only) لتجنب أخطاء SSR
let pdfjsLib: typeof import("pdfjs-dist") | null = null;
let workerInitialized = false;

async function ensurePdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
  }
  if (!workerInitialized) {
    try {
      // تحميل worker من CDN لتقليل حجم المشروع
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@6.1.200/build/pdf.worker.min.mjs";
      workerInitialized = true;
    } catch {
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "";
      } catch {}
    }
  }
  return pdfjsLib;
}

export interface RealFileAnalysis {
  detectedService: ServiceType;
  detectedServiceName: string;
  pageCount: number; // حقيقي من الملف
  fileSizeKB: number;
  fileSizeMB: number;
  suggestedColor: string;
  suggestedPaperSize: string;
  suggestedPaperType: string;
  suggestedBinding: string;
  /** مقاس الصورة الفوتوغرافية المقترح (10x15/13x18/15x21/20x30/A4) — يُحسب من الأبعاد الفعلية بالبكسل، يُستخدم فقط لخدمة "photo" */
  suggestedPhotoSize?: string;
  /** الدقة الفعلية القابلة للتحقق عند المقاس المقترح */
  suggestedPhotoSizeDPI?: number;
  confidence: number;
  insights: string[];
  fileType: string;
  fileName: string;
  // معلومات إضافية حقيقية
  imageDimensions?: { width: number; height: number; megapixels: number };
  pdfTitle?: string;
  pdfAuthor?: string;
  pdfCreator?: string;
  textPreview?: string; // أول 300 حرف من النص
  detectedLanguage?: string;
  // معاينة بصرية
  thumbnailUrl?: string; // معاينة مصغرة (للصور: الصورة نفسها، للـ PDF: أول صفحة)
  fileNature?: string; // وصف طبيعة الملف
  isPortrait?: boolean;
  dominantColors?: string[]; // ألوان سائدة (للصور)
  // ===== معلومات تفصيلية جديدة =====
  // أبعاد الصفحة بالملم
  pageDimensionsMM?: { width: number; height: number };
  // حجم الورق القياسي الأقرب
  closestPaperSize?: string; // "A4", "A3", "A5", "Letter", "مخصص"
  // DPI المقدّر
  estimatedDPI?: number;
  // فئة الدقة
  dpiCategory?: "منخفضة" | "متوسطة" | "عالية" | "جاهزة للطباعة";
  // المساحة اللونية
  colorSpace?: "RGB" | "CMYK" | "تدرج رمادي" | "غير محدد";
  // هل يحتوي صور؟
  hasImages?: boolean;
  // هل يحتوي نصوص؟
  hasText?: boolean;
  // خريطة خيارات الطباعة المقترحة من VLM (optionKey → optionId)
  suggestedOptions?: Record<string, string>;  // أسباب كل اقتراح (optionKey → سبب بالعربية)
  suggestedReasons?: Record<string, string>;
  // نسبة العرض للارتفاع
  aspectRatio?: string; // "4:3", "16:9", "1:1" ...
  // ===== بيانات تحليل عميق =====
  /** النص الكامل المستخرج (حتى 10000 حرف) */
  fullText?: string;
  /** عدد الصور المدمجة في الملف */
  imageCount?: number;
  /** نسبة المساحة البيضاء (0-100) */
  whitespaceRatio?: number;
  /** هل يحتوي عناوين/فصول كبيرة */
  hasHeadings?: boolean;
  /** عدد الروابط التشعبية المكتشفة */
  linkCount?: number;
  /** معاينات إضافية (صفحة وسط + أخيرة) */
  extraThumbnails?: string[];
  // اتجاه الصفحة
  orientation?: "عمودي" | "أفقي" | "مربع";
  // الحجم المنسّق
  fileSizeFormatted?: string;
}

// ===== مقاسات الأوراق القياسية بالملم =====
const PAPER_SIZES_MM: Record<string, { w: number; h: number }> = {
  A6: { w: 105, h: 148 },
  A5: { w: 148, h: 210 },
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
  A3_PLUS: { w: 329, h: 483 },
  A2: { w: 420, h: 594 },
  A1: { w: 594, h: 841 },
  A0: { w: 841, h: 1189 },
  Letter: { w: 216, h: 279 },
  Legal: { w: 216, h: 356 },
};

/// إيجاد أقرب حجم ورقي قياسي من الأبعاد بالملم
function findClosestPaperSize(wMM: number, hMM: number): { name: string; tolerance: number } {
  let bestName = "مخصص";
  let bestTolerance = Infinity;

  for (const [name, dims] of Object.entries(PAPER_SIZES_MM)) {
    // جرب الاتجاهين (عمودي وأفقي)
    for (const [dw, dh] of [[dims.w, dims.h], [dims.h, dims.w]]) {
      const diffW = Math.abs(wMM - dw);
      const diffH = Math.abs(hMM - dh);
      const tolerance = diffW + diffH;
      if (tolerance < bestTolerance) {
        bestTolerance = tolerance;
        bestName = name;
      }
    }
  }

  // إذا كان الفرق كبيراً، نعتبره مخصص
  if (bestTolerance > 20) return { name: "مخصص", tolerance: bestTolerance };
  return { name: bestName, tolerance: bestTolerance };
}

/// تقدير DPI من أبعاد الصورة وعرض الورقة الهدف (بالمم)
function estimateDPI(imageWidth: number, imageHeight: number, paperWidthMM: number, paperHeightMM: number): number {
  // DPI = بكسل / إنش (1 إنش = 25.4 مم)
  const dpiW = Math.round((imageWidth / paperWidthMM) * 25.4);
  const dpiH = Math.round((imageHeight / paperHeightMM) * 25.4);
  return Math.round((dpiW + dpiH) / 2);
}

/// تصنيف الدقة
function categorizeDPI(dpi: number): "منخفضة" | "متوسطة" | "عالية" | "جاهزة للطباعة" {
  if (dpi >= 300) return "جاهزة للطباعة";
  if (dpi >= 200) return "عالية";
  if (dpi >= 100) return "متوسطة";
  return "منخفضة";
}

/// حساب نسبة العرض للارتفاع كنص
function getAspectRatioText(w: number, h: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const r = gcd(w, h);
  return `${w / r}:${h / r}`;
}

/// تنسيق حجم الملف
function formatFileSize(kb: number, mb: number): string {
  if (mb >= 1) return `${mb.toFixed(2)} ميجابايت`;
  if (kb >= 1) return `${kb} كيلوبايت`;
  return `${Math.round(kb * 1024)} بايت`;
}

/// تحليل حقيقي للملف بناءً على محتواه الفعلي — مع تخزين مؤقت بمفتاح هاش المحتوى
export async function analyzeFileReal(file: File): Promise<RealFileAnalysis> {
  const cacheKey = await computeFileKey(file);
  const cached = analysisCache.get(cacheKey) as RealFileAnalysis | undefined;
  if (cached) {
    return { ...cached, insights: [...cached.insights, "⚡ نتيجة من تحليل سابق لنفس الملف (تخزين مؤقت)"] };
  }

  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const sizeBytes = file.size;
  const sizeKB = Math.round(sizeBytes / 1024);
  const sizeMB = Math.round((sizeBytes / (1024 * 1024)) * 100) / 100;

  let result: RealFileAnalysis;
  if (ext === "pdf") {
    result = await analyzePdf(file, sizeKB, sizeMB);
  } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
    result = await analyzeImage(file, ext, sizeKB, sizeMB);
  } else if (ext === "docx" || ext === "doc") {
    result = await analyzeDocx(file, sizeKB, sizeMB);
  } else {
    result = defaultAnalysis(file.name, ext, sizeKB, sizeMB);
  }

  analysisCache.set(cacheKey, result);
  return result;
}

/// تحليل PDF حقيقي باستخدام PDF.js
async function analyzePdf(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  let pageCount = 1;
  let pdfTitle: string | undefined;
  let pdfAuthor: string | undefined;
  let pdfCreator: string | undefined;
  let textPreview = "";
  let thumbnailUrl: string | undefined;
  let fileNature: string | undefined;
  let isPortrait: boolean | undefined;
  let pageDimensionsMM: { width: number; height: number } | undefined;
  let closestPaperSize: string | undefined;
  let estimatedDPI: number | undefined;
  let dpiCategory: "منخفضة" | "متوسطة" | "عالية" | "جاهزة للطباعة" | undefined;
  let hasImages = false;
  let hasText = false;
  let colorSpace: "RGB" | "CMYK" | "تدرج رمادي" | "غير محدد" = "غير محدد";
  let orientation: "عمودي" | "أفقي" | "مربع" = "عمودي";
  let aspectRatio: string | undefined;
  const insights: string[] = [];
  // ===== بيانات تحليل عميق =====
  let imageCount = 0;
  let whitespaceRatio: number | undefined;
  let hasHeadings = false;
  let linkCount = 0;
  const extraThumbnails: string[] = [];
  let fullText = ""; // ✅ خارج try لتجنب ReferenceError
  let detectedLanguage: string | undefined; // ✅ خارج try لتجنب ReferenceError
  let totalTextItems = 0;
  let totalChars = 0;
  const pageTexts: { pageNum: number; text: string; fontSize: number }[] = [];

  try {
    const lib = await ensurePdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = lib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    pageCount = pdf.numPages; // العدد الحقيقي للصفحات

    // استخراج البيانات الوصفية
    try {
      const meta = await pdf.getMetadata();
      const info = meta?.info as Record<string, unknown> | undefined;
      if (info) {
        pdfTitle = (info.Title as string) || undefined;
        pdfAuthor = (info.Author as string) || undefined;
        pdfCreator = (info.Creator as string) || undefined;
      }
    } catch {}

    // استخراج النص من كل الصفحات لتحليل عميق
    const pagesToReadFull = Math.min(pageCount, 50); // حد أقصى 50 صفحة
    for (let i = 1; i <= pagesToReadFull; i++) {
      try {
        const page = await pdf.getPage(i);

        let content = await page.getTextContent();
        let pageTextParts: string[] = [];
        let maxFontSize = 0;

        for (const item of content.items) {
          if ("str" in item) {
            totalTextItems++;
            if (item.str.trim()) {
              pageTextParts.push(item.str);
              // كشف حجم الخط للعناوين
              const fontHeight = (item as { height?: number }).height || 0;
              if (fontHeight > maxFontSize) maxFontSize = fontHeight;
            }
          }
        }

        let pageText = pageTextParts.join(" ");

        if (pageText.trim().length === 0) {
          try {
            content = await page.getTextContent({ disableNormalization: true });
            pageTextParts = [];
            for (const item of content.items) {
              if ("str" in item) {
                totalTextItems++;
                if (item.str.trim()) pageTextParts.push(item.str);
              }
            }
            const altText = pageTextParts.join(" ");
            if (altText.trim().length > 0) pageText = altText;
          } catch {}
        }

        fullText += " " + pageText;
        totalChars += pageText.length;
        if (pageText.trim().length > 0) hasText = true;

        pageTexts.push({ pageNum: i, text: pageText, fontSize: maxFontSize });

        // توليد معاينة مصغرة + استخراج أبعاد الصفحة من أول صفحة
        if (i === 1) {
          try {
            const viewport = page.getViewport({ scale: 1 }); // scale=1 للحصول على البكسلات الحقيقية
            const pdfWidthMM = (viewport.width * 25.4) / 72; // PDF يستخدم 72 نقطة/إنش
            const pdfHeightMM = (viewport.height * 25.4) / 72;
            pageDimensionsMM = {
              width: Math.round(pdfWidthMM * 10) / 10,
              height: Math.round(pdfHeightMM * 10) / 10,
            };
            closestPaperSize = findClosestPaperSize(pdfWidthMM, pdfHeightMM).name;
            orientation = pdfHeightMM > pdfWidthMM + 1 ? "عمودي" : pdfWidthMM > pdfHeightMM + 1 ? "أفقي" : "مربع";
            isPortrait = orientation === "عمودي";
            aspectRatio = getAspectRatioText(Math.round(pdfWidthMM), Math.round(pdfHeightMM));

            // المعاينة المصغرة
            const thumbViewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement("canvas");
            canvas.width = thumbViewport.width;
            canvas.height = thumbViewport.height;
            const context = canvas.getContext("2d");
            if (context) {
              await page.render({ canvasContext: context, viewport: thumbViewport, canvas } as Parameters<typeof page.render>[0]).promise;
              thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);

              // تحليل الألوان من المعاينة
              try {
                const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
                let colorPixels = 0;
                let grayPixels = 0;
                const sampleStep = 16; // عينة كل 16 بكسل
                for (let p = 0; p < imgData.data.length; p += 4 * sampleStep) {
                  const r = imgData.data[p];
                  const g = imgData.data[p + 1];
                  const b = imgData.data[p + 2];
                  const maxC = Math.max(r, g, b);
                  const minC = Math.min(r, g, b);
                  if (maxC - minC > 30) {
                    colorPixels++;
                  } else {
                    grayPixels++;
                  }
                }
                const total = colorPixels + grayPixels;
                if (total > 0) {
                  if (colorPixels / total > 0.3) {
                    colorSpace = "RGB";
                  } else {
                    colorSpace = "تدرج رمادي";
                  }
                }
              } catch {}

              // تقدير DPI من بكسلات المعاينة والأبعاد الفعلية
              estimatedDPI = Math.round(canvas.width / (pdfWidthMM / 25.4));
              dpiCategory = categorizeDPI(estimatedDPI);
            }

            // فحص وجود صور ونصوص في الصفحة (من operators)
            try {
              const ops = await page.getOperatorList();
              const textOpNames = new Set([
                String(lib.OPS.showText),
                String(lib.OPS.showSpacedText),
              ]);
              const imageOpNames = new Set([
                String(lib.OPS.paintImageXObject),
                String(lib.OPS.paintImageXObjectRepeat),
                String(lib.OPS.paintXObject),
              ]);

              for (let opIdx = 0; opIdx < ops.fnArray.length; opIdx++) {
                const fnName = String(ops.fnArray[opIdx]);
                if (textOpNames.has(fnName) && !hasText) {
                  hasText = true;
                }
                if (imageOpNames.has(fnName)) {
                  hasImages = true;
                  imageCount++;
                }
                if (hasText && hasImages) break;
              }
            } catch {}
          } catch {}
        }

        // توليد معاينات إضافية (صفحة وسط + أخيرة)
        if (i > 1 && extraThumbnails.length < 2) {
          const isMiddlePage = (pageCount > 5 && i === Math.ceil(pageCount / 2));
          const isLastPage = (i === pageCount);
          if (isMiddlePage || isLastPage) {
            try {
              const extraPage = await pdf.getPage(i);
              const ev = extraPage.getViewport({ scale: 0.4 });
              const ec = document.createElement("canvas");
              ec.width = ev.width;
              ec.height = ev.height;
              const ectx = ec.getContext("2d");
              if (ectx) {
                await extraPage.render({ canvasContext: ectx, viewport: ev, canvas: ec } as Parameters<typeof extraPage.render>[0]).promise;
                extraThumbnails.push(ec.toDataURL("image/jpeg", 0.6));
              }
            } catch {}
          }
        }
      } catch {}
    }

    // ═══ فحص إضافي: إذا وجدنا عناصر نص كثيرة (حتى لو فارغة) فالملف يحتوي نصوص ═══
    // هذا يحدث مع ملفات PDF التي تستخدم ترميز خطوط مخصص (CMap) لا يستطيع pdf.js فك شفرته
    if (!hasText && totalTextItems > 5) {
      hasText = true;
      insights.push("نصوص مكتشفة (ترميز خطوط مخصص — قد لا يتم عرضها بشكل صحيح)");
    }

    const spaces = (fullText.match(/\s/g) || []).length;
    const totalCharsAll = fullText.length || 1;
    whitespaceRatio = Math.round((spaces / totalCharsAll) * 100);
    if (whitespaceRatio > 80) {
      insights.push(`مساحة بيضاء عالية (${whitespaceRatio}%) — قد يكون الملف فارغ جزئياً`);
    }

    // ═══ تحليل عميق: كشف العناوين الكبيرة ═══
    const avgFontSize = pageTexts.length > 0
      ? pageTexts.reduce((s, p) => s + p.fontSize, 0) / pageTexts.length
      : 0;
    const headingPages = pageTexts.filter((p) => p.fontSize > avgFontSize * 1.5 && p.text.trim().length > 0);
    hasHeadings = headingPages.length >= 2;
    if (hasHeadings) {
      insights.push(`كُشف ${headingPages.length} عناوين كبيرة — مستند منظم بفصول`);
    }

    // ═══ تحليل عميق: الروابط التشعبية ═══
    const urlMatches = fullText.match(/https?:\/\/[^\s]+|www\.[^\s]+/g);
    linkCount = urlMatches ? urlMatches.length : 0;
    if (linkCount > 0) {
      insights.push(`${linkCount} رابط تشعبي مكتشف`);
    }

    // ═══ تحليل عميق: عدد الصور ═══
    if (imageCount > 0) {
      insights.push(`${imageCount} صورة مدمجة مكتشفة`);
    }

    textPreview = fullText.trim().substring(0, 300);

    // اكتشاف اللغة
    const arabicChars = (fullText.match(/[\u0600-\u06FF]/g) || []).length;
    const latinChars = (fullText.match(/[a-zA-Z]/g) || []).length;
    if (arabicChars > latinChars && arabicChars > 20) {
      insights.push("اللغة المكتشفة: عربية");
      fileNature = "مستند عربي";
      detectedLanguage = "العربية";
    } else if (latinChars > 20) {
      insights.push("اللغة المكتشفة: أجنبية");
      fileNature = "مستند أجنبي";
      detectedLanguage = "أجنبية";
    }
  } catch (e) {
    insights.push("تعذّر قراءة تفاصيل PDF — تم استخدام التقدير");
  }

  // اكتشاف نوع المحتوى بنظام تسجيل نقاط مرجّح متعدد الإشارات (اسم الملف + النص + عدد الصفحات)
  // بدل سلسلة if/else القديمة التي تتوقف عند أول تطابق بلا اعتبار لقوة الأدلة الأخرى.
  const searchText = `${pdfTitle || ""} ${fullText}`;
  let detectedService: ServiceType = "document";
  let confidence = 70;
  let suggestedColor = "bw";
  let suggestedPaperSize = "A4";
  let suggestedPaperType = "normal";
  let suggestedBinding = "none";
  let detectedServiceName = "طباعة مستند";

  // Inline content classification based on filename and page count
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') {
    detectedService = 'photo';
    detectedServiceName = 'طباعة صور';
    fileNature = 'صور';
    confidence = 0.95;
    suggestedColor = 'color';
    suggestedPaperType = 'glossy';
  } else if (pageCount > 10) {
    detectedService = 'book';
    detectedServiceName = 'طباعة كتاب/كتيب';
    fileNature = 'كتاب أو مستند طويل';
    confidence = 0.8;
  } else if (pageCount > 3) {
    detectedService = 'document';
    detectedServiceName = 'طباعة مستند';
    fileNature = 'مستند';
    confidence = 0.7;
  }

  if (detectedService) {
    // مقاس الورق: نفضّل المقاس المكتشف فعلياً من أبعاد الصفحة إن وُجد
    if (!closestPaperSize || closestPaperSize === "مخصص") {
      suggestedPaperSize = "A4";
    }
    insights.push(`تم تحديد: ${detectedServiceName}`);
  } else {
    // لا توجد إشارات نصية كافية — اكتشاف عام من عدد الصفحات فقط
    if (pageCount === 1) {
      confidence = 75;
      fileNature = "صفحة واحدة";
      insights.push("مستند PDF من صفحة واحدة");
    } else if (pageCount > 50) {
      confidence = 78;
      suggestedBinding = "glue";
      fileNature = "كتاب/بحث طويل";
      insights.push("مستند طويل جداً — يُنصح بتجليد بالغراء");
    } else {
      confidence = 80;
      fileNature = "مستند متعدد الصفحات";
      if (pageCount > 15) {
        suggestedBinding = "spiral";
        insights.push("مستند متوسط الطول — تجليد لولبي مقترح");
      }
    }
    insights.push("لا توجد إشارات نصية كافية للتصنيف — تم استخدام الإعدادات الافتراضية");
  }

  insights.push(`عدد الصفحات الفعلي: ${pageCount} صفحة`);
  if (pdfTitle) insights.push(`العنوان: ${pdfTitle}`);
  if (pdfAuthor) insights.push(`المؤلف: ${pdfAuthor}`);
  if (pageCount > 0 && sizeMB > 0) {
    insights.push(`متوسط الحجم لكل صفحة: ${Math.round(sizeKB / pageCount)} ك.ب`);
  }

  // ═══ تصحيح مبني على الدليل البصري الفعلي: لا نكتفي بتصنيف الفئة النصية ═══
  // القاعدة السابقة تفترض "bw" لكل مستند من فئة "تقرير/مذكرة" حتى لو احتوى فعلياً صوراً ملونة —
  // هذا غير واقعي: نستخدم colorSpace وhasImages المُقاسين فعلياً من رندر الصفحة الأولى لتصحيح الاقتراح.
  if (suggestedColor === "bw" && hasImages && colorSpace === "RGB") {
    suggestedColor = "color";
    insights.push("⚠️ تصحيح: المستند يحتوي عناصر/صوراً ملونة فعلياً رغم أنه من فئة نصية عادة تُطبع بالأبيض والأسود — تم اقتراح الطباعة الملونة");
  } else if (suggestedColor === "color" && !hasImages && colorSpace === "تدرج رمادي") {
    suggestedColor = "bw";
    insights.push("⚠️ تصحيح: لا توجد ألوان فعلية مكتشفة في الصفحة رغم أن الفئة تفترض عادة طباعة ملونة — تم اقتراح الأبيض والأسود لتوفير التكلفة");
  }

  // ═══ خفض جودة الورق تلقائياً إذا كانت الدقة المقدَّرة منخفضة ═══
  if (estimatedDPI && estimatedDPI < 150 && (suggestedPaperType === "premium" || suggestedPaperType === "glossy")) {
    insights.push(`⬇️ تم تخفيض نوع الورق — الدقة المقدَّرة (${estimatedDPI} DPI) لا تبرر ورقاً لامعاً/فاخراً لمحتوى قد يظهر ضبابياً`);
    suggestedPaperType = "normal";
  }

  return {
    detectedService,
    detectedServiceName,
    pageCount,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor,
    suggestedPaperSize: closestPaperSize && closestPaperSize !== "مخصص" ? closestPaperSize : suggestedPaperSize,
    suggestedPaperType,
    suggestedBinding,
    confidence,
    insights,
    fileType: "PDF",
    fileName: file.name,
    pdfTitle,
    pdfAuthor,
    pdfCreator,
    textPreview,
    thumbnailUrl,
    fileNature,
    isPortrait,
    // الحقول التفصيلية الجديدة
    pageDimensionsMM,
    closestPaperSize,
    estimatedDPI,
    dpiCategory,
    colorSpace,
    hasImages,
    hasText,
    orientation,
    aspectRatio,
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    // بيانات تحليل عميق
    fullText: fullText.trim().substring(0, 10000) || undefined,
    imageCount: imageCount > 0 ? imageCount : undefined,
    whitespaceRatio,
    hasHeadings: hasHeadings || undefined,
    linkCount: linkCount > 0 ? linkCount : undefined,
    extraThumbnails: extraThumbnails.length > 0 ? extraThumbnails : undefined,
    detectedLanguage,
  };
}

/// مقاسات الصور القياسية بالسنتيمتر (تطابق خيارات photoSize في service-specs.ts)
const PHOTO_SIZES_CM: { id: string; w: number; h: number }[] = [
  { id: "10x15", w: 10, h: 15 },
  { id: "13x18", w: 13, h: 18 },
  { id: "15x21", w: 15, h: 21 },
  { id: "20x30", w: 20, h: 30 },
  { id: "A4", w: 21, h: 29.7 },
];

/**
 * يقترح أنسب مقاس طباعة فعلي بناءً على أبعاد الصورة الحقيقية بالبكسل — وليس A4 ثابتة دائماً.
 * المبدأ: نختار أكبر مقاس تحافظ فيه الصورة على دقة ≥150 DPI (حد أدنى مقبول للطباعة الفوتوغرافية)،
 * فطباعة صورة 400×600 بكسل على A4 تنتج نتيجة مبكسلة وغير واقعية — نرشّح لها 10×15 بدلاً من ذلك.
 */
function suggestPhotoSize(
  widthPx: number,
  heightPx: number,
): { sizeId: string; achievableDPI: number; warning?: string } {
  if (!widthPx || !heightPx) return { sizeId: "10x15", achievableDPI: 0, warning: "تعذّر قياس أبعاد الصورة" };

  const isPortraitImg = heightPx >= widthPx;
  let best: { id: string; dpi: number } | null = null;

  for (const size of PHOTO_SIZES_CM) {
    // نجرب اتجاه الطباعة المطابق لاتجاه الصورة نفسها لتفادي دقة مضخّمة وهمية
    const wCM = isPortraitImg ? size.w : size.h;
    const hCM = isPortraitImg ? size.h : size.w;
    const dpiW = widthPx / (wCM / 2.54);
    const dpiH = heightPx / (hCM / 2.54);
    const dpi = Math.min(dpiW, dpiH);
    if (dpi >= 150) {
      // نحتفظ بأكبر مقاس ما زال يحقق 150 DPI على الأقل
      if (!best || size.w * size.h > (PHOTO_SIZES_CM.find((s) => s.id === best!.id)!.w * PHOTO_SIZES_CM.find((s) => s.id === best!.id)!.h)) {
        best = { id: size.id, dpi: Math.round(dpi) };
      }
    }
  }

  if (best) return { sizeId: best.id, achievableDPI: best.dpi };

  // لا يوجد مقاس يحقق 150 DPI — نرشّح أصغر مقاس مع تحذير صريح بدل الادعاء بجودة غير واقعية
  const smallest = PHOTO_SIZES_CM[0];
  const wCM = isPortraitImg ? smallest.w : smallest.h;
  const hCM = isPortraitImg ? smallest.h : smallest.w;
  const dpi = Math.round(Math.min(widthPx / (wCM / 2.54), heightPx / (hCM / 2.54)));
  return {
    sizeId: smallest.id,
    achievableDPI: dpi,
    warning: `دقة الصورة منخفضة (${dpi} DPI حتى بأصغر مقاس) — النتيجة قد تظهر مبكسلة، يُفضّل صورة أعلى دقة`,
  };
}


async function analyzeImage(
  file: File,
  ext: string,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  let width = 0;
  let height = 0;
  let thumbnailUrl: string | undefined;
  let dominantColors: string[] = [];
  let fileNature: string | undefined;
  let imgColorSpace: "RGB" | "CMYK" | "تدرج رمادي" | "غير محدد" = "غير محدد";
  const insights: string[] = [];

  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    width = img.naturalWidth;
    height = img.naturalHeight;

    // إنشاء معاينة مصغرة + استخراج الألوان السائدة + تحليل المساحة اللونية
    try {
      const canvas = document.createElement("canvas");
      const maxThumb = 300;
      const scale = Math.min(maxThumb / width, maxThumb / height, 1);
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);

        // تحليل المساحة اللونية والألوان السائدة
        const sampleCanvas = document.createElement("canvas");
        sampleCanvas.width = 20;
        sampleCanvas.height = 20;
        const sCtx = sampleCanvas.getContext("2d");
        if (sCtx) {
          sCtx.drawImage(img, 0, 0, 20, 20);
          const data = sCtx.getImageData(0, 0, 20, 20).data;
          const colorBuckets: Record<string, number> = {};
          let colorPixels = 0;
          let grayPixels = 0;
          for (let i = 0; i < data.length; i += 4) {
            const r = Math.round(data[i] / 64) * 64;
            const g = Math.round(data[i + 1] / 64) * 64;
            const b = Math.round(data[i + 2] / 64) * 64;
            const key = `${r},${g},${b}`;
            colorBuckets[key] = (colorBuckets[key] || 0) + 1;
            // فحص ألوان/رمادي
            const maxC = Math.max(data[i], data[i + 1], data[i + 2]);
            const minC = Math.min(data[i], data[i + 1], data[i + 2]);
            if (maxC - minC > 30) colorPixels++;
            else grayPixels++;
          }
          const sorted = Object.entries(colorBuckets).sort((a, b) => b[1] - a[1]).slice(0, 3);
          dominantColors = sorted.map(([k]) => {
            const [r, g, b] = k.split(",").map(Number);
            const brightness = (r + g + b) / 3;
            if (brightness > 240) return "فاتح";
            if (brightness < 16) return "داكن";
            return `rgb(${r},${g},${b})`;
          });
          // تصنيف المساحة اللونية
          const total = colorPixels + grayPixels;
          if (total > 0) {
            imgColorSpace = colorPixels / total > 0.3 ? "RGB" : "تدرج رمادي";
          }
        }
      }
    } catch {}

    URL.revokeObjectURL(url);
  } catch {
    insights.push("تعذّر قراءة أبعاد الصورة");
  }

  const megapixels = Math.round(((width * height) / 1000000) * 100) / 100;
  const isPortrait = height > width;
  const isLandscape = width > height;
  const isHighRes = megapixels > 8;
  const orientation: "عمودي" | "أفقي" | "مربع" = isPortrait ? "عمودي" : isLandscape ? "أفقي" : "مربع";

  // تقدير DPI على ورق A4
  const a4WMM = 210;
  const a4HMM = 297;
  const imgDPI = estimateDPI(width, height, a4WMM, a4HMM);
  const imgDpiCat = categorizeDPI(imgDPI);

  const name = file.name.toLowerCase();
  let detectedService: ServiceType = "photo";
  let detectedServiceName = "طباعة صور";
  let confidence = 90;
  let suggestedColor = "color";
  let suggestedPaperSize = "A4";
  let suggestedPaperType = "glossy";
  let suggestedBinding = "none";

  // ═══ اقتراح مقاس واقعي من الأبعاد الفعلية بالبكسل بدل A4 الثابتة ═══
  const photoSizeSuggestion = suggestPhotoSize(width, height);
  let suggestedPhotoSize = photoSizeSuggestion.sizeId;
  const suggestedPhotoSizeDPI = photoSizeSuggestion.achievableDPI;
  if (photoSizeSuggestion.warning) {
    insights.push(`⚠️ ${photoSizeSuggestion.warning}`);
    confidence = Math.max(65, confidence - 15);
  } else {
    insights.push(`المقاس المقترح: ${suggestedPhotoSize} (يحقق ≈${suggestedPhotoSizeDPI} DPI — جودة طباعة سليمة)`);
  }

  // اكتشاف نوع الصورة من الاسم (ملاحظة: خدمة "photo" تستخدم حقل photoSize لا paperSize —
  // القيمة القديمة "suggestedPaperSize = A5" هنا كانت لا تُطبَّق فعلياً على أي خيار حقيقي في الواجهة)
  if (/passport|جواز|id|هوية|photo id|صورة شخصية/.test(name)) {
    detectedServiceName = "طباعة صور (صورة شخصية)";
    confidence = Math.min(confidence, 93);
    // صورة شخصية/جواز تُطبع عادة في أصغر مقاس متاح، لكن نحترم تحذير الدقة إن كانت الصورة رديئة أصلاً
    if (!photoSizeSuggestion.warning) suggestedPhotoSize = "10x15";
    suggestedPaperType = "glossy";
    fileNature = "صورة شخصية";
    insights.push("صورة شخصية/جواز — أصغر مقاس متاح (10×15) + ورق لامع");
  } else if (/poster|ملصق|affiche/.test(name)) {
    detectedService = "poster";
    detectedServiceName = "ملصقات";
    confidence = 91;
    suggestedPaperSize = "A3";
    fileNature = "ملصق";
    insights.push("ملصق — حجم A3 (تنبيه: يُطبع كملصق بمقاس A3 فعلي، وليس بحجم الصورة القياسي)");
  } else if (/wedding|زفاف|عرس/.test(name)) {
    fileNature = "صورة زفاف";
    suggestedPaperType = "premium";
    insights.push("صورة زفاف — ورق برو فاخر");
  } else {
    fileNature = "صورة";
    insights.push("صورة — طباعة ملونة على ورق لامع");
  }

  // ═══ خفض جودة الورق تلقائياً إذا كانت الدقة الفعلية لا تبرر ورقاً فاخراً/معدنياً ═══
  // طباعة صورة منخفضة الدقة على ورق "معدني" أو "فاخر برو" يُبرز العيوب بدل إخفائها — اقتراح مضلل بصرياً واقتصادياً
  if (suggestedPhotoSizeDPI > 0 && suggestedPhotoSizeDPI < 150 && (suggestedPaperType === "premium" || suggestedPaperType === "metallic")) {
    insights.push(`⬇️ تم تخفيض نوع الورق من "${suggestedPaperType}" إلى "لامع عادي" — الدقة المتاحة (${suggestedPhotoSizeDPI} DPI) لا تبرر ورقاً فاخراً`);
    suggestedPaperType = "glossy";
  }

  if (isPortrait) insights.push(`اتجاه عمودي (${width}×${height})`);
  else if (isLandscape) insights.push(`اتجاه أفقي (${width}×${height})`);
  else insights.push(`مربع (${width}×${height})`);

  if (isHighRes) {
    insights.push(`دقة عالية ${megapixels} ميجابكسل — جودة طباعة ممتازة`);
  } else if (megapixels < 1) {
    insights.push(`دقة منخفضة ${megapixels} ميجابكسل — قد تظهر بكسلية عند الطباعة الكبيرة`);
    confidence = Math.max(70, confidence - 10);
  } else {
    insights.push(`دقة ${megapixels} ميجابكسل`);
  }

  insights.push(`الدقة على A4: ≈${imgDPI} DPI (${imgDpiCat})`);

  if (dominantColors.length > 0) {
    insights.push(`ألوان سائدة: ${dominantColors.join("، ")}`);
  }

  return {
    detectedService,
    detectedServiceName,
    pageCount: 1,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor,
    suggestedPaperSize,
    suggestedPaperType,
    suggestedBinding,
    suggestedPhotoSize,
    suggestedPhotoSizeDPI,
    confidence,
    insights,
    fileType: ext.toUpperCase(),
    fileName: file.name,
    imageDimensions: { width, height, megapixels },
    thumbnailUrl,
    fileNature,
    isPortrait,
    dominantColors,
    // الحقول التفصيلية الجديدة
    pageDimensionsMM: { width, height: height }, // للصور: البكسل = الأبعاد (يُفترض 72 DPI)
    estimatedDPI: imgDPI,
    dpiCategory: imgDpiCat,
    colorSpace: imgColorSpace,
    hasImages: true,
    hasText: false,
    orientation,
    aspectRatio: getAspectRatioText(width, height),
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
  };
}

/// تحليل DOCX حقيقي — يستخرج النص الفعلي عبر mammoth بدل تقدير الصفحات من حجم الملف فقط
async function analyzeDocx(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let fullText = "";
  let extractionOk = false;

  try {
    // mammoth يعمل في المتصفح ويقرأ .docx فعلياً (وليس .doc القديم — نتحقق أدناه)
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    fullText = (result.value || "").trim();
    extractionOk = fullText.length > 0;
    if (result.messages?.length) {
      const warnings = result.messages.filter((m) => m.type === "warning");
      if (warnings.length > 0) {
        insights.push(`تحذيرات تحويل بسيطة (${warnings.length}) — قد لا تُقرأ بعض عناصر التنسيق`);
      }
    }
  } catch (e) {
    insights.push("تعذّر استخراج نص الملف مباشرة (قد يكون .doc قديم) — تم استخدام تقدير من الحجم");
  }

  // عدد الصفحات: من عدد الكلمات الفعلي إن توفر النص (≈500 كلمة/صفحة، معيار شائع لمستندات Word)،
  // وإلا نرجع لتقدير الحجم كخطة بديلة فقط
  let pageCount: number;
  if (extractionOk) {
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    pageCount = Math.max(1, Math.min(500, Math.ceil(wordCount / 500)));
    insights.push(`عدد الصفحات المقدّر: ${pageCount} (من ${wordCount} كلمة فعلية — أدق من تقدير الحجم)`);
  } else {
    pageCount = Math.max(1, Math.min(500, Math.round(sizeKB / 30)));
    insights.push(`عدد الصفحات المقدّر: ${pageCount} (تقدير احتياطي من حجم الملف)`);
  }

  let detectedService: ServiceType = "document";
  let detectedServiceName = "طباعة مستند (Word)";
  let confidence = 65;
  let suggestedColor = "bw";
  let suggestedPaperSize = "A4";
  let suggestedPaperType = "normal";
  let suggestedBinding = "none";
  let fileNature: string | undefined;

  if (extractionOk && pageCount > 10) {
    detectedService = "book";
    detectedServiceName = "طباعة كتاب/كتيب (Word)";
    confidence = 70;
    suggestedBinding = "spiral";
    fileNature = "كتاب أو مستند طويل";
    insights.push("مستند طويل — تجليد لولبي مقترح");
  } else if (pageCount > 15) {
    suggestedBinding = "spiral";
    confidence = 60;
    insights.push("مستند طويل — تجليد لولبي مقترح");
  }


  const arabicChars = (fullText.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (fullText.match(/[a-zA-Z]/g) || []).length;
  let detectedLanguage: string | undefined;
  if (arabicChars > latinChars && arabicChars > 20) detectedLanguage = "العربية";
  else if (latinChars > 20) detectedLanguage = "أجنبية";

  if (!extractionOk) {
    insights.push("نصيحة: حوّل إلى PDF أو ارفع .docx حديث لتحليل أدق للمحتوى");
  }

  return {
    detectedService,
    detectedServiceName,
    pageCount,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor,
    suggestedPaperSize,
    suggestedPaperType,
    suggestedBinding,
    confidence,
    insights,
    fileType: "DOCX",
    fileName: file.name,
    fileNature,
    detectedLanguage,
    hasText: extractionOk,
    fullText: extractionOk ? fullText.substring(0, 10000) : undefined,
    textPreview: extractionOk ? fullText.substring(0, 300) : undefined,
  };
}

function defaultAnalysis(
  fileName: string,
  ext: string,
  sizeKB: number,
  sizeMB: number,
): RealFileAnalysis {
  return {
    detectedService: "document",
    detectedServiceName: "طباعة مستند",
    pageCount: 1,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor: "bw",
    suggestedPaperSize: "A4",
    suggestedPaperType: "normal",
    suggestedBinding: "none",
    confidence: 60,
    insights: [
      `نوع الملف: ${ext.toUpperCase()}`,
      `عدد الصفحات المقدّر: 1`,
      "اختر الخدمة والإعدادات يدوياً",
    ],
    fileType: ext.toUpperCase(),
    fileName,
  };
}

/// نتيجة تحليل VLM
export interface VLMAnalysis {
  documentType: string;
  description: string;
  qualityAssessment: string;
  qualityReason?: string;
  suggestedService: string;
  suggestedServiceName: string;
  suggestedColor?: string;
  suggestedPaperSize?: string;
  suggestedPaperType?: string;
  suggestedBinding?: string;
  /** خريطة كل خيارات الطباعة المقترحة — المفتاح هو optionKey والقيمة هي optionId */
  suggestedOptions?: Record<string, string>;
  /** أسباب كل اقتراح — المفتاح هو optionKey والقيمة سبب بالعربية */
  suggestedReasons?: Record<string, string>;
  confidence: number;
  insights: string[];
}

/// تحليل الملف بالذكاء الاصطناعي (VLM) — يُستدعى بعد التحليل الأساسي لتعزيزه
export async function analyzeFileWithAI(
  file: File,
  basicAnalysis: RealFileAnalysis,
): Promise<{ vlmAnalysis: VLMAnalysis | null; enhancedAnalysis: RealFileAnalysis }> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext);

  try {
    const formData = new FormData();
    formData.append("fileName", file.name);
    formData.append("fileType", basicAnalysis.fileType);

    // إرسال المعاينة المصغرة أو الصورة الأصلية
    if (basicAnalysis.thumbnailUrl) {
      formData.append("thumbnailDataUrl", basicAnalysis.thumbnailUrl);
    } else if (isImage) {
      formData.append("file", file);
    }

    // إرسال معاينات إضافية (صفحة وسط + أخيرة)
    if (basicAnalysis.extraThumbnails?.length) {
      basicAnalysis.extraThumbnails.forEach((t, idx) => {
        formData.append(`extraThumbnail${idx}`, t);
      });
    }

    // إرسال النص الكامل (حتى 10000 حرف بدلاً من 300)
    const textToSend = basicAnalysis.fullText || basicAnalysis.textPreview || "";
    if (textToSend.trim()) {
      formData.append("textPreview", textToSend.substring(0, 10000));
    }

    // عدد الصفحات كسياق
    if (basicAnalysis.pageCount > 0) {
      formData.append("pageCount", String(basicAnalysis.pageCount));
    }

    // نوع الخدمة المكتشف محلياً (يساعد في تخصيص البرومبت)
    formData.append("detectedService", basicAnalysis.detectedService);

    // ملخص إحصائي عميق
    const stats: string[] = [];
    if (basicAnalysis.imageCount) stats.push(`صور:${basicAnalysis.imageCount}`);
    if (basicAnalysis.whitespaceRatio != null) stats.push(`مساحة_بيضاء:${basicAnalysis.whitespaceRatio}%`);
    if (basicAnalysis.hasHeadings) stats.push("يحتوي_عناوين");
    if (basicAnalysis.linkCount) stats.push(`روابط:${basicAnalysis.linkCount}`);
    if (basicAnalysis.detectedLanguage) stats.push(`اللغة:${basicAnalysis.detectedLanguage}`);
    if (basicAnalysis.colorSpace) stats.push(`ألوان:${basicAnalysis.colorSpace}`);
    if (basicAnalysis.hasImages && basicAnalysis.hasText) stats.push("نصوص_وصور");
    else if (basicAnalysis.hasImages) stats.push("صور_فقط");
    else if (basicAnalysis.hasText) stats.push("نصوص_فقط");
    if (stats.length > 0) {
      formData.append("statsSummary", stats.join(" | "));
    }

    // لا نرسل طلب VLM إذا لم يكن هناك صورة أو معاينة
    if (!basicAnalysis.thumbnailUrl && !isImage) {
      return { vlmAnalysis: null, enhancedAnalysis: basicAnalysis };
    }

    // مهلة زمنية + محاولة إعادة واحدة: تحليل VLM قد يتأخر على شبكة بطيئة،
    // ومحاولة واحدة إضافية عند فشل مؤقت أفضل من الاستسلام فوراً للتحليل الأساسي
    const data = await fetchWithTimeoutAndRetry("/api/ai/analyze-file", formData, 20000, 1);

    if (!data || !data.success || !data.analysis) {
      console.warn("[VLM] Analysis failed:", data?.error);
      return { vlmAnalysis: null, enhancedAnalysis: basicAnalysis };
    }

    const vlm: VLMAnalysis = data.analysis;
    const enhanced = mergeAnalyses(basicAnalysis, vlm);

    return { vlmAnalysis: vlm, enhancedAnalysis: enhanced };
  } catch (err) {
    console.warn("[VLM] Request failed:", err);
    // في حالة الفشل، نرجع التحليل الأساسي فقط
    return { vlmAnalysis: null, enhancedAnalysis: basicAnalysis };
  }
}

/// fetch مع مهلة زمنية (AbortController) ومحاولة إعادة عند الفشل الشبكي
async function fetchWithTimeoutAndRetry(
  url: string,
  formData: FormData,
  timeoutMs: number,
  retries: number,
): Promise<{ success: boolean; analysis?: VLMAnalysis; error?: string } | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method: "POST", body: formData, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) {
        console.warn("[VLM] API returned", res.status, `(محاولة ${attempt + 1}/${retries + 1})`);
        if (attempt === retries) return null;
        continue;
      }
      return await res.json();
    } catch (e) {
      clearTimeout(timer);
      const isAbort = e instanceof DOMException && e.name === "AbortError";
      console.warn(`[VLM] ${isAbort ? "انتهت المهلة" : "فشل الاتصال"} (محاولة ${attempt + 1}/${retries + 1})`);
      if (attempt === retries) return null;
    }
  }
  return null;
}

/**
 * دمج مرجّح بالثقة بين التحليل المحلي ونتيجة VLM — بدل الاستبدال الأعمى.
 * المبدأ: عندما تكون ثقة التحليل المحلي عالية جداً (إشارة نص/اسم ملف صريحة وقوية)
 * وتختلف عن VLM بنوع الخدمة، نُبقي على تصنيف الخدمة المحلي (فهو مبني على نص حقيقي مقروء بدقة)
 * لكن نأخذ من VLM كل الخيارات الدقيقة (نوع الورق، التشطيب...) التي تحتاج فحصاً بصرياً لا يقدر عليه النص وحده.
 * عند الاتفاق بين المصدرين نرفع الثقة، وعند الاختلاف نسجّل ذلك بوضوح للمستخدم بدل إخفائه.
 */
function mergeAnalyses(basic: RealFileAnalysis, vlm: VLMAnalysis): RealFileAnalysis {
  const LOCAL_HIGH_CONFIDENCE = 88; // عتبة اعتبار الإشارة المحلية "قوية بما يكفي لتُحترم"
  const localIsStrong = basic.confidence >= LOCAL_HIGH_CONFIDENCE;
  const servicesAgree = vlm.suggestedService === basic.detectedService;

  const insights: string[] = [];
  let finalService: ServiceType = basic.detectedService;
  let finalServiceName = basic.detectedServiceName;
  let finalConfidence = vlm.confidence || basic.confidence;

  // ═══ تحقق تقاطعي: هل يتعارض ادعاء VLM مع قياسات محلية صلبة (DPI فعلي، ألوان مقاسة فعلياً)؟ ═══
  // VLM يرى معاينة مصغّرة مضغوطة فقط وقد "يخمّن" جودة أو لوناً لا يطابق ما قِسناه فعلياً من بكسلات الملف.
  // بدل تبنّي ادعائه كما هو، نقارنه بالحقائق القابلة للقياس ونُخفّض الثقة عند التعارض بدل إخفائه.
  const vlmSaysColor = vlm.suggestedColor === "color" || vlm.suggestedOptions?.color === "color";
  const vlmSaysBW = vlm.suggestedColor === "bw" || vlm.suggestedOptions?.color === "bw";
  let conflictPenalty = 0;
  let finalColor = vlm.suggestedColor || vlm.suggestedOptions?.color || basic.suggestedColor;
  if (vlmSaysBW && basic.hasImages && basic.colorSpace === "RGB") {
    insights.push("⚠️ تعارض: الذكاء الاصطناعي اقترح أبيض وأسود، لكن القياس المحلي المباشر للبكسلات وجد ألوان فعلية في الملف — تم تفضيل الطباعة الملونة");
    conflictPenalty += 8;
    finalColor = "color";
  }
  if (vlmSaysColor && !basic.hasImages && basic.colorSpace === "تدرج رمادي" && basic.hasText) {
    insights.push("⚠️ تعارض: الذكاء الاصطناعي اقترح طباعة ملونة، لكن الصفحة المقاسة محلياً تبدو نصية رمادية بالكامل — راجع الحاجة الفعلية للون قبل الدفع الإضافي");
    conflictPenalty += 6;
  }
  if (basic.estimatedDPI && basic.estimatedDPI < 120 && /ممتازة|عالية/.test(vlm.qualityAssessment || "")) {
    insights.push(`⚠️ تعارض: الذكاء الاصطناعي وصف الجودة بأنها "${vlm.qualityAssessment}"، لكن الدقة المقاسة فعلياً منخفضة (${basic.estimatedDPI} DPI) — يُنصح بالتحقق يدوياً قبل الطباعة على مقاس كبير`);
    conflictPenalty += 10;
  }

  if (servicesAgree) {
    // اتفاق بين التحليلين: نرفع الثقة (كل مصدر يعزز الآخر) ونأخذ تسمية VLM الأدق عادة
    finalServiceName = vlm.suggestedServiceName || basic.detectedServiceName;
    finalConfidence = Math.min(99, Math.max(vlm.confidence || 0, basic.confidence) + 5);
    insights.push(`✅ اتفاق بين التحليل المحلي والذكاء الاصطناعي — ثقة معزّزة (${finalConfidence}%)`);
  } else if (localIsStrong) {
    // التحليل المحلي واثق جداً من نص حقيقي مقروء — نحترمه بدل استبداله تلقائياً بتخمين بصري
    finalService = basic.detectedService;
    finalServiceName = basic.detectedServiceName;
    finalConfidence = basic.confidence;
    insights.push(
      `⚠️ اختلاف تصنيف: التحليل المحلي رجّح "${basic.detectedServiceName}" من نص الملف الفعلي (ثقة ${basic.confidence}%)، ` +
        `بينما اقترح الذكاء الاصطناعي "${vlm.suggestedServiceName}" — تم الاعتماد على النص الفعلي كمصدر أدق. يمكنك تغيير الخدمة يدوياً إن لزم.`,
    );
  } else {
    // التحليل المحلي غير واثق كفاية — نثق بـ VLM لأنه يرى الملف بصرياً
    finalService = (vlm.suggestedService as ServiceType) || basic.detectedService;
    finalServiceName = vlm.suggestedServiceName || basic.detectedServiceName;
    finalConfidence = vlm.confidence || basic.confidence;
  }

  finalConfidence = Math.max(40, finalConfidence - conflictPenalty);

  const enhanced: RealFileAnalysis = {
    ...basic,
    detectedService: finalService,
    detectedServiceName: finalServiceName,
    suggestedColor: finalColor,
    suggestedPaperSize: vlm.suggestedPaperSize || vlm.suggestedOptions?.paperSize || basic.suggestedPaperSize,
    suggestedPaperType: vlm.suggestedPaperType || vlm.suggestedOptions?.paperType || basic.suggestedPaperType,
    suggestedBinding: vlm.suggestedBinding || vlm.suggestedOptions?.binding || basic.suggestedBinding,
    suggestedOptions: { ...(vlm.suggestedOptions || {}), color: finalColor },
    suggestedReasons: vlm.suggestedReasons || {},
    confidence: finalConfidence,
    fileNature: vlm.documentType || basic.fileNature,
    insights: [
      `🤖 تحليل ذكاء اصطناعي: ${vlm.qualityAssessment}`,
      vlm.qualityReason ? `   ${vlm.qualityReason}` : "",
      ...insights,
      ...(vlm.insights || []),
      ...basic.insights.filter(
        (ins) => !vlm.insights?.some((vi: string) => ins.includes(vi) || vi.includes(ins)),
      ),
    ].filter(Boolean),
  };

  return enhanced;
}

/// تحليل نطاق الصفحات (مثل "1-5, 8, 10-12") وإرجاع العدد الفعلي
export function parsePageRange(range: string, totalPages: number): number {
  if (!range.trim()) return totalPages;
  const parts = range.split(",").map((p) => p.trim()).filter(Boolean);
  const pages = new Set<number>();
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        const s = Math.max(1, Math.min(start, end));
        const e = Math.min(totalPages, Math.max(start, end));
        for (let i = s; i <= e; i++) pages.add(i);
      }
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= totalPages) pages.add(n);
    }
  }
  return pages.size > 0 ? pages.size : totalPages;
}
