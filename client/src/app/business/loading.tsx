import { LoadingState } from "@/components/common/LoadingState";

export default function BusinessLoading() {
  return <div className="mx-auto flex min-h-[40vh] w-[min(92%,1200px)] items-center justify-center"><LoadingState label="Loading business workspace…" /></div>;
}
