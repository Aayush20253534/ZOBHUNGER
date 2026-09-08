import "@/styles/portal.css";
import type { Metadata } from "next";
import { PlacementOpportunities } from "@/components/placement/PlacementOpportunities";
export const metadata: Metadata = { title: "Institution Partner Opportunities", description: "View jobs, internships and flexible opportunities for your institution's candidates." };
export default function Page(){return <div className="zb-placement-portal-page"><PlacementOpportunities/></div>}
