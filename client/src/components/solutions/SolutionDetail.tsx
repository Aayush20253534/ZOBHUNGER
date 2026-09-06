import { notFound } from "next/navigation";
import { PageShell } from "@/components/common/PageShell";
import { solutions } from "@/data/solutions";

export function SolutionDetail({ slug }: { slug: string }) {
  const solution = solutions.find((item) => item.slug === slug);
  if (!solution) notFound();
  return <PageShell title={solution.title} />;
}
