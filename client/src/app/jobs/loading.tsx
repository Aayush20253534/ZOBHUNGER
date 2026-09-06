import { LoadingState } from "@/components/common/LoadingState";

export default function Loading() {
  return (
    <div className="zb-jobs-status-panel">
      <LoadingState label="Loading jobs…" />
    </div>
  );
}
