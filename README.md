# Happy Furniture Product Studio

Standalone owner workspace for creating furniture product families. This project is intentionally separate from the customer storefront source repository.

## What is implemented

The first release provides a focused product-brief dashboard, size and material selection, brief validation, job staging, a verified Supabase material-registry read, a guarded publication payload adapter for the existing `product_groups` and `products` tables, and a server-side render service that calls the platform image API, normalizes output to 2048×2048 WebP under 100 kB, checks white-space margins, and uploads validated assets to `product-images`.

Live database publication is deliberately guarded. Without `HAPPY_FURNITURE_ALLOW_LIVE_PUBLISH=true`, `/api/publish` returns a complete dry-run payload and performs no database write. This keeps the new admin tool safe while the owner reviews the schema mapping and owner-only access boundary.

## Environment

The following values are protected server environment variables and must never be placed in browser code or committed files:

- `HAPPY_FURNITURE_SUPABASE_URL`
- `HAPPY_FURNITURE_SUPABASE_SECRET_KEY`
- Platform-provided `MANUS_API_URL` and `MANUS_API_KEY` for image generation
- `HAPPY_FURNITURE_ALLOW_LIVE_PUBLISH` should only be enabled after the app is private and the owner has approved live publication.

## Development

```bash
pnpm install
pnpm dev
```

The app runs on port 3000. The main routes are `/` and `/products/new`.

## Product workflow

Enter the brief, add one or more sizes in millimetres, select Ba Thanh material codes, and submit the master-preview job. The app treats each size as a locked geometry master; material variants must preserve camera, proportions, hardware, plane contrast, lighting, shadow, and white-background spacing. The publication adapter creates one `product_groups` row and one `products` row for each size × material combination when live mode is enabled.
