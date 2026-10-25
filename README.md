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

## Images
- **Tunics (Ladies / Gents):** original illustrations drawn for this shop (no third-party photos). One image per colour
  (`public/img/meliana-<colour>.jpg`, `lens-<colour>.jpg`); choosing a colour switches the picture. Replace them with your own
  photos using the same file names whenever you like.
- **Dental products:** product photos come from the manufacturer's catalogue (`public/img/<product>.jpg`). Please make sure you
  are allowed to use them on your own site (ask Prevest DenPro for written permission / their press-kit images).

## Search
Client-side product search (header box with suggestions + `search.html`). The index files `public/js/search-<lang>.js`
contain every product; it searches names, descriptions, article numbers and supplier REF numbers.

## CE-marked products – selection rule
Products were added from the supplier's Declarations of Conformity (DOC_Final 21-05-2026 and DOC_CLASS_I) **only if** the
supplier's January-2025 price list does not mark them "Non CE Product". Items where the two documents disagree
(e.g. Calplus, Endoseal, Zical, Fluorotop, Alvocure, Hemostal liquid) were left out. **Hemostal Gel** is in the shop but
is marked "Non CE Product" in the price list – please confirm its CE status with the supplier before selling in the EU.
