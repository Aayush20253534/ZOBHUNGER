import { Suspense } from "react";
import { WorkerAccess } from "@/components/worker/WorkerAccess";
import { WorkerLoading } from "@/components/worker/WorkerUI";
export const metadata = { title: "Recover Worker Account" };
export default function Page() { return <Suspense fallback={<WorkerLoading />}><WorkerAccess mode="forgot" /></Suspense>; }
