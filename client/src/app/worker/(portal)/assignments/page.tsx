import { Suspense } from "react";
import { WorkerAssignments } from "@/components/worker/WorkerAttendance";
import { WorkerLoading } from "@/components/worker/WorkerUI";
export default function Page() { return <Suspense fallback={<WorkerLoading />}><WorkerAssignments /></Suspense>; }
