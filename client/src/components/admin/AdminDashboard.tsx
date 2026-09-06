"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  ClipboardList,
  Inbox,
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

interface DashboardData {
  enquiries: Paginated<Enquiry>;
  requirements: Paginated<Requirement>;
  jobs: Paginated<AdminJob>;
  applications: Paginated<Application>;
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

      const [enquiries, requirements, jobs, applications] = await Promise.all([
        fetchPage<Enquiry>("/admin/enquiries"),
        fetchPage<Requirement>("/admin/requirements"),
        fetchPage<AdminJob>("/admin/jobs"),
        fetchPage<Application>("/admin/applications"),
      ]);
      setData({ enquiries, requirements, jobs, applications });
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
    void load();
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
          ]
        : [],
    [data],
  );

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
          <h1>Phase 1 operations dashboard</h1>
          <p>{user?.email}</p>
        </div>
        <div className="zb-admin-actions">
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

function EmptyRow() {
  return <p className="zb-admin-empty">No records yet.</p>;
}
