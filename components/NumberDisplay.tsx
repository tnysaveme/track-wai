'use client'

import { useEffect, useRef } from 'react'

type Props = {
  value: number
  className?: string
}

function applyDigits(group: HTMLElement, str: string) {
  group.classList.remove('is-animating')
  group.replaceChildren()
  str.split('').forEach((ch, i, arr) => {
    const span = document.createElement('span')
    span.className = 't-digit'
    span.textContent = ch
    if (i === arr.length - 2) span.dataset.stagger = '1'
    else if (i === arr.length - 1) span.dataset.stagger = '2'
    group.appendChild(span)
  })
  void group.offsetHeight // force reflow so animation replays
  group.classList.add('is-animating')
}

export default function NumberDisplay({ value, className }: Props) {
  const groupRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    applyDigits(group, String(value))
  }, [value])

  // Render empty — effect owns the children entirely, no React reconciliation conflict
  return (
    <span ref={groupRef} className={`t-digit-group${className ? ` ${className}` : ''}`} />
  )
}
