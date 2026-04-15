# QuickSplit Workspace

## Overview

QuickSplit is a fintech bill-splitting web app for the Saudi market. When the master payer creates a bill and adds members by phone number, the app automatically creates StreamPay payment links for each member and StreamPay sends them personalized WhatsApp messages with their individual payment link (Mada / STC Pay). As payments come in via webhook, the bill progress updates in real time.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/quicksplit) — at root path "/"
- **API framework**: Express 5 (artifacts/api-server) — at path "/api"
- **Database**: PostgreSQL + Drizzle ORM
- **Payment gateway**: StreamPay (sandbox) — Saudi market, Mada + STC Pay
- **WhatsApp delivery**: StreamPay native (via consumer communication_methods: WHATSAPP)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/quicksplit run dev` — run frontend locally

## Database Schema

- **bills** — master bill record (payer info, total amount, per-person split, status: active/pending/settled)
- **split_items** — one per member per bill (amount, status: unpaid/paid, StreamPay consumer/link IDs)
- **transactions** — payment confirmation records from StreamPay webhooks

## StreamPay Integration

### Credentials (env vars)
- `STREAMPAY_API_KEY` — API key
- `STREAMPAY_SECRET_KEY` — Secret key
- `STREAMPAY_BASE_URL` — https://stream-app-service.streampay.sa
- Auth: Base64(`api-key:api-secret`) in `x-api-key` header

### Flow
1. POST /bills → creates bill in DB
2. For each member: POST /api/v2/consumers (with communication_methods: ["WHATSAPP"])
3. POST /api/v2/products (one-time product for the split amount)
4. POST /api/v2/payment_links (per member, tied to their consumer)
5. StreamPay sends WhatsApp message with payment link to each member's phone
6. Member clicks link, pays via Mada/STC Pay on StreamPay's hosted checkout
7. StreamPay fires POST /api/webhooks/streampay with custom_metadata.split_item_id
8. Server marks split_item as paid, checks if all paid → settles bill

## Pages

- `/` — Home: enter phone number
- `/dashboard` — Payer dashboard: stats + bill list
- `/create` — Create bill: add description, total, members
- `/bills/:billId` — Bill detail: progress bar, member list, QR code + share link
- `/pay/:billId` — Public payment page (zero-friction, no login required)
- `/pay/:billId/success` — Payment success
- `/pay/:billId/failure` — Payment failure

## API Endpoints

- `GET /api/healthz` — health check
- `GET /api/bills?payerPhone=...` — list bills for payer
- `POST /api/bills` — create bill + split items + StreamPay links
- `GET /api/bills/:billId` — bill detail with split items
- `GET /api/bills/:billId/summary` — payment progress
- `GET /api/payer/stats?payerPhone=...` — dashboard stats
- `POST /api/webhooks/streampay` — StreamPay payment webhook

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
