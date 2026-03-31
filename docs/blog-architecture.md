# 博客结构规划

这份文档用于约定博客的内容组织方式，以及第一阶段应该先实现哪些页面和模块。

## 第一阶段范围

第一阶段不追求复杂 CMS，而是先把一个静态内容驱动的博客跑通。目标是：

- 能列出文章
- 能打开文章详情
- 能输出 RSS
- 能具备基础 SEO 能力

## 页面规划

### `/`

首页用于承载品牌介绍和最近文章，建议包含：

- 站点标题
- 简短介绍
- 最新文章列表
- RSS 订阅入口

### `/posts`

文章归档页，建议包含：

- 所有文章卡片
- 发布时间
- 标签
- 摘要

### `/posts/[slug]`

文章详情页，建议包含：

- 标题
- 发布时间
- 更新时间
- 正文内容
- 标签
- 上一篇 / 下一篇导航

## 内容来源建议

当前可以按下面两个阶段推进：

### 阶段 A：先用 TypeScript 数据源

优点：

- 不依赖额外包
- 方便快速起步
- 更容易先把路由、SEO、RSS 打通

适合先建立：

- `src/lib/posts.ts`
- `src/lib/site.ts`

### 阶段 B：升级到 Markdown / MDX

当页面结构稳定后，再引入 Markdown 或 MDX，会更适合博客写作。

升级后建议结构：

```text
src/content/posts/
  first-post.mdx
  second-post.mdx
```

每篇文章使用 frontmatter 存：

- `title`
- `description`
- `publishedAt`
- `updatedAt`
- `tags`
- `draft`

## 关键模块建议

### `src/lib/site.ts`

职责：

- 输出站点基础信息
- 提供站点 URL
- 为 SEO 与 RSS 提供统一源数据

### `src/lib/posts.ts`

职责：

- 获取全部文章
- 按发布时间排序
- 按 `slug` 查询文章
- 过滤 `draft`

### `src/components/post-card.tsx`

职责：

- 在首页和文章列表页复用文章展示卡片

### `src/components/prose.tsx`

职责：

- 统一文章正文样式

## 路由与生成策略

如果文章是静态内容，建议优先采用静态生成：

- 文章列表页可静态生成
- 文章详情页可通过 `generateStaticParams` 预生成
- `sitemap.ts` 与 `rss.xml` 由文章数据直接生成

这样可以获得：

- 更好的性能
- 更好的搜索引擎抓取体验
- 更简单的部署方式

## 后续增强方向

等第一版完成后，可以继续增加：

- 标签页
- 分类页
- 相关文章推荐
- 全文搜索
- 草稿预览
- 代码高亮
- 自动目录

## 推荐近期任务

最适合先做的 4 个文件：

1. `src/lib/site.ts`
2. `src/lib/posts.ts`
3. `src/app/posts/page.tsx`
4. `src/app/posts/[slug]/page.tsx`
