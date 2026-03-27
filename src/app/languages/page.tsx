"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Star } from "lucide-react";

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string | null;
  enabled: boolean;
  isSource: boolean;
}

export default function LanguagesPage() {
  const [languages, setLanguages] = React.useState<Language[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    fetch("/api/languages")
      .then((r) => r.json())
      .then((data) => {
        setLanguages(data);
        setLoading(false);
      });
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    const res = await fetch("/api/languages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
    if (res.ok) {
      setLanguages((prev) =>
        prev.map((l) => (l.id === id ? { ...l, enabled } : l))
      );
    }
  };

  const handleSetSource = async (id: string) => {
    const res = await fetch("/api/languages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isSource: true }),
    });
    if (res.ok) {
      setLanguages((prev) =>
        prev.map((l) => ({ ...l, isSource: l.id === id }))
      );
    }
  };

  const filtered = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName?.toLowerCase().includes(search.toLowerCase())
  );

  const enabledCount = languages.filter((l) => l.enabled).length;
  const sourceLanguage = languages.find((l) => l.isSource);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Languages</h1>
        <p className="text-muted-foreground">
          Manage available languages for translation projects
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{languages.length}</p>
            <p className="text-sm text-muted-foreground">Total Languages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{enabledCount}</p>
            <p className="text-sm text-muted-foreground">Enabled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{sourceLanguage?.name || "—"}</p>
            <p className="text-sm text-muted-foreground">Default Source</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search languages..."
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
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((lang) => (
            <Card
              key={lang.id}
              className={`transition-all ${
                lang.enabled ? "border-primary/20 bg-primary/[0.02]" : "opacity-60"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{lang.name}</h3>
                      {lang.isSource && (
                        <Badge variant="default" className="text-xs">
                          <Star className="mr-1 h-3 w-3" />
                          Source
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lang.nativeName} ({lang.code})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!lang.isSource && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleSetSource(lang.id)}
                        title="Set as source language"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <button
                      onClick={() => handleToggle(lang.id, !lang.enabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        lang.enabled ? "bg-primary" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          lang.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
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
