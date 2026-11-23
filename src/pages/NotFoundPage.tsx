import { A, useBeforeLeave, useNavigate } from '@solidjs/router'
import { onCleanup, onMount } from 'solid-js'
import { authorName, page } from '@/src/blog-config.ts'
import '@/src/styles/page-intro.css'

const styles = /* css */ `
.not-found-page .page-intro-title {
  color: color-mix(in srgb, var(--muted) 25%, var(--paper));
}

.not-found-page .page-intro-subtitle {
  visibility: hidden;
}

.not-found-page a {
  text-decoration: none;
}
`

const message =
  page.notfound?.message?.trim() || '暂时找不到这一页，回首页看看吧。'

export default function NotFoundPage() {
  document.title = `页面未找到 | ${authorName}`
  const navigate = useNavigate()

  onMount(() => {
    if (page.notfound?.autoRedirect !== true) return

    const timer = window.setTimeout(
      () => navigate('/', { replace: true }),
      3000,
    )
    const cancel = () => window.clearTimeout(timer)
    useBeforeLeave(cancel)
    onCleanup(cancel)
  })

  return (
    <section class="page-intro not-found-page">
      <style>{styles}</style>
      <div>
        <h1 class="page-intro-title">
          <A href="/" title="返回首页">
            {message}
          </A>
        </h1>
        <p class="page-intro-subtitle" aria-hidden="true">
          {page.homepage.subtitle}
        </p>
      </div>
    </section>
  )
}
