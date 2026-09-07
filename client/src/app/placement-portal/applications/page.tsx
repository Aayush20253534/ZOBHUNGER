import "@/styles/portal.css";
import type { Metadata } from "next";
import { PlacementApplications } from "@/components/placement/PlacementApplications";
export const metadata: Metadata = { title: "Institution Partner Applications | ZOBHUNGER", description: "Track candidate applications submitted through the ZOBHUNGER Institution Partner Portal." };
export default function Page(){return <main className="zb-placement-portal-page"><PlacementApplications/></main>}
