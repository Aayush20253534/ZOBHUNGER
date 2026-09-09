import { Suspense } from "react";
import { WorkerApply } from "@/components/worker/WorkerApplications";
import { WorkerLoading } from "@/components/worker/WorkerUI";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <Suspense fallback={<WorkerLoading />}><WorkerApply slug={slug} /></Suspense>; }
