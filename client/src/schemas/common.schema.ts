import { z } from "zod";
import { solutions, workforceSolutions } from "@/data/solutions";

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number.")
  .max(24, "Enter a valid phone number.")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return (
      /^[+()\d\s-]+$/.test(value) && digits.length >= 7 && digits.length <= 15
    );
  }, "Enter a valid phone number.");

export const serviceSchema = z
  .string()
  .refine(
    (value) => solutions.some((solution) => solution.slug === value),
    "Choose a service.",
  );

export const workforceServiceSchema = z
  .string()
  .refine(
    (value) => workforceSolutions.some((solution) => solution.slug === value),
    "Choose a workforce or execution service.",
  );

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254);
