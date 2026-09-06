import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageShell } from "@/components/common/PageShell";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobsResults } from "@/components/jobs/JobsResults";
import {
  jobsHref,
  parseJobFilters,
  type JobSearchParams,
} from "@/lib/job-filters";
import { getPageMetadata } from "@/lib/page-metadata";
import { getDataMode } from "@/services/adapters";
import { getJobs } from "@/services/jobs.service";

export function generateMetadata() {
  return {
    ...getPageMetadata(
      "Explore Jobs",
      "Find roles by keyword, location, category and job type. Explore the work and read the requirements before applying.",
      "/jobs",
    ),
    ...(getDataMode() === "mock"
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<JobSearchParams>;
}) {
  const filters = parseJobFilters(await searchParams);
  const list = await getJobs(filters);
  const isPreview = getDataMode() === "mock";
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Jobs" }]} />
      <div className="zb-jobs-heading">
        <PageShell
          eyebrow="Find work"
          title="Find a role that fits your skills."
          description="Search by role, location or type of work. Read the responsibilities before taking the next step."
        />
      </div>
      {isPreview && (
        <div className="zb-jobs-demo-note">
          <span className="zb-chip">Demo catalogue</span>
          <p>
            These roles are fictional examples. They are not live vacancies.
          </p>
        </div>
      )}
      <JobFilters key={jobsHref(filters)} initialFilters={filters} />
      <JobsResults list={list} filters={filters} isPreview={isPreview} />
    </>
  );
}
