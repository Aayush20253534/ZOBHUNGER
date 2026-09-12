const PRIVATE_ROUTE_ROOTS = [
  "/admin",
  "/admin-access",
  "/business",
  "/worker",
  "/placement-portal",
  "/employee-joining",
  "/login",
  "/placement-cell-login",
] as const;

function normalizeRoute(value: string): string | null {
  const route = value.trim();
  if (!route.startsWith("/") || route.startsWith("//")) return null;
  if (/\s/.test(route) || /[?#]/.test(route)) return null;

  // Keep the root path intact, otherwise remove repeated trailing slashes so
  // policy checks are stable for values such as /business/ and /business.
  if (route === "/") return route;
  return route.replace(/\/+$/, "");
}

export function isPrivateChatbotRoute(value: string): boolean {
  const route = normalizeRoute(value);
  if (!route) return true;

  return PRIVATE_ROUTE_ROOTS.some(
    (root) => route === root || route.startsWith(`${root}/`),
  );
}

export function isPublicChatbotRoute(value: string): boolean {
  const route = normalizeRoute(value);
  return Boolean(route) && !isPrivateChatbotRoute(route!);
}

/**
 * Extract explicit site-relative paths from prose without treating ordinary
 * slash-separated words such as "company/business" as routes.
 */
export function extractSiteRelativePaths(source: string): string[] {
  const matches = source.matchAll(/(?<![A-Za-z0-9])\/[A-Za-z0-9][A-Za-z0-9._~-]*(?:\/[A-Za-z0-9][A-Za-z0-9._~-]*)*/g);
  const routes: string[] = [];
  const seen = new Set<string>();

  for (const match of matches) {
    const route = normalizeRoute(match[0]);
    if (!route || seen.has(route)) continue;
    seen.add(route);
    routes.push(route);
  }

  return routes;
}
