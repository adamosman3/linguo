import { prisma } from "@/lib/db";
import { ProjectsClient } from "./projects-client";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { strings: true, jobs: true } },
    },
  });

  return (
    <ProjectsClient
      projects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        sourceLanguage: p.sourceLanguage,
        targetLanguages: JSON.parse(p.targetLanguages),
        contentType: p.contentType,
        status: p.status,
        stringCount: p._count.strings,
        jobCount: p._count.jobs,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
    />
  );
}
