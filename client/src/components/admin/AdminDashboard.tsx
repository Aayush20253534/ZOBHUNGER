"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  ClipboardList,
  Inbox,
  Handshake,
  LogOut,
  RefreshCw,
  UsersRound,
  MapPin,
  FileText,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { apiFetch, ApiError, type ApiSuccessEnvelope } from "@/lib/api";
import { adminNavigation } from "@/data/admin-navigation";
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
            { label: "Enquiries", value: data.enquiries.total, href: "/admin/reports", icon: Inbox },
            {
              label: "Requirements",
              value: data.requirements.total,
              href: "/admin/requirement-jobs",
              icon: ClipboardList,
            },
            { label: "Jobs", value: data.jobs.total, href: "/admin/requirement-jobs", icon: BriefcaseBusiness },
            {
              label: "Applications",
              value: data.applications.total,
              href: "/admin/worker-applications",
              icon: UsersRound,
            },
            {
              label: "Partner leads",
              value: data.partnerApplications.total,
              href: "/admin/partners",
              icon: Handshake,
            },
            {
              label: "Institution partners",
              value: data.placementCellApplications.total,
              href: "/admin/partners",
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

  const quickLinks = adminNavigation
    .flatMap((group) => group.items)
    .filter((item) => item.href !== "/admin")
    .slice(0, 7);

  return (
    <div className="zbo-dashboard">
      <section className="zbo-dashboard-hero" aria-labelledby="admin-dashboard-title">
        <div className="zbo-dashboard-hero-copy">
          <p className="zbo-eyebrow">Operations overview</p>
          <h1 id="admin-dashboard-title">Keep the operation moving.</h1>
          <p>
            Review incoming work, move people through the pipeline and keep every active assignment accountable.
          </p>
          {user?.email && <span className="zbo-dashboard-user">Signed in as {user.email}</span>}
        </div>
        <div className="zbo-dashboard-hero-actions" aria-label="Dashboard actions">
          <button type="button" onClick={() => void load()} disabled={loading}>
            <RefreshCw aria-hidden="true" /> {loading ? "Refreshing…" : "Refresh data"}
          </button>
          <button type="button" onClick={() => void handleLogout()}>
            <LogOut aria-hidden="true" /> Sign out
          </button>
        </div>
      </section>

      {error && <p className="zb-login-error" role="alert">{error}</p>}

      <section className="zbo-dashboard-kpis" aria-label="Operational totals">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="zbo-dashboard-kpi" key={stat.label}>
              <div className="zbo-dashboard-kpi-head"><span>{stat.label}</span><Icon aria-hidden="true" /></div>
              <strong>{stat.value}</strong>
              <Link href={stat.href}>Open workspace <ChevronRight aria-hidden="true" /></Link>
            </article>
          );
        })}
      </section>

      <section className="zbo-dashboard-layout">
        <article className="zbo-dashboard-card">
          <header className="zbo-dashboard-card-header">
            <div><h2>Review queue</h2><p>The latest records that may need an operations decision.</p></div>
            <Inbox aria-hidden="true" />
          </header>
          <div className="zbo-dashboard-queue">
            <QueueItem icon={Inbox} title="Incoming enquiries" copy={`${data.enquiries.total} total enquiries in the system`} href="/admin/reports" label="Review" />
            <QueueItem icon={Handshake} title="Partner access" copy={`${data.partnerApplications.total} partner applications received`} href="/admin/partners" label="Open" />
            <QueueItem icon={UsersRound} title="Worker applications" copy={`${data.applications.total} job applications available`} href="/admin/worker-applications" label="Review" />
            <QueueItem icon={CalendarCheck2} title="Attendance requests" copy="Check worker submissions before records are approved" href="/admin/worker-attendance" label="Open" />
          </div>
        </article>

        <aside className="zbo-dashboard-card">
          <header className="zbo-dashboard-card-header">
            <div><h2>Jump to a workspace</h2><p>Direct links to the most-used desks.</p></div>
            <ChevronRight aria-hidden="true" />
          </header>
          <nav className="zbo-dashboard-quicklinks" aria-label="Quick workspaces">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link className="zbo-dashboard-quicklink" href={item.href} key={item.href}>
                  <span><Icon aria-hidden="true" /></span>
                  <span className="zbo-dashboard-quicklink-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                  <ChevronRight aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        </aside>
      </section>

      <section className="zbo-dashboard-panels" aria-label="Latest records">
        <AdminPanel title="Recent enquiries" icon={Inbox}>
          {data.enquiries.items.length === 0 ? <EmptyRow /> : data.enquiries.items.map((item) => (
            <AdminRow key={item.id} title={item.name} meta={`${item.companyName || item.email} · ${item.serviceRequired || "General enquiry"}`} tag={new Date(item.createdAt).toLocaleDateString()} />
          ))}
        </AdminPanel>

        <AdminPanel title="Workforce requirements" icon={ClipboardList}>
          {data.requirements.items.length === 0 ? <EmptyRow /> : data.requirements.items.map((item) => (
            <AdminRow key={item.id} title={item.companyName} meta={`${item.workforceCount} people · ${item.serviceRequired} · ${item.jobLocation}`} tag={item.status} />
          ))}
        </AdminPanel>

        <AdminPanel title="Published roles" icon={BriefcaseBusiness}>
          {data.jobs.items.length === 0 ? <EmptyRow /> : data.jobs.items.map((item) => (
            <AdminRow key={item.id} title={item.title} meta={`${item.location} · ${item._count.applications} applications`} tag={item.status} />
          ))}
        </AdminPanel>

        <AdminPanel title="Recent applications" icon={UsersRound}>
          {data.applications.items.length === 0 ? <EmptyRow /> : data.applications.items.map((item) => (
            <AdminRow key={item.id} title={item.name} meta={`${item.job.title} · ${item.email}`} tag={item.status} />
          ))}
        </AdminPanel>

        <AdminPanel title="Partner access applications" icon={Handshake}>
          <div className="zb-admin-panel-action">
            <div><strong>Review the business access queue</strong><span>Open the approval desk to check the submission and issue controlled access.</span></div>
            <Link href="/admin/partners"><Handshake aria-hidden="true" />Open desk</Link>
          </div>
          {data.partnerApplications.items.length === 0 ? <EmptyRow /> : data.partnerApplications.items.map((item) => <PartnerAdminRow key={item.id} item={item} />)}
        </AdminPanel>

        <AdminPanel title="Institution onboarding" icon={Building2}>
          {data.placementCellApplications.items.length === 0 ? <EmptyRow /> : data.placementCellApplications.items.map((item) => (
            <PlacementCellAdminRow key={item.id} item={item} onStatusChange={updatePlacementCellStatus} />
          ))}
        </AdminPanel>
      </section>
    </div>
  );
}

function QueueItem({ icon: Icon, title, copy, href, label }: { icon: LucideIcon; title: string; copy: string; href: string; label: string }) {
  return <div className="zbo-dashboard-queue-item"><span className="zbo-dashboard-queue-icon"><Icon aria-hidden="true" /></span><span className="zbo-dashboard-queue-copy"><strong>{title}</strong><span>{copy}</span></span><Link href={href}>{label}</Link></div>;
}

function AdminPanel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <article className="zbo-dashboard-card">
      <header className="zbo-dashboard-card-header"><div><h2>{title}</h2><p>Latest five records</p></div><Icon aria-hidden="true" /></header>
      <div className="zbo-dashboard-panel-list">{children}</div>
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
  return <p className="zbo-dashboard-empty">No records yet.</p>;
}
