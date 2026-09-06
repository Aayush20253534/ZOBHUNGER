import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  await params;
  // TODO: retrieve the published job by slug; call notFound() when it is absent.
  notFound();
}
