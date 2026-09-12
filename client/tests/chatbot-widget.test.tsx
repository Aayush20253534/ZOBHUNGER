import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";

const { sendMessage } = vi.hoisted(() => ({ sendMessage: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => "/promoter-solutions" }));
vi.mock("next/link", () => ({ default: (props: ComponentProps<"a">) => createElement("a", props) }));
vi.mock("@/lib/chatbot", async () => {
  const actual = await vi.importActual<typeof import("@/lib/chatbot")>("@/lib/chatbot");
  return { ...actual, sendChatbotMessage: sendMessage };
});

let root: Root;
let container: HTMLDivElement;
const flush = async (action?: () => void) => {
  await act(async () => {
    action?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Element.prototype.scrollIntoView = vi.fn();
  sendMessage.mockReset().mockResolvedValue({
    answer: "ZOBHUNGER provides promoter solutions for eligible retail requirements.",
    grounded: true,
    sources: [{ title: "Promoters Services", url: "/promoter-solutions", category: "services" }],
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

async function renderWidget() {
  await flush(() => root.render(<ChatbotWidget />));
}

async function openWidget() {
  await renderWidget();
  await flush(() => (container.querySelector("button[aria-label='Open ZOBHUNGER Assistant']") as HTMLButtonElement).click());
}

describe("public chatbot widget", () => {
  it("starts as a circular launcher and opens an accessible assistant dialog", async () => {
    await renderWidget();
    expect(container.querySelector("[role='dialog']")).toBeNull();
    const launcher = container.querySelector("button[aria-label='Open ZOBHUNGER Assistant']") as HTMLButtonElement;
    expect(launcher).not.toBeNull();
    await flush(() => launcher.click());
    expect(container.querySelector("[role='dialog']")).not.toBeNull();
    expect(container.textContent).toContain("ZOBHUNGER Assistant");
    expect(container.textContent).toContain("Popular questions");
  });

  it("sends current-page context and renders grounded answer sources", async () => {
    await openWidget();
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    await flush(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(textarea, "Do you provide promoters for retail stores?");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await flush(() => (container.querySelector("button[aria-label='Send message']") as HTMLButtonElement).click());

    expect(sendMessage).toHaveBeenCalledWith({
      message: "Do you provide promoters for retail stores?",
      history: [],
      currentPage: "/promoter-solutions",
    });
    expect(container.textContent).toContain("ZOBHUNGER provides promoter solutions");
    const source = container.querySelector("a[href='/promoter-solutions']");
    expect(source?.textContent).toContain("Promoters Services");
  });

  it("uses suggested prompts and keeps the static welcome message out of model history", async () => {
    await openWidget();
    const suggestion = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Hire workforce")) as HTMLButtonElement;
    await flush(() => suggestion.click());
    expect(sendMessage).toHaveBeenCalledWith({
      message: "How can I hire workforce through ZOBHUNGER?",
      history: [],
      currentPage: "/promoter-solutions",
    });
    expect(container.textContent).not.toContain("Popular questions");
  });

  it("shows a safe error without deleting the user's question", async () => {
    sendMessage.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await openWidget();
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    await flush(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(textarea, "Tell me about ZOBHUNGER");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await flush(() => (container.querySelector("button[aria-label='Send message']") as HTMLButtonElement).click());
    expect(container.textContent).toContain("Tell me about ZOBHUNGER");
    expect(container.textContent).toContain("could not reach the server");

    await flush(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(textarea, "What services do you offer?");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await flush(() => (container.querySelector("button[aria-label='Send message']") as HTMLButtonElement).click());
    expect(sendMessage.mock.calls[1]?.[0]).toMatchObject({
      message: "What services do you offer?",
      history: [],
    });
  });

  it("closes with Escape", async () => {
    await openWidget();
    await flush(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });
});
