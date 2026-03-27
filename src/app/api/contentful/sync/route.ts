import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  fetchContentfulContentTypes,
  fetchContentfulEntries,
  extractTranslatableFields,
  fetchContentfulLocales,
} from "@/lib/contentful";

export const runtime = "edge";

// POST: Import Contentful entries into a Linguo project as translation strings
export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { projectId, contentTypeId, entryIds } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Get Contentful config
    const integration = await prisma.integration.findUnique({
      where: { type: "contentful" },
    });
    if (!integration || !integration.enabled) {
      return NextResponse.json({ error: "Contentful integration not configured" }, { status: 400 });
    }

    const config = JSON.parse(integration.config || "{}");
    if (!config.spaceId || !config.accessToken) {
      return NextResponse.json({ error: "Contentful credentials missing" }, { status: 400 });
    }

    // Get content types for field metadata
    const contentTypes = await fetchContentfulContentTypes(config);

    // Get locales to determine source locale
    const locales = await fetchContentfulLocales(config);
    const defaultLocale = locales.find((l) => l.default)?.code || "en-US";

    // Fetch entries
    let entries;
    if (entryIds && entryIds.length > 0) {
      // Fetch specific entries
      const allEntries = await fetchContentfulEntries(config, contentTypeId, 0, 1000);
      entries = allEntries.items.filter((e) => entryIds.includes(e.sys.id));
    } else if (contentTypeId) {
      // Fetch all entries of a content type
      const data = await fetchContentfulEntries(config, contentTypeId, 0, 1000);
      entries = data.items;
    } else {
      return NextResponse.json(
        { error: "Either contentTypeId or entryIds is required" },
        { status: 400 }
      );
    }

    // Extract translatable fields and create strings
    let created = 0;
    let skipped = 0;

    for (const entry of entries) {
      const fields = extractTranslatableFields(entry, contentTypes, defaultLocale);

      for (const field of fields) {
        try {
          await prisma.translationString.upsert({
            where: {
              projectId_key: {
                projectId,
                key: field.key,
              },
            },
            update: {
              sourceText: field.sourceText,
              context: `Contentful entry ${entry.sys.id}, field: ${field.fieldId}`,
            },
            create: {
              projectId,
              key: field.key,
              sourceText: field.sourceText,
              context: `Contentful entry ${entry.sys.id}, field: ${field.fieldId}`,
            },
          });
          created++;
        } catch {
          skipped++;
        }
      }
    }

    // Update the integration's last sync timestamp
    await prisma.integration.update({
      where: { type: "contentful" },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      entriesProcessed: entries.length,
      stringsCreated: created,
      stringsSkipped: skipped,
      sourceLocale: defaultLocale,
    });
  } catch (error) {
    console.error("Contentful sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
