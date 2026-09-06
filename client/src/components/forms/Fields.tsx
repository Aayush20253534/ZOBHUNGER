"use client";

import { useId, type ComponentProps, type ReactNode, type Ref } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FieldDescription {
  label: string;
  hint?: string;
  error?: string;
}

function FieldFrame({
  id,
  label,
  hint,
  error,
  required,
  children,
}: FieldDescription & { id: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="zb-field">
      <Label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </Label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="zb-field-note">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="zb-field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(
  id: string,
  hint?: string,
  error?: string,
  existing?: string,
) {
  return (
    [existing, hint && `${id}-hint`, error && `${id}-error`]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

export function TextField({
  label,
  hint,
  error,
  id,
  className,
  required,
  "aria-describedby": existingDescription,
  ...props
}: ComponentProps<typeof Input> & FieldDescription) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
    >
      <Input
        {...props}
        id={fieldId}
        required={required}
        className={cn("zb-input", className)}
        aria-invalid={Boolean(error) || props["aria-invalid"] || undefined}
        aria-describedby={describedBy(
          fieldId,
          hint,
          error,
          existingDescription,
        )}
      />
    </FieldFrame>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  id,
  className,
  required,
  "aria-describedby": existingDescription,
  ...props
}: ComponentProps<typeof Textarea> & FieldDescription) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
    >
      <Textarea
        {...props}
        id={fieldId}
        required={required}
        className={cn("zb-input", className)}
        aria-invalid={Boolean(error) || props["aria-invalid"] || undefined}
        aria-describedby={describedBy(
          fieldId,
          hint,
          error,
          existingDescription,
        )}
      />
    </FieldFrame>
  );
}

export interface SelectFieldProps extends FieldDescription {
  id?: string;
  name?: string;
  value?: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLButtonElement>;
  options: readonly { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function SelectField({
  label,
  hint,
  error,
  id,
  name,
  value,
  onValueChange,
  onBlur,
  inputRef,
  options,
  placeholder = "Select an option",
  required,
  disabled,
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const selectedLabel = options.find((option) => option.value === value)?.label;
  return (
    <FieldFrame
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
    >
      <Select
        name={name}
        value={value ?? ""}
        onValueChange={(nextValue: string | null) => {
          if (nextValue !== null) onValueChange(nextValue);
        }}
        required={required}
        disabled={disabled}
      >
        <SelectTrigger
          ref={inputRef}
          id={fieldId}
          className="zb-input"
          aria-required={required || undefined}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy(fieldId, hint, error)}
          onBlur={onBlur}
        >
          <SelectValue placeholder={placeholder}>
            {selectedLabel ?? placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldFrame>
  );
}
