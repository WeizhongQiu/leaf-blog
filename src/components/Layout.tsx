import { A, useIsRouting, useLocation } from '@solidjs/router'
import type { RouteSectionProps } from '@solidjs/router'
import { createEffect, For, onCleanup, onMount, Suspense } from 'solid-js'
import { siteName } from '@/blog.config.json'

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
  font-family: var(--heading-font);
  font-size: 1.45rem;
  font-weight: 600;
}

.site-nav {
  gap: 1.75rem;
}

.site-nav-link {
  gap: 0.4rem;
  padding-block: 0.35rem;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  transition: color 150ms ease-out;
}

.site-nav-link svg {
  width: 1.05rem;
  height: 1.05rem;
}

.site-nav-link[aria-current='page'],
.site-nav-link:hover {
  color: var(--ink);
}

@media (prefers-reduced-motion: reduce) {
  .site-nav-link {
    transition: none;
  }
}
`

const navigation = [
  {
    label: 'HOME',
    href: '/',
    icon: 'M3 10.5 12 3l9 7.5M5.5 9v11h13V9M10 20v-6h4v6',
  },
  {
    label: 'TIMELINE',
    href: '/timeline',
    icon: 'M4 5h2m-1 4v2m-1 4h2m-1 4v1M10 5h10M10 10h7M10 15h10M10 20h7',
  },
  {
    label: 'RANDOM',
    href: '/random',
    icon: 'M3 6h2c5 0 6 12 12 12h4m-3-3 3 3-3 3M3 18h2c2 0 3-2 4-4m5-4c1-2 2-4 5-4h2m-3-3 3 3-3 3',
  },
  {
    label: 'ABOUT',
    href: '/about',
    icon: 'M12 2.75a9.25 9.25 0 1 0 0 18.5 9.25 9.25 0 0 0 0-18.5ZM12 11v5m0-8h.01',
  },
]

export default function Layout(props: RouteSectionProps) {
  const location = useLocation()
  const isRouting = useIsRouting()
  let main!: HTMLElement

  onMount(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let previousPath: string | undefined
    let animation: Animation | undefined
    const cancelAnimation = () => animation?.cancel()

    createEffect(() => {
      const path = location.pathname
      if (isRouting() || path === previousPath) return

      const opening = previousPath === undefined
      previousPath = path
      cancelAnimation()
      if (motion.matches || (opening && path !== '/')) return

      animation = main.animate(
        [
          { opacity: opening ? 0 : 0.5, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: opening ? 420 : 220, easing: 'ease-out' },
      )
    })

    motion.addEventListener('change', cancelAnimation)
    onCleanup(() => {
      motion.removeEventListener('change', cancelAnimation)
      cancelAnimation()
    })
  })

  return (
    <>
      <style>{styles}</style>
      <header>
        <div class="site-shell site-header-inner">
          <A href="/" end class="site-name">
            {siteName}
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
                  </svg>
                  {item.label}
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
    </>
  )
}
