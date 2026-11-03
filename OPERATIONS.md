# Store backend and owner workspace

This implementation adds a persistent catalog/order API, local SQLite demonstration server, D1-compatible schema, protected owner product/order management, guest checkout, private status links, Razorpay integration, reservation expiry, captured-payment reconciliation, and a retryable email outbox. It has NOT been deployed or enabled on the live domain. Sample products and launch gates remain in place.

## Try the complete local flow

Requires Node.js 22.13+ (Node 24 recommended) because the dependency-free local server uses built-in SQLite. Its experimental warning on some Node versions is expected. Production D1 does not use Node SQLite.

Terminal 1:

```powershell
npm.cmd run server
```

This binds only to 127.0.0.1:8787 and stores test data in ignored `.local-data/store.sqlite`. It prints a random development owner token; do not publish that token. No real payment gateway is contacted in local demonstration mode. Sample shipping is INR 80, free above INR 1,500, all Indian states; these are test values, not approved business rules.

Terminal 2:

```powershell
npm.cmd run dev
```

Open http://127.0.0.1:5173 . The development frontend defaults to the local API. Add products, enter test delivery details, review server totals, then use the explicitly labeled simulated payment. Save the private order tracking link. Open http://127.0.0.1:5173/#admin and enter the token from Terminal 1. Products, stock and orders persist across server restarts. The token changes on restart unless DEVELOPMENT_ADMIN_TOKEN is deliberately set in that terminal's environment; it is never shipped to production.

In admin: add/edit products and real descriptions, choose sample versus real catalog, publish/hide, set available units/making slots and dispatch days. Each product's availability is shared across its design options in this version; separate variant-level stock is not implemented. Editing stock uses optimistic concurrency to avoid overwriting a newer checkout hold. Available stock excludes active holds; expired reservations restore it once. Show preparation/packing stages and enter HTTPS tracking links for shipped orders. Up to 100 latest orders are shown. Do not use local SQLite as Vercel production storage.

## Architecture with the existing Vercel frontend

The public frontend remains on Vercel. Deploy backend/worker.js to Cloudflare Workers with a D1 binding. It can also serve the compiled frontend assets for the owner workspace. No paid authentication library, database server, SMS service or storefront subscription was added.

1. Sign in to the business Cloudflare account using Wrangler. Provision a D1 database, then replace REPLACE_WITH_YOUR_D1_DATABASE_ID in backend/wrangler.jsonc with its actual ID. This step requires an account and is not completed by checking in the configuration.
2. Apply backend/migrations/0001_store.sql to the intended D1 database. The migration creates an EMPTY production catalog. The local samples are deliberately not automatically seeded into production.
3. Set Worker secrets ORDER_TOKEN_SECRET (high-entropy random value, kept stable), Razorpay credentials/webhook secret, Access issuer/audience/owner email allowlist, and optional Resend credentials. Follow backend/.dev.vars.example as a key list; do not reuse example values or commit actual secrets.
4. Set ALLOWED_ORIGINS to the exact frontend origins, including https://www.pvcreations.com and https://pvcreations.com. Restrict additional previews to specific approved origins rather than wildcard access.
5. Keep PAYMENTS_ENABLED=false initially. Configure BUSINESS_WHATSAPP as country code plus digits (no plus/spaces), CONTACT_EMAIL, owner-approved SHIPPING_SUMMARY and SHIPPING_RULES JSON. Example shape ONLY: {"states":["Delhi"],"flatPaise":8000,"freeAbovePaise":150000,"pinPrefixes":["110"]}. A wildcard states entry means all states and should be used only if genuinely supported. Amounts are paise. Prices must include any applicable tax under the approved pricing approach; separate tax calculation is not implemented.
6. Run npm run build; deploy using Wrangler with backend/wrangler.jsonc. Do not switch Namecheap nameservers or alter existing website DNS for this task. A Worker hostname can initially serve the API.
7. Protect BOTH /admin and /api/admin/* on the backend hostname using one Cloudflare Access application. Set ACCESS_ISSUER and ACCESS_AUD to that application's exact values. Require identity-provider MFA for owner access. The Worker validates token signatures, issuer, audience, expiry and the OWNER_EMAILS allowlist. Protect /api/admin/* before entering any real customer data. No public development-token fallback exists in the Worker.
8. Open https://BACKEND-HOST/admin for the owner workspace. In this path the frontend uses the same backend origin so Access can inject and validate the identity token. Do not use Vercel's /#admin as the production owner dashboard. The backend API paths /api/store, /api/checkout, /api/orders/*, payment verification and webhooks remain available to customers/provider as appropriate, not behind the staff login gate. Alternate hosts still cannot obtain admin data without a valid application JWT and allowlisted owner identity.
9. Add VITE_API_URL=https://BACKEND-HOST in Vercel and rebuild/redeploy the frontend. This is a public API origin, not a secret. Without this setting production stays in the existing preview behavior. A preview deployment can use a separate test backend/database; do not use production PII in previews.

Wrangler examples (run from project root; CLI installation and Cloudflare authorization required):

```powershell
npx.cmd wrangler login
npx.cmd wrangler d1 create pv-creations
npx.cmd wrangler d1 migrations apply pv-creations --remote --config backend/wrangler.jsonc
npx.cmd wrangler secret put ORDER_TOKEN_SECRET --config backend/wrangler.jsonc
npx.cmd wrangler deploy --config backend/wrangler.jsonc
```

The full first deployment needs the confirmed D1 ID, secrets, Access app, shipping configuration and owner identity, not merely these commands.

## Payment testing and launch

Use the owner's Razorpay TEST account first. Set PAYMENTS_ENABLED=true with test keys. Register /api/webhooks/razorpay for payment.captured and refund.processed; set the matching webhook secret. Confirm payments are captured under the merchant's approved capture settings. Never put a key secret, Access token or order-token secret in VITE_* variables.

Checkout recalculates price and shipping, stores address and product snapshots, and reserves availability in a single SQL transaction. Unique attempt references prevent duplicate reservations. Stock constraints roll back the entire multi-item order. A provider order is created server-side; the browser callback verifies its signature, then the API fetches the payment and checks order ID, amount, currency and captured status. A paid transition is idempotent. Expired holds release stock once. A captured payment received after release goes to payment_review and MUST be handled by the owner with fulfillment or refund; it is not silently confirmed. The ten-minute scheduled task reconciles recent pending provider orders and processes bounded outbox batches.

The returned private order token grants order-item/status access, not the delivery address or owner controls. Keep its link private. Outbound payment-received emails are queued once and sent through Resend when configured. Missing email credentials leave jobs pending without undoing payment; monitor the table. Retry exhaustion and permanent email failures need operator attention. No WhatsApp automation or paid messaging service is included. Provider creation timeouts may leave an unlinked provider order and need review; no unlinked payment can automatically confirm a local order.

Before LIVE keys work, set CATALOG_APPROVED=true and POLICIES_APPROVED=true only after the owner approves the actual catalog, photos, materials, dimensions, availability, shipping/tax treatment and visible policy content. Provide approved text in SHIPPING_POLICY, RETURNS_POLICY, PRIVACY_POLICY and TERMS_POLICY. All four must contain substantive text before live mode is enabled; these are exposed read-only on the storefront and inside checkout. Live checkout also refuses any product still marked sample. The flags and minimum text checks are launch gates, not substitutes for human policy approval. Until configured, public policy copy remains a draft.

Live readiness still requires: real contact details, owner-approved policies and legal/tax decisions, approved merchant account and test/live webhook configuration, real shipping rules and dispatch capacity, identity/MFA setup, tested backups and restoration, provider monitoring/alerts, and real purchase/refund/delivery acceptance tests. Initiate refunds in the Razorpay dashboard for this version. Processed refund webhooks update payment state; staff must independently stop/cancel fulfillment and decide if stock should be returned. An automated refund/cancellation UI is not implemented.

Custom requests open WhatsApp when the real number is configured. Online custom quoting, customer reference uploads, separate variant stock, courier booking APIs, customer accounts and automatic custom-quote payment links are NOT implemented in this iteration. Do not advertise those as available. Owner product-photo uploads and customer product galleries are implemented as described below.

## Product photos: device uploads and galleries

Both Add product and Edit product use a device photo picker instead of an image-path field. Owners can select or drop multiple JPG/PNG/WebP files, up to eight photos per product, choose a cover, reorder, and remove photos from the gallery. At least one photo is required to save; having four or more is supported but not mandatory. Existing single-image products remain editable without migration. The first gallery image becomes the listing/cart cover, and customers can view every photo with thumbnails and previous/next controls in product details.

The picker accepts source files up to 10 MB and 40 megapixels, then prepares WebP versions with the longest edge capped at 1600 pixels before upload. Uploads are sequential, show progress, and retain successful photos if another file fails. The owner must press Save piece to attach the chosen/reordered gallery to the product. The backend separately requires owner authentication, limits each prepared upload to 2 MB, inspects raster signatures/dimensions, and stores random immutable object keys. SVG/HEIC are not accepted; convert HEIC to JPG first. No filenames or paths from the device become filesystem paths.

Local uploads persist in ignored `.local-data/uploads/`, outside public/ and source files. The backend serves them at `/api/images/{generated-key}`. Photo URLs are resolved against the configured backend origin, so Vercel does not need uploaded files added to its repository or redeployed. Gallery metadata is stored in the existing products.data JSON; no SQL schema change is required. Back up both the database and uploaded files.

Production requires a private Cloudflare R2 bucket named `pv-creations-product-images`, bound to the Worker as PRODUCT_IMAGES (declared in backend/wrangler.jsonc). Activate R2 in the business account if necessary and create the bucket before deploying:

```powershell
npx.cmd wrangler r2 bucket create pv-creations-product-images
```

R2 provisioning and backend deployment have not been performed by the local implementation. Missing storage produces a clear upload error. Do not use Vercel's temporary filesystem for persistent photos. The Worker exposes public read-only photo URLs; keep `/api/admin/images` behind the existing Access application alongside other admin API routes. Browser code never receives R2 write credentials. See https://developers.cloudflare.com/r2/api/workers/workers-api-reference/ .

Removing a photo from a gallery removes its product reference, not the stored object immediately, because historic order snapshots may still refer to it. Uploads made before Cancel can also remain unreferenced. Include unreferenced-object review/retention in storage maintenance, preserving images used by orders before deleting anything. Do not configure automatic bucket-wide deletion. Usage limits and billing still apply to R2.

`scripts/check-photos.cjs` exercises both owner workflows, persistence, cover/reorder/removal, invalid-file feedback and customer galleries on desktop/mobile. It uses only local sample products and hides its new test product afterward. Set PV_TEST_OWNER_TOKEN from the local backend terminal before running it. `npm test` also verifies storage persistence, authentication, invalid/oversized uploads, multi-photo metadata, and single-photo compatibility.

Confirmed owner input, 3 November 2026: business WhatsApp is +91 93802 50104; continue using the current sample catalog for development; Razorpay account is not ready. The public contact number is included in src/business.js and backend configuration. Never enable live payments on these sample records.

## Verification

```powershell
npm.cmd test
npm.cmd run build
```

Tests cover server totals, bad inputs, idempotency, stock rollback, expiry, late/duplicate payment processing, private access, shipping rules, launch gating, signatures, admin boundaries and CORS. They use a local D1-shaped SQLite adapter, not the actual Cloudflare runtime; remote D1/Access and real Razorpay test-mode checks are separately required before production.

Do not commit `.local-data`, `.dev.vars`, `.env`, customer records, payment tokens or cloud credentials. Vercel deployment ignores backend/testing files; Cloudflare receives its explicitly configured Worker and static assets. Keep encrypted off-provider SQL exports and product-image backups and rehearse restoration. Monitor provider usage limits and payment exceptions; free-tier capacity is not guaranteed.
