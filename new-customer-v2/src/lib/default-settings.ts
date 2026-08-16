// الإعدادات الافتراضية للنظام - تُستخدم عند أول تشغيل
import { SPEC_LIST } from "@/lib/service-specs";
import { DELIVERY_OPTIONS } from "@/lib/print-config";

export interface WorkHoursConfig {
  startHour: number; // 8
  endHour: number;   // 19
  daysOff: number[]; // [5, 6] = Friday=5, Saturday=6 (0=Sunday)
  urgentBaseSurcharge: number; // base surcharge for urgent (100)
  urgentPerPageRate: number; // additional per page for urgent (0.5)
}

export interface DeliveryPoint {
  id: string;
  name: string;
  address: string;
  price: number; // ر.س
  emoji?: string;
  lat?: number;
  lng?: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  radiusKm: number;
  price: number;
  estimatedHours: number;
  emoji: string;
  centerLat: number;
  centerLng: number;
}

export const SAUDI_CITIES = [
  { id: "riyadh", name: "الرياض", lat: 24.7136, lng: 46.6753, deliveryPrice: 15, estimatedHours: 3 },
  { id: "jeddah", name: "جدة", lat: 21.5433, lng: 39.1728, deliveryPrice: 15, estimatedHours: 3 },
  { id: "dammam", name: "الدمام", lat: 26.3927, lng: 49.9777, deliveryPrice: 15, estimatedHours: 3 },
  { id: "makkah", name: "مكة المكرمة", lat: 21.3891, lng: 39.8579, deliveryPrice: 20, estimatedHours: 6 },
  { id: "madinah", name: "المدينة المنورة", lat: 24.5247, lng: 39.5692, deliveryPrice: 20, estimatedHours: 6 },
  { id: "taif", name: "الطائف", lat: 21.4395, lng: 40.4983, deliveryPrice: 25, estimatedHours: 8 },
  { id: "tabuk", name: "تبوك", lat: 28.3838, lng: 36.5585, deliveryPrice: 35, estimatedHours: 24 },
  { id: "abha", name: "أبها", lat: 18.2164, lng: 42.5053, deliveryPrice: 35, estimatedHours: 24 },
  { id: "buraidah", name: "بريدة", lat: 26.3359, lng: 43.9659, deliveryPrice: 30, estimatedHours: 12 },
  { id: "najran", name: "نجران", lat: 17.4925, lng: 44.1276, deliveryPrice: 40, estimatedHours: 24 },
  { id: "jazan", name: "جازان", lat: 16.8894, lng: 42.5695, deliveryPrice: 40, estimatedHours: 24 },
  { id: "hail", name: "حائل", lat: 27.5364, lng: 41.6950, deliveryPrice: 35, estimatedHours: 24 },
  { id: "qassim", name: "القصيم", lat: 26.1073, lng: 43.9475, deliveryPrice: 30, estimatedHours: 12 },
  { id: "yanbu", name: "ينبع", lat: 24.0866, lng: 38.0612, deliveryPrice: 30, estimatedHours: 12 },
  { id: "khobar", name: "الخبر", lat: 26.2172, lng: 50.1971, deliveryPrice: 15, estimatedHours: 3 },
] as const;

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "riyadh-center",
    name: "داخل المدينة",
    radiusKm: 15,
    price: 15,
    estimatedHours: 3,
    emoji: "🏙️",
    centerLat: 24.7136,
    centerLng: 46.6753,
  },
  {
    id: "riyadh-suburbs",
    name: "ضواحي المدينة",
    radiusKm: 50,
    price: 25,
    estimatedHours: 6,
    emoji: "🏘️",
    centerLat: 24.7136,
    centerLng: 46.6753,
  },
  {
    id: "saudi-other",
    name: "مدن أخرى",
    radiusKm: 0,
    price: 0,
    estimatedHours: 48,
    emoji: "🇸🇦",
    centerLat: 24.7136,
    centerLng: 46.6753,
  },
];

export interface PricingRules {
  bwCostPerPage: number;
  colorCostPerPage: number;
  paperSurcharge: Record<string, number>;
  bindingCosts: Record<string, number>;
  clearCoverCost: number;
  duplexPerPageRate: number;
  vatRate: number;
}

export const DEFAULT_PRICING_RULES: PricingRules = {
  bwCostPerPage: 0.08,
  colorCostPerPage: 0.25,
  paperSurcharge: { "80gsm": 1.0, "100gsm": 1.15, "120gsm": 1.3 },
  bindingCosts: { perfect: 5.0, spiral: 3.0, brochure: 2.0, staple: 1.0, none: 0 },
  clearCoverCost: 2.0,
  duplexPerPageRate: 0.02,
  vatRate: 0.15,
};

export interface AppSettings {
  services: typeof SPEC_LIST;
  deliveryOptions: typeof DELIVERY_OPTIONS;
  general: {
    shopName: string;
    shopLogo: string;
    tagline: string;
    pricingRules: PricingRules;
    quantityDiscount10: number;
    quantityDiscount50: number;
    sidesDiscount: number;
    minOrder: number;
    whatsappNumber: string;
    phoneNumber: string;
    email: string;
    address: string;
    workHours: string;
    adminCode: string;
    autoDeleteDays: number;
    workHoursConfig: WorkHoursConfig;
    deliveryPoints: DeliveryPoint[];
    deliveryZones: DeliveryZone[];
    googleMapsKey: string;
    deliveryPrice: number;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  services: SPEC_LIST,
  deliveryOptions: DELIVERY_OPTIONS,
  general: {
    shopName: "مطبعة الذكي",
    shopLogo: "",
    tagline: "الطباعة تبدأ قبل وصولك",
    pricingRules: DEFAULT_PRICING_RULES,
    quantityDiscount10: 10,
    quantityDiscount50: 15,
    sidesDiscount: 50,
    minOrder: 1,
    whatsappNumber: "0500000000",
    phoneNumber: "0500000000",
    email: "info@matbaa-dhaki.sa",
    address: "حي العليا، شارع الأمير محمد بن عبدالعزيز، الرياض",
    workHours: "الأحد - الخميس: 10:00 ص — 11:00 م | الجمعة - السبت: 4:00 م — 11:00 م",
    adminCode: "2514",
    autoDeleteDays: 10,
    workHoursConfig: {
      startHour: 10,
      endHour: 23,
      daysOff: [5, 6],
      urgentBaseSurcharge: 10,
      urgentPerPageRate: 0.05,
    },
    deliveryPoints: [
      { id: "shop", name: "مكتبة الذكي — الرياض", address: "حي العليا، شارع الأمير محمد بن عبدالعزيز، بجوار برج الفيصلية", price: 0, emoji: "🏪", lat: 24.6877, lng: 46.7219 },
    ],
    deliveryZones: DEFAULT_DELIVERY_ZONES,
    googleMapsKey: "",
    deliveryPrice: 15,
  },
};
