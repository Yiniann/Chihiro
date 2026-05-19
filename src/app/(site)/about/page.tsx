import type { Metadata } from "next";
import {
  StandalonePageRenderer,
  generateStandalonePageMetadata,
} from "@/app/(site)/standalone-page-renderer";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return generateStandalonePageMetadata("about");
}

export default function AboutPage() {
  return <StandalonePageRenderer slug="about" />;
}
