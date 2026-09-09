import { Suspense } from "react";
import { WorkerJobs } from "@/components/worker/WorkerJobs";
import { WorkerLoading } from "@/components/worker/WorkerUI";
export const metadata = { title: "Saved Jobs" };
export default function Page() { return <Suspense fallback={<WorkerLoading />}><WorkerJobs saved /></Suspense>; }
