"use client";

import { useState } from "react";
import { Package, Truck, MapPin, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTimeAgo } from "@/lib/admin-utils";

type ShipmentStatus = "in_transit" | "delivered" | "waiting" | "returned";

interface Shipment {
  id: string;
  trackingNumber: string;
  customerName: string;
  destinationCity: string;
  status: ShipmentStatus;
  step: number;
  lastUpdate: string;
  itemCount: number;
}

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string; bg: string; ring: string }> = {
  in_transit: { label: "قيد التوصيل", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40", ring: "ring-amber-400/30" },
  delivered: { label: "تم التسليم", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", ring: "ring-emerald-400/30" },
  waiting: { label: "في الانتظار", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/40", ring: "ring-slate-400/30" },
  returned: { label: "مُرجع", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50 dark:bg-rose-950/40", ring: "ring-rose-400/30" },
};

const STEP_ICONS = [Package, Truck, CheckCircle2];
const STEP_LABELS = ["تم الاستلام", "قيد الطباعة", "تم التسليم"];

const MOCK_SHIPMENTS: Shipment[] = [
  { id: "s1", trackingNumber: "TAYF-2025-9101", customerName: "أحمد بن سعيد", destinationCity: "الجزائر العاصمة", status: "delivered", step: 3, lastUpdate: "2025-01-14T10:30:00", itemCount: 250 },
  { id: "s2", trackingNumber: "TAYF-2025-9102", customerName: "فاطمة زهراء بوزيان", destinationCity: "وهران", status: "in_transit", step: 2, lastUpdate: "2025-01-14T08:15:00", itemCount: 120 },
  { id: "s3", trackingNumber: "TAYF-2025-9103", customerName: "محمد أمين خليفي", destinationCity: "قسنطينة", status: "waiting", step: 1, lastUpdate: "2025-01-14T07:00:00", itemCount: 80 },
  { id: "s4", trackingNumber: "TAYF-2025-9104", customerName: "سارة بلقاسم لعرابي", destinationCity: "عنابة", status: "in_transit", step: 2, lastUpdate: "2025-01-13T16:45:00", itemCount: 500 },
  { id: "s5", trackingNumber: "TAYF-2025-9105", customerName: "يوسف مراد حمادي", destinationCity: "باتنة", status: "returned", step: 2, lastUpdate: "2025-01-13T14:20:00", itemCount: 45 },
];

export function ShippingTrackerWidget() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalShipments = MOCK_SHIPMENTS.length;
  const deliveredCount = MOCK_SHIPMENTS.filter((s) => s.status === "delivered").length;
  const successRate = Math.round((deliveredCount / totalShipments) * 100);
  const inTransitCount = MOCK_SHIPMENTS.filter((s) => s.status === "in_transit").length;

  return (
    <Card className="rounded-xl border border-border/50 overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            متتبع الشحنات
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5">
            {totalShipments} شحنة
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 p-2.5 text-center">
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totalShipments}</p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">إجمالي الشحنات</p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 p-2.5 text-center">
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{successRate}%</p>
            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">نسبة التسليم الناجح</p>
          </div>
          <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200/50 dark:border-sky-800/30 p-2.5 text-center">
            <p className="text-lg font-bold text-sky-700 dark:text-sky-300">{inTransitCount}</p>
            <p className="text-[10px] text-sky-600/70 dark:text-sky-400/70">قيد التوصيل</p>
          </div>
        </div>

        {/* Shipments List */}
        <div className="space-y-2 max-h-[340px] overflow-y-auto">
          {MOCK_SHIPMENTS.map((shipment) => {
            const cfg = STATUS_CONFIG[shipment.status];
            const isExpanded = selectedId === shipment.id;
            return (
              <div
                key={shipment.id}
                onClick={() => setSelectedId(isExpanded ? null : shipment.id)}
                className={`rounded-xl border p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  isExpanded ? `${cfg.bg} ${cfg.ring} ring-1 shadow-sm` : "bg-card border-border/50 hover:bg-muted/50"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                      {shipment.status === "delivered" ? (
                        <CheckCircle2 className={`h-3.5 w-3.5 ${cfg.color}`} />
                      ) : shipment.status === "in_transit" ? (
                        <Truck className={`h-3.5 w-3.5 ${cfg.color}`} />
                      ) : shipment.status === "returned" ? (
                        <Package className={`h-3.5 w-3.5 ${cfg.color}`} />
                      ) : (
                        <Clock className={`h-3.5 w-3.5 ${cfg.color}`} />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold font-mono">{shipment.trackingNumber}</p>
                      <p className="text-[10px] text-muted-foreground">{shipment.customerName}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-medium ${cfg.color} ${cfg.bg} border-0`}>
                    {cfg.label}
                  </Badge>
                </div>

                {/* Info Row */}
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {shipment.destinationCity}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                    <Package className="h-3 w-3" />
                    {shipment.itemCount} نسخة
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                    <Clock className="h-3 w-3" />
                    {getTimeAgo(shipment.lastUpdate)}
                  </div>
                </div>

                {/* Mini Timeline */}
                <div className="flex items-center gap-0">
                  {STEP_LABELS.map((label, idx) => {
                    const stepNum = idx + 1;
                    const isCompleted = shipment.status === "returned" ? stepNum < shipment.step : stepNum <= shipment.step;
                    const isCurrent = stepNum === shipment.step;
                    const StepIcon = STEP_ICONS[idx];
                    return (
                      <div key={idx} className="flex-1 flex items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isCompleted && shipment.status !== "returned"
                                ? "bg-emerald-500 text-white scale-100"
                                : shipment.status === "returned" && isCompleted
                                ? "bg-rose-500 text-white scale-100"
                                : isCurrent
                                ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                                : "bg-muted text-muted-foreground/50 scale-90"
                            }`}
                          >
                            <StepIcon className="h-2.5 w-2.5" />
                          </div>
                          <span className={`text-[8px] mt-0.5 whitespace-nowrap transition-colors duration-200 ${isCurrent ? "font-bold text-foreground" : "text-muted-foreground/60"}`}>
                            {label}
                          </span>
                        </div>
                        {idx < STEP_LABELS.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 -mt-[10px] transition-all duration-300 ${
                            stepNum < shipment.step
                              ? shipment.status === "returned" ? "bg-rose-300" : "bg-emerald-400"
                              : "bg-border"
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
