"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitAppointmentForm, type AppointmentFormState } from "./actions";
import { FormField, FileField } from "@/components/forms/FormField";
import { CharCounterTextarea } from "@/components/forms/CharCounterTextarea";
import { RepeatableFieldGroup } from "@/components/forms/RepeatableFieldGroup";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusMessage } from "@/components/forms/FormStatusMessage";

const initialState: AppointmentFormState = { status: "idle" };

export function AppointmentForm({ portal }: { portal: string }) {
  const [state, formAction] = useActionState(submitAppointmentForm, initialState);
  const submittedValues = useRef<Record<string, string>>({});
  const [restoreKey, setRestoreKey] = useState(0);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "error") {
      setRestoreKey((key) => key + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.fieldErrors, state.status]);

  if (state.status === "success" && state.message) {
    return <FormStatusMessage status="success" message={state.message} />;
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
      className="flex flex-col gap-8"
    >
      {state.status === "error" && state.message && (
        <FormStatusMessage status="error" message={state.message} />
      )}

      <input type="hidden" name="portal" value={portal} />

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 className="text-lg font-semibold text-slate-950">Agency information</h2>
          <span className="text-xs text-slate-400">01</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="agencyName"
            label="Agency Name"
            required
            defaultValue={submittedValues.current.agencyName}
            error={errors.agencyName}
          />
          <FormField
            name="contactEmail"
            label="Contact Email"
            type="email"
            required
            defaultValue={submittedValues.current.contactEmail}
            error={errors.contactEmail}
          />
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 className="text-lg font-semibold text-slate-950">File uploads</h2>
          <span className="text-xs text-slate-400">02</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FileField name="eno" label="Copy of E&O" required error={errors.eno} />
          <FileField name="w9" label="W9" required error={errors.w9} />
          <FileField name="stateLicense" label="State License" required error={errors.stateLicense} />
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 className="text-lg font-semibold text-slate-950">Other office locations</h2>
          <span className="text-xs text-slate-400">03</span>
        </div>
        <RepeatableFieldGroup
          groupName="officeLocations"
          addLabel="+ Add another office location"
          defaultValues={submittedValues.current}
          fields={[
            { name: "address", label: "Address" },
            { name: "city", label: "City" },
            { name: "state", label: "State" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 className="text-lg font-semibold text-slate-950">Portal administrator contact</h2>
          <span className="text-xs text-slate-400">04</span>
        </div>
        <RepeatableFieldGroup
          groupName="portalAdminContacts"
          addLabel="+ Add another contact"
          defaultValues={submittedValues.current}
          fields={[
            { name: "name", label: "Name" },
            { name: "title", label: "Title" },
            { name: "phone", label: "Phone", type: "tel" },
            { name: "email", label: "Email", type: "email" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 className="text-lg font-semibold text-slate-950">Additional information</h2>
          <span className="text-xs text-slate-400">05</span>
        </div>
        <CharCounterTextarea
          name="additionalInfo"
          label="Additional information (optional)"
          maxLength={500}
          defaultValue={submittedValues.current.additionalInfo}
        />
      </section>

      <SubmitButton label="Submit Request" />
    </form>
  );
}
