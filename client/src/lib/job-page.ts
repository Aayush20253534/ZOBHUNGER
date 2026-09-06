import { cache } from "react";
import { getJobBySlug } from "@/services/jobs.service";

// Metadata and the page share the same read within one server render.
export const getJobForPage = cache(getJobBySlug);
