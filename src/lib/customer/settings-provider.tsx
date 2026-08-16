"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { AppSettings } from "@/lib/customer/default-settings";
import { DEFAULT_SETTINGS } from "@/lib/customer/default-settings";

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

export function SettingsProvider({ children }: { children: ReactNode }) {
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
  const value: SettingsCtx = {
    settings,
    loading,
    refresh,
    shopName: g.shopName,
    tagline: g.tagline,
    shopLogo: g.shopLogo,
    whatsappNumber: g.whatsappNumber,
    phoneNumber: g.phoneNumber,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
