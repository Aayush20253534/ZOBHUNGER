import { Building2, ShieldCheck, UserRound } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageShell } from "@/components/common/PageShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getPageMetadata } from "@/lib/page-metadata";
import "@/styles/portal.css";

export const metadata = {
  ...getPageMetadata(
    "Portal Access",
    "Secure sign-in for ZOBHUNGER administrator, business and worker accounts.",
    "/login",
  ),
  robots: { index: false, follow: false },
};

const accountTypes = [
  {
    title: "Business account",
    icon: Building2,
    copy: "Authentication is active. The full business workspace remains a later-phase portal.",
  },
  {
    title: "Worker account",
    icon: UserRound,
    copy: "Authentication is active. The full worker workspace remains a later-phase portal.",
  },
  {
    title: "Admin account",
    icon: ShieldCheck,
    copy: "Authentication and the Phase 1 admin dashboard are active now.",
  },
] as const;

export default function LoginPage() {
  return (
    <div className="zb-portal-page">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Portal access" }]}
      />
      <div className="zb-portal-heading">
        <PageShell
          eyebrow="Portal access"
          title="Secure access is now connected."
          description="Sign in with an account stored in PostgreSQL. Admin users can access the Phase 1 operations dashboard; business and worker account authentication is ready for the later workspaces."
        />
      </div>

      <div className="zb-login-layout">
        <LoginForm />
        <aside className="zb-account-access-summary" aria-label="Account access status">
          <p className="zb-eyebrow">Account status</p>
          <h2>What is available now</h2>
          <div className="zb-account-type-list">
            {accountTypes.map((account) => {
              const Icon = account.icon;
              return (
                <article key={account.title}>
                  <span className="zb-icon-tile" aria-hidden="true">
                    <Icon />
                  </span>
                  <div>
                    <h3>{account.title}</h3>
                    <p>{account.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
