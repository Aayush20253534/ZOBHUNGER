import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/portal.css";

export const metadata = {
  ...getPageMetadata(
    "Admin Dashboard",
    "Protected Phase 1 administration for ZOBHUNGER.",
    "/admin",
  ),
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="zb-portal-page">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Admin dashboard" }]}
      />
      <AdminDashboard />
    </div>
  );
}
