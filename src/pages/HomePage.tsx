import { authorName, homeSubtitle } from '@/blog.config.json'

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
  line-height: 1.2;
  font-size: clamp(3.25rem, 6.8vw, 5.5rem);
  font-weight: 400;
  letter-spacing: -0.015em;
}

.home-page-name {
  color: #a36232;
}

.home-page p {
  margin: 1.4rem 0 0;
  color: var(--muted);
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}
`

export default function HomePage() {
  document.title = authorName

  return (
    <section class="home-page">
      <style>{styles}</style>
      <div>
        <h1>
          {"Hi, I'm "}
          <span class="home-page-name">{authorName}</span>.
        </h1>
        <p>{homeSubtitle}</p>
      </div>
    </section>
  )
}
