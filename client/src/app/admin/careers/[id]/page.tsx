import { AdminIntakeReview } from "@/components/admin/AdminIntakeReview";
export const metadata = { title: "Review careers application | ZOBHUNGER", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminIntakeReview kind="careers" id={id} />;
}
