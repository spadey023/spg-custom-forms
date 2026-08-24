"use client";

import { useActionState } from "react";
import { submitSupportForm, type SupportFormState } from "./actions";
import { FormField } from "@/components/forms/FormField";
import { CharCounterTextarea } from "@/components/forms/CharCounterTextarea";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusMessage } from "@/components/forms/FormStatusMessage";

const initialState: SupportFormState = { status: "idle" };

export function SupportForm({ portal, portalName }: { portal: string; portalName: string }) {
  const [state, formAction] = useActionState(submitSupportForm, initialState);
  const errors = state.fieldErrors ?? {};

  if (state.status === "success" && state.message) {
    return (
      <div className="flex flex-col gap-3">
        <FormStatusMessage status="success" message={state.message} />
        {state.caseReference && (
          <p className="text-sm text-gray-700">
            Case reference number: <span className="font-mono font-semibold">{state.caseReference}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.status === "error" && state.message && (
        <FormStatusMessage status="error" message={state.message} />
      )}

      <input type="hidden" name="portal" value={portal} />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="firstName" label="First Name" required error={errors.firstName} />
        <FormField name="lastName" label="Last Name" required error={errors.lastName} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="email" label="Email" type="email" required error={errors.email} />
        <FormField
          name="portalName"
          label="Portal Name"
          required
          defaultValue={portalName}
          error={errors.portalName}
        />
      </div>
      <CharCounterTextarea
        name="description"
        label="Description"
        maxLength={500}
        required
        error={errors.description}
      />

      <SubmitButton label="Submit Request" />
    </form>
  );
}
