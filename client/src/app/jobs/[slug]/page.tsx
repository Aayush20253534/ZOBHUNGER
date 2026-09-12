import { notFound } from "next/navigation";
import { JobDetails } from "@/components/jobs/JobDetails";
import { getJobForPage } from "@/lib/job-page";
import { getPageMetadata } from "@/lib/page-metadata";
import { breadcrumbJsonLd, jobPostingJsonLd, serializeJsonLd } from "@/lib/seo";

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

  const schemas = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Jobs", path: "/jobs" },
      { name: job.title, path: `/jobs/${encodeURIComponent(job.slug)}` },
    ]),
    ...(!job.isDemo ? [jobPostingJsonLd(job)] : []),
  ];

  return (
    <>
      {schemas.map((schema) => (
        <script
          key={schema["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      <JobDetails job={job} />
    </>
  );
}
