import loaders from 'virtual:blog/loaders'
import type { PostLoader, RenderedPost } from '@/src/types/post.ts'

const postRequests = new WeakMap<PostLoader, Promise<RenderedPost>>()

export function getPostLoader(fileName: string | undefined) {
  if (fileName === undefined) return undefined

  try {
    return loaders[decodeURIComponent(fileName)]
  } catch (cause) {
    if (cause instanceof URIError) return undefined
    throw cause
  }
}

export function loadPost(loader: PostLoader) {
  const cached = postRequests.get(loader)
  if (cached) return cached

  const request = loader()
    .then(({ default: post }) => post)
    .catch((cause) => {
      postRequests.delete(loader)
      throw cause
    })
  postRequests.set(loader, request)
  return request
}
