/*
 * FoilInput — clavier + manette (Gamepad API)
 * ------------------------------------------------------------------
 * Sorties (lues une fois par image avec poll(dt, opts)) :
 *   lean   -1..1  (+ = poids sur le pied avant)
 *   roll   -1..1  (+ = carre à droite / tribord)
 *   sheet   0..1  (main arrière : 0 = lâchée, ~0,85 = puissance max, 1 = sur-bordé)
 *   crouch  0..1  (flexion des jambes ; relâcher = pousser)
 *   wingFA -1..1  (+ = wing vers le nez)
 *   wingLat -1..1 (+ = wing vers la droite de l'écran)
 *   flip, feet, action : niveaux (bouton tenu) ; pressed.xxx : fronts montants
 *   action = remonter sur la planche / se lever / se remettre à genoux (Entrée, bouton A)
 */
(function (root) {
  'use strict';

  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function approach(cur, target, up, down, dt) {
    if (target > cur) return Math.min(target, cur + up * dt);
    return Math.max(target, cur - down * dt);
  }
  function expo(x, e) { return (x < 0 ? -1 : 1) * Math.pow(Math.abs(x), e); }

  var GAME_KEYS = {
    KeyW: 1, KeyS: 1, KeyA: 1, KeyD: 1, KeyQ: 1, KeyE: 1, KeyF: 1, KeyG: 1, KeyR: 1, KeyC: 1, KeyH: 1, KeyP: 1, KeyM: 1,
    KeyX: 1, KeyZ: 1, Space: 1, ShiftLeft: 1, ShiftRight: 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1,
    Escape: 1, Enter: 1, KeyV: 1, Backspace: 1
  };

  function FoilInput(target) {
    var self = this;
    this.keys = {};
    this.keyEdges = {};
    this.device = 'keyboard';
    this.gpIndex = -1;
    this.gpName = '';
    this.gpMapping = '';
    this.gpPrev = [];
    this.gpDenied = false;              // manette refusée au jeu (cadre sans autorisation)
    this.trigInit = {};                 // manettes non standard : axes de gâchette pas encore initialisés
    this.kb = { lean: 0, leanTrim: 0, roll: 0, sheetBase: 0, pump: 0, crouch: 0, fa: 0, lat: 0 };
    this.out = { lean: 0, roll: 0, sheet: 0, crouch: 0, wingFA: 0, wingLat: 0, flip: false, feet: false, action: false };
    this.pressed = {};
    this.raw = { axes: [], buttons: [] };
    this.enabled = true;

    target.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
        if (e.code !== 'Escape') return;
      }
      if (GAME_KEYS[e.code]) e.preventDefault();
      if (!self.keys[e.code]) self.keyEdges[e.code] = true;
      self.keys[e.code] = true;
      self.device = 'keyboard';
    });
    target.addEventListener('keyup', function (e) { self.keys[e.code] = false; });
    target.addEventListener('blur', function () { self.keys = {}; });
    target.addEventListener('gamepadconnected', function (e) { self.gpIndex = e.gamepad.index; });
    target.addEventListener('gamepaddisconnected', function (e) { if (self.gpIndex === e.gamepad.index) self.gpIndex = -1; });
  }

  // Lecture d'une manette : renvoie un objet normalisé ou null
  FoilInput.prototype.readPad = function () {
    // Dans un cadre <iframe> sans l'autorisation « gamepad », getGamepads() lève une erreur : on joue alors sans manette.
    var pads = [], gp = null, i;
    if (!this.gpDenied && navigator.getGamepads) {
      try { pads = navigator.getGamepads() || []; } catch (err) { this.gpDenied = true; }
    }
    if (this.gpIndex >= 0 && pads[this.gpIndex] && pads[this.gpIndex].connected) gp = pads[this.gpIndex];
    if (!gp) for (i = 0; i < pads.length; i++) if (pads[i] && pads[i].connected) { gp = pads[i]; this.gpIndex = i; break; }
    if (!gp) { this.gpName = ''; return null; }
    this.gpName = gp.id || 'Manette'; this.gpMapping = gp.mapping || 'non standard';
    var ax = gp.axes, b = gp.buttons, n = { lx: 0, ly: 0, rx: 0, ry: 0, lt: 0, rt: 0, btn: {} };
    function bv(k) { return b[k] ? (typeof b[k] === 'object' ? b[k].value : b[k]) : 0; }
    function bp(k) { return b[k] ? (typeof b[k] === 'object' ? (b[k].pressed || b[k].value > 0.5) : b[k] > 0.5) : false; }
    this.raw.axes = Array.prototype.slice.call(ax);
    this.raw.buttons = []; for (i = 0; i < b.length; i++) this.raw.buttons.push(Math.round(bv(i) * 100) / 100);
    if (gp.mapping === 'standard' || ax.length < 6) {
      n.lx = ax[0] || 0; n.ly = ax[1] || 0; n.rx = ax[2] || 0; n.ry = ax[3] || 0;
      n.lt = bv(6); n.rt = bv(7);
      n.btn = { a: bp(0), b: bp(1), x: bp(2), y: bp(3), lb: bp(4), rb: bp(5), back: bp(8), start: bp(9),
                up: bp(12), down: bp(13), left: bp(14), right: bp(15) };
    } else {
      // Disposition brute fréquente sous Linux (pilote xpad, Firefox) :
      // axes [LX, LY, LT, RX, RY, RT, croixX, croixY], boutons [A, B, X, Y, LB, RB, Back, Start, ...]
      var ti = this.trigInit[gp.index] || (this.trigInit[gp.index] = { l: false, r: false });
      if (ax[2] !== 0) ti.l = true; if (ax[5] !== 0) ti.r = true;
      n.lx = ax[0] || 0; n.ly = ax[1] || 0; n.rx = ax[3] || 0; n.ry = ax[4] || 0;
      n.lt = ti.l ? (ax[2] + 1) / 2 : 0; n.rt = ti.r ? (ax[5] + 1) / 2 : 0;
      var dx = ax[6] || 0, dy = ax[7] || 0;
      n.btn = { a: bp(0), b: bp(1), x: bp(2), y: bp(3), lb: bp(4), rb: bp(5), back: bp(6), start: bp(7),
                up: dy < -0.5, down: dy > 0.5, left: dx < -0.5, right: dx > 0.5 };
    }
    n.pad = gp;
    return n;
  };

  function stick(x, y, dz) {
    var m = Math.sqrt(x * x + y * y);
    if (m < dz) return [0, 0];
    var k = Math.min(1, (m - dz) / (1 - dz)) / m;
    return [x * k, y * k];
  }

  // opts.leanPersistent : au clavier, W/S règlent une assiette mémorisée (modes sans maintien de hauteur)
  FoilInput.prototype.poll = function (dt, opts) {
    opts = opts || {};
    var k = this.keys, kb = this.kb, o = this.out, pr = {}, e = this.keyEdges, name;
    var pad = this.readPad();

    // ----- fronts montants clavier
    if (e.KeyF) pr.flip = true;
    if (e.KeyG) pr.feet = true;
    if (e.KeyR || e.Backspace) pr.reset = true;
    if (e.KeyC) pr.camera = true;
    if (e.KeyH) pr.help = true;
    if (e.KeyP || e.Escape) pr.pause = true;
    if (e.KeyM) pr.mute = true;
    if (e.Enter || e.Space) pr.accept = true;
    if (e.Enter) pr.action = true;
    if (e.ArrowUp) pr.menuUp = true; if (e.ArrowDown) pr.menuDown = true;
    if (e.ArrowLeft) pr.menuLeft = true; if (e.ArrowRight) pr.menuRight = true;
    if (e.KeyV) pr.windUp = true;
    this.keyEdges = {};

    // ----- clavier → commandes analogiques lissées
    var kl = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
    if (opts.leanPersistent) {
      kb.leanTrim = clamp(kb.leanTrim + kl * 0.55 * dt, -1, 1);
      if (k.KeyZ) kb.leanTrim = approach(kb.leanTrim, 0, 3, 3, dt);
      kb.lean = kb.leanTrim;
    } else {
      kb.leanTrim = 0;
      kb.lean = approach(kb.lean, kl, 4.0, 6.0, dt);
    }
    kb.roll = approach(kb.roll, (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0), 2.8, 5.0, dt);
    kb.sheetBase = clamp(kb.sheetBase + ((k.KeyE ? 1 : 0) - (k.KeyQ ? 1 : 0)) * 0.75 * dt, 0, 1);
    if (k.KeyX) kb.sheetBase = 0;
    kb.pump = approach(kb.pump, k.Space ? 1 : 0, 9, 9, dt);
    kb.crouch = approach(kb.crouch, (k.ShiftLeft || k.ShiftRight) ? 1 : 0, 10, 10, dt);
    kb.fa = approach(kb.fa, (k.ArrowUp ? 1 : 0) - (k.ArrowDown ? 1 : 0), 2.5, 4, dt);
    kb.lat = approach(kb.lat, (k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0), 2.5, 4, dt);

    // ----- manette
    var g = null;
    if (pad) {
      var L = stick(pad.lx, pad.ly, 0.14), R = stick(pad.rx, pad.ry, 0.18);
      g = {
        lean: expo(-L[1], 1.5), roll: expo(L[0], 1.5),
        sheet: clamp((pad.rt - 0.03) / 0.94, 0, 1), crouch: clamp((pad.lt - 0.05) / 0.9, 0, 1),
        wingFA: -R[1], wingLat: R[0], flip: pad.btn.x, feet: pad.btn.y, action: pad.btn.a
      };
      var pb = this.gpPrev, bt = pad.btn;
      for (name in bt) { if (bt[name] && !pb[name]) pr['gp_' + name] = true; }
      this.gpPrev = bt;
      if (pr.gp_x) pr.flip = true;
      if (pr.gp_y) pr.feet = true;
      if (pr.gp_b) { pr.reset = true; pr.back = true; }
      if (pr.gp_a) { pr.accept = true; pr.action = true; }
      if (pr.gp_start) pr.pause = true;
      if (pr.gp_rb || pr.gp_back) pr.camera = true;
      if (pr.gp_lb) pr.help = true;
      if (pr.gp_up) { pr.menuUp = true; pr.windUp = true; }
      if (pr.gp_down) { pr.menuDown = true; pr.windDown = true; }
      if (pr.gp_left) pr.menuLeft = true;
      if (pr.gp_right) pr.menuRight = true;
      var active = Math.abs(g.lean) > 0.05 || Math.abs(g.roll) > 0.05 || g.sheet > 0.05 || g.crouch > 0.05 ||
                   Math.abs(g.wingFA) > 0.05 || Math.abs(g.wingLat) > 0.05;
      for (name in bt) if (bt[name]) active = true;
      if (active) this.device = 'gamepad';
    } else if (this.device === 'gamepad') this.device = 'keyboard';

    if (this.device === 'gamepad' && g) {
      o.lean = g.lean; o.roll = g.roll; o.sheet = g.sheet; o.crouch = g.crouch;
      o.wingFA = g.wingFA; o.wingLat = g.wingLat; o.flip = !!g.flip; o.feet = !!g.feet; o.action = !!g.action || !!k.Enter;
    } else {
      o.lean = kb.lean; o.roll = kb.roll; o.sheet = clamp(kb.sheetBase + 0.45 * kb.pump, 0, 1); o.crouch = kb.crouch;
      o.wingFA = kb.fa; o.wingLat = kb.lat; o.flip = !!k.KeyF; o.feet = !!k.KeyG; o.action = !!k.Enter;
    }
    o.resetHeld = !!(k.KeyR || k.Backspace || (pad && pad.btn.b));
    this.pressed = pr;
    this.pad = pad;
    return o;
  };

  // Remet à zéro les réglages mémorisés du clavier (après une chute, un départ)
  FoilInput.prototype.resetStates = function () {
    this.kb.leanTrim = 0; this.kb.lean = 0; this.kb.sheetBase = 0; this.kb.roll = 0; this.kb.pump = 0;
  };

  FoilInput.prototype.rumble = function (strong, weak, ms) {
    try {
      var p = this.pad && this.pad.pad;
      if (!p || this.device !== 'gamepad') return;
      if (p.vibrationActuator && p.vibrationActuator.playEffect) {
        p.vibrationActuator.playEffect('dual-rumble', { startDelay: 0, duration: ms || 120, strongMagnitude: clamp(strong, 0, 1), weakMagnitude: clamp(weak, 0, 1) });
      }
    } catch (err) { /* vibrations non disponibles */ }
  };

  root.FoilInput = FoilInput;
})(typeof self !== 'undefined' ? self : this);
