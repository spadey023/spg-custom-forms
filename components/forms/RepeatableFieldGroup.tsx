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
  defaultValues = {},
}: {
  groupName: string;
  fields: FieldDef[];
  addLabel: string;
  defaultValues?: Record<string, string>;
}) {
  const initialRowIds = Object.keys(defaultValues)
    .filter((name) => name.startsWith(`${groupName}[`))
    .map((name) => Number(name.match(/\[(\d+)\]/)?.[1]))
    .filter((rowId) => Number.isInteger(rowId));
  const rowIdsFromValues = [...new Set(initialRowIds)].sort((a, b) => a - b);
  const startingRowIds = rowIdsFromValues.length ? rowIdsFromValues : [0];
  const [rowIds, setRowIds] = useState<number[]>(startingRowIds);
  const [nextId, setNextId] = useState(Math.max(...startingRowIds) + 1);

  return (
    <div className="flex flex-col gap-3">
      {rowIds.map((rowId) => (
        <div
          key={rowId}
          className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:grid-cols-2"
        >
          {fields.map((field) => (
            <label
              key={field.name}
              className="flex flex-col gap-1.5 text-sm"
              htmlFor={`${groupName}-${rowId}-${field.name}`}
            >
              <span className="font-medium text-slate-700">{field.label}</span>
              <input
                id={`${groupName}-${rowId}-${field.name}`}
                type={field.type ?? "text"}
                name={`${groupName}[${rowId}].${field.name}`}
                defaultValue={defaultValues[`${groupName}[${rowId}].${field.name}`]}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
              />
            </label>
          ))}
          {rowIds.length > 1 && (
            <button
              type="button"
              onClick={() => setRowIds((rows) => rows.filter((id) => id !== rowId))}
              className="justify-self-start text-sm text-red-600 hover:text-red-700 hover:underline sm:col-span-2"
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
        className="self-start text-sm font-medium text-blue-800 hover:text-blue-950 hover:underline"
      >
        {addLabel}
      </button>
    </div>
  );
}
