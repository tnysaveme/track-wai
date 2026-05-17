'use client'

import { useRouter } from 'next/navigation'
import { startTransition, type ComponentProps } from 'react'

type Props = Omit<ComponentProps<'a'>, 'href'> & { href: string }

export default function TransitionLink({ href, children, ...props }: Props) {
  const router = useRouter()

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    if (!('startViewTransition' in document)) {
      router.push(href)
      return
    }
    document.startViewTransition(() => {
      startTransition(() => {
        router.push(href)
      })
    })
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
