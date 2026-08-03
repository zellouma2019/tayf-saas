export function PageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-pulse">
      {/* Stepper skeleton */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted" />
            {i < 4 && <div className="w-6 sm:w-10 h-0.5 bg-muted rounded-full" />}
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted" />
        <div className="flex-1">
          <div className="h-5 w-3/4 bg-muted rounded-lg mb-2" />
          <div className="h-3 w-1/2 bg-muted rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 sm:h-32 bg-muted rounded-2xl" />
        ))}
      </div>
      <div className="h-48 sm:h-64 bg-muted rounded-2xl" />
    </div>
  );
}
