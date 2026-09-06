"use client";

import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean;
  loadingLabel?: string;
};

export function ActionButton({
  children,
  className,
  disabled,
  loading = false,
  loadingLabel = "Please wait",
  type = "button",
  variant = "default",
  ...props
}: ActionButtonProps) {
  return (
    <Button
      {...props}
      type={type}
      variant={variant}
      data-variant={variant}
      className={cn("zb-button", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && (
        <LoaderCircle className="zb-spin size-4" aria-hidden="true" />
      )}
      {loading ? loadingLabel : children}
    </Button>
  );
}
