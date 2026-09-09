import { Bookmark, BriefcaseBusiness, MapPin } from "lucide-react";
import { ActionLink } from "@/components/common/ActionLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageShell } from "@/components/common/PageShell";
import { JobApplicationForm } from "@/components/forms/JobApplicationForm";
import type { Job } from "@/types/job.types";

export function JobDetails({ job }: { job: Job }) {
  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Jobs", href: "/jobs" },
          { label: job.title },
        ]}
      />
      {job.isDemo && (
        <div className="zb-jobs-demo-note">
          <span className="zb-chip">Demo vacancy</span>
          <p>
            This role is seeded demonstration data. Test applications submitted
            in API mode are stored in PostgreSQL for integration testing.
          </p>
        </div>
      )}
      <div className="zb-job-detail-heading">
        <PageShell
          eyebrow={job.category}
          title={job.title}
          description={job.description}
          actions={
            <><ActionLink href="#apply">
              {job.isDemo ? "Test application" : "Apply for this role"}
            </ActionLink>{!job.isDemo && <ActionLink href={`/worker/jobs/${encodeURIComponent(job.slug)}`} variant="secondary"><Bookmark aria-hidden="true" />Save in worker space</ActionLink>}</>
          }
        />
        <div className="zb-job-detail-meta">
          <span>
            <MapPin aria-hidden="true" />
            {job.location}
          </span>
          <span>
            <BriefcaseBusiness aria-hidden="true" />
            {job.jobType}
          </span>
        </div>
      </div>
      <div className="zb-job-detail-layout">
        <div>
          {Boolean(job.responsibilities?.length) && (
            <section
              className="zb-job-detail-section"
              aria-labelledby="job-responsibilities-title"
            >
              <h2 id="job-responsibilities-title">What you would do</h2>
              <ul>
                {job.responsibilities?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          {Boolean(job.requirements?.length) && (
            <section
              className="zb-job-detail-section"
              aria-labelledby="job-requirements-title"
            >
              <h2 id="job-requirements-title">What the role needs</h2>
              <ul>
                {job.requirements?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
          <section
            id="apply"
            className="zb-job-application"
            aria-labelledby="job-application-title"
          >
            <h2 id="job-application-title">
              {job.isDemo ? "Submit a test application" : "Apply for this role"}
            </h2>
            <p>
              Share your contact details, location and any experience you want
              to include.
            </p>
            <JobApplicationForm key={job.slug} jobSlug={job.slug} />
          </section>
        </div>
        <aside className="zb-job-summary" aria-labelledby="job-summary-title">
          <span className="zb-eyebrow">Role at a glance</span>
          <h2 id="job-summary-title">The assignment</h2>
          <dl>
            <div>
              <dt>Category</dt>
              <dd>{job.category}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{job.location}</dd>
            </div>
            <div>
              <dt>Job type</dt>
              <dd>{job.jobType}</dd>
            </div>
          </dl>
          {job.isDemo && (
            <p>
              Pay, schedule and employer details are not published for this
              example role.
            </p>
          )}
          <ActionLink href="/jobs" variant="secondary">
            Explore other roles
          </ActionLink>
        </aside>
      </div>
    </>
  );
}
