import 'katex/dist/katex.min.css'

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

.markdown-body pre {
  padding: 1rem;
  font-size: 0.875rem;
}

.markdown-body pre,
.markdown-body .katex-display {
  overflow-x: auto;
}
`

export default function MarkdownBody(props: { html: string }) {
  return (
    <>
      <style>{styles}</style>
      {/* The build-time Markdown renderer escapes source HTML. */}
      {/* eslint-disable-next-line solid/no-innerhtml */}
      <article class="markdown-body" innerHTML={props.html} />
    </>
  )
}
