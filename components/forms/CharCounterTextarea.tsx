"use client";

import { useState } from "react";

export function CharCounterTextarea({
  name,
  label,
  maxLength,
  required = false,
  defaultValue = "",
  error,
}: {
  name: string;
  label: string;
  maxLength: number;
  required?: boolean;
  defaultValue?: string;
  error?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <label htmlFor={name} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      <textarea
        id={name}
        name={name}
        rows={5}
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={`${name}-count${error ? ` ${name}-error` : ""}`}
        className={`rounded-lg border bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10 ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : "border-slate-300"}`}
      />
      <span id={`${name}-count`} className="text-xs text-slate-400">
        {value.length}/{maxLength} characters
      </span>
      {error && (
        <span id={`${name}-error`} className="text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
