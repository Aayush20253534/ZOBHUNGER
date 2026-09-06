import { ActionLink } from "@/components/common/ActionLink";
import { PageShell } from "@/components/common/PageShell";

export default function NotFound() {
  return (
    <div className="zb-editorial-status">
      <PageShell
        eyebrow="Guide unavailable"
        title="This guide isn’t available."
        description="The link may have changed, or the guide may no longer be published."
        actions={<ActionLink href="/blog">Explore all insights</ActionLink>}
      />
    </div>
  );
}
