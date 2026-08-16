"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { AppSettings } from "@/lib/customer/default-settings";
import { DEFAULT_SETTINGS } from "@/lib/customer/default-settings";
import type { ShopData } from "@/lib/shop-context";

interface SettingsCtx {
  settings: AppSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  shopName: string;
  tagline: string;
  shopLogo: string;
  whatsappNumber: string;
  phoneNumber: string;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children, shopData }: { children: ReactNode; shopData?: ShopData | null }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/c/settings");
      if (res.ok) {
        const data = await res.json();
        // Merge with defaults to fill any missing fields
        const merged: AppSettings = {
          services: data.services || DEFAULT_SETTINGS.services,
          deliveryOptions: data.deliveryOptions || DEFAULT_SETTINGS.deliveryOptions,
          general: {
            ...DEFAULT_SETTINGS.general,
            ...data.general,
            pricingRules: {
              ...DEFAULT_SETTINGS.general.pricingRules,
              ...(data.general?.pricingRules || {}),
            },
          },
        };
        setSettings(merged);
      }
    } catch {
      // Keep defaults on error
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const g = settings.general;

  // Override shop-specific fields from ShopProvider context (when inside /s/[slug])
  const shopName = shopData?.name || g.shopName;
  const shopLogo = shopData?.logoUrl || g.shopLogo;
  const whatsappNumber = shopData?.whatsapp || g.whatsappNumber;
  const phoneNumber = shopData?.phone || g.phoneNumber;

  // Build merged settings with shop overrides baked into general
  const mergedSettings: AppSettings = shopData
    ? {
        ...settings,
        general: {
          ...g,
          shopName,
          shopLogo,
          whatsappNumber,
          phoneNumber,
          email: shopData.email || g.email,
          address: shopData.address || g.address,
        },
      }
    : settings;

  const value: SettingsCtx = {
    settings: mergedSettings,
    loading,
    refresh,
    shopName,
    tagline: g.tagline,
    shopLogo,
    whatsappNumber,
    phoneNumber,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
