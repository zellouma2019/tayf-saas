// ===== أنواع الإدارة العامة =====

export interface ShopItem {
  id: string; slug: string; name: string; phone: string | null;
  ownerName: string | null; ownerPhone: string | null;
  isActive: boolean; createdAt: string;
  _count: { orders: number };
}

export interface ShopStat {
  id: string; name: string; slug: string; ownerName: string | null;
  ownerPhone: string | null; phone: string | null; isActive: boolean;
  whatsapp: string | null; email: string | null; address: string | null;
  primaryColor: string | null; adminPin: string;
  trialDays: number | null; trialStartsAt: string | null;
  plan: string; features: string | null;
  paymentInfo: string | null; ownerNotes: string | null; country: string | null; language: string | null;
  orders: number; revenue: number; todayOrders: number;
  recentOrders: { id: string; reference: string; serviceName: string;
    status: string; total: number; customer: { name: string; phone: string };
    createdAt: string }[];
}

export interface GlobalOrder {
  id: string; reference: string; serviceType: string; serviceName: string;
  status: string; total: number; pages: number; copies: number;
  customer: { name: string; phone: string };
  delivery: { method: string };
  createdAt: string; shopName: string; shopSlug: string; shopId?: string;
}

export interface GlobalStats {
  totalOrders: number; totalRevenue: number; todayOrders: number;
  shopCount: number; activeShopCount: number;
  statusCounts: Record<string, number>;
  shopStats: ShopStat[];
  recentOrders: GlobalOrder[];
}

export interface TeamMember {
  email: string;
  name: string;
  role: string;
  addedAt: string;
}