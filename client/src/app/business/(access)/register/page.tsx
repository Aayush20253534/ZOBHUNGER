import { redirect } from "next/navigation";
export const metadata = { title: "Apply for business access", robots: { index: false, follow: false } };
export default function Page() { redirect("/become-a-partner#partner-application"); }
