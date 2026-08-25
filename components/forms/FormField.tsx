const inputClasses =
  "rounded-lg border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10";

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
    <label htmlFor={name} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-700">
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
        className={`${inputClasses} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" : ""}`}
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
  accept,
}: {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  accept?: string;
}) {
  return (
    <label htmlFor={name} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-700">
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
        className={`rounded-lg border ${error ? "border-red-500" : "border-slate-300"} bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-950 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-800 hover:file:bg-blue-100`}
      />
      {error && (
        <span id={`${name}-error`} className="text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
