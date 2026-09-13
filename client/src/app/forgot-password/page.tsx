import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { UnifiedPasswordRecovery } from "@/components/auth/UnifiedPasswordRecovery";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/portal.css";

export const metadata = {
  ...getPageMetadata(
    "Forgot Password",
    "Secure password recovery for ZOBHUNGER business, worker and administrator accounts.",
    "/forgot-password",
  ),
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="zb-portal-page zb-auth-page zb-auth-page--portal zb-recovery-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Portal access", href: "/login" },
          { label: "Forgot password" },
        ]}
      />
      <UnifiedPasswordRecovery />
    </div>
  );
}
