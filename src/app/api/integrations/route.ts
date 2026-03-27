import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "edge";

export async function GET() {
  const integrations = await prisma.integration.findMany({
    orderBy: { type: "asc" },
  });
  return NextResponse.json(integrations);
}

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { type, name, config, enabled } = body;

    if (!type || !name) {
      return NextResponse.json({ error: "type and name are required" }, { status: 400 });
    }

    const integration = await prisma.integration.upsert({
      where: { type },
      update: {
        name,
        config: JSON.stringify(config || {}),
        enabled: enabled ?? false,
      },
      create: {
        type,
        name,
        config: JSON.stringify(config || {}),
        enabled: enabled ?? false,
      },
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error("Error saving integration:", error);
    return NextResponse.json({ error: "Failed to save integration" }, { status: 500 });
  }
}
