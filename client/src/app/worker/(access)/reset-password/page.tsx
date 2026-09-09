import { Suspense } from "react";
import { WorkerAccess } from "@/components/worker/WorkerAccess";
import { WorkerLoading } from "@/components/worker/WorkerUI";
export const metadata = { title: "Reset Worker Password" };
export default function Page() { return <Suspense fallback={<WorkerLoading />}><WorkerAccess mode="reset" /></Suspense>; }
