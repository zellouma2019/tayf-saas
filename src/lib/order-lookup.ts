/**
 * أدوات بحث الطلبات مع دعم الطلبات القديمة (shopId=null)
 * والفلترة متعددة المتاجر
 */

/**
 * ترتيب بحث طلب واحد مع دعم الطلبات القديمة (shopId=null)
 * يُستخدم في: invoice, file, preview, thumbnail, GET/PUT/DELETE by ID
 */
export function orderFindWhere(id: string, shopId: string | null): Record<string, unknown> {
  if (shopId) {
    return {
      id,
      OR: [
        { shopId },
        { shopId: null },
      ],
    };
  }
  return { id };
}

/**
 * ترتيب بحث قائمة الطلبات مع دعم الطلبات القديمة
 * يضمن أن شرط shopId يُدمج بـ AND مع شروط البحث الأخرى (لا OR)
 *
 * مثال: shopId + search → WHERE (ref LIKE '%q%' OR cust LIKE '%q%') AND (shopId='x' OR shopId IS NULL)
 */
export function orderListWhere(shopId: string | null, extraWhere?: Record<string, unknown>): Record<string, unknown> {
  if (!shopId) return { ...extraWhere };

  const where: Record<string, unknown> = {};
  const extraOr = (extraWhere?.OR as Array<Record<string, unknown>>) || [];

  // نسخ كل الشروط ما عدا OR إلى المستوى الأعلى (AND ضمنياً)
  for (const [k, v] of Object.entries(extraWhere || {})) {
    if (k !== "OR") where[k] = v;
  }

  if (extraOr.length > 0) {
    // يوجد شرط OR للبحث + شرط shopId → يجب أن يكونا AND معاً
    where.AND = [
      { OR: extraOr },
      { OR: [{ shopId }, { shopId: null }] },
    ];
  } else {
    // لا يوجد شرط بحث، فقط shopId
    where.OR = [{ shopId }, { shopId: null }];
  }

  return where;
}