import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// تهيئة قاعدة البيانات تلقائياً عند أول زيارة
// هذا المسار يُستدعى مرة واحدة فقط بعد النشر على Vercel
export async function POST() {
  try {
    // التحقق من وجود الجداول بالفعل
    try {
      const count = await db.shop.count()
      if (count > 0) {
        return NextResponse.json({
          success: true,
          message: 'قاعدة البيانات مهيأة بالفعل',
          shopCount: count,
        })
      }
    } catch {
      // الجداول غير موجودة، سنقوم بإنشائها
    }

    // إنشاء الجداول باستخدام SQL الخام
    const statements = [
      `CREATE TABLE IF NOT EXISTS "Shop" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "slug" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "adminPin" TEXT NOT NULL,
        "phone" TEXT,
        "whatsapp" TEXT,
        "email" TEXT,
        "address" TEXT,
        "logoUrl" TEXT,
        "logoIcon" TEXT NOT NULL DEFAULT 'Printer',
        "primaryColor" TEXT,
        "themeId" INTEGER NOT NULL DEFAULT 1,
        "country" TEXT NOT NULL DEFAULT 'DZ',
        "language" TEXT NOT NULL DEFAULT 'ar',
        "settings" TEXT,
        "ownerName" TEXT,
        "ownerPhone" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "plan" TEXT NOT NULL DEFAULT 'free',
        "features" TEXT,
        "trialDays" INTEGER,
        "trialStartsAt" DATETIME,
        "ownerNotes" TEXT,
        "paymentInfo" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Shop_slug_key" ON "Shop"("slug")`,
      `CREATE INDEX IF NOT EXISTS "Shop_slug_idx" ON "Shop"("slug")`,
      `CREATE INDEX IF NOT EXISTS "Shop_isActive_idx" ON "Shop"("isActive")`,

      `CREATE TABLE IF NOT EXISTS "PrintOrder" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "reference" TEXT NOT NULL,
        "serviceType" TEXT NOT NULL,
        "serviceName" TEXT NOT NULL,
        "fileName" TEXT,
        "fileType" TEXT,
        "fileSize" INTEGER,
        "fileData" TEXT,
        "smartAnalysis" TEXT,
        "options" TEXT NOT NULL,
        "customer" TEXT NOT NULL,
        "delivery" TEXT NOT NULL,
        "pricing" TEXT NOT NULL,
        "estimatedHours" INTEGER NOT NULL DEFAULT 3,
        "status" TEXT NOT NULL DEFAULT 'pending',
        "pages" INTEGER NOT NULL DEFAULT 1,
        "copies" INTEGER NOT NULL DEFAULT 1,
        "total" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "readyAt" DATETIME,
        "deliveredAt" DATETIME,
        "startedPrintingAt" DATETIME,
        "completedPrintingAt" DATETIME,
        "cost" INTEGER NOT NULL DEFAULT 0,
        "tags" TEXT NOT NULL DEFAULT '[]',
        "adminNotes" TEXT,
        "shopId" TEXT,
        CONSTRAINT "PrintOrder_reference_key" UNIQUE ("reference"),
        CONSTRAINT "PrintOrder_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS "PrintOrder_status_idx" ON "PrintOrder"("status")`,
      `CREATE INDEX IF NOT EXISTS "PrintOrder_createdAt_idx" ON "PrintOrder"("createdAt")`,
      `CREATE INDEX IF NOT EXISTS "PrintOrder_shopId_idx" ON "PrintOrder"("shopId")`,

      `CREATE TABLE IF NOT EXISTS "Setting" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "updatedAt" DATETIME NOT NULL,
        "shopId" TEXT,
        CONSTRAINT "Setting_shopId_key_key" UNIQUE ("shopId", "key"),
        CONSTRAINT "Setting_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )`,

      `CREATE TABLE IF NOT EXISTS "SuperAdmin" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "key" TEXT NOT NULL,
        "password" TEXT NOT NULL DEFAULT 'Admin@2025',
        "teamMembers" TEXT NOT NULL DEFAULT '[]',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "SuperAdmin_key_key" UNIQUE ("key")
      )`,

      `CREATE TABLE IF NOT EXISTS "Expense" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "shopId" TEXT,
        "category" TEXT NOT NULL,
        "amount" INTEGER NOT NULL,
        "description" TEXT,
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "Expense_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS "Expense_shopId_idx" ON "Expense"("shopId")`,
      `CREATE INDEX IF NOT EXISTS "Expense_category_idx" ON "Expense"("category")`,
      `CREATE INDEX IF NOT EXISTS "Expense_date_idx" ON "Expense"("date")`,

      `CREATE TABLE IF NOT EXISTS "Customer" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "shopId" TEXT,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "email" TEXT,
        "address" TEXT,
        "notes" TEXT,
        "totalOrders" INTEGER NOT NULL DEFAULT 0,
        "totalSpent" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "Customer_shopId_phone_key" UNIQUE ("shopId", "phone"),
        CONSTRAINT "Customer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS "Customer_shopId_idx" ON "Customer"("shopId")`,
      `CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone")`,

      `CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "shopId" TEXT,
        "orderId" TEXT,
        "action" TEXT NOT NULL,
        "field" TEXT,
        "oldValue" TEXT,
        "newValue" TEXT,
        "details" TEXT,
        "userId" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_shopId_idx" ON "AuditLog"("shopId")`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_orderId_idx" ON "AuditLog"("orderId")`,
      `CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`,

      `CREATE TABLE IF NOT EXISTS "FormTemplate" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "shopId" TEXT,
        "title" TEXT NOT NULL,
        "icon" TEXT NOT NULL DEFAULT 'FileText',
        "category" TEXT NOT NULL DEFAULT 'general',
        "fields" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "FormTemplate_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS "FormTemplate_shopId_idx" ON "FormTemplate"("shopId")`,

      `CREATE TABLE IF NOT EXISTS "FormRecord" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "shopId" TEXT,
        "templateId" TEXT,
        "title" TEXT NOT NULL,
        "data" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "priority" TEXT NOT NULL DEFAULT 'normal',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "FormRecord_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "FormRecord_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS "FormRecord_shopId_idx" ON "FormRecord"("shopId")`,
      `CREATE INDEX IF NOT EXISTS "FormRecord_status_idx" ON "FormRecord"("status")`,
    ]

    for (const sql of statements) {
      try {
        await db.$executeRawUnsafe(sql)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        // تجاهل أخطاء "already exists" - الجدول موجود بالفعل
        if (!msg.includes('already exists') && !msg.includes('duplicate')) {
          console.error('Schema error:', msg)
        }
      }
    }

    // إنشاء حساب المدير الأول
    try {
      await db.superAdmin.create({
        data: {
          key: 'main',
          password: 'Admin@2025',
        },
      })
    } catch {
      // المدير موجود بالفعل
    }

    return NextResponse.json({
      success: true,
      message: 'تم تهيئة قاعدة البيانات بنجاح ✓',
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      success: false,
      message: 'فشل تهيئة قاعدة البيانات',
      error: msg,
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const shopCount = await db.shop.count()
    return NextResponse.json({
      initialized: true,
      shopCount,
    })
  } catch {
    return NextResponse.json({
      initialized: false,
      message: 'قاعدة البيانات غير مهيأة - قم بزيارة /api/setup (POST)',
    })
  }
}