export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
      <div className="text-center">
        <div className="relative mx-auto w-12 h-12 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-teal-500 animate-spin" />
        </div>
        <p className="text-sm text-slate-400">جارٍ التحميل...</p>
      </div>
    </div>
  );
}