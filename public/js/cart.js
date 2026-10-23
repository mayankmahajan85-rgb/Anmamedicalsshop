/* Shared cart helpers – localStorage. Quotation shop: no prices. */
const CART_KEY = 'anma_cart_v2';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
function saveCart(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch {}
  updateCartCount();
}
function updateCartCount() {
  const total = getCart().reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = total; });
}
/* item: {id, name, options:[{label,value}], qty} */
function itemKey(i) { return i.id + '|' + (i.options || []).map(o => o.label + '=' + o.value).join(';'); }
function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => itemKey(i) === itemKey(item));
  if (existing) existing.qty += item.qty; else cart.push(item);
  saveCart(cart);
}
function removeFromCart(index) { const c = getCart(); c.splice(index, 1); saveCart(c); }
function setQty(index, qty) {
  const c = getCart();
  if (qty < 1) c.splice(index, 1); else c[index].qty = Math.min(qty, 999);
  saveCart(c);
}
function clearCart() { saveCart([]); }

function initMobileMenu() {
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('mobileNav');
  const close = document.getElementById('closeNav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.add('open'));
  close?.addEventListener('click', () => nav.classList.remove('open'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}
/* language switcher: remember the choice, open/close menu on tap */
function initLang() {
  const box = document.getElementById('langSwitch');
  if (!box) return;
  const btn = box.querySelector('.lang-btn');
  btn.addEventListener('click', e => { e.stopPropagation(); box.classList.toggle('open'); });
  document.addEventListener('click', () => box.classList.remove('open'));
  box.querySelectorAll('a[data-lang]').forEach(a => a.addEventListener('click', () => {
    try { localStorage.setItem('anma_lang', a.dataset.lang); } catch {}
  }));
  try { if (window.I18N) localStorage.setItem('anma_lang', window.I18N.lang); } catch {}
}
document.addEventListener('DOMContentLoaded', () => { updateCartCount(); initMobileMenu(); initLang(); });
