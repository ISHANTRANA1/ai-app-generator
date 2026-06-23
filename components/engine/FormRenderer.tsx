"use client";
import { useState } from "react";
import { EntityConfig } from "@/lib/types";
import FieldRenderer from "./FieldRenderer";
import { X } from "lucide-react";

interface Props {
  entity: EntityConfig;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  mode?: "create" | "edit";
}

export default function FormRenderer({ entity, initialData = {}, onSubmit, onCancel, mode = "create" }: Props) {
  const [data, setData] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (name: string, value: unknown) => {
    setData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of entity.fields) {
      const val = data[field.name];
      if (field.required && (val === undefined || val === null || val === "")) {
        newErrors[field.name] = `${field.label || field.name} is required`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError("");
    try {
      await onSubmit(data);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!entity?.fields?.length) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        ⚠ This entity has no fields configured
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h3 className="font-semibold text-gray-900">
          {mode === "edit" ? "Edit" : "New"} {entity.name}
        </h3>
        {onCancel && (
          <button onClick={onCancel} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        {serverError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {entity.fields.map((field) => (
          <FieldRenderer
            key={field.name}
            field={field}
            value={data[field.name]}
            onChange={handleChange}
            error={errors[field.name]}
            disabled={loading}
          />
        ))}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : mode === "edit" ? "Save Changes" : `Create ${entity.name}`}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
