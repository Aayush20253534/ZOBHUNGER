"use client";

import { ActionButton } from "@/components/common/ActionButton";
import { ActionLink } from "@/components/common/ActionLink";
import { FeedbackMessage } from "@/components/common/FeedbackMessage";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="zb-editorial-status">
      <FeedbackMessage tone="error" title="We couldn’t load the insights">
        Please try again. Your search filters are still in the page address.
      </FeedbackMessage>
      <div className="zb-page-actions">
        <ActionButton onClick={reset}>Try again</ActionButton>
        <ActionLink href="/blog" variant="secondary">
          Back to insights
        </ActionLink>
      </div>
    </div>
  );
}
