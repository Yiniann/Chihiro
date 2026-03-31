# Chihiro

一个基于 Next.js App Router 的博客项目，目标是支持：

- 博客文章发布
- SEO 基础优化
- RSS 订阅输出
- 后续平滑扩展到 Markdown 或 MDX 内容工作流

当前项目还处在初始化阶段，这份文档先定义开发方向、目录建议和后续实现顺序，帮助我们把博客骨架尽快搭稳。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- App Router

## 本地启动

```bash
pnpm install
pnpm dev
```

默认访问地址：

```text
http://localhost:3000
```

## 项目目标

这个博客的第一阶段建议聚焦在以下几件事：

1. 建立博客首页与文章详情页
2. 建立统一的站点配置
3. 建立文章元数据结构
4. 输出 `sitemap.xml`、`robots.txt` 和 `rss.xml`
5. 为文章详情页补齐 SEO metadata

## 推荐目录结构

这是接下来比较适合本项目的目录组织方式：

```text
src/
  app/
    page.tsx
    posts/
      page.tsx
      [slug]/
        page.tsx
    rss.xml/
      route.ts
    sitemap.ts
    robots.ts
    layout.tsx
  components/
    site-header.tsx
    post-card.tsx
    prose.tsx
  content/
    posts/
      hello-world.mdx
  lib/
    site.ts
    posts.ts
    rss.ts
    seo.ts
```

## 推荐开发顺序

### 1. 先做站点基础信息

建议先建立一个 `src/lib/site.ts`，统一管理：

- 站点名
- 站点描述
- 线上域名
- 作者名
- 社交链接

这些信息后面会同时被页面 SEO、RSS、`sitemap` 和页脚复用。

### 2. 先定义文章数据结构

建议至少包含这些字段：

```ts
type PostMeta = {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  tags?: string[];
  draft?: boolean;
};
```

无论你后面用纯对象、Markdown 还是 MDX，这个数据结构都值得先固定下来。

### 3. 搭页面骨架

优先完成这几个页面：

- 首页：展示博客介绍和最新文章
- 文章列表页：展示全部文章
- 文章详情页：根据 `slug` 渲染内容

### 4. 加 SEO

建议优先完成：

- 全站默认 `metadata`
- 每篇文章的 `generateMetadata`
- Open Graph
- Twitter Card
- canonical URL

### 5. 加 RSS

建议通过 `app/rss.xml/route.ts` 动态生成 XML，数据直接来自文章列表。

## 文档索引

- [架构模式选择](./docs/architecture-mode.md)
- [博客结构规划](./docs/blog-architecture.md)
- [RSS 与 SEO 实现规划](./docs/rss-seo-plan.md)

## 当前阶段建议

如果你准备继续往下做，下一步最值得先落地的是：

1. 建立 `src/lib/site.ts`
2. 建立 `src/lib/posts.ts`
3. 创建 `/posts` 和 `/posts/[slug]`
4. 再补 `sitemap.ts`、`robots.ts` 和 `rss.xml/route.ts`

等你开始写这些代码后，我可以继续帮你一起完善实现细节和文档。
