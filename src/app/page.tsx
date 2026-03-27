import { prisma } from "@/lib/db";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [projectCount, stringCount, translationCount, approvedCount, tmCount, glossaryCount, recentProjects, recentJobs] = await Promise.all([
    prisma.project.count(),
    prisma.translationString.count(),
    prisma.translation.count(),
    prisma.translation.count({ where: { status: "approved" } }),
    prisma.translationMemory.count(),
    prisma.glossaryTerm.count(),
    prisma.project.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { strings: true } } },
    }),
    prisma.translationJob.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { project: { select: { name: true } } },
    }),
  ]);

  const completionRate = translationCount > 0 ? Math.round((approvedCount / translationCount) * 100) : 0;

  return (
    <DashboardClient
      stats={{
        projectCount,
        stringCount,
        translationCount,
        approvedCount,
        completionRate,
        tmCount,
        glossaryCount,
      }}
      recentProjects={recentProjects.map((p) => ({
        id: p.id,
        name: p.name,
        contentType: p.contentType,
        targetLanguages: JSON.parse(p.targetLanguages),
        stringCount: p._count.strings,
        updatedAt: p.updatedAt.toISOString(),
      }))}
      recentJobs={recentJobs.map((j) => ({
        id: j.id,
        name: j.name,
        projectName: j.project.name,
        status: j.status,
        progress: j.progress,
        createdAt: j.createdAt.toISOString(),
      }))}
    />
  );
}
