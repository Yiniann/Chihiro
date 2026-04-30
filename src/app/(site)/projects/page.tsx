import { MoreSectionPlaceholder } from "@/components/more-section-placeholder";
import { getMoreSectionBySlug } from "@/lib/more-sections";

export default function ProjectsPage() {
  const section = getMoreSectionBySlug("projects");

  if (!section) {
    throw new Error("Missing more section config for projects.");
  }

  return <MoreSectionPlaceholder section={section} />;
}
