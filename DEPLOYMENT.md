# Deploy PV Creations to pvcreations.com

The frontend has passed its production build and local browser checks. No live checkout, WhatsApp recipient or order database is connected. Publishing this version publishes the frontend preview.

## Vercel sign-in and publish

In a terminal at `D:\PV_creations`, authenticate using your business's Vercel account:

```powershell
npx.cmd vercel login
npx.cmd vercel --prod
```

Choose the intended account/team and project when prompted. The checked-in vercel.json uses Vite, `npm run build`, and `dist`. No environment variables are needed for this preview. A GitHub repository is optional for the initial CLI deployment; linking GitHub later enables deployments on pushes. Use an eligible plan for commercial hosting. Do not share passwords or tokens in chat.

The .vercelignore file excludes local dependencies, testing tools, caches, planning documents, original unused PNGs and environment files from the deployment upload.

## Connect the purchased domain

1. Open the deployed project in Vercel, then Settings > Domains.
2. Add `pvcreations.com` and `www.pvcreations.com`; choose one canonical hostname and redirect the other.
3. Copy the exact DNS records shown for that project. Do not assume generic IP/CNAME values from older tutorials.
4. In Namecheap, choose Domain List > Manage beside pvcreations.com > Advanced DNS. If Namecheap is the authoritative DNS provider, update only the relevant website records using the values supplied by Vercel. If authoritative nameservers belong to another provider, edit records there instead.
5. Resolve conflicting parking/URL-redirect/old website records for the exact host being replaced. Preserve MX/TXT records used by email and verification. Do not change nameservers unnecessarily.
6. Wait for Vercel to report a valid domain configuration and issued HTTPS certificate.
7. Test the homepage, product images, cart and dialogs through the custom domain, plus the www/apex redirect and HTTPS. Localhost browser storage does not transfer to the new domain.

Do not buy a separate SSL certificate or Namecheap shared-hosting package just to attach the domain to Vercel.

Official guides:

- https://vercel.com/docs/cli/login
- https://vercel.com/docs/cli/deploy
- https://vercel.com/docs/domains/working-with-domains/add-a-domain
- https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/

Account authorization and DNS changes are still required; this document is not evidence of a completed deployment.
