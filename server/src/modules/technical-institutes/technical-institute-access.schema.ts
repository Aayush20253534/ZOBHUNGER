import { z } from "zod";

export const activateTechnicalInstituteSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: z.string().min(10).max(128),
});

export type ActivateTechnicalInstituteInput = z.infer<typeof activateTechnicalInstituteSchema>;
