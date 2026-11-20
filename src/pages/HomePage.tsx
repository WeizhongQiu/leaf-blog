import { homeSubtitle, homeTitle, siteName } from '@/blog.config.json'

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
  margin: 0;
  font-family: var(--heading-font);
  line-height: 1.2;
  font-size: clamp(3.5rem, 7vw, 6rem);
  font-weight: 600;
  letter-spacing: 0.04em;
}

.home-page p {
  margin: 1.4rem 0 0;
  color: var(--muted);
  font-size: 1.05rem;
  letter-spacing: 0.08em;
}
`

export default function HomePage() {
  document.title = siteName

  return (
    <section class="home-page">
      <style>{styles}</style>
      <div>
        <h1>{homeTitle}</h1>
        <p>{homeSubtitle}</p>
      </div>
    </section>
  )
}
