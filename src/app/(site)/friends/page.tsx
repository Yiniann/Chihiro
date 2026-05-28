import type { Metadata } from "next";
import Link from "next/link";
import { FriendLinkApplicationDialog } from "@/components/friend-link-application-dialog";
import { FriendLinkPool } from "@/components/friend-link-pool";
import { fallbackSiteSettings } from "@/content/fallback";
import { getMoreSectionBySlug } from "@/lib/more-sections";
import { resolveCanonicalSiteUrl } from "@/lib/site";
import { listPublicFriendLinks } from "@/server/repositories/friend-links";
import { getSiteSettings } from "@/server/repositories/site";

export const metadata: Metadata = {
  title: "友链",
  description: "朋友、同行者与喜欢的网站。",
};

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const section = getMoreSectionBySlug("friends");
  const [links, siteSettings] = await Promise.all([
    listPublicFriendLinks(),
    getSiteSettings(),
  ]);
  const resolvedSiteSettings = siteSettings ?? fallbackSiteSettings;
  const siteUrl = resolveCanonicalSiteUrl(resolvedSiteSettings);
  const siteIntro = resolvedSiteSettings.siteSubtitle || resolvedSiteSettings.siteDescription;
  const siteAvatarUrl = resolvedSiteSettings.authorAvatarUrl
    ? new URL(resolvedSiteSettings.authorAvatarUrl, siteUrl).toString()
    : null;

  if (!section) {
    throw new Error("Missing more section config for friends.");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-16 sm:px-10">
      <section className="pb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
            {section.eyebrow}
          </p>
          <h1 className="mt-4 flex flex-wrap items-baseline gap-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            <span>{section.title}</span>
            <span className="text-base font-medium tracking-normal text-zinc-400 dark:text-zinc-500">
              ·
            </span>
            <span className="text-base font-medium tracking-normal text-zinc-500 dark:text-zinc-400">
              朋友们
            </span>
          </h1>
        </div>
      </section>

      {links.length > 0 ? (
        <FriendLinkPool links={links} />
      ) : (
        <section className="mt-10 rounded-[2rem] border border-dashed border-zinc-300/80 px-8 py-14 text-center dark:border-zinc-700/80">
          <p className="text-lg font-medium text-zinc-950 dark:text-zinc-50">暂时还没有朋友来访</p>
          <p className="mt-3 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            不过没关系，风会带来消息，路也会通向新的名字。
          </p>
        </section>
      )}

      <section className="mt-12 grid gap-5 px-0 py-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/75">
              Link Request
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              友链申请说明
            </h2>
          </div>

          <FriendLinkApplicationDialog />
        </div>

        <div className="grid gap-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          <p>
            如果你也想把名字留在这里，欢迎带着你的网站来交换友链。
          </p>
          <p>
            如果想把名字留在这里，也请先让我的小站在你那里有一处落脚的地方。
          </p>
          <p>
            站点最好已经可以稳定访问，有自己的内容更新，也请尽量保留清晰的关于页或联系方式，方便我认识你。
          </p>
          <p>
            申请时可以附上站点名称、网址、一句话介绍、头像或站标，以及 RSS 地址。如果你愿意，也可以顺手说说为什么想交换友链。
          </p>
        </div>

        <div className="grid gap-4">
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">本站信息</p>
          <div className="grid gap-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            <p>
              <span className="text-zinc-400 dark:text-zinc-500">名称：</span>
              {resolvedSiteSettings.siteName}
            </p>
            <p>
              <span className="text-zinc-400 dark:text-zinc-500">地址：</span>
              <Link
                href={siteUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-zinc-950 underline decoration-zinc-300 underline-offset-4 dark:text-zinc-100 dark:decoration-zinc-700"
              >
                {siteUrl}
              </Link>
            </p>
            <p>
              <span className="text-zinc-400 dark:text-zinc-500">简介：</span>
              {siteIntro}
            </p>
            {siteAvatarUrl ? (
              <p>
                <span className="text-zinc-400 dark:text-zinc-500">头像：</span>
                <Link
                  href={siteAvatarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-zinc-950 underline decoration-zinc-300 underline-offset-4 dark:text-zinc-100 dark:decoration-zinc-700"
                >
                  {siteAvatarUrl}
                </Link>
              </p>
            ) : null}
            <p>
              <span className="text-zinc-400 dark:text-zinc-500">RSS：</span>
              <Link
                href={`${siteUrl}/feed`}
                target="_blank"
                rel="noreferrer"
                className="break-all text-zinc-950 underline decoration-zinc-300 underline-offset-4 dark:text-zinc-100 dark:decoration-zinc-700"
              >
                {siteUrl}/feed
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
