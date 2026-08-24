/**
 * Server-side attachment validation (solution doc §7: "File uploads validated
 * server-side for type and size before forwarding to Exchange").
 *
 * OPEN ITEM (solution doc §8, owner OPS/Hub IT): the per-attachment size
 * limit is not yet confirmed. MAX_ATTACHMENT_SIZE_MB defaults to 5MB —
 * override via env once a limit is set, and raise
 * `experimental.serverActions.bodySizeLimit` in next.config.ts to match.
 */
const DEFAULT_MAX_ATTACHMENT_SIZE_MB = 5;

const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function getMaxAttachmentSizeMB(): number {
  const configured = Number(process.env.MAX_ATTACHMENT_SIZE_MB);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_ATTACHMENT_SIZE_MB;
}

export function validateRequiredAttachment(
  file: File | null,
  label: string
): string | null {
  if (!file || file.size === 0) {
    return `${label} is required.`;
  }
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    return `${label} must be a PDF, Word document, or image (JPG/PNG).`;
  }
  const maxBytes = getMaxAttachmentSizeMB() * 1024 * 1024;
  if (file.size > maxBytes) {
    return `${label} exceeds the ${getMaxAttachmentSizeMB()}MB size limit.`;
  }
  return null;
}
