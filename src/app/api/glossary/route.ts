import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "edge";

export async function GET() {
  const terms = await prisma.glossaryTerm.findMany({
    orderBy: { term: "asc" },
  });
  return NextResponse.json(terms);
}

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { term, definition, translations, doNotTranslate, caseSensitive } = body;

    if (!term) {
      return NextResponse.json({ error: "Term is required" }, { status: 400 });
    }

    const entry = await prisma.glossaryTerm.create({
      data: {
        term,
        definition: definition || null,
        translations: JSON.stringify(translations || {}),
        doNotTranslate: doNotTranslate || false,
        caseSensitive: caseSensitive || false,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating glossary term:", error);
    return NextResponse.json({ error: "Failed to create glossary term" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { id, term, definition, translations, doNotTranslate, caseSensitive } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (term !== undefined) data.term = term;
    if (definition !== undefined) data.definition = definition;
    if (translations !== undefined) data.translations = JSON.stringify(translations);
    if (doNotTranslate !== undefined) data.doNotTranslate = doNotTranslate;
    if (caseSensitive !== undefined) data.caseSensitive = caseSensitive;

    const entry = await prisma.glossaryTerm.update({
      where: { id },
      data,
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error updating glossary term:", error);
    return NextResponse.json({ error: "Failed to update glossary term" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.glossaryTerm.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting glossary term:", error);
    return NextResponse.json({ error: "Failed to delete glossary term" }, { status: 500 });
  }
}
