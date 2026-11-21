import 'katex/dist/katex.min.css'
import { onCleanup } from 'solid-js'

const styles = /* css */ `
.markdown-body {
  width: 100%;
  max-width: var(--reading-width);
  min-width: 0;
  font-size: 1.0625rem;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.markdown-body :is(h1, h2, h3, h4, h5, h6) {
  font-weight: 600;
  line-height: 1.35;
  scroll-margin-top: 3rem;
}

.markdown-body :is(h1, h2) {
  font-weight: 400;
}

.markdown-body > :first-child {
  margin-top: 0;
}

.markdown-body img {
  max-width: 100%;
  height: auto;
}

.markdown-code {
  --code-padding-block: 0.45rem;
  --code-line-height: 1.5rem;
  position: relative;
  margin-block: 1em;
  padding-inline-end: 2rem;
}

.markdown-code pre {
  margin: 0;
  padding-block: var(--code-padding-block);
  padding-inline-start: 1rem;
  background: transparent !important; /* Shiki sets an inline background. */
  font-size: 0.875rem;
  line-height: var(--code-line-height);
}

.code-copy {
  position: absolute;
  inset-block-start: var(--code-padding-block);
  inset-inline-end: 0.15rem;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: var(--code-line-height);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
}

.markdown-code:hover .code-copy,
.code-copy:focus-visible {
  opacity: 1;
  pointer-events: auto;
}

.code-copy:is(:hover, :focus-visible) {
  color: var(--ink);
}

.code-copy svg {
  width: 1rem;
  height: 1rem;
  stroke-width: 1.6;
}

.code-copy [data-icon] {
  display: none;
}

.code-copy:not([data-copy-state]) [data-icon='copy'],
.code-copy[data-copy-state='copied'] [data-icon='copied'],
.code-copy[data-copy-state='failed'] [data-icon='failed'] {
  display: inline;
}

.code-copy-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.markdown-body .katex-display > .katex {
  inline-size: max-content;
  min-inline-size: 100%;
  /* Leave room for fallback glyphs that extend beyond KaTeX's font metrics. */
  padding-block: 0.45em;
}

.markdown-code pre,
.markdown-body .katex-display {
  overflow-x: auto;
}
`

export default function MarkdownBody(props: { html: string }) {
  let feedbackTimer: number | undefined
  let resetFeedback: (() => void) | undefined
  onCleanup(() => window.clearTimeout(feedbackTimer))

  async function copyCode(event: MouseEvent) {
    if (!(event.target instanceof Element)) return
    const button = event.target.closest<HTMLButtonElement>('button.code-copy')
    const code = button?.parentElement?.querySelector('pre > code')
    const label = button?.querySelector('.code-copy-label')
    if (!button || !code || !label) return

    let state = 'copied'
    try {
      await navigator.clipboard.writeText(code.textContent ?? '')
    } catch {
      state = 'failed'
    }
    if (!button.isConnected) return

    window.clearTimeout(feedbackTimer)
    resetFeedback?.()
    button.dataset.copyState = state
    label.textContent = state === 'copied' ? 'Copied' : 'Copy failed'
    resetFeedback = () => {
      delete button.dataset.copyState
      label.textContent = 'Copy code'
    }
    feedbackTimer = window.setTimeout(() => {
      resetFeedback?.()
      resetFeedback = undefined
    }, 1800)
  }

  return (
    <>
      <style>{styles}</style>
      {/* The build-time Markdown renderer escapes source HTML. */}
      <article
        class="markdown-body"
        // eslint-disable-next-line solid/no-innerhtml
        innerHTML={props.html}
        onClick={copyCode}
      />
    </>
  )
}
