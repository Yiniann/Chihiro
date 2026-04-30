import { MoreSectionPlaceholder } from "@/components/more-section-placeholder";
import { getMoreSectionBySlug } from "@/lib/more-sections";

export default function ReviewsPage() {
  const section = getMoreSectionBySlug("reviews");

  if (!section) {
    throw new Error("Missing more section config for reviews.");
  }

  return <MoreSectionPlaceholder section={section} />;
}
