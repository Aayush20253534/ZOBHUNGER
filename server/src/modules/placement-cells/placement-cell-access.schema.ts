import { z } from "zod";

export const activatePlacementCellSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: z.string().min(10).max(128),
});

export type ActivatePlacementCellInput = z.infer<typeof activatePlacementCellSchema>;
