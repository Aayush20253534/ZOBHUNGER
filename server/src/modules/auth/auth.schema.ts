import { z } from "zod";

const passwordSchema = z.string().min(8).max(128).regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[a-z]/, "Password must contain a lowercase letter").regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  phone: z.string().trim().min(8).max(20).optional(),
  password: passwordSchema,
  role: z.enum(["BUSINESS", "WORKER"]),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;
