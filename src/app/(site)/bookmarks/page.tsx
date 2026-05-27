import type { Metadata } from "next";
import { MoreSectionPlaceholder } from "@/components/more-section-placeholder";
import { getMoreSectionBySlug } from "@/lib/more-sections";

export const metadata: Metadata = {
  title: "书签",
};

export default function BookmarksPage() {
  const section = getMoreSectionBySlug("bookmarks");

  if (!section) {
    throw new Error("Missing more section config for bookmarks.");
  }

  return <MoreSectionPlaceholder section={section} />;
}
