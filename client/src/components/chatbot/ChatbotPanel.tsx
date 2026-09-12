import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { Bot, Send, X } from "lucide-react";
import { ChatMessage, type ChatbotUiMessage } from "./ChatMessage";
import { ChatSuggestions } from "./ChatSuggestions";

interface ChatbotPanelProps {
  messages: ChatbotUiMessage[];
  draft: string;
  loading: boolean;
  error: string | null;
  showSuggestions: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onSuggestion: (prompt: string) => void;
}

export function ChatbotPanel({
  messages,
  draft,
  loading,
  error,
  showSuggestions,
  messagesEndRef,
  inputRef,
  onDraftChange,
  onClose,
  onSubmit,
  onSuggestion,
}: ChatbotPanelProps) {
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
          <p id="zb-chatbot-subtitle">Services, jobs, partnerships & company information</p>
        </div>
        <button type="button" className="zb-chatbot-close" onClick={onClose} aria-label="Close chatbot">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className="zb-chatbot-body" role="log" aria-live="polite" aria-relevant="additions text">
        <div className="zb-chatbot-context-note">
          <span>Official website assistant</span>
          <p>Answers are grounded in ZOBHUNGER&apos;s public website knowledge.</p>
        </div>

        {messages.map((message) => <ChatMessage key={message.id} message={message} />)}

        {showSuggestions ? (
          <ChatSuggestions disabled={loading} onSelect={onSuggestion} />
        ) : null}

        {loading ? (
          <div className="zb-chatbot-message zb-chatbot-message--assistant" aria-label="ZOBHUNGER Assistant is responding">
            <span className="zb-chatbot-message-avatar" aria-hidden="true"><Bot /></span>
            <div className="zb-chatbot-bubble zb-chatbot-typing" role="status">
              <span /><span /><span />
              <em>ZOBHUNGER Assistant is thinking</em>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="zb-chatbot-error" role="alert">
            <strong>Couldn&apos;t send that message.</strong>
            <span>{error}</span>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

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
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onDraftChange(event.target.value)}
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
