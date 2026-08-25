# SPG Custom Forms

Two public-facing forms reached from the OKTA login/registration error flow, built as a single Next.js (App Router) application. Implements the architecture in the SPG OKTA Integration — Custom Web Forms solution doc.

- **Producer Appointment Form** — `/appointment` — unregistered producers request an appointment. Requires E&O, W9, and State License uploads. Emails `spgappointments@specialtyprogramgroup.com`.
- **Contact Support Form** — `/support` — users with login/registration errors submit a support request. Generates a case reference number. Emails `spgportaladmin@specialtyprogramgroup.com`.

Both pages accept a `?portal=` query parameter (e.g. `/appointment?portal=surefyre`) so one deployment serves every SPG portal. Email is sent server-side only through Exchange Online via Microsoft Graph — no third-party email vendor, and recipient addresses never reach the browser.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Entra certificate settings when available
npm run dev
```

Without the certificate mail settings below, the mailer (`lib/mailer.ts`) runs in **dry-run mode**: it logs the composed email to the console instead of sending it.

## Exchange certificate setup

The mailer sends through Exchange Online using Microsoft Graph and an Entra ID app registration. Configure these server-only environment variables:

- `EXCHANGE_TENANT_ID` — Microsoft Entra tenant ID
- `EXCHANGE_CLIENT_ID` — app registration client ID
- `EXCHANGE_CLIENT_CERTIFICATE` — the app's public certificate in PEM format
- `EXCHANGE_CLIENT_PRIVATE_KEY` — matching private key in PEM format
- `EXCHANGE_MAIL_FROM` — licensed Exchange Online mailbox or permitted sender address

Grant the app the **Application** permission `Mail.Send` in Microsoft Graph and grant admin consent. Upload the public certificate to the app registration; never commit the private key. For hosting systems that do not preserve multiline environment values, encode PEM line breaks as `\\n`.

## Project structure

```
app/
  appointment/        Producer Appointment page, form, and server action
  support/             Contact Support page, form, and server action
  api/
    appointment/        POST /api/appointment — same logic as the page's
                         server action, exposed as a standalone HTTP endpoint
    support/              POST /api/support — same, for Contact Support
components/forms/       Shared field primitives (text/file inputs, char-counter
                         textarea, repeatable row group, submit button)
lib/
  appointment-service.ts  Producer Appointment: validate -> build email ->
                           send via Exchange (solution doc §4.1/§4.2)
  support-service.ts       Contact Support: generate ref# -> build email ->
                            send via Exchange (solution doc §4.1/§4.2)
  mailer.ts             MS Exchange transport (SMTP today; swap this file for
                         EWS if Hub IT confirms that instead)
  case-ref.ts            Case reference number generator (SPG-YYYYMMDD-XXXXXX)
  portals.ts              ?portal= slug -> display name map
  file-validation.ts       Server-side attachment type/size checks
  form-data.ts              Parses repeatable office-location / contact rows
```

The solution doc's architecture diagram (§4.1) shows both a Next.js page (`/appointment`, `/support`) and a `/api/*` endpoint per form. This app has both, backed by one shared implementation each (`lib/appointment-service.ts`, `lib/support-service.ts`):

- **Page forms** (`/appointment`, `/support`) submit via Next.js Server Actions — progressive enhancement, `useActionState` for inline field errors, no client JS required for the base case.
- **`POST /api/appointment`** and **`POST /api/support`** are plain Route Handlers accepting the same `multipart/form-data` shape, for any caller that isn't the React form (e.g. a future non-JS client, a test harness, or direct integration). They return `{ message }` on success (`support` also returns `caseReference`) or `{ message, fieldErrors }` with a 400 on validation failure.

Both entry points call the same validate/build-email/send-via-Exchange logic, so there is nothing to keep in sync.

## Open items from the solution doc (§8)

These are stakeholder decisions, not implementation gaps — the code has sensible defaults wired to env vars so nothing blocks development, but confirm before go-live:

| Item | Owner | Where it's wired |
|---|---|---|
| Exchange SMTP vs EWS, real credentials | Hub IT / Conor | `.env.example`, `lib/mailer.ts` |
| Per-attachment file size limit | OPS / Hub IT | `MAX_ATTACHMENT_SIZE_MB` env var, `next.config.ts` |
| Canonical `?portal=` values | Neha Bansal | `lib/portals.ts` |
| Case reference number format | OPS | `lib/case-ref.ts` (implements the doc's recommended `SPG-YYYYMMDD-XXXXXX`) |
| Hosting target (Vercel / Azure App Service) | Hub IT / Conor | not yet deployed |
| PII / secure transmission sign-off for Contact Support | Neha Bansal / OPS | see doc §5.2 |
| Branding / styling guidelines | Marketing / Manoj | current UI uses plain, neutral Tailwind styling pending brand input |

## Security notes

- Email recipients and Exchange credentials are only referenced in server-only modules (`lib/mailer.ts`, server actions) — never sent to the client.
- Uploaded files are validated server-side for MIME type and size before being attached to the outgoing email; nothing is written to disk or blob storage.
- No authentication is required to access either form — this is intentional (see solution doc §9, out of scope).
