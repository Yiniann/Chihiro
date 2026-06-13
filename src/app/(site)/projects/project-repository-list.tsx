"use client";

import Link from "next/link";
import { ArrowUpRight, GitFork, Search, Star } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import type { GitHubProject } from "@/server/github-projects";

export function ProjectRepositoryList({
  projects,
  showHeading = true,
}: {
  projects: GitHubProject[];
  showHeading?: boolean;
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredProjects = useMemo(() => {
    if (!deferredQuery) {
      return projects;
    }

    return projects.filter((project) => {
      const searchableText = [
        project.title,
        project.description,
        project.language ?? "",
        ...project.topics,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(deferredQuery);
    });
  }, [deferredQuery, projects]);

  return (
    <section className="grid gap-7">
      {showHeading ? (
        <h2 className="site-title-h1 text-n-6">Projects</h2>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-n-4" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="Find a repository..."
          className="surface-shell h-14 w-full rounded-2xl px-12 text-base text-n-6 outline-none transition placeholder:text-n-4 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:text-n-6 dark:placeholder:text-n-5"
        />
      </div>

      <div className="grid gap-4">
        {filteredProjects.map((project) => (
          <RepositoryCard key={project.slug} project={project} />
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <p className="border-b border-dashed border-n-2 py-8 text-sm text-n-5 dark:border-n-2 dark:text-n-5">
          没有找到匹配的项目。
        </p>
      ) : null}
    </section>
  );
}

function RepositoryCard({ project }: { project: GitHubProject }) {
  return (
    <article className="surface-shell surface-shell-hover group relative rounded-2xl p-6">
      <Link
        href={project.href}
        target={project.href.startsWith("/") ? undefined : "_blank"}
        rel={project.href.startsWith("/") ? undefined : "noreferrer noopener"}
        className="absolute inset-0 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={`Open ${project.title}`}
      />

      <div className="pointer-events-none relative grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="site-title-h3 text-primary transition group-hover:opacity-80">
                {project.title}
              </h3>
              {project.isArchived ? (
                <span className="tag tag-accent">
                  Archived
                </span>
              ) : null}
              {project.isFork ? (
                <span className="tag tag-accent">
                  Fork
                </span>
              ) : null}
            </div>
            <p className="mt-4 max-w-4xl text-base leading-7 text-n-5">
              {project.description}
            </p>
          </div>

          <ArrowUpRight className="h-5 w-5 shrink-0 text-n-4 transition group-hover:text-primary dark:text-n-5" />
        </div>

        <div className="flex flex-wrap gap-2">
          {project.topics.map((topic) => (
            <span
              key={topic}
              className="tag tag-accent px-3 py-1 text-sm"
            >
              {topic}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-n-5">
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              {project.language ?? "Repository"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4" />
              {project.stars}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GitFork className="h-4 w-4" />
              {project.forks}
            </span>
          </div>

          {project.updatedLabel ? <span>{project.updatedLabel}</span> : null}
        </div>
      </div>
    </article>
  );
}
