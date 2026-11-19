/* @refresh reload */
import { render } from 'solid-js/web'
import App from '@/src/App.tsx'

const root = document.getElementById('root')

if (!root) throw new Error('Missing application mount element #root.')

render(() => <App />, root)
