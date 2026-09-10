export function workerDestination(value: unknown) {
  if (typeof value !== "string") return "/worker";
  if (["/worker", "/worker/jobs", "/worker/profile", "/worker/saved-jobs", "/worker/applications", "/worker/assignments", "/worker/attendance", "/worker/earnings"].includes(value)) return value;
  if (/^\/worker\/jobs\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,179}(?:\/apply)?$/.test(value)) return value;
  if (/^\/worker\/(applications|assignments|earnings)\/[a-zA-Z0-9_-]{1,64}$/.test(value)) return value;
  if (/^\/jobs\/[a-zA-Z0-9][a-zA-Z0-9_-]{0,179}$/.test(value)) return `/worker${value}`;
  // Keep malformed or untrusted destinations inside the worker onboarding flow.
  return "/worker/profile";
}
export function workerAccessHref(path: "login" | "verify" | "forgot-password", next?: string) {
  return `/worker/${path}?${new URLSearchParams({ next: workerDestination(next) })}`;
}
