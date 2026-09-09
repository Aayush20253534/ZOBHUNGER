import { Suspense } from "react";
import { WorkerApplicationDetail } from "@/components/worker/WorkerApplications";
import { WorkerLoading } from "@/components/worker/WorkerUI";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <Suspense fallback={<WorkerLoading />}><WorkerApplicationDetail id={id} /></Suspense>; }
