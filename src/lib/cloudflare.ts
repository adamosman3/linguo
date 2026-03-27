export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationResponse {
  translatedText: string;
  success: boolean;
  error?: string;
}

export async function translateWithCloudflare(
  request: TranslationRequest
): Promise<TranslationResponse> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CF_AI_TOKEN;

  if (!accountId || !apiToken) {
    return {
      translatedText: "",
      success: false,
      error: "Cloudflare credentials not configured. Set CLOUDFLARE_ACCOUNT_ID and CF_AI_TOKEN in .env",
    };
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/m2m100-1.2b`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: request.text,
          source_lang: request.sourceLanguage,
          target_lang: request.targetLanguage,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return {
        translatedText: "",
        success: false,
        error: `Cloudflare API error: ${response.status} - ${errorData}`,
      };
    }

    const data = await response.json();
    return {
      translatedText: data.result?.translated_text || "",
      success: true,
    };
  } catch (error) {
    return {
      translatedText: "",
      success: false,
      error: `Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function translateBatch(
  texts: TranslationRequest[]
): Promise<TranslationResponse[]> {
  const results = await Promise.all(texts.map(translateWithCloudflare));
  return results;
}
