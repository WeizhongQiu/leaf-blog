import { tex } from '@mdit/plugin-tex'
import { fromHighlighter } from '@shikijs/markdown-it'
import { renderToString } from 'katex'
import MarkdownIt from 'markdown-it'
import { createHighlighter } from 'shiki'
import type { RenderedPost } from '@/src/types/post.ts'
import type { PostSource } from './metadata.ts'

const theme = 'github-light'
const plainTextLanguages = new Set(['text', 'txt', 'plain', 'plaintext'])
const wordSegmenter = new Intl.Segmenter('en', { granularity: 'word' })
const urlPattern = /\b(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>()，。；：！？、]+/giu
const codeCopyButton = `<button type="button" class="code-copy">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path data-icon="copy" d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 0h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"/>
    <path data-icon="copied" d="m5 12 4 4L19 6"/>
    <path data-icon="failed" d="m7 7 10 10M17 7 7 17"/>
  </svg>
  <span class="code-copy-label" aria-live="polite">Copy code</span>
</button>`

type ArticleDetails = Pick<RenderedPost, 'headings' | 'wordCount'>

function countWords(text: string): number {
  let count = 0
  const remaining = text
    .replace(urlPattern, ' ')
    .replace(/\p{Script=Han}/gu, () => {
      count++
      return ' '
    })

  for (const word of wordSegmenter.segment(remaining)) {
    if (word.isWordLike) count++
  }
  return count
}

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

  for (const rule of ['fence', 'code_block']) {
    const renderCode = markdown.renderer.rules[rule]
    if (!renderCode) continue
    markdown.renderer.rules[rule] = (...args) =>
      `<div class="markdown-code">${codeCopyButton}${renderCode(...args)}</div>\n`
  }

  markdown.core.ruler.after('inline', 'post-details', ({ tokens, env }) => {
    const details = env.details as ArticleDetails | undefined
    if (!details) return

    const { headings } = details
    const ids = new Set<string>()
    for (const [index, token] of tokens.entries()) {
      if (token.type === 'inline') {
        const text = (token.children ?? [])
          .map((child, childIndex, children) => {
            if (child.type === 'text' || child.type === 'text_special') {
              const previous = children[childIndex - 1]
              return previous?.type === 'link_open' &&
                previous.markup === 'autolink'
                ? ' '
                : child.content
            }
            return child.nesting === 0 ? ' ' : ''
          })
          .join('')
        details.wordCount += countWords(text)
      }

      if (token.type !== 'heading_open') continue
      const inline = tokens[index + 1]
      const title = (inline.children ?? [])
        .map((child) => child.content)
        .join('')
      const slug = title
        .toLowerCase()
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
        .replace(/^-|-$/g, '')
      const base = `section-${slug || headings.length + 1}`
      let id = base
      for (let suffix = 2; ids.has(id); suffix++) id = `${base}-${suffix}`
      ids.add(id)
      token.attrSet('id', id)
      headings.push({
        id,
        title: title.trim() || id,
        level: Number(token.tag[1]),
      })
    }
  })

  return markdown
}

let renderer: ReturnType<typeof createMarkdownRenderer> | undefined

export async function renderMarkdown(
  body: string,
  path: string,
  warn: (message: string) => void,
  details?: ArticleDetails,
): Promise<string> {
  try {
    const markdown = await (renderer ??= createMarkdownRenderer())
    return markdown.render(body, {
      details,
      warn: (message: string) => warn(`${path} [code] ${message}`),
    })
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause)
    throw new Error(`${path} [Markdown] ${reason}`, { cause })
  }
}

export async function renderPost(
  { meta, body, relativePath }: PostSource,
  warn: (message: string) => void,
): Promise<RenderedPost> {
  const details: ArticleDetails = { headings: [], wordCount: 0 }
  const html = await renderMarkdown(body, relativePath, warn, details)
  return { meta, html, ...details }
}
