import type { Metadata } from "next";
import { SupportForm } from "./SupportForm";
import { getPortalDisplayName } from "@/lib/portals";

export const metadata: Metadata = {
  title: "Contact Support | SPG",
};

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string }>;
}) {
  const { portal = "" } = await searchParams;
  const portalName = getPortalDisplayName(portal);

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-x-0 top-0 h-64 bg-spgblue-800" aria-hidden="true">
        <div
          className="absolute inset-0 bg-[url('/branding/SPG-Website-Branding.svg')] bg-cover bg-center bg-no-repeat opacity-31"
          aria-hidden="true"
        />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-spggreen-500">
            <span className="h-px w-8 bg-spggreen-500" />
            <span>{portalName}</span>
          </div>
          <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Contact support
          </h1>
          <p className="max-w-xl text-sm leading-6 text-white/75">
            Tell us what happened and our team will help get you back on track.
          </p>
        </div>
        <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(20,37,34,0.35)] sm:p-8">
          <SupportForm portal={portal} portalName={portalName === "Unknown Portal" ? "" : portalName} />
        </div>
      </main>
    </div>
  );
}
