# Development and hosting

The production family site is maintained separately. Changes to this showcase repository do not automatically publish to it.

## Local database

The Vite Cloudflare configuration binds D1 as `DB`, with the local database name `site-creator-d1`. Apply each migration before starting to use the app:

```sh
pnpm exec wrangler d1 execute site-creator-d1 --config wrangler.local.jsonc --local --file drizzle/0000_breezy_deadpool.sql
pnpm exec wrangler d1 execute site-creator-d1 --config wrangler.local.jsonc --local --file drizzle/0001_brown_typhoid_mary.sql
pnpm exec wrangler d1 execute site-creator-d1 --config wrangler.local.jsonc --local --file drizzle/0002_majestic_overlord.sql
pnpm exec wrangler d1 execute site-creator-d1 --config wrangler.local.jsonc --local --file drizzle/0003_dusty_bromley.sql
```

`wrangler.local.jsonc` supplies the same local database identity as `vite.config.ts`. Both use the default `.wrangler/state` directory. The placeholder database ID is local-only; it is not a production resource.

## Runtime configuration

- `ADMIN_EMAIL`: owner identity matched against verified authentication.
- `GIFT_SETUP`: JSON setup for one investment gift.
- `GIFT_SETUPS`: JSON array for multiple investment gifts.

Setups use a unique `version`, gift `id` (`trump`, `529`, `custodial`), HTTPS `url`, `outside` amount in cents, and `instructions`. Optional fields include `details`, `description`, and `secondary_url`. Applied versions are recorded so owner edits survive later requests and deployments. Keep real destinations in private runtime configuration.

## Authentication

The local plugin mocks sign-in only for localhost requests. Hosted identity headers must be supplied and protected by a trusted gateway. The app is intentionally tied to Sites authentication; porting to another host requires an authentication integration, not merely changing DNS.

## Publication

The `.openai/hosting.json` showcase file contains logical bindings only. It deliberately omits the family site’s project identity. Create a separate Site or configure an independent Worker deployment rather than connecting this repository to the family’s production database.

## Known implementation tradeoffs

- Initial catalog entries are seeded once; applied setup markers preserve owner changes.
- Investment gifts link out rather than using local purchase tracking.
- The college fund is displayed as maxed out by an explicit UI rule.
- The source still contains legacy reservation support; the current guest purchase flow records gifts after purchase.
- Native save/share behavior depends on browser support; image download and touch-and-hold are fallbacks.


## Portfolio demo

`/demo` renders the registry with an in-memory sample store. All demo reads and writes use that store; API polling and browser tool registration are disabled in demo mode. Owner controls are a public preview, not authenticated access to production. Reload or Reset demo restores sample data. The standalone demo deployment mounts the demo at `/`, replaces API handlers with 410 responses, and omits D1 and R2 bindings. The public GitHub repository retains the original server implementation alongside this isolated route.
