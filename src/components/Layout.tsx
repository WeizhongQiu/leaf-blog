import { A, useBeforeLeave, useIsRouting, useLocation } from '@solidjs/router'
import type { RouteSectionProps } from '@solidjs/router'
import { createEffect, For, onCleanup, onMount, Show, Suspense } from 'solid-js'
import blogConfig from '@/blog.config.json'
import BackToTop from '@/src/components/BackToTop.tsx'

const { authorName } = blogConfig
const showBackToTop =
  !('showBackToTop' in blogConfig) || blogConfig.showBackToTop !== false

const styles = /* css */ `
.site-shell {
  width: min(65rem, calc(100% - 4rem));
  margin-inline: auto;
}

.site-header-inner,
.site-nav,
.site-nav-link {
  display: flex;
  align-items: center;
}

.site-header-inner {
  justify-content: space-between;
  gap: 2rem;
  min-height: var(--header-height);
}

.site-name,
.site-nav-link {
  text-decoration: none;
}

.site-name {
  font-size: 1.45rem;
}

.site-nav {
  gap: 1.75rem;
}

.site-nav-link {
  position: relative;
  gap: 0.4rem;
  padding-block: 0.35rem;
  color: var(--muted);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  transition: color 150ms ease-out;
}

.site-nav-link::after {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  height: 1px;
  background: currentColor;
  content: '';
  transform: scale(0, 0.8);
  transform-origin: center;
  transition: transform 180ms ease-out;
}

.site-nav-link:is(:hover, :focus-visible)::after {
  transform: scale(1, 0.8);
}

.site-nav-link svg {
  display: block;
  flex: none;
  width: 1.05rem;
  height: 1.05rem;
}

.site-nav-label {
  line-height: 1;
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
}

@supports not (text-box-edge: cap alphabetic) {
  .site-nav-label {
    transform: translateY(0.06em);
  }
}

.site-nav-link[aria-current='page'],
.site-nav-link:is(:hover, :focus-visible) {
  color: var(--ink);
}

@media (prefers-reduced-motion: reduce) {
  .site-nav-link,
  .site-nav-link::after {
    transition: none;
  }
}
`

const navigation = [
  {
    label: 'HOME',
    href: '/',
    icon: 'M3 10.5 12 3l9 7.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7',
  },
  {
    label: 'TIMELINE',
    href: '/timeline',
    icon: 'M12 7v13M12 7C10 5 7.5 4 3 4v13c4.5 0 7 1 9 3 2-2 4.5-3 9-3V4c-4.5 0-7 1-9 3Z',
  },
  {
    label: 'CATEGORIES',
    href: '/categories',
    icon: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
  },
  {
    label: 'RANDOM',
    href: '/random',
    icon: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z',
    pips: 'M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01',
  },
  {
    label: 'ABOUT',
    href: '/about',
    icon: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2',
  },
]

export default function Layout(props: RouteSectionProps) {
  const location = useLocation()
  const isRouting = useIsRouting()
  let main!: HTMLElement
  let motion: MediaQueryList | undefined
  let animation: Animation | undefined
  let leaving = false
  let retryNavigation: (() => void) | undefined

  const resumeNavigation = () => {
    const retry = retryNavigation
    retryNavigation = undefined
    retry?.()
  }

  useBeforeLeave((event) => {
    if (!motion || motion.matches || event.defaultPrevented || isRouting())
      return

    const destination =
      typeof event.to === 'number'
        ? window.location.pathname
        : new URL(event.to, window.location.href).pathname
    if (destination === event.from.pathname) return

    event.preventDefault()
    const alreadyLeaving = retryNavigation !== undefined
    retryNavigation = () => event.retry(true)
    if (alreadyLeaving) return

    leaving = true
    const opacity = getComputedStyle(main).opacity
    animation?.cancel()
    animation = main.animate([{ opacity }, { opacity: 0 }], {
      duration: 150,
      easing: 'ease-in',
      fill: 'forwards',
    })
    void animation.finished.then(resumeNavigation, () => {})
  })

  onMount(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    motion = preference
    let previousPath: string | undefined

    createEffect(() => {
      const path = location.pathname
      if (isRouting() || retryNavigation || (path === previousPath && !leaving))
        return

      const opening = previousPath === undefined
      const startOpacity = opening || leaving ? 0 : 0.5
      previousPath = path
      leaving = false
      animation?.cancel()
      if (preference.matches || (opening && path !== '/')) return

      animation = main.animate([{ opacity: startOpacity }, { opacity: 1 }], {
        duration: opening ? 420 : 280,
        easing: 'ease-out',
      })
    })

    const onMotionChange = () => {
      animation?.cancel()
      resumeNavigation()
    }
    preference.addEventListener('change', onMotionChange)
    onCleanup(() => {
      preference.removeEventListener('change', onMotionChange)
      retryNavigation = undefined
      animation?.cancel()
    })
  })

  return (
    <>
      <style>{styles}</style>
      <header>
        <div class="site-shell site-header-inner">
          <A href="/" end class="site-name">
            {authorName}
          </A>
          <nav class="site-nav" aria-label="主导航">
            <For each={navigation}>
              {(item) => (
                <A
                  href={item.href}
                  end
                  class="site-nav-link"
                  state={
                    item.href === '/random'
                      ? { from: location.pathname }
                      : undefined
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d={item.icon} />
                    <Show when={item.pips}>
                      <path d={item.pips} stroke-width="2.8" />
                    </Show>
                  </svg>
                  <span class="site-nav-label">{item.label}</span>
                </A>
              )}
            </For>
          </nav>
        </div>
      </header>
      <main ref={main} class="site-shell">
        <Suspense
          fallback={
            <p class="page-content muted" role="status">
              正在加载…
            </p>
          }
        >
          {props.children}
        </Suspense>
      </main>
      <Show when={showBackToTop}>
        <BackToTop />
      </Show>
    </>
  )
}
