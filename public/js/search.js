/* Product search: header suggestions + search.html results (client side, no server needed) */
(function () {
  var L = window.I18N || {}, IDX = window.SEARCH_INDEX || [];
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  IDX.forEach(function (e) { e._h = norm([e.n, e.m, e.c, e.k].join(' ')); e._n = norm(e.n); });
  function find(q, limit) {
    var t = norm(q).split(/\s+/).filter(Boolean); if (!t.length) return [];
    var r = [];
    IDX.forEach(function (e) {
      var s = 0;
      for (var i = 0; i < t.length; i++) {
        if (e._h.indexOf(t[i]) < 0) return;
        var p = e._n.indexOf(t[i]); s += p === 0 ? 4 : (p > 0 ? 3 : 1);
      }
      r.push([s, e]);
    });
    r.sort(function (a, b) { return b[0] - a[0] || a[1].n.localeCompare(b[1].n); });
    return r.slice(0, limit || 9999).map(function (x) { return x[1]; });
  }
  function card(e) {
    return '<a href="' + esc(e.u) + '" class="prod-card"><div class="img contain"><img src="' + esc(e.i) + '" alt="' + esc(e.n) + '" loading="lazy"></div>' +
      '<div class="body"><h3>' + esc(e.n) + '</h3><div class="meta">' + esc(e.c) + '</div><div class="price-req">' + esc(L.priceReq || 'Price on request') + '</div></div></a>';
  }

  /* ---- header box with suggestions ---- */
  var form = document.getElementById('siteSearch');
  if (form) {
    var input = form.querySelector('input'), box = document.getElementById('sugg'), active = -1, items = [];
    input.placeholder = L.searchPh || input.placeholder;
    function close() { box.hidden = true; active = -1; }
    function render() {
      var q = input.value.trim();
      if (q.length < 2) return close();
      items = find(q, 7);
      if (!items.length) { box.innerHTML = '<div class="none">' + esc(L.searchNone || 'No results') + ' “' + esc(q) + '”</div>'; box.hidden = false; return; }
      box.innerHTML = items.map(function (e, i) {
        return '<a href="' + esc(e.u) + '" data-i="' + i + '"><img src="' + esc(e.i) + '" alt=""><span><b>' + esc(e.n) + '</b><small>' + esc(e.c) + '</small></span></a>';
      }).join('') + '<a href="search.html?q=' + encodeURIComponent(q) + '" class="all">' + esc(L.searchAll || 'All results') + ' →</a>';
      box.hidden = false; active = -1;
    }
    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('keydown', function (ev) {
      var links = box.querySelectorAll('a');
      if (ev.key === 'Escape') { close(); return; }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        if (!links.length) return; ev.preventDefault();
        active = (active + (ev.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links.forEach(function (a, i) { a.classList.toggle('on', i === active); });
      }
      if (ev.key === 'Enter' && active >= 0 && links[active]) { ev.preventDefault(); location.href = links[active].getAttribute('href'); }
    });
    document.addEventListener('click', function (ev) { if (!form.contains(ev.target)) close(); });
  }

  /* ---- results page ---- */
  var res = document.getElementById('sres');
  if (res) {
    var q = (new URLSearchParams(location.search).get('q') || '').trim();
    var big = document.getElementById('bigq'); if (big) { big.value = q; big.placeholder = L.searchPh || ''; }
    var hdr = document.querySelector('#siteSearch input'); if (hdr && q) hdr.value = q;
    var out = q ? find(q) : [], cnt = document.getElementById('scount'), none = document.getElementById('snone');
    if (!q) { cnt.textContent = L.searchEmpty || ''; }
    else if (!out.length) {
      none.hidden = false;
      document.getElementById('snonetxt').textContent = (L.searchNone || 'No products found for') + ' “' + q + '”';
      document.getElementById('snonetry').textContent = L.searchTry || '';
      cnt.textContent = '';
    } else {
      cnt.textContent = out.length + ' ' + (out.length === 1 ? L.searchProduct : L.searchProducts) + ' ' + (L.searchFor || 'for') + ' “' + q + '”';
      res.innerHTML = out.map(card).join('');
    }
  }
})();
