import { create } from "zustand";

export interface CreatedOrder {
  id: string;
  reference: string;
  serviceName: string;
  total: number;
  status: string;
  estimatedHours: number;
  editableUntil?: string;
}

export interface PrintOrderLite {
  id: string;
  reference: string;
  serviceName: string;
  serviceType: string;
  fileName: string;
  fileType: string;
  total: number;
  status: string;
  pages: number;
  copies: number;
  customerName: string;
  customerPhone: string;
  createdAt: string;
}

interface AppState {
  // تحديث البيانات
  refreshKey: number;
  incrementRefresh: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  refreshKey: 0,
  incrementRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}));
