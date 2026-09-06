export type NavigationGroup = "solutions" | "industries";

export interface NavigationItem {
  label: string;
  href: string;
  group?: NavigationGroup;
}

export const navigation: readonly NavigationItem[] = [
  { label: "Solutions", href: "/solutions", group: "solutions" },
  { label: "Industries", href: "/industries", group: "industries" },
  { label: "Technology", href: "/technology" },
  { label: "Blogs", href: "/blogs" },
  { label: "For Business", href: "/for-business" },
  { label: "For Workers", href: "/for-workers" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function isCurrentPath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
