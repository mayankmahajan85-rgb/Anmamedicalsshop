/* Cart + quotation request form */
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function renderCart() {
  const cart = getCart();
  const el = document.getElementById('cart-content');
  if (!cart.length) {
    el.innerHTML = `<div class="cart-empty"><p style="font-size:18px;margin-bottom:8px">Uw winkelmand is leeg</p><p style="margin-bottom:20px">Voeg producten toe en vraag vrijblijvend een offerte aan.</p><a href="medische-producten.html" class="btn btn-primary">Naar de producten</a></div>`;
    return;
  }
  const rows = cart.map((item, i) => `<tr>
      <td><div class="cart-item-name">${esc(item.name)}</div>
          <div class="cart-item-meta">${(item.options || []).map(o => esc(o.label) + ': ' + esc(o.value)).join(' · ')}</div></td>
      <td><div class="qty" style="display:inline-flex"><button type="button" data-q="${i}" data-d="-1" aria-label="Minder">−</button><span>${item.qty}</span><button type="button" data-q="${i}" data-d="1" aria-label="Meer">+</button></div></td>
      <td><button type="button" data-rm="${i}" class="rm" title="Verwijderen" aria-label="Verwijderen">×</button></td>
    </tr>`).join('');
  el.innerHTML = `
    <div style="overflow-x:auto"><table class="cart-table">
      <thead><tr><th>Product</th><th>Aantal</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="quote-grid">
      <form id="quoteForm" class="quote-form" novalidate>
        <h2>Offerte aanvragen</h2>
        <p class="hint">Alle prijzen zijn op aanvraag. Laat uw gegevens achter; het Anma Medicals Team neemt contact met u op.</p>
        <div class="f2">
          <label>Naam *<input name="name" required autocomplete="name"></label>
          <label>Praktijk / organisatie<input name="company" autocomplete="organization"></label>
          <label>E-mailadres *<input name="email" type="email" required autocomplete="email"></label>
          <label>Telefoonnummer *<input name="phone" type="tel" required autocomplete="tel"></label>
        </div>
        <label>Afleveradres<textarea name="address" rows="2" autocomplete="street-address"></textarea></label>
        <label>Opmerkingen (bijv. borduren, teamorder)<textarea name="notes" rows="3"></textarea></label>
        <input type="text" name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
        <div id="formMsg" role="alert"></div>
        <button class="btn btn-primary" id="submitBtn" type="submit" style="width:100%">Offerte aanvragen</button>
        <a href="medische-producten.html" class="btn btn-outline" style="width:100%;margin-top:10px">Verder winkelen</a>
      </form>
    </div>`;
  el.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { setQty(+b.dataset.q, getCart()[+b.dataset.q].qty + +b.dataset.d); renderCart(); });
  el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { removeFromCart(+b.dataset.rm); renderCart(); });
  document.getElementById('quoteForm').addEventListener('submit', submitQuote);
}

async function submitQuote(e) {
  e.preventDefault();
  const f = e.target, msg = document.getElementById('formMsg'), btn = document.getElementById('submitBtn');
  msg.className = ''; msg.textContent = '';
  const v = n => f.elements[n].value.trim();
  if (!v('name') || !v('phone') || !/^\S+@\S+\.\S+$/.test(v('email'))) {
    msg.className = 'err'; msg.textContent = 'Vul uw naam, een geldig e-mailadres en telefoonnummer in.'; return;
  }
  btn.disabled = true; btn.textContent = 'Bezig met versturen…';
  const payload = { name: v('name'), company: v('company'), email: v('email'), phone: v('phone'),
    address: v('address'), notes: v('notes'), website: v('website'), items: getCart() };
  try {
    const r = await fetch('/api/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.ok) throw new Error(data.error || 'send failed');
    clearCart();
    document.getElementById('cart-content').innerHTML = `
      <div class="thanks">
        <div class="tick">✓</div>
        <h2>Bedankt voor uw aanvraag</h2>
        <p>Wij hebben uw offerteaanvraag ontvangen${data.ref ? ' (referentie <strong>' + esc(data.ref) + '</strong>)' : ''}.</p>
        <p>Het Anma Medicals Team neemt zo spoedig mogelijk contact met u op voor meer details en om uw aanvraag te verwerken.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:16px">Terug naar home</a>
      </div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    btn.disabled = false; btn.textContent = 'Offerte aanvragen';
    msg.className = 'err';
    msg.innerHTML = 'Het versturen is helaas niet gelukt. Probeer het opnieuw of mail ons rechtstreeks via <a href="mailto:info@anmamedicals.com">info@anmamedicals.com</a>.';
  }
}
document.addEventListener('DOMContentLoaded', renderCart);
