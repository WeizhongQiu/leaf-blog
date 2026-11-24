# Leaf Blog

使用 Solid、TypeScript 和 Vite 的 Markdown 博客。提供首页、时间线、分类、文章页、随机文章和 About 页面。

## 环境与运行

- Node.js 24.22.0（见 `.node-version`，支持同一主版本的兼容更新）
- pnpm 12.14.0（见 `package.json` 的 `packageManager`）

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开终端输出的本地地址。默认将文章放在 `posts/`，也可以在 `blog.config.json` 中指定其他目录。

## 部署

```bash
pnpm build
pnpm preview
```

将 `dist/` 部署到站点根路径。静态服务器应优先返回存在的文件，将其他页面请求回退到 `index.html`，这样直接访问或刷新 `/posts/hello-world` 等页面时也能正常打开。文章或配置有更新时，重新构建并部署。

## 命令

| 命令                | 用途                                              |
| ------------------- | ------------------------------------------------- |
| `pnpm dev`          | 启动开发服务                                      |
| `pnpm typecheck`    | 检查应用、内容处理代码和工具配置的类型            |
| `pnpm lint`         | 检查 TypeScript、Solid 响应式用法和浏览器导入边界 |
| `pnpm format:check` | 检查代码与文档格式                                |
| `pnpm format`       | 格式化代码与文档                                  |
| `pnpm build`        | 检查类型、编译文章并构建到 `dist/`                |
| `pnpm preview`      | 预览生产构建产物                                  |

## 当前结构

- `src/index.tsx`：应用挂载入口。
- `src/App.tsx`：根据配置注册首页、文章页、可选页面和未找到页面的路由。
- `src/pages/`：页面组件直接放在该目录，专用样式写在对应 TSX 中。
- `src/components/`：共享组件直接放在该目录，组件专用样式通常写在对应 TSX 中。
- `src/styles/base.css`：全站共用的颜色、字体、基础规则和页面标题样式。
- `src/styles/post-contents.css`：由 `PostContents.tsx` 导入的文章目录样式。
- `src/types/post.ts`：文章元数据、渲染结果和加载器类型。
- `build/metadata.ts`：读取文章和 Front Matter，生成元数据。
- `build/markdown.ts`：编译 Markdown、代码高亮和公式。
- `build/plugin.ts`：提供 Vite 文章和 About 模块，以及 Markdown 文件变更后的开发刷新。
- `blog.config.json`：管理全局与页面配置。
- `vite.config.ts`：接入 Solid JSX/TSX 转换和博客内容插件。
- `tsconfig.app.json` / `tsconfig.node.json`：分别约束浏览器与构建端类型环境。
- `tsconfig.paths.json`：声明 `@/` 指向项目根目录。应用内导入和构建端类型导入可写成 `@/src/types/post.ts`。Vite 加载配置时沿用相对路径。
- `eslint.config.js`：Solid、TypeScript 规则及浏览器导入 Node.js 模块的限制。

新增页面时，直接在 `src/pages/` 添加 TSX 文件，把专用样式写进组件。样式较长时，可以放到 `src/styles/` 并由对应组件导入。在 `src/App.tsx` 注册路由，并按需在 `src/components/Layout.tsx` 增加导航。组件式路由使用与 Solid 1.x 兼容的 `@solidjs/router` 0.15。

TypeScript 固定为 6.0.3，以匹配项目中的 `typescript-eslint` 版本。依赖版本由 `pnpm-lock.yaml` 锁定。

## 博客配置

`blog.config.json` 根级设置包括 `authorName`、`githubUrl`、`stickyHeader` 和 `showBackToTop`。顶栏显示作者名，首页标题使用 `Hi, I'm {authorName}.`。打字间隔固定为 25 毫秒，打完后停留 5 秒。

`stickyHeader` 默认为 `false`。设为 `true` 后，顶栏在页面滚动时固定在顶部。

`githubUrl` 设置顶栏 GITHUB 入口的链接。留空或省略时隐藏该入口。

标题字体使用 Georgia，正文和列表使用系统字体的常规字重，代码使用系统等宽字体。

| 配置项                       | 用途                                                |
| ---------------------------- | --------------------------------------------------- |
| `page.homepage.subtitle`     | 首页副标题                                          |
| `page.post.directory`        | 文章目录                                            |
| `page.post.tocAutoHide`      | 文章目录是否自动收起，默认为 `true`                 |
| `page.about.file`            | About 页的 Markdown 文件，默认为根目录的 `ABOUT.md` |
| `page.timeline.show`         | 是否启用时间线                                      |
| `page.categories.show`       | 是否启用分类页                                      |
| `page.random.show`           | 是否启用随机文章                                    |
| `page.about.show`            | 是否启用 About                                      |
| `page.notfound.message`      | 缺失页正中的一句话                                  |
| `page.notfound.autoRedirect` | 是否在 3 秒后自动回到首页，默认为 `false`           |

可选页面的 `show` 默认为 `true`。设为 `false` 后，构建跳过该页面模块，路由和顶栏入口关闭。直接访问该地址会显示未找到页面。首页与文章页始终启用。

文章目录为空时，随机入口转到 `/missing`。点击缺失页中间的文字也可以返回首页。

## 文章元数据

将 `.md` 文件放在文章目录或其子目录。可以直接从正文开始，也可以在文件开头用一对 `---` 包住 YAML Front Matter。`title` 省略或留空时使用不含 `.md` 的文件名。

`date created` 和 `date modified` 均为可选字段，按 UTC 解析，格式为 `dddd, MMMM Do YYYY, h:mm:ss a`。

```yaml
date created: Sunday, November 22nd 2026, 8:30:00 pm
date modified: Sunday, November 22nd 2026, 9:45:00 pm
```

日期缺失、留空或无法解析时，分别使用文件创建时间和最后修改时间。文件系统未提供创建时间时，用最后修改时间补齐。时间线按创建时间降序排列；文章标题下显示创建日期和修改日期。

文章 URL 使用去掉 `.md` 的文件名，例如 `hello-world.md` 对应 `/posts/hello-world`。不同子目录中的文章也须使用不同文件名。

时间线右侧显示文章分类。`category` 为可选的文本字段，省略或留空时使用文章相对于 `page.post.directory` 的第一级文件夹名。直接放在文章目录下的文件归为「未分类」。分类页将「未分类」置顶并默认选中。

构建时从项目根目录的 `blog.config.json` 读取 `page.post.directory`。相对路径以项目根目录为基准，也支持绝对路径。目录须已存在，可以为空。

## 正文编译

使用 `virtual:blog/posts` 获取按日期排序的元数据，使用 `virtual:blog/loaders` 按不含 `.md` 的文件名查找正文加载器。调用 `loaders[fileName]?.()` 会按需导入该篇文章，模块的默认导出包含 `meta`、`html`、`headings` 和 `wordCount`。

`pnpm build` 会扫描并编译文章。未知代码语言会给出英文提示并以纯文本显示，无效的 KaTeX 公式会带文章路径阻止构建。文件名重复时，会指出冲突的两篇文章。开发时按请求编译正文，新增、修改、重命名或删除文章会触发整页刷新。

正文支持 `$...$` 行内公式和 `$$...$$` 块级公式。公式在构建时转为 MathML，由浏览器使用本地字体排版。右侧目录从 Markdown 标题生成，纵线上的深色短线随阅读位置移动，实心点标出最外层标题。

文章标题下显示正文字数。统计在编译 Markdown 时完成，汉字按字计，英文和数字按词计。正文标题、列表和链接文字计入，空白、标点、代码、公式和网址不计入。

`page.post.tocAutoHide` 启用时，目录收起后在短线右侧显示当前章节和全文阅读进度。鼠标移入或键盘聚焦时显示完整目录。设为 `false` 后始终显示完整目录。

`showBackToTop` 默认为 `true`，页面向下滚动达到两个视口高度时显示返回顶部按钮。设为 `false` 可关闭。

`page.about.file` 支持相对于项目根目录的路径和绝对路径，文件缺失时 About 正文留空。放在文章目录中的 About 文件会从文章扫描中排除。

## 未来计划

- [ ] 性能优化
- [ ] 正文样式美化
- [ ] 新增 `pagefinder` 搜索模块
