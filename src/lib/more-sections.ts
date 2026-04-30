export type MoreSection = {
  slug: string;
  href: string;
  eyebrow: string;
  title: string;
  description: string;
};

export const moreSections: MoreSection[] = [
  {
    slug: "projects",
    href: "/projects",
    eyebrow: "Projects",
    title: "项目",
    description: "正在进行的项目、实验与长期计划。",
  },
  {
    slug: "friends",
    href: "/friends",
    eyebrow: "Friends",
    title: "友链",
    description: "喜欢的网站、朋友与同行者链接。",
  },
  {
    slug: "reviews",
    href: "/reviews",
    eyebrow: "Reviews",
    title: "品鉴",
    description: "电影、音乐、游戏与器物短评。",
  },
  {
    slug: "bookmarks",
    href: "/bookmarks",
    eyebrow: "Bookmarks",
    title: "书签",
    description: "平时收藏的文章、工具与资源链接。",
  },
];

export function getMoreSectionBySlug(slug: string) {
  return moreSections.find((item) => item.slug === slug) ?? null;
}
