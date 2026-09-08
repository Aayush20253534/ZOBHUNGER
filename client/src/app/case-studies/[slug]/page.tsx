import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyDetail } from "@/components/case-studies/CaseStudyDetail";
import { caseStudies, getCaseStudy } from "@/data/case-studies";
import { getPageMetadata } from "@/lib/page-metadata";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return caseStudies.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = getCaseStudy((await params).slug); if (!study) notFound();
  return getPageMetadata(
    `${study.title} Case Study`,
    study.summary,
    `/case-studies/${study.slug}`,
  );
}
export default async function Page({ params }: Props) { const study = getCaseStudy((await params).slug); if (!study) notFound(); return <CaseStudyDetail study={study} />; }
