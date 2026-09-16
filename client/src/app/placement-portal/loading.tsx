import { LoadingState } from "@/components/common/LoadingState";

export default function PlacementPortalLoading() {
  return <div className="mx-auto flex min-h-[40vh] w-[min(92%,1200px)] items-center justify-center"><LoadingState label="Loading placement workspace…" /></div>;
}
