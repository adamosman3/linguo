import { NextRequest, NextResponse } from "next/server";
import { translateWithCloudflare } from "@/lib/cloudflare";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { type } = body;

    if (type === "cloudflare") {
      const result = await translateWithCloudflare({
        text: "Hello, world!",
        sourceLanguage: "en",
        targetLanguage: "es",
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `Connection successful! Test translation: "${result.translatedText}"`,
        });
      } else {
        return NextResponse.json({
          success: false,
          message: result.error,
        });
      }
    }

    if (type === "iterable") {
      const apiKey = body.apiKey;
      if (!apiKey) {
        return NextResponse.json({ success: false, message: "API key required" });
      }

      try {
        const response = await fetch("https://api.iterable.com/api/campaigns", {
          headers: { "Api-Key": apiKey },
        });

        if (response.ok) {
          return NextResponse.json({ success: true, message: "Connected to Iterable successfully!" });
        } else {
          return NextResponse.json({
            success: false,
            message: `Iterable API returned status ${response.status}`,
          });
        }
      } catch {
        return NextResponse.json({ success: false, message: "Failed to connect to Iterable" });
      }
    }

    if (type === "marketo") {
      const { clientId, clientSecret, munchkinId } = body;
      if (!clientId || !clientSecret || !munchkinId) {
        return NextResponse.json({ success: false, message: "Client ID, Client Secret, and Munchkin ID required" });
      }

      try {
        const tokenUrl = `https://${munchkinId}.mktorest.com/identity/oauth/token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`;
        const response = await fetch(tokenUrl, { method: "GET" });

        if (response.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data: any = await response.json();
          if (data.access_token) {
            return NextResponse.json({ success: true, message: "Connected to Marketo successfully!" });
          }
        }

        return NextResponse.json({ success: false, message: "Failed to authenticate with Marketo" });
      } catch {
        return NextResponse.json({ success: false, message: "Failed to connect to Marketo" });
      }
    }

    if (type === "contentful") {
      const { spaceId, accessToken } = body;
      if (!spaceId || !accessToken) {
        return NextResponse.json({ success: false, message: "Space ID and Access Token required" });
      }

      try {
        const { testContentfulConnection } = await import("@/lib/contentful");
        const result = await testContentfulConnection({ spaceId, accessToken });
        return NextResponse.json(result);
      } catch {
        return NextResponse.json({ success: false, message: "Failed to connect to Contentful" });
      }
    }

    return NextResponse.json({ success: false, message: "Unknown integration type" });
  } catch (error) {
    console.error("Error testing integration:", error);
    return NextResponse.json({ success: false, message: "Test failed" }, { status: 500 });
  }
}
