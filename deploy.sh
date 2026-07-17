#!/bin/bash
# ═══════════════════════════════════════════════════════════
# سكريبت تهيئة طيف (Tayf) — النشر على Vercel + Turso
# ═══════════════════════════════════════════════════════════
set -e

echo "╔══════════════════════════════════════════════════╗"
echo "║     طيف (Tayf) — سكريبت النشر السريع           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ─── الخطوة 1: تثبيت الأدوات ─────────────────────────
echo "📋 الخطوة 1/3: تثبيت الأدوات اللازمة..."

if ! command -v turso &> /dev/null; then
    echo "   ⬇️  تثبيت Turso CLI..."
    curl -sL https://get.tur.so/install.sh | bash
    export PATH="$HOME/.turso:$PATH"
fi

if ! command -v vercel &> /dev/null; then
    echo "   ⬇️  تثبيت Vercel CLI..."
    npm i -g vercel
fi

echo "   ✅ الأدوات جاهزة"
echo ""

# ─── الخطوة 2: إعداد Turso ────────────────────────────
echo "📋 الخطوة 2/3: إعداد قاعدة بيانات Turso (9 جيجا مجاناً)..."

# تسجيل الدخول
export PATH="$HOME/.turso:$PATH"
if ! turso auth whoami &> /dev/null; then
    echo "   🔑 يرجى تسجيل الدخول إلى Turso..."
    turso auth login
fi

# إنشاء قاعدة البيانات
DB_NAME="tayf-db"
if turso db show "$DB_NAME" &> /dev/null; then
    echo "   ✅ قاعدة البيانات '$DB_NAME' موجودة بالفعل"
else
    echo "   🗄️  إنشاء قاعدة البيانات '$DB_NAME'..."
    turso db create "$DB_NAME" --region eu-west-1
    echo "   ✅ تم إنشاء قاعدة البيانات"
fi

# الحصول على بيانات الاتصال
TURSO_URL=$(turso db show "$DB_NAME" --url)
TURSO_TOKEN=$(turso db tokens create "$DB_NAME" --expiration never 2>/dev/null || turso auth api-tokens mint --database "$DB_NAME" --expiration "never")

echo "   📎 رابط الاتصال: $TURSO_URL"
echo "   📎 الرمز: ${TURSO_TOKEN:0:20}..."
echo ""

# ─── الخطوة 3: النشر على Vercel ──────────────────────
echo "📋 الخطوة 3/3: النشر على Vercel..."

# ربط المشروع بـ Vercel
echo "   🔗 ربط المشروع..."
vercel link --yes

# إعداد متغيرات البيئة
echo "   🔧 إعداد متغيرات البيئة..."
echo "$TURSO_URL" | vercel env add TURSO_DATABASE_URL production
echo "$TURSO_TOKEN" | vercel env add TURSO_AUTH_TOKEN production

# النشر
echo "   🚀 جارٍ النشر..."
vercel deploy --prod --yes

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     ✅ تم النشر بنجاح!                         ║"
echo "║                                                ║"
echo "║  كلمة مرور المدير: Admin@2025                  ║"
echo "║  افتح الموقع وقاعدة البيانات ستُهيّأ تلقائياً  ║"
echo "╚══════════════════════════════════════════════════╝"