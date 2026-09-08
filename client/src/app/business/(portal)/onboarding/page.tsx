import { BusinessProfileForm } from "@/components/business/BusinessProfileForm";
import { BusinessHeading } from "@/components/business/BusinessUI";
export const metadata = { title: "Set up your company" };
export default function Page() { return <><BusinessHeading eyebrow="LET'S GET YOU STARTED" title="Introduce your business." copy="Three simple steps to make this workspace yours." /><BusinessProfileForm /></>; }
