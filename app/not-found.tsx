import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Track Wai</h1>
      </div>
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3">
        <p className="text-gray-500">This page doesn&apos;t exist.</p>
        <Link href="/" className="text-sm font-bold transition-opacity hover:opacity-60">
          Back to home
        </Link>
      </div>
    </main>
  )
}
