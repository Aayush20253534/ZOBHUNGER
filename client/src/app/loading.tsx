import { LoadingState } from "@/components/common/LoadingState";

export default function Loading() {
  return (
    <div className="zb-container">
      <LoadingState label="Loading page…" />
    </div>
  );
}
