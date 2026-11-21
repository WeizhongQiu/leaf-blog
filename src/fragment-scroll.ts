import { onCleanup } from 'solid-js'

export function useSmoothFragmentScroll() {
  let resetFrame = 0

  const clear = () => {
    window.cancelAnimationFrame(resetFrame)
    document.documentElement.removeAttribute('data-smooth-fragment')
  }

  onCleanup(clear)

  return (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return

    // The browser still follows the fragment and manages its history entry.
    document.documentElement.setAttribute('data-smooth-fragment', '')
    window.cancelAnimationFrame(resetFrame)
    resetFrame = window.requestAnimationFrame(() => {
      resetFrame = window.requestAnimationFrame(clear)
    })
  }
}
