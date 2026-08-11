import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function buildAnalysisPrompt(fileType: string, pageCount?: number, textPreview?: string): string {
  let contextInfo = '';
  
  if (fileType === 'PDF' && pageCount) {
    contextInfo = `\n\nمعلومات أساسية عن الملف:\n- نوع الملف: PDF\n- عدد الصفحات الفعلي: ${pageCount} صفحة\n${pageCount > 1 ? `- مستند متعدد الصفحات (${pageCount} صفحة)` : '- مستند من صفحة واحدة'}\n`;
    
    if (textPreview && textPreview.trim().length > 0) {
      const truncated = textPreview.length > 3000 ? textPreview.substring(0, 3000) + '\n...(باقي النص مقطوع)' : textPreview;
      contextInfo += `\nالنص المستخرج:\n"""\n${truncated}\n"""\n`;
    }
  } else if (IMAGE_EXTENSIONS.some(ext => fileType.toLowerCase().includes(ext))) {
    contextInfo = '\nهذا ملف صورة. حلّل محتوى الصورة بدقة شديدة: الموضوع، الألوان، الدقة، الملاءمة للطباعة.';
  }

  return `أنت خبير متقدم ومحترف في خدمات الطباعة ومُحلّل ملفات دقيق. مهمتك تحليل الملف المرفوع وتقديم توصيات طباعة مثالية ومفصّلة.

${contextInfo}
أجب بـ JSON فقط (بدون markdown أو \`\`\`) وباللغة العربية.

الحقول المطلوبة:
- "documentType": نوع المستند بالعربية الدقيقة (سيرة ذاتية، تقرير مالي، فاتورة ضريبية، بطاقة أعمال، ملصق إعلاني، صورة شخصية، صورة فنية، كتيب تعريفي، عقد قانوني، شهادة، إيصال، استمارة، عرض تقديمي، كتاب، أطروحة، دعوة زفاف، بطاقة زيارة، جدول بيانات، محضر اجتماع، رسالة رسمية، أخرى)
- "description": وصف شامل ومفصّل (4-6 جمل — اذكر: نوع المحتوى، وجود جداول/رسوم/صور، التخطيط والتنسيق، الألوان، نوع الخطوط، الغلاف إن وُجد، جودة الصور المدمجة)
- "pageCount": عدد الصفحات${pageCount ? ` (الملف يحتوي ${pageCount} صفحة — استخدم هذا الرقم)` : ''}
- "qualityAssessment": "جودة ممتازة" | "جيدة" | "متوسطة" | "منخفضة"
- "qualityReason": سبب تفصيلي (2-3 جمل — وضوح النصوص، جودة الصور، التنسيق، ملاءمة الملف للطباعة)
- "suggestedService": "document" | "photo" | "binding" | "copy" | "card" | "poster"
- "suggestedServiceName": اسم الخدمة بالعربية
- "suggestedColor": "bw" أو "color"
- "suggestedPaperSize": "A4" | "A3" | "A5" | "A2" | "Legal"
- "suggestedPaperType": نوع الورق بالعربية (عادي 80غ، مقوّى 250غ، مقوّى 300غ، لامع 150غ، مصقول، فاخر، ورق صور فوتو)
- "suggestedBinding": "none" | "spiral" | "glue" | "hardcover" | "staple"
- "confidence": 0-100
- "insights": مصفوفة 5-8 نصائح مهنية مفصّلة ومحددة (كل نصيحة فريدة ومفيدة — اذكر أسباباً محددة لكل توصية)

مثال لمستند PDF 30 صفحة:
{"documentType":"تقرير مالي سنوي","description":"تقرير مالي سنوي يتضمن جدول الأرباح والخسائر في الصفحة الثانية مع أرقام دقيقة، يليه رسوم بيانية دائرية ملونة لنسب الأقسام. الغلاف يحتوي لغو الشركة وعنوان التقرير بالخط العريض. التنسيق منظم مع هوامش متساوية وخطوط واضحة.","pageCount":30,"qualityAssessment":"جيدة","qualityReason":"التنسيق منظم والجداول واضحة والنصوص مقروءة جيداً. الرسوم البيانية الدائرية تحتاج طباعة ملونة لتكون مفهومة.","suggestedService":"document","suggestedServiceName":"طباعة مستند (تقرير مالي)","suggestedColor":"color","suggestedPaperSize":"A4","suggestedPaperType":"مقوّى 250غ","suggestedBinding":"spiral","confidence":93,"insights":["تقرير 30 صفحة — ورق مقوّى 250غ يعطي انطباعاً مهنياً احترافياً","تجليد لولبي يسهّل التصفح السريع للجداول والرسوم البيانية","الرسوم الدائرية تتطلب طباعة ملونة — أبيض وأسود يجعلها غير مفهومة","الغلاف يحتوي لغو — يجب طباعته ملوناً على ورق مصقول","يُنصح بورق أبيض ناصع لتوضوح الأرقام في الجداول","عدد الصفحات كبير — يُفضل فهرس تلقائي في البداية"]}

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

  try { return JSON.parse(cleaned); } catch {}

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1)); } catch {}
  }

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

    if (file && isImageFile(file.name || fileName)) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const mime = file.type || `image/${(file.name || fileName).split('.').pop()?.toLowerCase()}`;
      imageDataUrl = `data:${mime};base64,${base64}`;
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

    if (pageCount && (!analysis.pageCount || analysis.pageCount === 1)) {
      analysis.pageCount = pageCount;
    }

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
