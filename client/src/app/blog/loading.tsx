import { LoadingState } from "@/components/common/LoadingState";

export default function Loading() {
  return (
    <div className="zb-editorial-status">
      <LoadingState label="Loading insights…" />
    </div>
  );
}
