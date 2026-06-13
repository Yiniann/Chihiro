import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Link2, MapPin, Users } from "lucide-react";
import { StaggerReveal, StaggerRevealItem } from "@/components/stagger-reveal";
import { fallbackSiteSettings } from "@/content/fallback";
import {
  getGitHubProfileReadme,
  getGitHubUserProfile,
  listGitHubUserProjects,
  type GitHubUserProfile,
} from "@/server/github-projects";
import { getSiteSettings } from "@/server/repositories/site";
import { GitHubProfileTabs } from "@/app/(site)/projects/github-profile-tabs";

export const metadata: Metadata = {
  title: "项目",
  description: "项目、技术栈与正在进行中的构建。",
};

export default async function ProjectsPage() {
  const siteSettings = await getSiteSettings();
  const resolvedSiteSettings = siteSettings ?? fallbackSiteSettings;
  const githubUsername = resolvedSiteSettings.projectsGitHubUsername;

  if (!githubUsername) {
    return <UnboundProjectsPage />;
  }

  const [githubProjects, profileReadme, githubProfile] = await Promise.all([
    listGitHubUserProjects(githubUsername),
    getGitHubProfileReadme(githubUsername),
    getGitHubUserProfile(githubUsername),
  ]);
  const hiddenProjectSlugs = new Set(resolvedSiteSettings.hiddenProjectSlugs);
  const visibleProjects = githubProjects.filter((project) => !hiddenProjectSlugs.has(project.slug));
  const readmeTitle = `${githubUsername}/README.md`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12 sm:px-10">
      <StaggerReveal className="grid gap-16" delayChildren={0.04} staggerChildren={0.08}>
        <StaggerRevealItem className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
          <GitHubProfileCard profile={githubProfile} />

          <GitHubProfileTabs
            projects={visibleProjects}
            readmeMarkdown={profileReadme}
            readmeTitle={readmeTitle}
          />
        </StaggerRevealItem>
      </StaggerReveal>
    </main>
  );
}

function UnboundProjectsPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12 sm:px-10">
      <section className="relative mx-auto grid w-full max-w-2xl justify-items-center gap-6 py-16 text-center">
        <div className="absolute inset-x-0 top-1/2 -z-10 h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent dark:via-zinc-800" />
        <div className="grid h-24 w-24 place-items-center">
          <GitHubMark className="h-10 w-10 text-n-6" />
        </div>

        <div className="grid gap-3">
          <p className="site-eyebrow uppercase tracking-[0.28em] text-n-4">
            GitHub source
          </p>
          <h1 className="site-title-page tracking-tight text-n-6">
            项目页还没有绑定
          </h1>
        </div>
      </section>
    </main>
  );
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.09 3.3 9.4 7.88 10.92.58.1.8-.25.8-.57 0-.28-.02-1.22-.02-2.22-2.89.53-3.64-.71-3.88-1.37-.14-.34-.74-1.37-1.26-1.65-.42-.22-1.02-.77-.02-.79.95-.02 1.63.87 1.85 1.23 1.08 1.81 2.81 1.31 3.5 1 .1-.79.42-1.31.76-1.61-2.57-.28-5.25-1.29-5.25-5.72 0-1.27.46-2.32 1.21-3.14-.12-.28-.52-1.45.12-3.02 0 0 .99-.32 3.25 1.21a11.2 11.2 0 0 1 5.92 0c2.26-1.55 3.25-1.21 3.25-1.21.64 1.57.24 2.74.12 3.02.76.82 1.21 1.87 1.21 3.14 0 4.45-2.7 5.44-5.27 5.72.42.36.78 1.05.78 2.14 0 1.55-.02 2.79-.02 3.18 0 .32.22.69.8.57A11.53 11.53 0 0 0 23.5 12.02C23.5 5.66 18.35.5 12 .5Z" />
    </svg>
  );
}

function GitHubProfileCard({
  profile,
}: {
  profile: GitHubUserProfile | null;
}) {
  if (!profile) {
    return (
      <aside className="grid gap-5">
        <div className="flex h-40 w-40 items-center justify-center rounded-full border border-dashed border-n-3 text-4xl text-n-3 dark:border-n-3 dark:text-n-6 sm:h-52 sm:w-52 lg:h-64 lg:w-64">
          ?
        </div>
        <div className="grid gap-2">
          <h1 className="site-title-h2 tracking-tight text-n-6">
            GitHub 资料不可用
          </h1>
          <p className="site-body text-n-5">
            暂时没有读取到这个用户的公开资料。
          </p>
        </div>
      </aside>
    );
  }

  const displayName = profile.name ?? profile.login;
  const login = profile.login;

  return (
    <aside className="grid gap-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={profile.avatarUrl}
        alt={`${displayName} avatar`}
        className="h-40 w-40 rounded-full border border-n-2 object-cover dark:border-n-2 sm:h-52 sm:w-52 lg:h-64 lg:w-64"
      />

      <div>
        <h1 className="site-title-h1 tracking-tight text-n-6">
          {displayName}
        </h1>
        <p className="site-lead mt-1 text-n-5">{login}</p>
      </div>

      {profile?.bio ? (
        <p className="site-body text-n-5">{profile.bio}</p>
      ) : null}

      <div className="site-meta grid gap-3 text-n-5">
        <p className="inline-flex items-center gap-2">
          <Users className="h-4 w-4 text-n-4" />
          <span className="font-semibold text-n-6">{profile.followers}</span>
          followers ·
          <span className="font-semibold text-n-6">{profile.following}</span>
          following
        </p>
        {profile.location ? (
          <p className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-n-4" />
            {profile.location}
          </p>
        ) : null}
        <p className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4 text-n-4" />
          {getLocalTimeLabel()}
        </p>
        {profile.blog ? (
          <Link
            href={profile.blog}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 transition hover:text-primary"
          >
            <Link2 className="h-4 w-4 text-n-4" />
            {formatUrlLabel(profile.blog)}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}

function getLocalTimeLabel() {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
    timeZoneName: "shortOffset",
  }).format(new Date());
}

function formatUrlLabel(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}
