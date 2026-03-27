-- Migration: Initial schema for Linguo TMS on Cloudflare D1

CREATE TABLE IF NOT EXISTS "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceLanguage" TEXT NOT NULL DEFAULT 'en',
    "targetLanguages" TEXT NOT NULL DEFAULT '[]',
    "contentType" TEXT NOT NULL DEFAULT 'website',
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "TranslationString" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "context" TEXT,
    "maxLength" INTEGER,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TranslationString_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TranslationString_projectId_key_key" ON "TranslationString"("projectId", "key");

CREATE TABLE IF NOT EXISTS "Translation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "translatedText" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "translatedBy" TEXT NOT NULL DEFAULT 'machine',
    "stringId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Translation_stringId_fkey" FOREIGN KEY ("stringId") REFERENCES "TranslationString" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Translation_stringId_language_key" ON "Translation"("stringId", "language");

CREATE TABLE IF NOT EXISTS "TranslationJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "targetLanguages" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "totalStrings" INTEGER NOT NULL DEFAULT 0,
    "completedStrings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TranslationJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TranslationMemory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "sourceLanguage" TEXT NOT NULL,
    "targetLanguage" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "TranslationMemory_sourceText_sourceLanguage_targetLanguage_key" ON "TranslationMemory"("sourceText", "sourceLanguage", "targetLanguage");

CREATE TABLE IF NOT EXISTS "GlossaryTerm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "term" TEXT NOT NULL,
    "definition" TEXT,
    "translations" TEXT NOT NULL DEFAULT '{}',
    "doNotTranslate" BOOLEAN NOT NULL DEFAULT false,
    "caseSensitive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "GlossaryTerm_term_key" ON "GlossaryTerm"("term");

CREATE TABLE IF NOT EXISTS "Integration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "config" TEXT NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Integration_type_key" ON "Integration"("type");

CREATE TABLE IF NOT EXISTS "Language" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nativeName" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isSource" BOOLEAN NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS "Language_code_key" ON "Language"("code");

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT 'translator',
    "status" TEXT NOT NULL DEFAULT 'active',
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
