import { A } from '@solidjs/router'
import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import posts from 'virtual:blog/posts'
import { authorName } from '@/src/blog-config.ts'
import { postPath } from '@/src/post-path.ts'
import '@/src/styles/timeline-list.css'
import type { PostMeta } from '@/src/types/post.ts'

const rowRem = 2.14 // One line plus the timeline link's vertical padding.
const overscan = 6

const styles = /* css */ `
.categories-page {
  --category-entry-duration: 240ms;
  display: flex;
  gap: clamp(1rem, 5vw, 4rem);
  block-size: 100%;
  padding-block-start: clamp(1.5rem, 5vh, 3.25rem);
}

.categories-sidebar {
  display: flex;
  flex: 0 0 clamp(5.25rem, 23%, 12rem);
  flex-direction: column;
  min-inline-size: 0;
  font-family: var(--display-font);
}

.categories-summary {
  flex-shrink: 0;
  margin-block-end: calc(1.95rem + 1px);
}

.categories-summary h1 {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  margin: 0;
  color: var(--muted);
  font-family: var(--display-font);
  font-size: 0.9rem;
  font-weight: 400;
}

.categories-summary strong {
  color: var(--ink);
  font-size: clamp(2.35rem, 5vw, 3rem);
  font-weight: 400;
  font-variant-numeric: lining-nums tabular-nums;
  line-height: 1;
}

.categories-summary p {
  margin: 0.4rem 0 0;
  color: var(--muted);
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}

.categories-count,
.category-post-year {
  color: var(--muted);
  font-size: 0.82rem;
  white-space: nowrap;
}

.categories-options {
  position: relative;
  flex: 1;
  min-block-size: 0;
}

.categories-buttons {
  position: absolute;
  inset: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.categories-buttons[data-compact] {
  visibility: hidden;
}

.categories-buttons[data-has-selection]::before {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  inline-size: 2px;
  block-size: 0.9rem;
  border-radius: 999px;
  background: var(--muted);
  transform: translateY(calc(var(--category-selection-center, 0px) - 50%));
  pointer-events: none;
  content: '';
}

.categories-buttons button {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.15rem 0.45rem;
  width: 100%;
  padding: 0.45rem 0.7rem;
  border: 0;
  border-radius: 0.25rem;
  background: transparent;
  color: var(--muted);
  font-size: 0.95rem;
  text-align: start;
  overflow-wrap: anywhere;
  cursor: pointer;
}

.categories-buttons button:hover,
.categories-buttons button[aria-pressed='true'] {
  color: var(--ink);
}

.categories-select {
  inline-size: 100%;
  min-block-size: 2.25rem;
  border: 1px solid var(--line);
  border-radius: 0.25rem;
  background: var(--paper);
  color: var(--ink);
}

.categories-results {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-inline-size: 0;
}

.categories-scroll {
  flex: 1;
  min-block-size: 0;
  overflow: auto;
  overflow-anchor: none;
  overscroll-behavior: contain;
  padding-block-end: 2rem;
  scrollbar-width: none;
}

.categories-results .timeline-list {
  margin-inline-start: 3px;
}

.category-post-row {
  position: absolute;
  inset-inline: 0;
  block-size: ${rowRem}rem;
}

.categories-results .timeline-link {
  block-size: 100%;
  gap: clamp(0.4rem, 1.6vw, 0.9rem);
  padding-inline-start: clamp(0.6rem, 2vw, 1.1rem);
}

.categories-results .timeline-link:focus-visible {
  outline-offset: -2px;
}

.categories-results time {
  flex: 0 0 6ch;
  white-space: nowrap;
}

.category-post-year {
  margin-inline-start: auto;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: no-preference) {
  .categories-buttons::before {
    transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .categories-buttons button,
  .categories-select,
  .categories-scroll .category-post-row[data-intro] {
    animation: category-entry var(--category-entry-duration) linear
      var(--category-entry-delay, 0ms) both;
  }

  .categories-scroll .timeline-list[data-intro]::before {
    animation: category-track
      calc(var(--category-entry-duration) + var(--category-stagger))
      linear;
  }
}

@keyframes category-entry {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
}

@keyframes category-track {
  from { transform: scaleY(0); }
  to { transform: scaleY(var(--category-track-scale)); }
}
`

const monthAndDay = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  timeZone: 'UTC',
})

const uncategorized = '未分类'
const categories = new Map<string, PostMeta[]>([[uncategorized, []]])
for (const post of posts) {
  const categoryPosts = categories.get(post.category)
  if (categoryPosts) categoryPosts.push(post)
  else categories.set(post.category, [post])
}

const categoryEntries = [...categories]
const categoryEntryDelay = (index: number, count: number) =>
  `${index * Math.min(32, 360 / Math.max(1, count - 1))}ms`

function CategoryTimeline(props: { articles: PostMeta[] }) {
  const [viewport, setViewport] = createSignal({ height: 0, rowHeight: 0 })
  const [scrollTop, setScrollTop] = createSignal(0)
  const [focusedRow, setFocusedRow] = createSignal<number>()
  const [introRows, setIntroRows] = createSignal(0)
  let scroller!: HTMLDivElement

  const start = createMemo(() => {
    const { rowHeight } = viewport()
    return rowHeight
      ? Math.max(0, Math.floor(scrollTop() / rowHeight) - overscan)
      : 0
  })
  const end = createMemo(() => {
    const { height, rowHeight } = viewport()
    return rowHeight
      ? Math.min(
          props.articles.length,
          Math.ceil((scrollTop() + height) / rowHeight) + overscan,
        )
      : 0
  })
  const visibleRows = createMemo(() => {
    const from = start()
    const to = end()
    const rows = Array.from({ length: to - from }, (_, index) => from + index)
    const focused = focusedRow()
    // Keep a focused link mounted when the viewport scrolls away from it.
    if (focused !== undefined) {
      if (focused < from) rows.unshift(focused)
      else if (focused >= to) rows.push(focused)
    }
    return rows
  })

  onMount(() => {
    const measure = () => {
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      )
      batch(() => {
        setViewport({ height: scroller.clientHeight, rowHeight: rowRem * rem })
        setScrollTop(scroller.scrollTop)
      })
    }
    measure()
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const { height, rowHeight } = viewport()
      setIntroRows(
        Math.min(props.articles.length, Math.ceil(height / rowHeight)),
      )
    }
    const observer = new ResizeObserver(measure)
    observer.observe(scroller)
    onCleanup(() => observer.disconnect())
  })

  function handleScroll() {
    const top = scroller.scrollTop
    batch(() => {
      setScrollTop(top)
      if (top > 0) setIntroRows(0)
    })
  }

  return (
    <div
      ref={scroller}
      class="categories-scroll"
      role="region"
      aria-label="文章时间线"
      tabIndex={0}
      onScroll={handleScroll}
    >
      <Show
        when={props.articles.length}
        fallback={<p class="muted">暂无文章。</p>}
      >
        <ul
          class="timeline-list"
          role="list"
          data-intro={introRows() ? '' : undefined}
          style={{
            'block-size': `${props.articles.length * rowRem}rem`,
            '--category-stagger': introRows()
              ? categoryEntryDelay(introRows() - 1, introRows())
              : undefined,
            '--category-track-scale': introRows() / props.articles.length,
          }}
          onAnimationEnd={(event) => {
            if (event.animationName === 'category-track') setIntroRows(0)
          }}
        >
          <For each={visibleRows()}>
            {(index) => {
              const post = props.articles[index]
              const day = post.createdDate.slice(0, 10)
              const date = monthAndDay.format(new Date(day)).toUpperCase()
              return (
                <li
                  class="category-post-row"
                  aria-posinset={index + 1}
                  aria-setsize={props.articles.length}
                  data-intro={index < introRows() ? '' : undefined}
                  style={{
                    'inset-block-start': `${index * rowRem}rem`,
                    '--category-entry-delay':
                      index < introRows()
                        ? categoryEntryDelay(index, introRows())
                        : undefined,
                  }}
                >
                  <A
                    href={postPath(post.fileName)}
                    class="timeline-link"
                    onFocus={() => setFocusedRow(index)}
                    onBlur={() => setFocusedRow(undefined)}
                  >
                    <time dateTime={day}>{date}</time>
                    <span class="timeline-link-title">{post.title}</span>
                    <span class="category-post-year">{day.slice(0, 4)}</span>
                  </A>
                </li>
              )
            }}
          </For>
        </ul>
      </Show>
    </div>
  )
}

export default function CategoriesPage() {
  document.title = `分类 | ${authorName}`

  const [selected, setSelected] = createSignal(uncategorized)
  const [compact, setCompact] = createSignal(false)
  const selectedPosts = () => categories.get(selected())
  let options!: HTMLDivElement
  let buttons!: HTMLDivElement

  onMount(() => {
    function updateButtons() {
      setCompact(buttons.offsetHeight > options.clientHeight)
      const active = buttons.querySelector<HTMLButtonElement>(
        '[aria-pressed="true"]',
      )
      if (!active) return

      buttons.style.setProperty(
        '--category-selection-center',
        `${active.offsetTop + active.offsetHeight / 2}px`,
      )
      buttons.dataset.hasSelection = ''
    }

    createEffect(on(selected, updateButtons))
    const observer = new ResizeObserver(updateButtons)
    observer.observe(options)
    observer.observe(buttons)
    onCleanup(() => observer.disconnect())
  })

  return (
    <section class="viewport-page categories-page" aria-label="分类选集">
      <style>{styles}</style>
      <aside class="categories-sidebar">
        <div ref={options} class="categories-options">
          <div
            ref={buttons}
            class="categories-buttons"
            data-compact={compact() ? '' : undefined}
            role="group"
            aria-label="选择分类"
          >
            <For each={categoryEntries}>
              {([category, articles], index) => (
                <button
                  type="button"
                  aria-pressed={category === selected()}
                  style={{
                    '--category-entry-delay': categoryEntryDelay(
                      index(),
                      categoryEntries.length,
                    ),
                  }}
                  onClick={() => setSelected(category)}
                >
                  {category}
                  <span class="categories-count">{articles.length}</span>
                </button>
              )}
            </For>
          </div>
          <Show when={compact() && categoryEntries.length}>
            <select
              class="categories-select"
              aria-label="选择分类"
              onChange={(event) => setSelected(event.currentTarget.value)}
            >
              <For each={categoryEntries}>
                {([category, articles]) => (
                  <option value={category} selected={category === selected()}>
                    {category}（{articles.length} 篇）
                  </option>
                )}
              </For>
            </select>
          </Show>
        </div>
      </aside>
      <section class="categories-results" aria-label="分类文章">
        <header class="categories-summary">
          <h1>
            <strong>{selectedPosts()?.length ?? 0}</strong> 篇文章
          </h1>
          <p># {selected()}</p>
        </header>
        <Show keyed when={selectedPosts()}>
          {(articles) => <CategoryTimeline articles={articles} />}
        </Show>
      </section>
    </section>
  )
}
