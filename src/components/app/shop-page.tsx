"use client";

import { Suspense, useEffect, Component, type ReactNode, type ErrorInfo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { ShopProvider, useShop } from "@/lib/shop-context";
import { AppShell } from "@/components/app/app-shell";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Store, AlertTriangle, RotateCcw } from "lucide-react";

const MerchantDashboard = dynamic(
  () => import("@/components/app/merchant-dashboard").then((m) => ({ default: m.MerchantDashboard })),
  { ssr: false, loading: () => <ShopLoader /> },
);

// ===== Error Boundary =====
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
              <p className="text-sm text-muted-foreground mb-6">
                يرجى المحاولة مرة أخرى أو تحديث الصفحة
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={this.handleReset} className="gap-2 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-gold-500/50">
                  <RotateCcw className="h-4 w-4" />
                  تحديث الصفحة
                </Button>
                <Button variant="outline" onClick={() => window.location.href = `/s/${this.props.shopSlug}`}>
                  العودة للمتجر
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
    <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in" dir="rtl">
      <div className="max-w-md w-full mx-auto p-8 text-center space-y-6">
        {/* Logo placeholder with pulse */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 skeleton-sweep flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary/20 skeleton-sweep" style={{ animationDelay: "0.2s" }} />
        </div>
        {/* Title skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4 mx-auto rounded-lg skeleton-sweep" />
          <Skeleton className="h-4 w-1/2 mx-auto rounded-lg skeleton-sweep" style={{ animationDelay: "0.1s" }} />
        </div>
        {/* Service cards skeleton */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border space-y-2 fade-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <Skeleton className="h-8 w-8 rounded-lg mx-auto skeleton-sweep" style={{ animationDelay: `${i * 0.1}s` }} />
              <Skeleton className="h-3 w-3/4 mx-auto rounded skeleton-sweep" style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
              <Skeleton className="h-2 w-1/2 mx-auto rounded skeleton-sweep" style={{ animationDelay: `${i * 0.1 + 0.2}s` }} />
            </div>
          ))}
        </div>
        {/* Loading text */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="status-pulse inline-block w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="animate-pulse-slow">جاري تحميل المتجر...</span>
        </div>
      </div>
    </div>
  );
}

function ShopNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center card-textured">
        <CardContent className="py-12 px-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-foreground">المتجر غير موجود</h2>
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

  return <AppShell />;
}

function ShopApp({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<ShopLoader />}>
      <div className="min-h-screen safe-bottom">
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
