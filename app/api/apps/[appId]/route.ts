import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateAndSanitizeConfig } from "@/lib/configValidator";

type Params = { params: Promise<{ appId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { appId } = await params;
  const app = await prisma.app.findFirst({ where: { id: appId, userId: session.user.id } });
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });
  return NextResponse.json(app);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { appId } = await params;
  const app = await prisma.app.findFirst({ where: { id: appId, userId: session.user.id } });
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });
  const body = await req.json();
  const { config } = validateAndSanitizeConfig(body.config);
  const updated = await prisma.app.update({
    where: { id: appId },
    data: { name: config.name, config: config as object },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { appId } = await params;
  const app = await prisma.app.findFirst({ where: { id: appId, userId: session.user.id } });
  if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });
  await prisma.app.delete({ where: { id: appId } });
  return NextResponse.json({ success: true });
}
