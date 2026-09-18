import { createHash, createPrivateKey, createSign, randomUUID, X509Certificate } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

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
 * MS Exchange email transport using Graph API with PFX certificate authentication.
 *
 * Requires:
 * - EXCHANGE_TENANT_ID: Azure tenant ID
 * - EXCHANGE_CLIENT_ID: Entra app client ID
 * - EXCHANGE_CLIENT_CERTIFICATE_PATH: Path to PFX file
 * - EXCHANGE_CLIENT_CERTIFICATE_PASSWORD: PFX password
 * - EXCHANGE_MAIL_FROM: Sender email address
 *
 * Local/dev fallback: if credentials are not set, mail is logged instead
 * of sent ("dry-run mode") so the app is runnable without real credentials.
 */

type TokenCache = { accessToken: string; expiresAt: number };
type CertificateCache = { certificate: string; privateKey: string };

let cachedToken: TokenCache | null = null;
let cachedCertificate: CertificateCache | null = null;
let dryRunWarned = false;

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[mailer] Missing required environment variable: ${name}`);
  return value;
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

/**
 * Extract certificate and private key from PFX file or read from PEM files
 */
function loadCertificateFromPfx(): CertificateCache {
  if (cachedCertificate) return cachedCertificate;

  const certPath = requiredEnvironment("EXCHANGE_CLIENT_CERTIFICATE_PATH");
  const certPassword = requiredEnvironment("EXCHANGE_CLIENT_CERTIFICATE_PASSWORD");

  let certificate: string | null = null;
  let privateKey: string | null = null;

  // Try to read from pre-extracted PEM files first (preferred method)
  const basePath = certPath.replace(/\.pfx$/i, "");
  const certPemPath = `${basePath}-cert.pem`;
  const keyPemPath = `${basePath}-key.pem`;

  try {
    if (fs.existsSync(certPemPath) && fs.existsSync(keyPemPath)) {
      certificate = fs.readFileSync(certPemPath, "utf-8");
      privateKey = fs.readFileSync(keyPemPath, "utf-8");
      console.log("[mailer] Loaded certificate from PEM files");
    } else {
      // Fallback: try to parse PFX using Node.js native crypto
      const pfxBuffer = fs.readFileSync(certPath);
      
      try {
        // Try native pkcs12Parse (Node.js 15.7.0+)
        const crypto = require("crypto");
        if (typeof crypto.pkcs12Parse === "function") {
          const p12 = crypto.pkcs12Parse(pfxBuffer, certPassword);
          
          if (p12.key && p12.cert) {
            certificate = p12.cert[0].export("pem").toString();
            privateKey = p12.key.export({ format: "pem", type: "pkcs8" }).toString();
            console.log("[mailer] Loaded certificate from PFX using native parser");
          }
        }
      } catch (nativeError) {
        // If native parsing fails, provide helpful error
        throw new Error(
          `[mailer] Failed to load certificate. Please ensure:\n` +
          `1. PEM files exist: ${certPemPath} and ${keyPemPath}\n` +
          `   OR\n` +
          `2. PFX file is valid: ${certPath}\n` +
          `\nTo create PEM files, run:\n` +
          `  npx node-forge-extract ${certPath} ${certPassword}\n` +
          `\nNative error: ${nativeError instanceof Error ? nativeError.message : String(nativeError)}`
        );
      }
    }
  } catch (error) {
    console.error("[mailer] Failed to load certificate:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }

  if (!certificate || !privateKey) {
    throw new Error(
      `[mailer] Failed to extract certificate and private key.\n` +
      `Expected PEM files:\n  ${certPemPath}\n  ${keyPemPath}\n` +
      `Or valid PFX file:\n  ${certPath}`
    );
  }

  cachedCertificate = { certificate, privateKey };
  return cachedCertificate;
}

function createClientAssertion(tenantId: string, clientId: string, certificate: string, privateKey: string): string {
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
  const { certificate, privateKey } = loadCertificateFromPfx();

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
    !process.env.EXCHANGE_CLIENT_CERTIFICATE_PATH ||
    !process.env.EXCHANGE_CLIENT_CERTIFICATE_PASSWORD
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

