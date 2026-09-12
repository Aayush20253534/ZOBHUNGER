import type { LucideIcon } from "lucide-react";
import type { AdminPermission } from "@/types/auth.types";
import {
  Activity,
  BadgeIndianRupee,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  Newspaper,
  Handshake,
  IdCard,
  Inbox,
  LayoutDashboard,
  LockKeyhole,
  UsersRound,
  UserRoundCheck,
  UserCog,
} from "lucide-react";

export interface AdminNavigationItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  permission?: AdminPermission;
}

export interface AdminNavigationGroup {
  label: string;
  items: readonly AdminNavigationItem[];
}

export const adminNavigation: readonly AdminNavigationGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        href: "/admin",
        permission: "DASHBOARD_VIEW",
        label: "Overview",
        description: "Live operations summary",
        icon: LayoutDashboard,
      },
      {
        href: "/admin/intake",
        permission: "DASHBOARD_VIEW",
        label: "Requests & intake",
        description: "Department case queue",
        icon: Inbox,
      },
    ],
  },
  {
    label: "People & access",
    items: [
      {
        href: "/admin/partners",
        permission: "PARTNERS_MANAGE",
        label: "Partner approvals",
        description: "Review access requests",
        icon: Handshake,
      },
      {
        href: "/admin/vendors",
        permission: "VENDORS_MANAGE",
        label: "Vendor network",
        description: "Empanelment and records",
        icon: Building2,
      },
      {
        href: "/admin/careers",
        permission: "CAREERS_MANAGE",
        label: "Career profiles",
        description: "Applicant review desk",
        icon: UserRoundCheck,
      },
      {
        href: "/admin/employee-joining",
        permission: "EMPLOYEE_JOINING_MANAGE",
        label: "Employee joining",
        description: "HR records and offers",
        icon: IdCard,
      },
      {
        href: "/admin/worker-applications",
        permission: "WORKERS_MANAGE",
        label: "Applications",
        description: "Hiring review desk",
        icon: UsersRound,
      },
      {
        href: "/admin/candidate-management",
        permission: "CANDIDATES_MANAGE",
        label: "Candidate sharing",
        description: "Business review pipeline",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    label: "Delivery operations",
    items: [
      {
        href: "/admin/requirement-jobs",
        permission: "REQUIREMENTS_MANAGE",
        label: "Hiring briefs",
        description: "Requirements and openings",
        icon: ClipboardList,
      },
      {
        href: "/admin/deployments",
        permission: "DEPLOYMENTS_MANAGE",
        label: "Deployments",
        description: "Assignments and rosters",
        icon: BriefcaseBusiness,
      },
      {
        href: "/admin/attendance",
        permission: "ATTENDANCE_MANAGE",
        label: "Attendance",
        description: "Official work records",
        icon: CalendarCheck2,
      },
      {
        href: "/admin/worker-attendance",
        permission: "ATTENDANCE_MANAGE",
        label: "Attendance requests",
        description: "Worker submissions",
        icon: Activity,
      },
      {
        href: "/admin/attendance-approvals",
        permission: "ATTENDANCE_MANAGE",
        label: "Approval history",
        description: "Business decisions",
        icon: FileCheck2,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        href: "/admin/blogs",
        permission: "BLOGS_MANAGE",
        label: "Blog & content",
        description: "Draft, schedule and publish",
        icon: Newspaper,
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        href: "/admin/access",
        permission: "ADMIN_USERS_MANAGE",
        label: "Admin access",
        description: "Departments and permissions",
        icon: UserCog,
      },
    ],
  },
  {
    label: "Finance & reporting",
    items: [
      {
        href: "/admin/earnings",
        permission: "EARNINGS_MANAGE",
        label: "Earnings & payments",
        description: "Statements and payouts",
        icon: BadgeIndianRupee,
      },
      {
        href: "/admin/reports",
        permission: "REPORTS_VIEW",
        label: "Reports",
        description: "Operational exports",
        icon: BarChart3,
      },
    ],
  },
] as const;

export const adminSecurityNavigationItem: AdminNavigationItem = {
  href: "/admin/security",
  label: "Security",
  description: "MFA and access protection",
  icon: LockKeyhole,
};

export function isAdminNavigationItemActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function findAdminNavigationItem(pathname: string) {
  const items = adminNavigation.flatMap((group) => group.items);
  return items.find((item) => isAdminNavigationItemActive(pathname, item.href));
}

export function findAdminNavigationGroup(pathname: string) {
  return adminNavigation.find((group) =>
    group.items.some((item) => isAdminNavigationItemActive(pathname, item.href)),
  );
}
