import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "edge";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { key, sourceText, context, maxLength } = body;

    const data: Record<string, unknown> = {};
    if (key !== undefined) data.key = key;
    if (sourceText !== undefined) data.sourceText = sourceText;
    if (context !== undefined) data.context = context;
    if (maxLength !== undefined) data.maxLength = maxLength;

    const string = await prisma.translationString.update({
      where: { id },
      data,
      include: { translations: true },
    });

    return NextResponse.json(string);
  } catch (error) {
    console.error("Error updating string:", error);
    return NextResponse.json({ error: "Failed to update string" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.translationString.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting string:", error);
    return NextResponse.json({ error: "Failed to delete string" }, { status: 500 });
  }
}
