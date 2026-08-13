"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

export function TrackPageClient() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12 px-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">صفحة التتبع قيد التطوير</h2>
          <p className="text-sm text-muted-foreground mb-6">
            هذه الصفحة ستكون متاحة قريباً مع النسخة الجديدة
          </p>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            العودة للرئيسية
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
