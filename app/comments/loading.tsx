export default function CommentsLoading() {
  // Vary widths so skeletons don't look uniform
  const lines: [string, string][] = [
    ['w-16', 'w-full'],
    ['w-20', 'w-5/6'],
    ['w-14', 'w-full'],
    ['w-24', 'w-4/5'],
    ['w-16', 'w-full'],
  ]

  return (
    <main className="min-h-screen bg-background p-8" aria-busy="true" aria-label="Loading comments">
      {/* Header — mirrors app/comments/page.tsx */}
      <div className="flex items-center justify-between mb-10">
        <div className="skeleton h-6 w-24" />
        <div className="skeleton h-5 w-5" />
      </div>

      {/* Comment skeletons */}
      <div className="flex flex-col gap-7">
        {lines.map(([nameW, bodyW], i) => (
          <div key={i} className="flex flex-col gap-2">
            {/* Author name */}
            <div className={`skeleton h-3 ${nameW}`} />
            {/* Comment body — two lines */}
            <div className={`skeleton h-4 ${bodyW}`} />
            <div className="skeleton h-4 w-2/3" />
          </div>
        ))}
      </div>
    </main>
  )
}
