"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  CalendarCheck2,
  Inbox,
  Handshake,
  LogOut,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { apiFetch, ApiError, type ApiSuccessEnvelope } from "@/lib/api";
import { getCurrentUser, logout } from "@/services/auth.service";
import type { AuthUser } from "@/types/auth.types";

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Enquiry {
  id: string;
  name: string;
  companyName?: string | null;
  email: string;
  serviceRequired?: string | null;
  createdAt: string;
}

interface Requirement {
  id: string;
  companyName: string;
  contactPerson: string;
  serviceRequired: string;
  workforceCount: number;
  jobLocation: string;
  status: string;
  createdAt: string;
}

interface AdminJob {
  id: string;
  title: string;
  location: string;
  status: string;
  _count: { applications: number };
}

interface Application {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  job: { id: string; slug: string; title: string; status: string };
}


interface PartnerApplication {
  id: string;
  fullName: string;
  email: string;
  currentCity: string;
  currentProfession: string;
  companyName: string;
  totalExperienceYears: number;
  specialization: string;
  contributionPreference: string;
  preferredPartnershipArea: string;
  resumeFileName?: string | null;
  status: string;
  createdAt: string;
}

interface PlacementCellApplication {
  id: string;
  institutionName: string;
  institutionType: string;
  contactPersonName: string;
  officialEmail: string;
  city: string;
  state: string;
  numberOfStudents: number;
  preferredOpportunityTypes: string[];
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  provisionedUserId?: string | null;
  createdAt: string;
}

interface DashboardData {
  enquiries: Paginated<Enquiry>;
  requirements: Paginated<Requirement>;
  jobs: Paginated<AdminJob>;
  applications: Paginated<Application>;
  partnerApplications: Paginated<PartnerApplication>;
  placementCellApplications: Paginated<PlacementCellApplication>;
}

async function fetchPage<T>(path: string) {
  const response = await apiFetch<ApiSuccessEnvelope<Paginated<T>>>(
    `${path}?page=1&pageSize=5`,
  );
  return response.data;
}

export function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const current = await getCurrentUser();
      if (current.data.user.role !== "ADMIN") {
        router.replace("/login");
        return;
      }
      setUser(current.data.user);

      const [enquiries, requirements, jobs, applications, partnerApplications, placementCellApplications] = await Promise.all([
        fetchPage<Enquiry>("/admin/enquiries"),
        fetchPage<Requirement>("/admin/requirements"),
        fetchPage<AdminJob>("/admin/jobs"),
        fetchPage<Application>("/admin/applications"),
        fetchPage<PartnerApplication>("/admin/partner-applications"),
        fetchPage<PlacementCellApplication>("/admin/placement-cell-applications"),
      ]);
      setData({ enquiries, requirements, jobs, applications, partnerApplications, placementCellApplications });
    } catch (caught) {
      if (caught instanceof ApiError && (caught.status === 401 || caught.status === 403)) {
        router.replace("/login");
        return;
      }
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to load the admin dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const stats = useMemo(
    () =>
      data
        ? [
            { label: "Enquiries", value: data.enquiries.total, icon: Inbox },
            {
              label: "Requirements",
              value: data.requirements.total,
              icon: ClipboardList,
            },
            { label: "Jobs", value: data.jobs.total, icon: BriefcaseBusiness },
            {
              label: "Applications",
              value: data.applications.total,
              icon: UsersRound,
            },
            {
              label: "Partner leads",
              value: data.partnerApplications.total,
              icon: Handshake,
            },
            {
              label: "Institution partners",
              value: data.placementCellApplications.total,
              icon: Building2,
            },
          ]
        : [],
    [data],
  );

  async function updatePlacementCellStatus(
    id: string,
    status: "UNDER_REVIEW" | "APPROVED" | "REJECTED",
  ) {
    setError(null);
    try {
      await apiFetch(`/admin/placement-cell-applications/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to update the institution partnership application.");
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (loading && !data) {
    return <div className="zb-admin-state">Loading admin data...</div>;
  }

  if (error && !data) {
    return (
      <div className="zb-admin-state" role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => void load()}>
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="zb-admin-dashboard">
      <div className="zb-admin-toolbar">
        <div>
          <p className="zb-eyebrow">Authenticated administrator</p>
          <h1>Operations dashboard</h1>
          <p>{user?.email}</p>
        </div>
        <div className="zb-admin-actions">
          <Link href="/admin/vendors"><Handshake aria-hidden="true" />Vendor empanelment &amp; records</Link>
          <Link href="/admin/partners"><Handshake aria-hidden="true" />Partner review &amp; approvals</Link>
          <Link href="/admin/careers"><UsersRound aria-hidden="true" />Career profiles &amp; HR review</Link>
          <Link href="/admin/candidate-management"><UsersRound aria-hidden="true" />Candidate sharing &amp; reviews</Link>
          <Link href="/admin/deployments"><BriefcaseBusiness aria-hidden="true" />Deployment &amp; team roster</Link>
          <Link href="/admin/requirement-jobs"><BriefcaseBusiness aria-hidden="true" />Hiring briefs &amp; job openings</Link>
          <Link href="/admin/attendance-approvals"><CalendarCheck2 aria-hidden="true" />Attendance approval history</Link>
          <Link href="/admin/reports"><BriefcaseBusiness aria-hidden="true" />Reports &amp; exports</Link>
          <Link href="/admin/attendance"><CalendarCheck2 aria-hidden="true" />Attendance &amp; corrections</Link>
          <button type="button" onClick={() => void load()} disabled={loading}>
            <RefreshCw aria-hidden="true" /> Refresh
          </button>
          <button type="button" onClick={() => void handleLogout()}>
            <LogOut aria-hidden="true" /> Log out
          </button>
        </div>
      </div>

      {error && <p className="zb-login-error">{error}</p>}

      <section className="zb-admin-stats" aria-label="Admin totals">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label}>
              <Icon aria-hidden="true" />
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="zb-admin-panels">
        <AdminPanel title="Recent enquiries">
          {data.enquiries.items.length === 0 ? (
            <EmptyRow />
          ) : (
            data.enquiries.items.map((item) => (
              <AdminRow
                key={item.id}
                title={item.name}
                meta={`${item.companyName || item.email} · ${item.serviceRequired || "General enquiry"}`}
                tag={new Date(item.createdAt).toLocaleDateString()}
              />
            ))
          )}
        </AdminPanel>

        <AdminPanel title="Recent workforce requirements">
          {data.requirements.items.length === 0 ? (
            <EmptyRow />
          ) : (
            data.requirements.items.map((item) => (
              <AdminRow
                key={item.id}
                title={item.companyName}
                meta={`${item.workforceCount} people · ${item.serviceRequired} · ${item.jobLocation}`}
                tag={item.status}
              />
            ))
          )}
        </AdminPanel>

        <AdminPanel title="Jobs in the database">
          {data.jobs.items.length === 0 ? (
            <EmptyRow />
          ) : (
            data.jobs.items.map((item) => (
              <AdminRow
                key={item.id}
                title={item.title}
                meta={`${item.location} · ${item._count.applications} applications`}
                tag={item.status}
              />
            ))
          )}
        </AdminPanel>

        <AdminPanel title="Recent applications">
          {data.applications.items.length === 0 ? (
            <EmptyRow />
          ) : (
            data.applications.items.map((item) => (
              <AdminRow
                key={item.id}
                title={item.name}
                meta={`${item.job.title} · ${item.email}`}
                tag={item.status}
              />
            ))
          )}
        </AdminPanel>

        <AdminPanel title="Business Partner applications">
          <Link href="/admin/partners">Review applications and issue business access →</Link>
          {data.partnerApplications.items.length === 0 ? (
            <EmptyRow />
          ) : (
            data.partnerApplications.items.map((item) => (
              <AdminRow
                key={item.id}
                title={item.fullName}
                meta={`${item.currentProfession} · ${item.specialization} · ${item.currentCity}${item.resumeFileName ? " · Resume attached" : ""}`}
                tag={item.status}
              />
            ))
          )}
        </AdminPanel>

        <AdminPanel title="Placement Cell & Institution onboarding">
          {data.placementCellApplications.items.length === 0 ? (
            <EmptyRow />
          ) : (
            data.placementCellApplications.items.map((item) => (
              <PlacementCellAdminRow
                key={item.id}
                item={item}
                onStatusChange={updatePlacementCellStatus}
              />
            ))
          )}
        </AdminPanel>
      </section>
    </div>
  );
}

function AdminPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="zb-admin-panel">
      <h2>{title}</h2>
      <div className="zb-admin-list">{children}</div>
    </article>
  );
}

function AdminRow({ title, meta, tag }: { title: string; meta: string; tag: string }) {
  return (
    <div className="zb-admin-row">
      <div>
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      <span className="zb-chip">{tag}</span>
    </div>
  );
}

function PlacementCellAdminRow({
  item,
  onStatusChange,
}: {
  item: PlacementCellApplication;
  onStatusChange: (id: string, status: "UNDER_REVIEW" | "APPROVED" | "REJECTED") => Promise<void>;
}) {
  return (
    <div className="zb-admin-row zb-admin-placement-row">
      <div>
        <strong>{item.institutionName}</strong>
        <span>{`${item.contactPersonName} · ${item.city}, ${item.state} · ${item.numberOfStudents} students`}</span>
        <span>{item.officialEmail}</span>
        <div className="zb-admin-row-actions">
          {item.status === "SUBMITTED" && (
            <button type="button" onClick={() => void onStatusChange(item.id, "UNDER_REVIEW")}>Review</button>
          )}
          {(item.status === "SUBMITTED" || item.status === "UNDER_REVIEW") && (
            <>
              <button type="button" className="zb-admin-approve" onClick={() => void onStatusChange(item.id, "APPROVED")}>Approve & provision access</button>
              <button type="button" onClick={() => void onStatusChange(item.id, "REJECTED")}>Reject</button>
            </>
          )}
        </div>
      </div>
      <span className="zb-chip">{item.status}</span>
    </div>
  );
}

function EmptyRow() {
  return <p className="zb-admin-empty">No records yet.</p>;
}
