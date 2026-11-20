import { homeSubtitle, homeTitle, siteName } from '@/blog.config.json'

export default function HomePage() {
  document.title = siteName

  return (
    <section class="home">
      <div class="home-intro">
        <h1>{homeTitle}</h1>
        <p>{homeSubtitle}</p>
      </div>
    </section>
  )
}
