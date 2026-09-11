import type { AdminDepartment, AdminPermission } from "@/types/auth.types";

export interface AdminDepartmentExperience {
  label: string;
  shortLabel: string;
  eyebrow: string;
  headline: string;
  description: string;
  queueTitle: string;
  queueDescription: string;
  emptyQueueTitle: string;
  emptyQueueDescription: string;
}

export const adminDepartmentExperience: Record<AdminDepartment, AdminDepartmentExperience> = {
  MAIN_ADMIN: {
    label: "Main Administration",
    shortLabel: "Main Admin",
    eyebrow: "Operations overview",
    headline: "Keep the operation moving.",
    description: "Review incoming work, move people through the pipeline and keep every active assignment accountable.",
    queueTitle: "Review queue",
    queueDescription: "The latest records that may need an operations decision.",
    emptyQueueTitle: "No shared reviews are waiting",
    emptyQueueDescription: "New records will appear here as soon as an assigned workflow needs attention.",
  },
  HR: {
    label: "Career & HR",
    shortLabel: "HR",
    eyebrow: "People operations",
    headline: "Move every person to the right next step.",
    description: "Keep career intake, onboarding, hiring, deployment and workforce records moving through one controlled people-operations workspace.",
    queueTitle: "People review queue",
    queueDescription: "Hiring and workforce records that may need an HR decision.",
    emptyQueueTitle: "No people reviews are waiting",
    emptyQueueDescription: "New candidate, onboarding and workforce activity will surface here when action is required.",
  },
  TECHNICAL: {
    label: "Technical",
    shortLabel: "Technical",
    eyebrow: "Technical operations",
    headline: "Keep the digital operation controlled.",
    description: "Work only inside the technical and website areas assigned to your account, with security and access boundaries kept visible at every step.",
    queueTitle: "Technical review queue",
    queueDescription: "Assigned technical work will appear here when a connected workflow needs review.",
    emptyQueueTitle: "No technical reviews are waiting",
    emptyQueueDescription: "Your workspace is clear. Newly assigned technical records will appear automatically when they require action.",
  },
  PLACEMENT_CELL: {
    label: "Placement Cell",
    shortLabel: "Placement",
    eyebrow: "Institution operations",
    headline: "Turn institution requests into accountable partnerships.",
    description: "Review institution onboarding from one controlled workspace and keep each partnership decision traceable from submission to approval.",
    queueTitle: "Institution review queue",
    queueDescription: "Institution submissions that may need a placement decision.",
    emptyQueueTitle: "No institution reviews are waiting",
    emptyQueueDescription: "New institution partnership submissions will surface here automatically when they arrive.",
  },
  LEGAL: {
    label: "Legal",
    shortLabel: "Legal",
    eyebrow: "Legal operations",
    headline: "Keep legal work controlled and traceable.",
    description: "Work within the legal and compliance scope assigned to your account while keeping access boundaries and security state explicit.",
    queueTitle: "Legal review queue",
    queueDescription: "Assigned legal and compliance records will appear here when a connected workflow needs review.",
    emptyQueueTitle: "No legal reviews are waiting",
    emptyQueueDescription: "Your workspace is clear. Newly assigned legal records will appear automatically when they require action.",
  },
};

export const adminPermissionLabels: Partial<Record<AdminPermission, string>> = {
  DASHBOARD_VIEW: "Overview",
  ENQUIRIES_MANAGE: "Website enquiries",
  PARTNERS_MANAGE: "Partner approvals",
  VENDORS_MANAGE: "Vendor network",
  CAREERS_MANAGE: "Career profiles",
  EMPLOYEE_JOINING_MANAGE: "Employee joining",
  WORKERS_MANAGE: "Worker applications",
  CANDIDATES_MANAGE: "Candidate sharing",
  REQUIREMENTS_MANAGE: "Hiring briefs",
  JOBS_MANAGE: "Job openings",
  APPLICATIONS_MANAGE: "Applications",
  DEPLOYMENTS_MANAGE: "Deployments",
  ATTENDANCE_MANAGE: "Attendance",
  EARNINGS_MANAGE: "Earnings & payments",
  REPORTS_VIEW: "Reports",
  PLACEMENT_MANAGE: "Placement Cell",
  TECHNICAL_MANAGE: "Technical requests",
  LEGAL_MANAGE: "Legal requests",
  BLOGS_MANAGE: "Website content",
  ADMIN_USERS_MANAGE: "Admin access",
};

export function adminDepartmentLabel(department?: AdminDepartment | null) {
  return department ? adminDepartmentExperience[department].label : "Administrator";
}

export function adminDepartmentProfile(department?: AdminDepartment | null) {
  return adminDepartmentExperience[department ?? "MAIN_ADMIN"];
}
