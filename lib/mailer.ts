import { createHash, createPrivateKey, createSign, randomUUID, X509Certificate } from "node:crypto";

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: MailAttachment[];
};

/**
 * MS Exchange email transport (solution doc §4.3).
 *
 * Default transport is SMTP with TLS (port 587), per the doc's primary
 * recommendation. If Hub IT confirms EWS instead (open item, doc §8), swap
 * the implementation of `sendExchangeMail` below for an EWS client — every
 * caller (appointment + support actions) goes through this one function, so
 * that's the only file that needs to change.
 *
 * Local/dev fallback: if EXCHANGE_SMTP_HOST/USER/PASSWORD are not set, mail
 * is logged instead of sent ("dry-run mode") so the app is runnable without
 * real Exchange credentials.
 */
type TokenCache = { accessToken: string; expiresAt: number };

let cachedToken: TokenCache | null = null;
let dryRunWarned = false;

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[mailer] Missing required environment variable: ${name}`);
  return value;
}

function normalizePem(value: string): string {
  return value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function createClientAssertion(
  tenantId: string,
  clientId: string,
  certificate: string,
  privateKey: string
): string {
  const now = Math.floor(Date.now() / 1000);
  const certificateObject = new X509Certificate(certificate);
  const thumbprint = createHash("sha1").update(certificateObject.raw).digest("base64url");
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT", x5t: thumbprint }));
  const payload = base64Url(
    JSON.stringify({
      aud: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      exp: now + 600,
      iat: now,
      iss: clientId,
      jti: randomUUID(),
      nbf: now,
      sub: clientId,
    })
  );
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  return `${unsignedToken}.${signer.sign(createPrivateKey(privateKey), "base64url")}`;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const tenantId = requiredEnvironment("EXCHANGE_TENANT_ID");
  const clientId = requiredEnvironment("EXCHANGE_CLIENT_ID");
  const certificate = normalizePem(requiredEnvironment("EXCHANGE_CLIENT_CERTIFICATE"));
  const privateKey = normalizePem(requiredEnvironment("EXCHANGE_CLIENT_PRIVATE_KEY"));
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_assertion: createClientAssertion(tenantId, clientId, certificate, privateKey),
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      grant_type: "client_credentials",
      scope: "https://graph.microsoft.com/.default",
    }),
  });

  const result = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };
  if (!response.ok || !result.access_token) {
    throw new Error(`[mailer] Exchange authentication failed: ${result.error_description || response.statusText}`);
  }

  cachedToken = {
    accessToken: result.access_token,
    expiresAt: Date.now() + (result.expires_in ?? 3600) * 1000,
  };
  return result.access_token;
}

async function sendViaGraph(message: MailMessage, from: string): Promise<void> {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject: message.subject,
          body: { contentType: "Text", content: message.text },
          toRecipients: [{ emailAddress: { address: message.to } }],
          replyTo: message.replyTo ? [{ emailAddress: { address: message.replyTo } }] : undefined,
          attachments: message.attachments?.map((attachment) => ({
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: attachment.filename,
            contentType: attachment.contentType || "application/octet-stream",
            contentBytes: attachment.content.toString("base64"),
          })),
        },
        saveToSentItems: true,
      }),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`[mailer] Exchange send failed (${response.status}): ${details.slice(0, 500)}`);
  }
}

export async function sendExchangeMail(message: MailMessage): Promise<void> {
  const from = process.env.EXCHANGE_MAIL_FROM;

  if (
    !from ||
    !process.env.EXCHANGE_TENANT_ID ||
    !process.env.EXCHANGE_CLIENT_ID ||
    !process.env.EXCHANGE_CLIENT_CERTIFICATE ||
    !process.env.EXCHANGE_CLIENT_PRIVATE_KEY
  ) {
    if (!dryRunWarned) {
      console.warn(
        "[mailer] Certificate mail settings are incomplete — running in dry-run mode, emails will be logged instead of sent."
      );
      dryRunWarned = true;
    }
    console.info("[mailer] dry-run: would send email", {
      to: message.to,
      subject: message.subject,
      replyTo: message.replyTo,
      attachments: message.attachments?.map((attachment) => attachment.filename),
    });
    return;
  }

  await sendViaGraph(message, from);
}

