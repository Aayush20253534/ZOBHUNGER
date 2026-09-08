"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

type PrefetchLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

/** Load a dynamic destination when someone shows interest in that specific link. */
export function PrefetchLink({
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: PrefetchLinkProps) {
  const [prefetchFullRoute, setPrefetchFullRoute] = useState(false);

  return (
    <Link
      {...props}
      prefetch={prefetchFullRoute ? true : null}
      onMouseEnter={(event) => {
        onMouseEnter?.(event);
        setPrefetchFullRoute(true);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        setPrefetchFullRoute(true);
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event);
        setPrefetchFullRoute(true);
      }}
    />
  );
}
