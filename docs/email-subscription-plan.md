# 邮件与订阅功能开发步骤

## 目标

为应用增加一套可维护的邮件发送与订阅通知能力，支持：

- 通过 SMTP 发送邮件
- 用户提交邮箱订阅更新
- 邮箱确认订阅
- 用户自主退订
- 在内容发布后向订阅用户发送通知
- 在后台管理邮件配置与订阅用户

## 设计原则

- 将“邮件发送能力”和“订阅业务”拆开实现，避免耦合
- 订阅者使用独立数据模型，不直接复用现有 `User`
- 第一阶段优先打通最短闭环，再补后台管理和发送记录
- 发布内容不能因为邮件发送失败而失败
- 所有订阅邮件都必须带退订入口

## 阶段 1：SMTP 发信基础设施

### 1.1 安装依赖

- 增加 `nodemailer`
- 如需类型补充，再评估是否增加额外类型包

### 1.2 设计环境变量

建议增加以下环境变量：

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`

### 1.3 建立服务端邮件模块

新增统一邮件服务层，建议放在：

- `src/server/mail/transport.ts`
- `src/server/mail/send-mail.ts`
- `src/server/mail/templates/*`

职责拆分建议：

- `transport`：负责创建 SMTP transporter
- `send-mail`：负责统一发信入口、日志、错误包装
- `templates`：负责生成邮件标题、HTML、纯文本内容

### 1.4 提供测试发信能力

先支持一条“测试邮件”发送链路，便于确认 SMTP 配置是否可用。

建议能力：

- 后台填写收件地址后发送测试邮件
- 返回成功或失败信息
- 在服务端记录关键错误原因，便于排查

## 阶段 2：后台邮件设置

### 2.1 数据存储方案

二选一即可：

- 在 `SiteSettings` 上追加邮件相关字段
- 新建 `EmailSettings` 表单独维护

当前项目已有 `SiteSettings`，第一版可优先复用，减少改动面。

建议字段：

- `smtpHost`
- `smtpPort`
- `smtpSecure`
- `smtpUser`
- `smtpPass`
- `smtpFromEmail`
- `smtpFromName`
- `subscriptionReplyTo`

### 2.2 后台页面

新增后台页面，例如：

- `/admin/settings/email`

页面能力建议包括：

- 编辑 SMTP 配置
- 编辑发件人名称与地址
- 发送测试邮件
- 展示配置是否完整

### 2.3 安全处理

- 敏感字段不要在页面完整回显
- 支持“保留原密码，仅在重新填写时更新”
- 服务端校验端口、主机、邮箱格式

## 阶段 3：订阅者数据模型

### 3.1 新增独立订阅表

建议新增 `Subscriber` 模型，不与 `User` 绑定。

建议字段：

- `id`
- `email`
- `status`
- `confirmToken`
- `unsubscribeToken`
- `source`
- `confirmedAt`
- `unsubscribedAt`
- `lastEmailSentAt`
- `createdAt`
- `updatedAt`

### 3.2 订阅状态设计

建议枚举：

- `PENDING`
- `ACTIVE`
- `UNSUBSCRIBED`

可选扩展：

- `BOUNCED`
- `COMPLAINED`

第一版先保留核心三态即可。

### 3.3 约束与索引

- `email` 唯一
- `confirmToken` 唯一
- `unsubscribeToken` 唯一
- 为 `status` 建索引，方便批量查询有效订阅者

## 阶段 4：前台订阅链路

### 4.1 增加订阅入口

可选位置：

- 页脚
- 首页
- `/message` 页面

第一版建议放在页脚或首页，先提升可见性。

### 4.2 提交订阅

新增服务端接口或 server action，完成：

- 校验邮箱格式
- 查重
- 创建或更新订阅记录
- 生成确认 token
- 发送确认邮件

### 4.3 双重确认

用户提交邮箱后：

- 先写入 `PENDING`
- 邮件中附带确认链接
- 用户点击后将状态改为 `ACTIVE`

这样可以减少误订阅和垃圾邮箱。

### 4.4 幂等处理

需要处理这些情况：

- 已经是 `ACTIVE` 的邮箱重复提交
- `PENDING` 状态重复提交
- 退订过的邮箱重新订阅

建议返回统一友好提示，不暴露过多内部状态。

## 阶段 5：退订链路

### 5.1 退订入口

每封订阅邮件都附带退订链接，例如：

- `/unsubscribe?token=...`

### 5.2 退订行为

点击退订后：

- 校验 `unsubscribeToken`
- 将状态更新为 `UNSUBSCRIBED`
- 记录 `unsubscribedAt`

### 5.3 用户体验

- 退订成功页要明确反馈
- 支持重复访问退订链接时的幂等提示

## 阶段 6：邮件模板

### 6.1 第一批模板

建议先实现两类模板：

- 订阅确认邮件
- 内容更新通知邮件

### 6.2 模板输出

每封邮件都提供：

- HTML 版本
- 纯文本版本

### 6.3 模板内容建议

订阅确认邮件：

- 说明你订阅了什么
- 确认按钮
- 链接失效时的备用纯文本链接

内容更新通知邮件：

- 标题
- 简短摘要
- 跳转阅读链接
- 退订链接

## 阶段 7：发布联动通知

### 7.1 第一阶段只接 Update

当前项目已有 `Update` 发布流程，建议优先在这里接通知发送，先跑通闭环。

相关入口：

- `src/app/(admin)/admin/compose/update/actions.ts`

### 7.2 触发规则

在内容从草稿变为发布时：

- 查询所有 `ACTIVE` 订阅者
- 生成邮件内容
- 触发批量发送

### 7.3 错误隔离

必须保证：

- 内容发布成功不依赖邮件发送成功
- 邮件发送失败只记录错误，不回滚内容发布

## 阶段 8：发送策略与扩展

### 8.1 第一版策略

如果订阅者数量很少，可以先用简单批量发送逻辑。

但仍建议注意：

- 控制单次发送数量
- 避免阻塞发布请求太久
- 做基础错误记录

### 8.2 更稳妥的第二版

后续可新增发送任务模型，例如：

- `EmailJob`
- `NewsletterDelivery`

用于支持：

- 异步发送
- 失败重试
- 发送记录
- 状态追踪

## 阶段 9：后台订阅管理

### 9.1 管理页面

建议新增：

- `/admin/subscribers`

### 9.2 页面能力

- 查看订阅总数
- 按邮箱搜索
- 筛选 `PENDING` / `ACTIVE` / `UNSUBSCRIBED`
- 手动取消订阅
- 导出订阅邮箱

### 9.3 后续增强

后面可以增加：

- 查看最近发送时间
- 查看发送失败记录
- 手动重发确认邮件

## 阶段 10：风控、合规与体验

### 10.1 基础风控

- 对订阅提交接口做限流
- 防止重复刷接口
- 对异常频率做日志记录

### 10.2 合规要求

- 邮件中明确说明订阅用途
- 每封通知邮件包含退订链接
- 避免误导性标题和发件人信息

### 10.3 体验细节

- 表单提交后给出明确提示
- 确认页和退订页要有完整反馈
- 后台测试发信失败时返回可理解错误

## 推荐实施顺序

建议按下面顺序推进：

1. SMTP 环境变量与邮件发送服务
2. 后台邮件设置与测试发信
3. `Subscriber` 数据模型与 Prisma 迁移
4. 前台订阅表单
5. 邮箱确认与退订页面
6. 订阅确认邮件模板
7. `Update` 发布后通知邮件
8. 后台订阅管理页面
9. 发送记录、异步任务与失败重试

## 当前项目建议改动位置

- `prisma/schema.prisma`
- `src/server/repositories/site.ts`
- `src/app/(admin)/admin/settings/actions.ts`
- `src/app/(admin)/admin/compose/update/actions.ts`
- `src/server/mail/*`
- `src/server/repositories/subscribers/*`
- `src/app/(admin)/admin/settings/email/*`
- `src/app/(admin)/admin/subscribers/*`
- `src/app/api/*` 或对应 server actions

## 第一阶段完成标准

满足以下条件即可认为第一阶段完成：

- 后台可配置 SMTP
- 可以发送测试邮件
- 前台可以提交订阅邮箱
- 用户能通过邮件确认订阅
- 用户能通过邮件退订
- 发布一条 `Update` 后，活跃订阅者能收到通知邮件

## 备注

- 第一版尽量不要把“订阅者”和“登录用户”混成一个模型
- 第一版尽量不要把发送结果强耦合到发布流程
- 如果后续订阅量增长明显，再演进为异步任务队列
