"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import {
  type ShopFeatures,
  parseFeatures,
  type FeatureKey,
  isFeatureEnabled,
} from "@/lib/shop-features";

export interface ShopData {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  logoIcon: string;
  primaryColor: string | null;
  themeId: number;
  settings: string | null;
  ownerName: string | null;
  ownerPhone: string | null;
  isActive: boolean;
  plan: string;
  features: string | null;
  createdAt: string;
  trialDays: number | null;
  trialStartsAt: string | null;
  country: string;
  language: string;
}

interface ShopContextValue {
  shop: ShopData | null;
  loading: boolean;
  error: string | null;
  /** ميزات المتجر المحلّلة */
  parsedFeatures: ShopFeatures;
  /** هل ميزة معينة مفعّلة؟ */
  hasFeature: (key: FeatureKey) => boolean;
  /** هل المتجر خطة مدفوعة؟ */
  isPaid: boolean;
  /** هل المتجر في فترة تجربة؟ */
  isTrial: boolean;
  /** أيام متبقية من التجربة (null = بلا حدود) */
  trialDaysLeft: number | null;
  /** إعادة تحميل بيانات المتجر من الخادم */
  refreshShop: () => Promise<void>;
}

const ShopContext = createContext<ShopContextValue>({
  shop: null,
  loading: true,
  error: null,
  parsedFeatures: {},
  hasFeature: () => false,
  isPaid: false,
  isTrial: false,
  trialDaysLeft: null,
  refreshShop: async () => {},
});

export function useShop() {
  return useContext(ShopContext);
}

// ذاكرة تخزين مؤقت في الذاكرة (بقاء خلال حياة التطبيق)
const shopCache = new Map<string, { data: ShopData; timestamp: number }>();
const CACHE_TTL = 30_000; // 30 ثانية

function getCachedShop(slug: string): ShopData | null {
  const entry = shopCache.get(slug);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    shopCache.delete(slug);
    return null;
  }
  return entry.data;
}

function setCachedShop(slug: string, data: ShopData) {
  shopCache.set(slug, { data, timestamp: Date.now() });
}

export function ShopProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<{
    shop: ShopData | null;
    loading: boolean;
    error: string | null;
  }>({ shop: null, loading: true, error: null });

  const slugRef = useRef(slug);

  useEffect(() => {
    slugRef.current = slug;
  }, [slug]);

  const activeRef = useRef(true);

  const fetchShop = useCallback((currentSlug: string, useCache = true) => {
    // تحقق من الذاكرة المؤقتة أولاً
    if (useCache) {
      const cached = getCachedShop(currentSlug);
      if (cached) {
        if (activeRef.current) setState({ shop: cached, loading: false, error: null });
        return Promise.resolve();
      }
    }

    return fetch(`/api/shops/${encodeURIComponent(currentSlug)}`)
      .then((r) => {
        if (!r.ok) throw new Error("المتجر غير موجود");
        return r.json();
      })
      .then((d) => {
        setCachedShop(currentSlug, d.shop);
        if (activeRef.current) setState({ shop: d.shop, loading: false, error: null });
      })
      .catch((e) => {
        if (activeRef.current) setState({ shop: null, loading: false, error: e.message });
      });
  }, []);

  useEffect(() => {
    if (!slug) return;
    activeRef.current = true;
    fetchShop(slug);
    return () => { activeRef.current = false; };
  }, [slug, fetchShop]);

  const refreshShop = useCallback(async () => {
    // تجاوز الذاكرة المؤقتة عند التحديث اليدوي
    shopCache.delete(slugRef.current);
    await fetchShop(slugRef.current, false);
  }, [fetchShop]);

  const parsedFeatures = parseFeatures(state.shop?.features, state.shop?.plan || "free");
  const isPaid = state.shop?.plan === "paid";

  let trialDaysLeft: number | null = null;
  let isTrial = false;
  if (state.shop?.trialDays && state.shop?.trialStartsAt && !isPaid) {
    const start = new Date(state.shop.trialStartsAt);
    const end = new Date(start.getTime() + state.shop.trialDays * 86400000);
    const now = new Date();
    trialDaysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
    isTrial = trialDaysLeft > 0;
    if (trialDaysLeft < 0) trialDaysLeft = 0;
  }

  const hasFeature = (key: FeatureKey) => isFeatureEnabled(parsedFeatures, key);

  return (
    <ShopContext.Provider value={{ ...state, parsedFeatures, hasFeature, isPaid, isTrial, trialDaysLeft, refreshShop }}>
      {children}
    </ShopContext.Provider>
  );
}