import Link from "next/link";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { formatAdminNumber } from "@/app/(admin)/admin/utils";
import { fallbackSiteSettings } from "@/content/fallback";
import { listGitHubUserProjects } from "@/server/github-projects";
import { getSiteSettings } from "@/server/repositories/site";
import {
  saveProjectGitHubSourceAction,
  toggleProjectVisibilityAction,
} from "@/app/(admin)/admin/projects/actions";

export default async function AdminProjectsPage() {
  const siteSettings = await getSiteSettings();
  const resolvedSiteSettings = siteSettings ?? fallbackSiteSettings;
  const githubUsername = resolvedSiteSettings.projectsGitHubUsername;
  const projects = githubUsername ? await listGitHubUserProjects(githubUsername) : [];
  const hiddenProjectSlugs = new Set(resolvedSiteSettings.hiddenProjectSlugs);
  const visibleProjectCount = projects.filter(
    (project) => !hiddenProjectSlugs.has(project.slug),
  ).length;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">项目</p>
          </div>

        </div>
      </section>

      <section className="grid gap-3 border-b border-zinc-200/80 pb-6 dark:border-zinc-800/80">
        <div className="grid gap-1">
          <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            绑定项目页展示 GitHub
          </p>
        </div>

        {githubUsername ? (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              当前绑定{" "}
              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                @{githubUsername}
              </span>
            </div>
            <form action={saveProjectGitHubSourceAction}>
              <input name="githubUsername" type="hidden" value="" />
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-zinc-200 px-5 text-sm font-medium text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-red-950 dark:hover:bg-red-950/30 dark:hover:text-red-300 lg:w-auto"
              >
                解除绑定
              </button>
            </form>
          </div>
        ) : (
          <form action={saveProjectGitHubSourceAction} className="flex min-w-0 flex-col gap-3 sm:flex-row">
            <input
              name="githubUsername"
              placeholder="GitHub 用户名或链接"
              className="h-11 min-w-0 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            >
              保存绑定
            </button>
          </form>
        )}
      </section>

      {!githubUsername ? (
        <EmptyPanel text="请先绑定 GitHub 用户名。" />
      ) : projects.length > 0 ? (
        <section className="grid gap-0">
          <div className="border-b border-zinc-200/80 pb-4 text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
            @{githubUsername} · {formatAdminNumber(visibleProjectCount)} 个显示中 ·{" "}
            {formatAdminNumber(hiddenProjectSlugs.size)} 个已隐藏 ·{" "}
            {formatAdminNumber(projects.length)} 个公开仓库
          </div>

          {projects.map((project) => {
            const isHidden = hiddenProjectSlugs.has(project.slug);

            return (
              <article
                key={project.id}
                className="grid gap-4 border-b border-zinc-200/80 py-5 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_auto] dark:border-zinc-800/80"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={project.href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-zinc-950 transition hover:text-primary dark:text-zinc-50"
                    >
                      {project.title}
                    </Link>
                    {isHidden ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        已隐藏
                      </span>
                    ) : null}
                    {project.isArchived ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        Archived
                      </span>
                    ) : null}
                    {project.isFork ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        Fork
                      </span>
                    ) : null}
                  </div>

                  {project.description ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {project.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {project.language ? <span>{project.language}</span> : null}
                    <span>Star {formatAdminNumber(project.stars)}</span>
                    <span>Fork {formatAdminNumber(project.forks)}</span>
                    {project.updatedLabel ? <span>{project.updatedLabel}</span> : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-3 lg:justify-end">
                  <form action={toggleProjectVisibilityAction}>
                    <input name="projectSlug" type="hidden" value={project.slug} />
                    <button
                      type="submit"
                      className="border-b border-transparent py-1 text-xs font-medium text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
                    >
                      {isHidden ? "恢复显示" : "隐藏"}
                    </button>
                  </form>
                  <Link
                    href={project.href}
                    target="_blank"
                    rel="noreferrer"
                    className="border-b border-transparent py-1 text-xs font-medium text-primary transition hover:border-primary/30"
                  >
                    打开仓库
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <EmptyPanel text="GitHub 暂时没有返回公开仓库。" />
      )}
    </div>
  );
}
