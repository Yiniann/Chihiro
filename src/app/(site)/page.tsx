import { PublicSiteUnavailableScreen } from "@/components/public-site-unavailable-screen";
import { ProfileAvatar } from "@/components/profile-avatar";
import { HeroIntro } from "@/components/hero-intro";
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
  const heroIntro = siteSettings.heroIntro ?? siteConfig.heroIntro;
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
          <HeroIntro intro={heroIntro} authorName={authorName} />
          <p className="hero-copy-summary reading-copy mt-5 max-w-2xl text-base leading-8 text-zinc-500 dark:text-zinc-400">
            {summary}
          </p>
        </div>
      </section>
    </main>
  );
}
