/* Product page behaviour – driven by window.PRODUCT */
(function () {
  const P = window.PRODUCT;
  const $ = id => document.getElementById(id);
  const chosen = {};   // label -> value
  let qty = 1;
  const wrap = $('opts');

  function group(label, labelId) {
    const l = document.createElement('div'); l.className = 'lbl';
    l.innerHTML = label + ': <span id="' + labelId + '">choose</span>';
    wrap.appendChild(l);
    const box = document.createElement('div'); wrap.appendChild(box); return box;
  }
  function pick(label, value, labelId, btn, box) {
    chosen[label] = value; $(labelId).textContent = value;
    [].forEach.call(box.children, x => x.classList.remove('on')); btn.classList.add('on');
  }

  if (P.colors) {
    const box = group('Colour', 'cn'); box.className = 'sw';
    P.colors.forEach((c, i) => {
      const b = document.createElement('button'); b.type = 'button';
      b.style.background = c[1]; b.title = c[0]; b.setAttribute('aria-label', c[0]);
      if (c[1].toLowerCase() === '#ffffff') b.style.borderColor = '#ccc';
      b.onclick = () => pick('Colour', c[0], 'cn', b, box);
      box.appendChild(b); if (i === 0) b.click();
    });
  }
  if (P.sizes) {
    const box = group('Size', 'sn'); box.className = 'sz';
    P.sizes.forEach(s => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = s;
      b.onclick = () => pick('Size', s, 'sn', b, box); box.appendChild(b);
    });
  }
  (P.options || []).forEach((o, k) => {
    const id = 'o' + k;
    const box = group(o.label, id); box.className = 'sz opt-list';
    o.values.forEach((v, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = v;
      b.onclick = () => pick(o.label, v, id, b, box); box.appendChild(b);
      if (o.values.length === 1) b.click();
    });
  });

  $('m').onclick = () => { qty = Math.max(1, qty - 1); $('q').textContent = qty; };
  $('p').onclick = () => { qty = Math.min(999, qty + 1); $('q').textContent = qty; };

  $('add').onclick = () => {
    const labels = [];
    if (P.colors) labels.push('Colour');
    if (P.sizes) labels.push('Size');
    (P.options || []).forEach(o => labels.push(o.label));
    const missing = labels.filter(l => !chosen[l]);
    const msg = $('msg'); msg.className = '';
    if (missing.length) { msg.textContent = 'Please choose: ' + missing.join(', ').toLowerCase() + '.'; msg.className = 'err'; return; }
    addToCart({ id: P.id, name: P.name, options: labels.map(l => ({ label: l, value: chosen[l] })), qty });
    msg.textContent = qty + '× ' + P.name + ' added to your basket.';
  };
})();

/* gallery thumbnails */
document.querySelectorAll('#thumbs button').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('#thumbs button').forEach(x => x.classList.remove('on'));
  t.classList.add('on');
  const m = document.getElementById('mainImg'); if (m) m.src = t.dataset.src;
}));
