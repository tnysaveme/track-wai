export default function CommentsLoading() {
  return (
    <main className="min-h-screen bg-white p-8">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-xl font-bold">Comments</h1>
      </div>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2" aria-label="Loading" role="status">
          <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
        </div>
      </div>
    </main>
  )
}
