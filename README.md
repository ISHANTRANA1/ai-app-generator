# AppForge — AI App Generator

> Full Stack Track A submission — AI App Generator

Live demo: *deploy to Vercel + Neon, then add URL here*

## What it does

Describe any app in plain English → AppForge generates a structured JSON config → a runtime engine renders a fully working frontend + backend with live CRUD, forms, tables, and dashboards.

**Built with:** Next.js 15, TypeScript, TailwindCSS, PostgreSQL, Prisma, NextAuth v5, Anthropic Claude API

---

## Architecture

```
User (natural language prompt)
         ↓
  /api/generate  →  Claude API  →  JSON Config
                                        ↓
                              validateAndSanitizeConfig()
                              (graceful handling of broken/missing fields)
                                        ↓
                        ┌──────────────┴──────────────┐
                   AppRuntime                    Prisma ORM
                  (frontend)                   (PostgreSQL)
              ┌─────────┼──────────┐                ↓
         TableRenderer  FormRenderer  DashboardRenderer
                        ↓
              /api/apps/[appId]/records/[entity]
              (dynamic CRUD — no hardcoded schemas)
```

### Key design decisions

**Config-driven runtime** — The entire app is driven by a JSON config schema. The frontend rendering engine reads `entities` and `pages` and renders the appropriate components dynamically. There is no hardcoded UI for any specific entity.

**Graceful degradation** — `configValidator.ts` sanitizes every config before use. Unknown field types render as `unknown` with a warning. Pages referencing missing entities show an error card without crashing. Missing required values show inline validation errors.

**Dynamic CRUD APIs** — `/api/apps/[appId]/records/[entity]` handles all data operations without knowing the schema ahead of time. Validation happens at runtime by reading the entity config from the DB.

**JWT sessions** — Using NextAuth v5 with JWT strategy to avoid extra DB roundtrips on every request.

---

## Features

### Mandatory
- ✅ AI config generation (Claude API)
- ✅ Frontend rendering engine (FormRenderer, TableRenderer, DashboardRenderer, AppRuntime)
- ✅ Dynamic backend CRUD APIs
- ✅ PostgreSQL + Prisma ORM
- ✅ Authentication (Email/Password + GitHub OAuth + Google OAuth)
- ✅ Deployment-ready (Vercel + Neon)

### Optional (3 of 3 implemented)
- ✅ **CSV Import** — Upload CSV files; columns are mapped to entity fields automatically
- ✅ **GitHub Export** — Exports README, schema SQL, and app config JSON to a new GitHub repo
- ✅ **Multi-auth login** — Email/password, GitHub OAuth, Google OAuth via NextAuth v5

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd ai-app-generator
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL` — PostgreSQL connection string (use [Neon](https://neon.tech) for free)
- `NEXTAUTH_SECRET` — Run `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` locally
- `ANTHROPIC_API_KEY` — From [console.anthropic.com](https://console.anthropic.com)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — From GitHub OAuth App settings
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — From Google Cloud Console

### 3. Database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment (Vercel + Neon)

1. Create a Neon database at [neon.tech](https://neon.tech)
2. Push to GitHub
3. Import repo in Vercel, add all environment variables
4. Vercel will run `npm run build` which includes Prisma generate

---

## Edge case handling

| Scenario | Behavior |
|----------|----------|
| Unknown field type in config | Renders as text input with amber warning badge |
| Page references missing entity | Shows error card, rest of app works |
| Missing required fields on submit | Inline validation errors per field |
| Malformed JSON from Claude | Regex extraction fallback, then `validateAndSanitizeConfig` |
| Empty enum options | Shows warning instead of broken select |
| CSV with mismatched columns | Skipped rows reported in import result |
| Invalid config object | Returns default empty config with warnings |

---

## Project structure

```
app/
  api/
    auth/           # NextAuth + register endpoint
    generate/       # Claude API → JSON config
    apps/
      [appId]/
        records/[entity]/          # Dynamic CRUD
        records/[entity]/[recordId]/ # Update/Delete
        import/[entity]/           # CSV import
        export/github/             # GitHub export
  (pages)/
    page.tsx        # Landing
    login/          # Auth pages
    register/
    dashboard/      # App list + generator
    app/[appId]/    # Runtime page

components/engine/
  FieldRenderer.tsx    # Single field (all types)
  FormRenderer.tsx     # Full form from entity config
  TableRenderer.tsx    # Table with CRUD + CSV import
  DashboardRenderer.tsx # Stats overview
  AppRuntime.tsx       # Sidebar nav + page switcher

lib/
  types.ts             # AppConfig, EntityConfig, etc.
  configValidator.ts   # Sanitize + validate configs
  prisma.ts            # DB client
  auth.ts              # NextAuth config
```
