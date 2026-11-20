declare module 'virtual:blog/posts' {
  const posts: import('@/src/types/post.ts').PostMeta[]
  export default posts
}

declare module 'virtual:blog/loaders' {
  const loaders: Partial<
    Record<string, import('@/src/types/post.ts').PostLoader>
  >
  export default loaders
}

declare module 'virtual:blog/post/*.md?blog' {
  const post: import('@/src/types/post.ts').RenderedPost
  export default post
}

declare module 'virtual:blog/about' {
  const html: string
  export default html
}
