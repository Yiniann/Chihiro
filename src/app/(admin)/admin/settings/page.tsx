import Link from "next/link";
import { isOwnerAuthenticated } from "@/server/auth";

export default async function AdminSettingsPage() {
  const isOwner = await isOwnerAuthenticated();

  return (
    <div className="grid gap-10">
      <section className="grid gap-2">
        <SettingsEntry
          isOwner={isOwner}
          href="/admin/settings/general"
          eyebrow="Basic"
          title="常规设置"
          description="修改站点基础资料，包括站点名、作者、站点地址和外部联系方式。"
        />
        <SettingsEntry
          isOwner={isOwner}
          href="/admin/settings/image-hosting"
          eyebrow="图床"
          title="图床设置"
          description="对接 Cloudflare R2 或 S3 兼容对象存储，用于富文本编辑器图片上传。"
        />
        <SettingsEntry
          isOwner={isOwner}
          href="/admin/settings/login-comments"
          eyebrow="Auth"
          title="登录与评论"
          description="检查 GitHub 登录配置，控制公开评论入口、登录要求和审核策略。"
        />
        <SettingsEntry
          isOwner={isOwner}
          href="/admin/settings/users"
          eyebrow="Users"
          title="用户与权限"
          description="管理公开登录用户角色；管理员可以进入后台，普通用户只能参与评论等公开互动。"
        />
      </section>
    </div>
  );
}

function SettingsEntry({
  isOwner,
  href,
  eyebrow,
  title,
  description,
}: {
  isOwner: boolean;
  href: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  const content = (
    <>
      <span className="text-[0.68rem] font-medium uppercase tracking-[0.28em] text-zinc-400 dark:text-zinc-500">
        {eyebrow}
      </span>
      <span className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </span>
      <span className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
        {isOwner ? description : "只有 Owner 可以修改此设置。"}
      </span>
    </>
  );

  if (!isOwner) {
    return <div className="grid gap-2 border-b border-zinc-200/80 py-5 text-left opacity-55 dark:border-zinc-800/80">{content}</div>;
  }

  return (
    <Link
      href={href}
      className="grid gap-2 border-b border-zinc-200/80 py-5 text-left transition hover:text-primary dark:border-zinc-800/80"
    >
      {content}
    </Link>
  );
}
