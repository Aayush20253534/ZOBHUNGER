import Link from "next/link";
import { ArrowLeft, Building2, ClipboardList, ShieldCheck } from "lucide-react";
import { ExecutionImage } from "@/components/common/ExecutionImage";
import { executionVisuals } from "@/data/execution-visuals";
import { BusinessAuthForm, type BusinessAccessMode } from "./BusinessAuthForm";
import { BusinessWordmark } from "./BusinessUI";

export function BusinessAccess({ mode }: { mode: BusinessAccessMode }) {
  return <div className={`zb-biz-access zb-biz-access--${mode}`}>
    <header className="zb-biz-access-header"><BusinessWordmark /><Link href="/for-business" className="zb-biz-back"><ArrowLeft aria-hidden="true" />Back to website</Link></header>
    <div className="zb-biz-access-grid">
      <aside className="zb-biz-access-story" aria-label="Your business workspace">
        <p className="zb-biz-eyebrow">People. Plans. Possibilities.</p>
        <h2>Your next team<br />starts here.</h2>
        <p>Approved partners get a dedicated company workspace. Sign in with your Partner ID, choose your own password and bring the next brief to life.</p>
        <figure className="zb-biz-access-image">
          <ExecutionImage visual={executionVisuals["operations-coordination"]} sizes="(max-width: 800px) 100vw, 540px" priority />
          <figcaption>People behind the process <span>AI-generated illustration</span></figcaption>
        </figure>
        <div className="zb-biz-story-features">
          <span><Building2 aria-hidden="true" />Your company</span><span><ClipboardList aria-hidden="true" />Your next brief</span><span><ShieldCheck aria-hidden="true" />Private access</span>
        </div>
      </aside>
      <section className="zb-biz-access-form"><BusinessAuthForm mode={mode} /></section>
    </div>
    <footer className="zb-biz-access-footer"><span>Hire. Deploy. Deliver.</span><Link href="/contact">Need a hand? Contact us</Link></footer>
  </div>;
}
