/* Product page behaviour – driven by window.PRODUCT and window.I18N */
var P = window.PRODUCT, L = window.I18N || {};
(function () {
  const $ = id => document.getElementById(id);
  const chosen = {};   // label -> value
  let qty = 1;
  const wrap = $('opts');

  function group(label, labelId) {
    const l = document.createElement('div'); l.className = 'lbl';
    l.appendChild(document.createTextNode(label + ': '));
    const sp = document.createElement('span'); sp.id = labelId; sp.textContent = L.choose; l.appendChild(sp);
    wrap.appendChild(l);
    const box = document.createElement('div'); wrap.appendChild(box); return box;
  }
  function pick(label, value, labelId, btn, box) {
    chosen[label] = value; $(labelId).textContent = value;
    [].forEach.call(box.children, x => x.classList.remove('on')); btn.classList.add('on');
  }

  if (P.colors) {
    const box = group(L.colour, 'cn'); box.className = 'sw';
    P.colors.forEach((c, i) => {
      const b = document.createElement('button'); b.type = 'button';
      b.style.background = c[1]; b.title = c[0]; b.setAttribute('aria-label', c[0]);
      if (c[1].toLowerCase() === '#ffffff') b.style.borderColor = '#ccc';
      b.onclick = () => { pick(L.colour, c[0], 'cn', b, box); showColour(c); };
      box.appendChild(b); if (i === 0) pick(L.colour, c[0], 'cn', b, box);
    });
  }
  if (P.sizes) {
    const box = group(L.size, 'sn'); box.className = 'sz';
    P.sizes.forEach(s => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = s;
      b.onclick = () => pick(L.size, s, 'sn', b, box); box.appendChild(b);
    });
  }
  (P.options || []).forEach((o, k) => {
    const id = 'o' + k;
    const box = group(o.label, id); box.className = 'sz opt-list';
    o.values.forEach(v => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = v;
      b.onclick = () => pick(o.label, v, id, b, box); box.appendChild(b);
      if (o.values.length === 1) b.click();
    });
  });

  $('m').onclick = () => { qty = Math.max(1, qty - 1); $('q').textContent = qty; };
  $('p').onclick = () => { qty = Math.min(999, qty + 1); $('q').textContent = qty; };

  $('add').onclick = () => {
    const labels = [];
    if (P.colors) labels.push(L.colour);
    if (P.sizes) labels.push(L.size);
    (P.options || []).forEach(o => labels.push(o.label));
    const missing = labels.filter(l => !chosen[l]);
    const msg = $('msg'); msg.className = '';
    if (missing.length) { msg.textContent = L.pleaseChoose + missing.join(', ').toLowerCase() + '.'; msg.className = 'err'; return; }
    addToCart({ id: P.id, name: P.name, options: labels.map(l => ({ label: l, value: chosen[l] })), qty });
    msg.textContent = qty + '× ' + P.name + L.added;
  };

  /* gallery thumbnails */
  document.querySelectorAll('#thumbs button').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('#thumbs button').forEach(x => x.classList.remove('on'));
    t.classList.add('on');
    const m = $('mainImg'); if (m) m.src = t.dataset.src;
  }));
})();

/* ---- colour -> picture ----
   1) uses ../img/<slug>-<colour>.jpg if you add such a photo (e.g. img/meliana-navy.jpg)
   2) otherwise draws the tunic in the chosen colour so the change is always visible.
   "Show original photo" returns to the source photo. */
var origSrc = null;
function tunicCard(name, hex) {
  var light = /^#(fff|ffffff|c9ced2)$/i.test(hex);
  var esc = function (t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 480 600">' +
    '<rect width="480" height="600" fill="#0f6b73"/><rect x="40" y="40" width="400" height="440" rx="24" fill="#e8f4f3"/>' +
    '<polygon points="130,170 180,120 240,150 300,120 350,170 320,195 318,380 162,380 160,195" fill="' + hex + '" stroke="' + (light ? '#9aa7ac' : 'none') + '" stroke-width="3"/>' +
    '<text x="240" y="525" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="30" fill="#0e171b">' + esc(name) + '</text>' +
    '<text x="240" y="558" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#5d6d75">' + esc(P.name) + '</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function showColour(c) {
  var m = document.getElementById('mainImg'); if (!m || !P.colors) return;
  if (origSrc === null) { origSrc = m.getAttribute('src'); addOrigButton(m); }
  m.onerror = function () { m.onerror = null; m.src = tunicCard(c[0], c[1]); };
  m.src = '../img/' + P.slug + '-' + c[2] + '.jpg';
  var b = document.getElementById('origBtn'); if (b) b.style.display = '';
}
function addOrigButton(m) {
  var wrap = m.parentNode.parentNode;
  var b = document.createElement('button');
  b.type = 'button'; b.id = 'origBtn'; b.className = 'link-btn'; b.textContent = L.orig; b.style.display = 'none';
  b.onclick = function () { m.onerror = null; m.src = origSrc; b.style.display = 'none'; };
  wrap.appendChild(b);
}
