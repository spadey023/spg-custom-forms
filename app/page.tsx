import Link from "next/link";
import { PORTALS } from "@/lib/portals";

export default function Home() {
  const portalEntries = Object.entries(PORTALS);

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col justify-center gap-8 px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">SPG Custom Forms</h1>
        <p className="text-sm text-gray-600">
          SPG Custom Forms Description
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {portalEntries.map(([slug, name]) => (
          <div key={slug} className="rounded-md border border-gray-200 p-4">
            <p className="mb-3 text-sm font-semibold text-gray-900">{name}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/appointment?portal=${slug}`}
                className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-center text-sm font-medium text-blue-700 hover:border-blue-300 hover:bg-blue-50"
              >
                Producer Appointment Form →
              </Link>
              <Link
                href={`/support?portal=${slug}`}
                className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-center text-sm font-medium text-blue-700 hover:border-blue-300 hover:bg-blue-50"
              >
                Contact Support Form →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
