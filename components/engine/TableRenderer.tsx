"use client";
import { useState, useEffect, useCallback } from "react";
import { EntityConfig, PageConfig, RuntimeRecord } from "@/lib/types";
import FormRenderer from "./FormRenderer";
import { Plus, Pencil, Trash2, Upload, AlertCircle } from "lucide-react";

interface Props {
  appId: string;
  entity: EntityConfig;
  page: PageConfig;
}

export default function TableRenderer({ appId, entity, page }: Props) {
  const [records, setRecords] = useState<RuntimeRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<RuntimeRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/apps/${appId}/records/${entity.name}`);
      if (!res.ok) throw new Error("Failed to load records");
      const json = await res.json();
      setRecords(json.records || []);
      setTotal(json.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [appId, entity.name]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/apps/${appId}/records/${entity.name}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors?.join(", ") || err.error || "Create failed");
    }
    setShowForm(false);
    fetchRecords();
  };

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editRecord) return;
    const res = await fetch(`/api/apps/${appId}/records/${entity.name}/${editRecord.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors?.join(", ") || err.error || "Update failed");
    }
    setEditRecord(null);
    fetchRecords();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/apps/${appId}/records/${entity.name}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    setDeleteId(null);
    fetchRecords();
  };

  const handleCSVImport = async () => {
    if (!csvFile) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", csvFile);
    try {
      const res = await fetch(`/api/apps/${appId}/import/${entity.name}`, { method: "POST", body: fd });
      const result = await res.json();
      setImportResult(result);
      setCsvFile(null);
      fetchRecords();
    } finally {
      setImporting(false);
    }
  };

  const visibleFields = entity.fields.slice(0, 5);
  const actions = page.actions || ["create", "edit", "delete"];

  if (!entity?.fields?.length) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        <AlertCircle size={16} /> This entity has no fields configured
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{page.title || page.name}</h2>
          <p className="text-sm text-gray-500">{total} {entity.name.toLowerCase()}(s)</p>
        </div>
        <div className="flex gap-2">
          {/* CSV Import */}
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Upload size={14} />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
          </label>
          {csvFile && (
            <button onClick={handleCSVImport} disabled={importing}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {importing ? "Importing..." : `Import "${csvFile.name}"`}
            </button>
          )}
          {actions.includes("create") && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700">
              <Plus size={14} /> New {entity.name}
            </button>
          )}
        </div>
      </div>

      {importResult && (
        <div className={`rounded-lg p-3 text-sm ${importResult.errors.length ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          ✓ Imported {importResult.imported} records
          {importResult.errors.length > 0 && <div className="mt-1 text-xs">{importResult.errors.slice(0, 3).join(", ")}</div>}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showForm || editRecord) && (
        <FormRenderer
          entity={entity}
          initialData={editRecord?.data as Record<string, unknown>}
          onSubmit={editRecord ? handleEdit : handleCreate}
          onCancel={() => { setShowForm(false); setEditRecord(null); }}
          mode={editRecord ? "edit" : "create"}
        />
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={16} /> {error}
          <button onClick={fetchRecords} className="ml-auto text-xs underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1,2,3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <div className="text-4xl mb-3">{entity.icon || "📋"}</div>
            <p className="font-medium text-gray-600">No {entity.name.toLowerCase()}s yet</p>
            <p className="text-sm mt-1">Create your first one or import a CSV</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  {visibleFields.map((f) => (
                    <th key={f.name} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {f.label || f.name}
                    </th>
                  ))}
                  {(actions.includes("edit") || actions.includes("delete")) && (
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    {visibleFields.map((f) => {
                      const val = (record.data as Record<string, unknown>)[f.name];
                      return (
                        <td key={f.name} className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                          {f.type === "boolean" ? (val ? "✓ Yes" : "✗ No") :
                           f.type === "enum" ? <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">{String(val ?? "—")}</span> :
                           val !== null && val !== undefined ? String(val) : <span className="text-gray-400">—</span>}
                        </td>
                      );
                    })}
                    {(actions.includes("edit") || actions.includes("delete")) && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {actions.includes("edit") && (
                            <button onClick={() => setEditRecord(record)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-violet-50 hover:text-violet-600">
                              <Pencil size={14} />
                            </button>
                          )}
                          {actions.includes("delete") && (
                            deleteId === record.id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => handleDelete(record.id)}
                                  className="rounded-lg bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700">Confirm</button>
                                <button onClick={() => setDeleteId(null)}
                                  className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50">Cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteId(record.id)}
                                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
