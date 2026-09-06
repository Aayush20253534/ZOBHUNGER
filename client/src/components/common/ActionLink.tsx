import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ActionLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "light" | "text";
};

export function ActionLink({
  variant = "primary",
  className,
  ...props
}: ActionLinkProps) {
  return (
    <Link
      data-variant={variant}
      className={cn("zb-action-link", className)}
      {...props}
    />
  );
}
