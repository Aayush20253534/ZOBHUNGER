import { z } from "zod";
import { calendarDate } from "../attendance/attendance.schema.js";
import { istToday } from "../attendance/attendance.utils.js";

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const page = z.coerce.number().int().min(1).max(100000).default(1);
const query = z.string().trim().max(100).default("");
const date = calendarDate.default(() => istToday());
export const deploymentParams = z.object({ id });
export const rosterQuerySchema = z.object({ date, page, query, location: query, requirementId: id.optional(),
  status: z.enum(["ALL", "ACTIVE", "UPCOMING", "ENDED", "CANCELLED"]).default("ALL"),
  view: z.enum(["roster", "locations", "schedule"]).default("roster"),
}).strict();
export const progressQuerySchema = z.object({ date, page, query, requirementId: id.optional(),
  scope: z.enum(["OPEN", "CLOSED", "ALL"]).default("OPEN"),
}).strict();
export const deploymentDetailSchema = z.object({ date, historyPage: page }).strict();
export type RosterQuery = z.infer<typeof rosterQuerySchema>;
export type ProgressQuery = z.infer<typeof progressQuerySchema>;
