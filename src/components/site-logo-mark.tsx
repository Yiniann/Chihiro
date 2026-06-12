import { siteConfig } from "@/lib/site";

type SiteLogoMarkProps = {
  caption?: string;
  siteName?: string;
};

export function SiteLogoMark({ caption, siteName = siteConfig.name }: SiteLogoMarkProps) {
  return (
    <div className="inline-flex flex-col items-center gap-3 text-center">
      <div>
        <p className="site-title-h3 tracking-tight text-zinc-950 dark:text-zinc-50">
          {siteName}
        </p>
        <p className="site-eyebrow uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
          Timeline
        </p>
      </div>
      {caption ? (
        <p className="site-meta max-w-sm text-zinc-500 dark:text-zinc-400">{caption}</p>
      ) : null}
    </div>
  );
}
