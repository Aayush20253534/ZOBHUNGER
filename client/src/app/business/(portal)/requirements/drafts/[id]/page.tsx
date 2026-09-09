import { RequirementDraftEditor } from "@/components/business/phase2/RequirementDrafts";
export const metadata = { title: "Resume requirement draft", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <RequirementDraftEditor id={id} />; }
