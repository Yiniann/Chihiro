# 用户、角色与鉴权

Chihiro 使用一套统一用户模型。所有本地帐号、GitHub/Google 等第三方登录帐号、评论用户和后台成员都进入 Prisma 的 `User` 模型，也就是数据库里的 `users` 表。

## 用户模型

核心字段：

```text
users
- id
- username
- passwordHash
- email
- name
- image
- role

其中 `username` 作为本地密码登录标识，必须唯一。
```

登录方式和用户身份分离：

- 本地帐号使用 `username + passwordHash` 登录。
- GitHub/Google 等第三方登录通过 Auth.js 的 `accounts` 表绑定到同一个 `users` 用户。
- Auth.js 的数据库会话存储在 `sessions` 表。
- 旧的 `AdminUser/AdminSession` 不再参与运行时鉴权。

## 角色

`role` 使用 `UserRole` 枚举：

```text
USER
ADMIN
OWNER
```

含义：

- `USER`：普通用户。可以登录、评论、点赞等。
- `ADMIN`：后台管理员。可以进入后台并管理内容。
- `OWNER`：站点所有者。拥有后台权限，并且可以管理用户权限。

权限判断只看 `role`，不看用户是通过本地密码、GitHub 还是 Google 登录。

## 首次部署

首次部署引导会创建一个本地帐号，并直接写入 `users` 表：

```text
username = 初始化表单里的管理员帐号
passwordHash = 初始化表单里的管理员密码 hash
role = OWNER
```

创建完成后，系统会为这个用户创建 Auth.js 数据库会话并进入后台。

## 登录方式

当前登录入口是统一的登录弹窗：

- 一键登录：GitHub，后续 Google。
- 帐号密码登录：本地帐号。
- 开发环境可使用开发登录。

本地帐号密码登录流程：

1. 规范化 `username`。
2. 在 `users` 表中查找本地用户。
3. 校验 `passwordHash`。
4. 确认角色是 `ADMIN` 或 `OWNER`。
5. 创建 Auth.js `sessions` 记录。
6. 写入 `authjs.session-token` 或生产环境的 `__Secure-authjs.session-token` cookie。

第三方登录流程：

1. Auth.js 通过 provider 完成 OAuth。
2. 用户写入 `users` 表。
3. provider 绑定写入 `accounts` 表。
4. 默认角色是 `USER`。
5. 由 `OWNER` 在后台提升为 `ADMIN`。

第三方登录用户不会自动成为 `OWNER`。

## 后台鉴权

后台路由使用两层保护：

- `middleware.ts` 只检查是否存在 Auth.js session cookie。它只做轻量入口拦截。
- 服务端 action 和后台 layout 使用 `requireAdminSession()` 或 `requireOwnerSession()` 做真实权限判断。

后台访问规则：

```text
ADMIN 或 OWNER -> 可以进入后台
OWNER -> 可以进入用户与权限管理
USER -> 不能进入后台
未登录 -> 跳转到站点登录弹窗
```

`requireAdminSession()`：

- 允许 `ADMIN`
- 允许 `OWNER`

`requireOwnerSession()`：

- 只允许 `OWNER`

## 用户与权限

用户与权限页只允许 `OWNER` 访问。

可管理内容：

- 查看所有公开用户、本地用户和第三方登录用户。
- 将普通用户设为 `ADMIN`。
- 将 `ADMIN` 降回 `USER`。
- `OWNER` 受保护，不提供普通降级操作。

当前策略是保留 `OWNER` 作为最高权限角色。后续如果要做 Owner 转移，应单独设计二次确认流程。

## 评论鉴权

评论系统使用同一套 Auth.js 用户身份。

评论规则由后台“登录与评论”设置控制：

- 是否启用评论。
- 是否要求登录后评论。
- 评论是否需要审核。

当用户已登录时，评论可以关联 `userId`，并使用用户的 `name`、`email`、`image` 展示身份。

当允许游客评论时，游客评论不创建 `users` 用户，但需要按表单规则填写必要信息。

## 旧表处理

旧的本地后台体系包含：

```text
AdminUser
AdminSession
```

它们已经不参与运行时逻辑：

- 密码登录不再查询 `AdminUser`。
- 后台鉴权不再读取 `AdminSession`。
- 退出登录只退出 Auth.js session。
- Prisma schema 中旧模型标记为 `@@ignore`，避免当前 `db push` 部署方式触发删表警告。

如果环境使用 `migrate deploy`，`20260513115000_drop_legacy_admin_tables` 会删除旧表。

如果环境继续使用 `db push`，旧物理表可能暂时留在数据库里，但应用不会访问它们。

## 部署注意

当前 Docker 部署链路可能使用 `prisma db push`。因此用户体系改动避免依赖只在 migration SQL 中执行的数据迁移。

上线前建议：

1. 备份数据库。
2. 部署新版本。
3. 启动后用本地 `OWNER` 帐号密码登录。
4. 打开“用户与权限”，确认本地帐号显示为 `Owner`。
5. 再测试 GitHub/Google 登录用户是否保持 `USER`。

不要把“第一个第三方登录用户”自动提升为 `OWNER`。`OWNER` 应来自首次部署的本地帐号，或未来明确的 Owner 转移流程。
