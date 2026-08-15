import { create } from "zustand";
import type { PrintOrderLite } from "@/lib/order-types";
import type { CreatedOrder } from "@/components/app/app-shell";

type View = "new" | "repeat" | "track" | "admin";

interface AppState {
  // التنقل
  view: View;
  setView: (v: View) => void;

  // طلب جديد
  createdOrder: CreatedOrder | null;
  setCreatedOrder: (o: CreatedOrder | null) => void;

  // تكرار طلب
  prefillOrder: PrintOrderLite | null;
  setPrefillOrder: (o: PrintOrderLite | null) => void;

  // ملف جديد اختياري عند تكرار الطلب
  pendingFile: File | null;
  setPendingFile: (f: File | null) => void;

  // الإدارة
  adminUnlocked: boolean;
  setAdminUnlocked: (v: boolean) => void;
  adminGateOpen: boolean;
  setAdminGateOpen: (v: boolean) => void;
  adminCode: string;
  setAdminCode: (v: string) => void;

  // تحديث البيانات
  refreshKey: number;
  incrementRefresh: () => void;

  // المقدمة
  showIntro: boolean;
  setShowIntro: (v: boolean) => void;

  // فتح المساعد الذكي من خارج المكون
  assistantOpen: boolean;
  setAssistantOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "new",
  setView: (v) => set({ view: v }),

  createdOrder: null,
  setCreatedOrder: (o) => set({ createdOrder: o }),

  prefillOrder: null,
  setPrefillOrder: (o) => set({ prefillOrder: o }),

  pendingFile: null,
  setPendingFile: (f) => set({ pendingFile: f }),

  adminUnlocked: false,
  setAdminUnlocked: (v) => set({ adminUnlocked: v }),
  adminGateOpen: false,
  setAdminGateOpen: (v) => set({ adminGateOpen: v }),
  adminCode: "",
  setAdminCode: (v) => set({ adminCode: v }),

  refreshKey: 0,
  incrementRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),

  showIntro: true,
  setShowIntro: (v) => set({ showIntro: v }),

  assistantOpen: false,
  setAssistantOpen: (v) => set({ assistantOpen: v }),
}));