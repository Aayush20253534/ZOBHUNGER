import { AdminSecurity } from "@/components/admin/AdminSecurity";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/portal.css";
import "@/styles/admin-security.css";

export const metadata = {
  ...getPageMetadata("Admin Security", "Set up protected administrator access for ZOBHUNGER.", "/admin/security"),
  robots: { index: false, follow: false },
};

export default function AdminSecurityPage() {
  return (
    <div className="zb-portal-page zb-admin-security-page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Admin", href: "/admin" }, { label: "Security" }]} />
      <AdminSecurity />
    </div>
  );
}
