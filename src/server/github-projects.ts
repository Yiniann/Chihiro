type GitHubRepositoryResponse = {
  archived: boolean;
  description: string | null;
  fork: boolean;
  forks_count: number;
  html_url: string;
  id: number;
  language: string | null;
  name: string;
  private: boolean;
  pushed_at: string | null;
  stargazers_count: number;
  topics?: string[];
  updated_at: string | null;
};

type GitHubUserResponse = {
  avatar_url: string;
  bio: string | null;
  blog: string | null;
  followers: number;
  following: number;
  html_url: string;
  location: string | null;
  login: string;
  name: string | null;
};

const GITHUB_REVALIDATE_SECONDS = 60 * 60;

export type GitHubProject = {
  id: number;
  slug: string;
  title: string;
  description: string;
  href: string;
  language: string | null;
  stars: number;
  forks: number;
  topics: string[];
  isArchived: boolean;
  isFork: boolean;
  updatedLabel: string | null;
};

export type GitHubUserProfile = {
  avatarUrl: string;
  bio: string | null;
  blog: string | null;
  followers: number;
  following: number;
  href: string;
  location: string | null;
  login: string;
  name: string | null;
};

export async function listGitHubUserProjects(username: string): Promise<GitHubProject[]> {
  const repositories = await fetchGitHubUserRepositories(username);

  return repositories
    .filter((repository) => !repository.private)
    .map(mapGitHubRepository)
    .sort((left, right) => right.stars - left.stars || left.title.localeCompare(right.title));
}

export async function getGitHubUserProfile(username: string): Promise<GitHubUserProfile | null> {
  const profile = await fetchGitHubUserProfile(username);

  return profile ? mapGitHubUserProfile(profile) : null;
}

export async function getGitHubProfileReadme(username: string) {
  return fetchGitHubProfileReadme(username);
}

export function getGitHubUsernameFromUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);

    if (!url.hostname.toLowerCase().endsWith("github.com")) {
      return null;
    }

    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  } catch {
    return trimmed
      .replace(/^@/, "")
      .replace(/^https?:\/\/github\.com\//i, "")
      .split(/[/?#]/)[0] || null;
  }
}

function getGitHubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function fetchGitHubUserProfile(username: string) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: getGitHubHeaders(),
      next: {
        revalidate: GITHUB_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as GitHubUserResponse;
  } catch {
    return null;
  }
}

async function fetchGitHubUserRepositories(username: string) {
  try {
    const params = new URLSearchParams({
      per_page: "100",
      sort: "updated",
      direction: "desc",
      type: "owner",
    });
    const response = await fetch(`https://api.github.com/users/${username}/repos?${params}`, {
      headers: getGitHubHeaders(),
      next: {
        revalidate: GITHUB_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as GitHubRepositoryResponse[];
  } catch {
    return [];
  }
}

async function fetchGitHubProfileReadme(username: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${username}/readme`, {
      headers: {
        ...getGitHubHeaders(),
        Accept: "application/vnd.github.raw",
      },
      next: {
        revalidate: GITHUB_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  }
}

function mapGitHubUserProfile(profile: GitHubUserResponse): GitHubUserProfile {
  return {
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    blog: normalizeBlogUrl(profile.blog),
    followers: profile.followers,
    following: profile.following,
    href: profile.html_url,
    location: profile.location,
    login: profile.login,
    name: profile.name,
  };
}

function mapGitHubRepository(repository: GitHubRepositoryResponse): GitHubProject {
  return {
    id: repository.id,
    slug: repository.name,
    title: repository.name,
    description: repository.description ?? "",
    href: repository.html_url,
    language: repository.language,
    stars: repository.stargazers_count,
    forks: repository.forks_count,
    topics: repository.topics ?? [],
    isArchived: repository.archived,
    isFork: repository.fork,
    updatedLabel: formatUpdatedLabel(repository.pushed_at ?? repository.updated_at),
  };
}

function normalizeBlogUrl(value: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function formatUpdatedLabel(value: string | null) {
  if (!value) {
    return null;
  }

  const updatedAt = new Date(value);

  if (Number.isNaN(updatedAt.getTime())) {
    return null;
  }

  const diffMs = Date.now() - updatedAt.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86_400_000));

  if (diffDays === 0) {
    return "Updated today";
  }

  if (diffDays === 1) {
    return "Updated yesterday";
  }

  if (diffDays < 30) {
    return `Updated ${diffDays} days ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths === 1) {
    return "Updated last month";
  }

  if (diffMonths < 12) {
    return `Updated ${diffMonths} months ago`;
  }

  const diffYears = Math.floor(diffMonths / 12);

  return diffYears === 1 ? "Updated last year" : `Updated ${diffYears} years ago`;
}
