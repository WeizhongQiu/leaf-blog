import { useLocation, useNavigate } from '@solidjs/router'
import { onMount } from 'solid-js'
import posts from 'virtual:blog/posts'
import { isPageEnabled } from '@/src/blog-config.ts'
import { postPath } from '@/src/post-path.ts'

const emptyFallback = isPageEnabled('timeline') ? '/timeline' : '/'

export default function RandomPage() {
  const location = useLocation<{ from?: string }>()
  const navigate = useNavigate()

  onMount(() => {
    const from = location.state?.from
    const pool =
      posts.length > 1
        ? posts.filter((post) => postPath(post.fileName) !== from)
        : posts
    const post = pool[Math.floor(Math.random() * pool.length)]
    navigate(post ? postPath(post.fileName) : emptyFallback, { replace: true })
  })

  return null
}
