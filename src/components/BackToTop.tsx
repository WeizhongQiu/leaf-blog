import { createSignal, onCleanup, onMount } from 'solid-js'
import OutlineIcon from '@/src/components/OutlineIcon.tsx'

const styles = /* css */ `
.back-to-top {
  position: fixed;
  z-index: 3;
  right: max(1.5rem, calc(env(safe-area-inset-right) + 0.5rem));
  bottom: max(1.5rem, calc(env(safe-area-inset-bottom) + 0.5rem));
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: var(--paper);
  color: var(--muted);
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 160ms ease-out, visibility 160ms, color 160ms ease-out;
}

.back-to-top-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.back-to-top:is(:hover, :focus-visible) {
  color: var(--ink);
}

.back-to-top svg {
  width: 1.1rem;
  height: 1.1rem;
}

@media (prefers-reduced-motion: reduce) {
  .back-to-top {
    transition: none;
  }
}
`

export default function BackToTop() {
  const [visible, setVisible] = createSignal(false)

  onMount(() => {
    const update = () => setVisible(window.scrollY >= 2 * window.innerHeight)
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    onCleanup(() => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    })
  })

  const goToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    window.scrollTo({
      top: 0,
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
    })
  }

  return (
    <>
      <style>{styles}</style>
      <button
        type="button"
        class="back-to-top"
        classList={{ 'back-to-top-visible': visible() }}
        tabIndex={visible() ? 0 : -1}
        aria-label="返回顶部"
        onClick={goToTop}
      >
        <OutlineIcon path="M12 20V4m-6 6 6-6 6 6" />
      </button>
    </>
  )
}
