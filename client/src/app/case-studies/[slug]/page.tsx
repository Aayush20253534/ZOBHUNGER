import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyDetail } from "@/components/case-studies/CaseStudyDetail";
import { caseStudies, getCaseStudy } from "@/data/case-studies";
import { getCaseStudyVisualStory } from "@/data/case-study-visuals";
import { executionVisuals } from "@/data/execution-visuals";
import { site } from "@/data/site";
import { getPageMetadata } from "@/lib/page-metadata";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return caseStudies.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = getCaseStudy((await params).slug); if (!study) notFound();
  const metadata = getPageMetadata(
    `${study.title} Case Study`,
    study.about,
    `/case-studies/${study.slug}`,
  );
  const story = getCaseStudyVisualStory(study.slug);
  if (!story) return metadata;
  const visual = executionVisuals[story.cover];
  const image = { url: new URL(visual.src, site.url).toString(), width: visual.width, height: visual.height, alt: visual.alt };
  return {
    ...metadata,
    openGraph: { ...metadata.openGraph, images: [image] },
    twitter: { ...metadata.twitter, images: [image.url] },
  };
}
export default async function Page({ params }: Props) { const study = getCaseStudy((await params).slug); if (!study) notFound(); return <CaseStudyDetail study={study} />; }
