import { act, createElement, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatbotWidget } from "@/components/chatbot/ChatbotWidget";
import { chatbotStorageInternals } from "@/lib/chatbot-storage";

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

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
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
  await flush(() => (container.querySelector("button[aria-label^='Open ZOBHUNGER Assistant']") as HTMLButtonElement).click());
}

async function sendTypedMessage(message: string) {
  const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
  await flush(() => setTextareaValue(textarea, message));
  await flush(() => (container.querySelector("button[aria-label='Send message']") as HTMLButtonElement).click());
}

describe("advanced public chatbot widget", () => {
  it("opens with page-aware service suggestions", async () => {
    await openWidget();
    expect(container.querySelector("[role='dialog']")).not.toBeNull();
    expect(container.textContent).toContain("How it works");
    expect(container.textContent).toContain("Request this service");
    expect(container.textContent).toContain("saved on this device");
  });

  it("sends current-page context, renders sources, and offers contextual follow-ups", async () => {
    await openWidget();
    await sendTypedMessage("Do you provide promoters for retail stores?");

    expect(sendMessage).toHaveBeenCalledWith({
      message: "Do you provide promoters for retail stores?",
      history: [],
      currentPage: "/promoter-solutions",
    });
    expect(container.textContent).toContain("ZOBHUNGER provides promoter solutions");
    expect(container.textContent).toContain("Sources (1)");
    expect(container.querySelector("a[href='/promoter-solutions']")?.textContent).toContain("Promoters Services");
    expect(container.textContent).toContain("Continue with");
    expect(container.textContent).toContain("Request this service");
  });


  it("renders assistant Markdown emphasis as real formatting", async () => {
    sendMessage.mockResolvedValueOnce({
      answer: "**Steps**\n\n1. **Go to the form** – Visit `/hire-workforce`.\n2. **Submit the form** – Send the requirement.",
      grounded: true,
      sources: [],
    });
    await openWidget();
    await sendTypedMessage("How do I hire workforce?");

    const bubble = Array.from(container.querySelectorAll(".zb-chatbot-message--assistant .zb-chatbot-bubble")).at(-1) as HTMLElement;
    expect(bubble.querySelector("strong")?.textContent).toBe("Steps");
    expect(bubble.querySelector("ol li[value='1'] strong")?.textContent).toBe("Go to the form");
    expect(bubble.querySelector("code")?.textContent).toBe("/hire-workforce");
    expect(bubble.textContent).not.toContain("**");
  });

  it("shows a visible clear-history menu action", async () => {
    await openWidget();
    await flush(() => (container.querySelector("button[aria-label='Chat options']") as HTMLButtonElement).click());

    const clearHistory = container.querySelector("button[aria-label='Clear saved chatbot history']") as HTMLButtonElement;
    expect(clearHistory).not.toBeNull();
    expect(clearHistory.textContent).toContain("Clear history");
    expect(clearHistory.textContent).toContain("Remove saved conversation");
  });

  it("persists successful conversation history locally", async () => {
    await openWidget();
    await sendTypedMessage("Do you provide promoters?");
    await flush();

    const raw = window.localStorage.getItem(chatbotStorageInternals.key);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw ?? "{}") as { messages?: Array<{ content: string }> };
    expect(stored.messages?.map((message) => message.content)).toEqual([
      "Do you provide promoters?",
      "ZOBHUNGER provides promoter solutions for eligible retail requirements.",
    ]);
  });

  it("restores saved successful history after remounting", async () => {
    window.localStorage.setItem(chatbotStorageInternals.key, JSON.stringify({
      version: 1,
      id: "chat_saved",
      createdAt: "2026-09-12T00:00:00.000Z",
      updatedAt: "2026-09-12T00:01:00.000Z",
      messages: [
        { id: "u1", role: "user", content: "Saved user question", includeInHistory: true },
        { id: "a1", role: "assistant", content: "Saved assistant answer", includeInHistory: true },
      ],
    }));

    await openWidget();
    expect(container.textContent).toContain("Saved user question");
    expect(container.textContent).toContain("Saved assistant answer");
    expect(container.textContent).not.toContain("Popular questions");
  });

  it("retries a failed request without duplicating the user message", async () => {
    sendMessage
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        answer: "Recovered answer",
        grounded: true,
        sources: [],
      });
    await openWidget();
    await sendTypedMessage("Tell me about ZOBHUNGER");
    expect(container.textContent).toContain("could not reach the server");
    const retry = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("Retry")) as HTMLButtonElement;
    await flush(() => retry.click());

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("Recovered answer");
    expect(container.textContent?.match(/Tell me about ZOBHUNGER/g)?.length).toBe(1);
  });

  it("copies assistant responses", async () => {
    await openWidget();
    await sendTypedMessage("Do you provide promoters?");
    const copy = container.querySelector("button[aria-label='Copy assistant response']") as HTMLButtonElement;
    await flush(() => copy.click());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "ZOBHUNGER provides promoter solutions for eligible retail requirements.",
    );
    expect(container.textContent).toContain("Copied");
  });

  it("can start a new chat from the header menu", async () => {
    await openWidget();
    await sendTypedMessage("Do you provide promoters?");
    await flush(() => (container.querySelector("button[aria-label='Chat options']") as HTMLButtonElement).click());
    const newChat = Array.from(container.querySelectorAll("button")).find((button) => button.textContent?.includes("New chat")) as HTMLButtonElement;
    await flush(() => newChat.click());

    expect(container.textContent).not.toContain("Do you provide promoters?");
    expect(container.textContent).toContain("How it works");
  });

  it("shows an unread badge when a minimized request finishes", async () => {
    let resolveReply: ((value: unknown) => void) | undefined;
    sendMessage.mockReturnValueOnce(new Promise((resolve) => { resolveReply = resolve; }));
    await openWidget();

    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    await flush(() => setTextareaValue(textarea, "Tell me about promoter services"));
    await flush(() => (container.querySelector("button[aria-label='Send message']") as HTMLButtonElement).click());
    await flush(() => (container.querySelector("button[aria-label='Minimize chatbot']") as HTMLButtonElement).click());

    await flush(() => resolveReply?.({ answer: "Finished while minimized", grounded: true, sources: [] }));
    const launcher = container.querySelector("button[aria-label*='unread response']") as HTMLButtonElement;
    expect(launcher).not.toBeNull();
    expect(launcher.textContent).toContain("1");
  });

  it("closes with Escape", async () => {
    await openWidget();
    await flush(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });
});
