/**
 * Minimal inline spinner — inherits the parent's colour via `border-current`
 * so it works on both black and red buttons without any extra props.
 */
export function Spinner() {
  return (
    <span
      className="inline-block w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin shrink-0"
      aria-hidden="true"
    />
  )
}
