// Edge-compatible auth utilities using Web Crypto API

const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const JWT_SECRET = "linguo-jwt-secret-2024"; // In production, use an env var
const JWT_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH * 8
  );
  return `${bufferToHex(salt.buffer)}:${bufferToHex(derivedBits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = hexToBuffer(saltHex);
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH * 8
  );
  return bufferToHex(derivedBits) === hashHex;
}

// Simple JWT using HMAC-SHA256
export async function createToken(payload: Record<string, unknown>): Promise<string> {
  const encoder = new TextEncoder();
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(
    JSON.stringify({ ...payload, exp: Date.now() + JWT_EXPIRY })
  );
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${header}.${body}`)
  );
  return `${header}.${body}.${bufferToHex(signature)}`;
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBuffer(sig) as unknown as BufferSource,
      encoder.encode(`${header}.${body}`)
    );
    if (!valid) return null;

    const payload = JSON.parse(atob(body));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const AUTH_COOKIE = "linguo_session";
