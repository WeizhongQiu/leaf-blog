import { Router, Route } from '@solidjs/router'
import { lazy } from 'solid-js'
import Layout from '@/src/components/Layout.tsx'
import CategoriesPage from '@/src/pages/CategoriesPage.tsx'
import HomePage from '@/src/pages/HomePage.tsx'
import NotFoundPage from '@/src/pages/NotFoundPage.tsx'
import RandomPage from '@/src/pages/RandomPage.tsx'
import TimelinePage from '@/src/pages/TimelinePage.tsx'

const AboutPage = lazy(() => import('@/src/pages/AboutPage.tsx'))
const PostPage = lazy(() => import('@/src/pages/PostPage.tsx'))

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={HomePage} />
      <Route path="/timeline" component={TimelinePage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/random" component={RandomPage} />
      <Route path="/posts/:fileName" component={PostPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/*all" component={NotFoundPage} />
    </Router>
  )
}
