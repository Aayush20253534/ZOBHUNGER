import { notFound } from "next/navigation";
import { PageShell } from "@/components/common/PageShell";
import { industries } from "@/data/industries";

export function generateStaticParams() {
  return industries.map(({ slug }) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = industries.find((item) => item.slug === slug);
  if (!industry) notFound();
  return <PageShell title={`${industry.title} Solutions`} />;
}
