import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { AdminPasswordReset } from "@/components/auth/AdminPasswordReset";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/portal.css";

export const metadata = {
  ...getPageMetadata(
    "Reset Password",
    "Choose a new password for your ZOBHUNGER administrator account.",
    "/reset-password",
  ),
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="zb-portal-page zb-auth-page zb-auth-page--portal zb-recovery-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Portal access", href: "/login" },
          { label: "Reset password" },
        ]}
      />
      <AdminPasswordReset />
    </div>
  );
}
