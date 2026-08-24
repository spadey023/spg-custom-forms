"use client";

import { useActionState } from "react";
import { submitAppointmentForm, type AppointmentFormState } from "./actions";
import { FormField, FileField } from "@/components/forms/FormField";
import { CharCounterTextarea } from "@/components/forms/CharCounterTextarea";
import { RepeatableFieldGroup } from "@/components/forms/RepeatableFieldGroup";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusMessage } from "@/components/forms/FormStatusMessage";

const initialState: AppointmentFormState = { status: "idle" };

export function AppointmentForm({ portal }: { portal: string }) {
  const [state, formAction] = useActionState(submitAppointmentForm, initialState);
  const errors = state.fieldErrors ?? {};

  if (state.status === "success" && state.message) {
    return <FormStatusMessage status="success" message={state.message} />;
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {state.status === "error" && state.message && (
        <FormStatusMessage status="error" message={state.message} />
      )}

      <input type="hidden" name="portal" value={portal} />

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-900">Agency information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField name="agencyName" label="Agency Name" required error={errors.agencyName} />
          <FormField
            name="contactEmail"
            label="Contact Email"
            type="email"
            required
            error={errors.contactEmail}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-900">File uploads</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FileField name="eno" label="Copy of E&O" required error={errors.eno} />
          <FileField name="w9" label="W9" required error={errors.w9} />
          <FileField name="stateLicense" label="State License" required error={errors.stateLicense} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-900">Other office locations</h2>
        <RepeatableFieldGroup
          groupName="officeLocations"
          addLabel="+ Add another office location"
          fields={[
            { name: "address", label: "Address" },
            { name: "city", label: "City" },
            { name: "state", label: "State" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-900">Portal administrator contact</h2>
        <RepeatableFieldGroup
          groupName="portalAdminContacts"
          addLabel="+ Add another contact"
          fields={[
            { name: "name", label: "Name" },
            { name: "title", label: "Title" },
            { name: "phone", label: "Phone", type: "tel" },
            { name: "email", label: "Email", type: "email" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-900">Additional information</h2>
        <CharCounterTextarea name="additionalInfo" label="Additional information (optional)" maxLength={500} />
      </section>

      <SubmitButton label="Submit Request" />
    </form>
  );
}
