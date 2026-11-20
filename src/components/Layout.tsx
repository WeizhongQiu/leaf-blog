import { A, useLocation } from '@solidjs/router'
import type { RouteSectionProps } from '@solidjs/router'
import { For } from 'solid-js'
import { siteName } from '@/blog.config.json'

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

  return (
    <>
      <header class="site-header">
        <div class="page-shell header-inner">
          <A href="/" end class="site-name">
            {siteName}
          </A>
          <nav class="site-nav" aria-label="主导航">
            <For each={navigation}>
              {(item) => (
                <A
                  href={item.href}
                  end
                  class="nav-link"
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
      <main class="page-shell">{props.children}</main>
    </>
  )
}
