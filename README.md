# Carter’s Holiday List

A mobile-first gift registry built to solve a real family problem: buying useful gifts without duplicates. Family members browse an approved catalog, open the store link, and return to mark a gift purchased. The owner manages the catalog through a separate authenticated view.

Built by Caroline Byrnes with Codex. This repository is a showcase snapshot of the working application; family payment destinations and production data are excluded.

![Carter’s holiday portrait](public/images/carter-banner-navy.webp)

## Product experience

- Four categories: educational toys, clothes, investment gifts, and miscellaneous essentials.
- Browse first, claim after purchase. Purchased gifts retain their store links and display a clear status badge.
- Shared purchase tracking backed by Cloudflare D1, including an atomic capacity check to prevent conflicting claims.
- Owner controls to edit, remove, and restore catalog items.
- Direct provider contribution links and locally generated QR codes for investment gifts.
- Responsive navy and light-blue gingham winter styling, inclusive of different holidays.
- Full-screen portrait viewer with double-click or double-tap, native image sharing/download, and no orientation lock.

## Design decisions

**Keep the catalog intentional.** Family members choose from an approved list, while the owner can adjust items without editing code.

**Separate shopping from claiming.** People need to inspect a product before deciding to buy it. Store links stay available even after purchase.

**Keep payments with the provider.** The registry does not collect card details or process payments. Investment buttons open the configured provider destination.

**Treat mobile as the primary surface.** Cards stack on phones, controls have touch targets, and the photo viewer fits the visible viewport with safe-area spacing.

## Stack

React 19 · TypeScript · vinext/Vite · Tailwind CSS 4 · Radix UI · Cloudflare Workers · D1/SQLite · Drizzle · Zod

## Run locally

Requires Node.js 22.13+ and the pnpm version pinned in `package.json`. Python 3 is used for the claim verification script.

```sh
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

Open `http://localhost:5173`. The bundled Sites plugin provides local mock sign-in as `seedy@sites.test`; `.env.example` grants that mock identity owner access. This mock authentication is for local development only.

D1 migrations live in `drizzle/`. The local preview uses Cloudflare’s local database emulator. Before using the registry, apply the SQL migrations to the local database through Wrangler in filename order. The public catalog is then seeded on first registry request. See [development notes](docs/DEVELOPMENT.md) for configuration and hosting boundaries.

## Verification

```sh
pnpm typecheck
pnpm test:claims
pnpm build
```

The claim verification script exercises the actual claim SQL against SQLite: simultaneous claims, capacity limits, disabled gifts, expiration, cancellation, and the exclusion of investment gifts from purchase claims. It does not replace end-to-end browser testing.

## Project structure

| Path | Responsibility |
| --- | --- |
| `app/registry.tsx` | Guest registry, owner editor, photo viewer |
| `app/api/` | Catalog, purchase claims, owner updates |
| `lib/registry.ts` | Database access, validation, seeding, owner checks |
| `lib/catalog.ts` | Initial sample catalog |
| `app/chatgpt-auth.ts` | Hosted authentication integration |
| `db/`, `drizzle/` | Schema and migrations |
| `components/ui/` | Reusable accessible UI primitives |
| `public/` | Portraits, product imagery, font assets |

## Boundaries

This is a source showcase, not a ready-made GitHub Pages app. It needs a Worker runtime and D1. Hosted owner authentication currently depends on Sites injecting verified identity headers. An independent deployment needs an equivalent trusted authentication layer; do not expose the app with caller-controlled identity headers.

The public snapshot contains sample payment identifiers and no family contribution URLs, live database, session cookies, environment secrets, or production Git history. The college fund’s maxed-out state is currently a configured UI rule, not a balance synchronized from the provider.

Product prices and sample links can change. Provider logos and product images belong to their respective owners; the bundled Nunito font and vendored utilities retain their license notices. Portraits are included for this project’s presentation. No broad license is granted for personal imagery or third-party assets.
