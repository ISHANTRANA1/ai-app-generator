"use client";
import { useState } from "react";
import { AppConfig, PageConfig } from "@/lib/types";
import TableRenderer from "./TableRenderer";
import FormRenderer from "./FormRenderer";
import DashboardRenderer from "./DashboardRenderer";
import { LayoutDashboard, Table, FileText, AlertTriangle } from "lucide-react";

interface Props {
  appId: string;
  config: AppConfig;
  warnings?: string[];
}

export default function AppRuntime({ appId, config, warnings = [] }: Props) {
  const [activePage, setActivePage] = useState<PageConfig | null>(config.pages[0] || null);

  const getPageIcon = (type: string) => {
    if (type === "dashboard") return <LayoutDashboard size={15} />;
    if (type === "table") return <Table size={15} />;
    return <FileText size={15} />;
  };

  const renderPage = () => {
    if (!activePage) {
      return (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <p>No pages configured</p>
        </div>
      );
    }

    if (activePage.type === "dashboard") {
      return <DashboardRenderer appId={appId} config={config} />;
    }

    const entity = config.entities.find((e) => e.name === activePage.entity);

    if (!entity) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <AlertTriangle size={16} />
          Entity &quot;{activePage.entity}&quot; not found in config. This page cannot be rendered.
        </div>
      );
    }

    if (activePage.type === "table" || activePage.type === "unknown") {
      return <TableRenderer appId={appId} entity={entity} page={activePage} />;
    }

    if (activePage.type === "form") {
      return (
        <FormRenderer
          entity={entity}
          onSubmit={async (data) => {
            const res = await fetch(`/api/apps/${appId}/records/${entity.name}`, {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
          }}
        />
      );
    }

    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        ⚠ Unsupported page type &quot;{activePage.type}&quot; — falling back to table view
        <TableRenderer appId={appId} entity={entity} page={{ ...activePage, type: "table" }} />
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-100 bg-gray-50 p-3">
        <div className="mb-4 px-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pages</p>
        </div>
        <nav className="space-y-1">
          {config.pages.map((page) => (
            <button
              key={page.name}
              onClick={() => setActivePage(page)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activePage?.name === page.name
                  ? "bg-violet-100 text-violet-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {getPageIcon(page.type)}
              {page.name}
            </button>
          ))}
        </nav>

        {config.entities.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Entities</p>
            <div className="space-y-1">
              {config.entities.map((e) => (
                <div key={e.name} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-gray-500">
                  <span>{e.icon || "📦"}</span>
                  {e.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {warnings.length > 0 && (
          <div className="border-b border-amber-100 bg-amber-50 px-6 py-2">
            <div className="flex items-start gap-2 text-xs text-amber-700">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Config warnings: </span>
                {warnings.join(" • ")}
              </div>
            </div>
          </div>
        )}
        <div className="p-6">{renderPage()}</div>
      </main>
    </div>
  );
}
