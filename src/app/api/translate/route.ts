import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { translateWithCloudflare } from "@/lib/cloudflare";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { stringIds, targetLanguages, projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const languages = targetLanguages || JSON.parse(project.targetLanguages);
    
    let strings;
    if (stringIds && stringIds.length > 0) {
      strings = await prisma.translationString.findMany({
        where: { id: { in: stringIds }, projectId },
      });
    } else {
      strings = await prisma.translationString.findMany({
        where: { projectId },
      });
    }

    if (strings.length === 0) {
      return NextResponse.json({ error: "No strings to translate" }, { status: 400 });
    }

    // Create a translation job
    const job = await prisma.translationJob.create({
      data: {
        name: `Auto-translate ${strings.length} strings`,
        projectId,
        targetLanguages: JSON.stringify(languages),
        status: "in_progress",
        totalStrings: strings.length * languages.length,
      },
    });

    // Translate in background (we'll do it inline for simplicity, could be a queue)
    let completed = 0;
    const errors: string[] = [];

    for (const str of strings) {
      for (const lang of languages) {
        // Check TM first
        const tmMatch = await prisma.translationMemory.findUnique({
          where: {
            sourceText_sourceLanguage_targetLanguage: {
              sourceText: str.sourceText,
              sourceLanguage: project.sourceLanguage,
              targetLanguage: lang,
            },
          },
        });

        if (tmMatch) {
          await prisma.translation.upsert({
            where: { stringId_language: { stringId: str.id, language: lang } },
            update: { translatedText: tmMatch.translatedText, translatedBy: "machine", status: "draft" },
            create: {
              stringId: str.id,
              language: lang,
              translatedText: tmMatch.translatedText,
              translatedBy: "machine",
              status: "draft",
            },
          });

          await prisma.translationMemory.update({
            where: { id: tmMatch.id },
            data: { usageCount: { increment: 1 } },
          });

          completed++;
          continue;
        }

        // Check glossary for do-not-translate terms
        const glossaryTerms = await prisma.glossaryTerm.findMany({
          where: { doNotTranslate: true },
        });

        // Use Cloudflare Workers AI
        const result = await translateWithCloudflare({
          text: str.sourceText,
          sourceLanguage: project.sourceLanguage,
          targetLanguage: lang,
        });

        if (result.success) {
          let translatedText = result.translatedText;

          // Apply glossary: restore do-not-translate terms
          for (const term of glossaryTerms) {
            const regex = new RegExp(term.term, term.caseSensitive ? "g" : "gi");
            if (regex.test(str.sourceText)) {
              translatedText = translatedText.replace(regex, term.term);
            }
          }

          // Apply glossary: use preferred translations
          const allGlossary = await prisma.glossaryTerm.findMany({
            where: { doNotTranslate: false },
          });
          for (const term of allGlossary) {
            const translations = JSON.parse(term.translations);
            if (translations[lang]) {
              const regex = new RegExp(term.term, term.caseSensitive ? "g" : "gi");
              translatedText = translatedText.replace(regex, translations[lang]);
            }
          }

          await prisma.translation.upsert({
            where: { stringId_language: { stringId: str.id, language: lang } },
            update: { translatedText, translatedBy: "machine", status: "draft" },
            create: {
              stringId: str.id,
              language: lang,
              translatedText,
              translatedBy: "machine",
              status: "draft",
            },
          });

          // Save to TM
          await prisma.translationMemory.upsert({
            where: {
              sourceText_sourceLanguage_targetLanguage: {
                sourceText: str.sourceText,
                sourceLanguage: project.sourceLanguage,
                targetLanguage: lang,
              },
            },
            update: { translatedText, usageCount: { increment: 1 } },
            create: {
              sourceText: str.sourceText,
              translatedText,
              sourceLanguage: project.sourceLanguage,
              targetLanguage: lang,
            },
          });

          completed++;
        } else {
          errors.push(`Failed to translate "${str.key}" to ${lang}: ${result.error}`);
        }
      }

      // Update job progress
      const progress = Math.round((completed / (strings.length * languages.length)) * 100);
      await prisma.translationJob.update({
        where: { id: job.id },
        data: { progress, completedStrings: completed },
      });
    }

    // Finalize job
    await prisma.translationJob.update({
      where: { id: job.id },
      data: {
        status: errors.length === 0 ? "completed" : completed > 0 ? "completed" : "failed",
        progress: Math.round((completed / (strings.length * languages.length)) * 100),
        completedStrings: completed,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      completed,
      total: strings.length * languages.length,
      errors,
    });
  } catch (error) {
    console.error("Error translating:", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
