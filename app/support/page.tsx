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
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-blue-700">{portalName}</p>
        <h1 className="text-2xl font-bold text-gray-900">Contact Support</h1>
        <p className="text-sm text-gray-600">
          Contact Support Description
        </p>
      </div>
      <SupportForm portal={portal} portalName={portalName === "Unknown Portal" ? "" : portalName} />
    </main>
  );
}
