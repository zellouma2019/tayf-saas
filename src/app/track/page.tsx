import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تتبّع الطلب — طيف",
  description: "تتبّع حالة طلبك في أي متجر على منصة طيف",
  openGraph: {
    title: "تتبّع الطلب — طيف",
    description: "تتبّع حالة طلبك في أي متجر على منصة طيف",
  },
};

export default function TrackPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center shadow-lg">
          <svg className="h-9 w-9 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">تتبّع الطلب</h1>
          <p className="text-sm text-muted-foreground">
            للتتبّع، يُرجى الذهاب إلى صفحة المتجر واستخدام خاصية التتبّع المباشرة
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground space-y-3">
          <p className="text-foreground font-medium">كيفية التتبّع؟</p>
          <ol className="space-y-2 text-start list-decimal list-inside">
            <li>ادخل على رابط المتجر الذي أتممت منه الطلب</li>
            <li>اضغط على زر &quot;تتبّع&quot; في شريط التنقل العلوي</li>
            <li>أدخل رقم الطلب أو رقم هاتفك</li>
          </ol>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <svg className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}
