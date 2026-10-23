/* Basket + quotation request form */
const L = window.I18N || {};
const QUOTE_TO = 'info@anmamedicals.com';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderCart() {
  const cart = getCart();
  const el = document.getElementById('cart-content');
  if (!cart.length) {
    el.innerHTML = `<div class="cart-empty"><p style="font-size:18px;margin-bottom:8px">${L.emptyT}</p><p style="margin-bottom:20px">${L.emptyS}</p><a href="dental-products.html" class="btn btn-primary">${L.browse}</a></div>`;
    return;
  }
  const rows = cart.map((item, i) => `<tr>
      <td><div class="cart-item-name">${esc(item.name)}</div>
          <div class="cart-item-meta">${(item.options || []).map(o => esc(o.label) + ': ' + esc(o.value)).join(' · ')}</div></td>
      <td><div class="qty" style="display:inline-flex"><button type="button" data-q="${i}" data-d="-1" aria-label="${L.less}">−</button><span>${item.qty}</span><button type="button" data-q="${i}" data-d="1" aria-label="${L.more}">+</button></div></td>
      <td><button type="button" data-rm="${i}" class="rm" title="${L.remove}" aria-label="${L.remove}">×</button></td>
    </tr>`).join('');
  el.innerHTML = `
    <div style="overflow-x:auto"><table class="cart-table">
      <thead><tr><th>${L.product}</th><th>${L.qty}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="quote-grid">
      <form id="quoteForm" class="quote-form" novalidate>
        <h2>${L.formT}</h2>
        <p class="hint">${L.hint}</p>
        <div class="f2">
          <label>${L.fName}<input name="name" required autocomplete="name"></label>
          <label>${L.fOrg}<input name="company" autocomplete="organization"></label>
          <label>${L.fEmail}<input name="email" type="email" required autocomplete="email"></label>
          <label>${L.fPhone}<input name="phone" type="tel" required autocomplete="tel"></label>
        </div>
        <label>${L.fAddr}<textarea name="address" rows="2" autocomplete="street-address"></textarea></label>
        <label>${L.fNotes}<textarea name="notes" rows="3"></textarea></label>
        <input type="text" name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
        <div id="formMsg" role="alert"></div>
        <button class="btn btn-primary" id="submitBtn" type="submit" style="width:100%">${L.send}</button>
        <a href="dental-products.html" class="btn btn-outline" style="width:100%;margin-top:10px">${L.cont}</a>
      </form>
    </div>`;
  el.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { setQty(+b.dataset.q, getCart()[+b.dataset.q].qty + +b.dataset.d); renderCart(); });
  el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { removeFromCart(+b.dataset.rm); renderCart(); });
  document.getElementById('quoteForm').addEventListener('submit', submitQuote);
}

function fetchT(url, opts, ms) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms || 12000);
  return fetch(url, Object.assign({}, opts, { signal: ctl.signal })).finally(() => clearTimeout(t));
}
function mailtoLink(p) {
  const body = 'Name: ' + p.name + '\nOrganisation: ' + p.company + '\nEmail: ' + p.email + '\nPhone: ' + p.phone +
    '\nDelivery address: ' + p.address + '\n\nOrder:\n' + p.items.map(itemLine).join('\n') + '\n\nRemarks: ' + p.notes;
  return 'mailto:' + QUOTE_TO + '?subject=' + encodeURIComponent('Quotation request – ' + p.name) + '&body=' + encodeURIComponent(body);
}
const itemLine = i => `${i.qty}x ${i.name} (${i.id})` + ((i.options || []).length ? ' – ' + i.options.map(o => o.label + ': ' + o.value).join(', ') : '');

/* Route 1: our own endpoint (Cloudflare Worker -> Resend) */
async function sendViaWorker(payload) {
  const r = await fetchT('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.ok) throw new Error('worker:' + (data.error || r.status));
  return data.ref;
}
/* Route 2: FormSubmit.co – works from any static host; needs a one-time email activation (see README) */
async function sendViaFormSubmit(payload) {
  const ref = 'AM-' + Date.now().toString(36).toUpperCase();
  const r = await fetchT('https://formsubmit.co/ajax/' + QUOTE_TO, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: `Quotation request ${ref} – ${payload.name}${payload.company ? ' (' + payload.company + ')' : ''}`,
      _template: 'table', _captcha: 'false', _replyto: payload.email,
      Reference: ref, Language: payload.lang, Name: payload.name, Organisation: payload.company, Email: payload.email, Phone: payload.phone,
      'Delivery address': payload.address, Remarks: payload.notes,
      Order: payload.items.map(itemLine).join('\n')
    })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !(data.success === true || data.success === 'true')) throw new Error('formsubmit:' + (data.message || r.status));
  return ref;
}

async function submitQuote(e) {
  e.preventDefault();
  const f = e.target, msg = document.getElementById('formMsg'), btn = document.getElementById('submitBtn');
  msg.className = ''; msg.textContent = '';
  const v = n => f.elements[n].value.trim();
  if (!v('name') || !v('phone') || !/^\S+@\S+\.\S+$/.test(v('email'))) {
    msg.className = 'err'; msg.textContent = L.errValid; return;
  }
  btn.disabled = true; btn.textContent = L.sending;
  const payload = { name: v('name'), company: v('company'), email: v('email'), phone: v('phone'),
    address: v('address'), notes: v('notes'), website: v('website'), lang: L.lang, items: getCart() };
  let ref = null, errs = [];
  if (payload.website) ref = 'OK';                    // honeypot filled: bot
  else {
    try { ref = await sendViaWorker(payload); } catch (e1) { errs.push(String(e1.message)); }
    if (!ref) { try { ref = await sendViaFormSubmit(payload); } catch (e2) { errs.push(String(e2.message)); } }
  }
  if (!ref) {
    console.error('Quote send failed:', errs);
    btn.disabled = false; btn.textContent = L.send;
    msg.className = 'err';
    msg.innerHTML = L.errSend + ' (' + esc(errs.join(' | ')) + '). ' +
      '<a class="mail-fallback" href="' + mailtoLink(payload) + '">' + L.mailInstead + '</a>';
    return;
  }
  clearCart();
  document.getElementById('cart-content').innerHTML = `
    <div class="thanks">
      <div class="tick">✓</div>
      <h2>${L.thanksT}</h2>
      <p>${L.thanks1}${ref !== 'OK' ? ' (${L.ref} <strong>' + esc(ref) + '</strong>)' : ''}.</p>
      <p>${L.thanks2}</p>
      <a href="index.html" class="btn btn-primary" style="margin-top:16px">${L.backHome}</a>
    </div>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.addEventListener('DOMContentLoaded', renderCart);
