import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-figtree',
})

export const metadata: Metadata = {
  title: 'Track Wai',
  description: 'What are we listening to?',
  other: {
    'theme-color': '#ffffff',
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
