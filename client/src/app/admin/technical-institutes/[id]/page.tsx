import { AdminTechnicalInstituteDetail } from "@/components/admin/AdminTechnicalInstitutes";

export const metadata = { title: "Technical institute review | ZOBHUNGER", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminTechnicalInstituteDetail id={id} />;
}
