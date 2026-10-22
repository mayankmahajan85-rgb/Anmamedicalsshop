/* Basket + quotation request form */
const QUOTE_TO = 'info@anmamedicals.com';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderCart() {
  const cart = getCart();
  const el = document.getElementById('cart-content');
  if (!cart.length) {
    el.innerHTML = `<div class="cart-empty"><p style="font-size:18px;margin-bottom:8px">Your basket is empty</p><p style="margin-bottom:20px">Add products and request a quotation without obligation.</p><a href="dental-products.html" class="btn btn-primary">Browse products</a></div>`;
    return;
  }
  const rows = cart.map((item, i) => `<tr>
      <td><div class="cart-item-name">${esc(item.name)}</div>
          <div class="cart-item-meta">${(item.options || []).map(o => esc(o.label) + ': ' + esc(o.value)).join(' · ')}</div></td>
      <td><div class="qty" style="display:inline-flex"><button type="button" data-q="${i}" data-d="-1" aria-label="Less">−</button><span>${item.qty}</span><button type="button" data-q="${i}" data-d="1" aria-label="More">+</button></div></td>
      <td><button type="button" data-rm="${i}" class="rm" title="Remove" aria-label="Remove">×</button></td>
    </tr>`).join('');
  el.innerHTML = `
    <div style="overflow-x:auto"><table class="cart-table">
      <thead><tr><th>Product</th><th>Quantity</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="quote-grid">
      <form id="quoteForm" class="quote-form" novalidate>
        <h2>Request a quotation</h2>
        <p class="hint">All prices are on request. Leave your details and the ANMA Medicals Team will contact you.</p>
        <div class="f2">
          <label>Name *<input name="name" required autocomplete="name"></label>
          <label>Practice / organisation<input name="company" autocomplete="organization"></label>
          <label>Email address *<input name="email" type="email" required autocomplete="email"></label>
          <label>Phone number *<input name="phone" type="tel" required autocomplete="tel"></label>
        </div>
        <label>Delivery address<textarea name="address" rows="2" autocomplete="street-address"></textarea></label>
        <label>Remarks (e.g. embroidery, team order)<textarea name="notes" rows="3"></textarea></label>
        <input type="text" name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
        <div id="formMsg" role="alert"></div>
        <button class="btn btn-primary" id="submitBtn" type="submit" style="width:100%">Request quotation</button>
        <a href="dental-products.html" class="btn btn-outline" style="width:100%;margin-top:10px">Continue browsing</a>
      </form>
    </div>`;
  el.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { setQty(+b.dataset.q, getCart()[+b.dataset.q].qty + +b.dataset.d); renderCart(); });
  el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { removeFromCart(+b.dataset.rm); renderCart(); });
  document.getElementById('quoteForm').addEventListener('submit', submitQuote);
}

const itemLine = i => `${i.qty}x ${i.name} (${i.id})` + ((i.options || []).length ? ' – ' + i.options.map(o => o.label + ': ' + o.value).join(', ') : '');

/* Route 1: our own endpoint (Cloudflare Worker -> Resend) */
async function sendViaWorker(payload) {
  const r = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.ok) throw new Error('worker:' + (data.error || r.status));
  return data.ref;
}
/* Route 2: FormSubmit.co – works from any static host; needs a one-time email activation (see README) */
async function sendViaFormSubmit(payload) {
  const ref = 'AM-' + Date.now().toString(36).toUpperCase();
  const r = await fetch('https://formsubmit.co/ajax/' + QUOTE_TO, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      _subject: `Quotation request ${ref} – ${payload.name}${payload.company ? ' (' + payload.company + ')' : ''}`,
      _template: 'table', _captcha: 'false', _replyto: payload.email,
      Reference: ref, Name: payload.name, Organisation: payload.company, Email: payload.email, Phone: payload.phone,
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
    msg.className = 'err'; msg.textContent = 'Please enter your name, a valid email address and phone number.'; return;
  }
  btn.disabled = true; btn.textContent = 'Sending…';
  const payload = { name: v('name'), company: v('company'), email: v('email'), phone: v('phone'),
    address: v('address'), notes: v('notes'), website: v('website'), items: getCart() };
  let ref = null, errs = [];
  if (payload.website) ref = 'OK';                    // honeypot filled: bot
  else {
    try { ref = await sendViaWorker(payload); } catch (e1) { errs.push(String(e1.message)); }
    if (!ref) { try { ref = await sendViaFormSubmit(payload); } catch (e2) { errs.push(String(e2.message)); } }
  }
  if (!ref) {
    console.error('Quote send failed:', errs);
    btn.disabled = false; btn.textContent = 'Request quotation';
    msg.className = 'err';
    msg.innerHTML = 'Sorry, we could not send your request (' + esc(errs.join(' | ')) + '). Please try again or email us at <a href="mailto:' + QUOTE_TO + '">' + QUOTE_TO + '</a>.';
    return;
  }
  clearCart();
  document.getElementById('cart-content').innerHTML = `
    <div class="thanks">
      <div class="tick">✓</div>
      <h2>Thank you for your request</h2>
      <p>We have received your quotation request${ref !== 'OK' ? ' (reference <strong>' + esc(ref) + '</strong>)' : ''}.</p>
      <p>The ANMA Medicals Team will contact you shortly for more details to process your order.</p>
      <a href="index.html" class="btn btn-primary" style="margin-top:16px">Back to home</a>
    </div>`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.addEventListener('DOMContentLoaded', renderCart);
