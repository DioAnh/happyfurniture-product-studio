# Happy Furniture Product Studio

## Product scope

A separate owner-only admin web app for creating furniture products without changing the customer storefront repository. The app accepts a product brief, dimensions, material codes, and pricing rule; creates one locked render master per size; renders the material variants; validates 2048×2048 WebP output below 100 kB; uploads validated assets to the existing Happy Furniture Supabase Storage; and publishes product-group/variant records using the existing site schema.

## Approach

- Next.js App Router with server routes for all Supabase and image-service access.
- Supabase credentials remain server-only protected environment values.
- Product jobs are modeled as explicit stages: draft → master preview → approved → rendering → validated → published.
- The browser only receives safe metadata, progress, errors, and public image URLs.
- The first release keeps schema-specific publication in a small adapter so the existing storefront schema can be verified without coupling the admin UI to the customer app.
- Owner-only access is enforced by the private project boundary and the admin app's authenticated session; no public customer pages are included.

## Design direction

- **Movement:** editorial workshop console (0.06 probability); **alternative:** dense operations dashboard (0.05); **alternative:** warm catalog back office (0.04).
- **Chosen:** editorial workshop console. The interface uses a warm paper canvas, ink-black type, brass accent lines, and compact measurement cards so product creation feels like a controlled design studio rather than a generic SaaS form.
- **Principles:** geometry before decoration; clear stage visibility; calm density; visible material provenance.
- **Layout:** a left rail for job stages and a wide work surface for the active brief, with a narrow right column for validation and publish readiness.
- **Typography:** system sans for controls paired with a restrained serif display treatment for the studio title.

## Project structure

- `src/app/page.tsx`: product studio dashboard.
- `src/app/products/new/page.tsx`: new product brief form.
- `src/app/api/materials/route.ts`: safe material registry read.
- `src/app/api/products/route.ts`: draft creation and publish adapter entry point.
- `src/app/api/jobs/[id]/route.ts`: job status and retry surface.
- `src/app/api/render/route.ts`: one geometry-locked render request and validated upload.
- `src/app/api/publish/route.ts`: dry-run/live publication boundary.
- `src/lib/supabase.ts`: server-only Supabase client.
- `src/lib/product-pipeline.ts`: validation, pricing, stage transitions, and adapter boundaries.
- `src/lib/render-service.ts`: platform image service call, 2K WebP normalization, white-background margin detection, and Supabase Storage upload.
- `src/lib/publisher.ts`: verified `product_groups`/`products` mapping with live writes guarded separately from dry-run previews.

## Deferred integration boundary

The exact existing product-group/variant column names are treated as an adapter contract. The admin UI and pipeline are implemented independently; the final publish adapter must be mapped against the verified production schema before enabling live writes.
