'use client'

import { usePathname } from 'next/navigation'

export default function PageAnimationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // key={pathname} forces React to unmount/remount on every navigation,
  // guaranteeing the page-enter CSS animation fires each time.
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  )
}
