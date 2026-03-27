"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Box,
  Search,
  Download,
  FileText,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface ContentType {
  sys: { id: string };
  name: string;
  description: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    localized: boolean;
  }>;
}

interface Entry {
  sys: {
    id: string;
    contentType: { sys: { id: string } };
    updatedAt: string;
    createdAt: string;
  };
  fields: Record<string, unknown>;
}

interface Locale {
  code: string;
  name: string;
  default: boolean;
}

interface Project {
  id: string;
  name: string;
  contentType: string;
}

export default function ContentfulBrowserPage() {
  const [contentTypes, setContentTypes] = React.useState<ContentType[]>([]);
  const [entries, setEntries] = React.useState<Entry[]>([]);
  const [locales, setLocales] = React.useState<Locale[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingEntries, setLoadingEntries] = React.useState(false);
  const [error, setError] = React.useState("");
  const [selectedContentType, setSelectedContentType] = React.useState("");
  const [selectedEntries, setSelectedEntries] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{
    success: boolean;
    entriesProcessed: number;
    stringsCreated: number;
  } | null>(null);
  const [totalEntries, setTotalEntries] = React.useState(0);

  React.useEffect(() => {
    Promise.all([
      fetch("/api/contentful?action=content-types").then((r) => r.json()),
      fetch("/api/contentful?action=locales").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(([cts, locs, projs]: any[]) => {
        if (cts.error) {
          setError(cts.error);
        } else {
          setContentTypes(cts);
        }
        if (!locs.error) setLocales(locs);
        setProjects(projs);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to connect to Contentful. Check your integration settings.");
        setLoading(false);
      });
  }, []);

  const handleLoadEntries = async (ctId?: string) => {
    setLoadingEntries(true);
    setSelectedEntries(new Set());
    try {
      const url = ctId
        ? `/api/contentful?action=entries&contentType=${ctId}`
        : "/api/contentful?action=entries";
      const res = await fetch(url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setEntries(data.items || []);
        setTotalEntries(data.total || 0);
      }
    } catch {
      setError("Failed to load entries");
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleSelectContentType = (ctId: string) => {
    setSelectedContentType(ctId);
    handleLoadEntries(ctId);
  };

  const toggleEntry = (id: string) => {
    setSelectedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedEntries.size === filteredEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredEntries.map((e) => e.sys.id)));
    }
  };

  const handleImport = async () => {
    if (!selectedProject || selectedEntries.size === 0) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/contentful/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProject,
          contentTypeId: selectedContentType || undefined,
          entryIds: Array.from(selectedEntries),
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      if (res.ok) {
        setImportResult({
          success: true,
          entriesProcessed: data.entriesProcessed,
          stringsCreated: data.stringsCreated,
        });
      } else {
        setError(data.error || "Import failed");
      }
    } catch {
      setError("Import request failed");
    } finally {
      setImporting(false);
    }
  };

  const getContentTypeName = (ctId: string) =>
    contentTypes.find((ct) => ct.sys.id === ctId)?.name || ctId;

  const getEntryTitle = (entry: Entry) => {
    const fields = entry.fields;
    const defaultLocale = locales.find((l) => l.default)?.code || "en-US";

    for (const key of ["title", "name", "heading", "subject", "label", "slug"]) {
      const val = fields[key];
      if (val && typeof val === "object") {
        const localized = val as Record<string, unknown>;
        if (typeof localized[defaultLocale] === "string") return localized[defaultLocale] as string;
        const first = Object.values(localized).find((v) => typeof v === "string");
        if (first) return first as string;
      }
    }

    const firstField = Object.values(fields)[0];
    if (firstField && typeof firstField === "object") {
      const localized = firstField as Record<string, unknown>;
      const first = Object.values(localized).find((v) => typeof v === "string");
      if (first) return (first as string).substring(0, 80);
    }

    return entry.sys.id;
  };

  const getLocalizableFieldCount = (entry: Entry) => {
    const ct = contentTypes.find((c) => c.sys.id === entry.sys.contentType?.sys?.id);
    if (!ct) return 0;
    return ct.fields.filter((f) => f.localized && ["Symbol", "Text", "RichText"].includes(f.type)).length;
  };

  const filteredEntries = entries.filter((entry) => {
    if (!search) return true;
    const title = getEntryTitle(entry).toLowerCase();
    return title.includes(search.toLowerCase()) || entry.sys.id.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && contentTypes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/integrations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contentful Browser</h1>
            <p className="text-muted-foreground">Browse and import Contentful entries</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Box className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="text-lg font-medium">Cannot connect to Contentful</h3>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Link href="/integrations">
              <Button className="mt-4">Configure Integration</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/integrations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Contentful Browser</h1>
          <p className="text-muted-foreground">
            Browse and import Contentful entries for translation
          </p>
        </div>
        {selectedEntries.size > 0 && (
          <Button onClick={() => setShowImportDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            Import {selectedEntries.size} {selectedEntries.size === 1 ? "Entry" : "Entries"}
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-800">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{contentTypes.length}</p>
            <p className="text-xs text-muted-foreground">Content Types</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{locales.length}</p>
            <p className="text-xs text-muted-foreground">Locales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalEntries}</p>
            <p className="text-xs text-muted-foreground">Entries Loaded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{selectedEntries.size}</p>
            <p className="text-xs text-muted-foreground">Selected</p>
          </CardContent>
        </Card>
      </div>

      {/* Locales bar */}
      {locales.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Space Locales:</span>
          {locales.map((locale) => (
            <Badge
              key={locale.code}
              variant={locale.default ? "default" : "outline"}
              className="text-xs"
            >
              {locale.name} ({locale.code})
              {locale.default && " — default"}
            </Badge>
          ))}
        </div>
      )}

      {/* Content Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content Types</CardTitle>
          <CardDescription>Select a content type to browse its entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
            {contentTypes.map((ct) => {
              const localizableFields = ct.fields.filter(
                (f) => f.localized && ["Symbol", "Text", "RichText"].includes(f.type)
              ).length;
              return (
                <button
                  key={ct.sys.id}
                  onClick={() => handleSelectContentType(ct.sys.id)}
                  className={`rounded-lg border-2 p-3 text-left transition-colors ${
                    selectedContentType === ct.sys.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{ct.name}</p>
                  {ct.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {ct.description}
                    </p>
                  )}
                  <div className="mt-1 flex gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {ct.fields.length} fields
                    </Badge>
                    {localizableFields > 0 && (
                      <Badge variant="info" className="text-[10px]">
                        {localizableFields} translatable
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      {(entries.length > 0 || loadingEntries) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  Entries
                  {selectedContentType && ` — ${getContentTypeName(selectedContentType)}`}
                </CardTitle>
                <CardDescription>{totalEntries} total entries</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search entries..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadEntries(selectedContentType || undefined)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEntries ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading entries...</span>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                    Select all ({filteredEntries.length})
                  </label>
                </div>

                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="w-10 px-4 py-3"></th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Entry</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Content Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Translatable Fields</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Entry ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredEntries.map((entry) => (
                        <tr
                          key={entry.sys.id}
                          className={`hover:bg-muted/30 cursor-pointer ${
                            selectedEntries.has(entry.sys.id) ? "bg-primary/5" : ""
                          }`}
                          onClick={() => toggleEntry(entry.sys.id)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedEntries.has(entry.sys.id)}
                              onChange={() => toggleEntry(entry.sys.id)}
                              className="rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium truncate max-w-xs">
                                {getEntryTitle(entry)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {getContentTypeName(entry.sys.contentType?.sys?.id)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-xs">
                              {getLocalizableFieldCount(entry)} fields
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {entry.sys.id}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredEntries.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    {search ? "No entries match your search" : "No entries found"}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Contentful Entries</DialogTitle>
            <DialogDescription>
              Import {selectedEntries.size} {selectedEntries.size === 1 ? "entry" : "entries"} into a
              Linguo project for translation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {importResult ? (
              <div className="rounded-md bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Import Complete</span>
                </div>
                <p className="mt-1 text-sm text-green-700">
                  Processed {importResult.entriesProcessed} entries, created{" "}
                  {importResult.stringsCreated} translation strings.
                </p>
                <Link href={`/projects/${selectedProject}`}>
                  <Button size="sm" className="mt-3">
                    View Project
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium">Target Project</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select a project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Localized text fields from selected entries will be imported as translation strings
                  </p>
                </div>

                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm">
                    <strong>{selectedEntries.size}</strong> entries selected
                    {selectedContentType && (
                      <>
                        {" "}from <strong>{getContentTypeName(selectedContentType)}</strong>
                      </>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportDialog(false); setImportResult(null); }}>
              {importResult ? "Close" : "Cancel"}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImport}
                disabled={importing || !selectedProject}
              >
                <Download className="mr-2 h-4 w-4" />
                {importing ? "Importing..." : "Import Entries"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
