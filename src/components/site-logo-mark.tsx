import { siteConfig } from "@/lib/site";

type SiteLogoMarkProps = {
  caption?: string;
  siteName?: string;
};

export function SiteLogoMark({ caption, siteName = siteConfig.name }: SiteLogoMarkProps) {
  return (
    <div className="inline-flex flex-col items-center gap-3 text-center">
      <div>
        <p className="site-title-h3 tracking-tight text-n-6">
          {siteName}
        </p>
        <p className="site-eyebrow uppercase tracking-[0.24em] text-n-4">
          Timeline
        </p>
      </div>
      {caption ? (
        <p className="site-meta max-w-sm text-n-5">{caption}</p>
      ) : null}
    </div>
  );
}
