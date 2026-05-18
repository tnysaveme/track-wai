export default function BackstageLoading() {
  return (
    <main
      className="min-h-screen bg-white p-8 max-w-2xl mx-auto"
      aria-busy="true"
      aria-label="Loading admin"
    >
      {/* Page title */}
      <div className="skeleton h-6 w-40 mb-10" />

      {/* ── Now Playing ── */}
      <div className="mb-10">
        <div className="skeleton h-5 w-28 mb-4" />
        <div className="flex items-start gap-4">
          <div className="skeleton w-16 h-16 shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="skeleton h-3.5 w-36" />
            <div className="skeleton h-3.5 w-48" />
            <div className="skeleton h-3 w-12" />
            {/* Action buttons */}
            <div className="flex gap-4 mt-1">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Set New Track ── */}
      <div className="mb-10">
        <div className="skeleton h-5 w-32 mb-4" />
        {/* Song / Album tabs */}
        <div className="flex gap-4 mb-4">
          <div className="skeleton h-4 w-10" />
          <div className="skeleton h-4 w-12" />
        </div>
        {/* Search bar */}
        <div className="skeleton h-8 w-full" />
      </div>

      {/* ── History ── */}
      <div>
        <div className="skeleton h-5 w-16 mb-4" />
        <div className="flex flex-col gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 pl-3">
              <div className="skeleton w-12 h-12 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-2 flex-1">
                <div className="skeleton h-3.5 w-28" />
                <div className="skeleton h-3.5 w-40" />
                <div className="skeleton h-3 w-56" />
                <div className="flex gap-3 mt-1">
                  <div className="skeleton h-3.5 w-16" />
                  <div className="skeleton h-3.5 w-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
