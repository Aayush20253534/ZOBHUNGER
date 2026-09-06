import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

export function FeedbackMessage({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "error" | "success";
  title: string;
  children?: ReactNode;
}) {
  const Icon =
    tone === "error" ? CircleAlert : tone === "success" ? CircleCheck : Info;
  return (
    <div
      className="zb-feedback"
      data-tone={tone}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <Icon aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        {children && <p>{children}</p>}
      </div>
    </div>
  );
}
