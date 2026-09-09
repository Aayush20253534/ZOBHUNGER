import { act, createElement, useState, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { BusinessProvider, useBusiness } from "@/components/business/BusinessProvider";

const { getWorkspace, replace, logout, router } = vi.hoisted(() => {
  const replace = vi.fn();
  return { getWorkspace: vi.fn(), replace, logout: vi.fn(), router: { replace, refresh: vi.fn() } };
});
vi.mock("next/navigation", () => ({ usePathname: () => "/business/requirements/new", useRouter: () => router }));
vi.mock("next/link", () => ({ default: (props: ComponentProps<"a">) => createElement("a", props) }));
vi.mock("@/services/business.service", () => ({ getBusinessWorkspace: getWorkspace, businessDestination: (path: string) => path }));
vi.mock("@/services/auth.service", () => ({ logout }));

// A real stateful child catches unmount/remount regressions; merely testing the
// error classification would miss the loss of an unfinished requirement.
function RequirementForm() {
  const [brief, setBrief] = useState("Unsubmitted client brief");
  const { connectionNotice, refreshWorkspace, signOut } = useBusiness();
  return <main>
    <input aria-label="Requirement brief" value={brief} onChange={event => setBrief(event.target.value)} />
    <p role="status">{connectionNotice}</p>
    <button onClick={refreshWorkspace}>Refresh workspace</button>
    <button onClick={() => { void signOut(); }}>Sign out</button>
  </main>;
}

const ready = { data: { user: { id: "approved-business", email: "owner@example.test", role: "BUSINESS" }, profile: null } };
let root: Root;
let container: HTMLDivElement;
const flush = async (action?: () => void) => { await act(async () => { action?.(); await new Promise(resolve => setTimeout(resolve, 0)); }); };
const focus = () => flush(() => window.dispatchEvent(new Event("focus")));

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  getWorkspace.mockReset().mockResolvedValue(ready);
  logout.mockReset().mockResolvedValue(undefined);
  container = document.createElement("div"); document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function open() { await flush(() => root.render(<BusinessProvider><RequirementForm /></BusinessProvider>)); }

describe("business workspace session", () => {
  it.each([
    ["network failure", new TypeError("Failed to fetch")],
    ["server outage", new ApiError("Unavailable", 503)],
    ["rate limit", new ApiError("Too many requests", 429)],
  ])("keeps the open form during a %s and recovers without remounting", async (_label, failure) => {
    await open();
    const input = container.querySelector("input")!;
    input.focus(); input.setSelectionRange(4, 9);
    getWorkspace.mockRejectedValueOnce(failure);
    await focus();
    expect(container.querySelector("input")).toBe(input);
    expect(input.value).toBe("Unsubmitted client brief");
    expect(input.selectionStart).toBe(4);
    expect(container.textContent).toContain("last loaded workspace");
    await flush(() => container.querySelector("button")!.click());
    expect(container.querySelector("input")).toBe(input);
    expect(container.textContent).not.toContain("Connection interrupted");
    expect(replace).not.toHaveBeenCalled();
  });

  it.each([
    [new ApiError("Expired", 401), "/business/login?next=%2Fbusiness%2Frequirements%2Fnew"],
    [new ApiError("Change password", 403, "PASSWORD_CHANGE_REQUIRED"), "/business/change-password"],
  ])("clears private content for an invalid session", async (failure, destination) => {
    await open(); getWorkspace.mockRejectedValueOnce(failure); await focus();
    expect(container.querySelector("input")).toBeNull();
    expect(replace).toHaveBeenCalledWith(destination);
  });

  it("clears private content when business approval is revoked", async () => {
    await open(); getWorkspace.mockRejectedValueOnce(new ApiError("Approval revoked", 403)); await focus();
    expect(container.querySelector("input")).toBeNull();
    expect(container.textContent).toContain("Business access only");
  });

  it("starts fresh forms when another business account signs in from a different tab", async () => {
    await open(); const previousInput = container.querySelector("input");
    getWorkspace.mockResolvedValueOnce({ data: { ...ready.data, user: { ...ready.data.user, id: "other-business", email: "other@example.test" } } });
    await focus();
    expect(container.querySelector("input")).not.toBeNull();
    expect(container.querySelector("input")).not.toBe(previousInput);
    expect(previousInput?.isConnected).toBe(false);
  });

  it("does not invent an offline workspace before authentication succeeds", async () => {
    getWorkspace.mockRejectedValue(new TypeError("Offline")); await open();
    expect(container.querySelector("input")).toBeNull();
    expect(container.textContent).toContain("Let's reconnect");
  });

  it("stops repeated focus requests when backend routes are missing", async () => {
    await open(); getWorkspace.mockRejectedValue(new ApiError("Deploy backend", 503, "BUSINESS_API_UNAVAILABLE"));
    await focus(); const calls = getWorkspace.mock.calls.length; await focus(); await focus();
    expect(getWorkspace).toHaveBeenCalledTimes(calls);
    expect(container.querySelector("input")).toBeNull();
    getWorkspace.mockResolvedValue(ready);
    await flush(() => container.querySelector("button")!.click());
    expect(container.querySelector("input")).not.toBeNull();
  });

  it("ignores a late successful refresh after sign out", async () => {
    await open();
    let resolve!: (value: typeof ready) => void;
    getWorkspace.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    await focus();
    await flush(() => container.querySelectorAll("button")[1].click());
    await flush(() => resolve(ready));
    expect(container.querySelector("input")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/business/login");
  });
});
