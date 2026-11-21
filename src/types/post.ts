export interface PostMeta {
  title: string
  date: string
  modifiedDate: string
  /** Markdown file name without the .md extension. */
  fileName: string
  description: string
  category: string
}

export interface RenderedPost {
  meta: PostMeta
  html: string
  headings: PostHeading[]
  wordCount: number
}

export interface PostHeading {
  id: string
  title: string
  level: number
}

export type PostLoader = () => Promise<{ default: RenderedPost }>
