import { ActionLink } from "@/components/common/ActionLink";

export function CTASection({
  title = "What does your business need next?",
  description = "Share your workforce or execution requirement with our team.",
  href = "/hire-workforce",
  label = "Share your requirement",
}: {
  title?: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <section className="zb-cta">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <ActionLink href={href} variant="light">
        {label}
      </ActionLink>
    </section>
  );
}
