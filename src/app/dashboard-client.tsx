"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FolderOpen,
  FileText,
  Languages,
  CheckCircle2,
  BookOpen,
  BookMarked,
  Plus,
  ArrowRight,
} from "lucide-react";
import { getContentTypeLabel, JOB_STATUSES } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface DashboardProps {
  stats: {
    projectCount: number;
    stringCount: number;
    translationCount: number;
    approvedCount: number;
    completionRate: number;
    tmCount: number;
    glossaryCount: number;
  };
  recentProjects: {
    id: string;
    name: string;
    contentType: string;
    targetLanguages: string[];
    stringCount: number;
    updatedAt: string;
  }[];
  recentJobs: {
    id: string;
    name: string;
    projectName: string;
    status: string;
    progress: number;
    createdAt: string;
  }[];
}

export function DashboardClient({ stats, recentProjects, recentJobs }: DashboardProps) {
  const statCards = [
    { label: "Projects", value: stats.projectCount, icon: FolderOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Source Strings", value: stats.stringCount, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Translations", value: stats.translationCount, icon: Languages, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Approved", value: stats.approvedCount, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "TM Entries", value: stats.tmCount, icon: BookOpen, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Glossary Terms", value: stats.glossaryCount, icon: BookMarked, color: "text-pink-600", bg: "bg-pink-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your translation management</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                </div>
                <div className={`rounded-lg ${stat.bg} p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.translationCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {stats.approvedCount} of {stats.translationCount} translations approved
                </span>
                <span className="font-medium">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Projects</CardTitle>
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <Link href="/projects/new">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {getContentTypeLabel(project.contentType)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {project.stringCount} strings
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {project.targetLanguages.length} languages
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Translation Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Languages className="mb-2 h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No translation jobs yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job) => {
                  const statusInfo = JOB_STATUSES[job.status as keyof typeof JOB_STATUSES] || JOB_STATUSES.pending;
                  return (
                    <div key={job.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{job.name}</p>
                          <p className="text-xs text-muted-foreground">{job.projectName}</p>
                        </div>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      <div className="mt-2">
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
