// محلل الملفات الحقيقي - يحلل محتوى الملف الفعلي而非 معلومات وهمية
"use client";

import type { ServiceType } from "@/lib/customer/print-config";
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
  // تحليل متقدم للصور
  imageDimensionsDetailed?: { width: number; height: number; megapixels: number };
  // تحليل TIFF
  tiffDetails?: {
    bitDepth: number;
    compression: string;
    photometric: string;
    multiPage: boolean;
    pageTileCount: number;
  };
  // تحليل GIF
  gifDetails?: {
    animated: boolean;
    frameCount: number;
    hasTransparency: boolean;
  };
  // تحليل SVG
  svgDetails?: {
    hasText: boolean;
    textCount: number;
    hasImages: boolean;
    imageCount: number;
    hasEmbeddedFonts: boolean;
    viewBox: string;
  };
  // تحليل PSD
  psdDetails?: {
    channels: number;
    bitDepth: number;
    colorMode: string;
    colorModeName: string;
  };
  // تحليل XLSX/XLS/CSV
  spreadsheetDetails?: {
    sheetCount: number;
    estimatedRows: number;
    hasCharts: boolean;
  };
  // تحليل PPTX
  presentationDetails?: {
    slideCount: number;
    aspectRatio: string;
    isWidescreen: boolean;
  };
  // تحليل EPS/AI
  vectorDetails?: {
    boundingBoxMM: { width: number; height: number } | null;
    isPdfCompatible: boolean;
  };
  // تحليل مستند
  documentDetails?: {
    wordCount: number;
    charCount: number;
    detectedLanguage: string;
    hasImages: boolean;
  };
  // تحليل BMP
  bmpDetails?: {
    bitDepth: number;
    colorCount: number;
    topDown: boolean;
  };
  // معلومات التصدير
  exportAdvice?: string; // نصيحة للتصدير (مثل 'صدّر كـ PDF لنتائج أفضل')
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

/// خرائط تصنيف PSD و TIFF
const PSD_COLOR_MODES: Record<number, string> = {
  0: 'Bitmap',
  1: 'تدرج رمادي',
  2: 'مفهرس',
  3: 'RGB',
  4: 'CMYK',
  7: 'متعدد القنوات',
  8: 'Duotone',
  9: 'Lab',
};

const TIFF_COMPRESSION: Record<number, string> = {
  1: 'بدون ضغط',
  5: 'LZW',
  7: 'JPEG',
  8: 'Deflate',
  32773: 'PackBits',
};

const TIFF_PHOTOMETRIC: Record<number, string> = {
  0: 'WhiteIsZero',
  1: 'BlackIsZero',
  2: 'RGB',
  3: 'Palette',
  4: 'Transparency Mask',
  5: 'CMYK',
  6: 'YCbCr',
};

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
  if (ext === 'pdf') result = await analyzePdf(file, sizeKB, sizeMB);
  else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) result = await analyzeImage(file, ext, sizeKB, sizeMB);
  else if (ext === 'tiff' || ext === 'tif') result = await analyzeTiff(file, sizeKB, sizeMB);
  else if (ext === 'bmp') result = await analyzeBmp(file, sizeKB, sizeMB);
  else if (ext === 'gif') result = await analyzeGif(file, sizeKB, sizeMB);
  else if (ext === 'svg') result = await analyzeSvg(file, sizeKB, sizeMB);
  else if (ext === 'docx' || ext === 'doc') result = await analyzeDocx(file, sizeKB, sizeMB);
  else if (['xlsx', 'xls', 'csv'].includes(ext)) result = await analyzeSpreadsheet(file, ext, sizeKB, sizeMB);
  else if (ext === 'pptx' || ext === 'ppt') result = await analyzePresentation(file, ext, sizeKB, sizeMB);
  else if (ext === 'psd') result = await analyzePsd(file, sizeKB, sizeMB);
  else if (ext === 'ai') result = await analyzeIllustrator(file, sizeKB, sizeMB);
  else if (ext === 'eps') result = await analyzeEps(file, sizeKB, sizeMB);
  else if (ext === 'cdr') result = await analyzeCorelDraw(file, sizeKB, sizeMB);
  else if (ext === 'indd') result = await analyzeInDesign(file, sizeKB, sizeMB);
  else result = defaultAnalysis(file.name, ext, sizeKB, sizeMB);

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
  let fullText = "";
  let detectedLanguage: string | undefined;
  let totalTextItems = 0;
  let totalChars = 0;
  const pageTexts: { pageNum: number; text: string; fontSize: number }[] = [];

  try {
    const lib = await ensurePdfjs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = lib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    pageCount = pdf.numPages;

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
    const pagesToReadFull = Math.min(pageCount, 50);
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
            const viewport = page.getViewport({ scale: 1 });
            const pdfWidthMM = (viewport.width * 25.4) / 72;
            const pdfHeightMM = (viewport.height * 25.4) / 72;
            pageDimensionsMM = {
              width: Math.round(pdfWidthMM * 10) / 10,
              height: Math.round(pdfHeightMM * 10) / 10,
            };
            closestPaperSize = findClosestPaperSize(pdfWidthMM, pdfHeightMM).name;
            orientation = pdfHeightMM > pdfWidthMM + 1 ? "عمودي" : pdfWidthMM > pdfHeightMM + 1 ? "أفقي" : "مربع";
            isPortrait = orientation === "عمودي";
            aspectRatio = getAspectRatioText(Math.round(pdfWidthMM), Math.round(pdfHeightMM));

            const thumbViewport = page.getViewport({ scale: 0.5 });
            const canvas = document.createElement("canvas");
            canvas.width = thumbViewport.width;
            canvas.height = thumbViewport.height;
            const context = canvas.getContext("2d");
            if (context) {
              await page.render({ canvasContext: context, viewport: thumbViewport, canvas } as Parameters<typeof page.render>[0]).promise;
              thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);

              try {
                const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
                let colorPixels = 0;
                let grayPixels = 0;
                const sampleStep = 16;
                for (let p = 0; p < imgData.data.length; p += 4 * sampleStep) {
                  const r = imgData.data[p];
                  const g = imgData.data[p + 1];
                  const b = imgData.data[p + 2];
                  const maxC = Math.max(r, g, b);
                  const minC = Math.min(r, g, b);
                  if (maxC - minC > 30) colorPixels++;
                  else grayPixels++;
                }
                const total = colorPixels + grayPixels;
                if (total > 0) {
                  if (colorPixels / total > 0.3) colorSpace = "RGB";
                  else colorSpace = "تدرج رمادي";
                }
              } catch {}

              estimatedDPI = Math.round(canvas.width / (pdfWidthMM / 25.4));
              dpiCategory = categorizeDPI(estimatedDPI);
            }

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
                if (textOpNames.has(fnName) && !hasText) hasText = true;
                if (imageOpNames.has(fnName)) {
                  hasImages = true;
                  imageCount++;
                }
                if (hasText && hasImages) break;
              }
            } catch {}
          } catch {}
        }

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

    const avgFontSize = pageTexts.length > 0
      ? pageTexts.reduce((s, p) => s + p.fontSize, 0) / pageTexts.length
      : 0;
    const headingPages = pageTexts.filter((p) => p.fontSize > avgFontSize * 1.5 && p.text.trim().length > 0);
    hasHeadings = headingPages.length >= 2;
    if (hasHeadings) {
      insights.push(`كُشف ${headingPages.length} عناوين كبيرة — مستند منظم بفصول`);
    }

    const urlMatches = fullText.match(/https?:\/\/[^\s]+|www\.[^\s]+/g);
    linkCount = urlMatches ? urlMatches.length : 0;
    if (linkCount > 0) insights.push(`${linkCount} رابط تشعبي مكتشف`);

    if (imageCount > 0) insights.push(`${imageCount} صورة مدمجة مكتشفة`);

    textPreview = fullText.trim().substring(0, 300);

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

  const searchText = `${pdfTitle || ""} ${fullText}`;
  let detectedService: ServiceType = "document";
  let confidence = 70;
  let suggestedColor = "bw";
  let suggestedPaperSize = "A4";
  let suggestedPaperType = "normal";
  let suggestedBinding = "none";
  let detectedServiceName = "طباعة مستند";

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') {
    detectedService = 'photo';
    detectedServiceName = 'طباعة صور';
    fileNature = 'صور';
    confidence = 0.95;
    suggestedColor = 'color';
    suggestedPaperType = 'glossy';
  } else if (pageCount > 10) {
    detectedService = 'book' as ServiceType;
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
    if (!closestPaperSize || closestPaperSize === "مخصص") suggestedPaperSize = "A4";
    insights.push(`تم تحديد: ${detectedServiceName}`);
  } else {
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

  if (suggestedColor === "bw" && hasImages && colorSpace === "RGB") {
    suggestedColor = "color";
    insights.push("⚠️ تصحيح: المستند يحتوي عناصر/صوراً ملونة فعلياً رغم أنه من فئة نصية عادة تُطبع بالأبيض والأسود — تم اقتراح الطباعة الملونة");
  } else if (suggestedColor === "color" && !hasImages && colorSpace === "تدرج رمادي") {
    suggestedColor = "bw";
    insights.push("⚠️ تصحيح: لا توجد ألوان فعلية مكتشفة في الصفحة رغم أن الفئة تفترض عادة طباعة ملونة — تم اقتراح الأبيض والأسود لتوفير التكلفة");
  }

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
 */
function suggestPhotoSize(
  widthPx: number,
  heightPx: number,
): { sizeId: string; achievableDPI: number; warning?: string } {
  if (!widthPx || !heightPx) return { sizeId: "10x15", achievableDPI: 0, warning: "تعذّر قياس أبعاد الصورة" };

  const isPortraitImg = heightPx >= widthPx;
  let best: { id: string; dpi: number } | null = null;

  for (const size of PHOTO_SIZES_CM) {
    const wCM = isPortraitImg ? size.w : size.h;
    const hCM = isPortraitImg ? size.h : size.w;
    const dpiW = widthPx / (wCM / 2.54);
    const dpiH = heightPx / (hCM / 2.54);
    const dpi = Math.min(dpiW, dpiH);
    if (dpi >= 150) {
      if (!best || size.w * size.h > (PHOTO_SIZES_CM.find((s) => s.id === best!.id)!.w * PHOTO_SIZES_CM.find((s) => s.id === best!.id)!.h)) {
        best = { id: size.id, dpi: Math.round(dpi) };
      }
    }
  }

  if (best) return { sizeId: best.id, achievableDPI: best.dpi };

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

  const photoSizeSuggestion = suggestPhotoSize(width, height);
  let suggestedPhotoSize = photoSizeSuggestion.sizeId;
  const suggestedPhotoSizeDPI = photoSizeSuggestion.achievableDPI;
  if (photoSizeSuggestion.warning) {
    insights.push(`⚠️ ${photoSizeSuggestion.warning}`);
    confidence = Math.max(65, confidence - 15);
  } else {
    insights.push(`المقاس المقترح: ${suggestedPhotoSize} (يحقق ≈${suggestedPhotoSizeDPI} DPI — جودة طباعة سليمة)`);
  }

  if (/passport|جواز|id|هوية|photo id|صورة شخصية/.test(name)) {
    detectedServiceName = "طباعة صور (صورة شخصية)";
    confidence = Math.min(confidence, 93);
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
    insights.push("ملصق — حجم A3");
  } else if (/wedding|زفاف|عرس/.test(name)) {
    fileNature = "صورة زفاف";
    suggestedPaperType = "premium";
    insights.push("صورة زفاف — ورق برو فاخر");
  } else {
    fileNature = "صورة";
    insights.push("صورة — طباعة ملونة على ورق لامع");
  }

  if (suggestedPhotoSizeDPI > 0 && suggestedPhotoSizeDPI < 150 && (suggestedPaperType === "premium" || suggestedPaperType === "metallic")) {
    insights.push(`⬇️ تم تخفيض نوع الورق من "${suggestedPaperType}" إلى "لامع عادي" — الدقة المتاحة (${suggestedPhotoSizeDPI} DPI) لا تبرر ورقاً فاخراً`);
    suggestedPaperType = "glossy";
  }

  if (isPortrait) insights.push(`اتجاه عمودي (${width}×${height})`);
  else if (isLandscape) insights.push(`اتجاه أفقي (${width}×${height})`);
  else insights.push(`مربع (${width}×${height})`);

  if (isHighRes) insights.push(`دقة عالية ${megapixels} ميجابكسل — جودة طباعة ممتازة`);
  else if (megapixels < 1) {
    insights.push(`دقة منخفضة ${megapixels} ميجابكسل — قد تظهر بكسلية عند الطباعة الكبيرة`);
    confidence = Math.max(70, confidence - 10);
  } else insights.push(`دقة ${megapixels} ميجابكسل`);

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
    pageDimensionsMM: { width, height },
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

/// تحليل DOCX حقيقي — يستخرج النص الفعلي عبر mammoth
async function analyzeDocx(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let fullText = "";
  let extractionOk = false;

  try {
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

  let pageCount: number;
  let wordCount = 0;
  let charCount = 0;
  if (extractionOk) {
    wordCount = fullText.split(/\s+/).filter(Boolean).length;
    charCount = fullText.length;
    pageCount = Math.max(1, Math.min(500, Math.ceil(wordCount / 500)));
    insights.push(`عدد الصفحات المقدّر: ${pageCount} (من ${wordCount} كلمة فعلية)`);
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
    detectedService = "book" as ServiceType;
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

  // كشف صور في DOCX (ZIP → ابحث عن media/)
  let hasImagesInDoc = false;
  try {
    const rawBytes = new Uint8Array(await file.slice(0, Math.min(file.size, 1024 * 1024)).arrayBuffer());
    const rawStr = new TextDecoder('latin1').decode(rawBytes);
    if (rawStr.includes('media/') || rawStr.includes('image/')) hasImagesInDoc = true;
  } catch {}

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
    documentDetails: {
      wordCount,
      charCount,
      detectedLanguage: detectedLanguage || 'غير محدد',
      hasImages: hasImagesInDoc,
    },
    hasImages: hasImagesInDoc || undefined,
  };
}

// ═══════════════════════════════════════════════════════════════
// محللات الأنواع الجديدة
// ═══════════════════════════════════════════════════════════════

/// تحليل TIFF/TIF — تحليل ثنائي كامل لرأس IFD
async function analyzeTiff(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let compression = 'بدون ضغط';
  let photometric = 'RGB';
  let xRes = 72;
  let yRes = 72;
  let resUnit = 2; // inch
  let multiPage = false;
  let stripTileCount = 1;

  try {
    const buf = new Uint8Array(await file.slice(0, Math.min(file.size, 65536)).arrayBuffer());

    if (buf.length < 8) throw new Error('ملف TIFF قصير جداً');

    // التحقق من التوقيع
    const byteOrder = buf[0] === 0x49 && buf[1] === 0x49 ? 'LE' : buf[0] === 0x4D && buf[1] === 0x4D ? 'BE' : null;
    if (!byteOrder) throw new Error('ليس ملف TIFF صالح');
    insights.push(`ترتيب البايتات: ${byteOrder === 'LE' ? 'Little-Endian (II)' : 'Big-Endian (MM)'}`);

    const isLE = byteOrder === 'LE';
    const getU16 = (off: number) => isLE ? buf[off] | (buf[off + 1] << 8) : (buf[off] << 8) | buf[off + 1];
    const getU32 = (off: number) => isLE
      ? buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24)
      : (buf[off] << 24) | (buf[off + 1] << 16) | (buf[off + 2] << 8) | buf[off + 3];

    const magic = getU16(2);
    if (magic !== 42) throw new Error(`رقم TIFF سحري غير صحيح: ${magic}`);

    const ifdOffset = getU32(4);
    if (ifdOffset + 2 > buf.length) throw new Error('IFD offset خارج نطاق الملف');

    const entryCount = getU16(ifdOffset);
    insights.push(`عدد عناصر IFD: ${entryCount}`);

    for (let i = 0; i < entryCount; i++) {
      const entryOff = ifdOffset + 2 + (i * 12);
      if (entryOff + 12 > buf.length) break;

      const tag = getU16(entryOff);
      const type = getU16(entryOff + 2);
      const count = getU32(entryOff + 4);
      // value/offset (4 bytes)

      // قراءة القيمة حسب النوع
      const readRational = (off: number): { num: number; den: number } => {
        if (off + 8 > buf.length) return { num: 72, den: 1 };
        const n = getU32(off);
        const d = getU32(off + 4);
        return { num: n, den: d };
      };

      const valueOffset = entryOff + 8;

      switch (tag) {
        case 256: // ImageWidth
          width = type === 3 ? getU16(valueOffset) : getU32(valueOffset);
          break;
        case 257: // ImageLength (height)
          height = type === 3 ? getU16(valueOffset) : getU32(valueOffset);
          break;
        case 258: // BitsPerSample
          if (type === 3) bitDepth = getU16(valueOffset);
          else if (type === 4) bitDepth = getU32(valueOffset);
          break;
        case 259: // Compression
          compression = TIFF_COMPRESSION[type === 3 ? getU16(valueOffset) : getU32(valueOffset)] || `مجهول (${type === 3 ? getU16(valueOffset) : getU32(valueOffset)})`;
          break;
        case 262: // PhotometricInterpretation
          photometric = TIFF_PHOTOMETRIC[getU16(valueOffset)] || `مجهول (${getU16(valueOffset)})`;
          break;
        case 273: // StripOffsets
          if (count > 1) {
            multiPage = true;
            stripTileCount = count;
          }
          break;
        case 278: // RowsPerStrip
          break;
        case 279: // StripByteCounts
          break;
        case 282: { // XResolution
          const off = count <= 1 ? valueOffset : getU32(valueOffset);
          const r = readRational(Math.min(off, buf.length - 8));
          if (r.den > 0) xRes = r.num / r.den;
          break;
        }
        case 283: { // YResolution
          const off = count <= 1 ? valueOffset : getU32(valueOffset);
          const r = readRational(Math.min(off, buf.length - 8));
          if (r.den > 0) yRes = r.num / r.den;
          break;
        }
        case 296: // ResolutionUnit
          resUnit = getU16(valueOffset);
          break;
      }
    }
  } catch (e) {
    insights.push(`تعذّر تحليل رأس TIFF بالكامل: ${e instanceof Error ? e.message : 'خطأ مجهول'}`);
  }

  const megapixels = width && height ? Math.round(((width * height) / 1000000) * 100) / 100 : 0;
  const isPortrait = height > width;
  const orientation: "عمودي" | "أفقي" | "مربع" = height > width + 1 ? "عمودي" : width > height + 1 ? "أفقي" : "مربع";

  // تحويل DPI حسب وحدة القياس
  let effectiveDPI = Math.round((xRes + yRes) / 2);
  if (resUnit === 3) { // سنتيمتر
    effectiveDPI = Math.round(effectiveDPI * 2.54);
  }

  // أبعاد بالملم من البكسل والدقة
  let widthMM = width > 0 && effectiveDPI > 0 ? Math.round((width / effectiveDPI) * 25.4 * 10) / 10 : 0;
  let heightMM = height > 0 && effectiveDPI > 0 ? Math.round((height / effectiveDPI) * 25.4 * 10) / 10 : 0;

  const closestPaper = widthMM > 0 && heightMM > 0 ? findClosestPaperSize(widthMM, heightMM) : null;

  insights.push(`الأبعاد: ${width}×${height} بكسل (${megapixels} ميجابكسل)`);
  insights.push(`عمق البت: ${bitDepth} بت`);
  insights.push(`الضغط: ${compression}`);
  insights.push(`الفضاء اللوني: ${photometric}`);
  insights.push(`الدقة: ${effectiveDPI} DPI`);
  if (multiPage) insights.push(`ملف متعدد الصفحات (≈${stripTileCount} شرائح/صفحات)`);
  if (widthMM > 0 && heightMM > 0) {
    insights.push(`الأبعاد المقدّرة: ${widthMM}×${heightMM} مم`);
    if (closestPaper) insights.push(`أقرب مقاس ورقي: ${closestPaper.name}`);
  }

  // اقتراح الخدمة
  let detectedService: ServiceType;
  let detectedServiceName: string;
  let confidence: number;
  let suggestedColor: string;
  let suggestedPaperSize: string;
  let suggestedPaperType: string;
  let suggestedBinding = "none";
  let suggestedPhotoSize: string | undefined;
  let suggestedPhotoSizeDPI: number | undefined;

  if (multiPage) {
    // متعدد الصفحات → مستند أو كتاب
    const estPages = Math.max(2, stripTileCount);
    if (estPages > 10) {
      detectedService = "book" as ServiceType;
      detectedServiceName = "طباعة كتاب/كتيب (TIFF)";
      suggestedBinding = "spiral";
      confidence = 70;
    } else {
      detectedService = "document";
      detectedServiceName = "طباعة مستند (TIFF)";
      confidence = 72;
    }
    suggestedColor = photometric === 'CMYK' ? 'color' : 'bw';
    suggestedPaperSize = closestPaper && closestPaper.name !== 'مخصص' ? closestPaper.name : 'A4';
    suggestedPaperType = 'normal';
  } else {
    // صفحة واحدة عالية الدقة → صورة فوتوغرافية
    detectedService = 'photo';
    detectedServiceName = 'طباعة صور (TIFF)';
    confidence = 85;
    suggestedColor = 'color';
    suggestedPaperType = 'glossy';
    suggestedPaperSize = 'A4';

    if (width > 0 && height > 0) {
      const ps = suggestPhotoSize(width, height);
      suggestedPhotoSize = ps.sizeId;
      suggestedPhotoSizeDPI = ps.achievableDPI;
      if (ps.warning) insights.push(`⚠️ ${ps.warning}`);
      else insights.push(`المقاس المقترح: ${ps.sizeId} (≈${ps.achievableDPI} DPI)`);
    }
  }

  const dpiCat = categorizeDPI(effectiveDPI);
  insights.push(`فئة الدقة: ${dpiCat}`);

  return {
    detectedService,
    detectedServiceName,
    pageCount: multiPage ? Math.max(2, stripTileCount) : 1,
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
    fileType: 'TIFF',
    fileName: file.name,
    fileNature: multiPage ? 'مستند TIFF متعدد الصفحات' : 'صورة TIFF',
    imageDimensions: width > 0 && height > 0 ? { width, height, megapixels } : undefined,
    isPortrait,
    orientation,
    pageDimensionsMM: widthMM > 0 && heightMM > 0 ? { width: widthMM, height: heightMM } : undefined,
    closestPaperSize: closestPaper?.name,
    estimatedDPI: effectiveDPI,
    dpiCategory: dpiCat,
    colorSpace: photometric === 'CMYK' ? 'CMYK' : photometric === 'WhiteIsZero' || photometric === 'BlackIsZero' ? 'تدرج رمادي' : 'RGB',
    aspectRatio: width > 0 && height > 0 ? getAspectRatioText(width, height) : undefined,
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    tiffDetails: {
      bitDepth,
      compression,
      photometric,
      multiPage,
      pageTileCount: stripTileCount,
    },
  };
}

/// تحليل BMP — تحليل ثنائي لرأس DIB
async function analyzeBmp(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let width = 0;
  let height = 0;
  let bitDepth = 24;
  let dibHeaderSize = 0;
  let topDown = false;

  try {
    const buf = new Uint8Array(await file.slice(0, 64).arrayBuffer());
    if (buf.length < 30) throw new Error('ملف BMP قصير جداً');

    // التحقق من التوقيع 'BM'
    if (buf[0] !== 0x42 || buf[1] !== 0x4D) throw new Error('ليس ملف BMP صالح (توقيع BM مفقود)');

    const pixelDataOffset = buf[10] | (buf[11] << 8) | (buf[12] << 16) | (buf[13] << 24);
    dibHeaderSize = buf[14] | (buf[15] << 8) | (buf[16] << 16) | (buf[17] << 24);

    insights.push(`حجم رأس DIB: ${dibHeaderSize} بايت`);

    if (dibHeaderSize >= 40) {
      width = buf[18] | (buf[19] << 8) | (buf[20] << 16) | (buf[21] << 24);
      // BMP uses signed int for height — negative means top-down
      const signedHeight = buf[22] | (buf[23] << 8) | (buf[24] << 16) | (buf[25] << 24);
      // تحويل من signed 32-bit
      height = signedHeight < 0 ? -signedHeight : signedHeight;
      topDown = signedHeight < 0;
      bitDepth = buf[28] | (buf[29] << 8);
    }

    // التعامل مع قيم سالبة (أعلى-أسفل) بشكل صحيح
    if (width < 0) width = -width;
    if (height < 0) height = -height;

  } catch (e) {
    insights.push(`تعذّر تحليل رأس BMP: ${e instanceof Error ? e.message : 'خطأ مجهول'}`);
  }

  const megapixels = width > 0 && height > 0 ? Math.round(((width * height) / 1000000) * 100) / 100 : 0;
  const colorCount = bitDepth <= 8 ? Math.pow(2, bitDepth) : 0;
  const isPortrait = height > width;
  const orientation: "عمودي" | "أفقي" | "مربع" = height > width + 1 ? "عمودي" : width > height + 1 ? "أفقي" : "مربع";

  insights.push(`الأبعاد: ${width}×${height} بكسل`);
  insights.push(`عمق البت: ${bitDepth} بت`);
  if (colorCount > 0) insights.push(`عدد الألوان: ${colorCount} (لوحة ألوان)`);
  if (topDown) insights.push('ترتيب البكسلات: من الأعلى للأسفل');

  // إنتاج معاينة (BMP يمكن تحميله في Image)
  let thumbnailUrl: string | undefined;
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    const scale = Math.min(300 / img.width, 300 / img.height, 1);
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
    }
    URL.revokeObjectURL(url);
  } catch {}

  const photoSuggestion = width > 0 && height > 0 ? suggestPhotoSize(width, height) : null;

  return {
    detectedService: 'photo',
    detectedServiceName: 'طباعة صور (BMP)',
    pageCount: 1,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor: bitDepth > 8 ? 'color' : 'bw',
    suggestedPaperSize: 'A4',
    suggestedPaperType: 'normal',
    suggestedBinding: 'none',
    suggestedPhotoSize: photoSuggestion?.sizeId,
    suggestedPhotoSizeDPI: photoSuggestion?.achievableDPI,
    confidence: 70,
    insights,
    fileType: 'BMP',
    fileName: file.name,
    fileNature: 'صورة BMP',
    imageDimensions: width > 0 && height > 0 ? { width, height, megapixels } : undefined,
    isPortrait,
    thumbnailUrl,
    orientation,
    colorSpace: bitDepth <= 8 ? 'تدرج رمادي' : 'RGB',
    hasImages: true,
    aspectRatio: width > 0 && height > 0 ? getAspectRatioText(width, height) : undefined,
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    bmpDetails: {
      bitDepth,
      colorCount: Math.round(colorCount),
      topDown,
    },
    exportAdvice: 'BMP غير مضغوط وحجمه كبير — لحفظ أفضل مع جودة مماثلة، استخدم PNG أو TIFF',
  };
}

/// تحليل GIF — تحليل ثنائي للرأس وكشف الحركة
async function analyzeGif(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let width = 0;
  let height = 0;
  let version = '';
  let animated = false;
  let frameCount = 1;
  let hasTransparency = false;

  try {
    const buf = new Uint8Array(await file.slice(0, Math.min(file.size, 65536)).arrayBuffer());
    if (buf.length < 13) throw new Error('ملف GIF قصير جداً');

    // التحقق من التوقيع 'GIF'
    if (buf[0] !== 0x47 || buf[1] !== 0x49 || buf[2] !== 0x46) throw new Error('ليس ملف GIF صالح');

    version = String.fromCharCode(buf[3], buf[4], buf[5]);
    width = buf[6] | (buf[7] << 8);
    height = buf[8] | (buf[9] << 8);

    const packedByte = buf[10];
    const hasGCT = (packedByte & 0x80) !== 0;
    const gctSize = 2 << (packedByte & 0x07);
    const backgroundColorIndex = buf[11];
    const pixelAspectRatio = buf[12];

    insights.push(`إصدار GIF: ${version}`);
    if (hasGCT) insights.push(`جدول ألوان عالمي: ${gctSize} لون`);
    if (backgroundColorIndex < gctSize) insights.push(`لون الخلفية: فهرس ${backgroundColorIndex}`);

    // حساب نهاية الجدول اللوني العالمي
    let pos = 13;
    if (hasGCT) pos += gctSize * 3;

    // فحص الكتل لاكتشاف الحركة والشفافية
    let imageSeparators = 0;
    while (pos < buf.length - 1) {
      const blockType = buf[pos];

      if (blockType === 0x3B) break; // Trailer — نهاية الملف

      if (blockType === 0x2C) {
        // Image Separator
        imageSeparators++;
        pos += 10; // الحد الأدنى لحجم Image Descriptor
        const imgPacked = buf[pos - 1]; // packed byte بعد الحقول الثابتة
        const hasLCT = (imgPacked & 0x80) !== 0;
        if (hasLCT) {
          const lctSize = 2 << (imgPacked & 0x07);
          pos += lctSize * 3;
        }
        // LZW minimum code size + sub-blocks
        if (pos < buf.length) {
          pos++; // LZW min code size
          while (pos < buf.length && buf[pos] !== 0) pos += buf[pos] + 1;
          pos++; // block terminator
        }
      } else if (blockType === 0x21) {
        // Extension
        pos++;
        if (pos < buf.length) {
          const label = buf[pos];
          pos++;

          if (label === 0xF9) {
            // Graphics Control Extension — كشف الشفافية
            if (pos + 5 < buf.length) {
              const gcPacked = buf[pos + 1];
              hasTransparency = (gcPacked & 0x01) !== 0;
              const delayTime = buf[pos + 2] | (buf[pos + 3] << 8);
              if (delayTime > 0) animated = true;
            }
            pos++; // block size (always 4)
            pos += 4; // data
            if (pos < buf.length && buf[pos] === 0) pos++; // block terminator
          } else {
            // Extension أخرى (Comment, Application, etc.)
            while (pos < buf.length && buf[pos] !== 0) pos += buf[pos] + 1;
            if (pos < buf.length && buf[pos] === 0) pos++; // block terminator
          }
        }
      } else {
        pos++;
      }
    }

    frameCount = imageSeparators;
    if (frameCount > 1) animated = true;

  } catch (e) {
    insights.push(`تعذّر تحليل GIF بالكامل: ${e instanceof Error ? e.message : 'خطأ مجهول'}`);
  }

  const megapixels = Math.round(((width * height) / 1000000) * 100) / 100;
  const isPortrait = height > width;
  const orientation: "عمودي" | "أفقي" | "مربع" = height > width + 1 ? "عمودي" : width > height + 1 ? "أفقي" : "مربع";

  insights.push(`الأبعاد: ${width}×${height} بكسل (${megapixels} ميجابكسل)`);
  if (animated) {
    insights.push(`⚠️ ملف GIF متحرك (${frameCount} إطار) — سيتم طباعة الإطار الأول فقط`);
  } else {
    insights.push('ملف GIF ثابت');
  }
  if (hasTransparency) insights.push('يحتوي شفافية');

  // معاينة
  let thumbnailUrl: string | undefined;
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    const scale = Math.min(300 / img.width, 300 / img.height, 1);
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
    }
    URL.revokeObjectURL(url);
  } catch {}

  const photoSuggestion = width > 0 && height > 0 ? suggestPhotoSize(width, height) : null;

  return {
    detectedService: 'photo',
    detectedServiceName: animated ? 'طباعة صور (GIF — إطار أول فقط)' : 'طباعة صور (GIF)',
    pageCount: 1,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor: 'color',
    suggestedPaperSize: 'A4',
    suggestedPaperType: 'normal',
    suggestedBinding: 'none',
    suggestedPhotoSize: photoSuggestion?.sizeId,
    suggestedPhotoSizeDPI: photoSuggestion?.achievableDPI,
    confidence: animated ? 60 : 70,
    insights,
    fileType: 'GIF',
    fileName: file.name,
    fileNature: animated ? 'GIF متحرك' : 'صورة GIF',
    imageDimensions: { width, height, megapixels },
    isPortrait,
    thumbnailUrl,
    orientation,
    colorSpace: 'RGB',
    hasImages: true,
    aspectRatio: width > 0 && height > 0 ? getAspectRatioText(width, height) : undefined,
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    gifDetails: {
      animated,
      frameCount,
      hasTransparency,
    },
    exportAdvice: animated ? 'GIF متحرك — يُنصح بتحويل الإطار المطلوب إلى PNG للحصول على جودة طباعة أفضل' : 'GIF يدعم 256 لون كحد أقصى — لجودة طباعة أفضل، استخدم PNG',
  };
}

/// تحليل SVG — تحليل نصي XML
async function analyzeSvg(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let viewBox = '';
  let svgWidth = 0;
  let svgHeight = 0;
  let textCount = 0;
  let imageCount = 0;
  let hasEmbeddedFonts = false;
  let isPortrait = true;

  try {
    const text = await file.text();

    // تحليل XML باستخدام DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (svgEl) {
      // استخراج viewBox
      viewBox = svgEl.getAttribute('viewBox') || '';

      // استخراج width/height
      const wAttr = svgEl.getAttribute('width');
      const hAttr = svgEl.getAttribute('height');

      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(Number);
        if (parts.length === 4 && !parts.some(isNaN)) {
          svgWidth = parts[2];
          svgHeight = parts[3];
        }
      }

      // إذا لم يكن هناك viewBox، استخدم width/height
      if (svgWidth === 0 && wAttr) {
        svgWidth = parseFloat(wAttr);
      }
      if (svgHeight === 0 && hAttr) {
        svgHeight = parseFloat(hAttr);
      }

      // عدد عناصر النص
      textCount = doc.querySelectorAll('text, tspan, textPath').length;
      imageCount = doc.querySelectorAll('image').length;

      // كشف الخطوط المدمجة
      const fontFaces = doc.querySelectorAll('font-face, style');
      for (const el of fontFaces) {
        const content = el.textContent || '';
        if (content.includes('@font-face') || el.tagName.toLowerCase() === 'font-face') {
          hasEmbeddedFonts = true;
          break;
        }
      }
      // كشف font-family في الأنماط
      if (!hasEmbeddedFonts) {
        const allText = text;
        if (allText.includes('font-family:') || allText.includes('font-family =')) {
          hasEmbeddedFonts = true;
        }
      }
    } else {
      insights.push('تعذّر تحليل هيكل SVG — قد يكون الملف تالفاً');
    }

    // حساب الأبعاد الفعلية بالملم
    let widthMM = 0;
    let heightMM = 0;
    if (svgWidth > 0 && svgHeight > 0) {
      // SVG الأبعاد عادة بالنقاط (1 نقطة = 1/72 إنش) أو بدون وحدة (بكسل)
      // نفترض وحدات SVG = نقاط
      widthMM = Math.round((svgWidth * 25.4) / 72 * 10) / 10;
      heightMM = Math.round((svgHeight * 25.4) / 72 * 10) / 10;
    }

    isPortrait = svgHeight > svgWidth;
    const closestPaper = widthMM > 0 && heightMM > 0 ? findClosestPaperSize(widthMM, heightMM) : null;

    insights.push(`أبعاد SVG: ${svgWidth}×${svgHeight} وحدة`);
    if (viewBox) insights.push(`ViewBox: ${viewBox}`);
    if (widthMM > 0 && heightMM > 0) {
      insights.push(`الأبعاد المقدّرة: ${widthMM}×${heightMM} مم`);
      if (closestPaper && closestPaper.name !== 'مخصص') insights.push(`أقرب مقاس ورقي: ${closestPaper.name}`);
    }
    insights.push(`عناصر نصية: ${textCount}`);
    insights.push(`صور مدمجة: ${imageCount}`);
    if (hasEmbeddedFonts) insights.push('يحتوي خطوطاً مدمجة — ستحافظ على شكلها عند الطباعة');
    if (textCount === 0 && imageCount === 0) insights.push('تصميم فارغ أو رسومات شكلية فقط');

  } catch (e) {
    insights.push(`تعذّر تحليل SVG: ${e instanceof Error ? e.message : 'خطأ مجهول'}`);
  }

  // تحديد الخدمة
  let detectedService: ServiceType;
  let detectedServiceName: string;
  let suggestedPaperSize = 'A4';
  let suggestedPaperType = 'normal';

  if (svgWidth > 500 || svgHeight > 500 || sizeKB > 100) {
    detectedService = 'poster';
    detectedServiceName = 'ملصق (SVG)';
    suggestedPaperSize = 'A3';
    suggestedPaperType = 'normal';
  } else {
    detectedService = 'document';
    detectedServiceName = 'طباعة تصميم (SVG)';
    suggestedPaperType = 'normal';
  }

  const orientation: "عمودي" | "أفقي" | "مربع" = svgHeight > svgWidth + 1 ? "عمودي" : svgWidth > svgHeight + 1 ? "أفقي" : "مربع";

  return {
    detectedService,
    detectedServiceName,
    pageCount: 1,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor: 'color',
    suggestedPaperSize,
    suggestedPaperType,
    suggestedBinding: 'none',
    confidence: 75,
    insights,
    fileType: 'SVG',
    fileName: file.name,
    fileNature: 'تصميم متجهي SVG',
    isPortrait,
    orientation,
    hasImages: imageCount > 0,
    hasText: textCount > 0,
    colorSpace: 'RGB',
    aspectRatio: svgWidth > 0 && svgHeight > 0 ? getAspectRatioText(Math.round(svgWidth), Math.round(svgHeight)) : undefined,
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    svgDetails: {
      hasText: textCount > 0,
      textCount,
      hasImages: imageCount > 0,
      imageCount,
      hasEmbeddedFonts,
      viewBox,
    },
  };
}

/// تحليل جداول البيانات XLSX/XLS/CSV
async function analyzeSpreadsheet(
  file: File,
  ext: string,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let sheetCount = 1;
  let estimatedRows = 0;
  let hasCharts = false;

  try {
    if (ext === 'csv') {
      // CSV: قراءة نصية مباشرة
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      estimatedRows = Math.max(0, lines.length - 1); // السطر الأول عادة عناوين
      const firstLine = lines[0] || '';
      const colCount = firstLine.split(',').length;
      sheetCount = 1;
      insights.push(`صفوف البيانات: ${estimatedRows}`);
      insights.push(`أعمدة (تقدير): ${colCount}`);
    } else {
      // XLSX/XLS: تحليل ثنائي
      const buf = new Uint8Array(await file.slice(0, Math.min(file.size, 2 * 1024 * 1024)).arrayBuffer());
      const rawStr = new TextDecoder('utf-8', { fatal: false }).decode(buf);

      if (ext === 'xlsx') {
        // XLSX هو ملف ZIP يبدأ بـ PK\x03\x04
        if (buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04) {
          // عد أوراق العمل من نمط XML
          const worksheetMatches = rawStr.match(/<worksheet /g);
          sheetCount = worksheetMatches ? worksheetMatches.length : 1;

          // كشف وجود رسوم بيانية
          hasCharts = rawStr.includes('<c:chart') || rawStr.includes('drawing') || rawStr.includes('chartSpace');

          // تقدير عدد الصفوف من حجم الملف
          // XLSX: متوسط ~20KB لكل 1000 صف بيانات
          estimatedRows = Math.round((sizeKB / 20) * 1000);

          // محاولة عد أكثر دقة من <row> في sheetData
          const rowMatches = rawStr.match(/<row /g);
          if (rowMatches && rowMatches.length > 0) {
            estimatedRows = rowMatches.length;
          }

          // كشف خلايا مدمجة
          const mergeMatches = rawStr.match(/<mergeCell /g);
          if (mergeMatches) insights.push(`${mergeMatches.length} خلية مدمجة`);

          insights.push(`أوراق العمل: ${sheetCount}`);
          insights.push(`الصفوف المقدّرة: ${estimatedRows}`);
          if (hasCharts) insights.push('يحتوي رسوماً بيانية');
        } else {
          insights.push('تنسيق XLSX غير معروف (لا يبدأ بـ PK)');
          estimatedRows = Math.round(sizeKB / 0.5);
        }
      } else {
        // XLS (ثنائي قديم)
        // BOF record: 0x09 0x08 (BIFF8)
        if (buf.length > 8 && buf[0] === 0xD0 && buf[1] === 0xCF) {
          insights.push('ملف Excel ثنائي (BIFF) قديم');
          estimatedRows = Math.round(sizeKB / 0.3);
        } else {
          insights.push('تنسيق XLS غير معروف');
          estimatedRows = Math.round(sizeKB / 0.5);
        }
        sheetCount = 1;
      }
    }
  } catch (e) {
    insights.push(`تعذّر تحليل الملف: ${e instanceof Error ? e.message : 'خطأ مجهول'}`);
  }

  // تقدير الصفحات (≈50 صف لكل صفحة مطبوعة)
  const pageCount = Math.max(1, Math.ceil(estimatedRows / 50));

  // تحديد الخدمة
  let detectedService: ServiceType;
  let detectedServiceName: string;
  let confidence: number;
  let suggestedBinding = 'none';

  if (pageCount > 10) {
    detectedService = 'document';
    detectedServiceName = 'طباعة جدول بيانات (متعدد الصفحات)';
    suggestedBinding = 'spiral';
    confidence = 70;
  } else if (hasCharts && pageCount <= 3) {
    detectedService = 'document';
    detectedServiceName = 'طباعة جدول بيانات (يحتوي رسوماً بيانية)';
    confidence = 68;
  } else {
    detectedService = 'document';
    detectedServiceName = 'طباعة جدول بيانات';
    confidence = 70;
  }

  if (ext === 'csv') insights.push('ملف CSV نصي — تنسيق بسيط');
  else if (ext === 'xls') insights.push('ملف Excel قديم — يُنصح بالتحويل إلى XLSX أو PDF');

  return {
    detectedService,
    detectedServiceName,
    pageCount,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor: 'bw',
    suggestedPaperSize: 'A4',
    suggestedPaperType: 'normal',
    suggestedBinding,
    confidence,
    insights,
    fileType: ext.toUpperCase(),
    fileName: file.name,
    fileNature: `جدول بيانات (${ext.toUpperCase()})`,
    hasText: true,
    orientation: 'عمودي',
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    spreadsheetDetails: {
      sheetCount,
      estimatedRows,
      hasCharts,
    },
    exportAdvice: ext === 'csv' ? 'لأفضل نتائج طباعة، افتح الملف في Excel وصدّره كـ PDF' : 'لأفضل نتائج طباعة، صدّر كـ PDF مع ترويسات وتذييلات',
  };
}

/// تحليل العروض التقديمية PPTX/PPT
async function analyzePresentation(
  file: File,
  ext: string,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let slideCount = 0;
  let aspectRatio = '4:3';
  let isWidescreen = false;

  try {
    if (ext === 'pptx') {
      const buf = new Uint8Array(await file.slice(0, Math.min(file.size, 4 * 1024 * 1024)).arrayBuffer());
      const rawStr = new TextDecoder('utf-8', { fatal: false }).decode(buf);

      if (buf[0] === 0x50 && buf[1] === 0x4B) {
        // عد الشرائح من نمط XML
        const slideMatches = rawStr.match(/<p:sld[\s>]/g) || rawStr.match(/<p:slide[\s>]/g);
        slideCount = slideMatches ? slideMatches.length : 0;

        // كشف أبعاد الشريحة من sldSz
        const sldSzMatch = rawStr.match(/sldSz[^>]*cx[=\s"]+(\d+)[^>]*cy[=\s"]+(\d+)/);
        if (sldSzMatch) {
          const cx = parseInt(sldSzMatch[1], 10);
          const cy = parseInt(sldSzMatch[2], 10);
          // EMU (English Metric Units): 914400 EMU = 1 إنش
          const widthInches = cx / 914400;
          const heightInches = cy / 914400;
          const ratio = widthInches / heightInches;
          isWidescreen = ratio > 1.5;
          aspectRatio = isWidescreen ? '16:9' : '4:3';
          insights.push(`أبعاد الشريحة: ${widthInches.toFixed(1)}×${heightInches.toFixed(1)} إنش (${aspectRatio})`);
        } else {
          // محاولة أخرى مع ترتيب مختلف
          const sldSzMatch2 = rawStr.match(/sldSz[^>]*cy[=\s"]+(\d+)[^>]*cx[=\s"]+(\d+)/);
          if (sldSzMatch2) {
            const cy = parseInt(sldSzMatch2[1], 10);
            const cx = parseInt(sldSzMatch2[2], 10);
            const widthInches = cx / 914400;
            const heightInches = cy / 914400;
            isWidescreen = (widthInches / heightInches) > 1.5;
            aspectRatio = isWidescreen ? '16:9' : '4:3';
          }
        }

        if (slideCount === 0) {
          // تقدير بديل: ابحث عن صيغ أخرى
          const slideRelMatches = rawStr.match(/slide\d+\.xml/g);
          slideCount = slideRelMatches ? new Set(slideRelMatches).size : 0;
        }
      } else {
        insights.push('تنسيق PPTX غير معروف (لا يبدأ بـ PK)');
      }
    } else {
      // PPT ثنائي — تقدير من الحجم (≈50KB لكل شريحة)
      slideCount = Math.max(1, Math.round(sizeKB / 50));
      insights.push('ملف PowerPoint ثنائي — عدد الشرائح تقديري من الحجم');
    }

    if (slideCount > 0) insights.push(`عدد الشرائح: ${slideCount}`);
    if (isWidescreen) insights.push('شاشة عريضة (16:9)');

  } catch (e) {
    insights.push(`تعذّر تحليل العرض: ${e instanceof Error ? e.message : 'خطأ مجهول'}`);
    slideCount = Math.max(1, Math.round(sizeKB / 50));
  }

  // تحديد الخدمة
  let detectedService: ServiceType;
  let detectedServiceName: string;
  let confidence: number;
  let suggestedPaperSize = 'A4';
  let suggestedBinding = 'none';

  if (slideCount <= 4) {
    detectedService = 'document';
    detectedServiceName = 'طباعة عرض تقديمي';
    confidence = 72;
  } else {
    detectedService = 'document';
    detectedServiceName = 'طباعة عرض تقديمي (متعدد الشرائح)';
    confidence = 75;
    suggestedBinding = slideCount > 10 ? 'spiral' : 'none';
  }

  return {
    detectedService,
    detectedServiceName,
    pageCount: slideCount,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor: 'color',
    suggestedPaperSize,
    suggestedPaperType: 'normal',
    suggestedBinding,
    confidence,
    insights,
    fileType: ext.toUpperCase(),
    fileName: file.name,
    fileNature: `عرض تقديمي (${ext.toUpperCase()})`,
    hasText: true,
    hasImages: true,
    orientation: 'أفقي',
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    presentationDetails: {
      slideCount,
      aspectRatio,
      isWidescreen,
    },
    exportAdvice: 'لأفضل نتائج طباعة، صدّر العرض كـ PDF مع تخطيط الشرائح المطلوب',
  };
}

/// تحليل ملفات Photoshop PSD
async function analyzePsd(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let width = 0;
  let height = 0;
  let channels = 3;
  let bitDepth = 8;
  let colorMode = 3; // RGB
  let version = 1;

  try {
    const buf = new Uint8Array(await file.slice(0, 30).arrayBuffer());
    if (buf.length < 26) throw new Error('ملف PSD قصير جداً');

    // التحقق من التوقيع '8BPS'
    if (buf[0] !== 0x38 || buf[1] !== 0x42 || buf[2] !== 0x50 || buf[3] !== 0x53) {
      throw new Error('ليس ملف Photoshop PSD صالح');
    }

    version = buf[4] | (buf[5] << 8);
    // bytes 6-11: reserved
    channels = buf[12] | (buf[13] << 8);
    height = buf[14] | (buf[15] << 8) | (buf[16] << 16) | (buf[17] << 24);
    width = buf[18] | (buf[19] << 8) | (buf[20] << 16) | (buf[21] << 24);
    bitDepth = buf[22] | (buf[23] << 8);
    colorMode = buf[24];

    // التعامل مع القيم السالبة (unsigned)
    if (width < 0) width = 0;
    if (height < 0) height = 0;

  } catch (e) {
    insights.push(`تعذّر تحليل رأس PSD: ${e instanceof Error ? e.message : 'خطأ مجهول'}`);
  }

  const colorModeName = PSD_COLOR_MODES[colorMode] || `مجهول (${colorMode})`;
  const megapixels = width > 0 && height > 0 ? Math.round(((width * height) / 1000000) * 100) / 100 : 0;
  const isPortrait = height > width;
  const orientation: "عمودي" | "أفقي" | "مربع" = height > width + 1 ? "عمودي" : width > height + 1 ? "أفقي" : "مربع";

  insights.push(`إصدار PSD: ${version}`);
  insights.push(`الأبعاد: ${width}×${height} بكسل (${megapixels} ميجابكسل)`);
  insights.push(`القنوات: ${channels}`);
  insights.push(`عمق البت لكل قناة: ${bitDepth} بت`);
  insights.push(`نمط الألوان: ${colorModeName}`);

  const photoSuggestion = width > 0 && height > 0 ? suggestPhotoSize(width, height) : null;

  // تحديد الخدمة
  let detectedService: ServiceType;
  let detectedServiceName: string;
  let suggestedColor: string;
  let suggestedPaperSize = 'A4';
  let suggestedPaperType = 'normal';

  if (megapixels > 4) {
    detectedService = 'custom-design' as ServiceType;
    detectedServiceName = 'تصميم مخصص (Photoshop)';
    suggestedPaperSize = 'A3';
    suggestedPaperType = 'normal';
    suggestedColor = 'color';
  } else {
    detectedService = 'custom-design' as ServiceType;
    detectedServiceName = 'تصميم مخصص (Photoshop)';
    suggestedPaperType = 'normal';
    suggestedColor = colorMode === 4 ? 'color' : 'color';
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
    suggestedBinding: 'none',
    suggestedPhotoSize: photoSuggestion?.sizeId,
    suggestedPhotoSizeDPI: photoSuggestion?.achievableDPI,
    confidence: 72,
    insights,
    fileType: 'PSD',
    fileName: file.name,
    fileNature: 'تصميم Photoshop',
    imageDimensions: width > 0 && height > 0 ? { width, height, megapixels } : undefined,
    isPortrait,
    orientation,
    colorSpace: colorMode === 4 ? 'CMYK' : colorMode === 1 ? 'تدرج رمادي' : 'RGB',
    hasImages: true,
    aspectRatio: width > 0 && height > 0 ? getAspectRatioText(width, height) : undefined,
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    psdDetails: {
      channels,
      bitDepth,
      colorMode: String(colorMode),
      colorModeName,
    },
    exportAdvice: 'صدّر كـ PDF أو TIFF (بدون طبقات) للحصول على أفضل نتائج طباعة',
  };
}

/// تحليل ملفات Adobe Illustrator AI
async function analyzeIllustrator(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let width = 0;
  let height = 0;
  let boundingBoxMM: { width: number; height: number } | null = null;
  let isPdfCompatible = false;
  let pageDimensionsMM: { width: number; height: number } | undefined;

  try {
    const buf = new Uint8Array(await file.slice(0, Math.min(file.size, 65536)).arrayBuffer());
    const headerStr = new TextDecoder('ascii', { fatal: false }).decode(buf.slice(0, 32));

    if (headerStr.startsWith('%PDF')) {
      // PDF-compatible AI file
      isPdfCompatible = true;
      insights.push('ملف AI متوافق مع PDF — يمكن قراءته كـ PDF');

      // محاولة استخراج BoundingBox من محتوى PDF
      const fullStr = new TextDecoder('latin1', { fatal: false }).decode(buf);
      const bboxMatch = fullStr.match(/%%BoundingBox:\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
      if (bboxMatch) {
        const llx = parseFloat(bboxMatch[1]);
        const lly = parseFloat(bboxMatch[2]);
        const urx = parseFloat(bboxMatch[3]);
        const ury = parseFloat(bboxMatch[4]);
        width = Math.round(urx - llx);
        height = Math.round(ury - lly);
        boundingBoxMM = {
          width: Math.round(width * 25.4 / 72 * 10) / 10,
          height: Math.round(height * 25.4 / 72 * 10) / 10,
        };
        insights.push(`BoundingBox: ${width}×${height} نقطة (${boundingBoxMM.width}×${boundingBoxMM.height} مم)`);
      }
    } else if (headerStr.startsWith('%!PS-Adobe')) {
      // PostScript-based AI
      insights.push('ملف AI مبني على PostScript — تنسيق قديم');

      const fullStr = new TextDecoder('latin1', { fatal: false }).decode(buf);
      const bboxMatch = fullStr.match(/%%BoundingBox:\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
      if (bboxMatch) {
        const llx = parseFloat(bboxMatch[1]);
        const lly = parseFloat(bboxMatch[2]);
        const urx = parseFloat(bboxMatch[3]);
        const ury = parseFloat(bboxMatch[4]);
        width = Math.round(urx - llx);
        height = Math.round(ury - lly);
        boundingBoxMM = {
          width: Math.round(width * 25.4 / 72 * 10) / 10,
          height: Math.round(height * 25.4 / 72 * 10) / 10,
        };
        insights.push(`BoundingBox: ${width}×${height} نقطة (${boundingBoxMM.width}×${boundingBoxMM.height} مم)`);
      }
    } else {
      insights.push('تنسيق AI غير معروف — قد يكون إصدار حديث مشفّر');
    }
  } catch (e) {
    insights.push(`تعذّر تحليل AI: ${e instanceof Error ? e.message : 'خطأ مجهول'}`);
  }

  const isPortrait = height > width;
  const orientation: "عمودي" | "أفقي" | "مربع" = height > width + 1 ? "عمودي" : width > height + 1 ? "أفقي" : "مربع";
  const closestPaper = boundingBoxMM ? findClosestPaperSize(boundingBoxMM.width, boundingBoxMM.height) : null;

  if (boundingBoxMM) {
    pageDimensionsMM = boundingBoxMM;
    if (closestPaper && closestPaper.name !== 'مخصص') {
      insights.push(`أقرب مقاس ورقي: ${closestPaper.name}`);
    }
  }

  return {
    detectedService: 'custom-design' as ServiceType,
    detectedServiceName: 'تصميم مخصص (Adobe Illustrator)',
    pageCount: 1,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor: 'color',
    suggestedPaperSize: closestPaper && closestPaper.name !== 'مخصص' ? closestPaper.name : 'A3',
    suggestedPaperType: 'normal',
    suggestedBinding: 'none',
    confidence: 68,
    insights,
    fileType: 'AI',
    fileName: file.name,
    fileNature: 'تصميم متجهي (Adobe Illustrator)',
    isPortrait,
    orientation,
    colorSpace: 'RGB',
    hasImages: false,
    pageDimensionsMM,
    closestPaperSize: closestPaper?.name,
    aspectRatio: width > 0 && height > 0 ? getAspectRatioText(width, height) : undefined,
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    vectorDetails: {
      boundingBoxMM,
      isPdfCompatible,
    },
    exportAdvice: isPdfCompatible
      ? 'يمكن إعادة تسميته إلى .pdf وفتحه مباشرة — أو صدّره من Illustrator كـ PDF'
      : 'صدّر من Adobe Illustrator كـ PDF لضمان التوافق عند الطباعة',
  };
}

/// تحليل ملفات EPS
async function analyzeEps(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let boundingBoxMM: { width: number; height: number } | null = null;
  let pageDimensionsMM: { width: number; height: number } | undefined;

  try {
    const buf = new Uint8Array(await file.slice(0, Math.min(file.size, 65536)).arrayBuffer());
    const text = new TextDecoder('latin1', { fatal: false }).decode(buf);

    // البحث عن HiResBoundingBox أولاً (أكثر دقة)
    const hiresMatch = text.match(/%%HiResBoundingBox:\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
    const bboxMatch = text.match(/%%BoundingBox:\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);

    const match = hiresMatch || bboxMatch;
    if (match) {
      const llx = parseFloat(match[1]);
      const lly = parseFloat(match[2]);
      const urx = parseFloat(match[3]);
      const ury = parseFloat(match[4]);
      const widthPt = urx - llx;
      const heightPt = ury - lly;
      const widthMM = Math.round(widthPt * 25.4 / 72 * 10) / 10;
      const heightMM = Math.round(heightPt * 25.4 / 72 * 10) / 10;
      boundingBoxMM = { width: widthMM, height: heightMM };
      pageDimensionsMM = boundingBoxMM;

      insights.push(`${hiresMatch ? 'HiRes' : ''}BoundingBox: ${Math.round(widthPt)}×${Math.round(heightPt)} نقطة`);
      insights.push(`الأبعاد: ${widthMM}×${heightMM} مم`);
    } else {
      insights.push('لم يُعثر على BoundingBox — قد يكون الملف بصيغة ثنائية EPS');
    }

    // كشف معلومات إضافية من تعليقات DSC
    const titleMatch = text.match(/%%Title:\s*(.+)/);
    const creatorMatch = text.match(/%%Creator:\s*(.+)/);
    if (titleMatch) insights.push(`العنوان: ${titleMatch[1].trim()}`);
    if (creatorMatch) insights.push(`المُنشئ: ${creatorMatch[1].trim()}`);

  } catch (e) {
    insights.push(`تعذّر تحليل EPS: ${e instanceof Error ? e.message : 'خطأ مجهول'}`);
  }

  const w = boundingBoxMM?.width || 0;
  const h = boundingBoxMM?.height || 0;
  const isPortrait = h > w;
  const orientation: "عمودي" | "أفقي" | "مربع" = h > w + 1 ? "عمودي" : w > h + 1 ? "أفقي" : "مربع";
  const closestPaper = boundingBoxMM ? findClosestPaperSize(w, h) : null;

  if (closestPaper && closestPaper.name !== 'مخصص') {
    insights.push(`أقرب مقاس ورقي: ${closestPaper.name}`);
  }

  return {
    detectedService: 'custom-design' as ServiceType,
    detectedServiceName: 'تصميم مخصص (EPS)',
    pageCount: 1,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor: 'color',
    suggestedPaperSize: closestPaper && closestPaper.name !== 'مخصص' ? closestPaper.name : 'A3',
    suggestedPaperType: 'normal',
    suggestedBinding: 'none',
    confidence: 68,
    insights,
    fileType: 'EPS',
    fileName: file.name,
    fileNature: 'تصميم متجهي (EPS)',
    isPortrait,
    orientation,
    colorSpace: 'RGB',
    pageDimensionsMM,
    closestPaperSize: closestPaper?.name,
    aspectRatio: w > 0 && h > 0 ? getAspectRatioText(Math.round(w), Math.round(h)) : undefined,
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    vectorDetails: {
      boundingBoxMM,
      isPdfCompatible: false,
    },
    exportAdvice: 'صدّر كـ PDF من البرنامج المُنشئ لضمان أفضل نتائج طباعة',
  };
}

/// تحليل ملفات CorelDraw CDR
async function analyzeCorelDraw(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];
  let version = 'مجهول';
  let isRiff = false;

  try {
    const buf = new Uint8Array(await file.slice(0, 32).arrayBuffer());

    if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
      isRiff = true;
      // RIFF header: 'RIFF' + size (4 bytes) + type (4 bytes)
      const riffType = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]);
      // CDR versions: bytes 8-9 as version number
      const versionNum = buf[8] | (buf[9] << 8);
      const versionMap: Record<number, string> = {
        0x0500: 'CDR 5',
        0x0600: 'CDR 6',
        0x0700: 'CDR 7',
        0x0800: 'CDR 8',
        0x0900: 'CDR 9',
        0x0A00: 'CDR 10',
        0x0B00: 'CDR 11',
        0x0C00: 'CDR 12',
        0x0D00: 'CDR X3',
        0x0E00: 'CDR X4',
        0x0F00: 'CDR X5',
        0x1000: 'CDR X6',
        0x1100: 'CDR X7',
        0x1200: 'CDR X8',
        0x1300: 'CDR 2017',
        0x1400: 'CDR 2018',
        0x1500: 'CDR 2019',
        0x1600: 'CDR 2020',
        0x1700: 'CDR 2021',
      };
      version = versionMap[versionNum] || `CDR (إصدار ${versionNum})`;
      insights.push(`تنسيق RIFF — ${version}`);
    } else {
      insights.push('تنسيق CDR حديث (غير RIFF) — لا يمكن تحليله بالكامل في المتصفح');
      // محاولة كشف الإصدار من بداية الملف
      const headerStr = new TextDecoder('ascii', { fatal: false }).decode(buf.slice(0, 16));
      if (headerStr.includes('CDR')) {
        version = 'CDR (حديث)';
      }
    }
  } catch (e) {
    insights.push(`تعذّر تحليل CDR: ${e instanceof Error ? e.message : 'خطأ مجهول'}`);
  }

  // تقدير التعقيد من الحجم
  let complexity = 'بسيط';
  if (sizeMB > 5) complexity = 'معقد/كبير';
  else if (sizeMB > 1) complexity = 'متوسط';

  insights.push(`التعقيد (من الحجم): ${complexity}`);

  return {
    detectedService: 'custom-design' as ServiceType,
    detectedServiceName: 'تصميم مخصص (CorelDraw)',
    pageCount: 1,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor: 'color',
    suggestedPaperSize: 'A3',
    suggestedPaperType: 'normal',
    suggestedBinding: 'none',
    confidence: 55,
    insights,
    fileType: 'CDR',
    fileName: file.name,
    fileNature: `تصميم CorelDraw (${version})`,
    orientation: 'عمودي',
    colorSpace: 'RGB',
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    exportAdvice: 'صدّر من CorelDraw كـ PDF أو SVG لضمان نتائج طباعة دقيقة — تنسيق CDR الخاص لا يمكن قراءته مباشرة',
  };
}

/// تحليل ملفات Adobe InDesign INDD
async function analyzeInDesign(
  file: File,
  sizeKB: number,
  sizeMB: number,
): Promise<RealFileAnalysis> {
  const insights: string[] = [];

  // INDD لا يملك رأساً ثنائياً موثوقاً — نعتمد على الحجم والتقدير
  let complexity = 'بسيط';
  let estimatedPages = 1;

  if (sizeKB < 100) {
    complexity = 'بسيط';
    estimatedPages = 1;
  } else if (sizeKB < 1024) {
    complexity = 'متوسط';
    estimatedPages = Math.max(1, Math.round(sizeKB / 200));
  } else {
    complexity = 'معقد/متعدد الصفحات';
    estimatedPages = Math.max(1, Math.round(sizeMB / 0.5));
  }

  insights.push('ملف Adobe InDesign — لا يمكن تحليله بالكامل في المتصفح');
  insights.push(`التعقيد (من الحجم): ${complexity}`);
  insights.push(`الصفحات المقدّرة: ${estimatedPages}`);

  let detectedService: ServiceType;
  let detectedServiceName: string;
  let suggestedBinding = 'none';

  if (estimatedPages > 10) {
    detectedService = 'document';
    detectedServiceName = 'كتاب/منشور (InDesign)';
    suggestedBinding = 'spiral';
  } else {
    detectedService = 'document';
    detectedServiceName = 'مستند (InDesign)';
  }

  return {
    detectedService,
    detectedServiceName,
    pageCount: estimatedPages,
    fileSizeKB: sizeKB,
    fileSizeMB: sizeMB,
    suggestedColor: 'color',
    suggestedPaperSize: 'A4',
    suggestedPaperType: 'normal',
    suggestedBinding,
    confidence: 50,
    insights,
    fileType: 'INDD',
    fileName: file.name,
    fileNature: 'منشور/مستند (Adobe InDesign)',
    hasText: true,
    hasImages: true,
    orientation: 'عمودي',
    fileSizeFormatted: formatFileSize(sizeKB, sizeMB),
    exportAdvice: 'صدّر من Adobe InDesign كـ PDF (File → Export → Adobe PDF) لضمان أفضل نتائج طباعة',
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

    if (basicAnalysis.thumbnailUrl) {
      formData.append("thumbnailDataUrl", basicAnalysis.thumbnailUrl);
    } else if (isImage) {
      formData.append("file", file);
    }

    if (basicAnalysis.extraThumbnails?.length) {
      basicAnalysis.extraThumbnails.forEach((t, idx) => {
        formData.append(`extraThumbnail${idx}`, t);
      });
    }

    const textToSend = basicAnalysis.fullText || basicAnalysis.textPreview || "";
    if (textToSend.trim()) {
      formData.append("textPreview", textToSend.substring(0, 10000));
    }

    if (basicAnalysis.pageCount > 0) {
      formData.append("pageCount", String(basicAnalysis.pageCount));
    }

    formData.append("detectedService", basicAnalysis.detectedService);

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

    if (!basicAnalysis.thumbnailUrl && !isImage) {
      return { vlmAnalysis: null, enhancedAnalysis: basicAnalysis };
    }

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
 */
function mergeAnalyses(basic: RealFileAnalysis, vlm: VLMAnalysis): RealFileAnalysis {
  const LOCAL_HIGH_CONFIDENCE = 88;
  const localIsStrong = basic.confidence >= LOCAL_HIGH_CONFIDENCE;
  const servicesAgree = vlm.suggestedService === basic.detectedService;

  const insights: string[] = [];
  let finalService: ServiceType = basic.detectedService;
  let finalServiceName = basic.detectedServiceName;
  let finalConfidence = vlm.confidence || basic.confidence;

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
    finalServiceName = vlm.suggestedServiceName || basic.detectedServiceName;
    finalConfidence = Math.min(99, Math.max(vlm.confidence || 0, basic.confidence) + 5);
    insights.push(`✅ اتفاق بين التحليل المحلي والذكاء الاصطناعي — ثقة معزّزة (${finalConfidence}%)`);
  } else if (localIsStrong) {
    finalService = basic.detectedService;
    finalServiceName = basic.detectedServiceName;
    finalConfidence = basic.confidence;
    insights.push(
      `⚠️ اختلاف تصنيف: التحليل المحلي رجّح "${basic.detectedServiceName}" من نص الملف الفعلي (ثقة ${basic.confidence}%), ` +
        `بينما اقترح الذكاء الاصطناعي "${vlm.suggestedServiceName}" — تم الاعتماد على النص الفعلي كمصدر أدق. يمكنك تغيير الخدمة يدوياً إن لزم.`,
    );
  } else {
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
