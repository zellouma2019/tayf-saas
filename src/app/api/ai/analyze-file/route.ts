import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// السماح بوقت أطول لمعالجة الملفات الكبيرة بالذكاء الاصطناعي (حتى 60 ثانية)
export const maxDuration = 60;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function buildAnalysisPrompt(fileType: string, pageCount?: number, textPreview?: string): string {
  let contextInfo = '';
  
  if (fileType === 'PDF' && pageCount) {
    contextInfo = `\n\nمعلومات أساسية عن الملف:\n- نوع الملف: PDF\n- عدد الصفحات الفعلي: ${pageCount} صفحة\n${pageCount > 1 ? `- هذا مستند متعدد الصفحات يحتوي على ${pageCount} صفحة حقيقية` : '- هذا مستند من صفحة واحدة'}\n`;
    
    if (textPreview && textPreview.trim().length > 0) {
      const truncated = textPreview.length > 3000 ? textPreview.substring(0, 3000) + '\n...(باقي النص مقطوع)' : textPreview;
      contextInfo += `\nالنص المستخرج من الملف:\n"""\n${truncated}\n"""\n`;
    }
  } else if (IMAGE_EXTENSIONS.some(ext => fileType.toLowerCase().includes(ext))) {
    contextInfo = '\nمعلومات أساسية: هذا ملف صورة (ليس PDF). حلّل محتوى الصورة بدقة.';
  }

  return `أنت خبير متخصص في تحليل الملفات المرفوعة لخدمات الطباعة. مهمتك هي تحليل المحتوى المرفق بدقة تامة وتقديم توصيات احترافية.

${contextInfo}
أجب بـ JSON فقط (بدون markdown، بدون نص إضافي، بدون \\[code\\]) وباللغة العربية.

يجب أن يتضمن الرد الحقول التالية بالضبط:
- "documentType": نوع المستند/الصورة بالعربية (مثل: سيرة ذاتية، تقرير، فاتورة، بطاقة، ملصق، صورة شخصية، صورة فنية، كتيب، عقد، شهادة، إيصال، استمارة، عرض تقديمي، كتاب، أطروحة، دعوة، بطاقة عمل، أخرى)
- "description": وصف تفصيلي للمحتوى بالعربية (2-3 جمل على الأقل — صف ما تراه بالضبط: النصوص، الجداول، الصور، الأشكال، التخطيط)
- "pageCount": العدد الفعلي للصفحات (رقم)${pageCount ? ` — الملف يحتوي فعلاً على ${pageCount} صفحة، استخدم هذا الرقم` : ''}
- "qualityAssessment": تقييم الجودة - أحد: "جودة ممتازة" أو "جيدة" أو "متوسطة" أو "منخفضة"
- "qualityReason": سبب تفصيلي لتقييم الجودة بالعربية (جملة واحدة)
- "suggestedService": الخدمة الأنسب - أحد: "document" أو "photo" أو "binding" أو "copy" أو "card" أو "poster"
- "suggestedServiceName": اسم الخدمة بالعربية
- "suggestedColor": "bw" أو "color"
- "suggestedPaperSize": "A4" أو "A3" أو "A5" أو "A2" أو "Legal"
- "suggestedPaperType": نوع الورق المقترح بالعربية (مثل: عادي، مقوّى 250غ، لامع، مصقول، فاخر)
- "suggestedBinding": نوع التجليد - أحد: "none" أو "spiral" أو "glue" أو "hardcover" أو "staple"
- "confidence": رقم من 0 إلى 100 يمثل ثقتك في التحليل
- "insights": مصفوفة تحتوي 3 إلى 5 نصائح تفصيلية وقصيرة بالعربية حول الطباعة المثلى

مثال على الرد المتوقع لمستند PDF من 30 صفحة:
{"documentType":"تقرير مالي","description":"تقرير مالي سنوي يتضمن جداول بيانية متعددة، رسوم بيانية، وملاحظات تفصيلية. يحتوي على غلاف وعناوين فصول","pageCount":30,"qualityAssessment":"جيدة","qualityReason":"التنسيق منظم والجداول واضحة لكن بعض الرسوم البيانية قد تحتاج ألوان","suggestedService":"document","suggestedServiceName":"طباعة مستند (تقرير)","suggestedColor":"color","suggestedPaperSize":"A4","suggestedPaperType":"مقوّى 250غ","suggestedBinding":"spiral","confidence":91,"insights":["تقرير 30 صفحة — ورق مقوّى 250غ يناسب الملفات المهنية","تجليد لولبي مقترح لسهولة التصفح","يحتوي رسوم بيانية — طباعة ملونة أنسب","غلاف أمامي مقترح"]}

أجب بـ JSON فقط.`;
}

function isImageFile(fileName: string): boolean {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTENSIONS.includes(ext);
}

function buildImageContext(imageDataUrl: string, fileType: string, textPreview?: string, pageCount?: number): Array<{ type: string; text?: string; image_url?: { url: string } }> {
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: buildAnalysisPrompt(fileType, pageCount, textPreview) },
    { type: 'image_url', image_url: { url: imageDataUrl } },
  ];

  return content;
}

function parseVLMResponse(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  // Strategy 1: Direct parse
  try { return JSON.parse(cleaned); } catch {}

  // Strategy 2: Extract between first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1)); } catch {}
  }

  // Strategy 3: Fix common JSON issues
  try {
    const fixed = cleaned.replace(/"}\s*"$/, '}]').replace(/"\s*}$/, '}');
    return JSON.parse(fixed);
  } catch {}

  throw new Error('تعذّر تحليل رد النموذج كـ JSON');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const fileName = (formData.get('fileName') as string) || '';
    const fileType = (formData.get('fileType') as string) || '';
    const pageCount = formData.get('pageCount') ? Number(formData.get('pageCount')) : undefined;
    const textPreview = (formData.get('textPreview') as string) || '';
    const thumbnailDataUrl = (formData.get('thumbnailDataUrl') as string) || '';

    let imageDataUrl: string | null = null;
    let isImage = false;

    if (file && isImageFile(file.name || fileName)) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const mime = file.type || `image/${(file.name || fileName).split('.').pop()?.toLowerCase()}`;
      imageDataUrl = `data:${mime};base64,${base64}`;
      isImage = true;
    } else if (thumbnailDataUrl) {
      imageDataUrl = thumbnailDataUrl;
    }

    if (!imageDataUrl) {
      return NextResponse.json(
        { success: false, analysis: null, error: 'لم يتم توفير صورة أو معاينة للتحليل' },
        { status: 400 },
      );
    }

    const messageContent = buildImageContext(imageDataUrl, fileType, textPreview, pageCount);

    const zai = await ZAI.create();
    const response = await zai.chat.completions.createVision({
      messages: [{ role: 'user', content: messageContent }],
      thinking: { type: 'disabled' },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json({ success: false, analysis: null, error: 'لم يتم الحصول على رد من نموذج التحليل' });
    }

    let analysis;
    try {
      analysis = parseVLMResponse(rawContent);
    } catch {
      console.error('[analyze-file] Failed to parse VLM response:', rawContent.substring(0, 500));
      return NextResponse.json({ success: false, analysis: null, error: 'فشل في تحليل رد النموذج' });
    }

    // Ensure pageCount from client-side analysis is preserved
    if (pageCount && (!analysis.pageCount || analysis.pageCount === 1)) {
      analysis.pageCount = pageCount;
    }

    // Validate confidence
    if (typeof analysis.confidence !== 'number') analysis.confidence = 50;
    analysis.confidence = Math.min(100, Math.max(0, Math.round(analysis.confidence)));

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('[analyze-file] Error:', error);
    return NextResponse.json(
      { success: false, analysis: null, error: error instanceof Error ? error.message : 'حدث خطأ أثناء التحليل' },
      { status: 500 },
    );
  }
}
