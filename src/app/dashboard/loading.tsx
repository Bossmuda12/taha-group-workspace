export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="glass-strong h-28 animate-pulse rounded-4xl" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass h-28 animate-pulse rounded-4xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass h-64 animate-pulse rounded-4xl lg:col-span-2" />
        <div className="glass h-64 animate-pulse rounded-4xl" />
      </div>
    </div>
  );
}
