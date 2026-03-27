"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Trash2, ArrowRightLeft } from "lucide-react";
import { getLanguageName } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface TMEntry {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function TranslationMemoryPage() {
  const [entries, setEntries] = React.useState<TMEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    fetch("/api/translation-memory")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this TM entry?")) return;
    const res = await fetch("/api/translation-memory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Delete ALL translation memory entries? This cannot be undone.")) return;
    const res = await fetch("/api/translation-memory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      setEntries([]);
    }
  };

  const filtered = entries.filter(
    (e) =>
      e.sourceText.toLowerCase().includes(search.toLowerCase()) ||
      e.translatedText.toLowerCase().includes(search.toLowerCase())
  );

  const languagePairs = Array.from(new Set(entries.map((e) => `${e.sourceLanguage}-${e.targetLanguage}`)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Translation Memory</h1>
          <p className="text-muted-foreground">
            Previously translated segments for reuse across projects
          </p>
        </div>
        {entries.length > 0 && (
          <Button variant="outline" className="text-destructive" onClick={handleClearAll}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{entries.length}</p>
            <p className="text-sm text-muted-foreground">Total Entries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{languagePairs.length}</p>
            <p className="text-sm text-muted-foreground">Language Pairs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">
              {entries.reduce((acc, e) => acc + e.usageCount, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Reuses</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search translation memory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="text-lg font-medium">
              {search ? "No matching entries" : "Translation memory is empty"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Try a different search term"
                : "Translation memory entries are automatically created when translations are saved"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {getLanguageName(entry.sourceLanguage)}
                        </Badge>
                      </div>
                      <p className="text-sm">{entry.sourceText}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className="text-xs">
                          {getLanguageName(entry.targetLanguage)}
                        </Badge>
                      </div>
                      <p className="text-sm">{entry.translatedText}</p>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-xs">
                      Used {entry.usageCount}x
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.updatedAt), { addSuffix: true })}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
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
