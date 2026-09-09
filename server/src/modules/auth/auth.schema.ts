import { z } from "zod";

export const passwordSchema = z.string().min(8).max(128).regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[a-z]/, "Password must contain a lowercase letter").regex(/[0-9]/, "Password must contain a number");

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

export const businessLoginSchema = z.object({
  identifier: z.string().trim().min(1).max(254).optional(),
  email: z.string().trim().email().max(254).optional(),
  password: z.string().min(1).max(128),
}).strict().refine(value => Boolean(value.identifier) !== Boolean(value.email), "Enter your Partner ID or email")
  .transform(value => ({ identifier: value.identifier ?? value.email!, password: value.password }));
export type BusinessLoginInput = z.infer<typeof businessLoginSchema>;

export const changeBusinessPasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  password: passwordSchema,
}).strict();
