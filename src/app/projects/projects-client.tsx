"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  FolderOpen,
  Archive,
  Trash2,
} from "lucide-react";
import {
  getLanguageName,
  getContentTypeLabel,
} from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  description: string | null;
  sourceLanguage: string;
  targetLanguages: string[];
  contentType: string;
  status: string;
  stringCount: number;
  jobCount: number;
  createdAt: string;
  updatedAt: string;
}

export function ProjectsClient({ projects }: { projects: Project[] }) {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<string>("all");

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" || p.contentType === filter || p.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    window.location.reload();
  };

  const handleArchive = async (id: string) => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your translation projects
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["all", "website", "email_iterable", "email_marketo", "archived"].map(
            (f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === "all"
                  ? "All"
                  : f === "archived"
                  ? "Archived"
                  : getContentTypeLabel(f)}
              </Button>
            )
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="text-lg font-medium">No projects found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? "Try a different search term" : "Create your first project to get started"}
            </p>
            {!search && (
              <Link href="/projects/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((project) => (
            <Card key={project.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <Link href={`/projects/${project.id}`} className="flex-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold hover:text-primary">
                          {project.name}
                        </h3>
                        {project.status === "archived" && (
                          <Badge variant="secondary">Archived</Badge>
                        )}
                      </div>
                      {project.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Badge variant="outline">
                          {getContentTypeLabel(project.contentType)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {getLanguageName(project.sourceLanguage)} →{" "}
                          {project.targetLanguages.length} languages
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {project.stringCount} strings
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {project.jobCount} jobs
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Updated{" "}
                          {formatDistanceToNow(new Date(project.updatedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {project.targetLanguages.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {project.targetLanguages.slice(0, 6).map((lang: string) => (
                            <Badge key={lang} variant="secondary" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                          {project.targetLanguages.length > 6 && (
                            <Badge variant="secondary" className="text-xs">
                              +{project.targetLanguages.length - 6} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleArchive(project.id)}
                      title="Archive"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(project.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
