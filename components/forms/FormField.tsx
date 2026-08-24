const inputClasses =
  "rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

export function FormField({
  name,
  label,
  type = "text",
  required = false,
  defaultValue,
  error,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  error?: string;
  placeholder?: string;
}) {
  return (
    <label htmlFor={name} className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`${inputClasses} ${error ? "border-red-500" : ""}`}
      />
      {error && (
        <span id={`${name}-error`} className="text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

export function FileField({
  name,
  label,
  required = false,
  error,
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
}: {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  accept?: string;
}) {
  return (
    <label htmlFor={name} className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      <input
        id={name}
        name={name}
        type="file"
        required={required}
        accept={accept}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`rounded-md border ${error ? "border-red-500" : "border-gray-300"} bg-white px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100`}
      />
      {error && (
        <span id={`${name}-error`} className="text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
