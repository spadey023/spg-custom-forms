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
          ? "border-green-300 bg-green-50 text-green-800"
          : "border-red-300 bg-red-50 text-red-800"
      }`}
    >
      {message}
    </div>
  );
}
