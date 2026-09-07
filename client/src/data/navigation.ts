export type NavigationGroup = "solutions" | "industries" | "partners";

export interface NavigationItem {
  label: string;
  href: string;
  group?: NavigationGroup;
}


export const partnerNavigation = [
  {
    label: "Independent Business Partner",
    href: "/become-a-partner",
    description: "Collaborate with ZOBHUNGER as an independent business partner.",
  },
  {
    label: "Placement Cell Partnership",
    href: "/placement-cell-partnership",
    description: "Onboard your Placement Cell and connect students with opportunities.",
  },
  {
    label: "College & Institution Partnership",
    href: "/placement-cell-partnership#institution-partners",
    description: "Partnership access for colleges, universities and training institutes.",
  },
] as const;

export const navigation: readonly NavigationItem[] = [
  { label: "Solutions", href: "/solutions", group: "solutions" },
  { label: "Industries", href: "/industries", group: "industries" },
  { label: "For Business", href: "/for-business" },
  { label: "For Workers", href: "/for-workers" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function isCurrentPath(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
