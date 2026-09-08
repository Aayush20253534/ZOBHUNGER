import Link from "next/link";
import type { BusinessProfile } from "@/types/business.types";

export function BusinessWordmark() {
  return <Link href="/" className="zb-biz-wordmark" aria-label="ZOBHUNGER home">ZOB<span>HUNGER</span><small>BUSINESS WORKSPACE</small></Link>;
}

export function BusinessHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <header className="zb-biz-heading"><p className="zb-biz-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="zb-biz-muted">{copy}</p></header>;
}

export function profileCompletion(profile: BusinessProfile | null) {
  const fields = [profile?.companyName, profile?.contactPerson, profile?.industry, profile?.phone, profile?.city, profile?.state];
  return Math.round(fields.filter(value => value?.trim()).length / fields.length * 100);
}
