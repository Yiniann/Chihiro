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
      <div className="border-b border-n-2">
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
          <section className="surface-shell rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h1 className="truncate font-mono text-base font-medium text-n-6 sm:text-lg">
                {readmeTitle}
              </h1>
              <Pencil className="h-5 w-5 shrink-0 text-n-4" />
            </div>

            {readmeMarkdown ? (
              <GitHubProfileReadme markdown={readmeMarkdown} />
            ) : (
              <div className="mt-6 border-t border-dashed border-n-2 pt-6 dark:border-n-2">
                <p className="site-body text-n-5">
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
        "site-meta inline-flex h-12 items-center gap-2 border-b-2 px-1 font-medium transition",
        active
          ? "border-primary text-n-6"
          : "border-transparent text-n-5 hover:border-n-3 hover:text-n-6 dark:text-n-5 dark:hover:border-n-3 dark:hover:text-n-6",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className="badge badge-soft">
          {count}
        </span>
      ) : null}
    </button>
  );
}
