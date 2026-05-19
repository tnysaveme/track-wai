export default function Loading() {
  return (
    <main className="min-h-screen bg-background p-8" aria-busy="true" aria-label="Loading">
      {/* Header — mirrors app/page.tsx */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-24" />
        <div className="skeleton h-5 w-5 rounded-full" />
      </div>

      {/* Centred content — mirrors the track section */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 pt-12 sm:pt-24">

        {/* Album art */}
        <div className="skeleton w-full max-w-[375px] aspect-square" />

        {/* Artist — Track name */}
        <div className="flex items-center gap-2">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-4 w-3" />
          <div className="skeleton h-4 w-36" />
        </div>

        {/* Play / pause button */}
        <div className="skeleton h-10 w-10 rounded-full" />

        {/* Reaction bar */}
        <div className="flex gap-8 sm:gap-12 items-start">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-2">
              <div className="skeleton h-6 w-6" />
              <div className="skeleton h-3.5 w-5" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
