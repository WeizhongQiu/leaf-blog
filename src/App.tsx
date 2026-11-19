import { Router, Route } from '@solidjs/router'
import Layout from '@/src/components/Layout.tsx'
import HomePage from '@/src/pages/HomePage.tsx'
import NotFoundPage from '@/src/pages/NotFoundPage.tsx'

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={HomePage} />
      <Route path="/*all" component={NotFoundPage} />
    </Router>
  )
}
