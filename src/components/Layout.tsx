import { A } from '@solidjs/router'
import type { RouteSectionProps } from '@solidjs/router'

export default function Layout(props: RouteSectionProps) {
  return (
    <>
      <header>
        <nav aria-label="主导航">
          <A href="/" end>
            首页
          </A>
        </nav>
      </header>
      <main>{props.children}</main>
      <footer>Leaf Blog</footer>
    </>
  )
}
