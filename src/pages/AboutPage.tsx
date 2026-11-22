import '@fontsource-variable/noto-sans-sc'
import html from 'virtual:blog/about'
import { authorName } from '@/src/blog-config.ts'
import MarkdownBody from '@/src/components/MarkdownBody.tsx'

export default function AboutPage() {
  document.title = `About | ${authorName}`

  return (
    <div class="page-content">
      <MarkdownBody html={html} />
    </div>
  )
}
