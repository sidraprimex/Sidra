import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormField({ label, error, id, ...props }: FormFieldProps) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <label className="block" htmlFor={fieldId}>
      <span className="mb-2 block text-caption font-medium text-ivory-100/85">
        {label}
      </span>
      <input
        {...props}
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="min-h-14 w-full rounded-lg border border-white/15 bg-black-900/80 px-4 py-3 text-body text-ivory-100 caret-gold-500 outline-none transition duration-base placeholder:text-gray-500 hover:border-white/25 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
      />
      {error ? (
        <span id={errorId} className="mt-2 block text-micro text-gold-100">
          {error}
        </span>
      ) : null}
    </label>
  );
}
