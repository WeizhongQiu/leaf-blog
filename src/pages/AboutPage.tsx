import html from 'virtual:blog/about'
import { authorName } from '@/blog.config.json'
import MarkdownBody from '@/src/components/MarkdownBody.tsx'

export default function AboutPage() {
  document.title = `About | ${authorName}`

  return (
    <div class="page-content">
      <MarkdownBody html={html} />
    </div>
  )
}
