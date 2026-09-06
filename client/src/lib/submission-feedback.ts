import type { SubmissionReceipt } from "@/types/data.types";

export function getSubmissionFeedback(
  receipt: SubmissionReceipt,
  subject: "requirement" | "enquiry",
) {
  if (receipt.mode === "mock")
    return {
      tone: "success" as const,
      title: "Preview complete",
      message:
        "Your entries passed validation. No information has been sent or saved. You can edit your details or start again.",
    };
  if (!receipt.delivered)
    return {
      tone: "info" as const,
      title: "Delivery not confirmed",
      message:
        "Your " +
        subject +
        " has not been confirmed as delivered. Your entries are still available to edit and try again.",
    };
  return {
    tone: "success" as const,
    title:
      subject === "requirement" ? "Requirement submitted" : "Enquiry submitted",
    message: receipt.message,
  };
}
