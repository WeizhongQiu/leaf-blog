import '@fontsource-variable/noto-sans-sc'
import { A, useLocation, useNavigate } from '@solidjs/router'
import {
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
import ActivityHeatmap from '@/src/components/ActivityHeatmap.tsx'
import { postPath } from '@/src/post-path.ts'
import '@/src/styles/timeline-list.css'
import { animateTimeline } from '@/src/timeline-motion.ts'
import type { PostMeta } from '@/src/types/post.ts'

const row = { year: 2.4, month: 1.65, post: 2, gap: 0.35 }
const wheelThreshold = 120
const wheelIdle = 220

const styles = /* css */ `
.timeline-page {
  display: flex;
  flex-direction: column;
  block-size: 100%;
  max-inline-size: var(--reading-width);
  margin-inline: auto;
  padding-block-start: clamp(0.8rem, 5vh, 3.25rem);
}

.timeline-page .activity-heatmap {
  margin-block-start: clamp(0.65rem, 3vh, 2rem);
}

.timeline-viewport {
  position: relative;
  flex: 1;
  min-block-size: 0;
  margin-block-start: clamp(0.8rem, 3vh, 2rem);
  overflow: clip;
}

.timeline-viewport:focus-visible,
.timeline-viewport a:focus-visible {
  outline-offset: -2px;
}

.timeline-exit-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.timeline-summary h1 {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  margin: 0;
  color: var(--muted);
  font-family: var(--display-font);
  font-size: 0.9rem;
  font-weight: 400;
}

.timeline-summary strong {
  color: var(--ink);
  font-size: 3rem;
  font-weight: 400;
  font-variant-numeric: lining-nums tabular-nums;
  line-height: 1;
}

.timeline-year-heading,
.timeline-month-heading {
  display: flex;
  align-items: center;
  margin: 0;
}

.timeline-year-heading {
  block-size: ${row.year}rem;
  color: var(--ink);
  font-family: var(--display-font);
  font-size: 2rem;
  font-weight: 400;
  line-height: 1.2;
}

.timeline-year-heading span {
  color: var(--muted);
  font-size: 0.85rem;
}

.timeline-month-heading {
  block-size: ${row.month}rem;
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: inherit;
}

.timeline-year-heading[data-folded] {
  color: var(--muted);
  font-size: 1.2rem;
}

.timeline-month-heading[data-folded] {
  opacity: 0.75;
}

.timeline-heading-link {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 0.7rem;
  text-decoration: none;
}

.timeline-heading-link::after {
  position: absolute;
  inset-inline: 0;
  inset-block-end: -0.12em;
  block-size: 1px;
  background: currentColor;
  transform: scaleX(0);
  content: '';
}

.timeline-heading-link:is(:hover, :focus-visible)::after {
  transform: scaleX(1);
}

.timeline-month .timeline-list {
  margin-inline-start: 3px;
  padding-block-end: ${row.gap}rem;
}

.timeline-month .timeline-list::before {
  content: none;
}

.timeline-month .timeline-list[data-timeline-reveal] {
  clip-path: inset(0 -0.25rem);
}

.timeline-article {
  position: relative;
  list-style: none;
}

.timeline-article::before {
  position: absolute;
  inset-block: 0;
  inset-inline-start: -1px;
  inline-size: 1px;
  background: var(--line);
  content: '';
  pointer-events: none;
}

.timeline-page .timeline-link {
  align-items: center;
  block-size: ${row.post}rem;
  padding-block: 0;
}

.timeline-page .timeline-link time {
  flex: 0 0 2ch;
}

.timeline-link-category {
  flex-shrink: 0;
  min-width: 0;
  max-inline-size: 35%;
  margin-inline-start: auto;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--muted);
  font-size: 0.82rem;
}

@media (prefers-reduced-motion: no-preference) {
  .timeline-heading-link::after {
    transition: transform 180ms ease-out;
  }

  .timeline-viewport[data-intro] .timeline-article {
    animation: timeline-intro 200ms linear var(--entry-delay) backwards;
  }
}

@keyframes timeline-intro {
  from { opacity: 0; }
}
`

interface Year {
  index: number
  number: string
  count: number
  months: Month[]
}

interface Month {
  index: number
  number: string
  year: Year
  posts: PostMeta[]
}

interface Cursor {
  month: number
  offset: number
}

const monthLabels = 'JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC'.split(' ')
const years: Year[] = []
const months: Month[] = []

for (const post of posts) {
  const [yearNumber, monthNumber] = post.createdDate.split('-', 2)
  let year = years.at(-1)
  if (year?.number !== yearNumber) {
    year = { index: years.length, number: yearNumber, count: 0, months: [] }
    years.push(year)
  }
  let month = year.months.at(-1)
  if (month?.number !== monthNumber) {
    month = { index: months.length, number: monthNumber, year, posts: [] }
    year.months.push(month)
    months.push(month)
  }
  month.posts.push(post)
  year.count++
}

const firstCursor: Cursor = { month: 0, offset: 0 }
const yearKey = (year: Year) => `timeline-year-${year.number}`
const monthKey = (month: Month) =>
  `timeline-month-${month.year.number}-${month.number}`
const monthKeyForDate = (date: string) => `timeline-month-${date.slice(0, 7)}`
const monthLabel = (month: Month) =>
  monthLabels[Number(month.number) - 1] ?? month.number
const targets = new Map<string, Cursor>()

for (const year of years) {
  targets.set(yearKey(year), { month: year.months[0].index, offset: 0 })
}
for (const month of months) {
  targets.set(monthKey(month), { month: month.index, offset: 0 })
}

function capacity(month: Month, height: number) {
  const minimum = row.year + row.month + row.post + row.gap
  const previousYear = month.year.index > 0 && height >= minimum + row.year
  const yearSpace = row.year * (previousYear ? 2 : 1)
  const previousMonth =
    month.index > month.year.months[0].index &&
    height >= yearSpace + 2 * row.month + row.post + row.gap
  const headingSpace = yearSpace + row.month * (previousMonth ? 2 : 1)

  return {
    previousYear,
    previousMonth,
    rows: Math.max(
      1,
      Math.floor((height - headingSpace - row.gap + 0.01) / row.post),
    ),
  }
}

function visibleArchive(cursor: Cursor, height: number) {
  const visibleYears: Year[] = []
  const visibleMonths = new Map<Year, Month[]>()
  const visiblePosts = new Map<Month, PostMeta[]>()
  const active = months[cursor.month]
  if (!active)
    return { years: visibleYears, months: visibleMonths, posts: visiblePosts }

  const room = capacity(active, height)
  let remaining = Math.max(height, row.year + row.month + row.post + row.gap)
  if (room.previousYear) {
    visibleYears.push(years[active.year.index - 1])
    remaining -= row.year
  }

  for (const year of years.slice(active.year.index)) {
    if (remaining + 0.01 < row.year + row.month + row.post + row.gap) break
    visibleYears.push(year)
    const displayed: Month[] = []
    visibleMonths.set(year, displayed)
    remaining -= row.year
    if (year === active.year && room.previousMonth) {
      displayed.push(months[active.index - 1])
      remaining -= row.month
    }

    for (const month of year.months) {
      if (month.index < active.index) continue
      const count = Math.floor(
        (remaining - row.month - row.gap + 0.01) / row.post,
      )
      if (count < 1) break

      const offset = month === active ? cursor.offset : 0
      const articles = month.posts.slice(offset, offset + count)
      displayed.push(month)
      visiblePosts.set(month, articles)
      remaining -= row.month + row.gap + articles.length * row.post
    }
  }

  return { years: visibleYears, months: visibleMonths, posts: visiblePosts }
}

export default function TimelinePage() {
  document.title = `时间线 | ${authorName}`

  const location = useLocation()
  const navigate = useNavigate()
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const [intro, setIntro] = createSignal(true)
  const [cursor, setCursor] = createSignal(firstCursor)
  const [height, setHeight] = createSignal(
    row.year + row.month + row.post + row.gap,
  )
  const view = createMemo(() => visibleArchive(cursor(), height()))
  const introDelays = createMemo(() => {
    if (!intro()) return new Map<PostMeta, string>()

    const articles = [...view().posts.values()].flat()
    const interval = Math.min(30, 270 / Math.max(1, articles.length - 1))
    return new Map(
      articles.map((post, index) => [post, `${index * interval}ms`]),
    )
  })
  let viewport!: HTMLElement
  let wheelDistance = 0
  let lastWheelAt = 0
  let transition: AbortController | undefined
  let queuedTarget: Cursor | undefined

  function move(target: Cursor, animate = true) {
    if (transition) {
      queuedTarget = target
      return
    }
    const current = cursor()
    if (target.month === current.month && target.offset === current.offset)
      return

    setIntro(false)
    const focused = document.activeElement
    const commit = () => {
      setCursor(target)
      // Solid may batch rendering when a hash changes.
      queueMicrotask(() => {
        if (viewport.isConnected && focused && !focused.isConnected)
          viewport.focus({ preventScroll: true })
      })
    }
    if (!animate || motion.matches || typeof viewport.animate !== 'function') {
      commit()
      return
    }

    const movingUp =
      target.month < current.month ||
      (target.month === current.month && target.offset < current.offset)
    const running = new AbortController()
    transition = running
    const finish = () => {
      if (transition !== running) return
      transition = undefined
      const next = queuedTarget
      queuedTarget = undefined
      if (next) move(next)
    }
    void animateTimeline(viewport, commit, movingUp, running.signal).then(
      finish,
      finish,
    )
  }

  function step(direction: number) {
    if (transition) return
    const { month: index, offset } = cursor()
    const month = months[index]
    if (!month) return

    const count = capacity(month, height()).rows
    if (direction > 0 && offset + count < month.posts.length) {
      move({ month: index, offset: offset + count })
    } else if (direction < 0 && offset > 0) {
      move({ month: index, offset: Math.max(0, offset - count) })
    } else {
      const destination = months[index + direction]
      if (!destination) return
      const pageSize = capacity(destination, height()).rows
      const lastOffset =
        Math.floor((destination.posts.length - 1) / pageSize) * pageSize
      move({ month: destination.index, offset: direction > 0 ? 0 : lastOffset })
    }
  }

  function onWheel(event: WheelEvent) {
    if (
      event.ctrlKey ||
      !event.deltaY ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
    )
      return
    event.preventDefault()
    if (transition) return

    const now = performance.now()
    const direction = Math.sign(event.deltaY)
    if (
      now - lastWheelAt > wheelIdle ||
      Math.sign(wheelDistance) !== direction
    ) {
      wheelDistance = 0
    }
    lastWheelAt = now
    const unit =
      event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? viewport.clientHeight
          : 1
    wheelDistance += event.deltaY * unit
    if (Math.abs(wheelDistance) < wheelThreshold) return

    wheelDistance = 0
    step(direction)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault()
      step(1)
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault()
      step(-1)
    }
  }

  function jump(event: MouseEvent, key: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return
    event.preventDefault()
    wheelDistance = 0
    const hash = `#${key}`
    if (location.hash === hash) {
      const target = targets.get(key)
      if (target) move(target)
    } else {
      navigate(`${location.pathname}${location.search}${hash}`, {
        resolve: false,
        scroll: false,
      })
    }
  }

  createEffect(
    on(
      () => location.hash,
      (hash, previous) => {
        const datePrefix = '#timeline-date-'
        const key = hash.startsWith(datePrefix)
          ? monthKeyForDate(hash.slice(datePrefix.length))
          : hash.slice(1)
        const target = hash ? targets.get(key) : firstCursor
        if (target) move(target, previous !== undefined)
      },
    ),
  )

  onMount(() => {
    const measure = () => {
      const rem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      )
      setHeight(viewport.clientHeight / rem)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    viewport.addEventListener('wheel', onWheel, { passive: false })
    onCleanup(() => {
      transition?.abort()
      transition = undefined
      queuedTarget = undefined
      observer.disconnect()
      viewport.removeEventListener('wheel', onWheel)
    })
  })

  return (
    <section class="viewport-page timeline-page">
      <style>{styles}</style>
      <header class="timeline-summary">
        <h1>
          <strong>{posts.length}</strong> 篇文章
        </h1>
      </header>
      <ActivityHeatmap
        posts={posts}
        hrefForDate={(date) => `#${monthKeyForDate(date)}`}
        onDateClick={(date, event) => jump(event, monthKeyForDate(date))}
      />
      <section
        ref={viewport}
        class="timeline-viewport"
        data-intro={intro() ? '' : undefined}
        aria-label="文章时间线"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <Show when={years.length} fallback={<p class="muted">暂无文章。</p>}>
          <For each={view().years}>
            {(year) => (
              <section
                class="timeline-year"
                data-year={year.number}
                data-folded={view().months.has(year) ? undefined : ''}
              >
                <h2
                  class="timeline-year-heading"
                  data-timeline-motion={yearKey(year)}
                  data-folded={view().months.has(year) ? undefined : ''}
                >
                  <a
                    class="timeline-heading-link"
                    href={`#${yearKey(year)}`}
                    target="_self"
                    aria-current={
                      months[cursor().month]?.year === year
                        ? 'location'
                        : undefined
                    }
                    onClick={(event) => jump(event, yearKey(year))}
                  >
                    {year.number}
                    <span>{year.count} 篇</span>
                  </a>
                </h2>
                <Show when={view().months.get(year)}>
                  {(yearMonths) => (
                    <div class="timeline-months">
                      <For each={yearMonths()}>
                        {(month) => (
                          <section
                            class="timeline-month"
                            data-month={month.number}
                            data-folded={
                              view().posts.has(month) ? undefined : ''
                            }
                          >
                            <h3
                              class="timeline-month-heading"
                              data-timeline-motion={monthKey(month)}
                              data-folded={
                                view().posts.has(month) ? undefined : ''
                              }
                            >
                              <a
                                class="timeline-heading-link"
                                href={`#${monthKey(month)}`}
                                target="_self"
                                aria-label={`${year.number} 年 ${month.number} 月`}
                                aria-current={
                                  months[cursor().month] === month
                                    ? 'location'
                                    : undefined
                                }
                                onClick={(event) =>
                                  jump(event, monthKey(month))
                                }
                              >
                                {monthLabel(month)}
                              </a>
                            </h3>
                            <Show when={view().posts.get(month)}>
                              {(articles) => (
                                <ul class="timeline-list">
                                  <For each={articles()}>
                                    {(post) => {
                                      const day = post.createdDate.slice(0, 10)
                                      return (
                                        <li
                                          class="timeline-article"
                                          data-timeline-motion={`post:${post.fileName}`}
                                          style={{
                                            '--entry-delay':
                                              introDelays().get(post),
                                          }}
                                        >
                                          <A
                                            href={postPath(post.fileName)}
                                            class="timeline-link"
                                          >
                                            <time dateTime={day}>
                                              {day.slice(8)}
                                            </time>
                                            <span class="timeline-link-title">
                                              {post.title}
                                            </span>
                                            <span
                                              class="timeline-link-category"
                                              title={post.category}
                                            >
                                              # {post.category}
                                            </span>
                                          </A>
                                        </li>
                                      )
                                    }}
                                  </For>
                                </ul>
                              )}
                            </Show>
                          </section>
                        )}
                      </For>
                    </div>
                  )}
                </Show>
              </section>
            )}
          </For>
        </Show>
      </section>
    </section>
  )
}
