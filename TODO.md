# TODO — Happy Furniture Product Studio

- [ ] Owner-only admin access: only the owner can open the standalone app and invoke server routes; no customer storefront pages are included.
- [x] Product brief form: capture product name, description, construction notes, size names/dimensions in mm, selected Ba Thanh material codes, and pricing formula.
- [ ] Geometry-lock workflow: create and approve one studio master per size before any material variants are rendered.
- [ ] Variant generation workflow: render every size × material combination while preserving each size's camera, geometry, hardware, plane contrast, lighting, and soft shadow.
- [ ] Render service: use the platform image API with each Ba Thanh material reference and upload the normalized result to `product-images/{baseSku}/{size}/{material}/hero-v1.webp`.
- [ ] Image validator: require square 2048×2048 WebP, pure white background, centered subject, at least 20% edge clearance, and file size below 100 kB.
- [ ] Progress and recovery: show stage and per-variant status, preserve failed errors, and allow retry of only failed variants.
- [x] Supabase integration: read approved material assets server-side, upload validated WebP files to the existing product-images bucket, and never expose the server key to the browser.
- [x] Publication adapter: map verified production product-group, variant, pricing, material, image, and avatar fields before enabling live writes.
- [ ] Live-write guard: keep publication in dry-run mode until owner-only authentication and the final product identity rules are enabled in production.
- [ ] Deployment: save a checkpoint, connect the standalone project to its own GitHub/Vercel project, and publish after the production secrets and schema adapter are verified.
