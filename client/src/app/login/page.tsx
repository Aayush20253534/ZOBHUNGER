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
    copy: "Access your business workspace, set up your company profile and manage your account.",
  },
  {
    title: "Worker account",
    icon: UserRound,
    copy: "Sign in to explore workforce opportunities. Your dedicated worker workspace is being developed.",
  },
  {
    title: "Admin account",
    icon: ShieldCheck,
    copy: "Access the operations dashboard with an authorised administrator account.",
  },
] as const;

export default function LoginPage() {
  return (
    <div className="zb-portal-page zb-auth-page zb-auth-page--portal">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Portal access" }]}
      />
      <div className="zb-portal-heading">
        <PageShell
          eyebrow="Portal access"
          title="Your work starts here."
          description="Sign in to the workspace connected to your account. Business users can manage their company details and administrators can access operations."
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
