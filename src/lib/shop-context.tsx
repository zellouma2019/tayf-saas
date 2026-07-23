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
  customCurrency: string | null;
}

interface ShopContextValue {
  shop: ShopData | null;
  loading: boolean;
  error: string | null;
  /** ميزات المتجر المحلّلة */
  parsedFeatures: ShopFeatures;
  /** هل ميزة معينة مفعّلة؟ */
  hasFeature: (key: string) => boolean;
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
  hasFeature: () => false as boolean,
  isPaid: false,
  isTrial: false,
  trialDaysLeft: null,
  refreshShop: async () => {},
});

export function useShop() {
  return useContext(ShopContext);
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

  const fetchShop = useCallback((currentSlug: string) => {
    return fetch(`/api/shops/${encodeURIComponent(currentSlug)}`)
      .then((r) => {
        if (!r.ok) throw new Error("المتجر غير موجود");
        return r.json();
      })
      .then((d) => {
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
    await fetchShop(slugRef.current);
  }, [fetchShop]);

  const shopPlan = state.shop?.plan || "free";
  // دعم كل قيم الخطة المدفوعة: paid, pro, premium
  const isPaid = shopPlan === "paid" || shopPlan === "pro" || shopPlan === "premium";
  const parsedFeatures = parseFeatures(state.shop?.features, isPaid ? "paid" : shopPlan);

  // حساب أيام التجربة المتبقية
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

  const hasFeature = (key: string) => {
    // في الخطة المدفوعة: كل الميزات مفعّلة حتى لو لم تكن معرّفة بعد
    if (isPaid) return true;
    return isFeatureEnabled(parsedFeatures, key as FeatureKey);
  };

  return (
    <ShopContext.Provider value={{ ...state, parsedFeatures, hasFeature, isPaid, isTrial, trialDaysLeft, refreshShop }}>
      {children}
    </ShopContext.Provider>
  );
}