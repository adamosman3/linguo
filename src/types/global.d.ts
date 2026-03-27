// Fix Next.js 15 Response.json() returning `unknown` instead of `any`
interface Body {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json(): Promise<any>;
}

// Declare Cloudflare D1 binding for @cloudflare/next-on-pages
interface CloudflareEnv {
  DB: D1Database;
}
