export function workerDestination(value: unknown) {
  if (typeof value !== "string") return "/worker/profile";
  if (["/worker", "/worker/jobs", "/worker/profile", "/worker/saved-jobs"].includes(value)) return value;
  if (/^\/worker\/jobs\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,179}$/.test(value)) return value;
  if (/^\/jobs\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,179}$/.test(value)) return `/worker${value}`;
  return "/worker/profile";
}
export function workerAccessHref(path: "login" | "register" | "verify" | "forgot-password", next?: string) {
  return `/worker/${path}?${new URLSearchParams({ next: workerDestination(next) })}`;
}
