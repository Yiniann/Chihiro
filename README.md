# Chihiro

一个基于 Next.js App Router 的单站点内容发布系统，目标是支持：

- 博客文章与动态发布
- 后台管理与发布工作流
- 富文本内容编辑
- SEO 基础优化
- RSS 订阅输出
- 对象存储资源管理

当前项目还处在第一阶段，重点是先把公开站点、内容模型和后台发布链路搭稳。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- App Router
- Postgres
- Prisma
- S3 / R2 类对象存储

## 本地启动

```bash
pnpm install
pnpm dev
```

默认访问地址：

```text
http://localhost:3000
```

实时阅读 presence 服务默认监听：

```text
ws://localhost:3001
```

## 本地数据库

项目已经接入 `Prisma`，本地开发可以先只借用 `docker compose` 里的 Postgres：

```bash
cp .env.example .env
docker compose up -d postgres redis
pnpm db:push
pnpm db:generate
```

默认本地连接串已经写在 `.env.example` 里，对应 `docker-compose.yml` 里的数据库配置。
Redis 本地连接串也已经预置为 `redis://127.0.0.1:6379`。

## 实时阅读展示

文章详情页现在会通过 `WebSocket + Redis` 公开展示：

- 当前全站在线访客数
- 当前文章在线访客数与阅读会话数
- 匿名读者阅读进度卡片
- 阅读进度分布

本地开发时，`pnpm dev` 会同时启动：

- Next.js 站点：`http://localhost:3000`
- realtime 服务：`ws://localhost:3001`

本地开发当前统一使用：

```bash
pnpm db:push
pnpm db:generate
```

原因是当前仓库里的 Prisma migrations 并不是从“空数据库初始化建表”开始维护的；线上迁移链路已经可以正常工作，但本地执行 `pnpm db:migrate` 时，`prisma migrate dev` 会在 shadow database 回放旧 migration，容易因为历史表结构前置条件不完整而失败。

所以当前约定是：

- 本地开发库：使用 `pnpm db:push`
- 线上环境：继续使用现有正式迁移流程，不改已上线 migration 历史

如果本地数据库结构落后于 `schema.prisma`，直接执行：

```bash
pnpm db:push
```

如果 Prisma Client 类型还没同步，再执行：

```bash
pnpm db:generate
```

## GitHub 登录

公开用户登录使用 Auth.js + GitHub OAuth。GitHub OAuth App 的本地回调地址填写：

```text
http://localhost:3000/api/auth/callback/github
```

需要在 `.env` 中配置：

```bash
AUTH_SECRET="..."
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."
```

`AUTH_SECRET` 可以用 `npx auth secret` 生成。

## 文档索引

- [架构设计](./docs/architecture.md)
- [用户、角色与鉴权](./docs/auth-users.md)
- [Docker 与 CI/CD 部署](./docs/docker-cicd.md)
- [站点配置说明](./docs/site-settings.md)
- [开发路线](./docs/roadmap.md)
- [RSS 与 SEO 实现规划](./docs/rss-seo-plan.md)
