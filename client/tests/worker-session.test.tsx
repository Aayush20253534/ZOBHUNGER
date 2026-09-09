import { act, createElement, useEffect, useState, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import type { WorkerProfileResult } from "@/types/worker.types";
import { WorkerProvider, useWorker } from "@/components/worker/WorkerProvider";

const { getWorkspace, replace, logout, router } = vi.hoisted(() => {
  const replace = vi.fn();
  return { getWorkspace: vi.fn(), replace, logout: vi.fn(), router: { replace, refresh: vi.fn() } };
});
vi.mock("next/navigation", () => ({ usePathname: () => "/worker/profile", useRouter: () => router }));
vi.mock("next/link", () => ({ default: (props: ComponentProps<"a">) => createElement("a", props) }));
vi.mock("@/services/worker.service", () => ({ getWorkerWorkspace: getWorkspace }));
vi.mock("@/services/auth.service", () => ({ logout }));

let updateLastProfile: (data: WorkerProfileResult) => void;
function ProfileDraft() {
  const [brief, setBrief] = useState("Unfinished worker profile");
  const { notice, refresh, signOut, updateProfile, completion } = useWorker();
  useEffect(() => { updateLastProfile = updateProfile; }, [updateProfile]);
  return <div><input value={brief} onChange={event => setBrief(event.target.value)} /><p>{notice}</p><span data-completion>{completion.percent}</span><button onClick={refresh}>Refresh</button><button onClick={() => { void signOut(); }}>Sign out</button></div>;
}
const ready = { data: { user: { id: "worker-a", email: "worker@example.test", role: "WORKER", emailVerifiedAt: "2026-01-01T00:00:00Z" }, profile: null, completion: { percent: 0, checklist: [] } } };
let root: Root, container: HTMLDivElement;
const flush = async (action?: () => void) => { await act(async () => { action?.(); await new Promise(resolve => setTimeout(resolve, 0)); }); };
const focus = () => flush(() => window.dispatchEvent(new Event("focus")));
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); getWorkspace.mockReset().mockResolvedValue(ready); logout.mockReset().mockResolvedValue(undefined); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function open() { await flush(() => root.render(<WorkerProvider><ProfileDraft /></WorkerProvider>)); }

describe("worker session and in-memory profile safety", () => {
  it.each([new TypeError("Offline"), new ApiError("Unavailable", 503), new ApiError("Slow down", 429)])("keeps an unfinished form and selection across temporary failures", async failure => {
    await open(); const input = container.querySelector("input")!; input.focus(); input.setSelectionRange(3, 7);
    getWorkspace.mockRejectedValueOnce(failure); await focus();
    expect(container.querySelector("input")).toBe(input); expect(input.value).toBe("Unfinished worker profile"); expect(input.selectionStart).toBe(3); expect(container.textContent).toContain("last loaded workspace");
    await flush(() => container.querySelector("button")!.click()); expect(container.querySelector("input")).toBe(input); expect(container.textContent).not.toContain("Connection interrupted");
  });
  it("clears private content on session expiry and retains a safe return destination", async () => {
    await open(); getWorkspace.mockRejectedValueOnce(new ApiError("Expired", 401)); await focus();
    expect(container.querySelector("input")).toBeNull(); expect(replace).toHaveBeenCalledWith("/worker/login?next=%2Fworker%2Fprofile");
  });
  it("routes unverified workers to verification and rejects another role", async () => {
    getWorkspace.mockResolvedValueOnce({ data: { ...ready.data, user: { ...ready.data.user, emailVerifiedAt: null } } }); await open();
    expect(container.querySelector("input")).toBeNull(); expect(replace).toHaveBeenCalledWith("/worker/verify?next=%2Fworker%2Fprofile");
    getWorkspace.mockResolvedValueOnce({ data: { ...ready.data, user: { ...ready.data.user, role: "BUSINESS" } } }); await focus();
    expect(container.querySelector("input")).toBeNull(); expect(container.textContent).toContain("Use a worker account");
  });
  it("discards the previous account's form when another worker signs in", async () => {
    await open(); const old = container.querySelector("input");
    getWorkspace.mockResolvedValueOnce({ data: { ...ready.data, user: { ...ready.data.user, id: "worker-b" } } }); await focus();
    expect(container.querySelector("input")).not.toBe(old); expect(old?.isConnected).toBe(false);
  });
  it("ignores a late profile write response belonging to the previous account", async () => {
    await open(); const finishOldSave = updateLastProfile;
    getWorkspace.mockResolvedValueOnce({ data: { ...ready.data, user: { ...ready.data.user, id: "worker-b" } } }); await focus();
    await flush(() => finishOldSave({ profile: null, completion: { percent: 100, checklist: [] } }));
    expect(container.querySelector("[data-completion]")!.textContent).toBe("0");
  });

  it("does not invent offline profile data and stops retrying missing routes on focus", async () => {
    getWorkspace.mockRejectedValue(new ApiError("Missing", 404)); await open(); const calls = getWorkspace.mock.calls.length; await focus(); await focus();
    expect(getWorkspace).toHaveBeenCalledTimes(calls); expect(container.querySelector("input")).toBeNull();
    getWorkspace.mockResolvedValue(ready); await flush(() => container.querySelector("button")!.click()); expect(container.querySelector("input")).not.toBeNull();
  });
  it("ignores a late successful refresh after sign-out", async () => {
    await open(); let resolve!: (value: typeof ready) => void; getWorkspace.mockReturnValueOnce(new Promise(done => { resolve = done; })); await focus();
    await flush(() => container.querySelectorAll("button")[1].click()); await flush(() => resolve(ready));
    expect(container.querySelector("input")).toBeNull(); expect(replace).toHaveBeenCalledWith("/worker/login");
  });
});
