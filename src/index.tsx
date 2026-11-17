/* @refresh reload */
import { render } from 'solid-js/web'
import App from './App'

const root = document.getElementById('root')

if (!root) throw new Error('缺少应用挂载节点 #root')

render(() => <App />, root)
