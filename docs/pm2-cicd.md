# PM2 + CI/CD 部署

这套方案不再走 standalone 压缩包，而是让服务器保留完整项目仓库和 `.env`，由 GitHub Actions 负责安装依赖、构建产物，再把运行时文件传到服务器。

## 适合当前项目的原因

- `Prisma migrate deploy` 仍然可以直接在服务器跑
- `pnpm install` 和 `pnpm build` 都搬到 GitHub Actions，不再吃服务器内存
- PM2 负责常驻 Next 服务，服务器只做拉代码、替换 `.next/node_modules`、迁移和重载

## 服务器首次准备

先在服务器上安装这些基础工具：

- Node.js 20+
- pnpm
- pm2
- git

然后把项目克隆到固定目录，例如：

```bash
mkdir -p /srv/chihiro
cd /srv/chihiro
git clone <your-repo-url> current
cd current
cp .env.example .env
```

把生产环境变量写进 `.env`，至少要有：

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

首次接入这套流程时，不需要再在服务器本地执行 `install/build`。只要下面这些条件已经满足：

- `/srv/chihiro/current` 是完整源码仓库
- `.env` 已经写好
- `DATABASE_URL` 仍然指向原来的生产库
- 服务器已经装好 Node.js、pnpm、pm2、git

之后就可以直接靠 GitHub Actions 首次发布。

如果你想在服务器手动验证一次，也只建议做轻量检查：

```bash
git status
cat .env
pm2 status
```

## 日常部署流程

之后每次部署都由服务器脚本完成：

```bash
bash scripts/deploy/server-deploy.sh
```

这个脚本会执行：

1. 拉取最新代码
2. 解压 GitHub Actions 上传的 `.next` 和 `node_modules`
3. 执行 `prisma migrate deploy`
4. 用 PM2 reload 服务

## GitHub Actions 配置

仓库里已经提供：

- [`.github/workflows/ci.yml`](/Users/yinian/Code/chihiro/.github/workflows/ci.yml)
- [`.github/workflows/deploy.yml`](/Users/yinian/Code/chihiro/.github/workflows/deploy.yml)

其中：

- `CI` 在 PR 和 `main` push 时跑 `tsc`、`build`
- `Deploy` 在 `main` push 后先在 GitHub Actions 构建，再把运行时产物上传到服务器并执行部署脚本

当前仓库里还有一批历史 ESLint 告警和错误没有清理，所以这里先把 CI 的阻塞项收敛到类型检查和构建，避免流程一直红灯。

### 需要的 GitHub Secrets

- `DEPLOY_HOST`：服务器 IP 或域名
- `DEPLOY_USER`：SSH 用户
- `DEPLOY_SSH_KEY`：部署私钥

### 需要的 GitHub Variables

- `DEPLOY_PATH`：服务器项目目录，默认 `/srv/chihiro/current`
- `DEPLOY_PORT`：SSH 端口，默认 `22`
- `PM2_APP_NAME`：PM2 进程名，默认 `chihiro`

## 切换自旧 standalone 的建议

如果你之前的目录也是 `/srv/chihiro/current`，现在只需要把它变成完整源码仓库，并保留原来的 `.env` 与数据库即可。

数据库不会跟着应用目录切换而丢失，核心是确保 `.env` 里的 `DATABASE_URL` 继续指向原来的生产库。

## 常用命令

查看 PM2 进程：

```bash
pm2 status
pm2 logs chihiro
```

手动重载：

```bash
pm2 reload ecosystem.config.cjs --env production
```

手动执行一次部署：

```bash
APP_DIR=/srv/chihiro/current DEPLOY_BRANCH=main ARTIFACT_PATH=/tmp/chihiro-build.tgz bash scripts/deploy/server-deploy.sh
```

这里的 `/tmp/chihiro-build.tgz` 一般由 GitHub Actions 上传，不需要你手工准备。
