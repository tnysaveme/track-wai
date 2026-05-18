import type { Metadata, Viewport } from 'next'
import { Figtree } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const figtree = Figtree({
  subsets: ['latin'],
  // 'optional' never swaps — font only renders if already cached.
  // This eliminates the text-metrics shift that causes iOS Safari to
  // briefly zoom out and snap back on initial load.
  display: 'optional',
  variable: '--font-figtree',
  preload: true,
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  // viewportFit: 'cover' lets content bleed into notch/home-indicator
  // safe areas — we handle insets ourselves with env(safe-area-inset-*)
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Track Wai',
  description: 'What are we listening to?',
  openGraph: {
    title: 'Track Wai',
    description: 'What are we listening to?',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Track Wai',
    description: 'What are we listening to?',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={figtree.variable}>
      <body className={figtree.className}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
