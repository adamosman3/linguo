# Linguo - Translation Management System

An internal Smartling-like translation management platform for localizing website content and email campaigns across Iterable and Marketo, powered by Cloudflare Workers AI.

## Features

- **Project Management** — Create and manage translation projects by content type (Website, Iterable Email, Marketo Email)
- **String Management** — Add, edit, and organize source strings with keys, context, and max length constraints
- **Translation Editor** — Side-by-side source/translation view with approval workflow (Draft → In Review → Approved/Rejected)
- **Cloudflare Workers AI** — One-click machine translation using Meta's M2M-100 model via Cloudflare Workers AI
- **Translation Memory** — Automatically stores and reuses past translations to improve consistency and speed
- **Glossary** — Manage terminology with "Do Not Translate" rules and preferred translations per language
- **Iterable Integration** — Connect to Iterable to manage email template translations
- **Marketo Integration** — Connect to Marketo to manage email and landing page translations
- **Language Management** — Enable/disable 30+ languages, set default source language
- **Export** — Export project data as JSON

## Tech Stack

- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** + custom shadcn-style UI components
- **Prisma 5** + **SQLite**
- **Cloudflare Workers AI** (M2M-100 translation model)
- **Lucide** icons

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up the database

```bash
npx prisma db push
npx prisma generate
```

### 3. Configure environment variables

Edit `.env` with your Cloudflare credentials (optional — needed for auto-translation):

```
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

## Usage

1. **Create a Project** — Go to Projects → New Project, choose content type and target languages
2. **Add Strings** — In the project detail view, add source strings with keys (e.g., `homepage.hero.title`)
3. **Translate** — Click "Auto-Translate All" for machine translation, or manually add translations
4. **Review** — Approve or reject translations using the workflow buttons
5. **Configure Integrations** — Set up Cloudflare, Iterable, and/or Marketo connections in the Integrations page
6. **Manage Glossary** — Add terms to enforce consistent translations or mark terms as "Do Not Translate"

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes (projects, strings, translations, etc.)
│   ├── glossary/         # Glossary management page
│   ├── integrations/     # Cloudflare, Iterable, Marketo config
│   ├── languages/        # Language management page
│   ├── projects/         # Project list, detail, and creation
│   ├── settings/         # App settings and data export
│   ├── translation-memory/ # TM viewer
│   ├── layout.tsx        # Root layout with sidebar
│   └── page.tsx          # Dashboard
├── components/
│   ├── layout/           # Sidebar and header
│   └── ui/               # Reusable UI components
├── lib/
│   ├── cloudflare.ts     # Cloudflare Workers AI client
│   ├── db.ts             # Prisma client singleton
│   └── utils.ts          # Utilities, language data, constants
└── prisma/
    └── schema.prisma     # Database schema
