"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { AppConfig } from "@/lib/types";
import { validateAndSanitizeConfig } from "@/lib/configValidator";
import AppRuntime from "@/components/engine/AppRuntime";
import { ArrowLeft, GitFork, Settings, Zap } from "lucide-react";

interface App { id: string; name: string; config: unknown; }

export default function AppPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = use(params);
  const [app, setApp] = useState<App | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [repoName, setRepoName] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ repoUrl: string } | null>(null);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        const res = await fetch(`/api/apps/${appId}`);
        if (!res.ok) throw new Error("App not found");
        const data = await res.json();
        setApp(data);
        const { config: sanitized, warnings: w } = validateAndSanitizeConfig(data.config);
        setConfig(sanitized);
        setWarnings(w);
        setRepoName(sanitized.name.toLowerCase().replace(/\s+/g, "-"));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load app");
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [appId]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/apps/${appId}/export/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubToken, repoName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed");
      setExportResult(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading app...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">{error || "Failed to load app"}</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-violet-600 underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-5 py-3 shrink-0">
        <Link href="/dashboard" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-600">
            <Zap size={12} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900">{config.name}</span>
          {config.description && (
            <span className="hidden text-sm text-gray-400 sm:inline">— {config.description}</span>
          )}
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/app/${appId}/config`}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            <Settings size={14} /> Config
          </Link>
          <button onClick={() => setShowExport(!showExport)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            <GitFork size={14} /> Export to GitHub
          </button>
        </div>
      </header>

      {/* GitHub Export Panel */}
      {showExport && (
        <div className="border-b border-gray-200 bg-white px-5 py-4 shrink-0">
          {exportResult ? (
            <div className="flex items-center gap-3 text-sm text-emerald-700">
              ✓ Exported!{" "}
              <a href={exportResult.repoUrl} target="_blank" rel="noopener noreferrer"
                className="text-violet-600 underline">{exportResult.repoUrl}</a>
            </div>
          ) : (
            <div className="flex gap-3 flex-wrap">
              <input placeholder="GitHub Personal Access Token" type="password"
                value={githubToken} onChange={(e) => setGithubToken(e.target.value)}
                className="flex-1 min-w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none" />
              <input placeholder="Repo name" value={repoName} onChange={(e) => setRepoName(e.target.value)}
                className="w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none" />
              <button onClick={handleExport} disabled={exporting || !githubToken || !repoName}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Runtime */}
      <div className="flex-1 overflow-hidden">
        <AppRuntime appId={appId} config={config} warnings={warnings} />
      </div>
    </div>
  );
}
