// Contentful Content Delivery API + Content Management API client

interface ContentfulConfig {
  spaceId: string;
  accessToken: string;
  managementToken?: string;
  environment?: string;
}

interface ContentfulEntry {
  sys: {
    id: string;
    type: string;
    contentType: { sys: { id: string } };
    locale?: string;
    updatedAt: string;
    createdAt: string;
  };
  fields: Record<string, unknown>;
}

interface ContentfulContentType {
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

interface ContentfulSpace {
  sys: { id: string };
  name: string;
  locales: Array<{
    code: string;
    name: string;
    default: boolean;
  }>;
}

export async function fetchContentfulSpace(config: ContentfulConfig): Promise<ContentfulSpace> {
  const env = config.environment || "master";
  const res = await fetch(
    `https://cdn.contentful.com/spaces/${config.spaceId}/environments/${env}?access_token=${config.accessToken}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Contentful API error: ${res.status}`);
  }
  return res.json();
}

export async function fetchContentfulLocales(config: ContentfulConfig) {
  const env = config.environment || "master";
  const res = await fetch(
    `https://cdn.contentful.com/spaces/${config.spaceId}/environments/${env}/locales?access_token=${config.accessToken}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch locales: ${res.status}`);
  }
  const data = await res.json();
  return data.items as Array<{ code: string; name: string; default: boolean }>;
}

export async function fetchContentfulContentTypes(config: ContentfulConfig): Promise<ContentfulContentType[]> {
  const env = config.environment || "master";
  const res = await fetch(
    `https://cdn.contentful.com/spaces/${config.spaceId}/environments/${env}/content_types?access_token=${config.accessToken}&limit=100`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch content types: ${res.status}`);
  }
  const data = await res.json();
  return data.items;
}

export async function fetchContentfulEntries(
  config: ContentfulConfig,
  contentTypeId?: string,
  skip = 0,
  limit = 50
): Promise<{ items: ContentfulEntry[]; total: number }> {
  const env = config.environment || "master";
  let url = `https://cdn.contentful.com/spaces/${config.spaceId}/environments/${env}/entries?access_token=${config.accessToken}&skip=${skip}&limit=${limit}&locale=*`;
  if (contentTypeId) {
    url += `&content_type=${contentTypeId}`;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch entries: ${res.status}`);
  }
  const data = await res.json();
  return { items: data.items, total: data.total };
}

export async function fetchContentfulEntry(
  config: ContentfulConfig,
  entryId: string
): Promise<ContentfulEntry> {
  const env = config.environment || "master";
  const res = await fetch(
    `https://cdn.contentful.com/spaces/${config.spaceId}/environments/${env}/entries/${entryId}?access_token=${config.accessToken}&locale=*`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch entry: ${res.status}`);
  }
  return res.json();
}

/**
 * Extract translatable text fields from a Contentful entry.
 * Returns an array of { key, value, fieldId, locale } for each text field.
 */
export function extractTranslatableFields(
  entry: ContentfulEntry,
  contentTypes: ContentfulContentType[],
  sourceLocale: string
): Array<{ key: string; sourceText: string; fieldId: string; locale: string }> {
  const ct = contentTypes.find(
    (c) => c.sys.id === entry.sys.contentType?.sys?.id
  );
  if (!ct) return [];

  const results: Array<{ key: string; sourceText: string; fieldId: string; locale: string }> = [];

  for (const field of ct.fields) {
    // Only extract text-like fields
    if (!["Symbol", "Text", "RichText"].includes(field.type)) continue;
    if (!field.localized) continue;

    const fieldValues = entry.fields[field.id];
    if (!fieldValues || typeof fieldValues !== "object") continue;

    const localeValues = fieldValues as Record<string, unknown>;
    const sourceValue = localeValues[sourceLocale];
    if (!sourceValue || typeof sourceValue !== "string") continue;

    results.push({
      key: `${entry.sys.id}.${field.id}`,
      sourceText: sourceValue,
      fieldId: field.id,
      locale: sourceLocale,
    });
  }

  return results;
}

/**
 * Update a Contentful entry's localized field via the Content Management API.
 * Requires a managementToken.
 */
export async function updateContentfulEntryField(
  config: ContentfulConfig & { managementToken: string },
  entryId: string,
  fieldId: string,
  locale: string,
  value: string,
  currentVersion: number
): Promise<boolean> {
  const env = config.environment || "master";

  // First, fetch the current entry from CMA
  const getRes = await fetch(
    `https://api.contentful.com/spaces/${config.spaceId}/environments/${env}/entries/${entryId}`,
    {
      headers: {
        Authorization: `Bearer ${config.managementToken}`,
      },
    }
  );
  if (!getRes.ok) throw new Error(`Failed to fetch entry for update: ${getRes.status}`);

  const entry = await getRes.json();
  const version = entry.sys.version || currentVersion;

  // Update the specific field locale
  if (!entry.fields[fieldId]) entry.fields[fieldId] = {};
  entry.fields[fieldId][locale] = value;

  // PUT the updated entry
  const putRes = await fetch(
    `https://api.contentful.com/spaces/${config.spaceId}/environments/${env}/entries/${entryId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${config.managementToken}`,
        "Content-Type": "application/vnd.contentful.management.v1+json",
        "X-Contentful-Version": String(version),
      },
      body: JSON.stringify({ fields: entry.fields }),
    }
  );

  return putRes.ok;
}

export async function testContentfulConnection(config: ContentfulConfig): Promise<{ success: boolean; message: string; spaceName?: string }> {
  try {
    const space = await fetchContentfulSpace(config);
    return {
      success: true,
      message: `Connected to space "${space.name}" successfully`,
      spaceName: space.name,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to connect to Contentful",
    };
  }
}
