/* Recolour the garment on a product photo.
   recolor(data, w, h, hex): data = RGBA Uint8ClampedArray. Returns true on success, false if the garment
   could not be isolated reliably (caller then keeps the original photo).
   Method: take the median colour of the chest area as the garment colour, flood-fill the connected area of
   similar colour (shading allowed), then swap the colour while keeping the light/shadow of the fabric. */
(function (root) {
  function lum(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
  function med(a) { a.sort(function (x, y) { return x - y; }); return a[a.length >> 1]; }
  function smooth(e0, e1, x) { var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

  function recolor(d, w, h, hex) {
    var T = [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)];
    T = T.map(function (v) { return Math.min(245, Math.max(18, v)); });
    var x0 = Math.floor(w * 0.40), x1 = Math.floor(w * 0.60), y0 = Math.floor(h * 0.38), y1 = Math.floor(h * 0.52), x, y, i;
    var R = [], G = [], B = [];
    for (y = y0; y < y1; y++) for (x = x0; x < x1; x++) { i = (y * w + x) * 4; R.push(d[i]); G.push(d[i + 1]); B.push(d[i + 2]); }
    var sr = med(R.slice()), sg = med(G.slice()), sb = med(B.slice());
    // refine: ignore outliers (skin, hair, background) and re-take the median
    R = []; G = []; B = [];
    for (y = y0; y < y1; y++) for (x = x0; x < x1; x++) {
      i = (y * w + x) * 4;
      if (Math.abs(d[i] - sr) + Math.abs(d[i + 1] - sg) + Math.abs(d[i + 2] - sb) < 90) { R.push(d[i]); G.push(d[i + 1]); B.push(d[i + 2]); }
    }
    if (R.length < 50) return false;
    sr = med(R); sg = med(G); sb = med(B);
    var sL = Math.max(1, lum(sr, sg, sb));
    var cs = [sr / sL, sg / sL, sb / sL];
    var tolC = sL < 60 ? 0.45 : 0.18, LN = Math.log(2.3);

    function score(p) {          // 0 = identical to garment colour, >=1 = different
      var r = d[p], g = d[p + 1], b = d[p + 2], L = Math.max(1, lum(r, g, b));
      var dr = r / L - cs[0], dg = g / L - cs[1], db = b / L - cs[2];
      var sc = Math.sqrt(dr * dr + dg * dg + db * db) / tolC;
      var sl = Math.abs(Math.log(L / sL)) / LN;
      return Math.max(sc, sl);
    }
    var N = w * h, vis = new Uint8Array(N), wt = new Float32Array(N), stack = [], count = 0;
    for (y = y0; y < y1; y++) for (x = x0; x < x1; x++) {
      var idx = y * w + x;
      if (!vis[idx] && score(idx * 4) < 0.75) { vis[idx] = 1; stack.push(idx); }
    }
    while (stack.length) {
      var k = stack.pop(), kx = k % w, ky = (k / w) | 0, sc = score(k * 4);
      wt[k] = 1 - smooth(0.75, 1.0, sc); count++;
      if (kx > 0) nb(k - 1); if (kx < w - 1) nb(k + 1); if (ky > 0) nb(k - w); if (ky < h - 1) nb(k + w);
    }
    function nb(j) { if (!vis[j] && score(j * 4) < 1.0) { vis[j] = 1; stack.push(j); } }
    if (count < N * 0.02 || count > N * 0.5) return false;       // not a plausible garment area
    for (var j = 0; j < N; j++) {
      if (!vis[j] || wt[j] <= 0) continue;
      var p = j * 4, f = lum(d[p], d[p + 1], d[p + 2]) / sL;
      for (var c = 0; c < 3; c++) {
        var nv = f <= 1 ? T[c] * f : T[c] + (255 - T[c]) * Math.min(1, f - 1) * 0.8;
        d[p + c] = Math.max(0, Math.min(255, d[p + c] * (1 - wt[j]) + nv * wt[j]));
      }
    }
    return true;
  }
  root.recolorGarment = recolor;
  if (typeof module !== 'undefined') module.exports = recolor;
})(typeof window !== 'undefined' ? window : globalThis);
