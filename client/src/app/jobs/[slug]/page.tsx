import { notFound } from "next/navigation";
import { JobDetails } from "@/components/jobs/JobDetails";
import { getJobForPage } from "@/lib/job-page";
import { getPageMetadata } from "@/lib/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobForPage(slug);
  if (!job || !job.isPublished) notFound();
  return {
    ...getPageMetadata(
      job.title + " in " + job.location,
      job.description,
      "/jobs/" + encodeURIComponent(job.slug),
    ),
    ...(job.isDemo ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobForPage(slug);
  if (!job || !job.isPublished) notFound();
  return <JobDetails job={job} />;
}
