import { BusinessAccess } from "@/components/business/BusinessAccess";
export const metadata = { title: "Set your business password", robots: { index: false, follow: false } };
export default function Page() { return <BusinessAccess mode="change" />; }
