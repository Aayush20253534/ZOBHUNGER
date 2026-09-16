"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

export function PortalRouteError({
  title,
  description,
  reset,
}: {
  title: string;
  description: string;
  reset: () => void;
}) {
  return (
    <section className="mx-auto my-8 grid min-h-[260px] w-[min(92%,720px)] place-items-center rounded-2xl border border-border bg-background p-8 text-center shadow-sm" role="alert">
      <div className="grid max-w-xl justify-items-center gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-muted text-destructive"><TriangleAlert className="size-6" aria-hidden="true" /></span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <button type="button" onClick={reset} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold shadow-sm hover:bg-muted">
          <RotateCcw className="size-4" aria-hidden="true" />Retry
        </button>
      </div>
    </section>
  );
}
