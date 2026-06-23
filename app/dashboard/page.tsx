"use client";
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Plus, Trash2, ExternalLink, Zap, LogOut, Sparkles, Clock } from "lucide-react";

interface App { id: string; name: string; config: { description?: string; entities?: unknown[]; pages?: unknown[] }; updatedAt: string; }

export default function Dashboard() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const fetchApps = async () => {
    const res = await fetch("/api/apps");
    if (res.ok) setApps(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchApps(); }, []);

  const generateApp = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenError("");
    try {
      const genRes = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }),
      });
      if (!genRes.ok) throw new Error("Generation failed");
      const { config, warnings } = await genRes.json();
      if (warnings?.length) console.warn("Config warnings:", warnings);
      const saveRes = await fetch("/api/apps", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config }),
      });
      if (!saveRes.ok) throw new Error("Failed to save app");
      const app = await saveRes.json();
      setPrompt("");
      fetchApps();
      window.location.href = `/app/${app.id}`;
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Failed to generate app");
    } finally {
      setGenerating(false);
    }
  };

  const deleteApp = async (id: string) => {
    if (!confirm("Delete this app and all its data?")) return;
    await fetch(`/api/apps/${id}`, { method: "DELETE" });
    fetchApps();
  };

  const examples = [
    "A CRM to track leads, contacts, and deals",
    "An inventory system for a small store",
    "A task manager with projects and deadlines",
    "A blog with posts, authors, and categories",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600"><Zap size={14} className="text-white" /></div>
            AppForge
          </Link>
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* Generator */}
        <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-8 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 mb-4">
            <Sparkles size={16} /> Generate a new app
          </div>
          <div className="flex gap-3">
            <textarea
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
              placeholder="Describe the app you want to build..."
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) generateApp(); }}
            />
            <button onClick={generateApp} disabled={generating || !prompt.trim()}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60 self-end">
              <Zap size={14} /> {generating ? "Generating..." : "Build"}
            </button>
          </div>
          {genError && <p className="mt-3 text-sm text-red-600">{genError}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button key={ex} onClick={() => setPrompt(ex)}
                className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs text-violet-600 hover:bg-violet-50">
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Apps */}
        <div className="mt-10">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">Your Apps</h2>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200" />)}
            </div>
          ) : apps.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
              <p className="text-gray-500">No apps yet. Build your first one above!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {apps.map((app) => (
                <div key={app.id} className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
                      {app.config?.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{app.config.description}</p>
                      )}
                    </div>
                    <button onClick={() => deleteApp(app.id)}
                      className="ml-2 rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>{app.config?.entities?.length || 0} entities</span>
                      <span>{app.config?.pages?.length || 0} pages</span>
                    </div>
                    <Link href={`/app/${app.id}`}
                      className="flex items-center gap-1 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100">
                      Open <ExternalLink size={11} />
                    </Link>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={11} />
                    {new Date(app.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              <button onClick={() => document.querySelector("textarea")?.focus()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-8 text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors">
                <Plus size={24} />
                <span className="mt-2 text-sm">New App</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
