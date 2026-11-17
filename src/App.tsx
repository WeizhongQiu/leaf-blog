import { Router, Route } from '@solidjs/router'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={HomePage} />
      <Route path="/*all" component={NotFoundPage} />
    </Router>
  )
}
