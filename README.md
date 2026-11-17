# Leaf Blog

Solid + TypeScript + Vite 的最小工程，使用浏览器默认样式。当前提供首页、History 路由、共享页头与页脚，以及未找到页面。

## 环境与运行

- Node.js 24.22.0（见 `.node-version`，支持同一主版本的兼容更新）
- pnpm 12.14.0（见 `package.json` 的 `packageManager`）

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开终端输出的本地地址。直接访问 `/missing` 可以验证未找到页面，再点击“返回首页”验证应用内导航；刷新及浏览器前进后退也应正常。

## 命令

| 命令                | 用途                                              |
| ------------------- | ------------------------------------------------- |
| `pnpm dev`          | 启动开发服务                                      |
| `pnpm typecheck`    | 检查应用、Vite 和 ESLint 配置的类型               |
| `pnpm lint`         | 检查 TypeScript、Solid 响应式用法和浏览器导入边界 |
| `pnpm format:check` | 检查代码与文档格式                                |
| `pnpm format`       | 格式化代码与文档                                  |
| `pnpm build`        | 类型检查后构建到 `dist/`                          |
| `pnpm preview`      | 预览生产构建产物                                  |

## 当前结构

- `src/index.tsx`：应用挂载入口。
- `src/App.tsx`：显式注册首页和未找到页面的路由。
- `src/components/Layout.tsx`：共享布局，通过 `props.children` 展示页面。
- `src/pages/`：页面组件。
- `vite.config.ts`：Solid JSX/TSX 转换。
- `tsconfig.app.json` / `tsconfig.node.json`：分别约束浏览器与构建端类型环境。
- `eslint.config.js`：Solid、TypeScript 规则及浏览器导入 Node.js 模块的限制。

新增页面时，在 `src/pages/` 实现组件，在 `src/App.tsx` 注册 `<Route>`，并按需在布局中增加导航；组件式路由使用与 Solid 1.x 兼容的 `@solidjs/router` 0.15。正文编译、About 及文章页面按照 `plan.md` 后续阶段实施。

模板图片、图标、计数器及演示样式已移除。当前不添加自定义 CSS、Markdown 编译器或内容测试；测试命令将在加入有行为约束的内容逻辑时配置。TypeScript 使用 6.0，以匹配当前 `typescript-eslint` 支持范围。依赖版本由 `pnpm-lock.yaml` 锁定。
