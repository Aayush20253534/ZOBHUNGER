import type { ReactNode } from "react";
import { WorkerProvider } from "@/components/worker/WorkerProvider";
import { WorkerShell } from "@/components/worker/WorkerShell";
export default function PortalLayout({ children }: { children: ReactNode }) {
  return <WorkerProvider><WorkerShell>{children}</WorkerShell></WorkerProvider>;
}
