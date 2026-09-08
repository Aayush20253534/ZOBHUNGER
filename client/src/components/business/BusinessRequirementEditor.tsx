"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft, LockKeyhole, Plus } from "lucide-react";
import { getBusinessRequirement } from "@/services/business.service";
import { useBusiness } from "./BusinessProvider";
import { DashboardError, DashboardLoading, useBusinessResource } from "./BusinessDashboardUI";
import { BusinessRequirementForm } from "./BusinessRequirementForm";
import "@/styles/business-dashboard.css";
import "@/styles/business-requirements.css";

export function BusinessRequirementEditor({ id }: { id?: string }) {
  const { user } = useBusiness();
  return id ? <ExistingRequirementEditor key={`${user.id}:${id}`} id={id} /> : <BusinessRequirementForm key={user.id} />;
}

function ExistingRequirementEditor({ id }: { id: string }) {
  const { user } = useBusiness();
  const [retry, setRetry] = useState(0);
  const request = useCallback((signal: AbortSignal) => getBusinessRequirement(id, signal), [id]);
  const { data, error, loading } = useBusinessResource(`${user.id}:${id}:${retry}`, request);
  if (loading) return <div className="zb-dash"><DashboardLoading detail /></div>;
  if (error) return <div className="zb-dash"><DashboardError error={error} retry={() => setRetry(value => value + 1)} next={`/business/requirements/${id}/edit`} /></div>;
  if (!data) return null;
  if (data.requirement.status === "CLOSED") return <section className="zb-dash zb-biz-card zb-dash-error"><span className="zb-biz-icon"><LockKeyhole aria-hidden="true" /></span><h1>This requirement is closed.</h1><p>The brief and its history are still available. To request more people or a different assignment, create a new requirement.</p><div className="zb-biz-actions"><Link className="zb-biz-button" href="/business/requirements/new"><Plus aria-hidden="true" />New requirement</Link><Link href={`/business/requirements/${id}`} className="zb-biz-text-link"><ArrowLeft aria-hidden="true" />View the brief</Link></div></section>;
  return <BusinessRequirementForm key={`${id}:${data.requirement.revision}`} initial={data.requirement} />;
}
