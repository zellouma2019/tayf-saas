"use client";

import { Suspense, Component, type ReactNode, type ErrorInfo } from "react";
import dynamic from "next/dynamic";
import { ShopProvider, useShop } from "@/lib/shop-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, AlertTriangle, RotateCcw, ShieldCheck } from "lucide-react";

const MerchantDashboard = dynamic(
  () => import("@/components/app/merchant-dashboard").then((m) => ({ default: m.MerchantDashboard })),
  { ssr: false, loading: () => <ShopLoader /> },
);

// ===== Error Boundary =====
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MerchantErrorBoundary extends Component<
  { children: ReactNode; shopSlug: string },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; shopSlug: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[MerchantDashboard] Error caught by boundary:", error);
    console.error("[MerchantDashboard] Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
          <Card className="max-w-lg w-full text-center">
            <CardContent className="py-10">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center mb-5">
                <AlertTriangle className="h-8 w-8 text-rose-500" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-foreground">حدث خطأ في لوحة التحكم</h2>
              <p className="text-sm text-muted-foreground mb-4">
                يرجى المحاولة مرة أخرى أو تحديث الصفحة
              </p>
              {this.state.error && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 mb-4 text-right">
                  <p className="text-xs font-mono text-rose-500 break-all">{this.state.error.message}</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="gap-2 active:scale-[0.97]"
                >
                  <RotateCcw className="h-4 w-4" />
                  إعادة المحاولة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `/s/${this.props.shopSlug}`}
                  className="gap-2"
                >
                  تحديث الصفحة
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

function ShopLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <div className="max-w-md w-full mx-auto p-8 text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
          <ShieldCheck className="w-10 h-10 text-primary/40" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4 mx-auto rounded-lg" />
          <Skeleton className="h-4 w-1/2 mx-auto rounded-lg" />
        </div>
        <p className="text-xs text-muted-foreground animate-pulse">جاري تحميل لوحة التحكم...</p>
      </div>
    </div>
  );
}

function ShopNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12 px-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">المتجر غير موجود</h2>
          <p className="text-sm text-muted-foreground mb-6">
            تأكد من صحة الرابط أو تواصل مع صاحب المتجر
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="gap-2"
          >
            العودة للرئيسية
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ShopAppInner({ slug }: { slug: string }) {
  const { shop, loading, error } = useShop();

  if (loading) return <ShopLoader />;
  if (error || !shop) return <ShopNotFound />;

  return (
    <MerchantErrorBoundary shopSlug={slug}>
      <MerchantDashboard
        shopId={shop.id}
        shopSlug={slug}
      />
    </MerchantErrorBoundary>
  );
}

function ShopApp({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<ShopLoader />}>
      <div className="min-h-screen">
        <ShopAppInner slug={slug} />
      </div>
    </Suspense>
  );
}

export function ShopPage({ slug }: { slug: string }) {
  return (
    <ShopProvider slug={slug}>
      <ShopApp slug={slug} />
    </ShopProvider>
  );
}
