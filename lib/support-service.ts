import { z } from "zod";
import { sendExchangeMail } from "@/lib/mailer";
import { getPortalDisplayName } from "@/lib/portals";
import { generateCaseReference } from "@/lib/case-ref";

/**
 * Contact Support submission logic (solution doc §4.1/§4.2): generate a case
 * reference, build the email, send via Exchange. Shared by the `/support`
 * page's Server Action (app/support/actions.ts) and the literal
 * `/api/support` route handler (app/api/support/route.ts) shown in the
 * doc's architecture diagram — one implementation, two entry points.
 */

const supportFieldsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  portalName: z.string().trim().min(1, "Portal name is required."),
  description: z
    .string()
    .trim()
    .min(1, "Please describe the issue.")
    .max(500, "Description must be 500 characters or fewer."),
});

export type SupportSubmissionResult =
  | { ok: true; message: string; caseReference: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function processSupportSubmission(formData: FormData): Promise<SupportSubmissionResult> {
  const portalSlug = String(formData.get("portal") ?? "");
  const parsed = supportFieldsSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    portalName: formData.get("portalName") || getPortalDisplayName(portalSlug),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      message: "Please correct the highlighted fields and try again.",
      fieldErrors,
    };
  }

  const { firstName, lastName, email, portalName, description } = parsed.data;
  const caseReference = generateCaseReference();
  const timestamp = new Date().toLocaleString("en-US");
  // Base format per solution doc §4.3; case reference prefix added per §4.4
  // ("Included in the email subject, email body, and returned to the client").
  const subject = `[${caseReference}] ${portalName} ${email} Access Issue ${timestamp}`;

  const bodyLines = [
    `Case Reference: ${caseReference}`,
    `Name: ${firstName} ${lastName}`,
    `Email: ${email}`,
    `Portal: ${portalName}`,
    "",
    "Description:",
    description,
  ];

  try {
    await sendExchangeMail({
      to: process.env.SUPPORT_RECIPIENT || "spgportaladmin@specialtyprogramgroup.com",
      subject,
      text: bodyLines.join("\n"),
      replyTo: email,
    });
  } catch (error) {
    console.error("[support] failed to send email", error);
    return {
      ok: false,
      message: "We could not submit your request due to a system error. Please try again shortly.",
    };
  }

  return {
    ok: true,
    caseReference,
    message:
      "Thank you for contacting SPG Support. Your request has been submitted successfully. Our support team will review your issue and follow up by email.",
  };
}
