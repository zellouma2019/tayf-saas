import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

/* ───────────── System Prompt ───────────── */

const SYSTEM_PROMPT = `أنت "طيف"، مساعد ذكي لمنصة إدارة المطابع. تتحدث بالعربية الفصحى. هدفك مساعدة الزبائن في معرفة الخدمات وإرشادهم.

━━━━━━ معلومات عامة ━━━━━━

• الخدمات: طباعة مستندات، طباعة صور، تجليد، نسخ مستندات، بطاقات، ملصقات
• الخصومات: 10 نسخ فأكثر خصم 10%، 50 نسخة فأكثر خصم 15%
• طباعة وجهين: توفير 50% على الورق
• الملفات المقبولة: PDF, DOCX, JPG, PNG, WEBP (حد أقصى 50 ميجابايت)
• الأسعار تختلف حسب المتجر — لا تعطِ أرقاماً محددة إلا إذا وردت في سياق المحادثة

━━━━━━ معلومات المتجر ━━━━━━
• العنوان والهاتف والبريد: يُحدد من إعدادات المتجر
• أوقات العمل والدفع: يُحدد من إعدادات المتجر

━━━━━━ قواعد السلوك ━━━━━━
1. رُد بالعربية الفصحى الواضحة
2. كُن ودياً ومُساعداً ومُختصراً
3. إذا سُئلت عن شيء خارج المطبعة، أعد توجيه الزبون بلُطفى
4. اقترح خدمات مناسبة بناءً على وصف الزبون
5. لا تختلق أسعاراً ليست في قاعدة المعرفة
6. استخدم الإيموجي باعتدال للدّفء
7. حافظ على الردود مُختصرة
8. لا تُخبر الزبون بأنك مساعد ذكاء اصطناعي`;

/* ───────────── Types ───────────── */

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface ChatRequestBody {
  message: string;
  history: ChatMessage[];
}

/* ───────────── POST Handler ───────────── */

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, response: "يرجى كتابة رسالة صحيحة 🙏" },
        { status: 400 }
      );
    }

    // Trim history to last 19 user/assistant messages (system + 19 = 20 total)
    const trimmedHistory = history.slice(-19);

    // Build messages array for the SDK
    const messages: Array<{ role: string; content: string }> = [
      { role: "assistant", content: SYSTEM_PROMPT },
      ...trimmedHistory.map((m) => ({
        role: m.role,
        content: m.text,
      })),
      { role: "user", content: message },
    ];

    // Initialize SDK and create chat completion
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: "disabled" },
    });

    const reply =
      completion.choices?.[0]?.message?.content ??
      "عذراً، لم أستطع معالجة طلبك. حاول مرة أخرى من فضلك 🙏";

    return NextResponse.json({ success: true, response: reply });
  } catch (error) {
    console.error("[AI Chat Error]", error);

    return NextResponse.json({
      success: false,
      response:
        "عذراً، حصلت مشكلة تقنية. جرّب مرة أخرى أو تواصل مع المتجر 📞",
    });
  }
}