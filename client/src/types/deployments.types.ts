import type { Assignment, Paged } from "./attendance.types";
import type { CandidateRequirement } from "./business-candidates.types";

export const deploymentStates = ["ACTIVE", "UPCOMING", "ENDED", "CANCELLED"] as const;
export type DeploymentState = typeof deploymentStates[number];
export type DeploymentView = "roster" | "locations" | "schedule";
export interface ScheduleDay { date: string; state: "WORKING" | "OFF" | "OUTSIDE" | "CANCELLED"; startAt: string | null; endAt: string | null }
export interface RosterAssignment extends Assignment { state: DeploymentState; schedule: ScheduleDay[] }
export interface DeploymentQuery { date: string; page: number; query: string; location: string; status: DeploymentState | "ALL"; view: DeploymentView; requirementId?: string }
export interface DeploymentRoster extends Paged<RosterAssignment> {
  counts: Record<DeploymentState, number>; pageSize: number; date: string; today: string; dates: string[];
  activeSites: number; workingOnDate: number; endingSoon: number; requirement: CandidateRequirement | null;
}
export interface DeploymentProgress {
  requirement: CandidateRequirement & { workforceCount: number; locations: string[]; expectedStartAt: string | null; projectDuration: string; createdAt: string };
  selected: number; awaitingAssignment: number; active: number; upcoming: number; ended: number; cancelled: number; activeSites: number; remaining: number; overTarget: number; coverage: number | null;
}
export interface ProgressQuery { date: string; page: number; query: string; scope: "OPEN" | "CLOSED" | "ALL"; requirementId?: string }
export interface ProgressList extends Paged<DeploymentProgress> { date: string; pageSize: number }
export interface DeploymentDetail {
  assignment: Assignment; state: DeploymentState; date: string; today: string; dates: string[]; schedule: ScheduleDay[];
  skills: string[]; candidateVisible: boolean; settingsLocked: boolean;
  history: Paged<{ id: string; label: string; createdAt: string; note: string | null; endDate: string | null }>;
}
