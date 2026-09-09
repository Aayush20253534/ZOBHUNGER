import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import { WorkerJobs } from "@/components/worker/WorkerJobs";

const api = vi.hoisted(() => ({ query: "", jobs: vi.fn(), saved: vi.fn(), save: vi.fn(), facets: vi.fn(), router: { push: vi.fn() } }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(api.query), useRouter: () => api.router }));
vi.mock("next/link", () => ({ default: (props: ComponentProps<"a">) => createElement("a", props) }));
vi.mock("@/components/worker/WorkerProvider", () => ({ useWorker: () => ({ completion: { percent: 0, checklist: [] }, profile: { fullName: "Asha Worker" } }) }));
vi.mock("@/services/worker.service", () => ({ getWorkerJobs: api.jobs, getWorkerSavedJobs: api.saved, getWorkerJobFacets: api.facets, setWorkerJobSaved: api.save, getWorkerJob: vi.fn() }));
const job = { id: "job-a", slug: "field-sales", title: "Field Sales Executive", category: "Sales", city: "Delhi", location: "Delhi", engagementType: "Contract", description: "Visit stores and support customers", compensation: null, saved: false };
const listing = { data: { items: [job], total: 1, totalPages: 1, page: 1, pageSize: 9 } };
let root: Root, container: HTMLDivElement;
const flush = async (action?: () => void) => { await act(async () => { action?.(); await new Promise(resolve => setTimeout(resolve, 0)); }); };
beforeEach(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); api.query = ""; api.jobs.mockReset().mockResolvedValue(listing); api.saved.mockReset().mockResolvedValue(listing); api.save.mockReset(); api.facets.mockReset().mockResolvedValue({ data: { cities: ["Delhi"], categories: ["Sales"], engagementTypes: ["Contract"] } }); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

describe("job discovery interactions", () => {
  it("waits for a save to succeed and keeps a failed save retryable", async () => {
    await flush(() => root.render(<WorkerJobs />)); api.save.mockRejectedValueOnce(new ApiError("Connection interrupted", 503));
    const button = container.querySelector<HTMLButtonElement>('[aria-label="Save job: Field Sales Executive"]')!;
    await flush(() => button.click()); expect(button.getAttribute("aria-pressed")).toBe("false"); expect(container.textContent).toContain("Connection interrupted");
    api.save.mockResolvedValueOnce({ data: { saved: true } }); await flush(() => button.click()); expect(button.getAttribute("aria-pressed")).toBe("true"); expect(api.save).toHaveBeenLastCalledWith("job-a", true);
  });
  it("ignores late results from an old filter and restores filters from the current URL", async () => {
    let resolve!: (value: typeof listing) => void; api.jobs.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    await flush(() => root.render(<WorkerJobs />)); api.query = "city=Mumbai"; api.jobs.mockResolvedValueOnce({ data: { ...listing.data, items: [{ ...job, title: "Mumbai Field Role", city: "Mumbai" }] } });
    await flush(() => root.render(<WorkerJobs />)); await flush(() => resolve(listing));
    expect(container.textContent).toContain("Mumbai Field Role"); expect(container.textContent).not.toContain("Field Sales Executive"); expect(container.querySelector<HTMLSelectElement>('select[name="city"]')!.value).toBe("Mumbai");
    await flush(() => container.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); expect(api.router.push).toHaveBeenCalledWith("/worker/jobs?city=Mumbai");
  });
  it("shows closed saved roles as unavailable with removal available and no dead details link", async () => {
    api.saved.mockResolvedValueOnce({ data: { ...listing.data, items: [{ ...job, slug: null, saved: true, available: false }] } });
    await flush(() => root.render(<WorkerJobs saved />)); expect(container.textContent).toContain("No longer available"); expect(container.querySelector('a[href="/worker/jobs/field-sales"]')).toBeNull();
    api.save.mockResolvedValueOnce({ data: { saved: false } }); api.saved.mockResolvedValueOnce({ data: { ...listing.data, items: [], total: 0 } });
    await flush(() => container.querySelector<HTMLButtonElement>('[aria-label="Remove saved job: Field Sales Executive"]')!.click()); expect(api.save).toHaveBeenCalledWith("job-a", false); expect(container.textContent).toContain("Keep a role for later");
  });
});
