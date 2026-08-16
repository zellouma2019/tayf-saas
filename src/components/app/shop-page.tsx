"use client";

import { Suspense, Component, type ReactNode, type ErrorInfo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ShopProvider, useShop } from "@/lib/shop-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, AlertTriangle, RotateCcw, ShieldCheck, Loader2, WifiOff, RefreshCw } from "lucide-react";

const MerchantDashboard = dynamic(
  () => import("@/components/app/merchant-dashboard").then((m) => ({ default: m.MerchantDashboard })),
  { ssr: false, loading: () => <ShopLoader /> },
);

const CustomerPage = dynamic(
  () => import("@/components/customer/customer-page").then((m) => ({ default: m.CustomerPage })),
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
    console.error("[Dashboard] Error:", error, errorInfo.componentStack);
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
              <h2 className="text-xl font-bold mb-2">حدث خطأ</h2>
              {this.state.error && (
                <p className="text-xs text-muted-foreground mb-4 break-all">{this.state.error.message}</p>
              )}
              <Button onClick={() => this.setState({ hasError: false, error: null })} className="gap-2">
                <RotateCcw className="h-4 w-4" />إعادة المحاولة
              </Button>
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
        <Loader2 className="mx-auto h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">جاري التحميل...</p>
      </div>
    </div>
  );
}

function ShopNotFound({ isDbError }: { isDbError?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12 px-6">
          {isDbError ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center mb-4">
                <WifiOff className="h-8 w-8 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">مشكلة في الاتصال</h2>
              <p className="text-sm text-muted-foreground mb-2">
                لا يمكن الاتصال بقاعدة البيانات حالياً.
              </p>
              <p className="text-xs text-muted-foreground/70 mb-6">
                تأكد من اتصالك بالإنترنت وحاول مرة أخرى
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                <Store className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h2 className="text-xl font-bold mb-2">المتجر غير موجود</h2>
              <p className="text-sm text-muted-foreground mb-6">تأكد من صحة الرابط أو تواصل مع صاحب المتجر</p>
              <Button variant="outline" onClick={() => window.location.href = "/"} className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                العودة للرئيسية
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ShopAppInner({ slug }: { slug: string }) {
  const { shop, loading, error } = useShop();
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") === "1";

  if (loading) return <ShopLoader />;
  if (error || !shop) return <ShopNotFound isDbError={error?.includes("503") || error?.includes("DB_ERROR") || false} />;

  if (isAdmin) {
    return (
      <MerchantErrorBoundary shopSlug={slug}>
        <MerchantDashboard shopId={shop.id} shopSlug={slug} />
      </MerchantErrorBoundary>
    );
  }

  return <CustomerPage />;
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
