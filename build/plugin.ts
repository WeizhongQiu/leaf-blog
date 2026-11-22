import { readFileSync } from 'node:fs'
import { isAbsolute, relative, sep } from 'node:path'
import type { EnvironmentModuleNode, Plugin } from 'vite'
import type { RenderedPost } from '@/src/types/post.ts'
import { renderMarkdown, renderPost } from './markdown.ts'
import { markdownExtension, postFileName, scanPosts } from './metadata.ts'

const postsModule = 'virtual:blog/posts'
const loadersModule = 'virtual:blog/loaders'
const aboutModule = 'virtual:blog/about'
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

function indexPosts(directory: string, aboutFile: string) {
  const posts = scanPosts(directory, aboutFile)
  const modules = new Map(
    posts.map((post) => [
      resolveVirtualId(postModuleId(post.meta.fileName)),
      post,
    ]),
  )
  return { posts, modules }
}

function readAbout(file: string): string {
  try {
    return readFileSync(file, 'utf8')
  } catch (cause) {
    if ((cause as NodeJS.ErrnoException).code === 'ENOENT') return ''
    throw new Error(`Could not read About file: ${file}.`, { cause })
  }
}

export function blogContent(
  directory: string,
  aboutFile: string,
  showAbout: boolean,
): Plugin {
  let index: ReturnType<typeof indexPosts> | undefined
  const getIndex = () => (index ??= indexPosts(directory, aboutFile))
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
      if (id === postsModule || id === loadersModule || id === aboutModule)
        return resolveVirtualId(id)
      if (
        id.startsWith(postModulePrefix) &&
        id.endsWith(`${markdownExtension}${postQuery}`)
      ) {
        return resolveVirtualId(id.slice(0, -postQuery.length))
      }
    },

    async load(id) {
      if (id === resolveVirtualId(aboutModule)) {
        if (!showAbout) return 'export default "";'

        // The dev watcher can track a missing About file without resolving it as an import.
        if (this.environment.mode === 'build') this.addWatchFile(aboutFile)
        const source = readAbout(aboutFile)
        const html = source
          ? await renderMarkdown(source, aboutFile, (message) =>
              this.warn(message),
            )
          : ''
        return `export default ${JSON.stringify(html)};`
      }

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
      server.watcher.add(showAbout ? [directory, aboutFile] : [directory])
    },

    hotUpdate({ file, timestamp }) {
      const path = relative(directory, file)
      let ids: string[]
      if (relative(aboutFile, file) === '') {
        if (!showAbout) return []
        ids = [aboutModule]
      } else {
        if (
          !path.endsWith(markdownExtension) ||
          isAbsolute(path) ||
          path.startsWith(`..${sep}`)
        )
          return
        index = undefined
        ids = [postsModule, loadersModule, postModuleId(postFileName(path))]
      }

      const graph = this.environment.moduleGraph
      const seen = new Set<EnvironmentModuleNode>()
      for (const id of ids) {
        const module = graph.getModuleById(resolveVirtualId(id))
        if (module) graph.invalidateModule(module, seen, timestamp, true)
      }

      this.environment.hot.send({ type: 'full-reload', path: '*' })
      return []
    },
  }
}
