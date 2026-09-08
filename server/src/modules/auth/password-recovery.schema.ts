import { z } from "zod";
import { passwordSchema } from "./auth.schema.js";

export const requestRecoverySchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
}).strict();
export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "Invalid recovery link"),
  password: passwordSchema,
}).strict();
