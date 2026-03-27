import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProjectDetailClient } from "./project-detail-client";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      strings: {
        include: { translations: true },
        orderBy: { createdAt: "desc" },
      },
      jobs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!project) notFound();

  return (
    <ProjectDetailClient
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        sourceLanguage: project.sourceLanguage,
        targetLanguages: JSON.parse(project.targetLanguages) as string[],
        contentType: project.contentType,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      }}
      strings={project.strings.map((s) => ({
        id: s.id,
        key: s.key,
        sourceText: s.sourceText,
        context: s.context,
        maxLength: s.maxLength,
        translations: s.translations.map((t) => ({
          id: t.id,
          language: t.language,
          translatedText: t.translatedText,
          status: t.status,
          translatedBy: t.translatedBy,
        })),
      }))}
      jobs={project.jobs.map((j) => ({
        id: j.id,
        name: j.name,
        status: j.status,
        progress: j.progress,
        totalStrings: j.totalStrings,
        completedStrings: j.completedStrings,
        createdAt: j.createdAt.toISOString(),
      }))}
    />
  );
}
