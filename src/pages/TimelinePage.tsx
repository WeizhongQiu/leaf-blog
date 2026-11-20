import { A } from '@solidjs/router'
import { For, Show } from 'solid-js'
import posts from 'virtual:blog/posts'
import { siteName } from '@/blog.config.json'
import { postPath } from '@/src/post-path.ts'
import type { PostMeta } from '@/src/types/post.ts'

const styles = /* css */ `
.timeline-page {
  max-width: var(--reading-width);
}

.timeline-year {
  margin-top: 2.75rem;
}

.timeline-year h2 {
  margin: 0;
  font-family: var(--heading-font);
  line-height: 1.2;
  font-weight: 500;
  font-size: 2rem;
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
  list-style: none;
  margin: 0;
  padding: 0;
  border-inline-start: 1px solid var(--line);
}

.timeline-link {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding: 0.4rem 0 0.4rem 1.1rem;
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
  flex: 0 0 3em;
}

.timeline-link span {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.timeline-link:hover span,
.timeline-link:focus-visible span {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
`

interface Month {
  number: string
  posts: PostMeta[]
}

const years = new Map<string, Month[]>()
for (const post of posts) {
  const [year, number] = post.date.split('-')
  const months = years.get(year) ?? []
  years.set(year, months)
  let month = months.at(-1)
  if (month?.number !== number) {
    month = { number, posts: [] }
    months.push(month)
  }
  month.posts.push(post)
}

export default function TimelinePage() {
  document.title = `时间线 | ${siteName}`

  return (
    <section class="page-content timeline-page">
      <style>{styles}</style>
      <h1 class="page-title">时间线</h1>
      <Show when={years.size} fallback={<p class="muted">暂无文章。</p>}>
        <For each={[...years]}>
          {([year, months]) => (
            <section class="timeline-year">
              <h2>{year}</h2>
              <For each={months}>
                {(month) => (
                  <section class="timeline-month">
                    <h3>{Number(month.number)} 月</h3>
                    <ul>
                      <For each={month.posts}>
                        {(post) => (
                          <li>
                            <A
                              href={postPath(post.fileName)}
                              class="timeline-link"
                            >
                              <time dateTime={post.date}>
                                {post.date.slice(5)}
                              </time>
                              <span title={post.title}>{post.title}</span>
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
