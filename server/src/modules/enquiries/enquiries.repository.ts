import { prisma } from "../../config/db.js";
import type { CreateEnquiryInput } from "./enquiries.schema.js";

export function createEnquiry(data: CreateEnquiryInput) {
  return prisma.contactEnquiry.create({ data });
}
