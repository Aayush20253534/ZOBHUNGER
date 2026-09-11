import type { Request, RequestHandler, Response } from "express";
import { apiSuccessResponse } from "../../utils/api-response.js";
import type { AdminDepartment } from "../../generated/prisma/client.js";
import { addIntakeNote, exportIntakeCases, getIntakeCase, listIntakeCases, updateIntakeCase, type IntakeActor } from "./intake.service.js";
import type { AddIntakeNoteInput, IntakeListQuery, UpdateIntakeCaseInput } from "./intake.schema.js";

function actor(res: Response): IntakeActor {
  const user = res.locals.authUser as { id: string; adminDepartment?: AdminDepartment | null };
  return { id: user.id, adminDepartment: user.adminDepartment ?? null };
}
function audit(req: Request) { return { ipAddress: req.ip, userAgent: req.get("user-agent")?.slice(0, 500) }; }

export const listIntakeController: RequestHandler = async (_req, res) => {
  res.json(apiSuccessResponse("Operational intake retrieved", await listIntakeCases(actor(res), res.locals.validated.query as IntakeListQuery)));
};
export const getIntakeController: RequestHandler = async (_req, res) => {
  res.json(apiSuccessResponse("Operational intake case retrieved", await getIntakeCase(actor(res), res.locals.validated.params.id)));
};
export const updateIntakeController: RequestHandler = async (req, res) => {
  res.json(apiSuccessResponse("Operational intake case updated", await updateIntakeCase(actor(res), res.locals.validated.params.id, res.locals.validated.body as UpdateIntakeCaseInput, audit(req))));
};
export const addIntakeNoteController: RequestHandler = async (req, res) => {
  res.status(201).json(apiSuccessResponse("Internal note added", await addIntakeNote(actor(res), res.locals.validated.params.id, res.locals.validated.body as AddIntakeNoteInput, audit(req))));
};
export const exportIntakeController: RequestHandler = async (_req, res) => {
  const csv = await exportIntakeCases(actor(res), res.locals.validated.query as IntakeListQuery);
  res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="zobhunger-intake-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
  res.status(200).send(`\uFEFF${csv}`);
};
