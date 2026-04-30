import { HomeSectionPlaceholder } from "@/components/home-section-placeholder";
import { getHomeSectionBySlug } from "@/lib/home-sections";

export default function AboutPage() {
  const section = getHomeSectionBySlug("about");

  if (!section) {
    throw new Error("Missing home section config for about.");
  }

  return <HomeSectionPlaceholder section={section} />;
}
