/*
 * FoilHUD — instruments en surimpression (canvas 2D)
 * Vitesse, hauteur de vol sur le mât, appuis des pieds, gîte, wing (bordé, traction),
 * rose des vents (vent réel / apparent, allure), posture (dans l'eau, à genoux, debout), conseils du coach, messages.
 */
(function (root) {
  'use strict';
  var DEG = Math.PI / 180, KN = 0.514444;
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function fr(x, d) { return x.toFixed(d === undefined ? 1 : d).replace('.', ','); }
  function mmss(t) { t = Math.max(0, Math.floor(t)); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s; }

  var COL = {
    panel: 'rgba(8,20,32,0.58)', line: 'rgba(255,255,255,0.22)', txt: '#f4f8fb', dim: 'rgba(230,240,248,0.72)',
    good: '#4fd68a', warn: '#ffc14d', bad: '#ff5d5d', blue: '#55b7ff', teal: '#27c9c9', water: 'rgba(40,150,210,0.55)'
  };

  function FoilHUD(canvas) {
    this.c = canvas; this.g = canvas.getContext('2d');
    this.toasts = []; this.coachText = ''; this.coachShown = ''; this.coachA = 0;
    this.s = 1; this.w = 1; this.h = 1;
  }

  FoilHUD.prototype.resize = function () {
    var c = this.c, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(2, Math.floor(c.clientWidth * dpr)), h = Math.max(2, Math.floor(c.clientHeight * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    this.w = w; this.h = h;
    this.s = clamp(Math.min(w / 1280, h / 720), 0.55, 2.6);
  };

  FoilHUD.prototype.toast = function (text, kind, dur) {
    this.toasts.push({ text: text, kind: kind || 'info', t: 0, dur: dur || 2.8 });
    if (this.toasts.length > 4) this.toasts.shift();
  };
  FoilHUD.prototype.setCoach = function (text) { this.coachText = text || ''; };

  FoilHUD.prototype.rr = function (x, y, w, h, r) {
    var g = this.g; g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  };
  FoilHUD.prototype.panel = function (x, y, w, h) {
    var g = this.g; this.rr(x, y, w, h, 10 * this.s); g.fillStyle = COL.panel; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 1 * this.s; g.stroke();
  };
  FoilHUD.prototype.text = function (t, x, y, size, color, align, weight) {
    var g = this.g;
    g.font = (weight || '600') + ' ' + Math.round(size * this.s) + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    g.textAlign = align || 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = color || COL.txt; g.fillText(t, x, y);
  };

  FoilHUD.prototype.draw = function (sim, G, dt) {
    this.resize();
    var g = this.g, s = this.s, W = this.w, H = this.h, tel = sim.tel, geo = sim.geo, m = 16 * s, i;
    g.clearRect(0, 0, W, H);
    if (G.state === 'menu') return;
    var flying = tel.flying, crashed = !!tel.crashed;

    // ---------- vitesse (haut gauche)
    var pw = 236 * s, ph = 118 * s;
    this.panel(m, m, pw, ph);
    this.text(fr(tel.speedKn || 0), m + 16 * s, m + 62 * s, 58, COL.txt, 'left', '700');
    var wNum = g.measureText(fr(tel.speedKn || 0)).width;
    this.text('nœuds', m + 22 * s + wNum, m + 62 * s, 17, COL.dim);
    this.text(fr((tel.speedKn || 0) * 1.852, 0) + ' km/h', m + 22 * s + wNum, m + 38 * s, 13, COL.dim, 'left', '500');
    var swim = tel.posture === 'swim', kneel = tel.posture === 'kneel';
    var chip = crashed ? 'À L\'EAU' : (swim ? 'DANS L\'EAU' : (flying ? 'EN VOL  ' + mmss(G.stats.flight) : (kneel ? 'À GENOUX' : 'DEBOUT · SUR L\'EAU')));
    var chipCol = (crashed || swim) ? COL.bad : (flying ? COL.good : (kneel ? COL.warn : COL.blue));
    this.rr(m + 14 * s, m + 76 * s, pw - 28 * s, 28 * s, 14 * s); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fill();
    g.beginPath(); g.arc(m + 30 * s, m + 90 * s, 5 * s, 0, 7); g.fillStyle = chipCol; g.fill();
    this.text(chip, m + 44 * s, m + 95.5 * s, 14, COL.txt, 'left', '700');

    // statistiques de session
    this.text('Meilleur vol ' + mmss(G.stats.bestFlight) + '   ·   V max ' + fr(G.stats.vmax) + ' kn   ·   Virements ' + G.stats.tacks +
              (G.stats.jibes ? '   ·   Empannages ' + G.stats.jibes : ''), m + 4 * s, m + ph + 22 * s, 12.5, COL.dim, 'left', '500');
    if (G.place) this.text(G.place, m + 4 * s, m + ph + 40 * s, 12.5, COL.dim, 'left', '600');

    // ---------- hauteur de vol sur le mât (gauche)
    var gx = m, gy = m + ph + 54 * s, gw = 118 * s, gh = 244 * s;
    this.panel(gx, gy, gw, gh);
    this.text('HAUTEUR', gx + 12 * s, gy + 22 * s, 11.5, COL.dim, 'left', '700');
    var mx = gx + 40 * s, top = gy + 50 * s, bot = gy + gh - 34 * s, ml = bot - top;
    var f = clamp(tel.rideFrac || 0, -0.12, 1.08);                 // 0 = planche sur l'eau, 1 = foil en surface
    var wy = top + f * ml;                                         // ligne d'eau le long du mât
    g.save(); this.rr(gx + 8 * s, top - 14 * s, gw - 16 * s, ml + 40 * s, 6 * s); g.clip();
    g.fillStyle = COL.water; g.fillRect(gx + 8 * s, wy, gw - 16 * s, bot + 40 * s - wy);
    g.restore();
    // zones : trop bas, bien, trop haut
    var zx = mx + 22 * s;
    g.lineWidth = 5 * s; g.lineCap = 'round';
    g.strokeStyle = COL.warn; g.beginPath(); g.moveTo(zx, top); g.lineTo(zx, top + 0.15 * ml); g.stroke();
    g.strokeStyle = COL.good; g.beginPath(); g.moveTo(zx, top + 0.19 * ml); g.lineTo(zx, top + 0.78 * ml); g.stroke();
    g.strokeStyle = COL.bad; g.beginPath(); g.moveTo(zx, top + 0.82 * ml); g.lineTo(zx, bot); g.stroke();
    // planche, mât, foil
    g.fillStyle = '#f2f2ee'; this.rr(mx - 26 * s, top - 9 * s, 52 * s, 9 * s, 4 * s); g.fill();
    g.fillStyle = '#20242b'; g.fillRect(mx - 2.5 * s, top, 5 * s, ml);
    this.rr(mx - 20 * s, bot - 3 * s, 34 * s, 6 * s, 3 * s); g.fill();
    this.rr(mx - 9 * s, bot - 2 * s, 30 * s, 4 * s, 2 * s); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(gx + 10 * s, wy); g.lineTo(gx + gw - 10 * s, wy); g.stroke();
    var hcm = Math.round((tel.boardH || 0) * 100);
    var hcol = (!flying) ? COL.dim : (f > 0.82 ? COL.bad : (f < 0.15 ? COL.warn : COL.good));
    this.text(flying ? hcm + ' cm' : (swim ? 'planche vide' : 'sur l\'eau'), gx + gw / 2, gy + gh - 10 * s, 15, hcol, 'center', '700');
    if (tel.breach > 0 && flying) this.text('FOIL EN SURFACE', gx + gw / 2, gy + 38 * s, 10.5, COL.bad, 'center', '800');
    else if (tel.stall > 0.4 && flying) this.text('DÉCROCHAGE', gx + gw / 2, gy + 38 * s, 10.5, COL.warn, 'center', '800');

    // ---------- appuis (bas gauche)
    var ax = m, aw = 330 * s, ah = 132 * s, ay = H - m - ah;
    this.panel(ax, ay, aw, ah);
    this.text('APPUIS', ax + 14 * s, ay + 22 * s, 11.5, COL.dim, 'left', '700');
    // pied arrière ↔ pied avant
    var bx = ax + 62 * s, bw = aw - 124 * s, by = ay + 46 * s;
    this.text('pied AR', bx - 8 * s, by + 5 * s, 12, COL.dim, 'right', '600');
    this.text('pied AV', bx + bw + 8 * s, by + 5 * s, 12, COL.dim, 'left', '600');
    g.lineWidth = 8 * s; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,0.16)';
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + bw, by); g.stroke();
    var ffp = clamp(tel.frontFoot === undefined ? 0.5 : tel.frontFoot, 0, 1), sat = ffp < 0.03 || ffp > 0.97;
    g.strokeStyle = sat ? COL.bad : COL.teal; g.beginPath(); g.moveTo(bx + bw * 0.5, by); g.lineTo(bx + bw * ffp, by); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(bx + bw * ffp, by, 7 * s, 0, 7); g.fill();
    // consigne du joueur
    var lc = clamp(0.5 + 0.5 * (G.ctl.lean || 0), 0, 1);
    g.fillStyle = COL.warn; g.beginPath(); g.moveTo(bx + bw * lc, by + 11 * s); g.lineTo(bx + bw * lc - 5 * s, by + 19 * s); g.lineTo(bx + bw * lc + 5 * s, by + 19 * s); g.closePath(); g.fill();
    this.text(Math.round(ffp * 100) + ' % avant', bx + bw / 2, by - 12 * s, 12, COL.txt, 'center', '600');
    // gîte : coupe de la planche vue de l'arrière
    var cx0 = ax + 80 * s, cy0 = ay + 98 * s, roll = tel.roll || 0;
    g.save(); g.translate(cx0, cy0);
    g.strokeStyle = COL.water; g.lineWidth = 2 * s; g.beginPath(); g.moveTo(-52 * s, 12 * s); g.lineTo(52 * s, 12 * s); g.stroke();
    g.rotate(roll);
    g.fillStyle = '#f2f2ee'; this.rr(-30 * s, -5 * s, 60 * s, 8 * s, 4 * s); g.fill();
    g.fillStyle = '#20242b'; g.fillRect(-1.5 * s, 3 * s, 3 * s, 20 * s); g.fillRect(-18 * s, 22 * s, 36 * s, 3 * s);
    // corps du rider (inclinaison)
    var lean = clamp((tel.cz || 0) * 1.6, -1, 1);
    g.strokeStyle = COL.warn; g.lineWidth = 4 * s; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, -6 * s); g.lineTo(lean * 22 * s, -34 * s); g.stroke();
    g.fillStyle = COL.warn; g.beginPath(); g.arc(lean * 24 * s, -39 * s, 5 * s, 0, 7); g.fill();
    g.restore();
    var windward = (roll * (tel.sigma || 1)) < 0;
    this.text('gîte ' + Math.round(Math.abs(roll) / DEG) + '°' + (Math.abs(roll) > 3 * DEG ? (windward ? ' au vent' : ' sous le vent') : ''), ax + 150 * s, ay + 92 * s, 13, COL.txt, 'left', '600');
    this.text((tel.heelside ? 'heelside (talons au vent)' : 'toeside (orteils au vent)'), ax + 150 * s, ay + 110 * s, 12, tel.heelside ? COL.dim : COL.warn, 'left', '600');
    if ((tel.unstable || 0) > 0.3 && !flying) {
      if (Math.sin(sim.t * 9) > -0.3) this.text('ÉQUILIBRE PRÉCAIRE', ax + 150 * s, ay + 126 * s, 12, COL.bad, 'left', '800');
    } else if (kneel) this.text(tel.knT === 0 ? 'tu te lèves…' : 'à genoux : planche stable', ax + 150 * s, ay + 126 * s, 12, COL.warn, 'left', '700');
    else if (tel.feetT > 0) this.text('changement de pieds…', ax + 150 * s, ay + 126 * s, 12, COL.warn, 'left', '700');
    else this.text((tel.stance > 0 ? 'regular' : 'goofy') + ' · tangage ' + fr((tel.pitch || 0) / DEG) + '°', ax + 150 * s, ay + 126 * s, 11.5, COL.dim, 'left', '500');

    // ---------- wing (bas droite)
    var ww = 330 * s, wh = 132 * s, wx = W - m - ww, wy2 = H - m - wh;
    this.panel(wx, wy2, ww, wh);
    this.text('WING', wx + 14 * s, wy2 + 22 * s, 11.5, COL.dim, 'left', '700');
    this.text((tel.sigma > 0 ? 'à tribord' : 'à bâbord') + (tel.flipT > 0 ? ' · changement de mains…' : ''), wx + ww - 14 * s, wy2 + 22 * s, 12, tel.flipT > 0 ? COL.warn : COL.dim, 'right', '600');
    // bordé
    var sx = wx + 70 * s, sw = ww - 94 * s, sy = wy2 + 48 * s;
    this.text('bordé', sx - 8 * s, sy + 5 * s, 12, COL.dim, 'right', '600');
    g.lineWidth = 10 * s; g.lineCap = 'butt';
    g.strokeStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + sw, sy); g.stroke();
    g.strokeStyle = 'rgba(79,214,138,0.35)'; g.beginPath(); g.moveTo(sx + sw * 0.55, sy); g.lineTo(sx + sw * 0.86, sy); g.stroke();
    g.strokeStyle = 'rgba(255,93,93,0.45)'; g.beginPath(); g.moveTo(sx + sw * 0.90, sy); g.lineTo(sx + sw, sy); g.stroke();
    var sh = clamp(tel.sheet || 0, 0, 1);
    g.strokeStyle = (tel.wingStall > 0.4) ? COL.bad : '#ffffff'; g.lineWidth = 5 * s;
    g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + sw * sh, sy); g.stroke();
    var cmd = clamp(G.ctl.sheet || 0, 0, 1);
    g.fillStyle = COL.warn; g.beginPath(); g.moveTo(sx + sw * cmd, sy + 8 * s); g.lineTo(sx + sw * cmd - 5 * s, sy + 16 * s); g.lineTo(sx + sw * cmd + 5 * s, sy + 16 * s); g.closePath(); g.fill();
    if (tel.wingStall > 0.4 && sh > 0.5) this.text('sur-bordé', sx + sw, sy - 9 * s, 11, COL.bad, 'right', '800');
    // traction
    var ty = wy2 + 82 * s, frc = clamp((tel.wingForce || 0) / (tel.Fhold || 380), 0, 1.05);
    this.text('traction', sx - 8 * s, ty + 5 * s, 12, COL.dim, 'right', '600');
    g.lineWidth = 10 * s; g.strokeStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.moveTo(sx, ty); g.lineTo(sx + sw, ty); g.stroke();
    g.strokeStyle = tel.overpower ? COL.bad : (frc > 0.8 ? COL.warn : COL.teal); g.beginPath(); g.moveTo(sx, ty); g.lineTo(sx + sw * Math.min(frc, 1), ty); g.stroke();
    this.text(Math.round((tel.wingForce || 0) / 9.81) + ' kg', sx + sw, ty - 9 * s, 11, tel.overpower ? COL.bad : COL.dim, 'right', '700');
    // position de la wing : élévation et avant/arrière
    var ex = wx + 34 * s, ey = wy2 + 116 * s;
    g.strokeStyle = COL.line; g.lineWidth = 2 * s; g.beginPath(); g.arc(ex, ey, 20 * s, Math.PI, 1.5 * Math.PI); g.stroke();
    var ea = tel.eps || 0.78; g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - 20 * s * Math.cos(ea), ey - 20 * s * Math.sin(ea), 4.5 * s, 0, 7); g.fill();
    this.text('hauteur ' + Math.round(ea / DEG) + '°', ex + 12 * s, ey + 2 * s, 11.5, COL.dim, 'left', '600');
    var fx = wx + 200 * s, fa = clamp((tel.fa || 0) / 0.55, -1, 1);
    g.strokeStyle = COL.line; g.beginPath(); g.moveTo(fx, ey - 4 * s); g.lineTo(fx + 84 * s, ey - 4 * s); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(fx + 42 * s + fa * 42 * s, ey - 4 * s, 4.5 * s, 0, 7); g.fill();
    this.text('queue', fx - 6 * s, ey, 10.5, COL.dim, 'right', '600'); this.text('nez', fx + 90 * s, ey, 10.5, COL.dim, 'left', '600');

    // ---------- rose des vents (haut droite)
    var R = 78 * s, rcx = W - m - R - 14 * s, rcy = m + R + 14 * s;
    this.panel(W - m - 2 * R - 28 * s, m, 2 * R + 28 * s, 2 * R + 84 * s);
    g.strokeStyle = COL.line; g.lineWidth = 1.5 * s; g.beginPath(); g.arc(rcx, rcy, R, 0, 7); g.stroke();
    for (i = 0; i < 12; i++) { var a = i * 30 * DEG; g.beginPath(); g.moveTo(rcx + Math.sin(a) * R, rcy - Math.cos(a) * R); g.lineTo(rcx + Math.sin(a) * (R - 6 * s), rcy - Math.cos(a) * (R - 6 * s)); g.stroke(); }
    var twa = tel.twa || 0;                                         // d'où vient le vent réel, relatif au nez (+ tribord)
    // secteur face au vent (on n'y avance pas)
    g.fillStyle = 'rgba(255,93,93,0.20)'; g.beginPath(); g.moveTo(rcx, rcy);
    g.arc(rcx, rcy, R, twa - 42 * DEG - Math.PI / 2, twa + 42 * DEG - Math.PI / 2); g.closePath(); g.fill();
    // planche au centre
    g.fillStyle = '#f2f2ee'; g.beginPath(); g.moveTo(rcx, rcy - 26 * s); g.quadraticCurveTo(rcx + 11 * s, rcy - 4 * s, rcx + 8 * s, rcy + 22 * s);
    g.lineTo(rcx - 8 * s, rcy + 22 * s); g.quadraticCurveTo(rcx - 11 * s, rcy - 4 * s, rcx, rcy - 26 * s); g.fill();
    function arrow(ang, r0, r1, col, lw) {
      var sx0 = rcx + Math.sin(ang) * r0, sy0 = rcy - Math.cos(ang) * r0, ex0 = rcx + Math.sin(ang) * r1, ey0 = rcy - Math.cos(ang) * r1;
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = lw; g.lineCap = 'round';
      g.beginPath(); g.moveTo(sx0, sy0); g.lineTo(ex0, ey0); g.stroke();
      var d = Math.atan2(ey0 - sy0, ex0 - sx0), hl = 9 * s;
      g.beginPath(); g.moveTo(ex0, ey0); g.lineTo(ex0 - hl * Math.cos(d - 0.45), ey0 - hl * Math.sin(d - 0.45)); g.lineTo(ex0 - hl * Math.cos(d + 0.45), ey0 - hl * Math.sin(d + 0.45)); g.closePath(); g.fill();
    }
    arrow(twa, R - 2 * s, R * 0.42, COL.blue, 4.5 * s);             // vent réel : souffle du bord vers le centre
    if ((tel.aws || 0) > 0.5) arrow(tel.awa || 0, R - 2 * s, R * 0.56, 'rgba(255,255,255,0.9)', 2.5 * s);
    var at = Math.abs(twa) / DEG, allure = at < 35 ? 'Face au vent' : (at < 65 ? 'Près' : (at < 105 ? 'Travers' : (at < 150 ? 'Largue' : 'Vent arrière')));
    this.text(allure + ' · ' + Math.round(at) + '°', rcx, rcy + R + 24 * s, 15, at < 35 ? COL.bad : COL.txt, 'center', '700');
    this.text((twa > 0 ? 'tribord amures' : 'bâbord amures'), rcx, rcy + R + 41 * s, 11.5, COL.dim, 'center', '500');
    g.fillStyle = COL.blue; g.fillRect(rcx - R, rcy + R + 53 * s, 10 * s, 3 * s);
    this.text('réel ' + fr((tel.tws || 0) / KN, 0) + ' kn', rcx - R + 14 * s, rcy + R + 58 * s, 11.5, COL.txt, 'left', '600');
    g.fillStyle = '#fff'; g.fillRect(rcx + 4 * s, rcy + R + 53 * s, 10 * s, 3 * s);
    this.text('apparent ' + fr((tel.aws || 0) / KN, 0), rcx + 18 * s, rcy + R + 58 * s, 11.5, COL.txt, 'left', '600');

    // ---------- coach (haut centre)
    if (this.coachText !== this.coachShown) { this.coachA -= dt * 5; if (this.coachA <= 0) { this.coachShown = this.coachText; this.coachA = 0; } }
    else if (this.coachShown) this.coachA = Math.min(1, this.coachA + dt * 4);
    if (this.coachShown && this.coachA > 0.01 && !crashed) {
      g.globalAlpha = this.coachA;
      g.font = '600 ' + Math.round(17 * s) + 'px system-ui, sans-serif';
      var tw = g.measureText(this.coachShown).width + 44 * s, cxp = W / 2 - tw / 2, cyp = m + 6 * s;
      this.rr(cxp, cyp, tw, 40 * s, 20 * s); g.fillStyle = 'rgba(8,20,32,0.72)'; g.fill();
      g.strokeStyle = 'rgba(255,193,77,0.55)'; g.lineWidth = 1.5 * s; g.stroke();
      this.text(this.coachShown, W / 2, cyp + 26 * s, 17, '#ffe7b0', 'center', '600');
      g.globalAlpha = 1;
    }

    // ---------- messages
    var ty0 = H * 0.30;
    for (i = this.toasts.length - 1; i >= 0; i--) {
      var t = this.toasts[i]; t.t += dt;
      if (t.t > t.dur) { this.toasts.splice(i, 1); continue; }
    }
    for (i = 0; i < this.toasts.length; i++) {
      var to = this.toasts[i], al = Math.min(1, to.t * 6) * Math.min(1, (to.dur - to.t) * 2.5);
      g.globalAlpha = al;
      var col = to.kind === 'good' ? COL.good : (to.kind === 'bad' ? COL.bad : (to.kind === 'warn' ? COL.warn : '#ffffff'));
      g.font = '800 ' + Math.round(26 * s) + 'px system-ui, sans-serif';
      var tw2 = g.measureText(to.text).width + 48 * s;
      this.rr(W / 2 - tw2 / 2, ty0 + i * 52 * s - 30 * s, tw2, 44 * s, 22 * s); g.fillStyle = 'rgba(8,20,32,0.66)'; g.fill();
      this.text(to.text, W / 2, ty0 + i * 52 * s, 26, col, 'center', '800');
      g.globalAlpha = 1;
    }

    // ---------- chute
    if (crashed) {
      this.text('À l\'eau !', W / 2, H * 0.44, 54, '#fff', 'center', '800');
      this.text(G.crashText || '', W / 2, H * 0.44 + 34 * s, 20, '#ffd9d9', 'center', '600');
      this.text(G.fullStart ? 'Tu refais surface…' : 'Retour sur la planche…', W / 2, H * 0.44 + 62 * s, 15, COL.dim, 'center', '500');
    } else if (swim && G.state === 'play') {
      var up = (tel.mountT || 0) > 0, key = G.device === 'gamepad' ? 'A' : 'Entrée';
      this.text(up ? 'Tu remontes sur la planche…' : 'Dans l\'eau', W / 2, H * 0.44, up ? 30 : 44, '#fff', 'center', '800');
      if (!up) {
        g.font = '700 ' + Math.round(19 * s) + 'px system-ui, sans-serif';
        var pt = key + ' : remonter sur la planche', pw2 = g.measureText(pt).width + 44 * s;
        this.rr(W / 2 - pw2 / 2, H * 0.44 + 16 * s, pw2, 40 * s, 20 * s); g.fillStyle = 'rgba(8,20,32,0.72)'; g.fill();
        g.strokeStyle = 'rgba(255,193,77,0.75)'; g.lineWidth = 1.5 * s; g.stroke();
        this.text(pt, W / 2, H * 0.44 + 42 * s, 19, '#ffe7b0', 'center', '700');
      }
    }

    // ---------- aide des commandes (bas centre)
    if (G.showHelp) {
      var pad = G.device === 'gamepad';
      var lines = pad ? [
        ['A', 'remonter sur la planche · se lever · se remettre à genoux'],
        ['Stick gauche', 'ton poids : pied avant / arrière · carre gauche / droite'],
        ['Gâchette droite', 'border (puissance) · à-coups = pomper la wing'],
        ['Gâchette gauche', 'fléchir les jambes · relâcher = pousser (pomper)'],
        ['Stick droit', 'wing : vers le nez / la queue · plus basse / plus haute'],
        ['X · Y · B', 'changer de mains · changer de pieds · repartir'],
        ['RB · LB · Start', 'caméra · masquer l\'aide · pause et réglages']
      ] : [
        ['Entrée', 'remonter sur la planche · se lever · se remettre à genoux'],
        ['W / S', G.persist ? 'pied avant / arrière (réglage mémorisé, Z = recentrer)' : 'pied avant / pied arrière'],
        ['A / D', 'carre à gauche / à droite'],
        ['E / Q · X', 'border / choquer la wing · tout lâcher'],
        ['Espace · Maj', 'pomper la wing · fléchir les jambes (relâcher = pousser)'],
        ['Flèches', '↑ ↓ wing vers le nez / la queue · ← → plus basse / plus haute'],
        ['F · G · R', 'changer de mains · changer de pieds · repartir'],
        ['C · H · Échap', 'caméra · masquer l\'aide · pause et réglages']
      ];
      var lh = 18 * s, hw2 = Math.min(560 * s, W - 2 * (m + 340 * s)), hh2 = lines.length * lh + 20 * s, hx = W / 2 - hw2 / 2, hy = H - m - hh2;
      if (hw2 > 380 * s) {
        this.panel(hx, hy, hw2, hh2);
        for (i = 0; i < lines.length; i++) {
          this.text(lines[i][0], hx + 118 * s, hy + 22 * s + i * lh, 11.5, '#ffe7b0', 'right', '700');
          this.text(lines[i][1], hx + 128 * s, hy + 22 * s + i * lh, 11.5, COL.txt, 'left', '500');
        }
      }
    } else {
      this.text((G.device === 'gamepad' ? 'Manette' : 'Clavier') + ' · ' + G.assistLabel + ' · ' + (G.device === 'gamepad' ? 'LB' : 'H') + ' : aide', W / 2, H - m - 4 * s, 12, COL.dim, 'center', '500');
    }
    void geo;
  };

  root.FoilHUD = FoilHUD;
})(typeof self !== 'undefined' ? self : this);
