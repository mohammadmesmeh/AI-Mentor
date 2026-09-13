function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <div className="h-4 w-40 rounded-md bg-muted" />
        <div className="h-7 w-64 max-w-full rounded-md bg-muted" />
      </div>
      <div className="h-32 rounded-xl border bg-card" />
      <div className="grid gap-6 md:grid-cols-5">
        <div className="space-y-6 md:col-span-3">
          <div className="h-40 rounded-xl border bg-card" />
          <div className="h-40 rounded-xl border bg-card" />
        </div>
        <div className="space-y-6 md:col-span-2">
          <div className="h-40 rounded-xl border bg-card" />
          <div className="h-40 rounded-xl border bg-card" />
        </div>
      </div>
    </div>
  )
}

export default DashboardLoading