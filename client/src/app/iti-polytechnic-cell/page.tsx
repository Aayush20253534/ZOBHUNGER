import { TechnicalInstituteCell } from "@/components/technical-institutes/TechnicalInstituteCell";
import { getPageMetadata } from "@/lib/page-metadata";

export const metadata = getPageMetadata(
  "ITI & Polytechnic College Cell | Technical Talent Partnerships",
  "Partner ITIs and Polytechnic colleges with ZOBHUNGER for technical hiring, jobs, internships, apprenticeships and training opportunities.",
  "/iti-polytechnic-cell",
);

export default function Page() {
  return <TechnicalInstituteCell />;
}
