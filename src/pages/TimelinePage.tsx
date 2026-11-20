import { A } from '@solidjs/router'
import { For, Show } from 'solid-js'
import posts from 'virtual:blog/posts'
import { siteName } from '@/blog.config.json'
import { postPath } from '@/src/post-path.ts'
import type { PostMeta } from '@/src/types/post.ts'

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
    <section class="page-content timeline">
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
