# PV Creations — website and business-system blueprint

## Implementation update — 6 October 2026

The requested first deliverable is now a React/Vite frontend preview, prepared for GitHub and Vercel. This supersedes the Astro/Cloudflare storefront hosting choice for this phase. The mom-focused public identity remains unchanged. Products, prices and imagery are illustrative; cart and saved pieces use browser-local storage. Payment processing, order persistence, admin, live WhatsApp and production policies remain future work. The database/backend architecture below is a planning reference and has not been provisioned. Reassess its integration with the chosen frontend before implementing commerce.

The owner will create the GitHub repository. Import it into Vercel with the Vite preset, build command `npm run build`, and output `dist`. Later attach the purchased company domain in Vercel and configure the supplied DNS records. Vercel's Hobby plan is for noncommercial personal use; choose an eligible plan for business hosting. No cloud deployment has been performed by this implementation task.

Planning draft, 4 October 2026. No website, payment account, hosting account, or production integration has been created. This document proposes a custom implementation; the homepage concept is an illustration, not a finished store.

## 1. Brand and customer experience

PV Creations is a crochet brand whose public face is its founder: a mom and her love. The central promise is: handmade pieces that carry the warmth of home and the care of someone who loves you.

Suggested homepage headline: “A little piece of home.” Supporting line: “Handmade crochet, with a mom’s love in every stitch.” The original logo remains the brand identity.

Public presentation rule: showcase the mom, her hands, her story, her craft, and her love. Do not describe relatives' work or contributions in homepage copy, About content, photographs, packaging copy, or marketing. Operational staff roles are private. Use truthful wording; avoid claiming every task is performed solely by her unless the owner confirms that claim. Suggested story heading: "A mom's love. In every stitch."

The first generated concept predates this decision and contains a family-focused story strip. It is an archived visual reference, not approved final copy. Keep its palette and shopping layout; replace that strip and use approved photographs of the actual mom during implementation.

Welcome people buying meaningful gifts, decorating a room, living away from home, or remembering someone dear. Do not define the shop only by grief or imply that purchases replace parental love. Express care through real maker stories, workmanship, packaging, and thoughtful gift messages.

Use rose pink (#B83B60), cocoa brown (#432B24), warm ivory (#FFF9F3), and restrained gold. Pair an editorial serif heading font with a readable sans-serif body font. Use real yarn textures and actual product photography. Check text contrast, mobile layout, keyboard controls, and enlarged text during implementation.

Homepage composition: compact brand/navigation/search/cart header; editorial hero with crochet bouquet; flowers, keychains, and bouquets/vases category tiles; selected products; a short story about the mom and her craft; custom-order invitation; practical shipping/contact/policy footer. Keep shopping accessible from the first screen. On mobile, prioritize search, clear product cards, a usable menu, and thumb-friendly purchase controls.

The detailed logo can appear in the story/footer while a legible compact rendering is used in the header, subject to client agreement. Never invent reviews, sales counts, photographs of the maker, or delivery guarantees.

## 2. Confirmed scope and working assumptions

Confirmed: standard products are ordered and paid for on the website; custom requests begin on WhatsApp; the owner and authorized staff need to manage catalog and orders; Amazon is optional and undecided.

Working assumptions to confirm: India-first, INR pricing, domestic shipping, prepaid launch, guest checkout, manual courier booking initially. Tax handling, merchant eligibility, and policy wording need the actual business details. Account creation is optional for customers; staff accounts are required.

Launch scope: responsive storefront, category/search/filter experience, product details and variants, cart, checkout, online payments, confirmation, secure order tracking, WhatsApp product/custom links, owner/admin workspace, inventory/capacity control, email notifications, shipping rules, and agreed policy pages.

Later: customer accounts, verified reviews, automated courier integration, advanced customization, promotions, wishlists, loyalty, and Amazon synchronization. Defer these unless business evidence makes them necessary.

## 3. Pages and routes

- `/`: homepage and featured collections.
- `/shop`: searchable catalog with category, availability, and price filters.
- `/collections/[slug]`: flowers, keychains, bouquets/vases, and future categories.
- `/products/[slug]`: product gallery, price, options, materials, dimensions, care, availability, dispatch estimate, purchase and WhatsApp actions.
- `/cart`: quantities, variants, price summary, remove/update controls.
- `/checkout`: contact, delivery address, PIN code/serviceability, shipping, taxes if applicable, final total, payment.
- `/order/confirmation`: customer-specific confirmation; never publicly expose another order.
- `/track-order`: verified or high-entropy private-link access to status.
- `/custom-orders`: explain the discussion/quote process and open WhatsApp.
- `/our-story`: the mom's story with her approved photos.
- `/contact`, `/faq`, and shipping, returns/cancellations, privacy, and terms pages.
- `/admin`: protected owner/staff workspace.

Product detail must answer what is included, whether the vase is included, approximate size, yarn/material, care, ready-to-ship versus made-to-order, dispatch lead time, and natural handmade variation. Never assume that a photographed accessory is part of the sale.

## 4. Standard order flow

1. Customer finds a product, chooses an available variant, and adds a quantity to cart.
2. Cart is a convenience, not a reservation. Checkout rechecks price, availability, shipping serviceability, and production capacity on the server.
3. Server creates a pending order with immutable line-item, address, and price snapshots. Reserve stock or production slots atomically for a defined payment window.
4. Server creates a payment-provider order for the exact total; browser opens provider checkout.
5. Verify payment signatures and independently confirm provider status. Only a verified captured payment/order-paid event makes an order paid.
6. A single idempotent transition commits the reservation and enqueues confirmation. Customer sees paid, pending-verification, or failure accurately.
7. The owner or authorized staff sees the paid order, prepares or makes it, packs it, books shipping, and adds courier/tracking details.
8. Customer receives updates. Admin records delivery based on courier evidence; refunds remain separate payment operations.

Keep payment status separate from fulfillment status. Payment: pending, authorized, paid/captured, failed, partially refunded, refunded. Fulfillment: unconfirmed, confirmed, in production, ready to ship, shipped, delivered, cancelled.

Failure handling: duplicate clicks reuse the checkout attempt; repeated/out-of-order webhooks do not duplicate orders; browser closure does not lose payment; delayed payments reconcile; expired reservations release stock; a captured payment arriving after release triggers stock/capacity review and appropriate refund or approved fulfillment. Do not leave paid customers silently unfulfilled. Notification failure must not undo payment.

## 5. Custom orders and WhatsApp

Use product-specific prefilled click-to-chat messages containing product title, selected option, and URL. The general customization CTA asks the customer to discuss their idea, colors, quantity, occasion, and required date. Clicking a link is not a submitted order and does not import chat history into the database.

The owner or authorized staff discusses feasibility and records a draft quote in admin with approved specifications, price, delivery charge, dispatch estimate, expiry, and payment terms. Send an unguessable website payment link for the accepted quote. Paying creates/activates the same normal order workflow with source `whatsapp`. Link grants access only to that quote and expires appropriately.

For version one, recommend full payment after quote acceptance to avoid deposit/balance complexity. If deposits are required, explicitly implement balance tracking and the rule for when production and dispatch may start.

Record confirmed specifications and customer approval before work starts. Use private storage for references if upload support is later added. Changes after approval should create a new quote/version rather than silently replacing the agreed order.

Basic WhatsApp links are sufficient at launch. Automated WhatsApp notifications, inbound-message syncing, and bots are separate integrations with their own permissions and messaging rules.

## 6. Selected custom implementation: minimize fixed subscriptions

Decision: build and own the custom website; use the company's purchased domain. No Shopify/Wix store subscription is planned. The previous Next.js/PostgreSQL/Supabase recommendation is superseded by this lighter architecture to match the revised cost requirements.

- Astro + TypeScript for fast, indexable storefront pages; React for cart, checkout, and admin interactions where it adds value. Custom development does not require Next.js.
- Cloudflare Workers with Static Assets for public HTML/CSS/JavaScript and a small TypeScript API. A lightweight router such as Hono is an implementation option, not an additional hosted service.
- Cloudflare D1 (SQLite) for catalog, orders, quotes, stock, payment records, staff roles, and durable job records. This replaces PostgreSQL: schema, migrations, and transaction techniques must be SQLite/D1-compatible.
- Cloudflare R2 Standard storage for owner-uploaded product photographs, with a public custom image hostname and CDN caching. Keep private customer references in a separate private bucket if added. R2 requires billing activation and can charge beyond its included allowance.
- Cloudflare Access for the small internal owner/staff dashboard. Use approved email identities, verify Access JWT signatures/issuer/audience/expiry on the server, and apply per-user roles from D1. Access is not customer-account authentication. Customers use guest checkout and private expiring order links initially.
- Razorpay Standard Checkout for prepaid purchases, subject to approved merchant onboarding and actual account pricing. Payment gateway fees are variable costs, not a store-platform subscription.
- Resend for transactional email, using a verified sending domain and durable quota-aware retries.
- Worker Cron Triggers plus bounded D1 job batches for reservation expiry, reconciliation, and notification retries. Do not assume a request's background lifetime is a durable job queue.

Delivery strategy: prerender marketing and catalog pages where practical so static visits avoid dynamic execution. Admin saves catalog changes in D1 and publishes through a secured, queued/debounced build/deploy pipeline; expose pending/published/failed status. Keep live price/availability refreshes and checkout server-authoritative so cached pages cannot produce incorrect paid orders. Build credentials stay on the server/CI. Dynamic catalog rendering is an alternative if benchmarking justifies it; it counts as Worker execution and must fit CPU limits. Do not add rebuild machinery that costs more to maintain than a small paid runtime would save.

One codebase, separate modules for catalog, checkout, payments, orders, and admin. No microservices, Kubernetes, separate search cluster, or Redis initially. SQL queries and indexes are sufficient for the initial catalog.

Free-first is a cost target, not a promise of permanently free production hosting. Benchmark cryptography, checkout, admin authorization, and scheduled jobs against Workers Free's 10 ms CPU limit. If meaningful headroom cannot be demonstrated, plan Workers Paid before accepting real payments; its current minimum is $5/month plus applicable usage/taxes. This is preferable to unreliable checkout or weakening security to fit a free limit.

Current official references, checked 4 October 2026:

- Astro Cloudflare deployment: https://docs.astro.build/en/guides/deploy/cloudflare/
- Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Static asset billing: https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- D1 API: https://developers.cloudflare.com/d1/worker-api/d1-database/
- D1 Time Travel: https://developers.cloudflare.com/d1/reference/time-travel/
- R2 pricing and billing setup: https://developers.cloudflare.com/r2/pricing/ and https://developers.cloudflare.com/r2/get-started/
- Access plans: https://www.cloudflare.com/plans/zero-trust-services/
- Access token verification: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/
- Resend pricing: https://resend.com/pricing
- Razorpay pricing: https://razorpay.com/pricing/
- Razorpay integration: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/
- Razorpay webhook validation: https://razorpay.com/docs/webhooks/validate-test/
- WhatsApp click to chat: https://faq.whatsapp.com/5913398998672934

## 7. System boundaries and ownership

Customer browser calls public application endpoints. Worker endpoints enforce authorization, validate inputs, and access D1 through private bindings. Payment secrets, price decisions, inventory changes, refunds, and staff operations remain on the server. Payment provider sends signed webhooks to a public dedicated endpoint. Cron executes bounded durable-job batches for notifications, reconciliation, and reservation expiry.

There is no browser-to-D1 connection and no PostgreSQL row-level security. Every private read/write is authorized in Worker code. Public catalog data is separate from private order information. Validate Access identity tokens and D1 role membership for all admin API requests; merely protecting the dashboard HTML or trusting an email header is insufficient. Require appropriate CSRF/origin protection for cookie-authenticated writes. Disable or protect alternate workers.dev/preview routes that could bypass the custom-domain admin gate. Do not put the customer checkout or payment webhook behind staff Access.

Public product photographs may be served through the R2 public image hostname; private references and customer records must not share that public exposure. Validate upload type and size, re-encode images, restrict write credentials, and keep keys out of the browser. No paid dynamic image transformation service is required at launch: produce appropriately sized images before upload or during a controlled publishing job.

The business owns the domain, source repository, Cloudflare account, payment account, email service, and data. The developer has delegated, scoped access. Keep local development, test/staging, and production separate; do not ship real customer data into previews. Export source and data for portability; D1/R2/Access bindings are provider integrations that must be adapted if the application moves elsewhere.

## 8. Data model

Core tables:

- `categories`, `products`, `product_images`: identity, slugs, descriptions, materials/dimensions/care, publish status, imagery.
- `product_variants`: SKU, options, price in minor currency units, fulfillment mode, lead time, active status.
- `inventory`, `inventory_reservations`, `inventory_movements`: available stock, expiring holds, auditable additions/releases/sales.
- `production_slots`, `capacity_reservations`: maker capacity for made-to-order pieces, measured consistently in pieces or work units; admin can close intake.
- `orders`, `order_items`: source, contact, delivery snapshot, totals, currency, payment/fulfillment state, item/variant/specification snapshots.
- `payment_attempts`, `payment_events`, `refunds`: provider IDs, amount, state, processed-event markers, reconciliation and refund history.
- `custom_quotes`, `custom_quote_items`: versioned agreed specifications, expiry, price, private access token hash, accepted terms, order linkage.
- `shipments`, `order_status_history`: courier reference, tracking, factual status changes and staff actor.
- `staff_roles`, `audit_logs`: least-privilege access and important staff changes.
- `notification_jobs`, `notification_deliveries`: retryable outbound tasks and delivery state.
- `shipping_rules`, `store_settings`: dispatch origin, serviceability, shipping charges, shop contacts, configurable lead times.

Customer accounts and saved addresses are optional later tables. Guest orders store necessary contact/address snapshots without forcing registration.

Use primary/foreign keys, timestamps, integer money values, unique provider-event/payment identifiers, and indexes on slugs, status/date, provider IDs, and SKU. Constraints prevent negative stock and invalid quantities. Use D1-compatible atomic conditional writes, constraints, and transactional batches for reservation and paid transitions; prove all-or-nothing behavior for multi-item carts. Do not copy an interactive PostgreSQL transaction pattern into D1. Failed batch statements must roll back, and zero-row updates must be treated as an unavailable-item outcome rather than success. Changes to catalog prices or deleted products must not rewrite old order records.

Representative endpoints: catalog listing/details; checkout creation; payment verification; provider webhook; secure order lookup; staff product/variant management; staff order updates; custom quote creation/acceptance/payment; authorized refund initiation. Do not accept browser-supplied totals as trusted input.

## 9. Owner administration and fulfillment

Dashboard should prioritize New paid orders, To make, Ready to pack, Shipped, Custom quotes, and Stock/capacity needs attention. Use clear labels, large controls, photo previews, and phone-friendly layouts. The owner can delegate private operational permissions without changing the public mom-focused brand.

Owner/manager controls products, staff, store settings, and refund approvals. Fulfillment staff sees necessary order details and can update preparation/dispatch. Developers maintain the system through delegated access. Avoid shared logins; log sensitive changes and use MFA for privileged staff.

Admin can add/edit products and photos, select variants, adjust stock, set lead times, pause a product, record a quote, view agreed customization, print a packing slip, record tracking, and process permitted cancellations/refunds. No manual database editing is required for everyday work.

Start with an agreed shipping charge/serviceability table and manual courier booking. Dispatch time and courier transit time are separate estimates. Later integrate an aggregator if order volume justifies it. If Amazon remains active, explicitly allocate channel stock or implement a supported sync; an Amazon link alone does not synchronize stock or orders.

## 10. Trust, performance, and operational controls

Use approved real content about the mom and her craft, actual product photos, clear contact details, honest delivery estimates, and visible policy summaries before payment. Introduce reviews only after a genuine collection/moderation process exists. Amazon is an optional outbound purchase link, not an affiliate claim or substitute for website order processing.

Render discoverable category/product pages with metadata, sitemap, canonical URLs, and accurate product structured data. Optimize image dimensions/formats and prioritize mobile performance. Track aggregate product views, cart additions, checkout starts, paid orders, and WhatsApp clicks with an appropriate privacy approach; clicks do not prove WhatsApp sales.

Validate input; restrict staff endpoints; rate-limit sensitive lookups; use unguessable expiring access links or verification for guest tracking; prevent indexation of private pages; redact customer data from logs. Use provider checkout rather than storing card data. Restrict uploads if enabled. Configure backups and verify restore capability. Alert on paid orders missing confirmation, webhook failures, job failures, and overdue preparation.

Define retention and deletion rules for customer data and custom references, while preserving business records as required by the business's applicable obligations. Confirm tax and customer-policy decisions with the client's relevant adviser rather than inventing rules.

## 11. Roadmap and acceptance gates

Indicative solo-developer estimate: 4–6 weeks for a modest custom launch, assuming prompt client feedback, product assets, and payment-provider approval; not a fixed promise.

1. Discovery and scope, 2–3 days: agree catalog, prices, photos, lead times, serviceability, shipping, customization, refund rules, payment ownership, and maintenance responsibilities. Deliver signed-off scope and product spreadsheet.
2. Design, 3–4 days: homepage, category, product, cart, checkout, and admin layouts at mobile/desktop sizes. Deliver agreed design and customer flows.
3. Foundation and catalog, 4–6 days: environments, schema/migrations, staff permissions, storage, catalog management, public product pages, search, and cart. Gate: authorized staff can publish a product and customer can find/configure it.
4. Checkout and payments, 5–7 days: address/shipping, server totals, reservations, provider test integration, signed events, confirmation, secure tracking, and reconciliation. Gate: failure/retry scenarios behave correctly as well as successful payment.
5. Operations, 3–5 days: custom quotes/payment links, fulfillment, courier tracking entry, notification jobs, refund workflow, and maker-capacity controls. Gate: authorized staff can fulfill both standard and WhatsApp-origin orders without developer intervention.
6. Validation and handoff, 3–4 days: mobile/accessibility/performance checks, security boundaries, restored backup, test order through delivery/refund, staff training, documentation, and production launch checklist. Gate: client approves a concrete staging store with real catalog and policies.

Required commerce tests: simultaneous purchase of the last unit; tampered price/variant; duplicate checkout; declined/abandoned payment; captured payment with browser closure; repeated/delayed/out-of-order webhook; expired reservation with late capture; notification failure/retry; unavailable PIN code; refunded/cancelled order; anonymous/staff permission violations; custom quote expiry and changed specification. Add broader tests only where they protect meaningful behavior.

## 12. Freelance delivery and business decisions

Contract should distinguish design/build fees from domain, hosting, database/storage, email, gateway fees, shipping, and ongoing support. Set limits on catalog entry, revision rounds, content responsibilities, post-launch support, feature changes, backup ownership, response time, and developer access. Avoid unverified fee estimates; confirm live provider plans before quoting.

Client inputs needed before production: real catalog and photos, SKU/variant prices, stock and making capacity, realistic dispatch dates, business WhatsApp/contact, shipping origin/service regions/charges, agreed cancellation/return/damage approach, gift-message/packaging options, merchant-account readiness, and approved story/photos.

The next step is a product catalog and scoped design review, followed by a clickable storefront prototype. Live checkout follows when products, policies, and merchant setup are ready. Amazon remains off until the client decides.


## 13. Domain, free allowances, and operating budget

All figures below were checked against official provider pages on 4 October 2026 and should be rechecked before launch. Limits are account/plan allowances, not promises about how many orders this app can handle.

| Component | Proposed initial plan | Relevant allowance or cost |
| --- | --- | --- |
| Storefront static hosting | Workers Static Assets | Static asset requests are free and unlimited; routing through a Worker counts as dynamic execution |
| API/backend | Workers Free | 100,000 requests/day and 10 ms CPU/invocation; paid minimum currently $5/month plus usage |
| Database | D1 Free | 5 million rows read/day, 100,000 rows written/day, 5 GB total account storage; only 500 MB per individual free database |
| Database recovery | D1 Time Travel | 7-day recovery window on Free; retain separate tested exports too |
| Product image uploads | R2 Standard included allowance | 10 GB-month storage, 1 million Class A operations/month, 10 million Class B operations/month; egress free; overages bill separately |
| Internal admin identity | Cloudflare Access Free | Up to 50 users; intended here for the small staff group, not shoppers |
| Transactional email | Resend Free | 3,000 emails/month and 100/day; send limits count messages, not orders |
| Custom discussions | WhatsApp click-to-chat | No paid messaging API planned; manual conversation and quote recording |
| Payments | Razorpay standard merchant plan | Published standard domestic rate around 2% plus applicable tax; actual onboarding agreement/payment method governs; no reliance on introductory offers |
| Domain | Purchased company domain | Annual registration/renewal; compare renewal cost rather than first-year promotion |
| Backups and deployment builds | Included service allowances/local tools initially | Encrypted off-provider database exports and media backup required; CI/build usage also has limits |

Example email budget: two customer emails plus one owner email per order consume three messages. A 100-email/day allowance therefore supports roughly 33 such orders/day before retries, support messages, or other traffic. Queueing can handle short peaks but sustained peaks require an upgrade; always show confirmation and status on the website too.

Budget target: $0/month recurring infrastructure within free/included allowances and with successful runtime tests, excluding domain, payment charges, shipping, taxes, and development/support. Practical fallback: $5/month Workers minimum if CPU/request limits require it, while D1/R2/email can remain within their included allowances. R2 billing is independent of Workers billing; an included free allowance is not a hard spending cap. Configure alerts and application controls; do not assume a budget alert stops charges.

Why not the previous providers: Vercel Hobby is restricted to noncommercial personal use (https://vercel.com/docs/plans/hobby). Supabase Free currently has a 500 MB database, inactivity pausing after one week, and no included automatic backups (https://supabase.com/pricing). These are poor defaults for this particular low-subscription paid-order store; no keep-alive workaround is planned.

Domain plan: buy a suitable available domain in the business's own account; no domain availability is assumed. Use Cloudflare DNS and connect the apex/www to the storefront, with one canonical host and a redirect from the other. Use an admin hostname protected by Access and an image hostname for public product photographs if needed. Preserve required MX/TXT records when changing DNS. Configure TLS, sending-domain SPF/DKIM/DMARC, renewal reminders, and production payment/webhook URLs. A domain purchase does not require buying bundled shared hosting, a separate SSL certificate, or a store builder. Transactional email sending does not provide a full business mailbox; evaluate that separately if wanted.

Cost controls: optimized product images rather than video; guest checkout; no paid SMS OTP or WhatsApp automation; manual courier booking; SQL search; short bounded cron jobs; indexed queries; cached public catalog responses only; no caching private orders or checkout decisions; limit upload size and request abuse; retain useful audit/payment records without storing huge raw payloads indefinitely. Review request, CPU, row-read/write, storage, and email usage regularly. Start upgrade planning at a chosen internal threshold such as 70% of an allowance, and sooner if measured CPU headroom or payment reliability is insufficient.

Portability and full control mean ownership of source, schema, business logic, exports, admin behavior, and provider accounts. Managed providers still impose limits and operate the underlying infrastructure. Keep migrations and restore instructions in the repository, export D1 on a regular schedule to encrypted off-provider storage, back up image objects separately, and rehearse restoration before launch.
