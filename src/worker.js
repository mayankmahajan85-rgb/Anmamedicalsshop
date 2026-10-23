// Cloudflare Worker: serves static assets and handles POST /api/quote
// Sends the quotation request to info@anmamedicals.com via Resend (https://resend.com).
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/img') {            // same-origin image proxy (needed to recolour product photos in the browser)
      try {
        const u = new URL(url.searchParams.get('u') || '');
        if (u.protocol !== 'https:' || u.hostname !== 'www.7daysshop.nl' || !u.pathname.startsWith('/media/catalog/product/')) return new Response('forbidden', { status: 403 });
        const r = await fetch(u.toString(), { cf: { cacheTtl: 604800, cacheEverything: true } });
        if (!r.ok) return new Response('not found', { status: 404 });
        return new Response(r.body, { headers: { 'Content-Type': r.headers.get('content-type') || 'image/jpeg', 'Cache-Control': 'public, max-age=604800' } });
      } catch { return new Response('bad request', { status: 400 }); }
    }
    if (url.pathname !== '/api/quote') return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

    let d;
    try { d = await request.json(); } catch { return json({ ok: false, error: 'invalid' }, 400); }
    if (d.website) return json({ ok: true, ref: 'OK' });            // honeypot: pretend success to bots

    const clip = (s, n) => String(s ?? '').trim().slice(0, n);
    const lang = clip(d.lang, 5);
    const c = { name: clip(d.name, 120), company: clip(d.company, 160), email: clip(d.email, 160),
                phone: clip(d.phone, 40), address: clip(d.address, 400), notes: clip(d.notes, 2000) };
    const items = Array.isArray(d.items) ? d.items.slice(0, 100).map(i => ({
      id: clip(i.id, 40), name: clip(i.name, 160), qty: Math.max(1, Math.min(999, parseInt(i.qty, 10) || 1)),
      options: Array.isArray(i.options) ? i.options.slice(0, 6).map(o => ({ label: clip(o.label, 40), value: clip(o.value, 160) })) : []
    })) : [];
    if (!c.name || !c.phone || !/^\S+@\S+\.\S+$/.test(c.email) || !items.length) return json({ ok: false, error: 'validation' }, 400);
    if (!env.RESEND_API_KEY) return json({ ok: false, error: 'not-configured' }, 500);

    const now = new Date();
    const ref = 'AM-' + now.toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    const rows = items.map(i => `<tr><td style="padding:8px;border:1px solid #ddd">${esc(i.name)}<br><small style="color:#666">${esc(i.id)}</small></td>
      <td style="padding:8px;border:1px solid #ddd">${i.options.map(o => esc(o.label) + ': ' + esc(o.value)).join('<br>')}</td>
      <td style="padding:8px;border:1px solid #ddd;text-align:center">${i.qty}</td></tr>`).join('');
    const htmlBody = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#14232b">
      <h2>New quotation request ${esc(ref)}</h2><p>Customer language: ${esc(lang) || '-'}</p>
      <p><strong>Name:</strong> ${esc(c.name)}<br><strong>Organisation:</strong> ${esc(c.company) || '-'}<br>
      <strong>Email:</strong> ${esc(c.email)}<br><strong>Phone:</strong> ${esc(c.phone)}<br>
      <strong>Delivery address:</strong> ${esc(c.address).replace(/\n/g, '<br>') || '-'}</p>
      <table style="border-collapse:collapse"><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:left">Product</th><th style="padding:8px;border:1px solid #ddd;text-align:left">Specification</th><th style="padding:8px;border:1px solid #ddd">Quantity</th></tr></thead><tbody>${rows}</tbody></table>
      <p><strong>Remarks:</strong><br>${esc(c.notes).replace(/\n/g, '<br>') || '-'}</p></div>`;
    const text = `New quotation request ${ref}\n\nName: ${c.name}\nOrganisation: ${c.company}\nEmail: ${c.email}\nPhone: ${c.phone}\nAddress: ${c.address}\n\n` +
      items.map(i => `- ${i.qty}x ${i.name} (${i.id}) ${i.options.map(o => o.label + ': ' + o.value).join(', ')}`).join('\n') + `\n\nRemarks: ${c.notes}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.FROM_EMAIL, to: [env.TO_EMAIL], reply_to: c.email,
        subject: `Quotation request ${ref} – ${c.name}${c.company ? ' (' + c.company + ')' : ''}`, html: htmlBody, text })
    });
    if (!res.ok) { console.error('Resend error', res.status, await res.text()); return json({ ok: false, error: 'send' }, 502); }
    return json({ ok: true, ref });
  }
};
