import { MoreSectionPlaceholder } from "@/components/more-section-placeholder";
import { getMoreSectionBySlug } from "@/lib/more-sections";

export default function FriendsPage() {
  const section = getMoreSectionBySlug("friends");

  if (!section) {
    throw new Error("Missing more section config for friends.");
  }

  return <MoreSectionPlaceholder section={section} />;
}
