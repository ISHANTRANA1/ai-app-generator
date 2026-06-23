"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { validateAndSanitizeConfig } from "@/lib/configValidator";
import { ArrowLeft, Save, AlertTriangle, CheckCircle } from "lucide-react";

export default function ConfigPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = use(params);
  const [raw, setRaw] = useState("");
  const [saving, setSaving] = useState(false);
  const [parseError, setParseError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/apps/${appId}`)
      .then((r) => r.json())
      .then((app) => setRaw(JSON.stringify(app.config, null, 2)));
  }, [appId]);

  const handleChange = (val: string) => {
    setRaw(val);
    setParseError("");
    setSaved(false);
    try {
      const parsed = JSON.parse(val);
      const { warnings: w } = validateAndSanitizeConfig(parsed);
      setWarnings(w);
    } catch {
      setWarnings([]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setParseError("");
    try {
      const parsed = JSON.parse(raw);
      const { config } = validateAndSanitizeConfig(parsed);
      const res = await fetch(`/api/apps/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Invalid JSON");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-5 py-3">
        <Link href={`/app/${appId}`} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
          <ArrowLeft size={16} />
        </Link>
        <span className="font-semibold text-gray-900">Config Editor</span>
        <div className="ml-auto flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckCircle size={14} /> Saved
            </span>
          )}
          <button onClick={handleSave} disabled={saving || !!parseError}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60">
            <Save size={14} /> {saving ? "Saving..." : "Save Config"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-6 space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <strong>Config Editor</strong> — Edit the JSON config directly. Changes are validated before saving.
          Unknown field types, missing entities, and invalid values will be flagged as warnings.
        </div>

        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-2">
              <AlertTriangle size={14} /> {warnings.length} warning(s)
            </div>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-700">• {w}</li>
              ))}
            </ul>
          </div>
        )}

        {parseError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            ✗ {parseError}
          </div>
        )}

        <textarea
          className="w-full h-[600px] rounded-xl border border-gray-200 bg-white p-4 font-mono text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          value={raw}
          onChange={(e) => handleChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
