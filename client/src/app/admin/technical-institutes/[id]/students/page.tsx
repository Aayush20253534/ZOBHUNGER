import { AdminTechnicalStudents } from "@/components/admin/AdminTechnicalStudents";

export const metadata = { title: "Technical student roster | ZOBHUNGER", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminTechnicalStudents instituteId={id} />;
}
