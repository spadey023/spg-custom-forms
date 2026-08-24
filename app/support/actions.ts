"use server";

import { processSupportSubmission } from "@/lib/support-service";

export type SupportFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  caseReference?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitSupportForm(
  _prevState: SupportFormState,
  formData: FormData
): Promise<SupportFormState> {
  const result = await processSupportSubmission(formData);

  if (!result.ok) {
    return { status: "error", message: result.message, fieldErrors: result.fieldErrors };
  }
  return { status: "success", message: result.message, caseReference: result.caseReference };
}
