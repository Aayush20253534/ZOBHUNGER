import { WorkerJobDetails } from "@/components/worker/WorkerJobs";
export const metadata = { title: "Role Details" };
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <WorkerJobDetails slug={slug} />;
}
