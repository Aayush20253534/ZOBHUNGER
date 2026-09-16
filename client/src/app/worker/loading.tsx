import { LoadingState } from "@/components/common/LoadingState";

export default function WorkerLoading() {
  return <div className="mx-auto flex min-h-[40vh] w-[min(92%,1100px)] items-center justify-center"><LoadingState label="Loading worker workspace…" /></div>;
}
