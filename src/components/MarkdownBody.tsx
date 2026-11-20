import 'katex/dist/katex.min.css'

export default function MarkdownBody(props: { html: string }) {
  // The build-time Markdown renderer escapes source HTML.
  // eslint-disable-next-line solid/no-innerhtml
  return <article class="reading-column markdown" innerHTML={props.html} />
}
