import '@fontsource-variable/noto-sans-sc'
import { A } from '@solidjs/router'
import {
  createEffect,
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

const styles = /* css */ `
#root:has(> main > .categories-page) {
  display: flex;
  flex-direction: column;
  block-size: 100dvh;
  overflow: clip;
}

#root:has(> main > .categories-page) > main {
  flex: 1;
  min-block-size: 0;
}

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
}

.categories-summary {
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
  flex: 1;
  min-inline-size: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding-block-end: 2rem;
  scrollbar-width: thin;
}

.categories-results .timeline-list {
  margin-inline-start: 3px;
}

.categories-results .timeline-link {
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
  .categories-results .timeline-list li {
    animation: category-entry var(--category-entry-duration) ease-out
      var(--category-entry-delay, 0ms) both;
  }

  .categories-results .timeline-list::before {
    animation: category-track
      calc(var(--category-entry-duration) + var(--category-stagger))
      cubic-bezier(0.22, 1, 0.36, 1) both;
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
  to { transform: scaleY(1); }
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
const categoryEntryDelay = (index: number) => `${Math.min(32 * index, 360)}ms`

export default function CategoriesPage() {
  document.title = `分类 | ${authorName}`

  const [selected, setSelected] = createSignal(uncategorized)
  const [compact, setCompact] = createSignal(false)
  const selectedPosts = () => categories.get(selected())
  let options!: HTMLDivElement
  let buttons!: HTMLDivElement
  let results!: HTMLElement

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

  function selectCategory(category: string) {
    if (category === selected()) return
    setSelected(category)
    results.scrollTop = 0
  }

  return (
    <section class="categories-page" aria-label="分类选集">
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
                    '--category-entry-delay': categoryEntryDelay(index()),
                  }}
                  onClick={() => selectCategory(category)}
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
              onChange={(event) => selectCategory(event.currentTarget.value)}
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
      <section
        ref={results}
        class="categories-results"
        aria-label="分类文章"
        tabIndex={0}
      >
        <Show keyed when={selectedPosts()}>
          {(articles) => (
            <>
              <header class="categories-summary">
                <h1>
                  <strong>{articles.length}</strong> 篇文章
                </h1>
                <p># {selected()}</p>
              </header>
              <Show
                when={articles.length}
                fallback={<p class="muted">暂无文章。</p>}
              >
                <ul
                  class="timeline-list"
                  style={{
                    '--category-stagger': categoryEntryDelay(
                      articles.length - 1,
                    ),
                  }}
                >
                  <For each={articles}>
                    {(post, index) => {
                      const day = post.createdDate.slice(0, 10)
                      const date = monthAndDay
                        .format(new Date(day))
                        .toUpperCase()
                      return (
                        <li
                          style={{
                            '--category-entry-delay':
                              categoryEntryDelay(index()),
                          }}
                        >
                          <A
                            href={postPath(post.fileName)}
                            class="timeline-link"
                          >
                            <time dateTime={day}>{date}</time>
                            <span class="timeline-link-title">
                              {post.title}
                            </span>
                            <span class="category-post-year">
                              {day.slice(0, 4)}
                            </span>
                          </A>
                        </li>
                      )
                    }}
                  </For>
                </ul>
              </Show>
            </>
          )}
        </Show>
      </section>
    </section>
  )
}
