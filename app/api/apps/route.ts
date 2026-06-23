import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateAndSanitizeConfig } from "@/lib/configValidator";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const apps = await prisma.app.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { config: sanitized } = validateAndSanitizeConfig(body.config);
    const app = await prisma.app.create({
      data: { userId: session.user.id, name: sanitized.name, config: sanitized as object },
    });
    return NextResponse.json(app, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create app" }, { status: 500 });
  }
}
