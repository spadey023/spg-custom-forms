export function FormStatusMessage({
  status,
  message,
}: {
  status: "success" | "error";
  message: string;
}) {
  const isSuccess = status === "success";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-md border p-4 text-sm ${
        isSuccess
          ? "border-teal-200 bg-teal-50 text-teal-900"
            : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {message}
    </div>
  );
}
