import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppConfig } from "@/lib/types";

type Params = { appId: string; entity: string };

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { appId, entity } = await params;
  const app = await prisma.app.findFirst({ where: { id: appId, userId: session.user.id } });
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

  const config = app.config as AppConfig;
  const entityConfig = config.entities.find((e) => e.name === entity);
  if (!entityConfig) return NextResponse.json({ error: "Entity not found" }, { status: 404 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return NextResponse.json({ error: "CSV must have header and data rows" }, { status: 400 });

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const rows = lines.slice(1);

    const records: object[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const values = rows[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      const data: Record<string, unknown> = {};
      headers.forEach((h, idx) => { data[h] = values[idx] || null; });

      // Map CSV columns to entity fields
      const mapped: Record<string, unknown> = {};
      for (const field of entityConfig.fields) {
        const csvVal = data[field.name.toLowerCase()] ?? data[field.label?.toLowerCase() || ""];
        if (csvVal !== undefined) mapped[field.name] = csvVal;
      }

      if (Object.keys(mapped).length === 0) {
        errors.push(`Row ${i + 2}: No matching fields found`);
        continue;
      }
      records.push({ appId, entity, data: mapped });
    }

    if (records.length > 0) {
      await prisma.record.createMany({ data: records as any[] });
    }

    return NextResponse.json({ imported: records.length, errors, skipped: errors.length });
  } catch (err) {
    console.error("CSV import error:", err);
    return NextResponse.json({ error: "CSV import failed" }, { status: 500 });
  }
}
