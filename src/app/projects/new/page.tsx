"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { LANGUAGES, CONTENT_TYPES } from "@/lib/utils";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sourceLanguage, setSourceLanguage] = React.useState("en");
  const [targetLanguages, setTargetLanguages] = React.useState<string[]>([]);
  const [contentType, setContentType] = React.useState("website");

  const availableTargets = LANGUAGES.filter(
    (l) => l.code !== sourceLanguage && !targetLanguages.includes(l.code)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          sourceLanguage,
          targetLanguages,
          contentType,
        }),
      });

      if (res.ok) {
        const project = await res.json();
        router.push(`/projects/${project.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Project</h1>
          <p className="text-muted-foreground">Set up a new translation project</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Details</CardTitle>
            <CardDescription>Basic information about your project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Project Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Marketing Website, Q1 Email Campaign"
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this project..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content Type</label>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => setContentType(ct.value)}
                    className={`rounded-lg border-2 p-3 text-center text-sm font-medium transition-colors ${
                      contentType === ct.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Languages</CardTitle>
            <CardDescription>Configure source and target languages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Source Language</label>
              <select
                value={sourceLanguage}
                onChange={(e) => {
                  setSourceLanguage(e.target.value);
                  setTargetLanguages((prev) =>
                    prev.filter((l) => l !== e.target.value)
                  );
                }}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Target Languages</label>
              {targetLanguages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {targetLanguages.map((code) => {
                    const lang = LANGUAGES.find((l) => l.code === code);
                    return (
                      <Badge key={code} variant="secondary" className="gap-1 pr-1">
                        {lang?.name || code}
                        <button
                          type="button"
                          onClick={() =>
                            setTargetLanguages((prev) =>
                              prev.filter((l) => l !== code)
                            )
                          }
                          className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setTargetLanguages((prev) => [...prev, e.target.value]);
                  }
                }}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Add a target language...</option>
                {availableTargets.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/projects">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
