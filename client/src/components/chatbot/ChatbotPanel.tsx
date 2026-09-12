"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
  type UIEvent,
} from "react";
import {
  ArrowDown,
  Bot,
  MoreVertical,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { ChatbotUiMessage } from "@/lib/chatbot";
import type { ChatbotSuggestion } from "@/lib/chatbot-suggestions";
import { ChatMessage } from "./ChatMessage";
import { ChatSuggestions } from "./ChatSuggestions";

interface ChatbotPanelProps {
  messages: ChatbotUiMessage[];
  draft: string;
  loading: boolean;
  error: string | null;
  retryAvailable: boolean;
  starterSuggestions: ChatbotSuggestion[];
  followUpSuggestions: ChatbotSuggestion[];
  showStarterSuggestions: boolean;
  showFollowUpSuggestions: boolean;
  copiedMessageId: string | null;
  showJumpToLatest: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  bodyRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onSuggestion: (prompt: string) => void;
  onRetry: () => void;
  onCopyMessage: (message: ChatbotUiMessage) => void;
  onNewChat: () => void;
  onClearHistory: () => void;
  onBodyScroll: (event: UIEvent<HTMLDivElement>) => void;
  onJumpToLatest: () => void;
}

export function ChatbotPanel({
  messages,
  draft,
  loading,
  error,
  retryAvailable,
  starterSuggestions,
  followUpSuggestions,
  showStarterSuggestions,
  showFollowUpSuggestions,
  copiedMessageId,
  showJumpToLatest,
  messagesEndRef,
  bodyRef,
  inputRef,
  onDraftChange,
  onClose,
  onSubmit,
  onSuggestion,
  onRetry,
  onCopyMessage,
  onNewChat,
  onClearHistory,
  onBodyScroll,
  onJumpToLatest,
}: ChatbotPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  const handleDraftChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    onDraftChange(textarea.value);
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 112)}px`;
  };

  return (
    <section
      className="zb-chatbot-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="zb-chatbot-title"
      aria-describedby="zb-chatbot-subtitle"
    >
      <header className="zb-chatbot-header">
        <div className="zb-chatbot-header-mark" aria-hidden="true">
          <Bot />
        </div>
        <div className="zb-chatbot-header-copy">
          <div className="zb-chatbot-title-row">
            <h2 id="zb-chatbot-title">ZOBHUNGER Assistant</h2>
            <span><i aria-hidden="true" />Public info</span>
          </div>
          <p id="zb-chatbot-subtitle">Website-grounded assistance · chat saved on this device</p>
        </div>

        <div className="zb-chatbot-header-actions">
          <div className="zb-chatbot-menu" ref={menuRef}>
            <button
              type="button"
              className="zb-chatbot-header-button"
              aria-label="Chat options"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <MoreVertical aria-hidden="true" />
            </button>
            {menuOpen ? (
              <div className="zb-chatbot-menu-popover" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onNewChat();
                  }}
                >
                  <Plus aria-hidden="true" />
                  <span><strong>New chat</strong><small>Start a fresh conversation</small></span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onClearHistory();
                  }}
                >
                  <Trash2 aria-hidden="true" />
                  <span><strong>Clear history</strong><small>Remove saved conversation</small></span>
                </button>
              </div>
            ) : null}
          </div>
          <button type="button" className="zb-chatbot-header-button" onClick={onClose} aria-label="Minimize chatbot">
            <X aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        ref={bodyRef}
        className="zb-chatbot-body"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        onScroll={onBodyScroll}
      >
        <div className="zb-chatbot-context-note">
          <span>Official website assistant</span>
          <p>Answers use ZOBHUNGER&apos;s public knowledge. For final commercial or hiring decisions, use the relevant website form or team contact.</p>
        </div>

        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            copied={copiedMessageId === message.id}
            onCopy={onCopyMessage}
          />
        ))}

        {showStarterSuggestions ? (
          <ChatSuggestions
            suggestions={starterSuggestions}
            disabled={loading}
            onSelect={onSuggestion}
          />
        ) : null}

        {showFollowUpSuggestions ? (
          <ChatSuggestions
            title="Continue with"
            suggestions={followUpSuggestions}
            disabled={loading}
            compact
            onSelect={onSuggestion}
          />
        ) : null}

        {loading ? (
          <div className="zb-chatbot-message zb-chatbot-message--assistant" aria-label="ZOBHUNGER Assistant is responding">
            <span className="zb-chatbot-message-avatar" aria-hidden="true"><Bot /></span>
            <div className="zb-chatbot-bubble zb-chatbot-typing" role="status">
              <span /><span /><span />
              <em>Searching ZOBHUNGER knowledge</em>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="zb-chatbot-error" role="alert">
            <strong>Couldn&apos;t send that message.</strong>
            <span>{error}</span>
            {retryAvailable ? (
              <button type="button" onClick={onRetry} disabled={loading}>
                <RotateCcw aria-hidden="true" /> Retry
              </button>
            ) : null}
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {showJumpToLatest ? (
        <button type="button" className="zb-chatbot-jump-latest" onClick={onJumpToLatest}>
          <ArrowDown aria-hidden="true" />
          Latest
        </button>
      ) : null}

      <form className="zb-chatbot-composer" onSubmit={submit}>
        <label htmlFor="zb-chatbot-input" className="sr-only">Ask ZOBHUNGER</label>
        <div className="zb-chatbot-input-wrap">
          <textarea
            ref={inputRef}
            id="zb-chatbot-input"
            value={draft}
            maxLength={2000}
            rows={1}
            disabled={loading}
            placeholder="Ask about ZOBHUNGER..."
            onChange={handleDraftChange}
            onKeyDown={handleKeyDown}
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            aria-label="Send message"
          >
            <Send aria-hidden="true" />
          </button>
        </div>
        <div className="zb-chatbot-composer-meta">
          <span>Enter to send · Shift + Enter for a new line</span>
          <span>{draft.length}/2000</span>
        </div>
      </form>
    </section>
  );
}
