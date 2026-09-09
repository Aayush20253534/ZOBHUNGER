"use client";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { WorkerWordmark } from "@/components/worker/WorkerUI";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="zw-gate"><WorkerWordmark /><main className="zw-card"><h1>Let’s reopen your worker space.</h1><p>Something interrupted this page. Please try again.</p><div className="zw-actions"><button className="zw-button" onClick={reset}><RefreshCw aria-hidden="true" />Try again</button><Link className="zw-button zw-button--secondary" href="/worker/login">Worker sign in</Link></div></main></div>;
}
