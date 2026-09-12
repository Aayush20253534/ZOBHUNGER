import {
  Briefcase,
  Building2,
  FileText,
  Handshake,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ChatbotSuggestion, ChatbotSuggestionIcon } from "@/lib/chatbot-suggestions";

const suggestionIcons: Record<ChatbotSuggestionIcon, LucideIcon> = {
  briefcase: Briefcase,
  search: Search,
  handshake: Handshake,
  shield: ShieldCheck,
  building: Building2,
  file: FileText,
  users: Users,
  map: MapPin,
  mail: Mail,
  sparkles: Sparkles,
};

interface ChatSuggestionsProps {
  title?: string;
  suggestions: ChatbotSuggestion[];
  disabled: boolean;
  compact?: boolean;
  onSelect: (prompt: string) => void;
}

export function ChatSuggestions({
  title = "Popular questions",
  suggestions,
  disabled,
  compact = false,
  onSelect,
}: ChatSuggestionsProps) {
  if (!suggestions.length) return null;

  return (
    <div className={`zb-chatbot-suggestions${compact ? " zb-chatbot-suggestions--compact" : ""}`} aria-label={title}>
      <p>{title}</p>
      <div className="zb-chatbot-suggestion-grid">
        {suggestions.map(({ label, prompt, icon }) => {
          const Icon = suggestionIcons[icon];
          return (
            <button
              type="button"
              key={`${label}:${prompt}`}
              disabled={disabled}
              onClick={() => onSelect(prompt)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
