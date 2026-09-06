import { z } from "zod";
import { requirementSchema } from "@/schemas/requirement.schema";

// Field arrays need stable row identities. The form uses objects; the existing
// service contract receives its original string[] location payload.
export const requirementFormSchema = requirementSchema
  .omit({ locations: true })
  .extend({
    locations: z
      .array(z.object({ name: requirementSchema.shape.locations.element }))
      .min(1, "Add at least one location.")
      .max(50, "Use up to 50 locations."),
  })
  .transform(({ locations, ...values }) => ({
    ...values,
    locations: locations.map((location) => location.name),
  }));

export type RequirementFormValues = z.input<typeof requirementFormSchema>;
