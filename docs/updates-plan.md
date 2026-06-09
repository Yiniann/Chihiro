# 动态系统重构方案

## 背景

这份文档用于替代之前以 `curation` 为核心的方案。

新的方向已经明确：

- 前端不再提供独立的 `品鉴` 入口
- 站点只有一个短内容主入口：`足迹 / updates`
- 电影、音乐、物品不再被视为“动态附件”
- 它们是动态系统内部正式的一类内容类型

一句话定义：

> `updates` 不只是文字动态流，而是一套多类型动态系统。

## 新的产品心智

动态本身就应该支持多种内容形态，而不是“先发一条动态，再额外挂一个附件”。

首版动态类型定义为：

- `note`
- `movie`
- `music`
- `object`

对应含义：

- `note`：纯文字动态
- `movie`：电影鉴赏动态
- `music`：音乐鉴赏动态
- `object`：物品鉴赏动态

## 为什么不用“附件模型”

不再采用“动态 + 附件”的原因：

- “附件”会让电影、音乐、物品在产品心智里变成次级内容
- 后台和前台都会形成“文字才是主体，其余只是补充”的偏差
- 每种内容都有自己独立的字段和展示结构，更适合被当成正式类型

新的定义更清楚：

- 动态外壳统一
- 动态内容体按类型变化

## 前端结构

前端只保留一个主入口：

- `/updates`

用户进入 `足迹` 后，在同一条时间流里看到不同类型的动态。

### 动态统一外层

所有类型都共享同一层结构：

1. 站点昵称
2. 发布时间
3. 动态主体内容
4. 点赞 / 评论

这个外层不要拆。

变化的只是第 3 部分，也就是“动态主体内容”。

## 四类动态的前台呈现

### `note`

纯文字动态，延续当前 `updates` 的主要样式。

#### 结构

- 站点昵称
- 时间
- 文字内容
- 点赞 / 评论

#### 特点

- 最轻量
- 不依赖外部数据源
- 没有额外内容卡

### `movie`

电影鉴赏动态本质上是一条“短评 + 电影信息卡”的内容。

#### 结构

- 站点昵称
- 时间
- 你的短评
- 电影卡
- 点赞 / 评论

#### 电影卡字段

- `title`
- `originalTitle`
- `year`
- `posterUrl`
- `director`
- `genres`
- `overview`
- `rating`
- `sourceName`
- `sourceUrl`

#### 展示重点

- 海报
- 片名
- 年份 / 导演 / 类型
- 简介摘录
- 评分 / 来源

#### 跳转逻辑

- 点击电影卡后跳外部页面

### `music`

音乐鉴赏动态是一条“短评 + Apple Music 作品卡”的内容。

#### 结构

- 站点昵称
- 时间
- 你的短评
- 音乐卡
- 点赞 / 评论

#### 音乐卡字段

- `format`
- `title`
- `artist`
- `album`
- `releaseYear`
- `coverUrl`
- `genres`
- `appleMusicUrl`
- `appleMusicId`
- `listeningNote`

#### 展示重点

- 方形封面
- 曲名 / 专辑名
- 艺人
- 年份
- 听感提示
- 流派 / Apple Music 来源

#### 跳转逻辑

- 点击音乐卡后跳 Apple Music

#### 额外原则

- 不做站内播放
- 不做播放器嵌入

### `object`

物品鉴赏动态是一条“短评 + 物品入口卡”的内容。

#### 结构

- 站点昵称
- 时间
- 你的短评
- 物品卡
- 点赞 / 评论

#### 物品卡字段

- `title`
- `slug`
- `heroImage`
- `brand`
- `model`
- `category`
- `summary`

#### 展示重点

- 头图
- 标题
- 品牌 / 型号 / 类别
- 一段摘要
- `查看全文`

#### 跳转逻辑

- 点击物品卡后进入站内详情页

## 物品详情页

虽然前端只保留 `updates` 作为动态入口，但 `object` 类型仍然可以拥有自己的详情页。

详情页用于承载长评，不属于新的栏目入口。

### 详情页角色

- 承载长评
- 展示更多图片与使用场景
- 不影响 `updates` 作为唯一短内容主入口

### 详情页推荐结构

1. Hero 区
2. 摘要
3. 长评正文
4. 细节图区
5. 总结区

### 详情页推荐字段

- `title`
- `slug`
- `heroImage`
- `summary`
- `content`
- `galleryImages`
- `purchaseInfo`
- `usageContext`
- `pros`
- `cons`
- `sourceUrl`

首版至少需要：

- `title`
- `slug`
- `heroImage`
- `summary`
- `content`

## 数据模型方向

不再采用 `Update + Attachment`。

新的方向是：

- `Update` 本身有 `type`
- 不同 `type` 决定不同的 `metadata` 结构

### Update 统一层

- `id`
- `type`
- `content`
- `contentHtml`
- `publishedAt`
- `status`
- `likeCount`
- `commentCount`
- `metadata`

其中：

- `type` 决定这是哪种动态
- `content` / `contentHtml` 承载公共的短评或正文
- `metadata` 承载类型专属信息

## 各类型 metadata 建议

### `note`

可以为空，或者只保留非常轻的扩展字段。

### `movie`

- `title`
- `originalTitle`
- `year`
- `posterUrl`
- `director`
- `genres`
- `overview`
- `rating`
- `sourceName`
- `sourceUrl`

### `music`

- `format`
- `title`
- `artist`
- `album`
- `releaseYear`
- `coverUrl`
- `genres`
- `appleMusicUrl`
- `appleMusicId`
- `listeningNote`

### `object`

- `title`
- `slug`
- `heroImage`
- `brand`
- `model`
- `category`
- `summary`
- `content`

## 后台编辑体验

后台不再是“发动态，再决定要不要加附件”，而是：

1. 新建动态
2. 先选择动态类型
3. 根据类型切换对应表单

### 类型切换

可选项：

- `纯文字`
- `电影鉴赏`
- `音乐鉴赏`
- `物品鉴赏`

### 各类型后台表单

#### `note`

- 只写正文

#### `movie`

- 写短评
- 搜索外部电影数据
- 选中后自动补全电影元信息

#### `music`

- 写短评
- 搜索 Apple Music
- 选中后自动补全音乐元信息
- 补一条 `listeningNote`

#### `object`

- 写短评
- 上传头图
- 填标题、品牌、型号、摘要
- 进入长评编辑

## 页面职责

### `/updates`

唯一的动态主入口。

职责：

- 显示全部动态
- 在同一时间流中混排不同类型内容
- 用户不需要理解栏目差异

### `object detail page`

不是新的前端入口，而是 `object` 类型动态的深读页。

职责：

- 承载长评
- 展示器物细节

## 当前结论

现在已经确认的新方向是：

> 站点前端只保留 `updates` 作为短内容主入口，动态系统本身支持 `note / movie / music / object` 四种正式内容类型。

这意味着后续实现应该围绕下面这条主线展开：

1. 给 `Update` 引入 `type`
2. 为四种类型定义 `metadata`
3. 让 `/updates` 按类型渲染不同内容体
4. 让后台发布页按类型切换表单

## 不再采用的旧方案

下面这些思路已经明确弃用：

- 独立的 `/curation` 前端主入口
- “动态 + 附件”的内容模型
- 把电影 / 音乐 / 物品当成附属内容，而不是正式动态类型
