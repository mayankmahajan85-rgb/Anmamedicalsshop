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
   1) uses ../img/<slug>-<colour>.jpg if that photo exists (e.g. img/meliana-navy.jpg)
   2) otherwise recolours the model's tunic in the browser (photo is read through /api/img on your own site)
   3) if that is not possible the original photo stays. */
var origSrc = null, token = 0, recoloured = {};
function showColour(c) {
  var m = document.getElementById('mainImg'); if (!m || !P.colors) return;
  if (origSrc === null) { origSrc = m.getAttribute('src'); addOrigButton(m); }
  var my = ++token, key = c[2];
  function set(src) { if (my !== token) return; m.onerror = null; m.src = src; m.style.opacity = ''; var b = document.getElementById('origBtn'); if (b) b.style.display = ''; }
  function keep() { if (my !== token) return; m.style.opacity = ''; }
  if (recoloured[key]) return set(recoloured[key]);
  m.style.opacity = '.55';
  var loc = new Image();
  loc.onload = function () { recoloured[key] = loc.src; set(loc.src); };
  loc.onerror = function () {
    if (!P.photo || !window.recolorGarment || location.protocol.indexOf('http') !== 0) return keep();
    var im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = function () {
      try {
        var sc = Math.min(1, 900 / im.naturalWidth), w = Math.round(im.naturalWidth * sc), h = Math.round(im.naturalHeight * sc);
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        var cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, w, h);
        var id = cx.getImageData(0, 0, w, h);
        if (!window.recolorGarment(id.data, w, h, c[1])) return keep();
        cx.putImageData(id, 0, 0);
        recoloured[key] = cv.toDataURL('image/jpeg', 0.92); set(recoloured[key]);
      } catch (e) { keep(); }
    };
    im.onerror = keep;
    im.src = '/api/img?u=' + encodeURIComponent(P.photo);
  };
  loc.src = '../img/' + P.slug + '-' + key + '.jpg';
}
function addOrigButton(m) {
  var wrap = m.parentNode.parentNode;
  var b = document.createElement('button');
  b.type = 'button'; b.id = 'origBtn'; b.className = 'link-btn'; b.textContent = L.orig; b.style.display = 'none';
  b.onclick = function () { token++; m.onerror = null; m.style.opacity = ''; m.src = origSrc; b.style.display = 'none'; };
  wrap.appendChild(b);
}
