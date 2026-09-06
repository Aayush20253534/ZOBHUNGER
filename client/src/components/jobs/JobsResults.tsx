import { ActionLink } from "@/components/common/ActionLink";
import { EmptyState } from "@/components/common/EmptyState";
import { JobCard } from "@/components/jobs/JobCard";
import { jobsHref } from "@/lib/job-filters";
import type { JobFilters, JobList } from "@/types/job.types";

export function JobsResults({
  list,
  filters,
  isPreview,
}: {
  list: JobList;
  filters: JobFilters;
  isPreview: boolean;
}) {
  const first = (list.page - 1) * list.pageSize + 1;
  return (
    <section
      id="job-results"
      className="zb-job-results"
      aria-labelledby="job-results-title"
    >
      <div className="zb-job-results-heading">
        <h2 id="job-results-title">
          {isPreview ? "Demo roles" : "Available roles"}
        </h2>
        <p role="status" aria-live="polite">
          {list.total
            ? `${first}–${first + list.items.length - 1} of ${list.total} roles`
            : "No matching roles"}
        </p>
      </div>
      {list.items.length ? (
        <div className="zb-job-results-grid">
          {list.items.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No roles match this search"
          description="Try another keyword, location or job type. You can also clear the filters to see the full catalogue."
          action={
            <ActionLink href="/jobs" variant="secondary">
              View all jobs
            </ActionLink>
          }
        />
      )}
      {list.totalPages > 1 && (
        <nav className="zb-job-pagination" aria-label="Job results pages">
          {list.page > 1 ? (
            <ActionLink
              href={
                jobsHref({ ...filters, page: list.page - 1 }) + "#job-results"
              }
              variant="secondary"
              rel="prev"
            >
              Previous
            </ActionLink>
          ) : (
            <span className="zb-pagination-disabled" aria-disabled="true">
              Previous
            </span>
          )}
          <span>
            Page {list.page} of {list.totalPages}
          </span>
          {list.page < list.totalPages ? (
            <ActionLink
              href={
                jobsHref({ ...filters, page: list.page + 1 }) + "#job-results"
              }
              variant="secondary"
              rel="next"
            >
              Next
            </ActionLink>
          ) : (
            <span className="zb-pagination-disabled" aria-disabled="true">
              Next
            </span>
          )}
        </nav>
      )}
    </section>
  );
}
