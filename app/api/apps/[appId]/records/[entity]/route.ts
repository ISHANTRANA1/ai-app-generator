import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppConfig } from "@/lib/types";

type Params = { appId: string; entity: string };

async function getApp(appId: string, userId: string) {
  return prisma.app.findFirst({ where: { id: appId, userId } });
}

function validateRecord(data: Record<string, unknown>, config: AppConfig, entity: string) {
  const entityConfig = config.entities.find((e) => e.name === entity);
  if (!entityConfig) return { valid: false, errors: [`Unknown entity: ${entity}`], sanitized: {} };

  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  for (const field of entityConfig.fields) {
    const value = data[field.name];
    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push(`Field "${field.name}" is required`);
      continue;
    }
    if (value !== undefined && value !== null && value !== "") {
      // Basic type coercion
      if (field.type === "number") {
        const num = Number(value);
        sanitized[field.name] = isNaN(num) ? null : num;
      } else if (field.type === "boolean") {
        sanitized[field.name] = value === true || value === "true";
      } else if (field.type === "enum" && field.options) {
        sanitized[field.name] = field.options.includes(value as string) ? value : field.options[0];
      } else {
        sanitized[field.name] = value;
      }
    } else {
      sanitized[field.name] = field.defaultValue ?? null;
    }
  }

  return { valid: errors.length === 0, errors, sanitized };
}

export async function GET(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { appId, entity } = await params;
  const app = await getApp(appId, session.user.id);
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    prisma.record.findMany({ where: { appId, entity }, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.record.count({ where: { appId, entity } }),
  ]);

  return NextResponse.json({ records, total, page, limit });
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { appId, entity } = await params;
  const app = await getApp(appId, session.user.id);
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

  const body = await req.json();
  const { valid, errors, sanitized } = validateRecord(body, app.config as AppConfig, entity);
  if (!valid) return NextResponse.json({ error: "Validation failed", errors }, { status: 422 });

  const record = await prisma.record.create({ data: { appId, entity, data: sanitized } });
  return NextResponse.json(record, { status: 201 });
}
