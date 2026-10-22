# Anma Medicals shop (quotation shop)

Static site in `public/` + a Cloudflare Worker (`src/worker.js`) that handles `POST /api/quote`
and emails the request to info@anmamedicals.com. No prices are shown; customers add items to the
basket and submit a quotation request.

## Email setup (one time)
1. Create a free account at https://resend.com and verify the domain `anmamedicals.com`
   (add the DNS records Resend shows).
2. Set `FROM_EMAIL` in `wrangler.jsonc` to an address on that domain.
3. `npx wrangler secret put RESEND_API_KEY` and paste your API key.
4. `npx wrangler deploy`

Local test: `npx wrangler dev` (put `RESEND_API_KEY=...` in a `.dev.vars` file).
