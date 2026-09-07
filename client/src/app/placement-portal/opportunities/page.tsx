import "@/styles/portal.css";
import type { Metadata } from "next";
import { PlacementOpportunities } from "@/components/placement/PlacementOpportunities";
export const metadata: Metadata = { title: "Placement Cell Opportunities | ZOBHUNGER", description: "View jobs, internships and flexible opportunities for your institution's candidates." };
export default function Page(){return <main className="zb-placement-portal-page"><PlacementOpportunities/></main>}
