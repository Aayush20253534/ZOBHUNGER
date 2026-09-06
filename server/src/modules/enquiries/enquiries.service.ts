import type { CreateEnquiryInput } from "./enquiries.schema.js";
import { createEnquiry } from "./enquiries.repository.js";

export async function submitEnquiry(input: CreateEnquiryInput) {
  return createEnquiry(input);
}
