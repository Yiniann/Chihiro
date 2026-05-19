import type { Metadata } from "next";
import {
  StandalonePageRenderer,
  generateStandalonePageMetadata,
} from "@/app/(site)/standalone-page-renderer";

type StandalonePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: StandalonePageProps): Promise<Metadata> {
  const { slug } = await params;
  return generateStandalonePageMetadata(slug);
}

export default async function StandalonePage({ params }: StandalonePageProps) {
  const { slug } = await params;
  return <StandalonePageRenderer slug={slug} />;
}
