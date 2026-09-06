import { ActionLink } from "@/components/common/ActionLink";
import { EmptyState } from "@/components/common/EmptyState";

export default function JobNotFound() {
  return (
    <EmptyState
      title="This role is unavailable"
      description="The link may have changed, or the role is no longer published. Explore the other roles in the job catalogue."
      action={<ActionLink href="/jobs">Explore jobs</ActionLink>}
    />
  );
}
