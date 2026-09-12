"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from "react";
import { usePathname } from "next/navigation";
import { ApiError } from "@/lib/api";
import {
  sendChatbotMessage,
  type ChatbotHistoryMessage,
  type ChatbotUiMessage,
} from "@/lib/chatbot";
import {
  getFollowUpSuggestions,
  getStarterSuggestions,
} from "@/lib/chatbot-suggestions";
import {
  clearStoredChatbotConversation,
  createChatbotConversationId,
  loadStoredChatbotConversation,
  saveStoredChatbotConversation,
} from "@/lib/chatbot-storage";
import { ChatbotLauncher } from "./ChatbotLauncher";
import { ChatbotPanel } from "./ChatbotPanel";
import "@/styles/chatbot.css";

const welcomeMessage: ChatbotUiMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi, I’m the ZOBHUNGER Assistant. I can help you understand our services, hiring process, jobs, partnerships and public company information.",
  includeInHistory: false,
};

interface FailedRequest {
  message: string;
  userMessageId: string;
}

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

function lastMessageByRole(messages: ChatbotUiMessage[], role: "user" | "assistant") {
  return [...messages].reverse().find((message) => message.role === role && message.id !== "welcome");
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function ChatbotWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatbotUiMessage[]>([welcomeMessage]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedRequest, setFailedRequest] = useState<FailedRequest | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [conversationId, setConversationId] = useState(() => createChatbotConversationId());
  const [conversationCreatedAt, setConversationCreatedAt] = useState(() => new Date().toISOString());

  const messageSequence = useRef(0);
  const activeRequestSequence = useRef(0);
  const requestInFlightRef = useRef(false);
  const copyResetTimer = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const messagesRef = useRef(messages);
  const openRef = useRef(open);
  const autoScrollRef = useRef(true);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { openRef.current = open; }, [open]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const restored = loadStoredChatbotConversation();
      if (restored) {
        setConversationId(restored.id);
        setConversationCreatedAt(restored.createdAt);
        if (restored.messages.length) setMessages([welcomeMessage, ...restored.messages]);
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveStoredChatbotConversation({
      id: conversationId,
      createdAt: conversationCreatedAt,
      updatedAt: new Date().toISOString(),
      messages,
    });
  }, [conversationCreatedAt, conversationId, hydrated, messages]);

  useEffect(() => () => {
    if (copyResetTimer.current) window.clearTimeout(copyResetTimer.current);
  }, []);

  const nextId = useCallback((prefix: string) => {
    messageSequence.current += 1;
    return `${prefix}-${Date.now().toString(36)}-${messageSequence.current}`;
  }, []);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "smooth") => {
    autoScrollRef.current = true;
    setShowJumpToLatest(false);
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const closePanel = useCallback(() => {
    openRef.current = false;
    setOpen(false);
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  }, []);

  const openPanel = useCallback(() => {
    openRef.current = true;
    setOpen(true);
    setUnreadCount(0);
    autoScrollRef.current = true;
    setShowJumpToLatest(false);
    window.setTimeout(() => scrollToLatest("auto"), 0);
  }, [scrollToLatest]);

  const resetConversation = useCallback((clearStorage: boolean) => {
    activeRequestSequence.current += 1;
    requestInFlightRef.current = false;
    if (clearStorage) clearStoredChatbotConversation();
    const createdAt = new Date().toISOString();
    setConversationId(createChatbotConversationId());
    setConversationCreatedAt(createdAt);
    setMessages([welcomeMessage]);
    setDraft("");
    setError(null);
    setFailedRequest(null);
    setUnreadCount(0);
    setLoading(false);
    setCopiedMessageId(null);
    autoScrollRef.current = true;
    setShowJumpToLatest(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const showStarterSuggestions = useMemo(
    () => !messages.some((message) => message.role === "user"),
    [messages],
  );
  const starterSuggestions = useMemo(() => getStarterSuggestions(pathname), [pathname]);
  const latestUserMessage = useMemo(() => lastMessageByRole(messages, "user"), [messages]);
  const latestAssistantMessage = useMemo(() => lastMessageByRole(messages, "assistant"), [messages]);
  const followUpSuggestions = useMemo(() => getFollowUpSuggestions({
    pathname,
    sources: latestAssistantMessage?.sources,
    userMessage: latestUserMessage?.content,
  }), [latestAssistantMessage?.sources, latestUserMessage?.content, pathname]);
  const showFollowUpSuggestions = Boolean(
    !loading &&
    !error &&
    latestAssistantMessage &&
    messages[messages.length - 1]?.role === "assistant" &&
    messages[messages.length - 1]?.id !== "welcome",
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
    if (!open || !autoScrollRef.current) return;
    const scrollTimer = window.setTimeout(() => scrollToLatest("smooth"), 0);
    return () => window.clearTimeout(scrollTimer);
  }, [messages, loading, error, open, scrollToLatest]);

  const submitMessage = useCallback(async (
    rawMessage?: string,
    options: { reuseUserMessageId?: string } = {},
  ) => {
    if (loading || requestInFlightRef.current) return;
    const message = (rawMessage ?? draft).trim();
    if (!message) return;

    const currentMessages = messagesRef.current;
    const history = historyFrom(currentMessages);
    const userMessageId = options.reuseUserMessageId ?? nextId("user");
    const requestSequence = ++activeRequestSequence.current;
    requestInFlightRef.current = true;

    autoScrollRef.current = true;
    setShowJumpToLatest(false);
    setError(null);
    setFailedRequest(null);
    setLoading(true);
    setDraft("");

    if (options.reuseUserMessageId) {
      setMessages((current) => current.map((entry) =>
        entry.id === userMessageId ? { ...entry, includeInHistory: false } : entry,
      ));
    } else {
      const userMessage: ChatbotUiMessage = {
        id: userMessageId,
        role: "user",
        content: message,
        includeInHistory: false,
      };
      setMessages((current) => [...current, userMessage]);
    }

    try {
      const reply = await sendChatbotMessage({
        message,
        history,
        ...(pathname ? { currentPage: pathname } : {}),
      });
      if (requestSequence !== activeRequestSequence.current) return;

      setMessages((current) => [
        ...current.map((entry) => entry.id === userMessageId
          ? { ...entry, includeInHistory: true }
          : entry),
        {
          id: nextId("assistant"),
          role: "assistant",
          content: reply.answer,
          sources: reply.sources,
          includeInHistory: true,
        },
      ]);
      if (!openRef.current) setUnreadCount((current) => Math.min(current + 1, 9));
    } catch (requestError) {
      if (requestSequence !== activeRequestSequence.current) return;
      setMessages((current) => current.map((entry) =>
        entry.id === userMessageId ? { ...entry, includeInHistory: false } : entry,
      ));
      setFailedRequest({ message, userMessageId });
      setError(publicErrorMessage(requestError));
    } finally {
      if (requestSequence === activeRequestSequence.current) {
        requestInFlightRef.current = false;
        setLoading(false);
      }
    }
  }, [draft, loading, nextId, pathname]);

  const retryLastFailedRequest = useCallback(() => {
    if (!failedRequest || loading) return;
    void submitMessage(failedRequest.message, { reuseUserMessageId: failedRequest.userMessageId });
  }, [failedRequest, loading, submitMessage]);

  const copyAssistantMessage = useCallback(async (message: ChatbotUiMessage) => {
    try {
      await copyTextToClipboard(message.content);
      setCopiedMessageId(message.id);
      if (copyResetTimer.current) window.clearTimeout(copyResetTimer.current);
      copyResetTimer.current = window.setTimeout(() => setCopiedMessageId(null), 1600);
    } catch {
      setCopiedMessageId(null);
    }
  }, []);

  const handleBodyScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    const nearBottom = distanceFromBottom < 88;
    autoScrollRef.current = nearBottom;
    setShowJumpToLatest(!nearBottom);
  }, []);

  return (
    <aside className="zb-chatbot-root" aria-label="ZOBHUNGER website assistant">
      {open ? (
        <ChatbotPanel
          messages={messages}
          draft={draft}
          loading={loading}
          error={error}
          retryAvailable={Boolean(failedRequest)}
          starterSuggestions={starterSuggestions}
          followUpSuggestions={followUpSuggestions}
          showStarterSuggestions={showStarterSuggestions}
          showFollowUpSuggestions={showFollowUpSuggestions}
          copiedMessageId={copiedMessageId}
          showJumpToLatest={showJumpToLatest}
          messagesEndRef={messagesEndRef}
          bodyRef={bodyRef}
          inputRef={inputRef}
          onDraftChange={(value) => {
            setDraft(value);
            if (error) setError(null);
          }}
          onClose={closePanel}
          onSubmit={() => { void submitMessage(); }}
          onSuggestion={(prompt) => { void submitMessage(prompt); }}
          onRetry={retryLastFailedRequest}
          onCopyMessage={(message) => { void copyAssistantMessage(message); }}
          onNewChat={() => resetConversation(false)}
          onClearHistory={() => resetConversation(true)}
          onBodyScroll={handleBodyScroll}
          onJumpToLatest={() => scrollToLatest("smooth")}
        />
      ) : null}
      <ChatbotLauncher
        open={open}
        unreadCount={unreadCount}
        buttonRef={launcherRef}
        onOpen={openPanel}
      />
    </aside>
  );
}
