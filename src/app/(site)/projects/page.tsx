import type { Metadata } from "next";
import { MoreSectionPlaceholder } from "@/components/more-section-placeholder";
import { getMoreSectionBySlug } from "@/lib/more-sections";

export const metadata: Metadata = {
  title: "项目",
};

export default function ProjectsPage() {
  const section = getMoreSectionBySlug("projects");

  if (!section) {
    throw new Error("Missing more section config for projects.");
  }

  return <MoreSectionPlaceholder section={section} />;
}
