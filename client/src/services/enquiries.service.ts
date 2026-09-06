import { enquirySchema } from "@/schemas/enquiry.schema";
import { getDataAdapter } from "@/services/adapters";
import type { DataRequestOptions } from "@/types/data.types";
import type { EnquiryInput } from "@/types/enquiry.types";

export function submitEnquiry(
  input: EnquiryInput,
  options?: DataRequestOptions,
) {
  return getDataAdapter().submitEnquiry(enquirySchema.parse(input), options);
}
