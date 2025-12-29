# PolyPicks

Next.js 14 + Prisma dashboard for Polymarket markets.

## Setup
- Install deps: `npm install`
- Set `DATABASE_URL` to a Postgres connection string.
- Copy `.env.example` to `.env` and update:
  - `DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"`
- Optional local SQLite:
  - Set `DATABASE_URL="file:./data/polypicks.db"`
  - Run `npx prisma generate --schema prisma/schema.sqlite.prisma`
- For soccer stats, set `FOOTBALL_DATA_API_KEY` in `.env.local` (local dev) or Vercel Project Settings → Environment Variables.
- Generate Prisma client: `npx prisma generate`
- Start dev server: `npm run dev`

## Vercel
- Set `DATABASE_URL` in Project Settings to your Postgres connection string.
- Run migrations in production:
  - Option A: set Vercel Build Command to `npm run prisma:migrate && npm run build`
  - Option B: run `npx prisma migrate deploy` manually after deploys

The app uses the Polymarket Gamma/Data API and an optional RTDS WebSocket for live prices.
