import { industries } from "@/data/industries";
import { solutions } from "@/data/solutions";

export type FormSearchParams = Record<string, string | string[] | undefined>;

/** Repeated or unknown query values never become form defaults. */
export function getFormSelection(query: FormSearchParams = {}) {
  return {
    serviceRequired:
      typeof query.service === "string"
        ? (solutions.find((item) => item.slug === query.service)?.slug ?? "")
        : "",
    industry:
      typeof query.industry === "string"
        ? (industries.find((item) => item.slug === query.industry)?.slug ?? "")
        : "",
  };
}
