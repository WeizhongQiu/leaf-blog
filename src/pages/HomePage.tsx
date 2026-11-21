import { createSignal, onCleanup, onMount } from 'solid-js'
import blogConfig from '@/blog.config.json'

const styles = /* css */ `
.home-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100svh - var(--header-height));
  padding-block: 4rem 9rem;
  text-align: center;
}

.home-page h1 {
  display: grid;
  margin: 0;
  line-height: 1.2;
  font-size: clamp(3.25rem, 6.8vw, 5.5rem);
  font-weight: 400;
  letter-spacing: -0.015em;
  overflow-wrap: anywhere;
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

.home-page p {
  margin: 1.4rem 0 0;
  color: var(--muted);
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}
`

const { authorName, homeSubtitle } = blogConfig

function timerDelay(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.min(value, 2_147_483_647)
    : fallback
}

const titlePause = timerDelay(
  'homeTitlePauseMs' in blogConfig ? blogConfig.homeTitlePauseMs : undefined,
  6500,
)
const typingInterval = timerDelay(
  'homeTitleTypingIntervalMs' in blogConfig
    ? blogConfig.homeTitleTypingIntervalMs
    : undefined,
  60,
)

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
    <section class="home-page">
      <style>{styles}</style>
      <div>
        <h1 aria-label={title}>
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
        <p>{homeSubtitle}</p>
      </div>
    </section>
  )
}
