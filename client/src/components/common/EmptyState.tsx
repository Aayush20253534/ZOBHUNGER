import { SearchX } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title = "No results found",
  description = "Try another search or adjust your filters.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="zb-empty">
      <SearchX aria-hidden="true" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
