import { Suspense } from "react";
import { WorkerAssignmentDetails } from "@/components/worker/WorkerAttendance";
import { WorkerLoading } from "@/components/worker/WorkerUI";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <Suspense fallback={<WorkerLoading />}><WorkerAssignmentDetails id={id} /></Suspense>; }
