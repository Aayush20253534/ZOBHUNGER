import Link from "next/link";
import { Building2, ShieldCheck, UserRound } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
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
    title: "Business",
    icon: Building2,
    copy: "Requirements, company profile and workforce delivery.",
  },
  {
    title: "Worker",
    icon: UserRound,
    copy: "Profile, jobs, attendance and earnings in one place.",
  },
  {
    title: "Admin",
    icon: ShieldCheck,
    copy: "Authorised access to operations and management tools.",
  },
] as const;

export default function LoginPage() {
  return (
    <div className="zb-portal-page zb-auth-page zb-auth-page--portal">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Portal access" }]}
      />

      <section className="zb-portal-access-shell" aria-label="ZOBHUNGER portal access">
        <div className="zb-portal-access-intro">
          <div className="zb-portal-access-kicker">
            <span aria-hidden="true" />
            Portal access
          </div>

          <h1>
            One secure sign-in.
            <span>Everything connected.</span>
          </h1>

          <p className="zb-portal-access-copy">
            Access the workspace assigned to your ZOBHUNGER account. Your role
            automatically takes you to the right business, worker or operations portal.
          </p>

          <div className="zb-portal-account-grid" aria-label="Available account types">
            {accountTypes.map((account) => {
              const Icon = account.icon;
              return (
                <article key={account.title}>
                  <span className="zb-portal-account-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <div>
                    <h2>{account.title}</h2>
                    <p>{account.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="zb-portal-trust-note">
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>Protected account access</strong>
              Secure sessions and role-based permissions keep every workspace separated.
            </span>
          </div>
        </div>

        <div className="zb-portal-login-column">
          <div className="zb-portal-login-status">
            <span aria-hidden="true" />
            Authorised access only
          </div>
          <LoginForm />
          <p className="zb-portal-login-help">
            Need help accessing your account? <Link href="/contact">Contact support</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
