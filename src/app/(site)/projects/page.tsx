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
        <div className="grid h-24 w-24 place-items-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 text-4xl dark:border-zinc-700 dark:bg-zinc-900/40">
          <span aria-hidden="true">⌘</span>
        </div>

        <div className="grid gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-zinc-400 dark:text-zinc-500">
            GitHub source
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
            项目页还没有绑定
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-7 text-zinc-500 dark:text-zinc-400 sm:text-base">
            绑定 GitHub 用户名后，这里会自动展示 Profile README 和公开仓库列表。
          </p>
        </div>
      </section>
    </main>
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
        <div className="flex h-40 w-40 items-center justify-center rounded-full border border-dashed border-zinc-300 text-4xl text-zinc-300 dark:border-zinc-700 dark:text-zinc-700 sm:h-52 sm:w-52 lg:h-64 lg:w-64">
          ?
        </div>
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            GitHub 资料不可用
          </h1>
          <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
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
        className="h-40 w-40 rounded-full border border-zinc-200 object-cover dark:border-zinc-800 sm:h-52 sm:w-52 lg:h-64 lg:w-64"
      />

      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {displayName}
        </h1>
        <p className="mt-1 text-xl text-zinc-500 dark:text-zinc-400">{login}</p>
      </div>

      {profile?.bio ? (
        <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">{profile.bio}</p>
      ) : null}

      <div className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-300">
        <p className="inline-flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-400" />
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">{profile.followers}</span>
          followers ·
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">{profile.following}</span>
          following
        </p>
        {profile.location ? (
          <p className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-zinc-400" />
            {profile.location}
          </p>
        ) : null}
        <p className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4 text-zinc-400" />
          {getLocalTimeLabel()}
        </p>
        {profile.blog ? (
          <Link
            href={profile.blog}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 transition hover:text-primary"
          >
            <Link2 className="h-4 w-4 text-zinc-400" />
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
