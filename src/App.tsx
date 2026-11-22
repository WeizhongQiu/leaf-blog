import { Router, Route } from '@solidjs/router'
import { lazy } from 'solid-js'
import Layout from '@/src/components/Layout.tsx'
import HomePage from '@/src/pages/HomePage.tsx'

const TimelinePage =
  __ENABLE_TIMELINE__ && lazy(() => import('@/src/pages/TimelinePage.tsx'))
const CategoriesPage =
  __ENABLE_CATEGORIES__ && lazy(() => import('@/src/pages/CategoriesPage.tsx'))
const RandomPage =
  __ENABLE_RANDOM__ && lazy(() => import('@/src/pages/RandomPage.tsx'))
const AboutPage =
  __ENABLE_ABOUT__ && lazy(() => import('@/src/pages/AboutPage.tsx'))
const PostPage = lazy(() => import('@/src/pages/PostPage.tsx'))
const NotFoundPage = lazy(() => import('@/src/pages/NotFoundPage.tsx'))

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={HomePage} />
      {TimelinePage && <Route path="/timeline" component={TimelinePage} />}
      {CategoriesPage && (
        <Route path="/categories" component={CategoriesPage} />
      )}
      {RandomPage && <Route path="/random" component={RandomPage} />}
      <Route path="/posts/:fileName" component={PostPage} />
      {AboutPage && <Route path="/about" component={AboutPage} />}
      <Route path="/*all" component={NotFoundPage} />
    </Router>
  )
}
