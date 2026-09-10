import { solutionRoutePrefixes } from "@/data/solutions";

export interface NavigationItem {
  label: string;
  href: string;
  activePrefixes?: readonly string[];
}

export const navigation: readonly NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Our Services",
    href: "/solutions",
    activePrefixes: ["/solutions", ...solutionRoutePrefixes],
  },
  { label: "Presence", href: "/presence" },
  {
    label: "Blog",
    href: "/blogs",
    activePrefixes: ["/blogs", "/blog"],
  },
  { label: "Contact", href: "/contact" },
];

export function isCurrentPath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function isNavigationItemActive(
  pathname: string,
  item: NavigationItem,
) {
  if (isCurrentPath(pathname, item.href)) return true;
  return Boolean(
    item.activePrefixes?.some((prefix) => isCurrentPath(pathname, prefix)),
  );
}
