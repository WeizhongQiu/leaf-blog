import '@fontsource-variable/noto-sans-sc'
import { A } from '@solidjs/router'
import { authorName } from '@/src/blog-config.ts'

export default function NotFoundPage() {
  document.title = `页面未找到 | ${authorName}`

  return (
    <section class="page-content">
      <h1>页面未找到</h1>
      <A href="/">返回首页</A>
    </section>
  )
}
