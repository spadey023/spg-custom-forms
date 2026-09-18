# SPG Custom Forms

This is a Next.js App Router application that serves two public-facing portal forms used during the OKTA login/registration error flow:

- Producer Appointment: `/appointment`
- Contact Support: `/support`

Both pages are designed to work behind a shared deployment and use the `?portal=` query string to tailor the experience for a specific SPG portal slug while keeping one codebase for all portals.

## Current implementation

### Forms and flow

- `/appointment` collects producer appointment details and required document uploads.
- `/support` collects portal access/support details and generates a case reference.
- Both forms use Next.js server actions and `useActionState` for inline validation and status handling.
- The app currently runs in a single-page, server-rendered setup with no dedicated `/api/*` route handlers checked into this repo.

### Email transport

The app sends mail server-side through Microsoft Graph using an Entra app registration and certificate-based authentication.

The mailer in `lib/mailer.ts` currently expects these environment variables:

- `EXCHANGE_TENANT_ID`
- `EXCHANGE_CLIENT_ID`
- `EXCHANGE_CLIENT_CERTIFICATE_PATH`
- `EXCHANGE_CLIENT_CERTIFICATE_PASSWORD`
- `EXCHANGE_MAIL_FROM`

If those values are not configured, the app falls back to a dry-run mode and logs the message instead of sending it. This is intentional for local development and safe startup without real credentials.

### Recipients and validation

- `APPOINTMENTS_RECIPIENT` defaults to `spgappointments@specialtyprogramgroup.com`
- `SUPPORT_RECIPIENT` defaults to `spgportaladmin@specialtyprogramgroup.com`
- Attachment validation is enforced server-side in `lib/file-validation.ts` before an email is composed.
- The current default per-file limit is 5 MB, with the value controlled by `MAX_ATTACHMENT_SIZE_MB`.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

If real Exchange credentials are not present, the app still starts and the mailer logs outbound message details in dry-run mode instead of sending email.

## Environment configuration

The project’s current example file is [.env.example](.env.example), which reflects the implementation in the repo. It includes:

```env
EXCHANGE_TENANT_ID=
EXCHANGE_CLIENT_ID=
EXCHANGE_CLIENT_CERTIFICATE_PATH=
EXCHANGE_CLIENT_CERTIFICATE_PASSWORD=
EXCHANGE_MAIL_FROM=

APPOINTMENTS_RECIPIENT=spgappointments@specialtyprogramgroup.com
SUPPORT_RECIPIENT=spgportaladmin@specialtyprogramgroup.com
MAX_ATTACHMENT_SIZE_MB=5
```

Notes:

- The mailer supports either extracted PEM files or a `.pfx` certificate path plus password.
- The app is designed so recipient addresses and credentials stay on the server and are never exposed to the browser.

## Project structure

```text
app/
  appointment/
  support/
components/
  forms/
lib/
  appointment-service.ts
  support-service.ts
  mailer.ts
  case-ref.ts
  file-validation.ts
  form-data.ts
  portals.ts
next.config.ts
package.json
README.md
```

### Key files

- `app/appointment/page.tsx` and `app/support/page.tsx` render the user-facing pages.
- `app/appointment/actions.ts` and `app/support/actions.ts` wrap the server action submissions.
- `lib/appointment-service.ts` validates appointment submissions and builds/sends the appointment email.
- `lib/support-service.ts` validates support requests, creates the case reference, and sends the support email.
- `lib/mailer.ts` handles Microsoft Graph authentication and outbound mail transmission.
- `lib/portals.ts` maps portal slugs to display names.
- `lib/file-validation.ts` validates upload type and size on the server.

## Security and operational notes

- No authentication is required to render or submit either form, matching the current scope and business requirements.
- Uploaded files are checked before attachment generation; nothing is written to disk or blob storage in the current implementation.
- The app keeps Exchange and recipient configuration in server-only code and environment variables.

## Current open items

These are still project decisions rather than missing code:

- Confirm the canonical set of valid `?portal=` values in `lib/portals.ts`.
- Confirm the final hosting target and deployment strategy.
- Confirm any final branding or UX requirements for the portal forms.
- Confirm the final attachment size threshold that should be enforced in production.

## Build and validation

```bash
npm run build
npm run lint
```

This repo is intended to be run as a standard Next.js application with the configured environment values for outbound email. Without those values, the app remains usable in local development mode with dry-run email logging.