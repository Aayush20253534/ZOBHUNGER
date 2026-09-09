import { act, createElement, StrictMode, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkerAccess } from "@/components/worker/WorkerAccess";
import { workerDestination } from "@/lib/worker-navigation";

const state = vi.hoisted(() => ({ query: "", login: vi.fn(), verify: vi.fn(), register: vi.fn(), reset: vi.fn(), email: vi.fn(), workspace: vi.fn(), router: { replace: vi.fn(), refresh: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => state.router, useSearchParams: () => new URLSearchParams(state.query) }));
vi.mock("next/link", () => ({ default: (props: ComponentProps<"a">) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: (props: ComponentProps<"img"> & { priority?: boolean }) => { const imageProps = { ...props }; delete imageProps.priority; return createElement("img", imageProps); } }));
vi.mock("@/services/worker.service", () => ({ loginWorker: state.login, verifyWorkerEmail: state.verify, registerWorker: state.register, resetWorkerPassword: state.reset, requestWorkerEmail: state.email, getWorkerWorkspace: state.workspace }));
let root: Root, container: HTMLDivElement;
const flush = async (action?: () => void) => { await act(async () => { action?.(); await new Promise(resolve => setTimeout(resolve, 0)); }); };
async function input(selector: string, value: string) { await flush(() => { const field = container.querySelector<HTMLInputElement>(selector)!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, value); field.dispatchEvent(new Event("input", { bubbles: true })); }); }
const submit = () => flush(() => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); state.query = ""; state.workspace.mockReset().mockRejectedValue(new Error("Signed out")); state.verify.mockReset().mockResolvedValue({ data: { completed: true } }); state.login.mockReset().mockResolvedValue({ data: { user: { emailVerifiedAt: "2026-01-01" } } }); container = document.createElement("div"); document.body.append(container); root = createRoot(container); window.history.replaceState(null, "", "/worker/login"); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

describe("worker access screens", () => {
  it("preserves a one-use fragment through StrictMode, removes it from the URL and waits for confirmation", async () => {
    const token = "a".repeat(64); window.history.replaceState(null, "", `/worker/verify#token=${token}`);
    await flush(() => root.render(<StrictMode><WorkerAccess mode="verify" /></StrictMode>));
    expect(window.location.hash).toBe(""); expect(state.verify).not.toHaveBeenCalled(); expect(state.workspace).not.toHaveBeenCalled(); expect(container.textContent).toContain("Verify my email");
    await submit(); expect(state.verify).toHaveBeenCalledWith(token); expect(container.textContent).toContain("Your email is verified");
  });
  it("lets a signed-out person request a replacement for an incomplete verification link", async () => {
    window.history.replaceState(null, "", "/worker/verify#token=broken"); await flush(() => root.render(<WorkerAccess mode="verify" />));
    expect(container.textContent).toContain("This link is incomplete"); expect(container.querySelector('input[type="email"]')).not.toBeNull(); expect(state.verify).not.toHaveBeenCalled();
  });
  it("returns to the selected job after sign-in and prevents external redirects", async () => {
    state.query = "next=%2Fworker%2Fjobs%2Ffield-executive"; await flush(() => root.render(<WorkerAccess mode="login" />));
    await input('input[type="email"]', "worker@example.test"); await input('input[type="password"]', "WorkerReady123!"); await submit();
    expect(state.router.replace).toHaveBeenCalledWith("/worker/jobs/field-executive");
    for (const path of ["https://evil.example", "//evil.example", "/admin", "/worker/../admin", "/worker/jobs/%2fadmin", "/worker/jobs?next=evil"]) expect(workerDestination(path)).toBe("/worker/profile");
  });
  it("keeps an unverified sign-in on the verification journey", async () => {
    state.query = "next=%2Fworker%2Fsaved-jobs"; state.login.mockResolvedValueOnce({ data: { user: { emailVerifiedAt: null } } });
    await flush(() => root.render(<WorkerAccess mode="login" />)); await input('input[type="email"]', "worker@example.test"); await input('input[type="password"]', "WorkerReady123!"); await submit();
    expect(state.router.replace).toHaveBeenCalledWith("/worker/verify?next=%2Fworker%2Fsaved-jobs");
  });
  it("does not call reset without a token and catches mismatched new passwords before posting", async () => {
    await flush(() => root.render(<WorkerAccess mode="reset" />)); expect(container.textContent).toContain("Request a new reset link"); expect(container.querySelector("form")).toBeNull();
    await act(async () => root.unmount()); root = createRoot(container);
    window.history.replaceState(null, "", `/worker/reset-password#token=${"b".repeat(64)}`); await flush(() => root.render(<WorkerAccess mode="reset" />));
    await input('input[aria-label="New password *"]', "ValidPassword123"); await input('input[aria-label="Confirm password *"]', "DifferentPassword123"); await submit();
    expect(state.reset).not.toHaveBeenCalled(); expect(container.textContent).toContain("passwords don’t match");
  });
});
