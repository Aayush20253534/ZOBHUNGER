import Link from "next/link";
import { Fragment, type ReactNode } from "react";

interface ChatbotRichTextProps {
  content: string;
}

const INLINE_PATTERN = /(\*\*[^*\n]+?\*\*|`[^`\n]+`|\[[^\]\n]+\]\((?:\/|https?:\/\/)[^)\s]+\)|\[S\d+\]|(?<![A-Za-z0-9])\/[A-Za-z0-9][A-Za-z0-9/_-]*(?:\?[A-Za-z0-9_=&%.-]+)?)/gi;
const CITATION_PATTERN = /^\[S\d+\]$/i;
const INTERNAL_ROUTE_PATTERN = /^\/[A-Za-z0-9][A-Za-z0-9/_-]*(?:\?[A-Za-z0-9_=&%.-]+)?$/;
const MARKDOWN_LINK_PATTERN = /^\[([^\]]+)\]\(((?:\/|https?:\/\/)[^)\s]+)\)$/i;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE_PATTERN).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`;

    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }

    if (CITATION_PATTERN.test(part)) {
      const citation = part.slice(1, -1).toUpperCase();
      return (
        <span key={key} className="zb-chatbot-inline-citation" title={`Verified source ${citation}`}>
          {citation}
        </span>
      );
    }

    const markdownLink = part.match(MARKDOWN_LINK_PATTERN);
    if (markdownLink) {
      const [, label, href] = markdownLink;
      if (href.startsWith("/")) {
        return <Link key={key} href={href} className="zb-chatbot-inline-link">{label}</Link>;
      }
      return (
        <a key={key} href={href} className="zb-chatbot-inline-link" target="_blank" rel="noreferrer">
          {label}
        </a>
      );
    }

    if (INTERNAL_ROUTE_PATTERN.test(part)) {
      return <Link key={key} href={part} className="zb-chatbot-inline-link zb-chatbot-inline-route">{part}</Link>;
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

function splitTableRow(value: string): string[] {
  let row = value.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|")) row = row.slice(0, -1);

  const cells: string[] = [];
  let current = "";
  let inCode = false;

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index];

    if (character === "\\" && row[index + 1] === "|") {
      current += "|";
      index += 1;
      continue;
    }

    if (character === "`") {
      inCode = !inCode;
      current += character;
      continue;
    }

    if (character === "|" && !inCode) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  cells.push(current.trim());
  return cells;
}

function isTableSeparator(value: string): boolean {
  if (!value.includes("|")) return false;
  const cells = splitTableRow(value);
  return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")));
}

function plainTableLabel(value: string): string {
  return value
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function renderTablePrimaryCell(value: string, keyPrefix: string): ReactNode {
  const cleaned = value.trim().replace(/^\*\*(.+)\*\*$/, "$1");
  const match = cleaned.match(/^(.+?)\s*\((.+)\)$/);

  if (!match) {
    return <span className="zb-chatbot-table-title-main">{renderInline(value, keyPrefix)}</span>;
  }

  const [, title, detail] = match;
  const detailText = detail
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <span className="zb-chatbot-table-title-main">{renderInline(title, `${keyPrefix}-title`)}</span>
      <span className="zb-chatbot-table-title-meta">{renderInline(detailText, `${keyPrefix}-meta`)}</span>
    </>
  );
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

  for (let lineIndex = 0; lineIndex < lines.length;) {
    const rawLine = lines[lineIndex];
    const line = rawLine.trimEnd();
    const nextLine = lines[lineIndex + 1]?.trimEnd();

    if (line.includes("|") && nextLine && isTableSeparator(nextLine)) {
      flushParagraph();
      flushLists();

      const headers = splitTableRow(line);
      const rows: string[][] = [];
      lineIndex += 2;

      while (lineIndex < lines.length) {
        const candidate = lines[lineIndex].trimEnd();
        if (!candidate.trim() || !candidate.includes("|")) break;

        const cells = splitTableRow(candidate);
        if (cells.length < 2) break;
        rows.push(headers.map((_, columnIndex) => cells[columnIndex] ?? ""));
        lineIndex += 1;
      }

      const key = `table-${blockIndex++}`;
      blocks.push(
        <div className="zb-chatbot-table-wrap" key={key}>
          <table>
            <thead>
              <tr>
                {headers.map((header, columnIndex) => (
                  <th scope="col" key={`${key}-head-${columnIndex}`}>
                    {renderInline(header, `${key}-head-${columnIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${key}-row-${rowIndex}`}>
                  {row.map((cell, columnIndex) => (
                    <td
                      key={`${key}-cell-${rowIndex}-${columnIndex}`}
                      data-label={plainTableLabel(headers[columnIndex] ?? "")}
                    >
                      <span className="zb-chatbot-table-value">
                        {columnIndex === 0
                          ? renderTablePrimaryCell(cell, `${key}-cell-${rowIndex}-${columnIndex}`)
                          : renderInline(cell, `${key}-cell-${rowIndex}-${columnIndex}`)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushLists();
      lineIndex += 1;
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
      lineIndex += 1;
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph();
      flushLists();
      blocks.push(<hr key={`hr-${blockIndex++}`} />);
      lineIndex += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      flushParagraph();
      flushLists();
      const quote: string[] = [];
      while (lineIndex < lines.length && /^\s*>\s?/.test(lines[lineIndex])) {
        quote.push(lines[lineIndex].replace(/^\s*>\s?/, "").trim());
        lineIndex += 1;
      }
      const key = `quote-${blockIndex++}`;
      blocks.push(<blockquote key={key}>{renderInline(quote.join(" "), key)}</blockquote>);
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
      lineIndex += 1;
      continue;
    }

    const unorderedMatch = line.match(/^(\s*)[-*•]\s+(.+)$/);
    if (unorderedMatch) {
      flushParagraph();
      flushOrdered();
      unordered.push({ text: unorderedMatch[2], indent: leadingIndent(unorderedMatch[1]) });
      lineIndex += 1;
      continue;
    }

    flushLists();
    paragraph.push(line);
    lineIndex += 1;
  }

  flushParagraph();
  flushLists();

  return <div className="zb-chatbot-rich-text">{blocks}</div>;
}
