import { A } from '@solidjs/router'
import { For, Show } from 'solid-js'
import posts from 'virtual:blog/posts'
import { authorName } from '@/blog.config.json'
import ActivityHeatmap from '@/src/components/ActivityHeatmap.tsx'
import { postPath } from '@/src/post-path.ts'
import type { PostMeta } from '@/src/types/post.ts'

const styles = /* css */ `
.timeline-page {
  max-width: var(--reading-width);
  margin-inline: auto;
  --entry-duration: 260ms;
}

.timeline-summary h1 {
  display: flex;
  align-items: baseline;
  gap: 0.55rem;
  margin: 0;
  color: var(--muted);
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

.timeline-year {
  margin-top: 2.75rem;
}

.timeline-year h2 {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  margin: 0;
  line-height: 1.2;
  font-weight: 400;
  font-size: 2rem;
}

.timeline-year h2 span {
  color: var(--muted);
  font-size: 0.85rem;
}

.timeline-month {
  margin-top: 1.35rem;
}

.timeline-month h3 {
  margin: 0 0 0.4rem;
  color: var(--muted);
  font-size: 0.85rem;
}

.timeline-month ul {
  position: relative;
  list-style: none;
  margin: 0;
  padding: 0;
  border-inline-start: 1px solid transparent;
}

.timeline-month ul::before {
  position: absolute;
  inset-block: 0;
  inset-inline-start: -1px;
  width: 1px;
  background: var(--line);
  content: '';
  pointer-events: none;
  transform-origin: top;
}

.timeline-month li[id] {
  scroll-margin-block-start: 3rem;
}

.timeline-link {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  padding: 0.27rem 0 0.27rem 1.1rem;
  text-decoration: none;
}

.timeline-link::before {
  position: absolute;
  inset-inline-start: -3px;
  top: calc(50% - 2px);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--muted);
  content: '';
}

.timeline-link time {
  color: var(--muted);
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
  flex: 0 0 2ch;
}

.timeline-link-title,
.timeline-link-category {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.timeline-link-title {
  position: relative;
}

.timeline-link-category {
  margin-inline-start: auto;
  max-inline-size: 35%;
  flex-shrink: 0;
  color: var(--muted);
  font-size: 0.82rem;
}

.timeline-link-title::after {
  position: absolute;
  inset-inline: 0;
  inset-block-end: 0;
  height: 1px;
  background: currentColor;
  content: '';
  transform: scale(0, 0.8);
}

.timeline-link:is(:hover, :focus-visible) .timeline-link-title::after {
  transform: scale(1, 0.8);
}

@media (prefers-reduced-motion: no-preference) {
  .timeline-month ul::before {
    animation: timeline-track calc(var(--entry-duration) + var(--line-stagger))
      cubic-bezier(0.22, 1, 0.36, 1) var(--entry-delay) both;
  }

  .timeline-month li {
    animation: timeline-entry var(--entry-duration) ease-out var(--entry-delay) both;
  }

  .timeline-link-title::after {
    transition: transform 180ms ease-out;
  }
}

@keyframes timeline-track {
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
}

@keyframes timeline-entry {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
}
`

interface Month {
  number: string
  firstIndex: number
  posts: PostMeta[]
}

interface Year {
  count: number
  months: Month[]
}

const monthNames = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]

const years = new Map<string, Year>()
for (const [index, post] of posts.entries()) {
  const [year, number] = post.date.split('-')
  const group = years.get(year) ?? { count: 0, months: [] }
  years.set(year, group)
  let month = group.months.at(-1)
  if (month?.number !== number) {
    month = { number, firstIndex: index, posts: [] }
    group.months.push(month)
  }
  month.posts.push(post)
  group.count++
}

const entryDelay = (index: number) => Math.min(36 * index, 420)
const dateTarget = (date: string) => `timeline-date-${date}`

export default function TimelinePage() {
  document.title = `时间线 | ${authorName}`

  return (
    <section class="page-content timeline-page">
      <style>{styles}</style>
      <header class="timeline-summary">
        <h1>
          <strong>{posts.length}</strong> 篇文章
        </h1>
      </header>
      <ActivityHeatmap
        posts={posts}
        hrefForDate={(date) => `#${dateTarget(date)}`}
      />
      <Show when={years.size} fallback={<p class="muted">暂无文章。</p>}>
        <For each={[...years]}>
          {([year, group]) => (
            <section class="timeline-year">
              <h2>
                {year}
                <span>{group.count} 篇</span>
              </h2>
              <For each={group.months}>
                {(month) => (
                  <section class="timeline-month">
                    <h3>
                      {monthNames[Number(month.number) - 1] ?? month.number}
                    </h3>
                    <ul
                      style={{
                        '--entry-delay': `${entryDelay(month.firstIndex)}ms`,
                        '--line-stagger': `${entryDelay(month.firstIndex + month.posts.length - 1) - entryDelay(month.firstIndex)}ms`,
                      }}
                    >
                      <For each={month.posts}>
                        {(post, index) => (
                          <li
                            id={
                              month.posts[index() - 1]?.date === post.date
                                ? undefined
                                : dateTarget(post.date)
                            }
                            style={{
                              '--entry-delay': `${entryDelay(month.firstIndex + index())}ms`,
                            }}
                          >
                            <A
                              href={postPath(post.fileName)}
                              class="timeline-link"
                            >
                              <time dateTime={post.date}>
                                {post.date.slice(8)}
                              </time>
                              <span
                                class="timeline-link-title"
                                title={post.title}
                              >
                                {post.title}
                              </span>
                              <span
                                class="timeline-link-category"
                                title={post.category}
                              >
                                {post.category}
                              </span>
                            </A>
                          </li>
                        )}
                      </For>
                    </ul>
                  </section>
                )}
              </For>
            </section>
          )}
        </For>
      </Show>
    </section>
  )
}
