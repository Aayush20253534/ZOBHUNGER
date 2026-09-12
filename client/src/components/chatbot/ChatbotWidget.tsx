"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ApiError } from "@/lib/api";
import {
  sendChatbotMessage,
  type ChatbotHistoryMessage,
} from "@/lib/chatbot";
import { ChatbotLauncher } from "./ChatbotLauncher";
import { ChatbotPanel } from "./ChatbotPanel";
import type { ChatbotUiMessage } from "./ChatMessage";
import "@/styles/chatbot.css";

const welcomeMessage: ChatbotUiMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi, I’m the ZOBHUNGER Assistant. I can help you understand our services, hiring process, jobs, partnerships and public company information.",
  includeInHistory: false,
};

function publicErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "CHATBOT_DISABLED" || error.code === "CHATBOT_CONFIGURATION_ERROR") {
      return "The assistant is temporarily unavailable. Please use the website navigation or contact ZOBHUNGER directly.";
    }
    if (error.code === "CHATBOT_UPSTREAM_RATE_LIMITED" || error.status === 429) {
      return "The assistant is handling a lot of requests right now. Please try again shortly.";
    }
    if (error.code === "CHATBOT_TIMEOUT") {
      return "The response took too long. Please try your question again.";
    }
    return error.message;
  }
  if (error instanceof TypeError) {
    return "The assistant could not reach the server. Check your connection and try again.";
  }
  return "Something went wrong while contacting the assistant. Please try again.";
}

function historyFrom(messages: ChatbotUiMessage[]): ChatbotHistoryMessage[] {
  return messages
    .filter((message) => message.includeInHistory)
    .slice(-10)
    .map(({ role, content }) => ({ role, content }));
}

export function ChatbotWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatbotUiMessage[]>([welcomeMessage]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageSequence = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  const nextId = useCallback((prefix: string) => {
    messageSequence.current += 1;
    return `${prefix}-${messageSequence.current}`;
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  }, []);

  const showSuggestions = useMemo(
    () => !messages.some((message) => message.role === "user"),
    [messages],
  );

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closePanel, open]);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error, open]);

  const submitMessage = useCallback(async (rawMessage?: string) => {
    if (loading) return;
    const message = (rawMessage ?? draft).trim();
    if (!message) return;

    const history = historyFrom(messages);
    const userMessage: ChatbotUiMessage = {
      id: nextId("user"),
      role: "user",
      content: message,
      includeInHistory: true,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError(null);
    setLoading(true);

    try {
      const reply = await sendChatbotMessage({
        message,
        history,
        ...(pathname ? { currentPage: pathname } : {}),
      });
      setMessages((current) => [
        ...current,
        {
          id: nextId("assistant"),
          role: "assistant",
          content: reply.answer,
          sources: reply.sources,
          includeInHistory: true,
        },
      ]);
    } catch (requestError) {
      setMessages((current) => current.map((entry) =>
        entry.id === userMessage.id ? { ...entry, includeInHistory: false } : entry,
      ));
      setError(publicErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [draft, loading, messages, nextId, pathname]);

  return (
    <aside className="zb-chatbot-root" aria-label="ZOBHUNGER website assistant">
      {open ? (
        <ChatbotPanel
          messages={messages}
          draft={draft}
          loading={loading}
          error={error}
          showSuggestions={showSuggestions}
          messagesEndRef={messagesEndRef}
          inputRef={inputRef}
          onDraftChange={(value) => {
            setDraft(value);
            if (error) setError(null);
          }}
          onClose={closePanel}
          onSubmit={() => { void submitMessage(); }}
          onSuggestion={(prompt) => { void submitMessage(prompt); }}
        />
      ) : null}
      <ChatbotLauncher open={open} buttonRef={launcherRef} onOpen={() => setOpen(true)} />
    </aside>
  );
}
