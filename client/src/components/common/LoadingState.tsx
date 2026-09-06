import { LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="zb-loading" role="status">
      <LoaderCircle className="zb-spin size-5" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
