import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { LANGUAGES } from "@/lib/utils";

export const runtime = "edge";

export async function GET() {
  let languages = await prisma.language.findMany({
    orderBy: { name: "asc" },
  });

  // Seed languages if none exist
  if (languages.length === 0) {
    await prisma.language.createMany({
      data: LANGUAGES.map((lang) => ({
        code: lang.code,
        name: lang.name,
        nativeName: lang.nativeName,
        enabled: ["en", "es", "fr", "de", "ja", "zh", "pt-BR", "ko"].includes(lang.code),
        isSource: lang.code === "en",
      })),
    });

    languages = await prisma.language.findMany({
      orderBy: { name: "asc" },
    });
  }

  return NextResponse.json(languages);
}

export async function PATCH(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { id, enabled, isSource } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (enabled !== undefined) data.enabled = enabled;
    if (isSource !== undefined) {
      if (isSource) {
        // Only one source language at a time
        await prisma.language.updateMany({
          where: { isSource: true },
          data: { isSource: false },
        });
      }
      data.isSource = isSource;
    }

    const language = await prisma.language.update({
      where: { id },
      data,
    });

    return NextResponse.json(language);
  } catch (error) {
    console.error("Error updating language:", error);
    return NextResponse.json({ error: "Failed to update language" }, { status: 500 });
  }
}
