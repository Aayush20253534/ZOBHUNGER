import type { Metadata } from "next";
import { VendorLanding } from "@/components/vendors/VendorLanding";
export const metadata: Metadata = { title: "Vendor empanelment" };
export default function Page() { return <VendorLanding workspace />; }
