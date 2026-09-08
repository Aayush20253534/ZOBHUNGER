import { Fragment, type CSSProperties, type ReactNode } from "react";
import "@/styles/execution-storytelling.css";

interface ExecutionExplorerProps {
  id: string;
  label: string;
  items: readonly { id: string; label: string; content: ReactNode }[];
}

export function ExecutionExplorer({ id, label, items }: ExecutionExplorerProps) {
  if (items.length === 0) return null;
  if (items.length === 1) return <>{items[0].content}</>;

  return (
    <fieldset
      className="zb-execution-explorer"
      data-count={items.length}
      style={{ "--zb-explorer-count": items.length } as CSSProperties}
    >
      <legend className="sr-only">{label}</legend>
      {/* Native radios provide touch and arrow-key selection without hydration.
          The adjacent panel selector also works without :has() support. */}
      {items.map((item, index) => {
        const choiceId = `${id}-${item.id}`;

        return (
          <Fragment key={item.id}>
            <input
              className="zb-execution-explorer-input"
              type="radio"
              name={id}
              id={choiceId}
              defaultChecked={index === 0}
              aria-controls={`${choiceId}-panel`}
            />
            <label
              className="zb-execution-explorer-choice"
              id={`${choiceId}-label`}
              htmlFor={choiceId}
            >
              <span aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              {item.label}
            </label>
            <div
              className="zb-execution-explorer-panel"
              id={`${choiceId}-panel`}
              role="region"
              aria-labelledby={`${choiceId}-label`}
            >
              {item.content}
            </div>
          </Fragment>
        );
      })}
    </fieldset>
  );
}
