export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "email"
  | "url"
  | "enum"
  | "textarea"
  | "unknown";

export interface FieldConfig {
  name: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  defaultValue?: unknown;
  label?: string;
  placeholder?: string;
}

export interface EntityConfig {
  name: string;
  fields: FieldConfig[];
  icon?: string;
}

export type PageType = "table" | "form" | "dashboard" | "kanban" | "unknown";

export interface PageConfig {
  name: string;
  type: PageType;
  entity: string;
  actions?: ("create" | "edit" | "delete" | "view")[];
  columns?: string[];
  title?: string;
}

export interface AppConfig {
  appId: string;
  name: string;
  description?: string;
  entities: EntityConfig[];
  pages: PageConfig[];
  theme?: "light" | "dark";
}

export interface RuntimeRecord {
  id: string;
  appId: string;
  entity: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
