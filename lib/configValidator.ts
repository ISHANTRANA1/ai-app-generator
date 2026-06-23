import { AppConfig, EntityConfig, FieldConfig, PageConfig, FieldType, PageType } from "./types";

const VALID_FIELD_TYPES: FieldType[] = ["string", "number", "boolean", "date", "email", "url", "enum", "textarea"];
const VALID_PAGE_TYPES: PageType[] = ["table", "form", "dashboard", "kanban"];

function sanitizeField(field: unknown): FieldConfig {
  if (typeof field !== "object" || field === null) {
    return { name: "unknown_field", type: "string", required: false };
  }
  const f = field as Record<string, unknown>;
  const type = VALID_FIELD_TYPES.includes(f.type as FieldType) ? (f.type as FieldType) : "unknown";
  return {
    name: typeof f.name === "string" && f.name ? f.name : "unnamed_field",
    type,
    required: typeof f.required === "boolean" ? f.required : false,
    options: Array.isArray(f.options) ? f.options.filter((o) => typeof o === "string") : undefined,
    defaultValue: f.defaultValue,
    label: typeof f.label === "string" ? f.label : undefined,
    placeholder: typeof f.placeholder === "string" ? f.placeholder : undefined,
  };
}

function sanitizeEntity(entity: unknown): EntityConfig {
  if (typeof entity !== "object" || entity === null) {
    return { name: "Unknown", fields: [] };
  }
  const e = entity as Record<string, unknown>;
  return {
    name: typeof e.name === "string" && e.name ? e.name : "Unknown",
    fields: Array.isArray(e.fields) ? e.fields.map(sanitizeField) : [],
    icon: typeof e.icon === "string" ? e.icon : undefined,
  };
}

function sanitizePage(page: unknown): PageConfig {
  if (typeof page !== "object" || page === null) {
    return { name: "Unknown Page", type: "table", entity: "", actions: [] };
  }
  const p = page as Record<string, unknown>;
  const type = VALID_PAGE_TYPES.includes(p.type as PageType) ? (p.type as PageType) : "unknown";
  return {
    name: typeof p.name === "string" && p.name ? p.name : "Unnamed Page",
    type: type as PageType,
    entity: typeof p.entity === "string" ? p.entity : "",
    actions: Array.isArray(p.actions) ? p.actions.filter((a) => ["create", "edit", "delete", "view"].includes(a as string)) as PageConfig["actions"] : ["create", "edit", "delete"],
    columns: Array.isArray(p.columns) ? p.columns.filter((c) => typeof c === "string") : undefined,
    title: typeof p.title === "string" ? p.title : undefined,
  };
}

export function validateAndSanitizeConfig(raw: unknown): { config: AppConfig; warnings: string[] } {
  const warnings: string[] = [];

  if (typeof raw !== "object" || raw === null) {
    warnings.push("Config must be an object. Using default config.");
    return {
      config: { appId: "default", name: "My App", entities: [], pages: [] },
      warnings,
    };
  }

  const r = raw as Record<string, unknown>;

  if (!r.appId) warnings.push("Missing appId — using generated ID");
  if (!r.name) warnings.push("Missing app name — using 'My App'");

  const entities: EntityConfig[] = Array.isArray(r.entities)
    ? r.entities.map(sanitizeEntity)
    : (warnings.push("No entities found"), []);

  const pages: PageConfig[] = Array.isArray(r.pages)
    ? r.pages.map(sanitizePage)
    : (warnings.push("No pages found"), []);

  // Warn about pages referencing non-existent entities
  const entityNames = entities.map((e) => e.name);
  pages.forEach((p) => {
    if (p.entity && !entityNames.includes(p.entity)) {
      warnings.push(`Page "${p.name}" references unknown entity "${p.entity}"`);
    }
  });

  return {
    config: {
      appId: typeof r.appId === "string" ? r.appId : `app-${Date.now()}`,
      name: typeof r.name === "string" ? r.name : "My App",
      description: typeof r.description === "string" ? r.description : undefined,
      entities,
      pages,
      theme: r.theme === "dark" ? "dark" : "light",
    },
    warnings,
  };
}
