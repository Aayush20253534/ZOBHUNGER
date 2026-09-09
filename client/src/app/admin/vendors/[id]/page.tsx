import { AdminVendors } from "@/components/admin/AdminVendors";
export const metadata = { title: "Vendor review | ZOBHUNGER", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminVendors id={id} />; }
