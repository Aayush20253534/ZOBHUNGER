import { Fragment, type ReactNode } from "react";

interface ChatbotRichTextProps {
  content: string;
}

const INLINE_PATTERN = /(\*\*.+?\*\*|`[^`]+`)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE_PATTERN).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }

    return <Fragment key={key}>{part}</Fragment>;
  });
}

interface ListItem {
  text: string;
  indent: number;
  value?: number;
}

function leadingIndent(value: string): number {
  const spaces = value.match(/^\s*/)?.[0].replace(/\t/g, "    ").length ?? 0;
  return Math.min(Math.floor(spaces / 2), 2);
}

export function ChatbotRichText({ content }: ChatbotRichTextProps) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let unordered: ListItem[] = [];
  let ordered: ListItem[] = [];
  let blockIndex = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.map((line) => line.trim()).filter(Boolean).join(" ");
    if (text) {
      const key = `p-${blockIndex++}`;
      blocks.push(<p key={key}>{renderInline(text, key)}</p>);
    }
    paragraph = [];
  };

  const flushUnordered = () => {
    if (!unordered.length) return;
    const key = `ul-${blockIndex++}`;
    blocks.push(
      <ul key={key}>
        {unordered.map((item, index) => (
          <li key={`${key}-${index}`} data-indent={item.indent || undefined}>
            {renderInline(item.text, `${key}-${index}`)}
          </li>
        ))}
      </ul>,
    );
    unordered = [];
  };

  const flushOrdered = () => {
    if (!ordered.length) return;
    const key = `ol-${blockIndex++}`;
    blocks.push(
      <ol key={key}>
        {ordered.map((item, index) => (
          <li key={`${key}-${index}`} data-indent={item.indent || undefined} value={item.value}>
            {renderInline(item.text, `${key}-${index}`)}
          </li>
        ))}
      </ol>,
    );
    ordered = [];
  };

  const flushLists = () => {
    flushUnordered();
    flushOrdered();
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (!line.trim()) {
      flushParagraph();
      flushLists();
      continue;
    }

    const heading = line.match(/^\s*(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushLists();
      const key = `h-${blockIndex++}`;
      blocks.push(
        <h3 key={key} data-level={heading[1].length}>
          {renderInline(heading[2], key)}
        </h3>,
      );
      continue;
    }

    const orderedMatch = line.match(/^(\s*)(\d+)[.)]\s+(.+)$/);
    if (orderedMatch) {
      flushParagraph();
      flushUnordered();
      ordered.push({
        text: orderedMatch[3],
        indent: leadingIndent(orderedMatch[1]),
        value: Number(orderedMatch[2]),
      });
      continue;
    }

    const unorderedMatch = line.match(/^(\s*)[-*•]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushOrdered();
      unordered.push({ text: unorderedMatch[2], indent: leadingIndent(unorderedMatch[1]) });
      continue;
    }

    flushLists();
    paragraph.push(line);
  }

  flushParagraph();
  flushLists();

  return <div className="zb-chatbot-rich-text">{blocks}</div>;
}
