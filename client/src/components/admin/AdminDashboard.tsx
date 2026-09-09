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
  WalletCards,
  MapPin,
  FileText,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { apiFetch, ApiError, type ApiSuccessEnvelope } from "@/lib/api";
import { getCurrentUser, logout } from "@/services/auth.service";
import type { AuthUser } from "@/types/auth.types";


const adminActionGroups = [
  {
    eyebrow: "People & access",
    title: "Partners and talent",
    copy: "Review organisations, partner access and candidate intake.",
    actions: [
      { href: "/admin/vendors", label: "Vendor empanelment & records", copy: "Supplier applications and vendor directory", icon: Handshake },
      { href: "/admin/partners", label: "Partner review & approvals", copy: "Business access approvals and credentials", icon: Building2 },
      { href: "/admin/careers", label: "Career profiles & HR review", copy: "General candidate profiles and CV review", icon: UsersRound },
      { href: "/admin/worker-applications", label: "Worker applications & profiles", copy: "Worker hiring pipeline and profile records", icon: UsersRound },
      { href: "/admin/security", label: "Admin security", copy: "MFA and administrator account protection", icon: ShieldCheck },
    ],
  },
  {
    eyebrow: "Workforce operations",
    title: "Hiring and deployment",
    copy: "Move people from candidate review into active assignments.",
    actions: [
      { href: "/admin/candidate-management", label: "Candidate sharing & reviews", copy: "Business-facing candidate decisions", icon: UsersRound },
      { href: "/admin/deployments", label: "Deployment & team roster", copy: "Confirmed assignments and active teams", icon: BriefcaseBusiness },
      { href: "/admin/requirement-jobs", label: "Hiring briefs & job openings", copy: "Requirements linked to published roles", icon: ClipboardList },
      { href: "/admin/worker-attendance", label: "Worker attendance requests", copy: "Worker submissions awaiting operations review", icon: CalendarCheck2 },
    ],
  },
  {
    eyebrow: "Control & finance",
    title: "Attendance and payments",
    copy: "Review official work records, earnings and reporting outputs.",
    actions: [
      { href: "/admin/attendance", label: "Attendance & corrections", copy: "Official records and correction handling", icon: CalendarCheck2 },
      { href: "/admin/attendance-approvals", label: "Attendance approval history", copy: "Business approvals and decision history", icon: CalendarCheck2 },
      { href: "/admin/earnings", label: "Worker earnings & payments", copy: "Statements, adjustments and payment records", icon: WalletCards },
      { href: "/admin/reports", label: "Reports & exports", copy: "Operational summaries and controlled exports", icon: FileText },
    ],
  },
] as const;

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
      if (!current.data.user.adminMfaEnabled) {
        router.replace("/admin/security");
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
      <section className="zb-admin-toolbar" aria-labelledby="admin-dashboard-title">
        <div className="zb-admin-toolbar-head">
          <div className="zb-admin-toolbar-copy">
            <p className="zb-eyebrow">Authenticated administrator</p>
            <h1 id="admin-dashboard-title">Operations dashboard</h1>
            <p>{user?.email}</p>
          </div>
          <div className="zb-admin-session-actions" aria-label="Dashboard session actions">
            <button type="button" onClick={() => void load()} disabled={loading}>
              <RefreshCw aria-hidden="true" /> {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button type="button" onClick={() => void handleLogout()}>
              <LogOut aria-hidden="true" /> Log out
            </button>
          </div>
        </div>

        <nav className="zb-admin-command-grid" aria-label="Administration workspaces">
          {adminActionGroups.map((group) => (
            <section className="zb-admin-command-group" key={group.title}>
              <header>
                <p className="zb-eyebrow">{group.eyebrow}</p>
                <h2>{group.title}</h2>
                <p>{group.copy}</p>
              </header>
              <div className="zb-admin-command-list">
                {group.actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link className="zb-admin-command" href={action.href} key={action.href}>
                      <span className="zb-admin-command-icon" aria-hidden="true"><Icon /></span>
                      <span className="zb-admin-command-copy">
                        <strong>{action.label}</strong>
                        <small>{action.copy}</small>
                      </span>
                      <ChevronRight className="zb-admin-command-arrow" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </section>

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
          <div className="zb-admin-panel-action">
            <div>
              <strong>Partner access approvals</strong>
              <span>Review submitted applications and issue business access from the dedicated approval workspace.</span>
            </div>
            <Link href="/admin/partners"><Handshake aria-hidden="true" />Review partners</Link>
          </div>
          {data.partnerApplications.items.length === 0 ? (
            <EmptyRow />
          ) : (
            data.partnerApplications.items.map((item) => <PartnerAdminRow key={item.id} item={item} />)
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

function PartnerAdminRow({ item }: { item: PartnerApplication }) {
  return (
    <div className="zb-admin-row zb-admin-partner-row">
      <div>
        <strong>{item.fullName}</strong>
        <div className="zb-admin-partner-meta">
          <span title={item.currentProfession}><BriefcaseBusiness aria-hidden="true" />{item.currentProfession || "Profession not provided"}</span>
          <span title={item.specialization}><ClipboardList aria-hidden="true" />{item.specialization || "Specialization not provided"}</span>
          <span><MapPin aria-hidden="true" />{item.currentCity || "City not provided"}</span>
          {item.resumeFileName && <span><FileText aria-hidden="true" />Resume attached</span>}
        </div>
      </div>
      <span className="zb-chip">{item.status}</span>
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
