import type { LucideIcon } from "lucide-react";
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
  Handshake,
  IdCard,
  LayoutDashboard,
  LockKeyhole,
  UsersRound,
  UserRoundCheck,
} from "lucide-react";

export interface AdminNavigationItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
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
        label: "Overview",
        description: "Live operations summary",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "People & access",
    items: [
      {
        href: "/admin/partners",
        label: "Partner approvals",
        description: "Review access requests",
        icon: Handshake,
      },
      {
        href: "/admin/vendors",
        label: "Vendor network",
        description: "Empanelment and records",
        icon: Building2,
      },
      {
        href: "/admin/careers",
        label: "Career profiles",
        description: "Applicant review desk",
        icon: UserRoundCheck,
      },
      {
        href: "/admin/employee-joining",
        label: "Employee joining",
        description: "HR records and offers",
        icon: IdCard,
      },
      {
        href: "/admin/worker-applications",
        label: "Worker applications",
        description: "Worker profile pipeline",
        icon: UsersRound,
      },
      {
        href: "/admin/candidate-management",
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
        label: "Hiring briefs",
        description: "Requirements and openings",
        icon: ClipboardList,
      },
      {
        href: "/admin/deployments",
        label: "Deployments",
        description: "Assignments and rosters",
        icon: BriefcaseBusiness,
      },
      {
        href: "/admin/attendance",
        label: "Attendance",
        description: "Official work records",
        icon: CalendarCheck2,
      },
      {
        href: "/admin/worker-attendance",
        label: "Attendance requests",
        description: "Worker submissions",
        icon: Activity,
      },
      {
        href: "/admin/attendance-approvals",
        label: "Approval history",
        description: "Business decisions",
        icon: FileCheck2,
      },
    ],
  },
  {
    label: "Finance & reporting",
    items: [
      {
        href: "/admin/earnings",
        label: "Earnings & payments",
        description: "Statements and payouts",
        icon: BadgeIndianRupee,
      },
      {
        href: "/admin/reports",
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
  return items.find((item) => isAdminNavigationItemActive(pathname, item.href)) ?? items[0];
}

export function findAdminNavigationGroup(pathname: string) {
  return adminNavigation.find((group) =>
    group.items.some((item) => isAdminNavigationItemActive(pathname, item.href)),
  ) ?? adminNavigation[0];
}
