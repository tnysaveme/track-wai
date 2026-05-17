// bg-black/20 overlay over white (#ffffff) = rgb(204,204,204) = #cccccc
const MODAL_OPEN_COLOR = '#cccccc'
const MODAL_CLOSED_COLOR = '#ffffff'

export function setThemeColorForModal(open: boolean) {
  if (typeof document === 'undefined') return
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = open ? MODAL_OPEN_COLOR : MODAL_CLOSED_COLOR
}
