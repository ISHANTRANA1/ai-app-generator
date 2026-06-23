"use client";
import { FieldConfig } from "@/lib/types";

interface Props {
  field: FieldConfig;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

export default function FieldRenderer({ field, value, onChange, error, disabled }: Props) {
  const label = field.label || field.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const baseClass = `w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 ${
    error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"
  }`;

  const renderInput = () => {
    switch (field.type) {
      case "textarea":
        return (
          <textarea
            className={`${baseClass} min-h-[80px] resize-y`}
            value={(value as string) || ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Enter ${label}`}
            disabled={disabled}
            required={field.required}
          />
        );

      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={field.name}
              checked={Boolean(value)}
              onChange={(e) => onChange(field.name, e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            <label htmlFor={field.name} className="text-sm text-gray-600">{label}</label>
          </div>
        );

      case "enum":
        if (!field.options?.length) return <p className="text-sm text-amber-600">⚠ Enum field missing options</p>;
        return (
          <select
            className={baseClass}
            value={(value as string) || ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={disabled}
          >
            <option value="">Select {label}</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case "number":
        return (
          <input
            type="number"
            className={baseClass}
            value={(value as number) ?? ""}
            onChange={(e) => onChange(field.name, e.target.value === "" ? null : Number(e.target.value))}
            placeholder={field.placeholder || "0"}
            disabled={disabled}
            required={field.required}
          />
        );

      case "date":
        return (
          <input
            type="datetime-local"
            className={baseClass}
            value={(value as string) || ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            disabled={disabled}
            required={field.required}
          />
        );

      case "email":
        return (
          <input
            type="email"
            className={baseClass}
            value={(value as string) || ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder || "email@example.com"}
            disabled={disabled}
            required={field.required}
          />
        );

      case "url":
        return (
          <input
            type="url"
            className={baseClass}
            value={(value as string) || ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder || "https://"}
            disabled={disabled}
            required={field.required}
          />
        );

      case "unknown":
        return (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            ⚠ Unknown field type — rendering as text
            <input
              type="text"
              className="mt-1 w-full rounded border border-amber-300 bg-white px-2 py-1 text-sm"
              value={(value as string) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            className={baseClass}
            value={(value as string) || ""}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Enter ${label}`}
            disabled={disabled}
            required={field.required}
          />
        );
    }
  };

  if (field.type === "boolean") return <div>{renderInput()}</div>;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
