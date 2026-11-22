import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { page } from '@/src/blog-config.ts'
import ContentsRail from '@/src/components/ContentsRail.tsx'
import { useSmoothFragmentScroll } from '@/src/fragment-scroll.ts'
import type { PostHeading } from '@/src/types/post.ts'
import '@/src/styles/post-contents.css'

const autoHide = page.post.tocAutoHide !== false

export default function PostContents(props: { headings: PostHeading[] }) {
  const [active, setActive] = createSignal<PostHeading>()
  const [markerRow, setMarkerRow] = createSignal(0)
  const [progress, setProgress] = createSignal(0)
  const shallowest = createMemo(() =>
    Math.min(...props.headings.map(({ level }) => level)),
  )
  const importantRows = createMemo(() =>
    props.headings.flatMap(({ level }, row) =>
      level === shallowest() ? [row] : [],
    ),
  )
  const anchor = (id: string) => `#${encodeURIComponent(id)}`
  let nav!: HTMLElement
  let list!: HTMLOListElement
  let scrollHint: HTMLDivElement | undefined
  const onChapterClick = useSmoothFragmentScroll()

  const syncMarker = (position: number, center: number) => {
    setActive(props.headings[Math.round(position)])
    scrollHint?.style.setProperty('--hint-center', `${center}px`)
  }

  const revealActiveMark = () => {
    if (nav.matches(':hover, :has(:focus-visible)')) return
    const mark = nav.querySelector('[aria-current="location"]')
    if (!mark) return
    const { top, bottom, height } = mark.getBoundingClientRect()
    const bounds = nav.getBoundingClientRect()
    if (top < bounds.top) nav.scrollTop -= bounds.top - top
    const nextCenter = bottom + height / 2
    if (nextCenter > bounds.bottom) nav.scrollTop += nextCenter - bounds.bottom
  }

  createEffect(() => {
    if (active()) revealActiveMark()
  })

  onMount(() => {
    const sections = props.headings.flatMap(({ id }, row) => {
      const heading = document.getElementById(id)
      return heading ? [{ heading, row }] : []
    })
    if (!sections.length) return

    const hashHeading = () =>
      sections.find(
        ({ heading }) => anchor(heading.id) === window.location.hash,
      )
    hashHeading()?.heading.scrollIntoView()

    let frame = 0
    const readAnchorOffset = () =>
      parseFloat(getComputedStyle(sections[0].heading).scrollMarginTop) + 1
    let readingLine = readAnchorOffset()
    const update = () => {
      frame = 0
      let left = 0
      let right = sections.length
      while (left < right) {
        const index = Math.floor((left + right) / 2)
        if (
          sections[index].heading.getBoundingClientRect().top <= readingLine
        ) {
          left = index + 1
        } else {
          right = index
        }
      }
      const current = sections[Math.max(0, left - 1)]
      let position = current.row
      const next = sections[left]
      if (left > 0 && next) {
        const start = current.heading.getBoundingClientRect().top
        const end = next.heading.getBoundingClientRect().top
        const fraction = (readingLine - start) / (end - start)
        position += fraction * (next.row - current.row)
      }

      const scrollTop = window.scrollY
      const scrollRange =
        document.documentElement.scrollHeight - window.innerHeight
      if (autoHide) {
        setProgress(
          scrollRange > 0
            ? Math.round(
                Math.min(1, Math.max(0, scrollTop / scrollRange)) * 100,
              )
            : 100,
        )
      }
      if (Math.ceil(scrollTop) >= scrollRange - 1) {
        const target = hashHeading()
        const top = target?.heading.getBoundingClientRect().top
        if (
          target &&
          top !== undefined &&
          top >= 0 &&
          top < window.innerHeight
        ) {
          position = target.row
        } else if (scrollTop > 0) {
          position = sections[sections.length - 1].row
        }
      }
      setMarkerRow(position)
    }

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    const layoutChanged = () => {
      readingLine = readAnchorOffset()
      schedule()
      revealActiveMark()
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('hashchange', schedule)
    const observer = new ResizeObserver(layoutChanged)
    observer.observe(document.body)
    window.addEventListener('resize', layoutChanged)

    onCleanup(() => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', layoutChanged)
      window.removeEventListener('hashchange', schedule)
      observer.disconnect()
      window.cancelAnimationFrame(frame)
    })
  })

  return (
    <aside class="post-contents" aria-label="文章目录">
      <nav
        ref={nav}
        class="contents-nav"
        data-auto-hide={autoHide}
        aria-label="章节"
        onMouseLeave={revealActiveMark}
        onFocusOut={revealActiveMark}
      >
        <div class="contents-list">
          <ContentsRail
            rows={props.headings.length}
            getList={() => list}
            position={markerRow()}
            importantRows={importantRows()}
            onPositionChange={syncMarker}
          />
          <ol ref={list}>
            <For each={props.headings}>
              {({ id, title, level }) => (
                <li>
                  <a
                    class="contents-link"
                    href={anchor(id)}
                    target="_self"
                    onClick={onChapterClick}
                    aria-current={active()?.id === id ? 'location' : undefined}
                    style={{ '--depth': Math.min(3, level - shallowest()) }}
                  >
                    <span class="contents-label" title={title}>
                      {title}
                    </span>
                  </a>
                </li>
              )}
            </For>
          </ol>
          <Show when={autoHide}>
            <div ref={scrollHint} class="contents-current" aria-hidden="true">
              <span class="contents-current-title">{active()?.title}</span>
              <span class="contents-current-progress">{progress()}%</span>
            </div>
          </Show>
        </div>
      </nav>
    </aside>
  )
}
