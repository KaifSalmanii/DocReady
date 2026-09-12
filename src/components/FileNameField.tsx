"use client";

import React, { useCallback, useId, useState } from "react";
import { Pencil, Shuffle, AlertCircle } from "lucide-react";
import { sanitizeFileName } from "@/lib/filename";
import { cn } from "@/lib/utils";

/** Sanitizes while typing, but lets the field be emptied (unlike sanitizeFileName). */
function sanitizePartial(value: string): string {
  return value
    .replace(/[\s]+/g, "-")
    .replace(/[\\/:*?"'<>|]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^\./, "");
}

export interface FileNameFieldProps {
  /** Current name without the extension. */
  value: string;
  /** Extension shown locked at the end of the field (no dot). */
  extension: string;
  onChange: (stem: string) => void;
  /** Called to swap in a brand new random name. */
  onRandomize: () => void;
  label?: string;
  hint?: string;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

/**
 * Rename box for every file DocReady produces.
 * Spaces are refused (they collapse into "-"), the extension is locked,
 * and the Shuffle button rolls a fresh random name.
 */
export default function FileNameField({
  value,
  extension,
  onChange,
  onRandomize,
  label = "File name / फ़ाइल का नाम",
  hint = "Random by default — rename it if you want. Spaces are not allowed.",
  size = "md",
  className,
  disabled,
}: FileNameFieldProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(sanitizePartial(e.target.value));
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    setFocused(false);
    if (!value.trim()) onChange(sanitizeFileName(""));
  }, [onChange, value]);

  const invalid = value.trim().length === 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-[11px] font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5"
        >
          <Pencil className="h-3 w-3 text-[#FF9933]" />
          {label}
        </label>
        <button
          type="button"
          onClick={onRandomize}
          className="text-[11px] font-bold text-[#FF9933] hover:text-[#e8872d] inline-flex items-center gap-1 transition-colors"
          title="Generate a new random name"
        >
          <Shuffle className="h-3 w-3" />
          Random name
        </button>
      </div>

      <div
        className={cn(
          "flex items-stretch rounded-xl border-2 bg-white transition-colors",
          focused ? "border-[#FF9933]" : "border-slate-200",
          invalid && "border-red-300"
        )}
      >
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          disabled={disabled}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          aria-invalid={invalid}
          placeholder="name-without-spaces"
          className={cn(
            "flex-1 min-w-0 bg-transparent px-3 font-mono text-slate-800 placeholder:text-slate-300 focus:outline-none disabled:opacity-60",
            size === "sm" ? "py-1.5 text-xs" : "py-2.5 text-sm"
          )}
        />
        <span
          className={cn(
            "flex items-center px-3 rounded-r-[10px] bg-slate-100 border-l border-slate-200 font-mono text-slate-500 select-none",
            size === "sm" ? "text-xs py-1.5" : "text-sm py-2.5"
          )}
          title="Extension is fixed by the output format"
        >
          .{extension}
        </span>
      </div>

      <p
        className={cn(
          "text-[11px] leading-snug flex items-start gap-1",
          invalid ? "text-red-500" : "text-slate-400"
        )}
      >
        {invalid ? (
          <>
            <AlertCircle className="h-3 w-3 mt-px shrink-0" />
            Name can&rsquo;t be blank — a random name will be used.
          </>
        ) : (
          hint
        )}
      </p>
    </div>
  );
}
