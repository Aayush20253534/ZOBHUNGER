import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndustryDetail } from "@/components/industries/IndustryDetail";
import { industries } from "@/data/industries";
import {
  getIndustryContent,
  getIndustryMetadata,
} from "@/lib/industry-content";

type IndustryPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return industries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: IndustryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = getIndustryContent(slug);
  if (!content) notFound();
  return getIndustryMetadata(content.industry.slug);
}

export default async function Page({ params }: IndustryPageProps) {
  const { slug } = await params;
  return <IndustryDetail slug={slug} />;
}
