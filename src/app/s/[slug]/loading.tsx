export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
      <div className="text-center">
        <div className="relative mx-auto w-10 h-10 mb-3">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
        </div>
        <p className="text-sm text-slate-400">جارٍ تحميل المتجر...</p>
      </div>
    </div>
  );
}