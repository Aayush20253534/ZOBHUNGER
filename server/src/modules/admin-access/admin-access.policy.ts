import { AdminDepartment, AdminPermission } from "../../generated/prisma/client.js";

export const ALL_ADMIN_PERMISSIONS = Object.values(AdminPermission) as AdminPermission[];

export const MANAGED_ADMIN_DEPARTMENTS = [
  AdminDepartment.HR,
  AdminDepartment.PF_EPFO,
  AdminDepartment.ESIC,
  AdminDepartment.ACCOUNTS,
  AdminDepartment.TECHNICAL,
  AdminDepartment.PLACEMENT_CELL,
  AdminDepartment.LEGAL,
] as const;

export const DEPARTMENT_LABELS: Record<AdminDepartment, string> = {
  [AdminDepartment.MAIN_ADMIN]: "Main Administration",
  [AdminDepartment.HR]: "Career & HR",
  [AdminDepartment.PF_EPFO]: "PF / EPFO",
  [AdminDepartment.ESIC]: "ESIC",
  [AdminDepartment.ACCOUNTS]: "Accounts",
  [AdminDepartment.TECHNICAL]: "Technical",
  [AdminDepartment.PLACEMENT_CELL]: "Placement Cell",
  [AdminDepartment.LEGAL]: "Legal",
};

export const PERMISSION_LABELS: Record<AdminPermission, { label: string; description: string }> = {
  [AdminPermission.DASHBOARD_VIEW]: { label: "Operations overview", description: "Open the department-aware admin overview." },
  [AdminPermission.ENQUIRIES_MANAGE]: { label: "Website enquiries", description: "Review and manage general website enquiries." },
  [AdminPermission.PARTNERS_MANAGE]: { label: "Partner approvals", description: "Review partner applications and controlled access." },
  [AdminPermission.VENDORS_MANAGE]: { label: "Vendor network", description: "Review vendor empanelment and vendor records." },
  [AdminPermission.CAREERS_MANAGE]: { label: "Career profiles", description: "Review career applications and applicant records." },
  [AdminPermission.EMPLOYEE_JOINING_MANAGE]: { label: "Employee joining", description: "Review employee joining records and offer workflows." },
  [AdminPermission.PF_VIEW]: { label: "PF / EPFO records", description: "View employee PF / EPFO compliance records." },
  [AdminPermission.PF_VERIFY]: { label: "PF / EPFO verification", description: "Review, request corrections and verify PF / EPFO records." },
  [AdminPermission.PF_UPDATE]: { label: "PF / EPFO updates", description: "Maintain department-controlled PF / EPFO information." },
  [AdminPermission.PF_EXPORT]: { label: "PF / EPFO exports", description: "Export PF / EPFO records in the approved Excel structure." },
  [AdminPermission.ESIC_VIEW]: { label: "ESIC records", description: "View employee ESIC compliance records and family details." },
  [AdminPermission.ESIC_VERIFY]: { label: "ESIC verification", description: "Review, request corrections and verify ESIC records." },
  [AdminPermission.ESIC_UPDATE]: { label: "ESIC updates", description: "Maintain department-controlled ESIC information." },
  [AdminPermission.ESIC_EXPORT]: { label: "ESIC exports", description: "Export ESIC employee and family records to Excel." },
  [AdminPermission.WORKERS_MANAGE]: { label: "Worker applications", description: "Review worker profiles and worker application records." },
  [AdminPermission.CANDIDATES_MANAGE]: { label: "Candidate sharing", description: "Manage candidates shared into business requirements." },
  [AdminPermission.REQUIREMENTS_MANAGE]: { label: "Hiring briefs", description: "Review and qualify workforce requirements." },
  [AdminPermission.JOBS_MANAGE]: { label: "Job openings", description: "Create, publish, close and manage linked openings." },
  [AdminPermission.APPLICATIONS_MANAGE]: { label: "Job applications", description: "Review applications attached to published jobs." },
  [AdminPermission.DEPLOYMENTS_MANAGE]: { label: "Deployments", description: "Manage assignments, rosters and deployment progress." },
  [AdminPermission.ATTENDANCE_MANAGE]: { label: "Attendance", description: "Manage attendance records, requests and approval history." },
  [AdminPermission.EARNINGS_MANAGE]: { label: "Earnings & payments", description: "Manage worker earnings statements and payment records." },
  [AdminPermission.REPORTS_VIEW]: { label: "Reports", description: "View and export operational reports." },
  [AdminPermission.PLACEMENT_MANAGE]: { label: "Placement Cell", description: "Manage institution onboarding and placement workflows." },
  [AdminPermission.TECHNICAL_MANAGE]: { label: "Technical requests", description: "Manage technical department requests and records." },
  [AdminPermission.LEGAL_MANAGE]: { label: "Legal requests", description: "Manage legal, privacy and compliance requests." },
  [AdminPermission.BLOGS_MANAGE]: { label: "Website content", description: "Manage website article and blog publishing workflows." },
  [AdminPermission.ADMIN_USERS_MANAGE]: { label: "Administrator access", description: "Create department administrators and manage access policy." },
  [AdminPermission.AI_ASSISTANT_MANAGE]: { label: "AI assistant", description: "Manage verified chatbot knowledge, leads, handovers and analytics." },
};

export const DEPARTMENT_PERMISSION_PRESETS: Record<AdminDepartment, AdminPermission[]> = {
  [AdminDepartment.MAIN_ADMIN]: ALL_ADMIN_PERMISSIONS,
  [AdminDepartment.HR]: [
    AdminPermission.DASHBOARD_VIEW,
    AdminPermission.CAREERS_MANAGE,
    AdminPermission.EMPLOYEE_JOINING_MANAGE,
    AdminPermission.WORKERS_MANAGE,
    AdminPermission.CANDIDATES_MANAGE,
    AdminPermission.REQUIREMENTS_MANAGE,
    AdminPermission.JOBS_MANAGE,
    AdminPermission.APPLICATIONS_MANAGE,
    AdminPermission.DEPLOYMENTS_MANAGE,
    AdminPermission.ATTENDANCE_MANAGE,
    AdminPermission.EARNINGS_MANAGE,
    AdminPermission.REPORTS_VIEW,
  ],
  [AdminDepartment.PF_EPFO]: [
    AdminPermission.DASHBOARD_VIEW,
    AdminPermission.PF_VIEW,
    AdminPermission.PF_VERIFY,
    AdminPermission.PF_UPDATE,
    AdminPermission.PF_EXPORT,
  ],
  [AdminDepartment.ESIC]: [
    AdminPermission.DASHBOARD_VIEW,
    AdminPermission.ESIC_VIEW,
    AdminPermission.ESIC_VERIFY,
    AdminPermission.ESIC_UPDATE,
    AdminPermission.ESIC_EXPORT,
  ],
  [AdminDepartment.ACCOUNTS]: [
    AdminPermission.DASHBOARD_VIEW,
    AdminPermission.REPORTS_VIEW,
  ],
  [AdminDepartment.TECHNICAL]: [
    AdminPermission.DASHBOARD_VIEW,
    AdminPermission.TECHNICAL_MANAGE,
    AdminPermission.BLOGS_MANAGE,
    AdminPermission.AI_ASSISTANT_MANAGE,
  ],
  [AdminDepartment.PLACEMENT_CELL]: [
    AdminPermission.DASHBOARD_VIEW,
    AdminPermission.PLACEMENT_MANAGE,
  ],
  [AdminDepartment.LEGAL]: [
    AdminPermission.DASHBOARD_VIEW,
    AdminPermission.LEGAL_MANAGE,
  ],
};

export function allowedPermissionsForDepartment(department: AdminDepartment) {
  return new Set(DEPARTMENT_PERMISSION_PRESETS[department]);
}

export function normalizeDepartmentPermissions(department: AdminDepartment, requested?: AdminPermission[]) {
  if (department === AdminDepartment.MAIN_ADMIN) return [...ALL_ADMIN_PERMISSIONS];
  const allowed = allowedPermissionsForDepartment(department);
  const source = requested?.length ? requested : DEPARTMENT_PERMISSION_PRESETS[department];
  const normalized = [...new Set(source)].filter(permission => allowed.has(permission));
  if (!normalized.includes(AdminPermission.DASHBOARD_VIEW)) normalized.unshift(AdminPermission.DASHBOARD_VIEW);
  return normalized;
}
