import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { stringId, language, translatedText, status, translatedBy } = body;

    if (!stringId || !language || !translatedText) {
      return NextResponse.json(
        { error: "stringId, language, and translatedText are required" },
        { status: 400 }
      );
    }

    const translation = await prisma.translation.upsert({
      where: { stringId_language: { stringId, language } },
      update: {
        translatedText,
        status: status || "draft",
        translatedBy: translatedBy || "human",
      },
      create: {
        stringId,
        language,
        translatedText,
        status: status || "draft",
        translatedBy: translatedBy || "human",
      },
    });

    // Also save to translation memory
    const sourceString = await prisma.translationString.findUnique({
      where: { id: stringId },
      include: { project: { select: { sourceLanguage: true } } },
    });

    if (sourceString) {
      await prisma.translationMemory.upsert({
        where: {
          sourceText_sourceLanguage_targetLanguage: {
            sourceText: sourceString.sourceText,
            sourceLanguage: sourceString.project.sourceLanguage,
            targetLanguage: language,
          },
        },
        update: {
          translatedText,
          usageCount: { increment: 1 },
        },
        create: {
          sourceText: sourceString.sourceText,
          translatedText,
          sourceLanguage: sourceString.project.sourceLanguage,
          targetLanguage: language,
        },
      });
    }

    return NextResponse.json(translation);
  } catch (error) {
    console.error("Error saving translation:", error);
    return NextResponse.json({ error: "Failed to save translation" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const translation = await prisma.translation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(translation);
  } catch (error) {
    console.error("Error updating translation status:", error);
    return NextResponse.json({ error: "Failed to update translation" }, { status: 500 });
  }
}
