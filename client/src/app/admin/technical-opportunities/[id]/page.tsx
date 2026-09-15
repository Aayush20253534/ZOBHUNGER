import { AdminTechnicalOpportunityDetail } from "@/components/admin/AdminTechnicalOpportunities";

export const metadata = { title: "Technical opportunity matching | ZOBHUNGER", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminTechnicalOpportunityDetail id={id} />;
}
