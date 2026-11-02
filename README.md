# PV Creations storefront

A custom React/Vite frontend for PV Creations. The public brand showcases the mom and her love. No family contribution story appears in the UI.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Build with `npm run build`; preview the build with `npm run preview`.

## Working preview features

Responsive homepage, category filtering, product search, saved pieces, product detail dialogs with design selection, shopping bag with quantity/removal controls, optional gift note, customization information, care/help dialogs, keyboard dialog handling, and browser-local saved cart/favourites.

Products, prices and generated photographs are illustrative. Gift notes are held only in memory. No payments, real orders, backend, admin, analytics, contact submission or WhatsApp recipient is connected. Checkout explicitly explains this. Replace catalog content, approved policies and contact details before enabling purchases.

## GitHub and Vercel

Create your GitHub repository, then push this project. Commit package-lock.json. Do not commit node_modules, dist, .env or .vercel. Import the repository into Vercel, select Vite, use `npm run build`, and output directory `dist`. No environment variables are needed for this preview. vercel.json supplies the build configuration.

Vercel Hobby is restricted to noncommercial personal use. Use an eligible commercial plan for the client's business deployment; this project is currently a frontend preview. See https://vercel.com/docs/plans/hobby .

When the domain is purchased, add it in Vercel Project Settings > Domains and configure the DNS records Vercel supplies. Configure the canonical hostname and redirect its alternate (www/apex). Connect the domain to hosting rather than forwarding visitors to the old vercel.app URL. See https://vercel.com/docs/domains/working-with-domains/add-a-domain .

The backend plan remains documented in PV-Creations-Blueprint.md. A Vercel frontend deployment does not provision Cloudflare D1/R2/Access or implement checkout.

## Assets

public/images contains generated illustrative crochet photographs, not the client's actual product photos. Fonts load from Google Fonts; replace with locally hosted font files if desired. The header uses a compact typographic PV mark pending an original logo file suitable for the website. Earlier planning documents and concept imagery are not published by Vite.
