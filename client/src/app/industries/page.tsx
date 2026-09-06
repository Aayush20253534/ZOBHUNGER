import Link from "next/link";
import { PageShell } from "@/components/common/PageShell";
import { industries } from "@/data/industries";

export default function Page() {
  return (
    <PageShell title="Industries We Serve">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {industries.map((item) => <li key={item.slug}><Link href={`/industries/${item.slug}`}>{item.title}</Link></li>)}
      </ul>
    </PageShell>
  );
}
