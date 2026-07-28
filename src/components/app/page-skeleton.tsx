export function PageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted" />
        <div className="h-6 w-40 bg-muted rounded-lg" />
      </div>
      <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-2xl" />
    </div>
  );
}
