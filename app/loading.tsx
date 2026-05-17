export default function Loading() {
  return (
    <main className="min-h-screen bg-white p-8 flex items-center justify-center">
      {/* Three-dot pulse that matches the minimal black-and-white aesthetic */}
      <div className="flex items-center gap-2" aria-label="Loading" role="status">
        <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
      </div>
    </main>
  )
}
