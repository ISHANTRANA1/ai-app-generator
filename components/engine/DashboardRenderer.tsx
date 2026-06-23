"use client";
import { useState, useEffect } from "react";
import { AppConfig } from "@/lib/types";
import { BarChart2, Database, Layers, TrendingUp } from "lucide-react";

interface Props {
  appId: string;
  config: AppConfig;
}

export default function DashboardRenderer({ appId, config }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      const results: Record<string, number> = {};
      await Promise.all(
        config.entities.map(async (entity) => {
          try {
            const res = await fetch(`/api/apps/${appId}/records/${entity.name}?limit=1`);
            if (res.ok) { const data = await res.json(); results[entity.name] = data.total || 0; }
          } catch { results[entity.name] = 0; }
        })
      );
      setCounts(results);
      setLoading(false);
    };
    fetchCounts();
  }, [appId, config.entities]);

  const colors = ["bg-violet-500", "bg-emerald-500", "bg-blue-500", "bg-orange-500", "bg-pink-500"];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{config.name} Overview</h2>
        <p className="text-sm text-gray-500">{config.description || "App dashboard"}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.entities.map((entity, i) => (
          <div key={entity.name} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{entity.name}</p>
                {loading ? (
                  <div className="mt-1 h-8 w-16 animate-pulse rounded bg-gray-100" />
                ) : (
                  <p className="mt-1 text-3xl font-bold text-gray-900">{counts[entity.name] ?? 0}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">{entity.fields.length} fields</p>
              </div>
              <div className={`${colors[i % colors.length]} flex h-10 w-10 items-center justify-center rounded-lg text-white text-lg`}>
                {entity.icon || <Database size={18} />}
              </div>
            </div>
          </div>
        ))}

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Entities</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{config.entities.length}</p>
              <p className="mt-1 text-xs text-gray-400">in this app</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <Layers size={18} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Pages</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{config.pages.length}</p>
              <p className="mt-1 text-xs text-gray-400">configured views</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <BarChart2 size={18} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {loading ? "..." : Object.values(counts).reduce((a, b) => a + b, 0)}
              </p>
              <p className="mt-1 text-xs text-gray-400">across all entities</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
