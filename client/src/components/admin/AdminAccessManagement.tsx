"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  KeyRound,
  LoaderCircle,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  SlidersHorizontal,
  UserCog,
  UserRoundCheck,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  createAdminAccount,
  getAdminAccessConfig,
  listAdminAccounts,
  resendAdminAccountInvitation,
  updateAdminAccountAccess,
  updateAdminAccountStatus,
  type AdminAccessConfig,
  type AdminAccountStatus,
  type DepartmentAdminAccount,
} from "@/services/admin-access.service";
import type { AdminDepartment, AdminPermission } from "@/types/auth.types";

type ManagedDepartment = Exclude<AdminDepartment, "MAIN_ADMIN">;
type Notice = { tone: "success" | "warning" | "error"; text: string } | null;

const suggestedEmails: Record<ManagedDepartment, string> = {
  HR: "hr@zobhungr.com",
  TECHNICAL: "tech@zobhungr.com",
  PLACEMENT_CELL: "placementcell@zobhungr.com",
  LEGAL: "legal@zobhungr.com",
};

function formatDate(value: string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function statusLabel(status: AdminAccountStatus) {
  if (status === "ACTIVE") return "Active";
  if (status === "PENDING") return "Invitation pending";
  return "Disabled";
}

export function AdminAccessManagement() {
  const [config, setConfig] = useState<AdminAccessConfig | null>(null);
  const [accounts, setAccounts] = useState<DepartmentAdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<AdminDepartment | "">("");
  const [statusFilter, setStatusFilter] = useState<AdminAccountStatus | "">("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentAdminAccount | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formDepartment, setFormDepartment] = useState<ManagedDepartment>("HR");
  const [formPermissions, setFormPermissions] = useState<AdminPermission[]>([]);
  const [saving, setSaving] = useState(false);
  const [busyAccount, setBusyAccount] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const loadConfig = useCallback(async () => {
    const response = await getAdminAccessConfig();
    setConfig(response.data);
    return response.data;
  }, []);

  const loadAccounts = useCallback(async (soft = false) => {
    soft ? setRefreshing(true) : setLoading(true);
    try {
      const response = await listAdminAccounts({
        query: query || undefined,
        department: departmentFilter || undefined,
        status: statusFilter || undefined,
      });
      setAccounts(response.data.items);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof ApiError ? error.message : "Unable to load administrator access." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [departmentFilter, query, statusFilter]);

  useEffect(() => {
    let active = true;
    void loadConfig()
      .then(cfg => {
        if (!active) return;
        const hr = cfg.departments.find(item => item.value === "HR") ?? cfg.departments[0];
        if (hr) {
          setFormDepartment(hr.value);
          setFormPermissions(hr.defaultPermissions);
        }
      })
      .catch(error => { if (active) setNotice({ tone: "error", text: error instanceof ApiError ? error.message : "Unable to load administrator policy." }); });
    return () => { active = false; };
  }, [loadConfig]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadAccounts(); }, 220);
    return () => window.clearTimeout(timer);
  }, [loadAccounts]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) setDrawerOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, saving]);

  const stats = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter(item => item.status === "ACTIVE").length,
    pending: accounts.filter(item => item.status === "PENDING").length,
    departments: new Set(accounts.filter(item => item.department && item.department !== "MAIN_ADMIN").map(item => item.department)).size,
  }), [accounts]);

  const selectedDepartment = config?.departments.find(item => item.value === formDepartment);

  function openCreate() {
    const initial = config?.departments.find(item => item.value === "HR") ?? config?.departments[0];
    setEditing(null);
    setFormEmail("");
    if (initial) {
      setFormDepartment(initial.value);
      setFormPermissions(initial.defaultPermissions);
    }
    setNotice(null);
    setDrawerOpen(true);
  }

  function openEdit(account: DepartmentAdminAccount) {
    if (account.protectedAccount || account.department === "MAIN_ADMIN" || !account.department) return;
    setEditing(account);
    setFormEmail(account.email);
    setFormDepartment(account.department);
    setFormPermissions(account.permissions);
    setNotice(null);
    setDrawerOpen(true);
  }

  function changeDepartment(value: ManagedDepartment) {
    setFormDepartment(value);
    const department = config?.departments.find(item => item.value === value);
    setFormPermissions(department?.defaultPermissions ?? ["DASHBOARD_VIEW"]);
    if (!editing && (!formEmail || Object.values(suggestedEmails).includes(formEmail))) setFormEmail(suggestedEmails[value]);
  }

  function togglePermission(permission: AdminPermission) {
    if (permission === "DASHBOARD_VIEW") return;
    setFormPermissions(current => current.includes(permission)
      ? current.filter(item => item !== permission)
      : [...current, permission]);
  }

  async function saveAccess() {
    if (!formEmail.trim() || !selectedDepartment) return;
    setSaving(true);
    setNotice(null);
    try {
      if (editing) {
        await updateAdminAccountAccess(editing.id, { department: formDepartment, permissions: formPermissions });
        setNotice({ tone: "success", text: `${editing.email} access has been updated. Existing sessions were closed so the new policy applies immediately.` });
      } else {
        const response = await createAdminAccount({ email: formEmail.trim().toLowerCase(), department: formDepartment, permissions: formPermissions });
        setNotice({
          tone: response.data.invitationDelivered ? "success" : "warning",
          text: response.data.invitationDelivered
            ? `Secure activation sent to ${response.data.admin.email}.`
            : `${response.data.admin.email} was created, but the invitation email was not delivered. Use Resend invitation after checking email configuration.`,
        });
      }
      setDrawerOpen(false);
      await loadAccounts(true);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof ApiError ? error.message : "Unable to save administrator access." });
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(account: DepartmentAdminAccount) {
    if (account.protectedAccount || account.status === "PENDING") return;
    setBusyAccount(account.id);
    setNotice(null);
    try {
      const enable = account.status === "DISABLED";
      await updateAdminAccountStatus(account.id, enable);
      setNotice({ tone: "success", text: `${account.email} has been ${enable ? "enabled" : "disabled"}.` });
      await loadAccounts(true);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof ApiError ? error.message : "Unable to change administrator status." });
    } finally {
      setBusyAccount(null);
    }
  }

  async function resendInvite(account: DepartmentAdminAccount) {
    setBusyAccount(account.id);
    setNotice(null);
    try {
      const response = await resendAdminAccountInvitation(account.id);
      setNotice({
        tone: response.data.delivered ? "success" : "warning",
        text: response.data.delivered ? `Fresh activation link sent to ${account.email}.` : "A fresh activation link was generated, but email delivery is still unavailable.",
      });
      await loadAccounts(true);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof ApiError ? error.message : "Unable to resend the invitation." });
    } finally {
      setBusyAccount(null);
    }
  }

  return (
    <div className="zba-access-page">
      <section className="zba-access-hero" aria-labelledby="admin-access-title">
        <div className="zba-access-hero-copy">
          <span className="zba-access-kicker"><ShieldEllipsis aria-hidden="true" /> Access governance</span>
          <h1 id="admin-access-title">Department admin access, without separate portals.</h1>
          <p>Issue controlled HR, Technical, Placement Cell and Legal access from one secure operations workspace. Main Administration remains protected with full visibility.</p>
        </div>
        <div className="zba-access-hero-actions">
          <button type="button" className="zba-button zba-button-secondary" onClick={() => void loadAccounts(true)} disabled={refreshing}>
            <RefreshCw className={refreshing ? "zba-spin" : ""} aria-hidden="true" /> Refresh
          </button>
          <button type="button" className="zba-button zba-button-primary" onClick={openCreate} disabled={!config}>
            <Plus aria-hidden="true" /> Add administrator
          </button>
        </div>
      </section>

      {notice && (
        <div className={`zba-notice is-${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.tone === "success" ? <BadgeCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
          <span>{notice.text}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}><X aria-hidden="true" /></button>
        </div>
      )}

      <section className="zba-stat-grid" aria-label="Administrator access summary">
        <Stat icon={UsersRound} label="Administrators" value={stats.total} copy="Visible in this access directory" />
        <Stat icon={UserRoundCheck} label="Active access" value={stats.active} copy="Activated department accounts" />
        <Stat icon={Clock3} label="Pending invites" value={stats.pending} copy={`Activation links expire after ${config?.invitationHours ?? 48} hours`} />
        <Stat icon={Building2} label="Departments" value={stats.departments} copy="Departments with configured access" />
      </section>

      <section className="zba-directory">
        <header className="zba-directory-head">
          <div><span className="zba-section-kicker">Administrator directory</span><h2>Accounts & access policy</h2><p>Search, review and change department access without exposing unrelated operational desks.</p></div>
          <span className="zba-directory-security"><ShieldCheck aria-hidden="true" /> MFA required after activation</span>
        </header>

        <div className="zba-filters">
          <label className="zba-search"><Search aria-hidden="true" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search administrator email" aria-label="Search administrator email" /></label>
          <label className="zba-filter-select"><SlidersHorizontal aria-hidden="true" /><select value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value as AdminDepartment | "")} aria-label="Filter by department"><option value="">All departments</option><option value="MAIN_ADMIN">Main Administration</option>{config?.departments.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select><ChevronDown aria-hidden="true" /></label>
          <label className="zba-filter-select"><select value={statusFilter} onChange={event => setStatusFilter(event.target.value as AdminAccountStatus | "")} aria-label="Filter by status"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="PENDING">Invitation pending</option><option value="DISABLED">Disabled</option></select><ChevronDown aria-hidden="true" /></label>
        </div>

        <div className="zba-account-list" aria-live="polite">
          {loading ? (
            <div className="zba-empty"><LoaderCircle className="zba-spin" aria-hidden="true" /><strong>Loading secure access directory</strong><span>Checking administrator records and department policy.</span></div>
          ) : accounts.length === 0 ? (
            <div className="zba-empty"><UserCog aria-hidden="true" /><strong>No administrators match these filters.</strong><span>Clear the filters or create a department administrator.</span></div>
          ) : accounts.map(account => (
            <article className={`zba-account${account.protectedAccount ? " is-protected" : ""}`} key={account.id}>
              <div className="zba-account-identity">
                <span className="zba-account-avatar">{account.email.slice(0, 2).toUpperCase()}</span>
                <div><strong>{account.email}</strong><span>{account.departmentLabel}</span></div>
              </div>
              <div className="zba-account-security">
                <span className={`zba-status is-${account.status.toLowerCase()}`}>{account.status === "ACTIVE" ? <Check aria-hidden="true" /> : account.status === "PENDING" ? <Clock3 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}{statusLabel(account.status)}</span>
                <span className={`zba-mfa${account.mfaEnabled ? " is-on" : ""}`}><KeyRound aria-hidden="true" />{account.mfaEnabled ? "MFA on" : "MFA pending"}</span>
              </div>
              <div className="zba-account-meta"><span><small>Last login</small><strong>{formatDate(account.lastLoginAt)}</strong></span><span><small>Access areas</small><strong>{account.permissions.length}</strong></span><span><small>Created</small><strong>{formatDate(account.createdAt)}</strong></span></div>
              <div className="zba-account-actions">
                {account.protectedAccount ? <span className="zba-protected"><ShieldCheck aria-hidden="true" />Protected Main Admin</span> : (
                  <>
                    <button type="button" onClick={() => openEdit(account)} disabled={busyAccount === account.id}>Edit access</button>
                    {account.status === "PENDING" && <button type="button" onClick={() => void resendInvite(account)} disabled={busyAccount === account.id}>{busyAccount === account.id ? <LoaderCircle className="zba-spin" aria-hidden="true" /> : <Mail aria-hidden="true" />}Resend invite</button>}
                    {account.status !== "PENDING" && <button type="button" className={account.status === "ACTIVE" ? "is-danger" : ""} onClick={() => void changeStatus(account)} disabled={busyAccount === account.id}>{busyAccount === account.id && <LoaderCircle className="zba-spin" aria-hidden="true" />}{account.status === "ACTIVE" ? "Disable" : "Enable"}</button>}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {drawerOpen && (
        <div className="zba-drawer-layer" role="presentation">
          <button className="zba-drawer-backdrop" type="button" aria-label="Close access editor" onClick={() => !saving && setDrawerOpen(false)} />
          <aside className="zba-drawer" role="dialog" aria-modal="true" aria-labelledby="access-editor-title">
            <header className="zba-drawer-head"><div><span className="zba-section-kicker">{editing ? "Edit policy" : "Secure invitation"}</span><h2 id="access-editor-title">{editing ? "Update department access" : "Add department administrator"}</h2><p>{editing ? "Changing permissions closes existing sessions so the new policy takes effect immediately." : "The administrator creates their own password from a one-time email link, then enrolls MFA on first sign-in."}</p></div><button type="button" aria-label="Close" onClick={() => !saving && setDrawerOpen(false)}><X aria-hidden="true" /></button></header>

            <div className="zba-drawer-body">
              <label className="zba-field"><span>Email address</span><div className="zba-field-control"><Mail aria-hidden="true" /><input type="email" value={formEmail} onChange={event => setFormEmail(event.target.value)} disabled={Boolean(editing)} placeholder="department@zobhungr.com" autoComplete="off" /></div>{!editing && <button className="zba-suggestion" type="button" onClick={() => setFormEmail(suggestedEmails[formDepartment])}>Use {suggestedEmails[formDepartment]}</button>}</label>

              <label className="zba-field"><span>Department</span><div className="zba-field-control is-select"><Building2 aria-hidden="true" /><select value={formDepartment} onChange={event => changeDepartment(event.target.value as ManagedDepartment)}>{config?.departments.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select><ChevronDown aria-hidden="true" /></div></label>

              <section className="zba-permissions" aria-labelledby="permission-title"><div className="zba-permissions-head"><div><span>Workspace permissions</span><strong id="permission-title">{selectedDepartment?.label ?? "Department"} access</strong></div><span>{formPermissions.length} selected</span></div><p>Only areas relevant to the selected department can be granted. Main Administration remains the only role that can manage administrator accounts.</p><div className="zba-permission-list">{selectedDepartment?.permissions.map(permission => { const checked = formPermissions.includes(permission.value); const mandatory = permission.value === "DASHBOARD_VIEW"; return <label className={`zba-permission${checked ? " is-selected" : ""}`} key={permission.value}><input type="checkbox" checked={checked} disabled={mandatory} onChange={() => togglePermission(permission.value)} /><span className="zba-permission-check">{checked && <Check aria-hidden="true" />}</span><span><strong>{permission.label}</strong><small>{permission.description}</small></span>{mandatory && <em>Required</em>}</label>; })}</div></section>
            </div>

            <footer className="zba-drawer-footer"><button type="button" className="zba-button zba-button-secondary" onClick={() => setDrawerOpen(false)} disabled={saving}>Cancel</button><button type="button" className="zba-button zba-button-primary" onClick={() => void saveAccess()} disabled={saving || !formEmail.trim() || !selectedDepartment}>{saving ? <LoaderCircle className="zba-spin" aria-hidden="true" /> : editing ? <ShieldCheck aria-hidden="true" /> : <Mail aria-hidden="true" />}{saving ? "Saving…" : editing ? "Save access policy" : "Send secure invitation"}</button></footer>
          </aside>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, copy }: { icon: LucideIcon; label: string; value: number; copy: string }) {
  return <article className="zba-stat"><span><Icon aria-hidden="true" /></span><div><small>{label}</small><strong>{value}</strong><p>{copy}</p></div></article>;
}
