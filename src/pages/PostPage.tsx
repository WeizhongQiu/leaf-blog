import { useParams } from '@solidjs/router'
import { createEffect, createMemo, createResource, Show } from 'solid-js'
import loaders from 'virtual:blog/loaders'
import { siteName } from '@/blog.config.json'
import MarkdownBody from '@/src/components/MarkdownBody.tsx'
import PostContents from '@/src/components/PostContents.tsx'
import NotFoundPage from '@/src/pages/NotFoundPage.tsx'
import type { PostLoader, RenderedPost } from '@/src/types/post.ts'

function ReadingView(props: { post: RenderedPost }) {
  createEffect(() => {
    document.title = `${props.post.meta.title} | ${siteName}`
  })

  return (
    <div class="page-content">
      <header class="post-header reading-column">
        <h1 class="page-title">{props.post.meta.title}</h1>
        <time class="muted" dateTime={props.post.meta.date}>
          {props.post.meta.date}
        </time>
      </header>
      <div class="post-layout">
        <MarkdownBody html={props.post.html} />
        <Show when={props.post.headings.length}>
          <PostContents headings={props.post.headings} />
        </Show>
      </div>
    </div>
  )
}

function LoadPost(props: { load: PostLoader }) {
  const [post, { refetch }] = createResource(
    async () => (await props.load()).default,
  )

  return (
    <Show
      when={!post.error}
      fallback={
        <div class="page-content">
          <p role="alert">Could not load the article.</p>
          <button onClick={() => void refetch()}>Retry</button>
        </div>
      }
    >
      <Show
        when={post()}
        keyed
        fallback={
          <p class="page-content muted" role="status">
            正在加载文章…
          </p>
        }
      >
        {(article) => <ReadingView post={article} />}
      </Show>
    </Show>
  )
}

export default function PostPage() {
  const params = useParams<{ fileName: string }>()
  const loader = createMemo(() => {
    try {
      return loaders[decodeURIComponent(params.fileName)]
    } catch (cause) {
      if (cause instanceof URIError) return undefined
      throw cause
    }
  })

  return (
    <Show when={loader()} keyed fallback={<NotFoundPage />}>
      {(load) => <LoadPost load={load} />}
    </Show>
  )
}
