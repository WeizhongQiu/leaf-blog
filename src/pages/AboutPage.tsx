import html from 'virtual:blog/about'
import { siteName } from '@/blog.config.json'
import MarkdownBody from '@/src/components/MarkdownBody.tsx'

export default function AboutPage() {
  document.title = `About | ${siteName}`

  return (
    <div class="page-content">
      <MarkdownBody html={html} />
    </div>
  )
}
