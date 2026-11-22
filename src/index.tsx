/* @refresh reload */
import { render } from 'solid-js/web'
import App from '@/src/App.tsx'
import { fontWeight } from '@/src/blog-config.ts'
import '@/src/styles/base.css'

const root = document.getElementById('root')

if (!root) throw new Error('Missing application mount element #root.')

document.documentElement.dataset.fontWeight = fontWeight
render(() => <App />, root)
