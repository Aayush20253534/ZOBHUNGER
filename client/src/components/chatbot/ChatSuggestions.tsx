import { Briefcase, Handshake, Search, ShieldCheck, type LucideIcon } from "lucide-react";

interface Suggestion {
  label: string;
  prompt: string;
  icon: LucideIcon;
}

const suggestions: Suggestion[] = [
  {
    label: "Hire workforce",
    prompt: "How can I hire workforce through ZOBHUNGER?",
    icon: Briefcase,
  },
  {
    label: "Find work",
    prompt: "How can I find and apply for jobs through ZOBHUNGER?",
    icon: Search,
  },
  {
    label: "Become a vendor",
    prompt: "How can my company become an empanelled ZOBHUNGER vendor?",
    icon: Handshake,
  },
  {
    label: "Verification services",
    prompt: "What verification services does ZOBHUNGER provide?",
    icon: ShieldCheck,
  },
];

interface ChatSuggestionsProps {
  disabled: boolean;
  onSelect: (prompt: string) => void;
}

export function ChatSuggestions({ disabled, onSelect }: ChatSuggestionsProps) {
  return (
    <div className="zb-chatbot-suggestions" aria-label="Suggested questions">
      <p>Popular questions</p>
      <div className="zb-chatbot-suggestion-grid">
        {suggestions.map(({ label, prompt, icon: Icon }) => (
          <button
            type="button"
            key={label}
            disabled={disabled}
            onClick={() => onSelect(prompt)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
