import { isAbsolute, relative, sep } from 'node:path'
import type { EnvironmentModuleNode, Plugin } from 'vite'
import type { RenderedPost } from '@/src/types/post.ts'
import { renderPost } from './markdown.ts'
import { markdownExtension, postFileName, scanPosts } from './metadata.ts'

const postsModule = 'virtual:blog/posts'
const loadersModule = 'virtual:blog/loaders'
const postModulePrefix = 'virtual:blog/post/'
const postQuery = '?blog'

function resolveVirtualId(id: string): string {
  return `\0${id}`
}

function postModuleId(fileName: string): string {
  // Keep arbitrary file names independent of browser URL and query syntax.
  const key = Buffer.from(fileName).toString('base64url')
  return `${postModulePrefix}${key}${markdownExtension}`
}

function indexPosts(directory: string) {
  const posts = scanPosts(directory)
  const modules = new Map(
    posts.map((post) => [
      resolveVirtualId(postModuleId(post.meta.fileName)),
      post,
    ]),
  )
  return { posts, modules }
}

export function blogContent(directory: string): Plugin {
  let index: ReturnType<typeof indexPosts> | undefined
  const getIndex = () => (index ??= indexPosts(directory))
  const builtPosts = new Map<string, RenderedPost>()

  return {
    name: 'leaf-blog:content',

    applyToEnvironment(environment) {
      return environment.name === 'client'
    },

    async buildStart() {
      index = undefined
      builtPosts.clear()
      const { modules } = getIndex()
      if (this.environment.mode === 'build') {
        // Validate all articles even before a page references the loaders.
        for (const [id, post] of modules) {
          this.addWatchFile(post.filePath)
          builtPosts.set(
            id,
            await renderPost(post, (message) => this.warn(message)),
          )
        }
      }
    },

    resolveId(id) {
      if (id === postsModule || id === loadersModule)
        return resolveVirtualId(id)
      if (
        id.startsWith(postModulePrefix) &&
        id.endsWith(`${markdownExtension}${postQuery}`)
      ) {
        return resolveVirtualId(id.slice(0, -postQuery.length))
      }
    },

    async load(id) {
      if (id === resolveVirtualId(postsModule)) {
        return `export default ${JSON.stringify(getIndex().posts.map(({ meta }) => meta))};`
      }

      if (id === resolveVirtualId(loadersModule)) {
        const entries = getIndex().posts.map(({ meta: { fileName } }) => {
          const importId = `${postModuleId(fileName)}${postQuery}`
          return `[${JSON.stringify(fileName)}]: () => import(${JSON.stringify(importId)})`
        })
        return `export default Object.assign(Object.create(null), {${entries.join(',')}});`
      }

      if (!id.startsWith(resolveVirtualId(postModulePrefix))) return

      const post = getIndex().modules.get(id)
      if (!post) this.error(`Unknown article module: ${id.slice(1)}.`)

      this.addWatchFile(post.filePath)
      const rendered =
        builtPosts.get(id) ??
        (await renderPost(post, (message) => this.warn(message)))
      return `export default ${JSON.stringify(rendered)};`
    },

    configureServer(server) {
      server.watcher.add(directory)
    },

    hotUpdate({ file, timestamp }) {
      const path = relative(directory, file)
      if (
        !path.endsWith(markdownExtension) ||
        isAbsolute(path) ||
        path.startsWith(`..${sep}`)
      )
        return

      index = undefined
      const graph = this.environment.moduleGraph
      const seen = new Set<EnvironmentModuleNode>()
      for (const id of [
        postsModule,
        loadersModule,
        postModuleId(postFileName(path)),
      ]) {
        const module = graph.getModuleById(resolveVirtualId(id))
        if (module) graph.invalidateModule(module, seen, timestamp, true)
      }

      this.environment.hot.send({ type: 'full-reload', path: '*' })
      return []
    },
  }
}
