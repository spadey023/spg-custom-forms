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
    <label htmlFor={name} className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">
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
        className={`rounded-md border px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 ${error ? "border-red-500" : "border-gray-300"}`}
      />
      <span id={`${name}-count`} className="text-xs text-gray-500">
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
