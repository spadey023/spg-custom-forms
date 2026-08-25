import { z } from "zod";
import { sendExchangeMail, type MailAttachment } from "@/lib/mailer";
import { getPortalDisplayName } from "@/lib/portals";
import { validateRequiredAttachment } from "@/lib/file-validation";
import { parseRepeatableGroup } from "@/lib/form-data";

/**
 * Producer Appointment submission logic (solution doc §4.1/§4.2): validate
 * input, build the email, send via Exchange. Shared by the `/appointment`
 * page's Server Action (app/appointment/actions.ts) and the literal
 * `/api/appointment` route handler (app/api/appointment/route.ts) shown in
 * the doc's architecture diagram — one implementation, two entry points.
 */

const appointmentFieldsSchema = z.object({
  agencyName: z.string().trim().min(1, "Agency name is required."),
  contactEmail: z.string().trim().min(1, "Contact email is required.").email("Enter a valid email address."),
  additionalInfo: z
    .string()
    .trim()
    .max(500, "Additional information must be 500 characters or fewer."),
  portal: z.string().trim(),
});

export type AppointmentSubmissionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

async function toAttachment(file: File): Promise<MailAttachment> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return {
    filename: file.name || "attachment",
    content: buffer,
    contentType: file.type || "application/octet-stream",
  };
}

export async function processAppointmentSubmission(
  formData: FormData
): Promise<AppointmentSubmissionResult> {
  const parsed = appointmentFieldsSchema.safeParse({
    agencyName: formData.get("agencyName"),
    contactEmail: formData.get("contactEmail"),
    additionalInfo: formData.get("additionalInfo") ?? "",
    portal: formData.get("portal") ?? "",
  });

  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
  }

  const eno = formData.get("eno");
  const w9 = formData.get("w9");
  const stateLicense = formData.get("stateLicense");

  const enoFile = eno instanceof File ? eno : null;
  const w9File = w9 instanceof File ? w9 : null;
  const licenseFile = stateLicense instanceof File ? stateLicense : null;

  const enoError = validateRequiredAttachment(enoFile, "Copy of E&O");
  const w9Error = validateRequiredAttachment(w9File, "W9");
  const licenseError = validateRequiredAttachment(licenseFile, "State License");
  if (enoError) fieldErrors.eno = enoError;
  if (w9Error) fieldErrors.w9 = w9Error;
  if (licenseError) fieldErrors.stateLicense = licenseError;

  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Please correct the highlighted fields and try again.",
      fieldErrors,
    };
  }

  const { agencyName, contactEmail, additionalInfo, portal } = parsed.data;

  const officeLocations = parseRepeatableGroup(formData, "officeLocations", [
    "address",
    "city",
    "state",
  ]);
  const portalAdminContacts = parseRepeatableGroup(formData, "portalAdminContacts", [
    "name",
    "title",
    "phone",
    "email",
  ]);

  const attachments = await Promise.all([
    toAttachment(enoFile as File),
    toAttachment(w9File as File),
    toAttachment(licenseFile as File),
  ]);

  const portalName = getPortalDisplayName(portal);
  const systemDate = new Date().toLocaleDateString("en-US");
  const subject = `[${agencyName}] New Producer Appointment Request - ${systemDate}`;

  const bodyLines = [
    `Agency Name: ${agencyName}`,
    `Contact Email: ${contactEmail}`,
    `Portal: ${portalName}`,
    "",
    "Other Office Locations:",
    officeLocations.length
      ? officeLocations
          .map((r, i) => `  ${i + 1}. ${r.address || "-"}, ${r.city || "-"}, ${r.state || "-"}`)
          .join("\n")
      : "  (none provided)",
    "",
    "Portal Administrator Contacts:",
    portalAdminContacts.length
      ? portalAdminContacts
          .map(
            (r, i) =>
              `  ${i + 1}. ${r.name || "-"} — ${r.title || "-"}, ${r.phone || "-"}, ${r.email || "-"}`
          )
          .join("\n")
      : "  (none provided)",
    "",
    "Additional Information:",
    additionalInfo || "(none provided)",
  ];

  try {
    await sendExchangeMail({
      to: process.env.APPOINTMENTS_RECIPIENT || "spgappointments@specialtyprogramgroup.com",
      subject,
      text: bodyLines.join("\n"),
      replyTo: contactEmail,
      attachments,
    });
  } catch (error) {
    console.error("[appointment] failed to send email", error);
    return {
      ok: false,
      message: "We could not submit your request due to a system error. Please try again shortly.",
    };
  }

  return {
    ok: true,
    message:
      "Thank you for submitting your Producer Appointment Request. Your application and supporting documents have been received. Our SPG Appointments team will review your submission and contact you regarding next steps.",
  };
}
