export interface PostMeta {
  title: string
  date: string
  /** Markdown file name without the .md extension. */
  fileName: string
  description: string
}

export interface RenderedPost {
  meta: PostMeta
  html: string
  headings: PostHeading[]
}

export interface PostHeading {
  id: string
  title: string
  level: number
}

export type PostLoader = () => Promise<{ default: RenderedPost }>
