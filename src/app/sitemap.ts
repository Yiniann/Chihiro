import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/posts";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/posts"),
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/updates"),
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/archives"),
      lastModified: new Date(),
    },
    {
      url: absoluteUrl("/more"),
      lastModified: new Date(),
    },
  ];

  const postRoutes: MetadataRoute.Sitemap = getPublishedPosts().map((post) => ({
    url: absoluteUrl(`/posts/${post.slug}`),
    lastModified: new Date(post.updatedAt ?? post.publishedAt ?? Date.now()),
  }));

  return [...staticRoutes, ...postRoutes];
}
