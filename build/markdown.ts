import { tex } from '@mdit/plugin-tex'
import { fromHighlighter } from '@shikijs/markdown-it'
import { renderToString } from 'katex'
import MarkdownIt from 'markdown-it'
import { createHighlighter } from 'shiki'
import type { RenderedPost } from '@/src/types/post.ts'
import { readPost, type PostSource } from './metadata.ts'

const theme = 'github-light'
const plainTextLanguages = new Set(['text', 'txt', 'plain', 'plaintext'])

async function createMarkdownRenderer() {
  const highlighter = await createHighlighter({
    themes: [theme],
    langs: [
      'c',
      'cpp',
      'css',
      'diff',
      'go',
      'html',
      'java',
      'javascript',
      'json',
      'jsx',
      'markdown',
      'python',
      'rust',
      'shellscript',
      'sql',
      'toml',
      'tsx',
      'typescript',
      'vue',
      'yaml',
    ],
  })

  const markdown = new MarkdownIt({ html: false })
  markdown.use(fromHighlighter(highlighter, { theme }))

  const languages = new Set(highlighter.getLoadedLanguages())
  const highlight = markdown.options.highlight
  markdown.options.highlight = (code, language, attrs) => {
    const normalized = language.toLowerCase()
    return highlight && languages.has(normalized)
      ? highlight(code, normalized, attrs)
      : ''
  }

  markdown.core.ruler.after(
    'block',
    'warn-about-code-language',
    ({ tokens, env }) => {
      if (typeof env.warn !== 'function') return

      for (const token of tokens) {
        if (token.type !== 'fence') continue

        const label = markdown.utils
          .unescapeAll(token.info)
          .trim()
          .split(/\s+/, 1)[0]
        const language = label.toLowerCase()
        if (
          language &&
          !languages.has(language) &&
          !plainTextLanguages.has(language)
        ) {
          env.warn(
            `Unsupported code language ${JSON.stringify(label)}. Rendering as plain text.`,
          )
        }
      }
    },
  )

  markdown.use(tex, {
    delimiters: 'dollars',
    render: (source: string, displayMode: boolean) =>
      renderToString(source, {
        displayMode,
        strict: 'ignore',
        throwOnError: true,
        trust: false,
      }),
  })

  return markdown
}

let renderer: ReturnType<typeof createMarkdownRenderer> | undefined

export async function renderPost(
  post: PostSource,
  warn: (message: string) => void,
): Promise<RenderedPost> {
  const { meta, body } = readPost(post)
  try {
    const markdown = await (renderer ??= createMarkdownRenderer())
    const html = markdown.render(body, {
      warn: (message: string) => warn(`${post.relativePath} [code] ${message}`),
    })
    return { meta, html }
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    throw new Error(`${post.relativePath} [Markdown] ${reason}`, { cause })
  }
}
