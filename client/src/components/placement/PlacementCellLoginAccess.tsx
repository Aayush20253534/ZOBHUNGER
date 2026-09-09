"use client";
import { useEffect, useState } from "react";
import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { PlacementCellActivationForm } from "@/components/placement/PlacementCellActivationForm";
import { PlacementCellLoginForm } from "@/components/placement/PlacementCellLoginForm";
import { PageShell } from "@/components/common/PageShell";

export function PlacementCellLoginAccess() {
  const [activation, setActivation] = useState<string | null>(null);
  useEffect(() => {
    const read = () => { const params = new URLSearchParams(window.location.hash.replace(/^#/, "")); setActivation(params.get("activation")); };
    read(); window.addEventListener("hashchange", read); return () => window.removeEventListener("hashchange", read);
  }, []);
  return <><div className="zb-portal-heading"><PageShell eyebrow="Institution partner access" title={activation?"Activate your approved institution partner account":"Institution Partner Portal Login"} description={activation?"Create your secure password to complete account activation.":"Dedicated access for approved colleges, universities, training institutes and their authorized placement or career-services teams."}/></div><div className="zb-login-layout zb-placement-login-layout">{activation?<PlacementCellActivationForm token={activation}/>:<PlacementCellLoginForm/>}<aside className="zb-account-access-summary"><p className="zb-eyebrow">Controlled access</p><h2>Approved institutions only</h2><div className="zb-account-type-list"><article><span className="zb-icon-tile"><ShieldCheck/></span><div><h3>Approval required</h3><p>Submitting institution details does not automatically create portal access.</p></div></article><article><span className="zb-icon-tile"><CheckCircle2/></span><div><h3>Secure activation</h3><p>Approved representatives receive a time-limited activation link on their official email.</p></div></article><article><span className="zb-icon-tile"><Building2/></span><div><h3>Institution workspace</h3><p>Access the Institution Partner Portal and institution profile from one dedicated workspace.</p></div></article></div></aside></div></>;
}
