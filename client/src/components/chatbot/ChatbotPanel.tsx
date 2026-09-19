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
  MoreVertical,
  Plus,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import type { ChatbotAction, ChatbotAudience, ChatbotUiMessage } from "@/lib/chatbot";
import type { ChatbotSuggestion } from "@/lib/chatbot-suggestions";
import { ChatMessage } from "./ChatMessage";
import { ChatSuggestions } from "./ChatSuggestions";
import { ChatbotLeadForm } from "./ChatbotLeadForm";

interface ChatbotPanelProps {
  messages: ChatbotUiMessage[];
  draft: string;
  loading: boolean;
  showTyping: boolean;
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
  onAction: (action: ChatbotAction) => void;
  leadRequest: { audience: Exclude<ChatbotAudience, "UNKNOWN">; handover: boolean } | null;
  conversationId: string;
  currentPage?: string | null;
  onLeadBack: () => void;
  onLeadSubmitted: (message: string) => void;
}

export function ChatbotPanel({
  messages,
  draft,
  loading,
  showTyping,
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
  onAction,
  leadRequest,
  conversationId,
  currentPage,
  onLeadBack,
  onLeadSubmitted,
}: ChatbotPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [safetyNoticeOpen, setSafetyNoticeOpen] = useState(true);
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

  const continueFromSafetyNotice = () => {
    setSafetyNoticeOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
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
        <div className="zb-chatbot-header-mark" aria-hidden="true" />
        <div className="zb-chatbot-header-copy">
          <div className="zb-chatbot-title-row">
            <h2 id="zb-chatbot-title">Aarohi</h2>
            <span><i aria-hidden="true" />Public info</span>
          </div>
          <p id="zb-chatbot-subtitle">ZOBHUNGER assistant · verified knowledge</p>
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
                  className="zb-chatbot-menu-item"
                  aria-label="Start a new chatbot conversation"
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
                  className="zb-chatbot-menu-item zb-chatbot-menu-item--danger"
                  aria-label="Clear saved chatbot history"
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
        role={safetyNoticeOpen ? "region" : "log"}
        aria-label={safetyNoticeOpen ? "Important recruitment and payment safety notice" : undefined}
        aria-live={safetyNoticeOpen ? undefined : "polite"}
        aria-relevant="additions text"
        onScroll={onBodyScroll}
      >
        {safetyNoticeOpen ? (
          <div className="zb-chatbot-safety-notice">
            <div className="zb-chatbot-safety-hero">
              <span className="zb-chatbot-safety-icon" aria-hidden="true">
                <ShieldAlert />
              </span>
              <div>
                <span className="zb-chatbot-safety-eyebrow">Important safety notice</span>
                <h3>Stay alert to recruitment &amp; payment fraud</h3>
              </div>
            </div>

            <p className="zb-chatbot-safety-intro">
              Fraudsters sometimes impersonate recruiters or companies and use urgent payment requests or unofficial messages to pressure candidates. Before discussing jobs, payments, or personal details with anyone claiming to represent ZOBHUNGER, keep these safeguards in mind.
            </p>

            <div className="zb-chatbot-safety-list" aria-label="Fraud prevention safeguards">
              <div className="zb-chatbot-safety-item">
                <span aria-hidden="true">01</span>
                <div>
                  <strong>Pause before any payment</strong>
                  <p>Treat any request to pay for a job offer, interview, onboarding, or guaranteed employment as suspicious. Verify it through official ZOBHUNGER channels before paying anything.</p>
                </div>
              </div>
              <div className="zb-chatbot-safety-item">
                <span aria-hidden="true">02</span>
                <div>
                  <strong>Protect sensitive financial details</strong>
                  <p>Never share OTPs, UPI PINs, card PINs, passwords, or full banking credentials with a recruiter, agent, or chatbot.</p>
                </div>
              </div>
              <div className="zb-chatbot-safety-item">
                <span aria-hidden="true">03</span>
                <div>
                  <strong>Independently verify the sender</strong>
                  <p>If a message comes from an unknown number, personal email, or unofficial social account, confirm the person through ZOBHUNGER&apos;s official website or contact page.</p>
                </div>
              </div>
            </div>

            <div className="zb-chatbot-safety-callout">
              <ShieldCheck aria-hidden="true" />
              <p><strong>When in doubt, stop and verify.</strong> Do not make a payment or disclose sensitive financial information until you have independently confirmed the request.</p>
            </div>

            <div className="zb-chatbot-safety-actions">
              <button
                type="button"
                onClick={continueFromSafetyNotice}
                aria-label="Acknowledge safety notice and continue to Aarohi"
              >
                I understand
                <span>Continue to Aarohi</span>
              </button>
              <a href="/contact">Verify or report a suspicious request</a>
            </div>

            <p className="zb-chatbot-safety-footnote">
              Keep screenshots, phone numbers, payment requests, and other evidence if you need to report suspected fraud.
            </p>
          </div>
        ) : leadRequest ? (
          <ChatbotLeadForm
            audience={leadRequest.audience}
            handover={leadRequest.handover}
            conversationId={conversationId}
            sourcePath={currentPage}
            onBack={onLeadBack}
            onSubmitted={onLeadSubmitted}
          />
        ) : (<>
          <div className="zb-chatbot-context-note">
            <span>Aarohi · Verified ZOBHUNGER knowledge</span>
            <p>Answers are grounded in approved ZOBHUNGER knowledge. If verified information is unavailable, the assistant will say so and can route you to a person.</p>
            <small>Successful conversation history is saved on this device so you can continue where you left off.</small>
          </div>
          <div className="zb-chatbot-flow-row" aria-label="Choose enquiry type">
            <button type="button" disabled={loading} onClick={() => onSuggestion("I am a job seeker. Help me with the correct ZOBHUNGER job or worker process.")}>Jobs</button>
            <button type="button" disabled={loading} onClick={() => onSuggestion("I represent a business and need ZOBHUNGER workforce or execution support.")}>Business</button>
            <button type="button" disabled={loading} onClick={() => onSuggestion("I am a vendor or partner. Help me with the correct ZOBHUNGER partnership process.")}>Vendor / Partner</button>
            <button type="button" disabled={loading} onClick={() => onSuggestion("I have a general ZOBHUNGER enquiry.")}>General</button>
          </div>

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              copied={copiedMessageId === message.id}
              onCopy={onCopyMessage}
              onAction={onAction}
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

        {showTyping ? (
          <div className="zb-chatbot-message zb-chatbot-message--assistant" aria-label="Aarohi is responding">
            <span className="zb-chatbot-message-avatar" aria-hidden="true" />
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
        </>)}
      </div>

      {!safetyNoticeOpen && showJumpToLatest ? (
        <button type="button" className="zb-chatbot-jump-latest" onClick={onJumpToLatest}>
          <ArrowDown aria-hidden="true" />
          Latest
        </button>
      ) : null}

      {!leadRequest && !safetyNoticeOpen ? <form className="zb-chatbot-composer" onSubmit={submit}>
        <label htmlFor="zb-chatbot-input" className="sr-only">Ask Aarohi about ZOBHUNGER</label>
        <div className="zb-chatbot-input-wrap">
          <textarea
            ref={inputRef}
            id="zb-chatbot-input"
            value={draft}
            maxLength={2000}
            rows={1}
            disabled={loading}
            placeholder="Ask Aarohi about ZOBHUNGER..."
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
      </form> : null}
    </section>
  );
}
