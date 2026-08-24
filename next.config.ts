import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Producer Appointment form submits three required file attachments.
      // Raise this once Hub IT/OPS confirm a per-attachment size limit
      // (solution doc §8 open item) — keep in step with
      // MAX_ATTACHMENT_SIZE_MB in lib/file-validation.ts.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
