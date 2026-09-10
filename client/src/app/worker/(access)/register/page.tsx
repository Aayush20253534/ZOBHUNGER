import { redirect } from "next/navigation";

export const metadata = {
  title: "Submit Your Worker Profile",
  robots: { index: false, follow: true },
};

export default function Page() {
  redirect("/careers/apply");
}
