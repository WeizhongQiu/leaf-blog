import { useParams } from '@solidjs/router'
import { createEffect, createMemo, createResource, Show } from 'solid-js'
import type { ParentProps } from 'solid-js'
import loaders from 'virtual:blog/loaders'
import { authorName } from '@/src/blog-config.ts'
import MarkdownBody from '@/src/components/MarkdownBody.tsx'
import OutlineIcon, { categoryIconPath } from '@/src/components/OutlineIcon.tsx'
import PostContents from '@/src/components/PostContents.tsx'
import NotFoundPage from '@/src/pages/NotFoundPage.tsx'
import type { PostLoader, RenderedPost } from '@/src/types/post.ts'

const styles = /* css */ `
.post-header {
  width: 100%;
  max-width: var(--reading-width);
  min-width: 0;
  margin-bottom: 2.6rem;
}

.post-header .page-title {
  font-family: var(--display-font);
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  margin: 0.8rem 0 0;
  color: var(--muted);
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
}

.post-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  min-width: 0;
  overflow-wrap: anywhere;
}

.post-meta-item svg {
  flex: none;
  width: 0.95rem;
  height: 0.95rem;
}

.post-meta-item time {
  white-space: nowrap;
}

.post-meta-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.post-layout {
  display: flex;
  align-items: flex-start;
  gap: 3rem;
}
`

const createdIcon =
  'M21 10H3M8 2v4m8-4v4M12 14v4m-2-2h4M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z'
const modifiedIcon =
  'M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z'
const wordCountIcon =
  'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v4a2 2 0 0 0 2 2h4M8 10h2m-2 4h8m-8 4h8'

function PostMetaItem(props: ParentProps<{ icon: string; label: string }>) {
  return (
    <span class="post-meta-item" title={props.label}>
      <OutlineIcon path={props.icon} />
      <span class="post-meta-label">{props.label} </span>
      {props.children}
    </span>
  )
}

function ReadingView(props: { post: RenderedPost }) {
  createEffect(() => {
    document.title = `${props.post.meta.title} | ${authorName}`
  })

  return (
    <div class="page-content">
      <style>{styles}</style>
      <header class="post-header">
        <h1 class="page-title">{props.post.meta.title}</h1>
        <p class="post-meta">
          <PostMetaItem icon={createdIcon} label="创建日期">
            <time dateTime={props.post.meta.createdDate}>
              {props.post.meta.createdDate.slice(0, 10)}
            </time>
          </PostMetaItem>
          <PostMetaItem icon={modifiedIcon} label="修改日期">
            <time dateTime={props.post.meta.modifiedDate}>
              {props.post.meta.modifiedDate.slice(0, 10)}
            </time>
          </PostMetaItem>
          <PostMetaItem icon={wordCountIcon} label="字数">
            {props.post.wordCount.toLocaleString('zh-CN')}
          </PostMetaItem>
          <PostMetaItem icon={categoryIconPath} label="分类">
            {props.post.meta.category}
          </PostMetaItem>
        </p>
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
