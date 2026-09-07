import "@/styles/portal.css";
import type { Metadata } from "next";
import { PlacementApplications } from "@/components/placement/PlacementApplications";
export const metadata: Metadata = { title: "Placement Cell Applications | ZOBHUNGER", description: "Track candidate applications submitted through the ZOBHUNGER Placement Cell Portal." };
export default function Page(){return <main className="zb-placement-portal-page"><PlacementApplications/></main>}
