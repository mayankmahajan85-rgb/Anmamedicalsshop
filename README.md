# ANMA Medicals shop (quotation shop)

Multilingual (EN / NL / DE / FR-BE) static site in `public/` plus a Cloudflare Worker (`src/worker.js`).
No prices are shown: visitors add items to the basket and submit a quotation request, which is emailed
to info@anmamedicals.com. `public/index.html` sends visitors to their language (`public/en|nl|de|fr/`).

## Deploy (Cloudflare Workers)
1. `npm install`
2. `npx wrangler login`
3. Email (choose one – both can be used, the first that works wins):
   - **Resend (recommended):** verify `anmamedicals.com` at https://resend.com, set `FROM_EMAIL` in `wrangler.jsonc`
     to an address on that domain, then `npx wrangler secret put RESEND_API_KEY`.
   - **FormSubmit fallback (no account):** after deploying, submit one test request; an activation email arrives at
     info@anmamedicals.com – click the link once.
4. `npx wrangler deploy`
5. Add your domain under Workers → your worker → Settings → Domains & Routes.

If both email routes fail, the form shows the reason and a "send by email instead" link.

Before going live: remove the `X-Robots-Tag: noindex` line in `public/_headers` and the
`<meta name="robots" content="noindex">` tags if you want the site to appear in search engines.

## Photos
- Product photos load from prevestdirect.com / 7daysshop.nl. For reliability download them into `public/img/`
  (same file names as the placeholders, e.g. `fusion-bond-7.jpg`); the placeholder is used if a remote photo fails.
- Tunic colours: put real per-colour photos in `public/img/` named `<product>-<colour>.jpg`
  (e.g. `meliana-navy.jpg`, `lens-black.jpg`). Without them, the model photo is recoloured in the browser
  (needs the Worker for `/api/img`); if that fails the original photo stays.
