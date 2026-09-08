import "@/styles/portal.css";
import type { Metadata } from "next";
import { PlacementApplications } from "@/components/placement/PlacementApplications";
export const metadata: Metadata = { title: "Institution Partner Applications", description: "Track candidate applications submitted through the ZOBHUNGER Institution Partner Portal." };
export default function Page(){return <div className="zb-placement-portal-page"><PlacementApplications/></div>}
