import { Suspense } from "react";
import { WorkerProfileForm } from "@/components/worker/WorkerProfileForm";
import { WorkerLoading } from "@/components/worker/WorkerUI";
export const metadata = { title: "My Profile & CV" };
export default function Page() { return <Suspense fallback={<WorkerLoading />}><WorkerProfileForm /></Suspense>; }
