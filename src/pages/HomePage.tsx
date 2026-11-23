import { createSignal, onCleanup, onMount } from 'solid-js'
import { authorName, page } from '@/src/blog-config.ts'
import '@/src/styles/page-intro.css'

const styles = /* css */ `
.home-page h1 {
  display: grid;
}

.home-page h1::before,
.home-page-typed {
  grid-area: 1 / 1;
  padding-inline-end: 0.55em;
}

.home-page h1::before {
  content: attr(aria-label);
  visibility: hidden;
}

.home-page-typed {
  min-width: 0;
  text-align: start;
}

.home-page-name {
  color: #a36232;
}

.home-page-caret {
  position: relative;
  display: inline-block;
  inline-size: 0;
}

.home-page-caret::after {
  position: absolute;
  inset-inline-start: 0.08em;
  inset-block-end: -0.07em;
  inline-size: 0.45em;
  block-size: 0.8em;
  background: var(--selection);
  opacity: 0.75;
  content: '';
  animation: home-page-caret-blink 1s step-end infinite;
}

@keyframes home-page-caret-blink {
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .home-page h1::before,
  .home-page-typed {
    padding-inline-end: 0;
    text-align: center;
  }

  .home-page-caret::after {
    display: none;
  }
}
`

const titlePause = 5000
const typingInterval = 25

const greeting = "Hi, I'm "
const title = `${greeting}${authorName}.`
const nameCharacters =
  typeof Intl.Segmenter === 'function'
    ? Array.from(
        new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(
          authorName,
        ),
        ({ segment }) => segment,
      )
    : Array.from(authorName)
const titleLength = greeting.length + nameCharacters.length + 1

export default function HomePage() {
  document.title = authorName
  const [typed, setTyped] = createSignal(titleLength)

  onMount(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer = 0

    const start = () => {
      window.clearTimeout(timer)
      if (motion.matches) {
        setTyped(titleLength)
        return
      }
      setTyped(0)
      timer = window.setTimeout(type, 180)
    }

    const type = () => {
      const count = setTyped((previous) => previous + 1)
      timer =
        count === titleLength
          ? window.setTimeout(start, titlePause)
          : window.setTimeout(type, typingInterval)
    }

    start()
    motion.addEventListener('change', start)
    onCleanup(() => {
      window.clearTimeout(timer)
      motion.removeEventListener('change', start)
    })
  })

  return (
    <section class="page-intro home-page">
      <style>{styles}</style>
      <div>
        <h1 class="page-intro-title" aria-label={title}>
          <span class="home-page-typed" aria-hidden="true">
            {greeting.slice(0, typed())}
            <span class="home-page-name">
              {nameCharacters
                .slice(0, Math.max(0, typed() - greeting.length))
                .join('')}
            </span>
            {typed() === titleLength ? '.' : ''}
            <span class="home-page-caret" />
          </span>
        </h1>
        <p class="page-intro-subtitle">{page.homepage.subtitle}</p>
      </div>
    </section>
  )
}
