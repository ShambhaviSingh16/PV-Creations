# PV Creations storefront

A custom React/Vite frontend for PV Creations. The public brand showcases the mom and her love. No family contribution story appears in the UI.

## Store implementation update — 3 November 2026

This working copy now includes a persistent catalog/order service, local checkout demonstration, owner product/order management, private order tracking, inventory reservations, Razorpay integration code and a retryable email outbox. The backend is prepared for Cloudflare Worker/D1; it has not been provisioned or deployed. The WhatsApp number is +91 93802 50104. The owner confirmed that the current samples should remain for development and Razorpay is not ready yet.

Start `npm.cmd run server` in one terminal, then `npm.cmd run dev` in another. Use http://127.0.0.1:5173 for the storefront and http://127.0.0.1:5173/#admin for the local owner workspace. Enter the development token printed by the server terminal. Test orders persist in ignored `.local-data/store.sqlite`. Simulated payment is local-only; the Worker has no development-payment endpoint or development-admin-token fallback.

Owner product forms now support device uploads for up to eight photos, with cover selection, reorder/removal controls, and customer photo galleries. Photos are stored in `.local-data/uploads/` locally and require the configured PRODUCT_IMAGES R2 bucket in production. No editing of project image paths is required. See OPERATIONS.md for storage setup and retention details.

Requires Node.js 22.13+ for the built-in local SQLite adapter; Node 24 is recommended. Run `npm.cmd test` for commerce tests and `npm.cmd run build` for the production build. All production setup, current limitations and launch gates are documented in [OPERATIONS.md](OPERATIONS.md). The original blueprint remains a plan, not a claim that all features are finished.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Build with `npm run build`; preview the build with `npm run preview`.

## Working preview features

Responsive homepage, category filtering, product search, saved pieces, product detail dialogs with design selection, shopping bag with quantity/removal controls, optional gift note, customization information, care/help dialogs, keyboard dialog handling, and browser-local saved cart/favourites.

Products, prices and generated photographs remain illustrative. Gift notes are held in the browser until checkout submits them with the order. General and product-specific WhatsApp links use the confirmed business number. With the local backend running, the store supports a guest delivery form, server totals/shipping, a simulated paid order and owner preparation workflow. Real payment processing, production storage and staff identity still need provider setup. Production without VITE_API_URL preserves frontend-preview behavior. Replace sample catalog and policy content before enabling live purchases.

## GitHub and Vercel

Create your GitHub repository, then push this project. Commit package-lock.json. Do not commit node_modules, dist, .env or .vercel. Import the repository into Vercel, select Vite, use `npm run build`, and output directory `dist`. No environment variables are needed for this preview. vercel.json supplies the build configuration.

Vercel Hobby is restricted to noncommercial personal use. Use an eligible commercial plan for the client's business deployment; this project is currently a frontend preview. See https://vercel.com/docs/plans/hobby .

When the domain is purchased, add it in Vercel Project Settings > Domains and configure the DNS records Vercel supplies. Configure the canonical hostname and redirect its alternate (www/apex). Connect the domain to hosting rather than forwarding visitors to the old vercel.app URL. See https://vercel.com/docs/domains/working-with-domains/add-a-domain .

The backend plan remains documented in PV-Creations-Blueprint.md. A Vercel frontend deployment does not provision Cloudflare D1/R2/Access or implement checkout.

To connect the implemented service, follow OPERATIONS.md, then set VITE_API_URL in Vercel to the provisioned backend origin and redeploy. Never place secrets in VITE_* variables. Use the backend's protected /admin path for production owner access. The company domain is already connected; do not change Namecheap DNS for a frontend update. Local changes are uncommitted and have not been pushed to the live site.

## Assets

public/images contains generated illustrative crochet photographs, not the client's actual product photos. Fonts load from Google Fonts; replace with locally hosted font files if desired. The header uses a compact typographic PV mark pending an original logo file suitable for the website. Earlier planning documents and concept imagery are not published by Vite.
