"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Languages,
  FileText,
  Zap,
  CheckCircle2,
  Clock,
  XCircle,
  Edit3,
  Trash2,
  Save,
  RotateCcw,
} from "lucide-react";
import {
  getLanguageName,
  getContentTypeLabel,
  TRANSLATION_STATUSES,
  JOB_STATUSES,
} from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface TranslationType {
  id: string;
  language: string;
  translatedText: string;
  status: string;
  translatedBy: string;
}

interface StringType {
  id: string;
  key: string;
  sourceText: string;
  context: string | null;
  maxLength: number | null;
  translations: TranslationType[];
}

interface JobType {
  id: string;
  name: string;
  status: string;
  progress: number;
  totalStrings: number;
  completedStrings: number;
  createdAt: string;
}

interface ProjectType {
  id: string;
  name: string;
  description: string | null;
  sourceLanguage: string;
  targetLanguages: string[];
  contentType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  project: ProjectType;
  strings: StringType[];
  jobs: JobType[];
}

export function ProjectDetailClient({ project, strings: initialStrings, jobs }: Props) {
  const [strings, setStrings] = React.useState(initialStrings);
  const [showAddString, setShowAddString] = React.useState(false);
  const [editingTranslation, setEditingTranslation] = React.useState<{
    stringId: string;
    language: string;
    text: string;
  } | null>(null);
  const [translating, setTranslating] = React.useState(false);
  const [translateResult, setTranslateResult] = React.useState<string | null>(null);
  const [newString, setNewString] = React.useState({ key: "", sourceText: "", context: "" });
  const [addingString, setAddingString] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>(
    project.targetLanguages[0] || ""
  );

  const totalExpected = strings.length * project.targetLanguages.length;
  const totalTranslations = strings.reduce((acc, s) => acc + s.translations.length, 0);
  const approvedTranslations = strings.reduce(
    (acc, s) => acc + s.translations.filter((t) => t.status === "approved").length,
    0
  );
  const completionPct = totalExpected > 0 ? Math.round((totalTranslations / totalExpected) * 100) : 0;
  const approvalPct = totalExpected > 0 ? Math.round((approvedTranslations / totalExpected) * 100) : 0;

  const handleAddString = async () => {
    if (!newString.key || !newString.sourceText) return;
    setAddingString(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/strings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newString),
      });
      if (res.ok) {
        const created = await res.json();
        setStrings((prev) => [created, ...prev]);
        setNewString({ key: "", sourceText: "", context: "" });
        setShowAddString(false);
      }
    } finally {
      setAddingString(false);
    }
  };

  const handleDeleteString = async (id: string) => {
    if (!confirm("Delete this string and all its translations?")) return;
    const res = await fetch(`/api/strings/${id}`, { method: "DELETE" });
    if (res.ok) {
      setStrings((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleTranslateAll = async () => {
    setTranslating(true);
    setTranslateResult(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setTranslateResult(
          `Completed: ${data.completed}/${data.total} translations. ${
            data.errors?.length ? `${data.errors.length} errors.` : ""
          }`
        );
        window.location.reload();
      } else {
        setTranslateResult(data.error || "Translation failed");
      }
    } catch {
      setTranslateResult("Translation request failed");
    } finally {
      setTranslating(false);
    }
  };

  const handleSaveTranslation = async () => {
    if (!editingTranslation) return;
    const res = await fetch("/api/translations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stringId: editingTranslation.stringId,
        language: editingTranslation.language,
        translatedText: editingTranslation.text,
        translatedBy: "human",
        status: "draft",
      }),
    });
    if (res.ok) {
      const saved = await res.json();
      setStrings((prev) =>
        prev.map((s) => {
          if (s.id !== editingTranslation.stringId) return s;
          const existing = s.translations.findIndex(
            (t) => t.language === editingTranslation.language
          );
          const translations = [...s.translations];
          if (existing >= 0) {
            translations[existing] = { ...translations[existing], translatedText: saved.translatedText, translatedBy: "human" };
          } else {
            translations.push({
              id: saved.id,
              language: saved.language,
              translatedText: saved.translatedText,
              status: saved.status,
              translatedBy: saved.translatedBy,
            });
          }
          return { ...s, translations };
        })
      );
      setEditingTranslation(null);
    }
  };

  const handleStatusChange = async (translationId: string, newStatus: string, stringId: string) => {
    const res = await fetch("/api/translations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: translationId, status: newStatus }),
    });
    if (res.ok) {
      setStrings((prev) =>
        prev.map((s) => {
          if (s.id !== stringId) return s;
          return {
            ...s,
            translations: s.translations.map((t) =>
              t.id === translationId ? { ...t, status: newStatus } : t
            ),
          };
        })
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="outline">{getContentTypeLabel(project.contentType)}</Badge>
          </div>
          {project.description && (
            <p className="mt-1 text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTranslateAll} disabled={translating || strings.length === 0}>
            <Zap className="mr-2 h-4 w-4" />
            {translating ? "Translating..." : "Auto-Translate All"}
          </Button>
        </div>
      </div>

      {translateResult && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-sm text-blue-800">{translateResult}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{strings.length}</p>
            <p className="text-xs text-muted-foreground">Source Strings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Languages className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{project.targetLanguages.length}</p>
            <p className="text-xs text-muted-foreground">Target Languages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{completionPct}%</p>
            <p className="text-xs text-muted-foreground">Translated</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{approvalPct}%</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="strings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="strings">Strings ({strings.length})</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="languages">Languages ({project.targetLanguages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="strings" className="space-y-4">
          <div className="flex items-center justify-between">
            {project.targetLanguages.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">View language:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {project.targetLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {getLanguageName(lang)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={() => setShowAddString(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add String
            </Button>
          </div>

          {strings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="mb-4 h-16 w-16 text-muted-foreground/30" />
                <h3 className="text-lg font-medium">No strings yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add source strings to start translating
                </p>
                <Button className="mt-4" onClick={() => setShowAddString(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First String
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {strings.map((str) => {
                const translation = str.translations.find(
                  (t) => t.language === selectedLanguage
                );
                const statusInfo = translation
                  ? TRANSLATION_STATUSES[translation.status as keyof typeof TRANSLATION_STATUSES]
                  : null;

                return (
                  <Card key={str.id}>
                    <CardContent className="p-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                              {str.key}
                            </code>
                            {str.context && (
                              <span className="text-xs text-muted-foreground">
                                {str.context}
                              </span>
                            )}
                          </div>
                          <p className="text-sm">{str.sourceText}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {getLanguageName(project.sourceLanguage)} (source)
                          </p>
                        </div>

                        <div>
                          {translation ? (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">
                                    {getLanguageName(selectedLanguage)}
                                  </span>
                                  {statusInfo && (
                                    <Badge className={`text-xs ${statusInfo.color}`}>
                                      {statusInfo.label}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {translation.translatedBy}
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setEditingTranslation({
                                        stringId: str.id,
                                        language: selectedLanguage,
                                        text: translation.translatedText,
                                      })
                                    }
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  {translation.status !== "approved" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-600"
                                      onClick={() =>
                                        handleStatusChange(translation.id, "approved", str.id)
                                      }
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {translation.status !== "rejected" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600"
                                      onClick={() =>
                                        handleStatusChange(translation.id, "rejected", str.id)
                                      }
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {(translation.status === "approved" || translation.status === "rejected") && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleStatusChange(translation.id, "in_review", str.id)
                                      }
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm">{translation.translatedText}</p>
                            </div>
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setEditingTranslation({
                                    stringId: str.id,
                                    language: selectedLanguage,
                                    text: "",
                                  })
                                }
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Add Translation
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {str.translations.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1 border-t pt-3">
                          {project.targetLanguages.map((lang) => {
                            const t = str.translations.find((tr) => tr.language === lang);
                            return (
                              <Badge
                                key={lang}
                                variant={
                                  t?.status === "approved"
                                    ? "success"
                                    : t
                                    ? "info"
                                    : "secondary"
                                }
                                className="text-xs cursor-pointer"
                                onClick={() => setSelectedLanguage(lang)}
                              >
                                {lang}
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteString(str.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No translation jobs yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const statusInfo = JOB_STATUSES[job.status as keyof typeof JOB_STATUSES] || JOB_STATUSES.pending;
                return (
                  <Card key={job.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{job.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{job.completedStrings} / {job.totalStrings} translations</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {project.targetLanguages.map((lang) => {
              const translatedCount = strings.reduce(
                (acc, s) => acc + (s.translations.some((t) => t.language === lang) ? 1 : 0),
                0
              );
              const approvedCount = strings.reduce(
                (acc, s) =>
                  acc +
                  (s.translations.some((t) => t.language === lang && t.status === "approved")
                    ? 1
                    : 0),
                0
              );
              const pct = strings.length > 0 ? Math.round((translatedCount / strings.length) * 100) : 0;

              return (
                <Card key={lang} className="cursor-pointer" onClick={() => { setSelectedLanguage(lang); }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{getLanguageName(lang)}</h3>
                      <Badge variant="outline">{lang}</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{translatedCount}/{strings.length} translated</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {approvedCount} approved
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add String Dialog */}
      <Dialog open={showAddString} onOpenChange={setShowAddString}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New String</DialogTitle>
            <DialogDescription>Add a source string to translate</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">String Key *</label>
              <Input
                value={newString.key}
                onChange={(e) => setNewString((p) => ({ ...p, key: e.target.value }))}
                placeholder="e.g., homepage.hero.title"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Source Text *</label>
              <Textarea
                value={newString.sourceText}
                onChange={(e) => setNewString((p) => ({ ...p, sourceText: e.target.value }))}
                placeholder="Enter the source text to translate..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Context</label>
              <Input
                value={newString.context}
                onChange={(e) => setNewString((p) => ({ ...p, context: e.target.value }))}
                placeholder="e.g., Button label on checkout page"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddString(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddString}
              disabled={addingString || !newString.key || !newString.sourceText}
            >
              {addingString ? "Adding..." : "Add String"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Translation Dialog */}
      <Dialog
        open={!!editingTranslation}
        onOpenChange={(open) => !open && setEditingTranslation(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Translation ({editingTranslation && getLanguageName(editingTranslation.language)})
            </DialogTitle>
          </DialogHeader>
          <div>
            <Textarea
              value={editingTranslation?.text || ""}
              onChange={(e) =>
                setEditingTranslation((prev) =>
                  prev ? { ...prev, text: e.target.value } : null
                )
              }
              rows={4}
              placeholder="Enter translation..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTranslation(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTranslation}>
              <Save className="mr-2 h-4 w-4" />
              Save Translation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
