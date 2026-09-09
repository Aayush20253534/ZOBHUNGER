import { BusinessLinkedJobs } from "@/components/business/phase2/LinkedJobs";
export const metadata = { title: "Linked job openings", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <BusinessLinkedJobs id={id} />; }
