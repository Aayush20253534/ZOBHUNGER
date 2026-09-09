import { Suspense } from "react";
import { WorkerAccess } from "@/components/worker/WorkerAccess";
import { WorkerLoading } from "@/components/worker/WorkerUI";
export const metadata = { title: "Worker Sign In" };
export default function Page() { return <Suspense fallback={<WorkerLoading />}><WorkerAccess mode="login" /></Suspense>; }
