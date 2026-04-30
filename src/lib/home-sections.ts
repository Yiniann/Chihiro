export type HomeSection = {
  slug: string;
  href: string;
  eyebrow: string;
  title: string;
  description: string;
};

export const homeSections: HomeSection[] = [
  {
    slug: "about",
    href: "/about",
    eyebrow: "About",
    title: "自述",
    description: "放关于自己与站点的说明。",
  },
  {
    slug: "message",
    href: "/message",
    eyebrow: "Message",
    title: "留言",
    description: "放留言、联系与来信入口。",
  },
];

export function getHomeSectionBySlug(slug: string) {
  return homeSections.find((item) => item.slug === slug) ?? null;
}
