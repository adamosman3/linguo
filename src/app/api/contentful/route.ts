import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  fetchContentfulContentTypes,
  fetchContentfulEntries,
  fetchContentfulLocales,
  testContentfulConnection,
} from "@/lib/contentful";

export const runtime = "edge";

// GET: Fetch Contentful content types, entries, or locales
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Get saved Contentful config
  const integration = await prisma.integration.findUnique({
    where: { type: "contentful" },
  });

  if (!integration || !integration.enabled) {
    return NextResponse.json(
      { error: "Contentful integration not configured" },
      { status: 400 }
    );
  }

  const config = JSON.parse(integration.config || "{}");
  if (!config.spaceId || !config.accessToken) {
    return NextResponse.json(
      { error: "Contentful Space ID and Access Token are required" },
      { status: 400 }
    );
  }

  try {
    if (action === "content-types") {
      const contentTypes = await fetchContentfulContentTypes(config);
      return NextResponse.json(contentTypes);
    }

    if (action === "locales") {
      const locales = await fetchContentfulLocales(config);
      return NextResponse.json(locales);
    }

    if (action === "entries") {
      const contentTypeId = searchParams.get("contentType") || undefined;
      const skip = parseInt(searchParams.get("skip") || "0");
      const limit = parseInt(searchParams.get("limit") || "50");
      const data = await fetchContentfulEntries(config, contentTypeId, skip, limit);
      return NextResponse.json(data);
    }

    if (action === "test") {
      const result = await testContentfulConnection(config);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Contentful API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Contentful request failed" },
      { status: 500 }
    );
  }
}
