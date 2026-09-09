import { Suspense } from "react";
import { WorkerAttendance } from "@/components/worker/WorkerAttendance";
import { WorkerLoading } from "@/components/worker/WorkerUI";
export default function Page() { return <Suspense fallback={<WorkerLoading />}><WorkerAttendance /></Suspense>; }
