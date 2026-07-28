"use client";

import { Suspense, useEffect, Component, type ReactNode, type ErrorInfo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ShopProvider, useShop } from "@/lib/shop-context";
import { AppShell } from "@/components/app/app-shell";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Store, AlertTriangle, RotateCcw } from "lucide-react";

const MerchantDashboard = dynamic(
  () => import("@/components/app/merchant-dashboard").then((m) => ({ default: m.MerchantDashboard })),
  { ssr: false, loading: () => <ShopLoader /> },
);

// ===== Error Boundary للقبض على أخطاء لوحة التحكم =====
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class MerchantErrorBoundary extends Component<
  { children: ReactNode; shopId: string; shopSlug: string },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; shopId: string; shopSlug: string }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[MerchantDashboard] Error caught by boundary:", error);
    console.error("[MerchantDashboard] Component stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

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
                <pre className="text-xs text-left bg-muted/50 rounded-lg p-3 mb-4 max-h-48 overflow-auto font-mono text-rose-600 dark:text-rose-400 whitespace-pre-wrap" dir="ltr">
                  {this.state.error.message}
{this.state.error.stack || ''}
                </pre>
              )}
              {this.state.errorInfo?.componentStack && (
                <pre className="text-xs text-left bg-muted/30 rounded-lg p-3 mb-4 max-h-24 overflow-auto font-mono text-muted-foreground whitespace-pre-wrap" dir="ltr">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
              <Button onClick={this.handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                تحديث الصفحة
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">جارٍ تحميل المتجر...</p>
      </div>
    </div>
  );
}

function ShopNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">المتجر غير موجود</h2>
          <p className="text-sm text-muted-foreground">
            تأكد من صحة الرابط أو تواصل مع صاحب المتجر
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ShopAppInner({ slug }: { slug: string }) {
  const { shop, loading, error } = useShop();
  const searchParams = useSearchParams();
  const isAdmin = searchParams.get("admin") === "1";
  const isPreview = searchParams.get("preview") === "1";
  const setShopId = useAppStore((s) => s.setShopId);
  const setShowAdminLink = useAppStore((s) => s.setShowAdminLink);

  // ضبط shopId ورابط الإدارة في المتجر عند التحميل
  useEffect(() => {
    if (shop) {
      setShopId(shop.id);
      setShowAdminLink(isPreview);
    }
    return () => {
      setShopId(null);
      setShowAdminLink(false);
    };
  }, [shop, isPreview, setShopId, setShowAdminLink]);

  if (loading) return <ShopLoader />;
  if (error || !shop) return <ShopNotFound />;

  // لوحة التحكم الخاصة بالتاجر (صاحب المتجر)
  if (isAdmin) {
    return (
      <MerchantErrorBoundary shopId={shop.id} shopSlug={slug}>
        <MerchantDashboard
          shopId={shop.id}
          shopSlug={slug}
        />
      </MerchantErrorBoundary>
    );
  }

  // واجهة الزبون
  return <AppShell />;
}

function ShopApp({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<ShopLoader />}>
      <ShopAppInner slug={slug} />
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