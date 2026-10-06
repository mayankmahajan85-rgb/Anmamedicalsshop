/* Shared cart helpers – localStorage */
const CART_KEY = 'anma_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartCount();
}

function updateCartCount() {
  const items = getCart();
  const total = items.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    el.textContent = total;
  });
}

function addToCart(item) {
  const cart = getCart();
  const key = `${item.id}|${item.color}|${item.size}`;
  const existing = cart.find(i => `${i.id}|${i.color}|${i.size}` === key);
  if (existing) {
    existing.qty += item.qty;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function setQty(index, qty) {
  const cart = getCart();
  if (qty < 1) {
    cart.splice(index, 1);
  } else {
    cart[index].qty = qty;
  }
  saveCart(cart);
}

// Mobile menu
function initMobileMenu() {
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('mobileNav');
  const close = document.getElementById('closeNav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.add('open'));
  close?.addEventListener('click', () => nav.classList.remove('open'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  initMobileMenu();
});
