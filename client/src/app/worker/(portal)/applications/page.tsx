import { Suspense } from "react";
import { WorkerApplications } from "@/components/worker/WorkerApplications";
import { WorkerLoading } from "@/components/worker/WorkerUI";
export default function Page() { return <Suspense fallback={<WorkerLoading />}><WorkerApplications /></Suspense>; }
