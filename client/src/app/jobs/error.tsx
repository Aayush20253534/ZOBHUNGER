"use client";

import { ActionButton } from "@/components/common/ActionButton";
import { ActionLink } from "@/components/common/ActionLink";
import { FeedbackMessage } from "@/components/common/FeedbackMessage";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="zb-jobs-status-panel">
      <FeedbackMessage tone="error" title="We couldn't load this page">
        Please try again. If you were searching, your filters are still in the
        page address.
      </FeedbackMessage>
      <div className="zb-work-actions">
        <ActionButton onClick={reset}>Try again</ActionButton>
        <ActionLink href="/jobs" variant="secondary">
          Back to jobs
        </ActionLink>
      </div>
    </div>
  );
}
