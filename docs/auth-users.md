# 用户、角色与鉴权

Chihiro 使用一套统一用户模型。所有本地帐号、GitHub/Google 等第三方登录帐号、评论用户和后台成员都进入 Prisma 的 `User` 模型，也就是数据库里的 `users` 表。

## 语义约定

当前项目里有几个很容易混淆的词，这里先统一语义。

- `User`：系统身份主体总表。它不是“读者表”，也不是“管理员表”，而是所有会进入鉴权体系的站内身份主体。
- `读者`：前台互动语义。指会在站点公开侧登录、评论、点赞的那类人。
- `后台用户`：后台管理语义。指可以进入后台、管理内容或管理权限的那类人。
- `本地帐号`：一种登录能力，不是一种人群。它只属于站点管理侧，不属于读者能力。
- `第三方登录帐号`：一种登录来源，例如 GitHub、Google。它通过 `accounts` 绑定到 `users`。

这几个概念的关系是：

- 读者和后台用户都可能落在 `User` 模型里。
- 本地帐号不是读者的绑定能力，只是后台用户的登录方式之一。
- 第三方登录既可以服务读者登录，也可以作为后台用户的辅助登录方式，但它本身不决定权限。

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

当前语义下可以这样理解：

- `users` 存的是“谁进入了系统”。
- `accounts` 存的是“这个主体通过什么外部身份登录”。
- `passwordHash` 存的是“这个主体是否具备本地密码登录能力”。

## 当前业务边界

结合当前产品设定，再补充一条更强的约束：

- 读者不能绑定本地帐号。
- 本地帐号只用于站点所有者或后台管理侧用户。
- 所以“读者管理”默认应围绕 `User` 的前台互动语义展开，不应把本地帐号能力当作读者能力的一部分。

这也意味着：

- 读者页里的“读者”是 `User` 的一个业务视图，不是单独表。
- 用户与权限页里的“用户”更偏后台权限语义。
- 当我们讨论“加入时间”时，优先指 `User` 进入系统的时间，而不是某个登录方式被绑定的时间。

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

补充约定：

- `role` 只表达权限，不表达“是不是读者”。
- `role` 也不表达“是不是本地帐号”。
- 一个 `USER` 可以是普通读者。
- 一个 `ADMIN` 或 `OWNER` 本质上仍然是 `User`，只是多了后台权限。

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

这里再强调一次：

- 第三方登录默认是读者入口。
- 本地帐号默认是站点管理入口。
- 两者最终都归入同一个 `User` 主体，但产品语义不能混用。

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

在后台文案和页面命名上，建议后续也遵守这套区分：

- `读者`：优先用于前台登录用户、评论者、互动用户的管理视图。
- `用户与权限`：优先用于后台成员、本地帐号、权限提升与降级这类能力。

## 评论鉴权

评论系统使用同一套 Auth.js 用户身份。

评论规则由后台“登录与评论”设置控制：

- 是否启用评论。
- 是否要求登录后评论。
- 评论是否需要审核。

当用户已登录时，评论可以关联 `userId`，并使用用户的 `name`、`email`、`image` 展示身份。

当允许游客评论时，游客评论不创建 `users` 用户，但需要按表单规则填写必要信息。

所以评论体系里存在三类身份来源：

- 已登录读者：有 `userId`
- 已登录后台用户：也有 `userId`，但只是权限更高的 `User`
- 游客评论者：没有 `userId`

不要把“游客评论者”也视为 `User`。

## 后续字段建议

如果后续要整理 schema，优先级建议如下：

1. 给 `User` 增加 `createdAt`、`updatedAt`
2. 把它语义明确为“这个身份主体第一次进入系统的时间”
3. 读者页的“加入时间”默认基于 `User.createdAt`
4. `Account.createdAt` 不是当前最高优先级，除非后续确实要做“绑定历史”或“最近绑定了哪个 provider”

也就是说，当前阶段最重要的是先把“身份主体时间”补清楚，而不是先把“绑定时间”补清楚。

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

生产环境建议使用 `prisma migrate deploy`。如果数据库曾长期通过 `db push` 演进，再切回 migration 链路时，需要先确认 `_prisma_migrations` 历史和真实 schema 已经对齐。

上线前建议：

1. 备份数据库。
2. 部署新版本。
3. 启动后用本地 `OWNER` 帐号密码登录。
4. 打开“用户与权限”，确认本地帐号显示为 `Owner`。
5. 再测试 GitHub/Google 登录用户是否保持 `USER`。

不要把“第一个第三方登录用户”自动提升为 `OWNER`。`OWNER` 应来自首次部署的本地帐号，或未来明确的 Owner 转移流程。
