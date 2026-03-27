import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "edge";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { key, sourceText, context, maxLength } = body;

    if (!key || !sourceText) {
      return NextResponse.json({ error: "Key and sourceText are required" }, { status: 400 });
    }

    const existing = await prisma.translationString.findUnique({
      where: { projectId_key: { projectId: id, key } },
    });

    if (existing) {
      return NextResponse.json({ error: "String key already exists in this project" }, { status: 409 });
    }

    const string = await prisma.translationString.create({
      data: {
        key,
        sourceText,
        context: context || null,
        maxLength: maxLength || null,
        projectId: id,
      },
      include: { translations: true },
    });

    return NextResponse.json(string, { status: 201 });
  } catch (error) {
    console.error("Error creating string:", error);
    return NextResponse.json({ error: "Failed to create string" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { strings } = body;

    if (!Array.isArray(strings)) {
      return NextResponse.json({ error: "strings must be an array" }, { status: 400 });
    }

    const results = [];
    for (const s of strings) {
      const result = await prisma.translationString.upsert({
        where: {
          projectId_key: { projectId: s.projectId, key: s.key },
        },
        update: { sourceText: s.sourceText, context: s.context || null },
        create: {
          key: s.key,
          sourceText: s.sourceText,
          context: s.context || null,
          projectId: s.projectId,
        },
      });
      results.push(result);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error bulk upserting strings:", error);
    return NextResponse.json({ error: "Failed to bulk upsert strings" }, { status: 500 });
  }
}
