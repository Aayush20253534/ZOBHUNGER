import { z } from "zod";

export const clientErrorSchema = z.object({
  source: z.string().trim().min(2).max(120),
  message: z.string().trim().min(1).max(800),
  path: z.string().trim().max(300).optional(),
  digest: z.string().trim().max(160).optional(),
  release: z.string().trim().max(100).optional(),
}).strict();

export type ClientErrorInput = z.infer<typeof clientErrorSchema>;
