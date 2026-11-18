/*
 * FoilRenderer — rendu 3D WebGL minimal, sans dépendance (graphismes de base)
 * ------------------------------------------------------------------
 * Tout est dessiné relativement à une origine proche du rider pour garder la précision.
 * Ordre : ciel → côte lointaine → décors du plan d'eau → planche, rider, wing → eau (transparente) → embruns.
 * La mer (clapot + houle) reprend exactement les ondes du moteur physique (sim.wv).
 */
(function (root) {
  'use strict';
  var DEG = Math.PI / 180;
  var NWAVE = 7;                       // 3 ondes de houle + 4 ondes de clapot (comme le moteur physique)

  // ---------------- vecteurs ----------------
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function scl(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function mad(a, b, s) { return [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function nrm(a) { var l = len(a); return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 1, 0]; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  // ---------------- matrices 4x4 (colonnes) ----------------
  function perspective(out, fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    return out;
  }
  function lookAt(out, eye, center, up) {
    var z = nrm(sub(eye, center)), x = nrm(cross(up, z)), y = cross(z, x);
    out[0] = x[0]; out[1] = y[0]; out[2] = z[0]; out[3] = 0;
    out[4] = x[1]; out[5] = y[1]; out[6] = z[1]; out[7] = 0;
    out[8] = x[2]; out[9] = y[2]; out[10] = z[2]; out[11] = 0;
    out[12] = -dot(x, eye); out[13] = -dot(y, eye); out[14] = -dot(z, eye); out[15] = 1;
    return out;
  }
  function mul(out, a, b) {
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return out;
  }
  function basis(out, X, Y, Z, P) {
    out[0] = X[0]; out[1] = X[1]; out[2] = X[2]; out[3] = 0;
    out[4] = Y[0]; out[5] = Y[1]; out[6] = Y[2]; out[7] = 0;
    out[8] = Z[0]; out[9] = Z[1]; out[10] = Z[2]; out[11] = 0;
    out[12] = P[0]; out[13] = P[1]; out[14] = P[2]; out[15] = 1;
    return out;
  }

  // ---------------- construction de maillages ----------------
  function MeshBuilder() { this.d = []; this.n = 0; }
  MeshBuilder.prototype.v = function (p, nr, c) {
    this.d.push(p[0], p[1], p[2], nr[0], nr[1], nr[2], c[0], c[1], c[2], c.length > 3 ? c[3] : 1); this.n++;
  };
  MeshBuilder.prototype.tri = function (a, b, c, col) {
    var nr = nrm(cross(sub(b, a), sub(c, a)));
    this.v(a, nr, col); this.v(b, nr, col); this.v(c, nr, col);
  };
  // triangle à couleurs par sommet (reliefs)
  MeshBuilder.prototype.tri3 = function (a, b, c, ca, cb, cc) {
    var nr = cross(sub(b, a), sub(c, a)), t;
    if (nr[1] < 0) { t = b; b = c; c = t; t = cb; cb = cc; cc = t; nr = scl(nr, -1); }   // face toujours tournée vers le haut
    nr = nrm(nr);
    this.v(a, nr, ca); this.v(b, nr, cb); this.v(c, nr, cc);
  };
  // pavé orienté : P(le long, en travers, hauteur) donne le point monde
  MeshBuilder.prototype.obox = function (P, a0, a1, l0, l1, y0, y1, col) {
    var p = [P(a0, l0, y0), P(a1, l0, y0), P(a1, l1, y0), P(a0, l1, y0), P(a0, l0, y1), P(a1, l0, y1), P(a1, l1, y1), P(a0, l1, y1)];
    this.quad(p[0], p[1], p[5], p[4], col); this.quad(p[1], p[2], p[6], p[5], col); this.quad(p[2], p[3], p[7], p[6], col);
    this.quad(p[3], p[0], p[4], p[7], col); this.quad(p[4], p[5], p[6], p[7], col); this.quad(p[0], p[3], p[2], p[1], col);
  };
  MeshBuilder.prototype.quad = function (a, b, c, d, col) { this.tri(a, b, c, col); this.tri(a, c, d, col); };
  MeshBuilder.prototype.box = function (lo, hi, col) {
    var x0 = lo[0], y0 = lo[1], z0 = lo[2], x1 = hi[0], y1 = hi[1], z1 = hi[2];
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col);
    this.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], col);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col);
    this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], col);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col);
  };
  // tube lisse entre deux points
  MeshBuilder.prototype.tube = function (a, b, ra, rb, col, sides) {
    sides = sides || 8;
    var ax = nrm(sub(b, a)), ref = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    var u = nrm(cross(ax, ref)), w = cross(ax, u), i;
    for (i = 0; i < sides; i++) {
      var t0 = i / sides * 2 * Math.PI, t1 = (i + 1) / sides * 2 * Math.PI;
      var d0 = add(scl(u, Math.cos(t0)), scl(w, Math.sin(t0))), d1 = add(scl(u, Math.cos(t1)), scl(w, Math.sin(t1)));
      var p0 = mad(a, d0, ra), p1 = mad(a, d1, ra), p2 = mad(b, d1, rb), p3 = mad(b, d0, rb);
      this.v(p0, d0, col); this.v(p1, d1, col); this.v(p2, d1, col);
      this.v(p0, d0, col); this.v(p2, d1, col); this.v(p3, d0, col);
    }
  };
  // disque horizontal (dessus)
  MeshBuilder.prototype.disc = function (c, r, col, sides) {
    sides = sides || 12;
    for (var i = 0; i < sides; i++) {
      var t0 = i / sides * 2 * Math.PI, t1 = (i + 1) / sides * 2 * Math.PI;
      this.v(c, [0, 1, 0], col);
      this.v([c[0] + r * Math.cos(t1), c[1], c[2] + r * Math.sin(t1)], [0, 1, 0], col);
      this.v([c[0] + r * Math.cos(t0), c[1], c[2] + r * Math.sin(t0)], [0, 1, 0], col);
    }
  };
  MeshBuilder.prototype.sphere = function (c, r, col, seg, rings) {
    seg = seg || 12; rings = rings || 8;
    for (var i = 0; i < rings; i++) {
      var a0 = -Math.PI / 2 + Math.PI * i / rings, a1 = -Math.PI / 2 + Math.PI * (i + 1) / rings;
      for (var j = 0; j < seg; j++) {
        var b0 = 2 * Math.PI * j / seg, b1 = 2 * Math.PI * (j + 1) / seg;
        var n00 = [Math.cos(a0) * Math.cos(b0), Math.sin(a0), Math.cos(a0) * Math.sin(b0)];
        var n01 = [Math.cos(a0) * Math.cos(b1), Math.sin(a0), Math.cos(a0) * Math.sin(b1)];
        var n10 = [Math.cos(a1) * Math.cos(b0), Math.sin(a1), Math.cos(a1) * Math.sin(b0)];
        var n11 = [Math.cos(a1) * Math.cos(b1), Math.sin(a1), Math.cos(a1) * Math.sin(b1)];
        this.v(mad(c, n00, r), n00, col); this.v(mad(c, n10, r), n10, col); this.v(mad(c, n11, r), n11, col);
        this.v(mad(c, n00, r), n00, col); this.v(mad(c, n11, r), n11, col); this.v(mad(c, n01, r), n01, col);
      }
    }
  };

  // ---------------- décors des plans d'eau ----------------
  var RELIEF = {
    sand:  { lo: [0.93, 0.87, 0.68], mid: [0.90, 0.84, 0.64], hi: [0.36, 0.56, 0.30], p: 2.4, shore: 0.22 },
    green: { lo: [0.60, 0.56, 0.48], mid: [0.33, 0.50, 0.30], hi: [0.26, 0.42, 0.26], p: 2.0, shore: 0.10 },
    rock:  { lo: [0.26, 0.25, 0.25], mid: [0.38, 0.36, 0.34], hi: [0.30, 0.38, 0.28], p: 1.25, shore: 0.05 }
  };
  // contour d'une île : rayon selon l'azimut (irrégulier mais lisse)
  function islandR(R, seed, a) {
    return R * (1 + 0.13 * Math.sin(2 * a + seed * 3.1) + 0.08 * Math.sin(3 * a + seed * 7.7) + 0.05 * Math.sin(5 * a + seed * 1.3));
  }
  function islandH(R, H, seed, kind, x, z) {
    var a = Math.atan2(z, x), r = Math.sqrt(x * x + z * z), rr = r / islandR(R, seed, a), k = RELIEF[kind] || RELIEF.green;
    if (rr >= 1) return -1.6 * (rr - 1) / 0.12;
    var bump = 1 + 0.22 * Math.sin(x * 0.11 + seed * 5) * Math.cos(z * 0.13 + seed * 2);
    return H * Math.pow(1 - Math.pow(rr, k.p), 0.9) * bump;
  }
  function buildIsland(mb, R, H, seed, kind) {
    var NS = 22, NR = 7, k = RELIEF[kind] || RELIEF.green, i, j;
    function pt(ir, is) {
      var a = is / NS * 2 * Math.PI, rr = ir / NR * 1.12, r = rr * islandR(R, seed, a);
      var x = r * Math.cos(a), z = r * Math.sin(a);
      return [x, ir === 0 ? islandH(R, H, seed, kind, 0, 0) : islandH(R, H, seed, kind, x, z), z];
    }
    function col(p) {
      var t = clamp(p[1] / Math.max(H, 0.1), 0, 1), sh = hash(p[0] * 0.37 + p[2] * 0.91) * 0.08 - 0.04, c;
      if (t < k.shore) c = lerp3(k.lo, k.mid, t / k.shore); else c = lerp3(k.mid, k.hi, smooth((t - k.shore) / (0.75 - k.shore)));
      return [c[0] + sh, c[1] + sh, c[2] + sh];
    }
    for (i = 0; i < NR; i++) for (j = 0; j < NS; j++) {
      var a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      if (i > 0) mb.tri3(a, c, d, col(a), col(c), col(d));
      mb.tri3(a, b, c, col(a), col(b), col(c));
    }
  }
  function buildPalm(mb, x, y, z, h, seed) {
    var az = seed * 6.283, lean = 0.25 + 0.35 * hash(seed * 3.3), dx = Math.cos(az) * lean, dz = Math.sin(az) * lean;
    var trunk = [0.46, 0.36, 0.24], leaf = [0.20, 0.50, 0.22], leaf2 = [0.28, 0.58, 0.24], i;
    var p0 = [x, y - 0.3, z], p1 = [x + dx * h * 0.25, y + h * 0.5, z + dz * h * 0.25], p2 = [x + dx * h * 0.75, y + h, z + dz * h * 0.75];
    mb.tube(p0, p1, 0.20, 0.15, trunk, 6); mb.tube(p1, p2, 0.15, 0.11, trunk, 6);
    for (i = 0; i < 8; i++) {
      var a = i / 8 * 6.283 + seed * 2, d = [Math.cos(a), 0, Math.sin(a)], s = [-d[2], 0, d[0]], L = 2.3 + 0.9 * hash(seed + i);
      var m = [p2[0] + d[0] * L * 0.5, p2[1] + 0.45, p2[2] + d[2] * L * 0.5], e = [p2[0] + d[0] * L, p2[1] - 0.75, p2[2] + d[2] * L];
      var c = i % 2 ? leaf : leaf2;
      mb.tri(p2, mad(m, s, 0.42), mad(m, s, -0.42), c); mb.tri(mad(m, s, 0.42), e, mad(m, s, -0.42), c);
    }
  }
  function buildLighthouse(mb, y, h) {
    var white = [0.95, 0.95, 0.92], red = [0.82, 0.16, 0.14], dark = [0.14, 0.15, 0.17], glass = [1.0, 0.96, 0.70], i, nb = 5;
    for (i = 0; i < nb; i++) {
      var y0 = y + h * i / nb, y1 = y + h * (i + 1) / nb, r0 = lerp(3.3, 2.1, i / nb), r1 = lerp(3.3, 2.1, (i + 1) / nb);
      mb.tube([0, y0, 0], [0, y1, 0], r0, r1, i % 2 ? red : white, 14);
    }
    mb.tube([0, y + h, 0], [0, y + h + 0.5, 0], 3.0, 3.0, dark, 14); mb.disc([0, y + h + 0.5, 0], 3.0, dark, 14);
    mb.tube([0, y + h + 0.5, 0], [0, y + h + 3.0, 0], 1.6, 1.6, glass, 12);
    mb.tube([0, y + h + 3.0, 0], [0, y + h + 4.8, 0], 2.0, 0.05, red, 12);
    mb.box([-1.0, y, 3.0], [1.0, y + 2.4, 3.6], dark);
  }
  // jetée sur pilotis, le long de l'axe (dx, dz), depuis l'origine locale
  function buildPier(mb, L, dx, dz) {
    var wood = [0.50, 0.40, 0.28], wood2 = [0.36, 0.29, 0.21], px = -dz, pz = dx, W = 2.2, t, i;
    function P(al, lat, y) { return [dx * al + px * lat, y, dz * al + pz * lat]; }
    for (i = 0; i < Math.round(L / 3); i++) {
      t = i * 3;
      mb.quad(P(t, -W, 1.75), P(t, W, 1.75), P(t + 2.9, W, 1.75), P(t + 2.9, -W, 1.75), i % 2 ? wood : wood2);
      mb.quad(P(t, -W, 1.45), P(t + 2.9, -W, 1.45), P(t + 2.9, -W, 1.75), P(t, -W, 1.75), wood2);
      mb.quad(P(t, W, 1.45), P(t, W, 1.75), P(t + 2.9, W, 1.75), P(t + 2.9, W, 1.45), wood2);
    }
    for (t = 2; t <= L; t += 6) {
      mb.tube(P(t, -W + 0.2, -2.5), P(t, -W + 0.2, 2.4), 0.20, 0.20, wood2, 6);
      mb.tube(P(t, W - 0.2, -2.5), P(t, W - 0.2, 2.4), 0.20, 0.20, wood2, 6);
    }
    mb.obox(P, L - 4.4, L - 1.0, -1.5, 1.5, 1.75, 4.0, [0.86, 0.84, 0.78]);         // cabane du bout de jetée
    mb.tube(P(L - 2.7, 0, 4.0), P(L - 2.7, 0, 5.3), 2.5, 0.1, [0.62, 0.20, 0.16], 4);
  }
  function buildBoat(mb, L, dx, dz, sail, hullCol) {
    var px = -dz, pz = dx, B = L * 0.17, hull = hullCol || [0.94, 0.94, 0.92], stripe = [0.10, 0.20, 0.36], deck = [0.80, 0.74, 0.62], i, N = 6;
    function P(al, lat, y) { return [dx * al + px * lat, y, dz * al + pz * lat]; }
    var st = [];
    for (i = 0; i <= N; i++) { var u = -0.5 + i / N; st.push({ x: u * L, hw: B * Math.pow(Math.max(0.03, 1 - Math.pow(Math.abs(u * 2), 2.2) * (u > 0 ? 1 : 0.35)), 0.6) }); }
    for (i = 0; i < N; i++) {
      var a = st[i], b = st[i + 1];
      [1, -1].forEach(function (sg) {
        mb.quad(P(a.x, sg * a.hw * 0.55, -0.5), P(b.x, sg * b.hw * 0.55, -0.5), P(b.x, sg * b.hw, 0.55), P(a.x, sg * a.hw, 0.55), stripe);
        mb.quad(P(a.x, sg * a.hw, 0.55), P(b.x, sg * b.hw, 0.55), P(b.x, sg * b.hw, 1.05), P(a.x, sg * a.hw, 1.05), hull);
      });
      mb.quad(P(a.x, -a.hw, 1.05), P(a.x, a.hw, 1.05), P(b.x, b.hw, 1.05), P(b.x, -b.hw, 1.05), deck);
    }
    mb.quad(P(st[0].x, -st[0].hw, -0.5), P(st[0].x, st[0].hw, -0.5), P(st[0].x, st[0].hw, 1.05), P(st[0].x, -st[0].hw, 1.05), hull);
    mb.obox(P, -L * 0.12, L * 0.16, -B * 0.55, B * 0.55, 1.05, 1.75, [0.97, 0.97, 0.96]);
    if (sail) {
      mb.tube(P(L * 0.08, 0, 1.05), P(L * 0.08, 0, 1.05 + L * 1.25), 0.07, 0.05, [0.80, 0.80, 0.82], 6);
      mb.tube(P(L * 0.08, 0, 2.3), P(-L * 0.36, 0, 2.4), 0.06, 0.06, [0.80, 0.80, 0.82], 6);
      mb.tube(P(L * 0.08, 0, 2.45), P(-L * 0.34, 0, 2.55), 0.16, 0.16, [0.16, 0.30, 0.50], 6);
    } else {
      mb.tube(P(L * 0.05, 0, 1.75), P(L * 0.05, 0, 4.2), 0.05, 0.04, [0.3, 0.3, 0.32], 5);
      mb.obox(P, -L * 0.44, -L * 0.32, -0.5, 0.5, 1.05, 1.6, [0.85, 0.45, 0.12]);
    }
  }
  var BEACON = { red: [0.86, 0.14, 0.12], green: [0.10, 0.60, 0.28], yellow: [0.96, 0.82, 0.10], black: [0.10, 0.10, 0.11] };
  function buildBeacon(mb, col, tall) {
    var c = BEACON[col] || BEACON.red, h = tall || 3.4;
    if (col === 'yellow') {                               // marque cardinale : jaune et noire
      mb.tube([0, -1.2, 0], [0, h * 0.5, 0], 0.42, 0.36, BEACON.yellow, 10); mb.tube([0, h * 0.5, 0], [0, h, 0], 0.36, 0.30, BEACON.black, 10);
      mb.tube([0, h, 0], [0, h + 0.3, 0], 0.05, 0.05, BEACON.black, 5);
      mb.tube([0, h + 0.3, 0], [0, h + 0.95, 0], 0.36, 0.02, BEACON.black, 8); mb.tube([0, h + 1.05, 0], [0, h + 1.7, 0], 0.36, 0.02, BEACON.black, 8);
    } else {
      mb.tube([0, -1.2, 0], [0, h, 0], 0.40, 0.30, c, 10);
      mb.tube([0, h, 0], [0, h + 0.35, 0], 0.05, 0.05, BEACON.black, 5);
      if (col === 'green') mb.tube([0, h + 0.35, 0], [0, h + 1.15, 0], 0.40, 0.02, c, 8);
      else mb.tube([0, h + 0.35, 0], [0, h + 1.05, 0], 0.36, 0.36, c, 8);
    }
  }
  // tourelle maçonnée sur un rocher
  function buildTower(mb, y, h) {
    var w = [0.93, 0.93, 0.90], g = [0.12, 0.52, 0.30], k = [0.12, 0.13, 0.14];
    mb.tube([0, y, 0], [0, y + h * 0.5, 0], 2.4, 2.0, w, 12); mb.tube([0, y + h * 0.5, 0], [0, y + h, 0], 2.0, 1.7, g, 12);
    mb.disc([0, y + h, 0], 2.1, k, 12); mb.tube([0, y + h, 0], [0, y + h + 0.3, 0], 2.1, 2.1, k, 12);
    mb.tube([0, y + h + 0.3, 0], [0, y + h + 1.9, 0], 0.9, 0.9, [1.0, 0.96, 0.70], 10);
    mb.tube([0, y + h + 1.9, 0], [0, y + h + 3.0, 0], 1.2, 0.05, g, 10);
  }

  // ---------------- shaders ----------------
  var VS_MESH = [
    'attribute vec3 aPos; attribute vec3 aNor; attribute vec4 aCol;',
    'uniform mat4 uVP; uniform mat4 uModel; uniform vec4 uTint;',
    'varying vec3 vNor; varying vec4 vCol; varying vec3 vW;',
    'void main(){ vec4 w = uModel*vec4(aPos,1.0); vW = w.xyz; vNor = mat3(uModel)*aNor; vCol = aCol*uTint; gl_Position = uVP*w; }'
  ].join('\n');
  var FS_MESH = [
    'precision mediump float;',
    'varying vec3 vNor; varying vec4 vCol; varying vec3 vW;',
    'uniform vec3 uLight; uniform vec3 uFog; uniform vec3 uCam; uniform vec3 uDeep; uniform float uFogDist; uniform float uUnlit; uniform float uWaterY;',
    'void main(){',
    '  vec3 n = normalize(vNor); if (!gl_FrontFacing) n = -n;',
    '  float d = max(dot(n,uLight),0.0);',
    '  vec3 c = vCol.rgb*mix(0.40 + 0.20*(0.5+0.5*n.y) + 0.60*d, 1.0, uUnlit);',
    '  float under = clamp((uWaterY - vW.y)*1.1, 0.0, 0.78);',
    '  c = mix(c, uDeep, under*(1.0-uUnlit));',
    '  float f = clamp(length(vW-uCam)/uFogDist, 0.0, 1.0);',
    '  c = mix(c, uFog, f*f);',
    '  gl_FragColor = vec4(c, vCol.a);',
    '}'
  ].join('\n');

  // uWk[i] = (kx, kz, phase à l'origine de rendu, amplitude) ; i < 3 : houle, sinon clapot
  var VS_WATER = [
    'attribute vec2 aGrid;',
    'uniform mat4 uVP; uniform vec2 uOrigin; uniform vec4 uWk[' + NWAVE + ']; uniform float uLin; uniform float uRange;',
    'varying vec3 vRel; varying vec2 vAbs;',
    'void main(){',
    '  vec2 a = abs(aGrid);',
    '  vec2 s = sign(aGrid)*(uLin*a + uRange*a*a*a*a);',
    '  float d = length(s);',
    '  float fs = clamp(1.0 - (d - 110.0)/230.0, 0.0, 1.0), fc = clamp(1.0 - d/150.0, 0.0, 1.0);',
    '  float y = 0.0;',
    '  for (int i = 0; i < ' + NWAVE + '; i++) {',
    '    float f = i < 3 ? fs : fc;',
    '    y += uWk[i].w*cos(uWk[i].x*s.x + uWk[i].y*s.y + uWk[i].z)*f;',
    '  }',
    '  vRel = vec3(s.x, y, s.y); vAbs = s + uOrigin;',
    '  gl_Position = uVP*vec4(vRel,1.0);',
    '}'
  ].join('\n');
  var FS_WATER = [
    'precision highp float;',
    'varying vec3 vRel; varying vec2 vAbs;',
    'uniform vec3 uCam; uniform vec3 uLight; uniform float uTime;',
    'uniform vec4 uWk[' + NWAVE + ']; uniform float uSwA; uniform float uFoam;',
    'uniform vec2 uWind; uniform float uW0; uniform float uGust;',
    'uniform vec3 uSkyH; uniform vec3 uSkyZ; uniform vec3 uDeep; uniform vec3 uFog;',
    'uniform vec4 uShA; uniform vec4 uShB;',
    'void main(){',
    '  vec2 p = vAbs; vec2 r = vRel.xz; float t = uTime;',
    '  float dist = length(uCam - vRel);',
    '  vec2 g = vec2(0.0); float hs = 0.0;',
    '  for (int i = 0; i < ' + NWAVE + '; i++) {',
    '    float ar = uWk[i].x*r.x + uWk[i].y*r.y + uWk[i].z;',
    '    g -= uWk[i].w*sin(ar)*uWk[i].xy;',
    '    if (i < 3) hs += uWk[i].w*cos(ar);',
    '  }',
    '  float hn = uSwA > 0.01 ? hs/uSwA : 0.0;',
    '  vec2 perp = vec2(uWind.y, -uWind.x);',
    '  float al = dot(p, uWind), cr = dot(p, perp);',
    '  float uu = al - 0.6*uW0*t;',
    '  float gn = 0.55*sin(0.021*uu+1.3)*cos(0.013*cr+0.7) + 0.30*sin(0.047*uu+0.011*cr+2.1) + 0.15*sin(0.110*uu-0.050*cr+4.0);',
    '  float gust = clamp(gn*uGust*6.0, -1.0, 1.0);',
    '  float att = 1.0/(1.0 + dist*0.035);',
    '  float amp = (0.55 + 0.55*gust)*att*clamp(uW0/9.0, 0.3, 1.6);',
    '  g += uWind*(cos(al*2.9 - t*4.2 + sin(cr*0.83)*1.6)*0.050 + cos(al*6.7 - t*7.5 + cr*1.9)*0.028)*amp;',
    '  g += perp*(cos(cr*4.3 + al*1.1 - t*1.7)*0.030 + cos(cr*9.1 - al*2.3 + t*2.9)*0.014)*amp;',
    '  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));',
    '  vec3 V = normalize(uCam - vRel);',
    '  float fres = 0.03 + 0.97*pow(1.0 - max(dot(n,V),0.0), 5.0);',
    '  vec3 R = reflect(-V, n); R.y = abs(R.y);',
    '  vec3 sky = mix(uSkyH, uSkyZ, clamp(R.y*1.4,0.0,1.0));',
    '  vec3 base = uDeep*(0.70 + 0.55*max(dot(n,uLight),0.0));',
    '  base *= 1.0 - 0.30*gust;',
    '  base *= 1.0 + 0.22*hn;',                                        // crêtes plus claires, creux plus sombres
    '  vec3 c = mix(base, sky, fres);',
    '  c += vec3(1.0,0.96,0.85)*pow(max(dot(R,uLight),0.0), 220.0)*1.4;',
    '  // écume éparse : repères de vitesse',
    '  vec2 q = p/1.9; vec2 ci = floor(q); vec2 cf = fract(q);',
    '  float h = fract(sin(dot(mod(ci, 997.0), vec2(127.1,311.7)))*43758.5453);',
    '  if (h > 0.90) { vec2 off = vec2(fract(h*13.3), fract(h*71.7)); float d = length(cf - 0.25 - 0.5*off);',
    '    c = mix(c, vec3(0.93,0.96,0.97), smoothstep(0.13, 0.03, d)*0.55*clamp(1.0 - dist/70.0, 0.0, 1.0)); }',
    '  // moutons sur les crêtes de houle',
    '  if (uFoam > 0.0) { vec2 qf = p/0.9; float h2 = fract(sin(dot(mod(floor(qf), 991.0), vec2(269.5,183.3)))*43758.5453);',
    '    float fo = smoothstep(0.72, 0.98, hn)*smoothstep(0.35, 0.9, h2)*uFoam*clamp(1.0 - dist/420.0, 0.0, 1.0);',
    '    fo *= smoothstep(0.66, 0.16, length(fract(qf) - 0.5))*smoothstep(3.0, 14.0, dist);',      // taches arrondies, et rien au ras de la caméra (sinon : des carreaux)
    '    c = mix(c, vec3(0.94,0.97,0.98), fo*0.9); }',
    '  // ombres portées (planche + rider, wing)',
    '  float sh = 0.0;',
    '  sh = max(sh, uShA.w*smoothstep(uShA.z, uShA.z*0.35, length(vRel.xz - uShA.xy)));',
    '  sh = max(sh, uShB.w*smoothstep(uShB.z, uShB.z*0.35, length(vRel.xz - uShB.xy)));',
    '  c *= 1.0 - sh;',
    '  float f = clamp(dist/3800.0, 0.0, 1.0);',
    '  c = mix(c, uFog, f*f*(3.0-2.0*f));',
    '  gl_FragColor = vec4(c, mix(0.80, 1.0, clamp(dist/45.0, 0.0, 1.0)));',
    '}'
  ].join('\n');

  var VS_SKY = [
    'attribute vec3 aPos; uniform mat4 uVP; varying vec3 vDir;',
    'void main(){ vDir = aPos; vec4 p = uVP*vec4(aPos*4000.0, 1.0); gl_Position = p.xyww; }'
  ].join('\n');
  var FS_SKY = [
    'precision mediump float;',
    'varying vec3 vDir; uniform vec3 uLight; uniform vec3 uSkyH; uniform vec3 uSkyZ; uniform float uTime; uniform vec2 uWind; uniform float uCloud;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1)))*43758.5453); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);',
    '  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y); }',
    'void main(){',
    '  vec3 d = normalize(vDir);',
    '  float e = clamp(d.y, 0.0, 1.0);',
    '  vec3 c = mix(uSkyH, uSkyZ, pow(e, 0.55));',
    '  float s = max(dot(d, uLight), 0.0);',
    '  c += vec3(1.0,0.9,0.7)*(pow(s, 900.0)*2.0 + pow(s, 12.0)*0.18);',
    '  if (d.y > 0.02) { vec2 uv = d.xz/(d.y+0.12)*1.6 + uWind*uTime*0.012;',
    '    float n = noise(uv)*0.55 + noise(uv*2.1)*0.30 + noise(uv*4.3)*0.15;',
    '    float cl = smoothstep(0.52 - 0.14*uCloud, 0.80 - 0.10*uCloud, n)*smoothstep(0.02, 0.22, d.y);',
    '    c = mix(c, vec3(1.0,1.0,1.0)*(1.0 - 0.18*uCloud), cl*0.75); }',
    '  if (d.y < 0.0) c = uSkyH*0.9;',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  var VS_PT = [
    'attribute vec4 aP; attribute float aA; uniform mat4 uVP; uniform float uScale; varying float vA;',
    'void main(){ gl_Position = uVP*vec4(aP.xyz,1.0); gl_PointSize = clamp(aP.w*uScale/max(gl_Position.w, 0.1), 1.0, 96.0); vA = aA; }'
  ].join('\n');
  var FS_PT = [
    'precision mediump float; varying float vA;',
    'void main(){ float d = length(gl_PointCoord-0.5); gl_FragColor = vec4(0.95,0.98,1.0, smoothstep(0.5,0.15,d)*vA); }'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader : ' + gl.getShaderInfoLog(s));
    return s;
  }
  function program(gl, vs, fs, attribs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    for (var i = 0; i < attribs.length; i++) gl.bindAttribLocation(p, i, attribs[i]);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Programme : ' + gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i); u[info.name.replace('[0]', '')] = gl.getUniformLocation(p, info.name); }
    return { p: p, u: u };
  }

  var PAL0 = { skyH: [0.74, 0.86, 0.95], skyZ: [0.20, 0.47, 0.84], deep: [0.015, 0.20, 0.30], fog: [0.72, 0.84, 0.93], light: [0.45, 0.72, 0.35], cloud: 0 };

  // ---------------- renderer ----------------
  function FoilRenderer(canvas) {
    var gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' }) ||
             canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL indisponible');
    this.gl = gl; this.canvas = canvas;
    this.pMesh = program(gl, VS_MESH, FS_MESH, ['aPos', 'aNor', 'aCol']);
    this.pWater = program(gl, VS_WATER, FS_WATER, ['aGrid']);
    this.pSky = program(gl, VS_SKY, FS_SKY, ['aPos']);
    this.pPt = program(gl, VS_PT, FS_PT, ['aP', 'aA']);
    this.proj = new Float32Array(16); this.view = new Float32Array(16); this.vp = new Float32Array(16);
    this.m = new Float32Array(16); this.vpSky = new Float32Array(16);
    this.wk = new Float32Array(NWAVE * 4);
    this.light = nrm(PAL0.light);
    this.skyH = PAL0.skyH; this.skyZ = PAL0.skyZ; this.deep = PAL0.deep; this.fog = PAL0.fog; this.cloud = 0;
    this.camMode = 0; this.camYaw = null; this.camPos = [0, 3, 8]; this.camTgt = [0, 1, 0];
    this.sigVis = 1; this.dirW = [0, 1, 0];
    this.decor = []; this.mCoast = null; this.spotKey = null;
    this.buildStatic();
    this.setSpot(null);
    this.maxPt = 900; this.pt = []; this.ptData = new Float32Array(this.maxPt * 5); this.ptBuf = gl.createBuffer();
    this.geoKey = null;
  }

  FoilRenderer.prototype.mesh = function (mb) {
    var gl = this.gl, b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mb.d), gl.STATIC_DRAW);
    return { b: b, n: mb.n };
  };
  FoilRenderer.prototype.free = function (m) { if (m && m.b) this.gl.deleteBuffer(m.b); };

  FoilRenderer.prototype.buildStatic = function () {
    var gl = this.gl, mb, i, j;
    // primitives unitaires
    mb = new MeshBuilder(); mb.tube([0, 0, 0], [0, 1, 0], 1, 1, [1, 1, 1], 10); this.mCyl = this.mesh(mb);
    mb = new MeshBuilder(); mb.sphere([0, 0, 0], 1, [1, 1, 1], 12, 8); this.mSph = this.mesh(mb);
    mb = new MeshBuilder(); mb.box([-0.5, -0.5, -0.5], [0.5, 0.5, 0.5], [1, 1, 1]); this.mBox = this.mesh(mb);
    // grille d'eau : maille fine près du rider (pour la houle), de plus en plus lâche vers l'horizon
    var N = 200, g = new Float32Array(N * N * 12), k = 0;
    for (i = 0; i < N; i++) for (j = 0; j < N; j++) {
      var x0 = -1 + 2 * i / N, x1 = -1 + 2 * (i + 1) / N, y0 = -1 + 2 * j / N, y1 = -1 + 2 * (j + 1) / N;
      g[k++] = x0; g[k++] = y0; g[k++] = x1; g[k++] = y0; g[k++] = x1; g[k++] = y1;
      g[k++] = x0; g[k++] = y0; g[k++] = x1; g[k++] = y1; g[k++] = x0; g[k++] = y1;
    }
    this.wBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.wBuf);
    gl.bufferData(gl.ARRAY_BUFFER, g, gl.STATIC_DRAW); this.wN = g.length / 2;
    // ciel : cube
    var c = [], q = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    var f = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]];
    for (i = 0; i < 6; i++) { var a = f[i]; [0, 1, 2, 0, 2, 3].forEach(function (kk) { c.push(q[a[kk]][0], q[a[kk]][1], q[a[kk]][2]); }); }
    this.sBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.sBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(c), gl.STATIC_DRAW);
    // bouée
    mb = new MeshBuilder();
    mb.tube([0, -0.25, 0], [0, 0.55, 0], 0.32, 0.26, [1, 1, 1], 10);
    mb.tube([0, 0.55, 0], [0, 0.95, 0], 0.26, 0.05, [1, 1, 1], 10);
    mb.tube([0, 0.95, 0], [0, 2.1, 0], 0.025, 0.025, [0.25, 0.25, 0.25], 6);
    this.mBuoy = this.mesh(mb);
    mb = new MeshBuilder(); mb.quad([0, 0, 0], [0.75, -0.08, 0], [0.75, 0.30, 0], [0, 0.38, 0], [1, 1, 1]); this.mFlag = this.mesh(mb);
  };

  // ---------------- plan d'eau : couleurs, côte lointaine, repères ----------------
  // def : { key, pal, coast: { seed, col0, col1, arc: [début, fin] en degrés (ou absent = tout l'horizon), base, amp }, marks: [...] }
  FoilRenderer.prototype.setSpot = function (def) {
    var key = def ? def.key : '(aucun)';
    if (this.spotKey === key) return;
    this.spotKey = key;
    var pal = (def && def.pal) || PAL0, i, self = this, mb;
    this.skyH = pal.skyH || PAL0.skyH; this.skyZ = pal.skyZ || PAL0.skyZ; this.deep = pal.deep || PAL0.deep; this.fog = pal.fog || PAL0.fog;
    this.light = nrm(pal.light || PAL0.light); this.cloud = pal.cloud || 0;
    // côte lointaine : anneau de collines (décor à l'infini, il suit le joueur)
    this.free(this.mCoast);
    var co = (def && def.coast) || { seed: 0.7 }, S = 120, R = 5200, sd = co.seed || 0.7;
    var col0 = co.col0 || [0.20, 0.33, 0.30], col1 = co.col1 || [0.33, 0.46, 0.40], base = co.base === undefined ? 60 : co.base, amp = co.amp === undefined ? 1 : co.amp;
    function inArc(k) {
      if (!co.arc) return 1;
      var a = ((k / S * 360 - co.arc[0]) % 360 + 360) % 360, w = ((co.arc[1] - co.arc[0]) % 360 + 360) % 360;
      if (a > w) return 0;
      return smooth(Math.min(a, w - a) / Math.min(18, w / 2));
    }
    function hh(k) {
      var a = k / S * 2 * Math.PI, e = inArc(k);
      var h = base + amp * (110 * Math.pow(0.5 + 0.5 * Math.sin(a * 3 + sd), 2) + 55 * Math.sin(a * 7 + sd * 3) + 30 * Math.sin(a * 13 + sd * 6) + 25 * Math.sin(a * 23));
      if (co.peak) { var m = ((co.arc[0] + co.arc[1]) / 2) * DEG, da = Math.atan2(Math.sin(a - m), Math.cos(a - m)); h += co.peak * Math.exp(-da * da / 0.035); }
      return Math.max(0, h) * e;
    }
    mb = new MeshBuilder();
    for (i = 0; i < S; i++) {
      var h0 = hh(i), h1 = hh(i + 1);
      if (h0 < 1 && h1 < 1) continue;
      var a0 = i / S * 2 * Math.PI, a1 = (i + 1) / S * 2 * Math.PI;
      var p0 = [Math.cos(a0) * R, -2, Math.sin(a0) * R], p1 = [Math.cos(a1) * R, -2, Math.sin(a1) * R];
      mb.v(p0, [0, 1, 0], col0); mb.v(p1, [0, 1, 0], col0); mb.v([p1[0], h1, p1[2]], [0, 1, 0], col1);
      mb.v(p0, [0, 1, 0], col0); mb.v([p1[0], h1, p1[2]], [0, 1, 0], col1); mb.v([p0[0], h0, p0[2]], [0, 1, 0], col1);
    }
    this.mCoast = mb.n ? this.mesh(mb) : null;

    // repères : un maillage par repère, en coordonnées locales
    for (i = 0; i < this.decor.length; i++) this.free(this.decor[i].m);
    this.decor = [];
    function push(m, x, z, bob) { if (m.n) self.decor.push({ m: self.mesh(m), x: x, z: z, bob: !!bob }); }
    var marks = (def && def.marks) || [];
    marks.forEach(function (mk, idx) {
      var b = new MeshBuilder(), sd2 = mk.seed || (idx * 1.37 + 0.6), j, a, r, px, pz;
      if (mk.t === 'island') {
        buildIsland(b, mk.r, mk.h, sd2, mk.kind || 'green');
        for (j = 0; j < (mk.palms || 0); j++) {
          a = hash(sd2 * 11 + j * 3.7) * 6.283; r = mk.r * (0.12 + 0.48 * hash(sd2 * 5 + j * 1.9));
          px = r * Math.cos(a); pz = r * Math.sin(a);
          buildPalm(b, px, islandH(mk.r, mk.h, sd2, mk.kind || 'green', px, pz), pz, 6.5 + 3.5 * hash(sd2 + j * 7.1), hash(sd2 * 2 + j));
        }
        if (mk.lighthouse) buildLighthouse(b, islandH(mk.r, mk.h, sd2, mk.kind || 'green', 0, 0) - 0.4, mk.lighthouse);
        if (mk.tower) buildTower(b, islandH(mk.r, mk.h, sd2, mk.kind || 'green', 0, 0) - 0.4, mk.tower);
        push(b, mk.x, mk.z);
      } else if (mk.t === 'pier') {
        buildPier(b, mk.len, Math.sin(mk.dir * DEG), -Math.cos(mk.dir * DEG)); push(b, mk.x, mk.z);
      } else if (mk.t === 'boat') {
        buildBoat(b, mk.len, Math.sin((mk.dir || 0) * DEG), -Math.cos((mk.dir || 0) * DEG), !!mk.sail, mk.col); push(b, mk.x, mk.z, true);
      } else if (mk.t === 'beacon') {
        buildBeacon(b, mk.col, mk.h); push(b, mk.x, mk.z, true);
      } else if (mk.t === 'reef') {
        // barrière de corail : têtes de roche et écume, le long d'une ligne
        var dx = Math.sin(mk.dir * DEG), dz = -Math.cos(mk.dir * DEG), n = Math.round(mk.len / 14);
        for (j = 0; j <= n; j++) {
          var t = (j / n - 0.5) * mk.len, off = (hash(sd2 + j * 2.3) - 0.5) * 9, rr = 2.2 + 3.2 * hash(sd2 * 3 + j);
          var cx = dx * t - dz * off, cz = dz * t + dx * off;
          b.disc([cx, 0.07, cz], rr * 2.6, [0.93, 0.97, 0.97, 0.85], 9);
          b.tube([cx, -0.8, cz], [cx, 0.25 + 0.5 * hash(sd2 + j), cz], rr, rr * 0.45, [0.36, 0.30, 0.24], 7);
          b.disc([cx, 0.25 + 0.5 * hash(sd2 + j), cz], rr * 0.45, [0.42, 0.35, 0.27], 7);
        }
        push(b, mk.x, mk.z);
      }
    });
  };

  // maillages dépendant du matériel (planche, foil, wing)
  FoilRenderer.prototype.setGear = function (geo) {
    if (this.geoKey === geo.key) return;
    this.geoKey = geo.key;
    this.free(this.mBoard); this.free(this.mFoil); this.free(this.mWing);
    var mb = new MeshBuilder(), B = geo.gear.board, T = geo.T, i, N = 22;
    function rock(xi) { if (xi > 0.3) { var a = (xi - 0.3) / 0.7; return 0.09 * a * a; } if (xi < -0.75) { var b = (-xi - 0.75) / 0.25; return 0.02 * b * b; } return 0; }
    var st = [];
    for (i = 0; i <= N; i++) {
      var xi = -1 + 2 * i / N, x = geo.xTail + (xi + 1) / 2 * B.L;
      var hw = 0.5 * B.W * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(xi), 2.6)), 0.55);
      if (i === 0 || i === N) hw = 0.03;
      st.push({ x: x, hw: hw, yt: rock(xi) * 0.85, yb: -T + rock(xi), xi: xi });
    }
    var deck = [0.93, 0.94, 0.92], pad = [0.16, 0.18, 0.20], bot = [0.98, 0.72, 0.10], rail = [0.99, 0.99, 0.97];
    for (i = 0; i < N; i++) {
      var a = st[i], b = st[i + 1], xm = (a.x + b.x) / 2;
      var dc = (xm > -0.52 && xm < 0.50) ? pad : deck;
      mb.quad([a.x, a.yt, -a.hw * 0.86], [a.x, a.yt, a.hw * 0.86], [b.x, b.yt, b.hw * 0.86], [b.x, b.yt, -b.hw * 0.86], dc);
      mb.quad([a.x, a.yb, a.hw * 0.86], [a.x, a.yb, -a.hw * 0.86], [b.x, b.yb, -b.hw * 0.86], [b.x, b.yb, b.hw * 0.86], bot);
      var ym0 = (a.yt + a.yb) / 2, ym1 = (b.yt + b.yb) / 2;
      [1, -1].forEach(function (sg) {
        mb.quad([a.x, a.yt, sg * a.hw * 0.86], [a.x, ym0, sg * a.hw], [b.x, ym1, sg * b.hw], [b.x, b.yt, sg * b.hw * 0.86], rail);
        mb.quad([a.x, ym0, sg * a.hw], [a.x, a.yb, sg * a.hw * 0.86], [b.x, b.yb, sg * b.hw * 0.86], [b.x, ym1, sg * b.hw], bot);
      });
    }
    this.mBoard = this.mesh(mb);

    // foil
    mb = new MeshBuilder();
    var carbon = [0.10, 0.11, 0.13], carbon2 = [0.20, 0.22, 0.25], ch = geo.gear.mast.chord, yF = geo.yFoil;
    mb.box([geo.xMast - ch / 2, yF, -0.011], [geo.xMast + ch / 2, -T, 0.011], carbon);
    mb.box([geo.xStab - 0.06, yF - 0.016, -0.016], [geo.xWing + 0.12, yF + 0.016, 0.016], carbon);
    function wingMesh(xc, span, c0, sweep, anh, thick, col) {
      var K = 14, prev = null;
      for (var k = 0; k <= K; k++) {
        var z = span * (k / K - 0.5), e = 2 * z / span;
        var cc = Math.max(0.02, c0 * Math.sqrt(Math.max(0, 1 - e * e)));
        var le = xc + 0.30 * c0 - sweep * Math.abs(e), te = le - cc, y = yF - anh * e * e;
        var cur = { z: z, le: le, te: te, y: y };
        if (prev) {
          mb.quad([prev.le, prev.y + thick, prev.z], [cur.le, cur.y + thick, cur.z], [cur.te, cur.y + thick * 0.3, cur.z], [prev.te, prev.y + thick * 0.3, prev.z], col);
          mb.quad([prev.le, prev.y - thick, prev.z], [prev.te, prev.y - thick * 0.3, prev.z], [cur.te, cur.y - thick * 0.3, cur.z], [cur.le, cur.y - thick, cur.z], carbon);
          mb.quad([prev.le, prev.y + thick, prev.z], [prev.le, prev.y - thick, prev.z], [cur.le, cur.y - thick, cur.z], [cur.le, cur.y + thick, cur.z], col);
        }
        prev = cur;
      }
    }
    wingMesh(geo.xWing, geo.wingSpan, geo.wingChord, 0.07, 0.035, 0.011, carbon2);
    wingMesh(geo.xStab, geo.stabSpan, 4 * geo.gear.stab.S / (Math.PI * geo.stabSpan), 0.02, -0.01, 0.006, carbon2);
    this.mFoil = this.mesh(mb);

    // wing (repère local : X vers le bord d'attaque, Y côté extrados, Z envergure ; origine aux poignées)
    mb = new MeshBuilder();
    var bw = geo.wSpan, cR = 1.22 * geo.wS / bw * 1.0, K2 = 12, pts = [];
    var navy = [0.07, 0.12, 0.22], teal = [0.02, 0.66, 0.70], orange = [0.98, 0.50, 0.10], white = [0.96, 0.97, 0.98];
    for (i = 0; i <= K2; i++) {
      var t = -1 + 2 * i / K2, t2 = t * t;
      var le2 = [cR * 0.52 - 0.42 * cR * t2, -0.30 * bw * 0.5 * t2 * 0.9, bw * 0.5 * t];
      var te2 = [-cR * 0.48 * (1 - 0.80 * t2), -0.30 * bw * 0.5 * t2 * 0.9, bw * 0.5 * t * 0.97];
      pts.push({ le: le2, te: te2, r: lerp(0.105, 0.035, Math.abs(t)) });
    }
    for (i = 0; i < K2; i++) {
      var A = pts[i], Bq = pts[i + 1];
      var panel = (i === 2 || i === 9) ? orange : ((i === 5 || i === 6) ? white : teal);
      var midA = add(scl(add(A.le, A.te), 0.5), [0, 0.07, 0]), midB = add(scl(add(Bq.le, Bq.te), 0.5), [0, 0.07, 0]);
      mb.quad(A.le, Bq.le, midB, midA, panel);
      mb.quad(midA, midB, Bq.te, A.te, panel);
      mb.tube(A.le, Bq.le, A.r, Bq.r, navy, 7);
    }
    mb.tube([cR * 0.52, 0, 0], [-cR * 0.48, 0, 0], 0.075, 0.045, navy, 7);
    mb.tube([0.33, -0.10, 0], [0.13, -0.10, 0], 0.016, 0.016, [0.9, 0.9, 0.9], 6);
    mb.tube([-0.20, -0.10, 0], [-0.40, -0.10, 0], 0.016, 0.016, [0.9, 0.9, 0.9], 6);
    this.mWing = this.mesh(mb);
    this.wingChordR = cR;
  };

  FoilRenderer.prototype.resize = function () {
    var c = this.canvas, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(2, Math.floor(c.clientWidth * dpr)), h = Math.max(2, Math.floor(c.clientHeight * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    this.gl.viewport(0, 0, w, h);
    this.aspect = w / h;
  };

  // ---------------- embruns ----------------
  FoilRenderer.prototype.emit = function (p, v, size, life, n, spread) {
    for (var i = 0; i < n; i++) {
      if (this.pt.length >= this.maxPt) this.pt.shift();
      this.pt.push({ x: p[0] + (Math.random() - 0.5) * spread, y: p[1] + Math.random() * 0.05, z: p[2] + (Math.random() - 0.5) * spread,
        vx: v[0] + (Math.random() - 0.5) * 1.6, vy: v[1] + Math.random() * 1.3, vz: v[2] + (Math.random() - 0.5) * 1.6,
        s: size * (0.6 + 0.8 * Math.random()), l: life * (0.6 + 0.8 * Math.random()), t: 0 });
    }
  };
  FoilRenderer.prototype.stepParticles = function (dt, sim) {
    var out = [], p, i, w;
    for (i = 0; i < this.pt.length; i++) {
      p = this.pt[i]; p.t += dt; if (p.t > p.l) continue;
      p.vy -= 9.81 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.vy < 0) { w = sim.eta(p.x, p.z); if (p.y < w) { p.y = w; p.vy = 0; p.vx *= 0.5; p.vz *= 0.5; } }
      out.push(p);
    }
    this.pt = out;
  };

  // ---------------- dessin d'un maillage ----------------
  FoilRenderer.prototype.drawMesh = function (m, model, tint) {
    var gl = this.gl, u = this.pMesh.u;
    gl.bindBuffer(gl.ARRAY_BUFFER, m.b);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 40, 12);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 24);
    gl.uniformMatrix4fv(u.uModel, false, model);
    gl.uniform4fv(u.uTint, tint || [1, 1, 1, 1]);
    gl.drawArrays(gl.TRIANGLES, 0, m.n);
  };
  // membre : cylindre entre a et b
  FoilRenderer.prototype.limb = function (a, b, r, col) {
    var ax = sub(b, a), l = len(ax); if (l < 1e-5) return;
    var d = scl(ax, 1 / l), ref = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    var x = nrm(cross(d, ref)), z = cross(d, x);
    this.drawMesh(this.mCyl, basis(this.m, scl(x, r), ax, scl(z, r), a), col);
  };
  FoilRenderer.prototype.ball = function (c, r, col) {
    this.drawMesh(this.mSph, basis(this.m, [r, 0, 0], [0, r, 0], [0, 0, r], c), col);
  };
  // cinématique inverse à deux segments
  function ik2(a, b, l1, l2, hint) {
    var d = sub(b, a), L = len(d), mx = l1 + l2 - 0.005;
    if (L > mx) { L = mx; }
    var dir = nrm(d);
    var ca = clamp((l1 * l1 + L * L - l2 * l2) / (2 * l1 * Math.max(L, 0.05)), -1, 1), sa = Math.sqrt(1 - ca * ca);
    var perp = nrm(sub(hint, scl(dir, dot(hint, dir))));
    return add(a, add(scl(dir, l1 * ca), scl(perp, l1 * sa)));
  }

  // ---------------- image ----------------
  FoilRenderer.prototype.draw = function (sim, view) {
    var gl = this.gl, tel = sim.tel, geo = sim.geo, dt = view.dt || 0.016, i;
    this.resize();
    this.setGear(geo);

    // orientation de la planche
    var q = sim.q, qw = q[0], qx = q[1], qy = q[2], qz = q[3];
    var F = [1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy + qw * qz), 2 * (qx * qz - qw * qy)];
    var U = [2 * (qx * qy - qw * qz), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz + qw * qx)];
    var Rt = [2 * (qx * qz + qw * qy), 2 * (qy * qz - qw * qx), 1 - 2 * (qx * qx + qy * qy)];
    var psi = tel.heading, phi = tel.roll;
    var sps = Math.sin(psi), cps = Math.cos(psi), sph = Math.sin(phi), cph = Math.cos(phi);
    var NF = [sps, 0, -cps], NU = [cps * sph, cph, sps * sph], NR = [cps * cph, -sph, sps * cph];   // repère sans tangage
    var Ow = tel.O, origin = [Math.round(Ow[0]), 0, Math.round(Ow[2])];
    var O = [Ow[0] - origin[0], Ow[1], Ow[2] - origin[2]];
    var seaY = tel.eta || 0;                               // niveau de l'eau au droit de la planche
    function bp(x, y, z) { return [O[0] + F[0] * x + U[0] * y + Rt[0] * z, O[1] + F[1] * x + U[1] * y + Rt[1] * z, O[2] + F[2] * x + U[2] * y + Rt[2] * z]; }
    function np(x, y, z) { return [O[0] + NF[0] * x + NU[0] * y + NR[0] * z, O[1] + NF[1] * x + NU[1] * y + NR[1] * z, O[2] + NF[2] * x + NU[2] * y + NR[2] * z]; }
    function sea(p) { return sim.eta(p[0] + origin[0], p[2] + origin[2]); }

    // ----- caméra
    var vdir = Math.atan2(sim.v[0], -sim.v[2]);
    var yawT = tel.speed > 1.5 ? psi + clamp(Math.atan2(Math.sin(vdir - psi), Math.cos(vdir - psi)), -0.3, 0.3) * 0.5 : psi;
    if (this.camYaw === null) this.camYaw = yawT;
    var dy = Math.atan2(Math.sin(yawT - this.camYaw), Math.cos(yawT - this.camYaw));
    this.camYaw += dy * (1 - Math.exp(-dt / 0.45));
    var cy = this.camYaw, cf = [Math.sin(cy), 0, -Math.cos(cy)], cr = [Math.cos(cy), 0, Math.sin(cy)];
    this.sigVis += clamp(tel.sigma - this.sigVis, -4 * dt, 4 * dt);
    var eyeT, tgtT, base = [O[0], Math.max(O[1], seaY + 0.1), O[2]];
    if (this.camMode === 1) {          // latérale, côté au vent : on voit bien la hauteur de vol et le rider
      eyeT = add(add(base, scl(cr, -7.5 * this.sigVis)), add(scl(cf, 1.0), [0, 0.9, 0]));
      tgtT = add(base, [0, 0.55, 0]);
    } else if (this.camMode === 2) {   // haute
      eyeT = add(add(base, scl(cf, -13)), [0, 8.5, 0]); tgtT = add(base, add(scl(cf, 6), [0, 0.5, 0]));
    } else if (this.camMode === 3) {   // au ras de l'eau, de face
      eyeT = add(add(base, scl(cf, 8.5)), add(scl(cr, -2.2 * this.sigVis), [0, 0.5 - (base[1] - seaY) * 0.3, 0]));
      tgtT = add(base, [0, 0.7, 0]);
    } else {                           // poursuite
      eyeT = add(add(base, scl(cf, -7.0)), add(scl(cr, -2.0 * this.sigVis), [0, 2.7, 0]));
      tgtT = add(base, add(scl(cf, 2.8), [0, 0.95, 0]));
    }
    // la caméra est mémorisée relativement à l'origine de rendu : recalage quand l'origine change
    var sh = this.lastOrigin ? [this.lastOrigin[0] - origin[0], 0, this.lastOrigin[2] - origin[2]] : [0, 0, 0];
    this.camPos = add(this.camPos, sh); this.camTgt = add(this.camTgt, sh);
    if (view.snap || len(sub(eyeT, this.camPos)) > 40) { this.camPos = eyeT; this.camTgt = tgtT; }
    else {
      var kc = 1 - Math.exp(-dt / 0.14), kt = 1 - Math.exp(-dt / 0.07);
      this.camPos = add(this.camPos, scl(sub(eyeT, this.camPos), kc));
      this.camTgt = add(this.camTgt, scl(sub(tgtT, this.camTgt), kt));
    }
    this.lastOrigin = origin;
    var camSea = sea(this.camPos);
    if (this.camPos[1] < camSea + 0.35) this.camPos[1] = camSea + 0.35;      // jamais sous une vague
    var fov = 55 * DEG;
    if (this.aspect > 2.1) fov = 2 * Math.atan(Math.tan(55 * DEG / 2) * 2.1 / this.aspect) * 1.12;
    perspective(this.proj, fov, this.aspect, 0.25, 14000);
    lookAt(this.view, this.camPos, this.camTgt, [0, 1, 0]);
    mul(this.vp, this.proj, this.view);
    var v0 = new Float32Array(this.view); v0[12] = 0; v0[13] = 0; v0[14] = 0;
    mul(this.vpSky, this.proj, v0);

    gl.clearColor(this.fog[0], this.fog[1], this.fog[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.CULL_FACE);
    var wd = sim.env.windDir, wind2 = [-Math.sin(wd), Math.cos(wd)];

    // ----- ciel
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.disable(gl.BLEND);
    gl.useProgram(this.pSky.p);
    gl.enableVertexAttribArray(0); gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sBuf); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(this.pSky.u.uVP, false, this.vpSky);
    gl.uniform3fv(this.pSky.u.uLight, this.light); gl.uniform3fv(this.pSky.u.uSkyH, this.skyH); gl.uniform3fv(this.pSky.u.uSkyZ, this.skyZ);
    gl.uniform1f(this.pSky.u.uTime, sim.t % 4000); gl.uniform2fv(this.pSky.u.uWind, wind2); gl.uniform1f(this.pSky.u.uCloud, this.cloud);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    // ----- objets opaques
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.depthFunc(gl.LEQUAL);
    gl.useProgram(this.pMesh.p);
    gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2);
    var um = this.pMesh.u, ID = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    gl.uniformMatrix4fv(um.uVP, false, this.vp);
    gl.uniform3fv(um.uLight, this.light); gl.uniform3fv(um.uFog, this.fog); gl.uniform3fv(um.uCam, this.camPos); gl.uniform3fv(um.uDeep, this.deep);
    gl.uniform1f(um.uWaterY, 0);
    // côte (suit le joueur : décor à l'infini)
    gl.uniform1f(um.uFogDist, 9000); gl.uniform1f(um.uUnlit, 1);
    if (this.mCoast) this.drawMesh(this.mCoast, basis(this.m, ID[0], ID[1], ID[2], [O[0], 0, O[2]]));
    gl.uniform1f(um.uFogDist, 3800); gl.uniform1f(um.uUnlit, 0);

    // repères du plan d'eau (îles, phare, jetée, bateaux, balises)
    for (i = 0; i < this.decor.length; i++) {
      var dc = this.decor[i], ddx = dc.x - Ow[0], ddz = dc.z - Ow[2];
      if (ddx * ddx + ddz * ddz > 4200 * 4200) continue;
      var dyb = dc.bob ? sim.eta(dc.x, dc.z) : 0;
      gl.uniform1f(um.uWaterY, dyb);
      this.drawMesh(dc.m, basis(this.m, ID[0], ID[1], ID[2], [dc.x - origin[0], dyb, dc.z - origin[2]]));
    }

    // bouées : champ périodique de repères, drapeau dans le lit du vent
    var G = 140, gx = Math.round(Ow[0] / G), gz = Math.round(Ow[2] / G), bx, bz, ob = sim.obstacles || [], k;
    for (bx = gx - 3; bx <= gx + 3; bx++) for (bz = gz - 3; bz <= gz + 3; bz++) {
      var hsh = Math.abs(Math.sin(bx * 127.1 + bz * 311.7) * 43758.5453) % 1;
      var wxp = bx * G + (hsh - 0.5) * 50, wzp = bz * G + ((hsh * 7.3) % 1 - 0.5) * 50, hidden = false;
      for (k = 0; k < ob.length; k++) { var ox = wxp - ob[k].x, oz = wzp - ob[k].z, orr = (ob[k].rm || ob[k].r) + 6; if (ox * ox + oz * oz < orr * orr) { hidden = true; break; } }
      if (hidden) continue;                                // pas de bouée sur une île
      var bob = sim.eta(wxp, wzp) + 0.04 * Math.sin(sim.t * 1.3 + hsh * 20);
      var pos = [wxp - origin[0], bob, wzp - origin[2]];
      var colB = hsh < 0.33 ? [0.98, 0.45, 0.08, 1] : (hsh < 0.66 ? [0.98, 0.85, 0.10, 1] : [0.92, 0.15, 0.15, 1]);
      gl.uniform1f(um.uWaterY, bob);
      this.drawMesh(this.mBuoy, basis(this.m, ID[0], ID[1], ID[2], pos), colB);
      var fl = 0.12 * Math.sin(sim.t * 9 + hsh * 30);
      var fd = nrm([wind2[0] + fl * wind2[1], 0, wind2[1] - fl * wind2[0]]);
      this.drawMesh(this.mFlag, basis(this.m, fd, [0, 1, 0], cross(fd, [0, 1, 0]), add(pos, [0, 1.70, 0])), [0.95, 0.2, 0.2, 1]);
    }

    // planche + foil
    gl.uniform1f(um.uWaterY, seaY);
    var MB = basis(new Float32Array(16), F, U, Rt, O);
    this.drawMesh(this.mBoard, MB);
    this.drawMesh(this.mFoil, MB);

    // ----- rider
    var crashed = !!sim.crashed, swim = tel.posture === 'swim', kn = tel.kn || 0;
    var st = tel.stance || 1, face = st;                       // regular : face à tribord
    var skin = [0.86, 0.66, 0.52, 1], suit = [0.09, 0.11, 0.16, 1], vest = [0.90, 0.25, 0.12, 1], helm = [0.95, 0.85, 0.15, 1], shoe = [0.05, 0.05, 0.06, 1];
    var lift = tel.lift || [0, 1, 0], app = tel.app || [0, 0, 1];
    var wingC, Xw, Yw, Zw, al = tel.wingAlpha || 0, self = this;
    var cxv = clamp(sim.cx, -0.45, 0.3) * 0.75, czv = clamp(sim.cz, -0.6, 0.6) * 0.62;

    // tronc, tête, bras et wing à partir des hanches ; acrossBoard : épaules en travers (à genoux, on regarde devant)
    function upperBody(hips, tors, acrossBoard) {
      var neck = mad(hips, tors, 0.56), head = mad(hips, tors, 0.72);
      var side = nrm(cross(tors, NF)), fw = cross(side, tors);
      self.drawMesh(self.mSph, basis(self.m, scl(fw, 0.20), scl(tors, 0.33), scl(side, 0.135), mad(hips, tors, 0.27)), vest);
      self.ball(hips, 0.135, suit);
      self.limb(neck, head, 0.055, skin);
      self.ball(head, 0.115, helm);
      // wing : dans la direction de la traction, au bout des bras
      var dirT = nrm([lift[0] + 0.22 * app[0], lift[1] + 0.22 * app[1], lift[2] + 0.22 * app[2]]);
      self.dirW = nrm(add(self.dirW, scl(sub(dirT, self.dirW), 1 - Math.exp(-dt / 0.10))));
      var shC = mad(hips, tors, 0.47);
      wingC = mad(shC, self.dirW, 0.66);
      Xw = nrm([-Math.cos(al) * app[0] + Math.sin(al) * lift[0], -Math.cos(al) * app[1] + Math.sin(al) * lift[1], -Math.cos(al) * app[2] + Math.sin(al) * lift[2]]);
      Yw = nrm([Math.cos(al) * lift[0] + Math.sin(al) * app[0], Math.cos(al) * lift[1] + Math.sin(al) * app[1], Math.cos(al) * lift[2] + Math.sin(al) * app[2]]);
      Zw = nrm(cross(Xw, Yw)); Yw = cross(Zw, Xw);
      var hF = add(wingC, add(scl(Xw, 0.23), scl(Yw, -0.10))), hB = add(wingC, add(scl(Xw, -0.30), scl(Yw, -0.10)));
      var ax = acrossBoard ? NR : NF, shA = mad(shC, ax, 0.19), shB = mad(shC, ax, -0.19), hA, hBk;
      if (acrossBoard) {                                       // chaque main prend la poignée la plus proche
        var d1 = len(sub(shA, hF)) + len(sub(shB, hB)), d2 = len(sub(shA, hB)) + len(sub(shB, hF));
        hA = d1 <= d2 ? hF : hB; hBk = d1 <= d2 ? hB : hF;
      } else {                                                 // l'épaule avant est celle du côté du nez
        var frontIsX = dot(Xw, NF) >= 0; hA = frontIsX ? hF : hB; hBk = frontIsX ? hB : hF;
      }
      var eh = add(scl(NU, -0.7), scl(self.dirW, -0.2));
      var eA = ik2(shA, hA, 0.31, 0.30, eh), eB = ik2(shB, hBk, 0.31, 0.30, eh);
      self.limb(shA, eA, 0.055, suit); self.limb(eA, hA, 0.045, suit); self.ball(hA, 0.05, skin);
      self.limb(shB, eB, 0.055, suit); self.limb(eB, hBk, 0.045, suit); self.ball(hBk, 0.05, skin);
      self.ball(shA, 0.07, vest); self.ball(shB, 0.07, vest);
    }

    if (crashed || swim) {
      // dans l'eau à côté de la planche (au vent), wing posée sur l'eau sous le vent ; en remontant, on se hisse sur le pont
      var pm = (swim && tel.mountT > 0) ? smooth(1 - tel.mountT / 1.6) : 0;
      var wob = 0.03 * Math.sin(sim.t * 2.4), ws = -(tel.sigma || 1);
      var hw0 = [O[0] + NR[0] * 0.95 * ws - NF[0] * 0.1, 0, O[2] + NR[2] * 0.95 * ws - NF[2] * 0.1];
      hw0[1] = sea(hw0) + wob + 0.02;
      var hp = lerp3(hw0, np(-0.12, 0.62, 0), pm);
      hp[1] += 0.25 * Math.sin(pm * Math.PI);
      this.ball(hp, 0.115, helm);
      this.drawMesh(this.mSph, basis(this.m, [0.19, 0, 0], [0, 0.20 + 0.12 * pm, 0], [0, 0, 0.17], add(hp, [0, -0.18 - 0.14 * pm, 0])), vest);
      if (pm > 0.05) {                                         // les bras agrippent la planche
        var sA = add(hp, [0, -0.16, 0]);
        this.limb(sA, bp(0.22, 0.04, 0.12 * ws), 0.05, suit); this.limb(sA, bp(-0.25, 0.04, 0.12 * ws), 0.05, suit);
      }
      var wc0 = [O[0] + wind2[0] * 2.6 + NF[0] * 0.3, 0, O[2] + wind2[1] * 2.6 + NF[2] * 0.3];
      wingC = [wc0[0], sea(wc0) + 0.16 + wob, wc0[2]];
      Xw = [-wind2[0], 0, -wind2[1]]; Yw = [0, 1, 0]; Zw = cross(Xw, Yw);
    } else if (kn > 0.5) {
      // à genoux : genoux et tibias sur le pont, buste droit, face à la route
      var upK = (1 - kn) * 2;                                  // 0 = à genoux, 1 = à mi-chemin en se levant
      var hipsK = np(-0.14 + cxv * 0.4, 0.34 + 0.27 * upK, czv * 0.45);
      var torsK = nrm([NU[0] + NF[0] * (0.16 + cxv * 0.25) + NR[0] * czv * 0.5, NU[1], NU[2] + NF[2] * (0.16 + cxv * 0.25) + NR[2] * czv * 0.5]);
      [-1, 1].forEach(function (sg) {
        var hipS = mad(hipsK, NR, sg * 0.11), knee = bp(0.16, 0.06, sg * 0.14), foot = bp(-0.44, 0.05, sg * 0.14);
        self.limb(hipS, knee, 0.085, suit); self.limb(knee, foot, 0.065, suit); self.ball(knee, 0.078, suit);
        self.drawMesh(self.mBox, basis(self.m, scl(F, 0.24), scl(U, 0.07), scl(Rt, 0.10), mad(foot, F, -0.06)), shoe);
      });
      upperBody(hipsK, torsK, true);
    } else {
      // debout
      var legs = sim.s;
      var hipH = (0.50 + (legs - geo.sMin) * 1.35) * (1 - 0.56 * kn);
      var hips = np(cxv, hipH, czv - face * 0.02);
      var tors = nrm([NU[0] + NF[0] * cxv * 0.35 + NR[0] * czv * 0.55, NU[1], NU[2] + NF[2] * cxv * 0.35 + NR[2] * czv * 0.55]);
      var fb = bp(-geo.xFoot, 0.03, -face * 0.03), ff = bp(geo.xFoot, 0.03, face * 0.02);
      var hipB = mad(hips, NF, -0.11), hipF = mad(hips, NF, 0.11);
      var kneeHintB = add(scl(NR, face * 0.8), scl(NF, -0.5)), kneeHintF = add(scl(NR, face * 0.6), scl(NF, 0.8));
      var kB = ik2(hipB, fb, 0.47, 0.47, kneeHintB), kF = ik2(hipF, ff, 0.47, 0.47, kneeHintF);
      this.limb(hipB, kB, 0.085, suit); this.limb(kB, fb, 0.065, suit);
      this.limb(hipF, kF, 0.085, suit); this.limb(kF, ff, 0.065, suit);
      this.ball(kB, 0.075, suit); this.ball(kF, 0.075, suit);
      this.drawMesh(this.mBox, basis(this.m, scl(F, 0.27), scl(U, 0.07), scl(Rt, 0.11), mad(fb, F, 0.02)), shoe);
      this.drawMesh(this.mBox, basis(this.m, scl(F, 0.27), scl(U, 0.07), scl(Rt, 0.11), mad(ff, F, 0.04)), shoe);
      upperBody(hips, tors, false);
    }
    this.drawMesh(this.mWing, basis(this.m, Xw, Yw, Zw, wingC));

    // ----- eau
    var wv = sim.wv || [], wk = this.wk, TWO_PI = 2 * Math.PI, nS = 0, nC = 3, swA = 0, slot;
    for (i = 0; i < NWAVE * 4; i++) wk[i] = 0;
    for (i = 0; i < wv.length; i++) {
      var w = wv[i];
      if (w.swell) { if (nS >= 3) continue; slot = nS++; swA += w.a; } else { if (nC >= NWAVE) continue; slot = nC++; }
      var ph0 = (w.kx * origin[0] + w.kz * origin[2] - w.om * sim.t + w.ph) % TWO_PI;
      wk[slot * 4] = w.kx; wk[slot * 4 + 1] = w.kz; wk[slot * 4 + 2] = ph0; wk[slot * 4 + 3] = w.a;
    }
    gl.useProgram(this.pWater.p);
    gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.wBuf); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    var uw = this.pWater.u;
    gl.uniformMatrix4fv(uw.uVP, false, this.vp);
    gl.uniform2f(uw.uOrigin, origin[0], origin[2]);
    gl.uniform4fv(uw.uWk, wk); gl.uniform1f(uw.uSwA, swA);
    gl.uniform1f(uw.uFoam, swA > 0.05 ? clamp((sim.env.windSpeed - 6.5) / 5, 0, 1) : 0);
    gl.uniform1f(uw.uTime, sim.t); gl.uniform1f(uw.uLin, 160); gl.uniform1f(uw.uRange, 5800);
    gl.uniform3fv(uw.uCam, this.camPos); gl.uniform3fv(uw.uLight, this.light);
    gl.uniform2fv(uw.uWind, wind2); gl.uniform1f(uw.uW0, sim.env.windSpeed); gl.uniform1f(uw.uGust, sim.env.gust);
    gl.uniform3fv(uw.uSkyH, this.skyH); gl.uniform3fv(uw.uSkyZ, this.skyZ); gl.uniform3fv(uw.uDeep, this.deep); gl.uniform3fv(uw.uFog, this.fog);
    var L = this.light, hb = Math.max(0, O[1] - seaY);
    gl.uniform4f(uw.uShA, O[0] - L[0] * hb / L[1], O[2] - L[2] * hb / L[1], 1.25, 0.34 / (1 + hb * 0.5));
    var hwY = Math.max(0, wingC[1] - seaY);
    gl.uniform4f(uw.uShB, wingC[0] - L[0] * hwY / L[1], wingC[2] - L[2] * hwY / L[1], 1.9, 0.20 / (1 + hwY * 0.25));
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    gl.drawArrays(gl.TRIANGLES, 0, this.wN);

    // ----- embruns
    this.stepParticles(dt, sim);
    var n = this.pt.length;
    if (n > 0) {
      var d = this.ptData, p;
      for (i = 0; i < n; i++) {
        p = this.pt[i];
        d[i * 5] = p.x - origin[0]; d[i * 5 + 1] = p.y; d[i * 5 + 2] = p.z - origin[2]; d[i * 5 + 3] = p.s;
        d[i * 5 + 4] = 0.75 * (1 - p.t / p.l);
      }
      gl.useProgram(this.pPt.p);
      gl.enableVertexAttribArray(1);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.ptBuf); gl.bufferData(gl.ARRAY_BUFFER, d.subarray(0, n * 5), gl.DYNAMIC_DRAW);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 20, 0); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 16);
      gl.uniformMatrix4fv(this.pPt.u.uVP, false, this.vp);
      gl.uniform1f(this.pPt.u.uScale, this.canvas.height * 0.9);
      gl.drawArrays(gl.POINTS, 0, n);
    }
    gl.depthMask(true); gl.disable(gl.BLEND);
  };

  root.FoilRenderer = FoilRenderer;
})(typeof self !== 'undefined' ? self : this);
