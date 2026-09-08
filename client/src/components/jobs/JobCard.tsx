import { PrefetchLink as Link } from "@/components/common/PrefetchLink";
import { ArrowUpRight, BriefcaseBusiness, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Job } from "@/types/job.types";

export function JobCard({
  job,
  href = `/jobs/${job.slug}`,
}: {
  job: Job;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="zb-card-link"
      aria-label={`View ${job.title} in ${job.location}`}
    >
      <Card className="zb-card">
        <div className="zb-card-top">
          <span className="zb-chip">{job.category}</span>
          {job.isDemo && (
            <Badge className="zb-chip" data-tone="accent">
              Demo vacancy
            </Badge>
          )}
        </div>
        <h3 className="zb-card-title">{job.title}</h3>
        <div className="zb-card-meta">
          <span className="zb-chip">
            <MapPin className="size-3.5" aria-hidden="true" />
            {job.location}
          </span>
          <span className="zb-chip">
            <BriefcaseBusiness className="size-3.5" aria-hidden="true" />
            {job.jobType}
          </span>
        </div>
        <p className="zb-card-copy">{job.description}</p>
        <span className="zb-card-cta">
          View role <ArrowUpRight className="size-4" aria-hidden="true" />
        </span>
      </Card>
    </Link>
  );
}
