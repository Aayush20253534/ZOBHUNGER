import { act, createElement, useState, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { WorkerProvider } from "@/components/worker/WorkerProvider";
import { WorkerProfileForm } from "@/components/worker/WorkerProfileForm";

const api = vi.hoisted(() => ({ workspace: vi.fn(), profile: vi.fn(), save: vi.fn(), upload: vi.fn(), download: vi.fn(), remove: vi.fn(), router: { replace: vi.fn(), refresh: vi.fn() } }));
vi.mock("next/navigation", () => ({ usePathname: () => "/worker/profile", useRouter: () => api.router }));
vi.mock("next/link", () => ({ default: (props: ComponentProps<"a">) => createElement("a", props) }));
vi.mock("next/image", () => ({ default: (props: ComponentProps<"img">) => createElement("img", props) }));
vi.mock("@/services/auth.service", () => ({ logout: vi.fn() }));
vi.mock("@/services/worker.service", () => ({ getWorkerWorkspace: api.workspace, getWorkerProfile: api.profile, saveWorkerProfile: api.save, uploadWorkerResume: api.upload, downloadWorkerResume: api.download, removeWorkerResume: api.remove }));
const profile = { id: "profile-a", fullName: "Asha Worker", phone: "9876543210", headline: "", about: "", city: "Delhi", state: "Delhi", postalCode: "110001", skills: ["Sales"], languages: [], experienceYears: 0, education: [], workExperience: [], preferredLocations: [], preferredCategories: [], preferredEngagements: [], availability: "", isAvailable: true, consentAt: "2026-01-01T00:00:00Z", revision: 2, resumeRevision: 3, resume: null, updatedAt: "2026-01-01T00:00:00Z" };
const completion = { percent: 50, checklist: [{ id: "personal", label: "Personal details", done: true }] };
const ready = { data: { user: { id: "worker-a", email: "worker@example.test", phone: profile.phone, role: "WORKER", emailVerifiedAt: profile.consentAt }, profile, completion } };
function Pages() { const [showProfile, setShowProfile] = useState(true); return <><button data-switch onClick={() => setShowProfile(value => !value)}>Switch worker page</button>{showProfile ? <WorkerProfileForm /> : <p>Job discovery page</p>}</>; }
let root: Root, container: HTMLDivElement;
const flush = async (action?: () => void) => { await act(async () => { action?.(); await new Promise(resolve => setTimeout(resolve, 0)); }); };
async function input(selector: string, value: string) { await flush(() => { const field = container.querySelector<HTMLInputElement>(selector)!; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, value); field.dispatchEvent(new Event("input", { bubbles: true })); }); }
const submit = () => flush(() => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); api.workspace.mockReset().mockResolvedValue(ready); api.profile.mockReset().mockResolvedValue({ data: { profile, completion } }); api.save.mockReset(); api.upload.mockReset(); container = document.createElement("div"); document.body.append(container); root = createRoot(container); window.localStorage.clear(); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const open = () => flush(() => root.render(<WorkerProvider><Pages /></WorkerProvider>));

describe("worker profile editing", () => {
  it("keeps unfinished text and comma input while moving between worker pages, without browser storage", async () => {
    await open(); await input('input[autoComplete="name"]', "Asha Updated"); await input("#worker-skills", "Sales, Customer service, ");
    expect(container.querySelector<HTMLInputElement>("#worker-skills")!.value).toBe("Sales, Customer service, ");
    await flush(() => container.querySelector<HTMLButtonElement>("[data-switch]")!.click()); expect(container.querySelector("form")).toBeNull();
    await flush(() => container.querySelector<HTMLButtonElement>("[data-switch]")!.click());
    expect(container.querySelector<HTMLInputElement>('input[autoComplete="name"]')!.value).toBe("Asha Updated"); expect(container.querySelector<HTMLInputElement>("#worker-skills")!.value).toBe("Sales, Customer service, "); expect(window.localStorage.length).toBe(0);
    api.save.mockResolvedValueOnce({ data: { profile: { ...profile, fullName: "Asha Updated", skills: ["Sales", "Customer service"], revision: 3 }, completion } });
    await submit(); expect(api.save.mock.calls[0][0].skills).toEqual(["Sales", "Customer service"]); expect(api.save.mock.calls[0][0].revision).toBe(2); expect(container.textContent).toContain("Your profile is saved");
  });
  it("preserves edits on a version conflict until the worker explicitly reloads saved data", async () => {
    await open(); await input('input[autoComplete="name"]', "Unsaved Worker"); api.save.mockRejectedValueOnce(new ApiError("Your profile changed in another tab.", 409));
    await submit(); expect(container.querySelector<HTMLInputElement>('input[autoComplete="name"]')!.value).toBe("Unsaved Worker"); expect(container.textContent).toContain("Your profile changed");
    api.profile.mockResolvedValueOnce({ data: { profile: { ...profile, fullName: "Newer saved name", revision: 5 }, completion } });
    await flush(() => Array.from(container.querySelectorAll("button")).find(button => button.textContent?.startsWith("Discard unsaved"))!.click());
    expect(container.querySelector<HTMLInputElement>('input[autoComplete="name"]')!.value).toBe("Newer saved name"); expect(api.save).toHaveBeenCalledTimes(1);
  });
  it("uploads with the persistent resume version even after a prior file was deleted", async () => {
    await open(); await input('input[autoComplete="name"]', "Unfinished text stays");
    const file = new File(["%PDF-1.4\n%%EOF"], "resume.pdf", { type: "application/pdf" });
    await flush(() => { const picker = container.querySelector<HTMLInputElement>('input[type="file"]')!; Object.defineProperty(picker, "files", { value: [file], configurable: true }); picker.dispatchEvent(new Event("change", { bubbles: true })); });
    api.upload.mockResolvedValueOnce({ data: { profile: { ...profile, resumeRevision: 4, resume: { id: "r", fileName: "resume.pdf", size: file.size, mimeType: "application/pdf", revision: 4, updatedAt: profile.updatedAt } }, completion } });
    await flush(() => Array.from(container.querySelectorAll("button")).find(button => button.textContent === "Upload resume")!.click());
    expect(api.upload).toHaveBeenCalledWith(file, 3); expect(container.textContent).toContain("saved privately"); expect(container.querySelector<HTMLInputElement>('input[autoComplete="name"]')!.value).toBe("Unfinished text stays"); expect(api.save).not.toHaveBeenCalled();
  });
});
