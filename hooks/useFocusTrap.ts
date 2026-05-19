'use client'

import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTORS = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Traps keyboard focus within `containerRef` while `isActive` is true.
 *
 * On activation:
 *   - Stashes the currently focused element so it can be restored later.
 *   - Moves focus to the element marked with `data-autofocus` if present,
 *     otherwise to the first focusable child of the container.
 *
 * On deactivation (cleanup):
 *   - Returns focus to the element that held it before the trap started.
 *
 * Tab / Shift+Tab are intercepted to cycle within the container bounds.
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean,
) {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) return

    const container = containerRef.current
    if (!container) return

    // Stash focus origin so we can restore it on close
    previousFocusRef.current = document.activeElement as HTMLElement | null

    // Move focus in: prefer [data-autofocus], else first focusable child
    const autofocus = container.querySelector<HTMLElement>('[data-autofocus]')
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
    ;(autofocus ?? focusable[0])?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return

      // container is non-null: we early-returned above if it was null
      const focusable = Array.from(container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [isActive, containerRef])
}
