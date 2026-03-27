"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BookMarked, Plus, Search, Edit3, Trash2, ShieldAlert } from "lucide-react";
import { LANGUAGES } from "@/lib/utils";

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string | null;
  translations: string;
  doNotTranslate: boolean;
  caseSensitive: boolean;
}

export default function GlossaryPage() {
  const [terms, setTerms] = React.useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [showAdd, setShowAdd] = React.useState(false);
  const [editing, setEditing] = React.useState<GlossaryTerm | null>(null);
  const [form, setForm] = React.useState({
    term: "",
    definition: "",
    doNotTranslate: false,
    caseSensitive: false,
    translations: {} as Record<string, string>,
  });

  React.useEffect(() => {
    fetch("/api/glossary")
      .then((r) => r.json())
      .then((data) => {
        setTerms(data);
        setLoading(false);
      });
  }, []);

  const resetForm = () => {
    setForm({ term: "", definition: "", doNotTranslate: false, caseSensitive: false, translations: {} });
  };

  const handleSave = async () => {
    if (!form.term.trim()) return;

    const payload = {
      ...(editing ? { id: editing.id } : {}),
      term: form.term,
      definition: form.definition || null,
      doNotTranslate: form.doNotTranslate,
      caseSensitive: form.caseSensitive,
      translations: form.translations,
    };

    const res = await fetch("/api/glossary", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved = await res.json();
      if (editing) {
        setTerms((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      } else {
        setTerms((prev) => [...prev, saved]);
      }
      setShowAdd(false);
      setEditing(null);
      resetForm();
    }
  };

  const handleEdit = (term: GlossaryTerm) => {
    setEditing(term);
    setForm({
      term: term.term,
      definition: term.definition || "",
      doNotTranslate: term.doNotTranslate,
      caseSensitive: term.caseSensitive,
      translations: JSON.parse(term.translations || "{}"),
    });
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this glossary term?")) return;
    const res = await fetch("/api/glossary", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setTerms((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const filtered = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Glossary</h1>
          <p className="text-muted-foreground">
            Manage terminology and preferred translations
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditing(null);
            setShowAdd(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Term
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{terms.length}</p>
            <p className="text-sm text-muted-foreground">Total Terms</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{terms.filter((t) => t.doNotTranslate).length}</p>
            <p className="text-sm text-muted-foreground">Do Not Translate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">
              {terms.reduce((acc, t) => acc + Object.keys(JSON.parse(t.translations || "{}")).length, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Term Translations</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search glossary..."
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
            <BookMarked className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 className="text-lg font-medium">
              {search ? "No matching terms" : "Glossary is empty"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add terms to ensure consistent translations
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((term) => {
            const translations = JSON.parse(term.translations || "{}");
            const translationEntries = Object.entries(translations);

            return (
              <Card key={term.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{term.term}</h3>
                        {term.doNotTranslate && (
                          <Badge variant="destructive" className="text-xs">
                            <ShieldAlert className="mr-1 h-3 w-3" />
                            Do Not Translate
                          </Badge>
                        )}
                        {term.caseSensitive && (
                          <Badge variant="secondary" className="text-xs">
                            Case Sensitive
                          </Badge>
                        )}
                      </div>
                      {term.definition && (
                        <p className="text-sm text-muted-foreground mb-2">{term.definition}</p>
                      )}
                      {translationEntries.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {translationEntries.map(([lang, text]) => (
                            <Badge key={lang} variant="outline" className="text-xs">
                              <span className="font-bold mr-1">{lang}:</span> {text as string}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(term)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(term.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={showAdd}
        onOpenChange={(open) => {
          setShowAdd(open);
          if (!open) {
            setEditing(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Term" : "Add Glossary Term"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the glossary term and its translations"
                : "Add a new term to ensure consistent translations"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Term *</label>
              <Input
                value={form.term}
                onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))}
                placeholder="e.g., API, Dashboard"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Definition</label>
              <Textarea
                value={form.definition}
                onChange={(e) => setForm((p) => ({ ...p, definition: e.target.value }))}
                placeholder="What does this term mean in your context?"
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.doNotTranslate}
                  onChange={(e) => setForm((p) => ({ ...p, doNotTranslate: e.target.checked }))}
                  className="rounded"
                />
                Do Not Translate
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.caseSensitive}
                  onChange={(e) => setForm((p) => ({ ...p, caseSensitive: e.target.checked }))}
                  className="rounded"
                />
                Case Sensitive
              </label>
            </div>
            {!form.doNotTranslate && (
              <div>
                <label className="text-sm font-medium mb-2 block">Preferred Translations</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {LANGUAGES.filter((l) => l.code !== "en").slice(0, 10).map((lang) => (
                    <div key={lang.code} className="flex items-center gap-2">
                      <span className="w-20 text-xs font-medium text-muted-foreground">
                        {lang.code}
                      </span>
                      <Input
                        value={form.translations[lang.code] || ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            translations: { ...p.translations, [lang.code]: e.target.value },
                          }))
                        }
                        placeholder={`${lang.name} translation`}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.term.trim()}>
              {editing ? "Update Term" : "Add Term"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
