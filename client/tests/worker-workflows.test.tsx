import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { WorkerApply, WorkerApplicationDetail } from "@/components/worker/WorkerApplications";
import { attendancePayload } from "@/components/worker/WorkerAttendance";
import type { AssignmentDay } from "@/types/worker-workflow.types";
const api = vi.hoisted(() => ({ fetch: vi.fn(), replace: vi.fn() }));
vi.mock("@/lib/api", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/api")>(), apiFetch: api.fetch }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: api.replace }), useSearchParams: () => new URLSearchParams() }));
vi.mock("next/link", () => ({ default: (props: ComponentProps<"a">) => createElement("a", props) }));
vi.mock("@/components/worker/WorkerProvider", () => ({ useWorker: () => ({ user: { id: "worker-a", email: "asha@example.test" } }) }));
const profile = { fullName: "Asha", phone: "9876543210", city: "Delhi", state: "Delhi", revision: 3, resumeRevision: 4, resume: { fileName: "cv.pdf" }, skills: ["Sales"], education: [], workExperience: [], experienceYears: 2 };
const job = { id: "job-a", title: "Field Executive", location: "Delhi", slug: "field-executive" };
let root: Root, container: HTMLDivElement;
const flush = async (action?: () => void) => { await act(async () => { action?.(); await new Promise(resolve => setTimeout(resolve, 0)); }); };
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); api.fetch.mockReset(); api.replace.mockReset(); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
describe("worker workflow interactions", () => {
  it("previews exact saved profile revisions and prevents a duplicate click while submitting", async () => {
    let resolve!: (value: unknown) => void;
    api.fetch.mockImplementation((path, options) => options?.method === "POST" ? new Promise(done => { resolve = done; }) : Promise.resolve({ data: path === "/workers/profile" ? { profile } : job }));
    await flush(() => root.render(<WorkerApply slug="field-executive" />));
    const form = container.querySelector("form")!; (form.querySelector('[name="consent"]') as HTMLInputElement).checked = true;
    await flush(() => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    const writes = api.fetch.mock.calls.filter(([, options]) => options?.method === "POST"); expect(writes).toHaveLength(1);
    expect(JSON.parse(writes[0][1].body)).toMatchObject({ profileRevision: 3, resumeRevision: 4, consent: true, includeResume: true });
    expect(api.replace).not.toHaveBeenCalled(); await flush(() => resolve({ data: { id: "application-a" } })); expect(api.replace).toHaveBeenCalledWith("/worker/applications/application-a");
  });
  it("keeps the application note after a stale profile response and offers an explicit reload", async () => {
    api.fetch.mockImplementation((path, options) => options?.method === "POST" ? Promise.reject(new ApiError("Your profile or CV changed. Reload the application preview before submitting.", 409)) : Promise.resolve({ data: path === "/workers/profile" ? { profile } : job }));
    await flush(() => root.render(<WorkerApply slug="field-executive" />));
    const note = container.querySelector<HTMLTextAreaElement>('[name="message"]')!; note.value = "My experience matters";
    await flush(() => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(note.value).toBe("My experience matters"); expect(container.textContent).toContain("Reload saved profile and application preview"); expect(api.replace).not.toHaveBeenCalled();
  });
  it("shows existing application instead of offering a second submission", async () => {
    api.fetch.mockImplementation(path => Promise.resolve({ data: path === "/workers/profile" ? { profile } : { ...job, applicationId: "already-sent" } }));
    await flush(() => root.render(<WorkerApply slug="field-executive" />)); expect(container.querySelector("form")).toBeNull(); expect(container.querySelector('a[href="/worker/applications/already-sent"]')).not.toBeNull();
  });
  it("requires a deliberate withdrawal with the latest application revision", async () => {
    const detail = { application: { id: "app-a", revision: 5, stage: "SUBMITTED", status: "SUBMITTED", job, name: "Asha", createdAt: "2026-09-09", canWithdraw: true, hiringReviews: [] }, profile: { skills: [] }, history: { items: [], page: 1, totalPages: 1 } };
    api.fetch.mockImplementation((_path, options) => options?.method === "POST" ? Promise.reject(new ApiError("This application changed. Refresh it before continuing.", 409)) : Promise.resolve({ data: detail }));
    await flush(() => root.render(<WorkerApplicationDetail id="app-a" />));
    expect(container.querySelector("form")).toBeNull(); await flush(() => [...container.querySelectorAll("button")].find(button => button.textContent?.includes("Withdraw application"))!.click());
    const form = container.querySelector("form")!; expect(form.querySelector<HTMLInputElement>('[name="confirm"]')!.required).toBe(true); form.querySelector<HTMLTextAreaElement>('[name="reason"]')!.value = "Another role accepted"; form.querySelector<HTMLInputElement>('[name="confirm"]')!.checked = true;
    await flush(() => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    const write = api.fetch.mock.calls.find(([, options]) => options?.method === "POST")!; expect(JSON.parse(write[1].body)).toMatchObject({ revision: 5, reason: "Another role accepted", confirm: true }); expect(container.textContent).toContain("This application changed");
  });
  it("builds explicit IST overnight times and strips times from a non-present report", () => {
    const day = { date: "2026-09-08", assignment: { revision: 2 }, record: { revision: 3, approvalRevision: 4 } } as AssignmentDay;
    const form = new FormData(); Object.entries({ attendanceStatus: "PRESENT", arrival: "22:00", departure: "06:00", nextDay: "on", breakMinutes: "30", reason: "Completed shift", confirm: "on" }).forEach(([key, value]) => form.set(key, value));
    expect(attendancePayload(form, day, "request")).toMatchObject({ checkInAt: "2026-09-08T22:00:00+05:30", checkOutAt: "2026-09-09T06:00:00+05:30", kind: "CORRECTION", recordRevision: 3, recordApprovalRevision: 4, assignmentRevision: 2 });
    form.delete("nextDay"); expect(() => attendancePayload(form, day, "request")).toThrow(/Departure must be after arrival/);
    form.set("attendanceStatus", "LEAVE"); expect(attendancePayload(form, day, "request")).toMatchObject({ checkInAt: null, checkOutAt: null, breakMinutes: 0 });
  });
});
