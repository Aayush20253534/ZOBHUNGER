import type { z } from "zod";
import type { enquirySchema } from "@/schemas/enquiry.schema";

export type EnquiryInput = z.infer<typeof enquirySchema>;
