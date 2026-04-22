import { PublicSiteUnavailableScreen } from "@/components/public-site-unavailable-screen";
import { ProfileAvatar } from "@/components/profile-avatar";
import { siteConfig } from "@/lib/site";
import { getPublicSiteSettings, isPublicSiteUnavailableError } from "@/server/public-content";

export default async function HomePage() {
  let siteSettings;

  try {
    siteSettings = await getPublicSiteSettings();
  } catch (error) {
    if (isPublicSiteUnavailableError(error)) {
      return <PublicSiteUnavailableScreen />;
    }

    throw error;
  }

  const authorName = siteSettings.authorName ?? siteConfig.author;
  const avatarUrl = siteSettings.authorAvatarUrl ?? siteConfig.avatar;
  const summary = siteSettings.summary ?? siteConfig.summary;

  return (
    <main className="relative flex min-h-[calc(100dvh-6rem)] w-full items-center px-6 py-[clamp(1.5rem,6vh,4rem)] sm:min-h-[calc(100dvh-7rem)] sm:px-12 lg:px-24">
      <section className="relative z-10 mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[minmax(18rem,24rem)_minmax(24rem,34rem)] lg:justify-center lg:gap-10 xl:grid-cols-[minmax(20rem,26rem)_minmax(26rem,36rem)] xl:gap-12">
        <div className="flex justify-center">
          <div className="relative h-[20rem] w-[20rem] overflow-hidden rounded-full sm:h-[24rem] sm:w-[24rem] lg:h-[24rem] lg:w-[24rem] xl:h-[26rem] xl:w-[26rem]">
            <ProfileAvatar author={authorName} src={avatarUrl} />
          </div>
        </div>

        <div className="hero-copy max-w-3xl">
          <h1 className="hero-copy-title text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100 sm:text-5xl lg:text-6xl">
            {authorName}
          </h1>
          <p className="hero-copy-body reading-copy mt-6 text-lg leading-9 text-zinc-600 dark:text-zinc-300 sm:text-xl">
            Hi, I&apos;m {authorName}, an interest-driven{" "}
            <span
              className="hero-copy-typewriter font-mono text-[0.95em] text-primary dark:text-sky-300"
              aria-label="<Developer />"
            >
              <span className="hero-copy-typewriter-ghost" aria-hidden="true">
                &lt;Developer <span className="hero-copy-typewriter-closing">/</span>
                <span className="hero-copy-typewriter-angle">&gt;</span>
              </span>
              <span className="hero-copy-typewriter-text" aria-hidden="true">
                &lt;Developer <span className="hero-copy-typewriter-closing">/</span>
                <span className="hero-copy-typewriter-angle">&gt;</span>
              </span>
            </span>
          </p>
          <p className="hero-copy-body reading-copy mt-3 text-lg leading-9 text-zinc-600 dark:text-zinc-300 sm:text-xl">
            <span className="hero-copy-emphasis font-medium italic text-zinc-900 dark:text-zinc-100">
              builder and writer
            </span>{" "}
            exploring products, technology, and personal expression.
          </p>
          <p className="hero-copy-summary reading-copy mt-5 max-w-2xl text-base leading-8 text-zinc-500 dark:text-zinc-400">
            {summary}
          </p>
        </div>
      </section>
    </main>
  );
}
