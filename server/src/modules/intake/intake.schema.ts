import { z } from "zod";
import { AdminDepartment, IntakeCaseStatus, IntakeSourceType } from "../../generated/prisma/client.js";

const optionalTrimmed = (max: number) => z.string().trim().max(max).optional().transform(value => value || undefined);

export const intakeListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  query: optionalTrimmed(120),
  status: z.nativeEnum(IntakeCaseStatus).optional(),
  sourceType: z.nativeEnum(IntakeSourceType).optional(),
  department: z.nativeEnum(AdminDepartment).optional(),
  assignment: z.enum(["ALL", "MINE", "UNASSIGNED"]).default("ALL"),
});

export const intakeCaseParamsSchema = z.object({ id: z.string().trim().min(1).max(100) });

export const updateIntakeCaseSchema = z.object({
  status: z.nativeEnum(IntakeCaseStatus).optional(),
  department: z.nativeEnum(AdminDepartment).optional(),
  assignedAdminId: z.string().trim().min(1).max(100).nullable().optional(),
  expectedRevision: z.number().int().min(0),
}).refine(value => value.status !== undefined || value.department !== undefined || value.assignedAdminId !== undefined, "Choose a case update");

export const addIntakeNoteSchema = z.object({
  body: z.string().trim().min(2, "Add a useful internal note").max(3000),
  expectedRevision: z.number().int().min(0),
});

export type IntakeListQuery = z.infer<typeof intakeListQuerySchema>;
export type UpdateIntakeCaseInput = z.infer<typeof updateIntakeCaseSchema>;
export type AddIntakeNoteInput = z.infer<typeof addIntakeNoteSchema>;
