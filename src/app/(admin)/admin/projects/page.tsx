import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { BulkSelectToggle } from "@/app/(admin)/admin/bulk-select-toggle";
import { LiveSearchInput } from "@/app/(admin)/admin/live-search-input";
import { ProjectActionMenu } from "@/app/(admin)/admin/projects/project-action-menu";
import { ProjectBulkActionBar } from "@/app/(admin)/admin/projects/project-bulk-action-bar";
import { EmptyPanel } from "@/app/(admin)/admin/ui";
import { formatAdminNumber } from "@/app/(admin)/admin/utils";
import { fallbackSiteSettings } from "@/content/fallback";
import { listGitHubUserProjects, type GitHubProject } from "@/server/github-projects";
import { getSiteSettings } from "@/server/repositories/site";
import {
  saveProjectGitHubSourceAction,
  setProjectVisibilityBulkAction,
} from "@/app/(admin)/admin/projects/actions";

type AdminProjectsSearchParams = Promise<{
  q?: string;
}>;

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: AdminProjectsSearchParams;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const siteSettings = await getSiteSettings();
  const resolvedSiteSettings = siteSettings ?? fallbackSiteSettings;
  const githubUsername = resolvedSiteSettings.projectsGitHubUsername;
  const projects = githubUsername ? await listGitHubUserProjects(githubUsername) : [];
  const hiddenProjectSlugs = new Set(resolvedSiteSettings.hiddenProjectSlugs);
  const visibleProjects = projects.filter((project) => !hiddenProjectSlugs.has(project.slug));
  const hiddenProjects = projects.filter((project) => hiddenProjectSlugs.has(project.slug));
  const filteredVisibleProjects = filterProjects(visibleProjects, query);
  const filteredHiddenProjects = filterProjects(hiddenProjects, query);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800/80">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">项目管理</p>
          </div>

          {githubUsername ? (
            <LiveSearchInput defaultValue={query} placeholder="搜索项目、描述、语言或标签" />
          ) : null}
        </div>

        {githubUsername ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {query
              ? `显示中匹配 ${filteredVisibleProjects.length} 个，已隐藏匹配 ${filteredHiddenProjects.length} 个项目`
              : `当前绑定 @${githubUsername}，显示中 ${visibleProjects.length} 个，已隐藏 ${hiddenProjects.length} 个，共 ${projects.length} 个公开仓库`}
          </p>
        ) : null}
      </section>

      <ProjectSourceSection githubUsername={githubUsername} />

      {!githubUsername ? (
        <EmptyPanel text="请先绑定 GitHub 用户名。" />
      ) : projects.length > 0 ? (
        <>
          <ProjectSection
            title="显示中的项目"
            description={
              query
                ? `匹配到 ${filteredVisibleProjects.length} 个显示中的项目`
                : `这些项目会展示在前台项目页中，共 ${formatAdminNumber(visibleProjects.length)} 个`
            }
            projects={filteredVisibleProjects}
            emptyText={query ? "没有找到匹配的显示中项目。" : "当前没有显示中的项目。"}
            hidden={false}
          />

          <ProjectSection
            title="已隐藏的项目"
            description={
              query
                ? `匹配到 ${filteredHiddenProjects.length} 个已隐藏项目`
                : `这些项目当前不会展示在前台项目页中，共 ${formatAdminNumber(hiddenProjects.length)} 个`
            }
            projects={filteredHiddenProjects}
            emptyText={query ? "没有找到匹配的已隐藏项目。" : "当前没有隐藏项目。"}
            hidden
          />
        </>
      ) : (
        <EmptyPanel text="GitHub 暂时没有返回公开仓库。" />
      )}
    </div>
  );
}

function ProjectSourceSection({ githubUsername }: { githubUsername: string | null }) {
  return (
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
        <form
          action={saveProjectGitHubSourceAction}
          className="flex min-w-0 flex-col gap-3 sm:flex-row"
        >
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
  );
}

function ProjectSection({
  title,
  description,
  projects,
  emptyText,
  hidden,
}: {
  title: string;
  description: string;
  projects: GitHubProject[];
  emptyText: string;
  hidden: boolean;
}) {
  const formId = hidden ? "hidden-projects-bulk-form" : "visible-projects-bulk-form";

  return (
    <section className="grid gap-4">
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>

      {projects.length > 0 ? (
        <form id={formId} action={setProjectVisibilityBulkAction}>
          <input type="hidden" name="visibility" value={hidden ? "visible" : "hidden"} />
        </form>
      ) : null}

      {projects.length > 0 ? (
        <div className="bulk-selection-form grid gap-3">
          <ProjectBulkActionBar formId={formId} hidden={hidden} />

          <section className="relative overflow-visible">
            <div className="hidden border-b border-zinc-200/80 lg:block dark:border-white/10">
              <div className="grid items-center gap-3 px-5 py-4 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 lg:grid-cols-[2.25rem_minmax(14rem,2fr)_minmax(8rem,1fr)_4.5rem_4.5rem_6.5rem_5.75rem_4.75rem]">
                <div className="inline-flex items-center">
                  <BulkSelectToggle formId={formId} checkboxName="projectSlugs" />
                </div>
                <div>项目</div>
                <div>语言 / 标签</div>
                <div className="text-right">Star</div>
                <div className="text-right">Fork</div>
                <div className="text-right">更新于</div>
                <div>状态</div>
                <div>操作</div>
              </div>
            </div>

            <div className="divide-y divide-zinc-200/80 dark:divide-white/10">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="px-4 py-4 transition hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] lg:px-5 lg:py-4"
                >
                  <div className="hidden items-center gap-3 lg:grid lg:grid-cols-[2.25rem_minmax(14rem,2fr)_minmax(8rem,1fr)_4.5rem_4.5rem_6.5rem_5.75rem_4.75rem]">
                    <ProjectTableRow project={project} hidden={hidden} formId={formId} />
                  </div>
                  <div className="lg:hidden">
                    <ProjectMobileRow project={project} hidden={hidden} formId={formId} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <EmptyPanel text={emptyText} />
      )}
    </section>
  );
}

function ProjectTableRow({
  project,
  hidden,
  formId,
}: {
  project: GitHubProject;
  hidden: boolean;
  formId: string;
}) {
  return (
    <>
      <div className="flex items-center">
        <ProjectCheckbox project={project} formId={formId} />
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="truncate text-[15px] font-medium leading-6 text-zinc-900 transition hover:text-primary dark:text-zinc-50"
          >
            {project.title}
          </Link>
          <a
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-[rgb(var(--primary-rgb)/0.08)] hover:text-primary dark:text-zinc-500"
            aria-label="查看 GitHub 仓库"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {project.isArchived ? <ProjectMetaBadge label="Archived" /> : null}
          {project.isFork ? <ProjectMetaBadge label="Fork" /> : null}
        </div>

        {project.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {project.description}
          </p>
        ) : null}
      </div>

      <div className="min-w-0 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="truncate">
          {project.language ?? "—"}
          {project.topics.length > 0 ? ` · ${project.topics.slice(0, 2).join(", ")}` : ""}
        </div>
      </div>

      <TableMetric value={formatAdminNumber(project.stars)} />
      <TableMetric value={formatAdminNumber(project.forks)} />
      <TableDate value={project.updatedLabel ?? null} />
      <div>
        <ProjectVisibilityBadge hidden={hidden} />
      </div>
      <div className="justify-self-start">
        <ProjectActionMenu projectSlug={project.slug} hidden={hidden} />
      </div>
    </>
  );
}

function ProjectMobileRow({
  project,
  hidden,
  formId,
}: {
  project: GitHubProject;
  hidden: boolean;
  formId: string;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
      <div className="pt-1">
        <ProjectCheckbox project={project} formId={formId} />
      </div>
      <div className="min-w-0">
        <div className="overflow-hidden">
          <Link
            href={project.href}
            target="_blank"
            rel="noreferrer"
            className="block w-full truncate text-[15px] font-medium leading-6 text-zinc-900 dark:text-zinc-50"
          >
            {project.title}
          </Link>
        </div>
        {project.description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {project.description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center pl-1">
        <ProjectActionMenu projectSlug={project.slug} hidden={hidden} compact />
      </div>
      <div className="col-span-3 mt-1 flex items-center justify-between gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="min-w-0 truncate whitespace-nowrap">
          {project.language ?? "未标注语言"}
        </span>
        <div className="flex shrink-0 items-center gap-3">
          <span>{formatAdminNumber(project.stars)} Star</span>
          <span>{formatAdminNumber(project.forks)} Fork</span>
          <ProjectVisibilityBadge hidden={hidden} />
        </div>
      </div>
    </div>
  );
}

function ProjectCheckbox({
  project,
  formId,
}: {
  project: GitHubProject;
  formId: string;
}) {
  return (
    <input
      type="checkbox"
      name="projectSlugs"
      value={project.slug}
      form={formId}
      aria-label={`选择项目 ${project.title}`}
      className="h-4 w-4 rounded-[5px] border-zinc-300 text-primary focus:ring-primary/30 dark:border-white/15"
    />
  );
}

function ProjectVisibilityBadge({ hidden }: { hidden: boolean }) {
  const className = hidden
    ? "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-400 dark:ring-zinc-800"
    : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-300 dark:ring-emerald-400/10";

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {hidden ? "已隐藏" : "显示中"}
    </span>
  );
}

function ProjectMetaBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
      {label}
    </span>
  );
}

function TableMetric({ value }: { value: string }) {
  return <div className="text-right text-sm text-zinc-700 dark:text-zinc-200">{value}</div>;
}

function TableDate({ value }: { value: string | null }) {
  return (
    <div className="w-full text-right text-sm text-zinc-500 dark:text-zinc-400">
      {value ?? "—"}
    </div>
  );
}

function filterProjects(projects: GitHubProject[], query: string) {
  if (!query) {
    return projects;
  }

  const normalizedQuery = query.toLocaleLowerCase("zh-CN");

  return projects.filter((project) => {
    const haystack = [
      project.title,
      project.description ?? "",
      project.language ?? "",
      ...project.topics,
    ]
      .join(" ")
      .toLocaleLowerCase("zh-CN");

    return haystack.includes(normalizedQuery);
  });
}
