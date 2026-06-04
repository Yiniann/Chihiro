"use client";

import { BookOpen, GitFork, Pencil } from "lucide-react";
import { useState } from "react";
import type { GitHubProject } from "@/server/github-projects";
import { GitHubProfileReadme } from "@/app/(site)/projects/github-profile-readme";
import { ProjectRepositoryList } from "@/app/(site)/projects/project-repository-list";

type GitHubProfileTabsProps = {
  projects: GitHubProject[];
  readmeMarkdown: string | null;
  readmeTitle: string;
};

export function GitHubProfileTabs({
  projects,
  readmeMarkdown,
  readmeTitle,
}: GitHubProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "repositories">("repositories");

  return (
    <section className="min-w-0">
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="-mb-px flex items-center gap-5 overflow-x-auto" aria-label="GitHub profile sections">
          <TabButton
            active={activeTab === "overview"}
            icon={BookOpen}
            label="Overview"
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            active={activeTab === "repositories"}
            count={projects.length}
            icon={GitFork}
            label="Repositories"
            onClick={() => setActiveTab("repositories")}
          />
        </nav>
      </div>

      <div className="pt-6">
        {activeTab === "overview" ? (
          <section className="rounded-md border border-zinc-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/14 dark:bg-[rgba(255,255,255,0.06)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="truncate font-mono text-base font-semibold text-zinc-950 dark:text-zinc-50 sm:text-lg">
                {readmeTitle}
              </h1>
              <Pencil className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
            </div>

            {readmeMarkdown ? (
              <GitHubProfileReadme markdown={readmeMarkdown} />
            ) : (
              <div className="mt-6 border-t border-dashed border-zinc-200 pt-6 dark:border-zinc-800">
                <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                  这个 GitHub 用户还没有公开的 Profile README。
                </p>
              </div>
            )}
          </section>
        ) : (
          <ProjectRepositoryList projects={projects} showHeading={false} />
        )}
      </div>
    </section>
  );
}

function TabButton({
  active,
  count,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  count?: number;
  icon: typeof BookOpen;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex h-12 items-center gap-2 border-b-2 px-1 text-sm font-medium transition",
        active
          ? "border-primary text-zinc-950 dark:text-zinc-50"
          : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          {count}
        </span>
      ) : null}
    </button>
  );
}
