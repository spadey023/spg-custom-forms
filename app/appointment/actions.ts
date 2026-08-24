"use server";

import { processAppointmentSubmission } from "@/lib/appointment-service";

export type AppointmentFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitAppointmentForm(
  _prevState: AppointmentFormState,
  formData: FormData
): Promise<AppointmentFormState> {
  const result = await processAppointmentSubmission(formData);

  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors };
  }
  return { status: "success", message: result.message };
}
