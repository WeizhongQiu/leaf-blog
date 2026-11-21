import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import blogConfig from './blog.config.json' with { type: 'json' }
import { blogContent } from './build/plugin.ts'

const { postsDirectory } = blogConfig
const aboutFile = 'aboutFile' in blogConfig ? blogConfig.aboutFile : undefined
if (typeof postsDirectory !== 'string' || !postsDirectory.trim()) {
  throw new Error(
    'blog.config.json: "postsDirectory" must be a non-empty path.',
  )
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    solid(),
    blogContent(
      resolve(import.meta.dirname, postsDirectory),
      resolve(
        import.meta.dirname,
        (typeof aboutFile === 'string' && aboutFile.trim()) || 'ABOUT.md',
      ),
    ),
  ],
})
