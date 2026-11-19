import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import blogConfig from './blog.config.json' with { type: 'json' }
import { scanPostMetadata } from './build/content/metadata.ts'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    solid(),
    {
      name: 'leaf-blog:validate-post-metadata',
      apply: 'build',
      buildStart() {
        const { postsDirectory } = blogConfig
        if (typeof postsDirectory !== 'string' || !postsDirectory.trim()) {
          throw new Error(
            'blog.config.json: "postsDirectory" must be a non-empty path.',
          )
        }
        scanPostMetadata(resolve(import.meta.dirname, postsDirectory))
      },
    },
  ],
})
