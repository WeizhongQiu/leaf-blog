import { authorName } from '@/blog.config.json'

export default function CategoriesPage() {
  document.title = `分类 | ${authorName}`

  return <section class="page-content" aria-label="分类" />
}
