import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { blogContent } from './build/plugin.ts'
import { isPageEnabled, page } from './src/blog-config.ts'

const { directory } = page.post
const aboutFile = page.about?.file
const showAbout = isPageEnabled('about')
if (typeof directory !== 'string' || !directory.trim()) {
  throw new Error(
    'blog.config.json: "page.post.directory" must be a non-empty path.',
  )
}

export default defineConfig({
  define: {
    __ENABLE_TIMELINE__: isPageEnabled('timeline'),
    __ENABLE_CATEGORIES__: isPageEnabled('categories'),
    __ENABLE_RANDOM__: isPageEnabled('random'),
    __ENABLE_ABOUT__: showAbout,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    {
      name: 'leaf-blog:font-display',
      enforce: 'pre',
      transform(source, id) {
        if (id.endsWith('/@fontsource-variable/noto-sans-sc/index.css')) {
          return source.replaceAll(
            'font-display: swap;',
            'font-display: optional;',
          )
        }
      },
    },
    solid(),
    blogContent(
      resolve(import.meta.dirname, directory),
      resolve(
        import.meta.dirname,
        (typeof aboutFile === 'string' && aboutFile.trim()) || 'ABOUT.md',
      ),
      showAbout,
    ),
  ],
})
