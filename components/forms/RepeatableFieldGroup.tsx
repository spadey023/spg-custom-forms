"use client";

import { useState } from "react";

type FieldDef = { name: string; label: string; type?: string };

/**
 * Renders one-row-by-default, user-can-add-more sections (solution doc §5.1:
 * "Other office locations", "Portal administrator contact"). Inputs are
 * named `${groupName}[${rowId}].${field.name}` and reassembled server-side
 * by lib/form-data.ts#parseRepeatableGroup.
 */
export function RepeatableFieldGroup({
  groupName,
  fields,
  addLabel,
}: {
  groupName: string;
  fields: FieldDef[];
  addLabel: string;
}) {
  const [rowIds, setRowIds] = useState<number[]>([0]);
  const [nextId, setNextId] = useState(1);

  return (
    <div className="flex flex-col gap-3">
      {rowIds.map((rowId) => (
        <div
          key={rowId}
          className="grid gap-3 rounded-md border border-gray-200 p-4 sm:grid-cols-2"
        >
          {fields.map((field) => (
            <label
              key={field.name}
              className="flex flex-col gap-1 text-sm"
              htmlFor={`${groupName}-${rowId}-${field.name}`}
            >
              <span className="font-medium text-gray-700">{field.label}</span>
              <input
                id={`${groupName}-${rowId}-${field.name}`}
                type={field.type ?? "text"}
                name={`${groupName}[${rowId}].${field.name}`}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </label>
          ))}
          {rowIds.length > 1 && (
            <button
              type="button"
              onClick={() => setRowIds((rows) => rows.filter((id) => id !== rowId))}
              className="justify-self-start text-sm text-red-600 hover:underline sm:col-span-2"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          setRowIds((rows) => [...rows, nextId]);
          setNextId((n) => n + 1);
        }}
        className="self-start text-sm font-medium text-blue-700 hover:underline"
      >
        {addLabel}
      </button>
    </div>
  );
}
