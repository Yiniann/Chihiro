import Link from "next/link";
import { SiteLiveVisitors } from "@/components/site-live-visitors";
import { FooterSubscribeLink } from "@/components/subscription-form";

const footerFeedLinks: ReadonlyArray<{
  href: string;
  label: string;
  openInNewTab: boolean;
  isSubscriptionTrigger?: boolean;
}> = [
  {
    href: "/feed",
    label: "RSS",
    openInNewTab: true,
  },
  {
    href: "/sitemap.xml",
    label: "Sitemap",
    openInNewTab: true,
  },
  {
    href: "/subscribe",
    label: "Subscribe",
    openInNewTab: false,
    isSubscriptionTrigger: true,
  },
] as const;

export function SiteFooter({
  siteName,
  authorName,
  motto,
  email,
  githubUrl,
  subscriptionsEnabled,
  siteLiveVisitorsEnabled,
}: {
  siteName: string;
  authorName: string;
  motto: string;
  email: string | null;
  githubUrl: string | null;
  subscriptionsEnabled: boolean;
  siteLiveVisitorsEnabled: boolean;
}) {
  const currentYear = new Date().getFullYear();
  const mottoLines = getFooterMottoLines(motto);
  const footerContactLinks = [
    ...(email
      ? [
          {
            href: `mailto:${email}`,
            label: "Email",
            external: true,
          },
        ]
      : []),
    ...(githubUrl
      ? [
          {
            href: githubUrl,
            label: "GitHub",
            external: true,
          },
        ]
      : []),
    {
      href: "/message",
      label: "Message",
      external: false,
    },
  ];

  return (
    <footer className="site-footer-surface relative z-10 mt-20">
      <div
        aria-hidden="true"
        className="site-footer-fade pointer-events-none absolute inset-x-0 -top-40 h-40"
      />

      <div className="relative mx-auto max-w-6xl px-6 pb-8 pt-14 sm:px-10">
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-[minmax(0,0.86fr)_auto] lg:items-start lg:gap-16">
          <div className="col-span-2 lg:col-span-1">
            <div>
              <p className="site-meta text-n-6">
                {authorName}
              </p>
            </div>

            <p className="site-meta mt-2 text-n-5">
              {mottoLines.map((line, index) => (
                <span key={`${line}-${index}`} className="block">
                  {line}
                </span>
              ))}
            </p>

            {siteLiveVisitorsEnabled ? <SiteLiveVisitors /> : null}
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-8 lg:col-span-1 lg:justify-self-end lg:gap-16">
            <div>
              <p className="site-eyebrow uppercase tracking-[0.22em] text-n-4">
                Follow
              </p>
              <div className="mt-4 grid gap-3">
                {footerFeedLinks.map((item) => {
                  if (item.isSubscriptionTrigger && !subscriptionsEnabled) {
                    return null;
                  }

                  const className =
                    "group inline-flex w-fit items-center gap-3 site-meta text-n-5 transition hover:text-n-6 dark:text-n-5 dark:hover:text-n-6";
                  const content = (
                    <>
                      <span>{item.label}</span>
                      <span className="text-zinc-300 transition group-hover:text-n-5 dark:text-n-6 dark:group-hover:text-n-4">
                        /
                      </span>
                    </>
                  );

                  if (item.isSubscriptionTrigger) {
                    return (
                      <FooterSubscribeLink
                        key={item.label}
                        className={className}
                        siteName={siteName}
                      >
                        {content}
                      </FooterSubscribeLink>
                    );
                  }

                  if (item.openInNewTab) {
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={className}
                      >
                        {content}
                      </a>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href} className={className}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="site-eyebrow uppercase tracking-[0.22em] text-n-4">
                Contact
              </p>
              <div className="mt-4 grid gap-3">
                {footerContactLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer noopener" : undefined}
                    className="group inline-flex w-fit items-center gap-3 site-meta text-n-5 transition hover:text-n-6 dark:text-n-5 dark:hover:text-n-6"
                  >
                    <span>{item.label}</span>
                    <span className="text-zinc-300 transition group-hover:text-n-5 dark:text-n-6 dark:group-hover:text-n-4">
                      /
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="site-eyebrow mt-12 flex items-center justify-between gap-4 border-t border-n-2 pt-6 text-n-5 dark:border-n-2 dark:text-n-5">
          <span className="whitespace-nowrap">© {currentYear} {authorName}</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Yiniann/Chihiro"
              target="_blank"
              rel="noreferrer"
              className="whitespace-nowrap transition hover:text-n-6 dark:hover:text-n-6"
            >
              Powered by {siteName}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function getFooterMottoLines(motto: string) {
  return motto
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
