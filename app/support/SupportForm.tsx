"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitSupportForm, type SupportFormState } from "./actions";
import { FormField } from "@/components/forms/FormField";
import { CharCounterTextarea } from "@/components/forms/CharCounterTextarea";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusMessage } from "@/components/forms/FormStatusMessage";

const initialState: SupportFormState = { status: "idle" };

export function SupportForm({ portal, portalName }: { portal: string; portalName: string }) {
  const [state, formAction] = useActionState(submitSupportForm, initialState);
  const submittedValues = useRef<Record<string, string>>({});
  const [restoreKey, setRestoreKey] = useState(0);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "error") setRestoreKey((key) => key + 1);
  }, [state.fieldErrors, state.status]);

  if (state.status === "success" && state.message) {
    return (
      <div className="flex flex-col gap-3">
        <FormStatusMessage status="success" message={state.message} />
        {state.caseReference && (
          <p className="text-sm text-slate-700">
            Case reference number: <span className="font-mono font-semibold">{state.caseReference}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      key={restoreKey}
      action={formAction}
      onSubmit={(event) => {
        const values: Record<string, string> = {};
        new FormData(event.currentTarget).forEach((value, name) => {
          if (typeof value === "string") values[name] = value;
        });
        submittedValues.current = values;
      }}
      className="flex flex-col gap-6"
    >
      {state.status === "error" && state.message && (
        <FormStatusMessage status="error" message={state.message} />
      )}

      <input type="hidden" name="portal" value={portal} />

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 className="text-base font-semibold text-slate-950">Your information</h2>
          <span className="text-xs text-slate-400">01</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="firstName"
            label="First Name"
            required
            defaultValue={submittedValues.current.firstName}
            error={errors.firstName}
          />
          <FormField
            name="lastName"
            label="Last Name"
            required
            defaultValue={submittedValues.current.lastName}
            error={errors.lastName}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="email"
            label="Email"
            type="email"
            required
            defaultValue={submittedValues.current.email}
            error={errors.email}
          />
          <FormField
            name="portalName"
            label="Portal Name"
            required
            defaultValue={submittedValues.current.portalName ?? portalName}
            error={errors.portalName}
          />
        </div>
      </section>
      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 className="text-base font-semibold text-slate-950">How can we help?</h2>
          <span className="text-xs text-slate-400">02</span>
        </div>
        <CharCounterTextarea
          name="description"
          label="Description"
          maxLength={500}
          required
          defaultValue={submittedValues.current.description}
          error={errors.description}
        />
      </section>

      <SubmitButton label="Submit Request" />
    </form>
  );
}
