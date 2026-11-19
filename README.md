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
| `pnpm typecheck`    | 检查应用、内容处理代码和工具配置的类型            |
| `pnpm lint`         | 检查 TypeScript、Solid 响应式用法和浏览器导入边界 |
| `pnpm format:check` | 检查代码与文档格式                                |
| `pnpm format`       | 格式化代码与文档                                  |
| `pnpm build`        | 检查类型和文章元数据后构建到 `dist/`              |
| `pnpm preview`      | 预览生产构建产物                                  |

## 当前结构

- `src/index.tsx`：应用挂载入口。
- `src/App.tsx`：显式注册首页和未找到页面的路由。
- `src/components/Layout.tsx`：共享布局，通过 `props.children` 展示页面。
- `src/pages/`：页面组件。
- `src/types/post.ts`：文章元数据、渲染结果和加载器类型。
- `build/content/metadata.ts`：扫描和校验文章元数据。
- `blog.config.json`：项目配置，目前提供文章目录设置。
- `vite.config.ts`：Solid JSX/TSX 转换和生产构建时的文章校验。
- `tsconfig.app.json` / `tsconfig.node.json`：分别约束浏览器与构建端类型环境。
- `tsconfig.paths.json`：声明 `@/` 指向项目根目录。应用内导入和构建端类型导入可写成 `@/src/types/post.ts`。Vite 加载配置时沿用相对路径。
- `eslint.config.js`：Solid、TypeScript 规则及浏览器导入 Node.js 模块的限制。

新增页面时，在 `src/pages/` 实现组件，在 `src/App.tsx` 注册 `<Route>`，并按需在布局中增加导航；组件式路由使用与 Solid 1.x 兼容的 `@solidjs/router` 0.15。正文编译、About 及文章页面按照 `plan.md` 后续阶段实施。

模板图片、图标、计数器及演示样式已移除。TypeScript 固定为 6.0.3，以匹配当前 `typescript-eslint` 支持范围。依赖版本由 `pnpm-lock.yaml` 锁定。

## 文章元数据

将 `.md` 文件放在文章目录或其子目录。可以直接从正文开始，也可以在文件开头用一对 `---` 包住 YAML Front Matter。`title` 省略或留空时使用不含 `.md` 的文件名。`date` 填写时使用 `YYYY-MM-DD`，省略或留空时取文件最后修改时间的 UTC 日期。`description` 省略或填入非文本值时按空摘要处理。

文章 URL 使用去掉 `.md` 的文件名，例如 `hello-world.md` 对应 `/posts/hello-world`。不同子目录中的文章也须使用不同文件名。

构建时从项目根目录的 `blog.config.json` 读取文章目录。编辑 `postsDirectory` 即可修改。默认值为 `content/posts`，相对路径以项目根目录为基准，也支持绝对路径。目录须已存在，可以为空。

`pnpm build` 会扫描并校验文章。失败时会用英文报告相对于所选文章目录的文件路径、字段和原因。文件名重复时还会指出另一篇文章的路径。
