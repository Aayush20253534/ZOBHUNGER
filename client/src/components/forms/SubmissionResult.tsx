"use client";

import type { Ref } from "react";
import { ActionButton } from "@/components/common/ActionButton";
import { ActionLink } from "@/components/common/ActionLink";
import { FeedbackMessage } from "@/components/common/FeedbackMessage";
import { getSubmissionFeedback } from "@/lib/submission-feedback";
import type { SubmissionReceipt } from "@/types/data.types";

export function SubmissionResult({
  receipt,
  subject,
  feedbackRef,
  onEdit,
  onClear,
}: {
  receipt: SubmissionReceipt;
  subject: "requirement" | "enquiry" | "application";
  feedbackRef: Ref<HTMLDivElement>;
  onEdit: () => void;
  onClear: () => void;
}) {
  const feedback = getSubmissionFeedback(receipt, subject);
  return (
    <div ref={feedbackRef} tabIndex={-1} className="zb-form-result">
      <FeedbackMessage tone={feedback.tone} title={feedback.title}>
        {feedback.message}
      </FeedbackMessage>
      <div className="zb-form-actions">
        <ActionButton onClick={onEdit}>Edit details</ActionButton>
        <ActionButton variant="outline" onClick={onClear}>
          Start again
        </ActionButton>
        <ActionLink
          href={subject === "application" ? "/jobs" : "/solutions"}
          variant="text"
        >
          {subject === "application"
            ? "Explore more jobs"
            : "Explore solutions"}
        </ActionLink>
      </div>
    </div>
  );
}
