# ANMA Medicals shop (quotation shop)

Static site in `public/` + a Cloudflare Worker (`src/worker.js`) handling `POST /api/quote`.
No prices are shown; customers add items to the basket and submit a quotation request,
which is emailed to info@anmamedicals.com.

## How the quote email is sent (two routes, tried in this order)
1. **Worker + Resend** (recommended, fully under your control)
   - Create an account at https://resend.com and verify the domain `anmamedicals.com`.
   - Set `FROM_EMAIL` in `wrangler.jsonc` to an address on that domain.
   - `npx wrangler secret put RESEND_API_KEY` (paste your key), then `npx wrangler deploy`.
2. **FormSubmit fallback** (no account needed, works even on plain static hosting)
   - The very first request sends an *activation email* to info@anmamedicals.com.
     Open it and click the confirm link once. After that every request arrives by email.

If both fail, the page shows the technical reason so it can be fixed.

## Product photos
Photos load from the manufacturers' sites (hot-linked). For reliability, download them and put them in
`public/img/` — local placeholders with the same names (e.g. `fusion-bond-7.jpg`) are used automatically if a remote photo is unavailable.
