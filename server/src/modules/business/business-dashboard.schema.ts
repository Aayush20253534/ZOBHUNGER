import { z } from "zod";

export const dashboardQuerySchema = z.object({
  range: z.enum(["7", "30", "90"]).default("30").transform(Number),
  status: z.enum(["ALL", "NEW", "CONTACTED", "QUALIFIED", "CLOSED"]).default("ALL"),
  page: z.string().regex(/^[1-9]\d{0,4}$/).default("1").transform(Number)
    .refine(value => value <= 10000, "Page must not exceed 10000"),
}).strict();

export const requirementIdSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
}).strict();

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
