"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Repeat } from "lucide-react";

export function CustomerStatsWidget() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          إحصائيات العملاء
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <UserPlus className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-lg font-bold tabular-nums">—</p>
            <p className="text-[10px] text-muted-foreground">جدد</p>
          </div>
          <div className="text-center">
            <Repeat className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold tabular-nums">—</p>
            <p className="text-[10px] text-muted-foreground">عائد</p>
          </div>
          <div className="text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-lg font-bold tabular-nums">—</p>
            <p className="text-[10px] text-muted-foreground">إجمالي</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
