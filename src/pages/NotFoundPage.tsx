import { A } from '@solidjs/router'

export default function NotFoundPage() {
  document.title = '页面未找到 | Leaf Blog'

  return (
    <>
      <h1>页面未找到</h1>
      <A href="/">返回首页</A>
    </>
  )
}
