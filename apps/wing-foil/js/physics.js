/*
 * FoilPhysics — moteur physique du simulateur de wing foil (version 2)
 * ------------------------------------------------------------------
 * Aucune dépendance. Fonctionne dans le navigateur (window.FoilPhysics)
 * et sous Node (module.exports) pour les tests de validation.
 *
 * Repère monde : X = est, Y = haut, Z = sud  (le nord est -Z).
 * Repère planche : x = vers le nez, y = normale au pont (haut), z = tribord.
 * Origine O de la planche : sur le pont, au centre de l'appui des pieds.
 *
 * Modèle (résumé — voir PHYSIQUE.md) :
 *   - translation : une seule masse (rider + matériel) soumise à la gravité,
 *     aux forces hydrodynamiques (foil, mât, coque) et aérodynamiques (wing, rider) ;
 *   - foil : théorie des tranches. Aile avant (6 tranches), stabilisateur (2),
 *     mât (6 segments), chacun avec portance/traînée fonction de l'incidence locale,
 *     décrochage, effet de surface libre et ventilation à la sortie de l'eau ;
 *   - coque : flottabilité, portance de planing, frottement, traînée de vague ;
 *   - mer : clapot et houle (élévation + vitesses orbitales de l'eau) ; toutes les
 *     forces hydrodynamiques sont calculées par rapport à l'eau en mouvement ;
 *   - wing : portance/traînée fonction du bordé (incidence), de l'élévation
 *     et de la position avant/arrière ; pumping par la vitesse des bras ;
 *   - rider : trois postures (dans l'eau, à genoux, debout) ; ses appuis sont pilotés
 *     par des réflexes d'équilibre de gain et de retard finis ; le joueur commande
 *     l'intention (assiette, carre), comme un vrai rider.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.FoilPhysics = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEG = Math.PI / 180;
  var KN = 0.514444;       // 1 nœud en m/s
  var RHO_W = 1025;        // eau de mer (kg/m³)
  var RHO_A = 1.225;       // air (kg/m³)
  var G = 9.81;

  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function smooth01(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function wrapPi(a) {
    a = a % (2 * Math.PI);
    if (a > Math.PI) a -= 2 * Math.PI; else if (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }
  function expK(dt, tau) { return 1 - Math.exp(-dt / tau); }

  // ------------------------------------------------------------------
  // Matériel
  // ------------------------------------------------------------------
  var GEAR = {
    freeride: {
      label: 'Freeride', riderMass: 78, kitMass: 2,
      board: { L: 1.63, W: 0.66, vol: 95, mass: 6.5 },
      mast: { len: 0.85, chord: 0.125 },
      wing: { S: 0.150, AR: 6.5, clmax: 1.15, cd0: 0.011, inc: 0.5, a0: -2.0 },
      stab: { S: 0.0240, AR: 7.0, inc: -2.2 },
      foilMass: 4.5,
      handWing: { S: 5.0, span: 3.2, mass: 2.8 }
    },
    debutant: {
      label: 'Débutant', riderMass: 78, kitMass: 2,
      board: { L: 1.75, W: 0.72, vol: 120, mass: 7.5 },
      mast: { len: 0.75, chord: 0.125 },
      wing: { S: 0.200, AR: 5.0, clmax: 1.25, cd0: 0.013, inc: 0.5, a0: -2.5 },
      stab: { S: 0.0300, AR: 6.0, inc: -2.4 },
      foilMass: 5.0,
      handWing: { S: 6.0, span: 3.5, mass: 3.1 }
    },
    performance: {
      label: 'Performance', riderMass: 78, kitMass: 2,
      board: { L: 1.47, W: 0.58, vol: 75, mass: 5.5 },
      mast: { len: 0.90, chord: 0.120 },
      wing: { S: 0.110, AR: 8.5, clmax: 1.05, cd0: 0.009, inc: 0.5, a0: -1.6 },
      stab: { S: 0.0200, AR: 7.5, inc: -1.5 },
      foilMass: 4.0,
      handWing: { S: 4.0, span: 2.85, mass: 2.4 }
    }
  };

  // Valeurs libres (« mon matériel »), dans les unités d'usage des riders
  var CUSTOM_DEFAULT = {
    riderMass: 78,      // kg
    boardVol: 95,       // litres
    boardLen: 163,      // cm
    foilArea: 1500,     // cm² (aile avant)
    foilAR: 6.5,        // allongement de l'aile avant
    stabArea: 240,      // cm²
    stabInc: -2.2,      // calage du stabilisateur, degrés
    mastLen: 85,        // cm
    mastPos: 0,         // cm, + = mât avancé dans les rails
    wingArea: 5.0       // m²
  };
  var CUSTOM_RANGE = {
    riderMass: [45, 115, 1], boardVol: [35, 160, 1], boardLen: [110, 210, 1], foilArea: [600, 2600, 10], foilAR: [4, 11, 0.1],
    stabArea: [140, 420, 5], stabInc: [-4, 0, 0.1], mastLen: [55, 110, 1], mastPos: [-8, 8, 0.5], wingArea: [2.5, 8, 0.1]
  };

  // Construit une fiche de matériel à partir de valeurs libres. Les coefficients du profil
  // suivent l'allongement, comme entre les trois préréglages.
  function customGear(c) {
    var o = {}, k;
    for (k in CUSTOM_DEFAULT) {
      var v = (c && typeof c[k] === 'number' && isFinite(c[k])) ? c[k] : CUSTOM_DEFAULT[k];
      o[k] = clamp(v, CUSTOM_RANGE[k][0], CUSTOM_RANGE[k][1]);
    }
    var AR = o.foilAR, Sw = o.wingArea;
    return {
      label: 'Le mien', riderMass: o.riderMass, kitMass: 2,
      board: { L: o.boardLen / 100, W: clamp(0.36 + 0.0031 * o.boardVol, 0.46, 0.86), vol: o.boardVol, mass: 3 + 0.037 * o.boardVol },
      mast: { len: o.mastLen / 100, chord: 0.125 },
      wing: { S: o.foilArea / 10000, AR: AR, clmax: clamp(1.25 - 0.057 * (AR - 5), 0.98, 1.30),
              cd0: clamp(0.013 - 0.0011 * (AR - 5), 0.0075, 0.0142), inc: 0.5, a0: clamp(-2.5 + 0.26 * (AR - 5), -2.6, -1.4) },
      stab: { S: o.stabArea / 10000, AR: 7.0, inc: o.stabInc },
      foilMass: 3.2 + 9 * o.foilArea / 10000,
      handWing: { S: Sw, span: Math.sqrt(2.05 * Sw), mass: 1.3 + 0.3 * Sw },
      mastPos: o.mastPos / 100,
      custom: o
    };
  }

  // ------------------------------------------------------------------
  // Niveaux d'assistance = qualité des réflexes du rider virtuel
  // ------------------------------------------------------------------
  function makeAssist(level) {
    // trimK     : le manche commande un taux de montée, le rider tient la hauteur tout seul
    // heightK   : rappel vers le milieu du mât
    // rollTrimK : le rider tient son cap tout seul (manche de carre = taux de virage)
    // reflexTau : temps de réaction des appuis ; leanTau : temps de réaction du corps face à la wing
    if (level === 'assiste' || level === 'debutant') {
      return { level: 'assiste', trimK: 0.22, heightK: 0.12, hTarget: 0.55, rollTrimK: 1.2,
               reflexTau: 0.05, leanTau: 0.10, autoFlip: true, autoFeet: true, liftoffTrim: true };
    }
    if (level === 'expert') {
      return { level: 'expert', trimK: 0, heightK: 0, hTarget: 0.5, rollTrimK: 0,
               reflexTau: 0.14, leanTau: 0.35, autoFlip: false, autoFeet: false, liftoffTrim: false };
    }
    // « réaliste » : la hauteur de vol se pilote au pied avant / pied arrière, comme en vrai
    return { level: 'realiste', trimK: 0, heightK: 0, hTarget: 0.5, rollTrimK: 0.9,
             reflexTau: 0.08, leanTau: 0.20, autoFlip: false, autoFeet: false, liftoffTrim: false };
  }

  // ------------------------------------------------------------------
  // Polaires : portance linéaire, décrochage, puis plaque plane
  // ------------------------------------------------------------------
  var _cl = 0, _cd = 0, _st = 0;
  function polar(alpha, p, bonus) {
    var ae = alpha - p.a0;
    if (ae > Math.PI) ae -= 2 * Math.PI; else if (ae < -Math.PI) ae += 2 * Math.PI;
    var clm = p.clmax + (bonus || 0);          // bonus : sur-portance dynamique (pumping)
    var aStall = clm / p.a;
    var s = smooth01((Math.abs(ae) - aStall) / p.w);
    var clLin = clamp(p.a * ae, -clm, clm);
    var sn = Math.sin(ae);
    _cl = clLin * (1 - s) + p.cp * Math.sin(2 * ae) * s;
    _cd = (p.cd0 + p.k * clLin * clLin) * (1 - s) + (p.cd0 + p.cdp * sn * sn) * s;
    _st = s;
  }

  function rocker(xi) {
    if (xi > 0.3) { var a = (xi - 0.3) / 0.7; return 0.09 * a * a; }
    if (xi < -0.75) { var b = (-xi - 0.75) / 0.25; return 0.02 * b * b; }
    return 0;
  }

  // ------------------------------------------------------------------
  // Géométrie dérivée du matériel (clé d'un préréglage, ou objet de valeurs libres)
  // ------------------------------------------------------------------
  function buildGeometry(spec) {
    var gr, key;
    if (spec && typeof spec === 'object') { gr = customGear(spec); key = 'custom:' + JSON.stringify(gr.custom); }
    else { key = GEAR[spec] ? spec : 'freeride'; gr = GEAR[key]; }
    var B = gr.board, geo = { gear: gr, key: key };

    geo.xMast = -0.26 + (gr.mastPos || 0);   // mât derrière le centre des appuis
    geo.xTail = -0.66;
    geo.xNose = geo.xTail + B.L;
    geo.xFoot = 0.32;                        // pied avant +0,32 ; pied arrière -0,32

    // --- coque : grille de points sous la planche
    var Nx = 9, pts = [], areaTot = 0, j, k;
    for (j = 0; j < Nx; j++) {
      var x = geo.xTail + (j + 0.5) * B.L / Nx;
      var xi = (x - (geo.xTail + B.L / 2)) / (B.L / 2);
      var hw = 0.5 * B.W * Math.pow(1 - Math.pow(Math.abs(xi), 2.6), 0.55);
      var dA = 2 * hw * B.L / Nx;
      var zs = [-0.6 * hw, 0, 0.6 * hw], ws = [0.3, 0.4, 0.3];
      for (k = 0; k < 3; k++) pts.push({ x: x, z: zs[k], A: dA * ws[k], rock: rocker(xi), hw: hw });
      areaTot += dA;
    }
    geo.T = (B.vol / 1000) / areaTot;        // épaisseur équivalente (volume / surface)
    for (j = 0; j < pts.length; j++) {
      pts[j].y = -geo.T + pts[j].rock;
      pts[j].Alat = (B.L / Nx) * geo.T / 3;
    }
    geo.hull = pts;
    geo.hullArea = areaTot;
    geo.kPlane = 0.5;                        // portance dynamique de la carène
    geo.cHeave = 1400;                       // amortissement vertical (N·s/m³)
    geo.Cf = 0.0055;                         // frottement
    geo.Clat = 1.1;                          // résistance latérale de la carène

    // --- foil
    geo.yFoil = -(geo.T + gr.mast.len);
    geo.xWing = geo.xMast + 0.22;
    geo.xStab = geo.xMast - 0.52;
    var strips = [], i;

    var W = gr.wing, b = Math.sqrt(W.AR * W.S), c0 = 4 * W.S / (Math.PI * b), Nw = 6, sumA = 0, tmp = [];
    for (i = 0; i < Nw; i++) {
      var z = b * ((i + 0.5) / Nw - 0.5);
      var ch = c0 * Math.sqrt(1 - Math.pow(2 * z / b, 2));
      tmp.push({ z: z, ch: ch, a: ch * b / Nw }); sumA += ch * b / Nw;
    }
    var pw = { a: 0.95 * 2 * Math.PI * W.AR / (W.AR + 2), a0: W.a0 * DEG, clmax: W.clmax, w: 5 * DEG,
               cd0: W.cd0, k: 1 / (Math.PI * 0.9 * W.AR), cp: 1.0, cdp: 1.6 };
    var iw = W.inc * DEG, ew = [Math.cos(iw), Math.sin(iw), 0], nw = [-Math.sin(iw), Math.cos(iw), 0];
    for (i = 0; i < Nw; i++) {
      strips.push({ kind: 0, r: [geo.xWing, geo.yFoil, tmp[i].z], S: tmp[i].a * W.S / sumA, c: tmp[i].ch,
                    e: ew, n: nw, pol: pw, wet: 1 });
    }
    geo.wingSpan = b; geo.wingChord = c0; geo.wingPolar = pw;
    geo.dwK = 2 / (Math.PI * W.AR);          // déflexion sur le stab : eps = dwK * CL

    var St = gr.stab, bt = Math.sqrt(St.AR * St.S);
    var pt = { a: 0.95 * 2 * Math.PI * St.AR / (St.AR + 2), a0: 0, clmax: 0.9, w: 5 * DEG,
               cd0: 0.012, k: 1 / (Math.PI * 0.85 * St.AR), cp: 1.0, cdp: 1.6 };
    var it = St.inc * DEG, et = [Math.cos(it), Math.sin(it), 0], nt = [-Math.sin(it), Math.cos(it), 0];
    for (i = 0; i < 2; i++) {
      strips.push({ kind: 1, r: [geo.xStab, geo.yFoil + 0.01, (i - 0.5) * bt / 2], S: St.S / 2, c: St.S / bt,
                    e: et, n: nt, pol: pt, wet: 1 });
    }
    geo.stabSpan = bt;

    var Nm = 6, seg = gr.mast.len / Nm;
    var pm = { a: 3.2, a0: 0, clmax: 0.7, w: 6 * DEG, cd0: 0.010, k: 0.12, cp: 0.9, cdp: 1.4 };
    for (i = 0; i < Nm; i++) {
      strips.push({ kind: 2, r: [geo.xMast, -geo.T - (i + 0.5) * seg, 0], S: gr.mast.chord * seg, c: gr.mast.chord,
                    len: seg, e: [1, 0, 0], n: [0, 0, 1], pol: pm, wet: 1 });
    }
    // surface verticale équivalente à l'arrière (fuselage, winglets du stab)
    strips.push({ kind: 3, r: [geo.xStab, geo.yFoil, 0], S: 0.004, c: 0.08, e: [1, 0, 0], n: [0, 0, 1],
                  pol: { a: 2.5, a0: 0, clmax: 0.8, w: 8 * DEG, cd0: 0.02, k: 0.2, cp: 0.9, cdp: 1.2 }, wet: 1 });
    geo.strips = strips;
    geo.fuseCdA = 0.0006;
    geo.pumpEta = 0.55;                      // rendement du pumping de la planche (foil battant)

    // --- masses et inerties
    geo.mRider = gr.riderMass + gr.kitMass;
    geo.M = geo.mRider + B.mass + gr.foilMass + gr.handWing.mass;
    geo.mu = geo.mRider / geo.M;
    // debout à l'arrêt : amplitude des déséquilibres (une grosse planche pardonne, une planche qui coule non),
    // et autorité du joueur pour les rattraper (N·m)
    geo.wobK = 1.4 * (1.25 - 0.75 * clamp((B.vol - 0.9 * geo.M) / (0.5 * geo.M), 0, 1)); geo.wobIn = 800;
    geo.Ix = 10 + 0.27 * geo.M;              // roulis : tout le système
    geo.Iy = 9;                              // lacet
    geo.Iz = 6;                              // tangage : la planche pivote sous les pieds
    geo.cy0 = 0.80;                          // hauteur du centre de masse au-dessus du pont, debout
    geo.cyKneel = 0.44;                      // à genoux
    geo.sMax = 0.92; geo.sMin = 0.66;        // extension des jambes

    // --- wing tenue à la main
    var HW = gr.handWing, ARw = HW.span * HW.span / HW.S;
    geo.wS = HW.S; geo.wSpan = HW.span; geo.wAR = ARw;
    geo.wpol = { a: 0.92 * 2 * Math.PI * ARw / (ARw + 2), a0: 0, clmax: 1.2, w: 7 * DEG,
                 cd0: 0.07, k: 1 / (Math.PI * 0.8 * ARw), cp: 1.0, cdp: 1.25 };
    geo.alphaFull = 28 * DEG;                // incidence gâchette à fond (au-delà du max : sur-bordé)
    geo.riderCdA = 0.45;
    geo.betaKi = 1.5;                        // réglage de la dérive par le rider (1/s)
    // pumping de la wing : course des bras (m par unité de bordé), vitesse maxi, sur-portance dynamique
    geo.pumpLs = 1.4; geo.pumpVmax = 2.6; geo.pumpVback = 1.0; geo.pumpBonus = 0.5; geo.pumpV0 = 1.8; geo.pumpTau = 0.12;
    geo.pumpDir = [-0.66, -0.45, -0.60];     // direction de la traction (avant, haut, côté wing)
    geo.sheetIn = 1.6; geo.sheetOut = 3.0;   // vitesse maxi du bordé (1/s) : border / choquer
    geo.armTau = 0.35;                       // la force des bras se juge sur la traction soutenue (s)
    // ventilation : portance locale à partir de laquelle l'air est aspiré (seuil, plage), profondeur d'aspiration
    // et profondeur de maintien d'une poche déjà formée (en cordes)
    geo.ventA = 0.6; geo.ventB = 0.3; geo.ventC = 0.6; geo.ventH = 0.5; geo.ventN = 0.04; geo.ventT = 0.05; geo.ventCd = 0.05; geo.nWing = Nw;
    // repères utiles : vitesse de décrochage du foil (portance = poids)
    geo.vStall = Math.sqrt(2 * geo.M * G / (RHO_W * W.S * W.clmax));
    return geo;
  }

  var NOCTL = { lean: 0, roll: 0, sheet: 0, crouch: 0, wingFA: 0, wingUp: 0, flip: false, feet: false, action: false };

  // ------------------------------------------------------------------
  // Simulateur
  // ------------------------------------------------------------------
  function FoilSim(opts) {
    opts = opts || {};
    // chop : amplitude du clapot ; swellH : hauteur de la houle (creux à crête, m) ; swellT : période (s) ;
    // swellDir : direction vers laquelle la houle se propage (null = dans le lit du vent)
    this.env = { windDir: 0, windSpeed: 17 * KN, gust: 0.12, shift: 4 * DEG, chop: 0.03, swellH: 0, swellT: 5, swellDir: null };
    if (opts.env) for (var k in opts.env) this.env[k] = opts.env[k];
    this.assist = makeAssist(opts.assist || 'realiste');
    this.stance = opts.stance === -1 ? -1 : 1;     // +1 regular (pied gauche devant), -1 goofy
    this.fullStart = !!opts.fullStart;             // séquence complète : dans l'eau → à genoux → debout
    this.t = 0;
    this.events = [];
    this.wv = [];
    // obstacles du plan d'eau : disques { x, z, r } ; une île a un contour lobé { lobes: [[n, amplitude, phase], …], rm: rayon maxi }
    this.obstacles = [];
    this.setGear(opts.gear || 'freeride');
    this.reset({});
  }

  FoilSim.prototype.setGear = function (spec) { this.geo = buildGeometry(spec); };
  FoilSim.prototype.setAssist = function (level) { this.assist = makeAssist(level); };

  // ------------------------------------------------------------------
  // Mer : clapot (ondes courtes) + houle (ondes de gravité en eau profonde, ω² = g·k)
  //   élévation      η = Σ a·cos(k·x − ω·t + φ)
  //   vitesse de l'eau   horizontale a·ω·cos(…)·e^{k·y} dans le sens de l'onde, verticale a·ω·sin(…)·e^{k·y}
  // ------------------------------------------------------------------
  var CHOP = [
    { a: 1.00, kx: 0.42, kz: 0.19, om: 2.10, ph: 0.3 },
    { a: 0.60, kx: -0.21, kz: 0.77, om: 2.80, ph: 1.7 },
    { a: 0.35, kx: 1.31, kz: -0.52, om: 3.70, ph: 4.1 },
    { a: 0.20, kx: 0.80, kz: 2.10, om: 4.70, ph: 2.6 }
  ];
  var SWELL = [
    { a: 0.80, T: 1.00, d: 0, ph: 0.9 },
    { a: 0.34, T: 0.80, d: 18 * DEG, ph: 3.7 },
    { a: 0.20, T: 1.22, d: -14 * DEG, ph: 5.2 }
  ];
  FoilSim.prototype.buildSea = function () {
    var e = this.env, w = [], i, c;
    this._sc = e.chop; this._sh = e.swellH; this._sT = e.swellT; this._sd = e.swellDir; this._swd = e.windDir;
    if (e.swellH > 0) {
      var dir = (e.swellDir === null || e.swellDir === undefined) ? e.windDir + Math.PI : e.swellDir;
      for (i = 0; i < SWELL.length; i++) {
        c = SWELL[i];
        var om = 2 * Math.PI / (e.swellT * c.T), kk = om * om / G, th = dir + c.d;
        w.push({ a: 0.5 * e.swellH * c.a, kx: kk * Math.sin(th), kz: -kk * Math.cos(th), om: om, ph: c.ph, k: kk,
                 dx: Math.sin(th), dz: -Math.cos(th), swell: true });
      }
    }
    if (e.chop > 0) {
      for (i = 0; i < CHOP.length; i++) {
        c = CHOP[i];
        var kc = Math.sqrt(c.kx * c.kx + c.kz * c.kz);
        w.push({ a: 0.5 * e.chop * c.a, kx: c.kx, kz: c.kz, om: c.om, ph: c.ph, k: kc, dx: c.kx / kc, dz: c.kz / kc, swell: false });
      }
    }
    this.wv = w;
  };
  FoilSim.prototype.checkSea = function () {
    var e = this.env;
    if (e.chop !== this._sc || e.swellH !== this._sh || e.swellT !== this._sT || e.swellDir !== this._sd || e.windDir !== this._swd) this.buildSea();
  };
  // élévation seule
  FoilSim.prototype.eta = function (x, z) {
    var w = this.wv, n = w.length, t = this.t, s = 0, i, c;
    for (i = 0; i < n; i++) { c = w[i]; s += c.a * Math.cos(c.kx * x + c.kz * z - c.om * t + c.ph); }
    return s;
  };
  // élévation + vitesse de l'eau au point (x, y, z) : résultat dans _eta, _ux, _uy, _uz
  var _eta = 0, _ux = 0, _uy = 0, _uz = 0;
  FoilSim.prototype.wave = function (x, z, y) {
    var w = this.wv, n = w.length, t = this.t, i, c, ph, co, aw;
    _eta = 0; _ux = 0; _uy = 0; _uz = 0;
    for (i = 0; i < n; i++) {
      c = w[i]; ph = c.kx * x + c.kz * z - c.om * t + c.ph; co = Math.cos(ph);
      _eta += c.a * co;
      aw = c.a * c.om * (y < 0 ? Math.exp(c.k * y) : 1);
      _ux += aw * co * c.dx; _uz += aw * co * c.dz; _uy += aw * Math.sin(ph);
    }
  };

  // rayon d'un obstacle dans la direction (dx, dz)
  function obstacleR(o, dx, dz) {
    if (!o.lobes) return o.r;
    var a = Math.atan2(dz, dx), k = 1, i;
    for (i = 0; i < o.lobes.length; i++) k += o.lobes[i][1] * Math.sin(o.lobes[i][0] * a + o.lobes[i][2]);
    return o.r * k;
  }

  // Écarte un point des obstacles du plan d'eau (retour sur la planche après un échouage)
  FoilSim.prototype.clearOf = function (x, z) {
    var ob = this.obstacles, i, o, dx, dz, d, pass, moved;
    for (pass = 0; pass < 4; pass++) {
      moved = false;
      for (i = 0; i < ob.length; i++) {
        o = ob[i]; dx = x - o.x; dz = z - o.z; d = Math.sqrt(dx * dx + dz * dz);
        if (d < 0.01) { dx = 1; dz = 0; d = 1; }
        var ro = obstacleR(o, dx, dz);
        if (d < ro + 12) { x = o.x + dx / d * (ro + 14); z = o.z + dz / d * (ro + 14); moved = true; }
      }
      if (!moved) break;
    }
    return [x, z];
  };

  // état de l'eau en un point (pour les tests et le rendu) : élévation et vitesse de l'eau
  FoilSim.prototype.waterAt = function (x, z, y) {
    this.wave(x, z, y === undefined ? 0 : y);
    return { eta: _eta, ux: _ux, uy: _uy, uz: _uz };
  };

  // --- vent : rafales advectées vers l'aval ; renvoie le facteur de rafale, pose _wx/_wz
  FoilSim.prototype.windAt = function (x, z) {
    var e = this.env, d = e.windDir, W0 = e.windSpeed, t = this.t;
    var dx = -Math.sin(d), dz = Math.cos(d);          // direction où va l'air
    var cx = Math.cos(d), cz = Math.sin(d);           // travers au vent
    var uu = x * dx + z * dz - 0.6 * W0 * t, cc = x * cx + z * cz;
    var n = 0.55 * Math.sin(0.021 * uu + 1.3) * Math.cos(0.013 * cc + 0.7)
          + 0.30 * Math.sin(0.047 * uu + 0.011 * cc + 2.1)
          + 0.15 * Math.sin(0.110 * uu - 0.050 * cc + 4.0);
    var sh = e.shift * (0.6 * Math.sin(0.009 * uu + 0.017 * cc + 0.4) + 0.4 * Math.sin(0.031 * uu - 0.020 * cc + 1.9));
    var sp = W0 * (1 + e.gust * n);
    var dd = d + sh;
    this._wx = -sp * Math.sin(dd); this._wz = sp * Math.cos(dd); this._ws = sp; this._wd = dd;
    return n;
  };

  function quatFromYPR(psi, theta, phi) {
    // R = Ry(pi/2 - psi) · Rz(theta) · Rx(phi)
    var xi = Math.PI / 2 - psi;
    var cy = Math.cos(xi / 2), sy = Math.sin(xi / 2);
    var cz = Math.cos(theta / 2), sz = Math.sin(theta / 2);
    var cx = Math.cos(phi / 2), sx = Math.sin(phi / 2);
    var aw = cy * cz, ax = sy * sz, ay = sy * cz, az = cy * sz;
    return [aw * cx - ax * sx, aw * sx + ax * cx, ay * cx + az * sx, az * cx - ay * sx];
  }

  // o.posture : 'stand' (défaut), 'kneel' (à genoux sur la planche), 'swim' (dans l'eau, à côté de la planche)
  FoilSim.prototype.reset = function (o) {
    o = o || {};
    var geo = this.geo, env = this.env;
    this.buildSea();
    var side = o.side === -1 ? -1 : 1;           // +1 : vent venant de bâbord (wing à tribord)
    var twa = (o.twa !== undefined ? o.twa : 90) * DEG;
    var psi = o.heading !== undefined ? o.heading : wrapPi(env.windDir + side * twa);
    var flying = o.mode === 'flying';
    var posture = flying ? 'stand' : (o.posture || 'stand');
    var V = flying ? (o.speed || 7.0) : 0;
    this.q = quatFromYPR(psi, 0, 0);
    this.w = [0, 0, 0];
    var clr = this.clearOf(o.x || 0, o.z || 0), Ox = clr[0], Oz = clr[1], e0 = this.eta(Ox, Oz);
    var Oy = flying ? e0 + geo.T + (o.height !== undefined ? o.height : 0.45)
                    : (posture === 'swim' ? e0 + geo.T - 0.015 : e0 + 0.012);
    this.posture = posture;
    this.kn = posture === 'stand' ? 0 : 1; this.knT = this.kn;
    this.mountT = 0; this.swimT = 0; this.standT = 0; this.moveT = 0; this._actHeld = false;
    this.cx = -0.15; this.cz = 0; this.czVel = 0;
    this.s = geo.sMax; this.sVel = 0;
    var cy = this.kn > 0.5 ? geo.cyKneel : geo.cy0;
    this.cyPrev = cy;
    this.p = [Ox + Math.sin(psi) * this.cx, Oy + cy, Oz - Math.cos(psi) * this.cx];
    this.v = [V * Math.sin(psi), 0, -V * Math.cos(psi)];
    this.sigma = side;                            // côté de la wing : +1 tribord, -1 bâbord
    if (o.stance) this.stance = o.stance;
    if (o.heelside !== false && !o.keepStance) this.stance = this.sigma;   // départ heelside
    this.sheet = flying ? 0.5 : 0; this.sheetRate = 0; this.dynB = 0;
    this.eps = 45 * DEG; this.fa = 0;
    this.flipT = 0; this.flipDur = 0.7; this.feetT = 0; this.feetDur = 0.9;
    this._flipHeld = false; this._feetHeld = false;
    this.thetaI = 0; this.phiI = 0; this.phiFF = 0; this.kHeel = 0.5; this.betaDes = 0; this.betaI = 0;
    this.xff = 0; this.xcp = 0; this.xcpS = 0; this.leanBack = 0; this.tauX0f = 0; this.ankle = 0;
    this.downwash = 0;
    this.foilFrac = flying ? 1 : 0;
    this.flying = flying;
    this.crashed = null; this.crashT = 0;
    this.imbT = 0; this.backT = 0; this.wrongT = 0; this.wForce = 0; this.wForceF = 0; this.sheetCap = 1;
    this.betaPrev = 0; this.betaDot = 0; this.breachT = 9; this.nDry = 0; this.onHull = !flying;
    this.hPrev = null; this.hRate = 0;
    this.touchT = 0; this.airT = flying ? 1 : 0;
    this.lastTackSide = side;
    for (var i = 0; i < geo.strips.length; i++) { geo.strips[i].wet = 1; geo.strips[i].cl = 0; geo.strips[i].lp = 0; }
    this.tel = {};
    this.updateTelemetryOnly();
  };

  FoilSim.prototype.crash = function (reason) {
    if (this.crashed) return;
    this.crashed = reason; this.crashT = 0;
    this.events.push({ type: 'crash', reason: reason, t: this.t });
  };

  // bord (côté du vent) sur lequel on naviguait
  FoilSim.prototype.currentSide = function () {
    var tw = wrapPi(this.env.windDir - (this.tel.heading || 0));
    if (Math.abs(tw) > 5 * DEG && Math.abs(tw) < 175 * DEG) return tw < 0 ? 1 : -1;
    return this.sigma;
  };

  // Retour sur la planche après une chute ou sur demande : même endroit, travers au vent, à l'arrêt.
  // posture : 'stand' (rapide), 'kneel' (à genoux) ou 'swim' (dans l'eau : il faudra remonter)
  FoilSim.prototype.respawn = function (posture) {
    var O = this.tel.O || [0, 0, 0];
    this.reset({ x: O[0], z: O[2], side: this.currentSide(), keepStance: false, posture: posture || (this.fullStart ? 'kneel' : 'stand') });
    this.events.push({ type: 'respawn', t: this.t, posture: this.posture });
  };

  // ------------------------------------------------------------------
  // Dans l'eau à côté de la planche : on dérive doucement, on remonte à la demande
  // ------------------------------------------------------------------
  FoilSim.prototype.swimStep = function (dt, u) {
    var S = this, e = S.env, geo = S.geo;
    S.swimT += dt;
    var dx = -Math.sin(e.windDir) * 0.22, dz = Math.cos(e.windDir) * 0.22;      // dérive sous le vent
    S.p[0] += dx * dt; S.p[2] += dz * dt; S.v[0] = dx; S.v[1] = 0; S.v[2] = dz;
    var O = S.tel.O || [S.p[0], 0, S.p[2]];
    var want = (u.action && !S._actHeld) || (S.assist.autoFeet && S.swimT > 1.0);
    S._actHeld = !!u.action;
    if (want && S.mountT <= 0) { S.mountT = 1.6; S.events.push({ type: 'mounting', t: S.t }); }
    if (S.mountT > 0) {
      S.mountT -= dt;
      if (S.mountT <= 0) {
        S.reset({ x: O[0], z: O[2], side: S.sigma, keepStance: false, posture: 'kneel' });
        S.events.push({ type: 'mounted', t: S.t });
        return;
      }
    }
    // la planche flotte, vide, sur la houle
    var cx = S.cx, psi = S.tel.heading || 0;
    var Ox = S.p[0] - Math.sin(psi) * cx, Oz = S.p[2] + Math.cos(psi) * cx;
    S.p[1] = S.eta(Ox, Oz) + geo.T - 0.015 + geo.cyKneel;
    S.updateTelemetryOnly();
  };

  // ------------------------------------------------------------------
  // Un pas de simulation
  // ------------------------------------------------------------------
  FoilSim.prototype.step = function (dt, u) {
    var S = this, geo = S.geo, A = S.assist;
    u = u || NOCTL;
    S.t += dt;
    S.checkSea();
    if (S.crashed) {
      S.crashT += dt;
      var kd = expK(dt, 0.35);
      S.v[0] -= S.v[0] * kd; S.v[1] -= S.v[1] * kd; S.v[2] -= S.v[2] * kd;
      S.w[0] -= S.w[0] * kd; S.w[1] -= S.w[1] * kd; S.w[2] -= S.w[2] * kd;
      S.updateTelemetryOnly();
      if (S.fullStart && S.crashT > 1.5) {
        var Oc = S.tel.O;
        S.reset({ x: Oc[0], z: Oc[2], side: S.currentSide(), keepStance: false, posture: 'swim' });
        S.events.push({ type: 'swim', t: S.t });
      }
      return;
    }
    if (S.posture === 'swim') { S.swimStep(dt, u); return; }
    var M = geo.M, Wt = M * G;
    var VhPrev = S.tel.speed || 0;

    // ---------- 1. Le rider : posture, mains, jambes, position de la wing ----------
    // bouton d'action : se lever quand on est à genoux, se remettre à genoux quand on est debout sur l'eau
    if (u.action && !S._actHeld) {
      if (S.knT === 1 && S.kn > 0.95) { S.knT = 0; S.events.push({ type: 'standup', t: S.t, speed: VhPrev }); }
      else if (S.knT === 0 && S.kn < 0.05 && !S.flying && VhPrev < 4) { S.knT = 1; S.events.push({ type: 'kneel', t: S.t }); }
    }
    S._actHeld = !!u.action;
    if (S.knT === 1 && S.kn > 0.95 && VhPrev > 1.3) S.moveT += dt; else S.moveT = 0;
    if (A.autoFeet && S.moveT > 0.7) { S.knT = 0; S.events.push({ type: 'standup', t: S.t, speed: VhPrev }); S.moveT = 0; }
    if (S.kn !== S.knT) {
      S.kn = S.knT < S.kn ? Math.max(S.knT, S.kn - dt / 1.3) : Math.min(S.knT, S.kn + dt / 0.9);
    }
    var ks = smooth01(S.kn);                       // 1 = à genoux, 0 = debout
    S.posture = S.kn > 0.5 ? 'kneel' : 'stand';

    var heelside = (S.sigma === S.stance);
    var sheetCmd = clamp(u.sheet || 0, 0, 1);
    if (!heelside) sheetCmd = Math.min(sheetCmd, 0.9);
    if (ks > 0) sheetCmd = Math.min(sheetCmd, 1 - 0.28 * ks);          // à genoux, on tient moins de puissance
    // Force des bras : au-delà d'une certaine traction, la main arrière cède et la wing se choque d'elle-même.
    var Fhold = geo.mRider * 4.8 * (heelside ? 1 : 0.85) * (1 - 0.3 * ks);
    // (c'est la traction soutenue qui compte : un coup de pumping bref peut la dépasser)
    if (S.wForceF > Fhold) S.sheetCap = Math.max(0.12, S.sheetCap - 6 * dt * (S.wForceF / Fhold - 1));
    else S.sheetCap = Math.min(1, S.sheetCap + 0.6 * dt);
    if (sheetCmd > S.sheetCap) sheetCmd = S.sheetCap;
    var ds = clamp((sheetCmd - S.sheet) * expK(dt, 0.045), -geo.sheetOut * dt, geo.sheetIn * dt);
    S.sheet += ds;
    S.sheetRate += (ds / dt - S.sheetRate) * expK(dt, 0.03);

    var sT = geo.sMax - clamp(u.crouch || 0, 0, 1) * (1 - ks) * (geo.sMax - geo.sMin);
    var sAcc = clamp(256 * (sT - S.s) - 28.8 * S.sVel, -14, 14);
    S.sVel = clamp(S.sVel + sAcc * dt, -0.9, 0.9);
    S.s += S.sVel * dt;
    if (S.s > geo.sMax) { S.s = geo.sMax; if (S.sVel > 0) S.sVel = 0; }
    if (S.s < geo.sMin) { S.s = geo.sMin; if (S.sVel < 0) S.sVel = 0; }

    var flipActive = S.flipT > 0;
    var up = clamp(u.wingUp || 0, -1, 1);
    var epsT = (up >= 0 ? 45 + 40 * up : 45 + 32 * up) * DEG;
    if (flipActive) epsT = 90 * DEG;
    S.eps += clamp((epsT - S.eps) * expK(dt, 0.10), -3.4 * dt, 3.4 * dt);
    var faT = clamp(u.wingFA || 0, -1, 1) * 0.55;
    S.fa += clamp((faT - S.fa) * expK(dt, 0.10), -1.8 * dt, 1.8 * dt);

    if (u.flip && !S._flipHeld && S.flipT <= 0) { S.flipDur = 0.7; S.flipT = S.flipDur; }
    S._flipHeld = !!u.flip;
    if (S.flipT > 0) {
      var fb0 = S.flipT; S.flipT -= dt;
      if (fb0 > S.flipDur / 2 && S.flipT <= S.flipDur / 2) { S.sigma = -S.sigma; S.events.push({ type: 'flip', t: S.t }); }
    }
    if (u.feet && !S._feetHeld && S.feetT <= 0 && ks < 0.05) { S.feetDur = 0.9; S.feetT = S.feetDur; }
    S._feetHeld = !!u.feet;
    if (S.feetT > 0) {
      var ft0 = S.feetT; S.feetT -= dt;
      if (ft0 > S.feetDur / 2 && S.feetT <= S.feetDur / 2) { S.stance = -S.stance; S.events.push({ type: 'feet', t: S.t }); }
    }
    heelside = (S.sigma === S.stance);
    var switching = S.feetT > 0;

    // ---------- 2. Cinématique ----------
    var q = S.q, qw = q[0], qx = q[1], qy = q[2], qz = q[3];
    var r00 = 1 - 2 * (qy * qy + qz * qz), r01 = 2 * (qx * qy - qw * qz), r02 = 2 * (qx * qz + qw * qy);
    var r10 = 2 * (qx * qy + qw * qz), r11 = 1 - 2 * (qx * qx + qz * qz), r12 = 2 * (qy * qz - qw * qx);
    var r20 = 2 * (qx * qz - qw * qy), r21 = 2 * (qy * qz + qw * qx), r22 = 1 - 2 * (qx * qx + qy * qy);
    var psi = Math.atan2(r00, -r20);
    var theta = Math.asin(clamp(r10, -1, 1));
    var phi = Math.atan2(-r12, r11);
    var sps = Math.sin(psi), cps = Math.cos(psi), sph = Math.sin(phi), cph = Math.cos(phi);
    // repère « sans tangage » (cap + gîte) : le corps du rider reste droit quand la planche cabre
    var n00 = sps, n01 = cps * sph, n02 = cps * cph;
    var n10 = 0, n11 = cph, n12 = -sph;
    var n20 = -cps, n21 = sps * sph, n22 = sps * cph;

    var wx = S.w[0], wy = S.w[1], wz = S.w[2];
    var wwx = r00 * wx + r01 * wy + r02 * wz, wwy = r10 * wx + r11 * wy + r12 * wz, wwz = r20 * wx + r21 * wy + r22 * wz;
    var wnx = r00 * wx + r01 * wy, wny = r10 * wx + r11 * wy, wnz = r20 * wx + r21 * wy;   // sans la vitesse de tangage

    // Centre de masse : avant/arrière (cx) et hauteur (cy : jambes, posture). Le déport latéral du corps (cz)
    // n'intervient que comme bras de levier en roulis et en lacet (inclinaison quasi statique).
    var cx = S.cx, cyS = geo.cy0 + geo.mu * (S.s - geo.sMax), cy = cyS + (geo.cyKneel - cyS) * ks;
    var cwx = n00 * cx + n01 * cy, cwy = n10 * cx + n11 * cy, cwz = n20 * cx + n21 * cy;
    var dcy = clamp((cy - S.cyPrev) / dt, -1.2, 1.2); S.cyPrev = cy;
    var dcwx = n01 * dcy, dcwy = n11 * dcy, dcwz = n21 * dcy;
    var Ox = S.p[0] - cwx, Oy = S.p[1] - cwy, Oz = S.p[2] - cwz;
    var vOx = S.v[0] - (wny * cwz - wnz * cwy) - dcwx;
    var vOy = S.v[1] - (wnz * cwx - wnx * cwz) - dcwy;
    var vOz = S.v[2] - (wnx * cwy - wny * cwx) - dcwz;
    // centre de masse exprimé dans le repère planche
    var cbx = r00 * cwx + r10 * cwy + r20 * cwz, cby = r01 * cwx + r11 * cwy + r21 * cwz, cbz = r02 * cwx + r12 * cwy + r22 * cwz + S.cz;

    var fhx = sps, fhz = -cps;        // avant horizontal
    var rhx = cps, rhz = sps;         // tribord horizontal
    var Vh = Math.sqrt(S.v[0] * S.v[0] + S.v[2] * S.v[2]);
    var psiDot = -wwy;                // taux de cap (compas)

    // eau au droit de la planche
    S.wave(Ox, Oz, 0);
    var etaO = _eta, uOx = _ux, uOy = _uy, uOz = _uz;

    // ---------- 3. Forces hydrodynamiques (monde, moments par rapport à O) ----------
    var Fx = 0, Fy = 0, Fz = 0, Tx = 0, Ty = 0, Tz = 0;
    var strips = geo.strips, ns = strips.length, i;
    var clS = 0, stall = 0, breach = 0, liftN = 0, mastSub = 0;
    var rwx, rwy, rwz, px, py, pz, depth, vx, vy, vz, fwx, fwy, fwz;
    for (i = 0; i < ns; i++) {
      var sp = strips[i], r = sp.r;
      rwx = r00 * r[0] + r01 * r[1] + r02 * r[2];
      rwy = r10 * r[0] + r11 * r[1] + r12 * r[2];
      rwz = r20 * r[0] + r21 * r[1] + r22 * r[2];
      px = Ox + rwx; py = Oy + rwy; pz = Oz + rwz;
      S.wave(px, pz, py);
      depth = _eta - py;
      var kf;
      if (sp.kind === 2) {
        kf = clamp(0.5 + depth / (sp.len * Math.max(0.3, r11)), 0, 1);
        sp.wet = kf; mastSub += kf * sp.len;
      } else {
        // ventilation : à la sortie de l'eau, ou près de la surface quand le profil travaille à forte incidence
        // (peu chargé, le foil peut raser la surface ; très chargé, sa dépression d'extrados aspire de l'air).
        var acl = Math.abs(sp.cl || 0);
        var vd = sp.c * geo.ventC * smooth01((acl - geo.ventA) / geo.ventB);
        // une tranche voisine déjà ventilée ouvre un chemin à l'air : la poche gagne le long de l'envergure
        // d'autant plus loin sous la surface que la dépression d'extrados (en hauteur d'eau) est forte
        if (sp.kind === 0 && ((i > 0 && strips[i - 1].wet < 0.5) || (i < geo.nWing - 1 && strips[i + 1].wet < 0.5))) {
          var vn = geo.ventN * (sp.lp || 0);
          if (vn > vd) vd = vn;
        }
        // une poche d'air déjà formée tient tant que le profil reste chargé, d'autant mieux qu'elle est étendue
        var vh = sp.c * geo.ventH * smooth01((acl - 0.3) / 0.5) * (1 + 0.5 * S.nDry);
        if (depth <= 0) sp.wet += (0 - sp.wet) * expK(dt, 0.02);
        else if (depth < vd && sp.kind === 0) sp.wet += (0 - sp.wet) * expK(dt, geo.ventT);
        else if (depth > Math.max(0.25 * sp.c, vd * 1.3, vh)) sp.wet += (1 - sp.wet) * expK(dt, S.breachT < 1.2 ? 0.50 : 0.10);
        if (depth > 0) { var e16 = 16 * (depth / sp.c) * (depth / sp.c); kf = sp.wet * (1 + e16) / (2 + e16); }
        else kf = 0;
      }
      if (sp.kind === 0 && sp.wet < 0.5) breach++;
      // vitesse de la tranche par rapport à l'eau
      vx = vOx + (wwy * rwz - wwz * rwy) - _ux; vy = vOy + (wwz * rwx - wwx * rwz) - _uy; vz = vOz + (wwx * rwy - wwy * rwx) - _uz;
      var bx = r00 * vx + r10 * vy + r20 * vz, by = r01 * vx + r11 * vy + r21 * vz, bz = r02 * vx + r12 * vy + r22 * vz;
      var e = sp.e, nn = sp.n;
      var ve = bx * e[0] + by * e[1] + bz * e[2], vn = bx * nn[0] + by * nn[1] + bz * nn[2];
      var U2 = ve * ve + vn * vn;
      if (U2 < 1e-4) { sp.cl = 0; sp.lp = 0; continue; }
      var U = Math.sqrt(U2);
      var al = Math.atan2(-vn, ve);
      if (sp.kind === 1) al -= S.downwash;
      polar(al, sp.pol);
      sp.cl = _cl;
      if (sp.kind === 0) sp.lp = 0.5 * U2 * Math.abs(_cl) / G;            // dépression d'extrados, en mètres d'eau
      if (sp.kind === 2 ? kf < 1e-4 : depth <= 0) continue;
      var qS = 0.5 * RHO_W * U2 * sp.S * kf;
      var me = ve / U, mn = vn / U;
      // traînée : celle du profil suit la portance (kf) ; s'y ajoutent le frottement de la partie mouillée
      // que l'effet de surface ne réduit pas, et la traînée de poche d'une tranche ventilée encore immergée
      var cdx = sp.kind === 2 ? 0 : (sp.wet - kf) * sp.pol.cd0 + (1 - sp.wet) * geo.ventCd;
      var qD = 0.5 * RHO_W * U2 * sp.S * cdx;
      var fe = qS * (-_cl * mn - _cd * me) - qD * me, fn = qS * (_cl * me - _cd * mn) - qD * mn;
      var fbx = fe * e[0] + fn * nn[0], fby = fe * e[1] + fn * nn[1], fbz = fe * e[2] + fn * nn[2];
      fwx = r00 * fbx + r01 * fby + r02 * fbz; fwy = r10 * fbx + r11 * fby + r12 * fbz; fwz = r20 * fbx + r21 * fby + r22 * fbz;
      Fx += fwx; Fy += fwy; Fz += fwz;
      Tx += rwy * fwz - rwz * fwy; Ty += rwz * fwx - rwx * fwz; Tz += rwx * fwy - rwy * fwx;
      if (sp.kind === 0) { clS += _cl * sp.S * kf; if (_st > stall && U > 1.5) stall = _st; liftN += fby; }
    }
    S.downwash += (geo.dwK * clS / geo.gear.wing.S - S.downwash) * expK(dt, 0.05);
    // sortie complète du foil : l'air aspiré met du temps à se résorber, la portance revient lentement
    if (breach >= 6) { if (S.breachT > 1.2) S.events.push({ type: 'breach', t: S.t }); S.breachT = 0; } else S.breachT += dt;
    S.nDry = breach;

    // fuselage : traînée seule
    rwx = r00 * (geo.xMast - 0.1) + r01 * geo.yFoil; rwy = r10 * (geo.xMast - 0.1) + r11 * geo.yFoil; rwz = r20 * (geo.xMast - 0.1) + r21 * geo.yFoil;
    S.wave(Ox + rwx, Oz + rwz, Oy + rwy);
    if (_eta - (Oy + rwy) > 0) {
      vx = vOx + (wwy * rwz - wwz * rwy) - _ux; vy = vOy + (wwz * rwx - wwx * rwz) - _uy; vz = vOz + (wwx * rwy - wwy * rwx) - _uz;
      var vfm = Math.sqrt(vx * vx + vy * vy + vz * vz), kfu = -0.5 * RHO_W * geo.fuseCdA * vfm;
      fwx = kfu * vx; fwy = kfu * vy; fwz = kfu * vz;
      Fx += fwx; Fy += fwy; Fz += fwz;
      Tx += rwy * fwz - rwz * fwy; Ty += rwz * fwx - rwx * fwz; Tz += rwx * fwy - rwy * fwx;
    }

    // pumping de la planche : le travail des jambes est converti en poussée par le foil battant
    // (modèle énergétique : poussée = rendement × puissance des jambes / vitesse)
    var pumpT = 0;
    if (liftN > 50) {
      var pw = liftN * S.sVel;                      // puissance fournie quand on pousse (extension)
      if (pw > 0) {
        pumpT = geo.pumpEta * Math.min(pw, 900) / Math.max(Vh, 1.5);
        rwx = r00 * geo.xWing + r01 * geo.yFoil; rwy = r10 * geo.xWing + r11 * geo.yFoil; rwz = r20 * geo.xWing + r21 * geo.yFoil;
        fwx = pumpT * fhx; fwz = pumpT * fhz;
        Fx += fwx; Fz += fwz;
        Tx += rwy * fwz; Ty += rwz * fwx - rwx * fwz; Tz += -rwy * fwx;
      }
    }

    // ---------- coque ----------
    var hull = geo.hull, nh = hull.length, support = 0, wetA = 0, mx = 0, my = 0, mz = 0;
    var upx = r01, upy = r11, upz = r21, rtx = r02, rty = r12, rtz = r22, Tb = geo.T, noseDepth = 0;
    for (i = 0; i < nh; i++) {
      var hp = hull[i];
      rwx = r00 * hp.x + r01 * hp.y + r02 * hp.z;
      rwy = r10 * hp.x + r11 * hp.y + r12 * hp.z;
      rwz = r20 * hp.x + r21 * hp.y + r22 * hp.z;
      px = Ox + rwx; py = Oy + rwy; pz = Oz + rwz;
      // la coque n'est en jeu que près de la surface : test rapide avant le calcul complet
      if (py - etaO > 1.6) continue;
      S.wave(px, pz, py);
      depth = _eta - py;
      if (depth <= 0) continue;
      if (i >= nh - 3 && depth > noseDepth) noseDepth = depth;
      var sub = depth < Tb ? depth : Tb;
      vx = vOx + (wwy * rwz - wwz * rwy) - _ux; vy = vOy + (wwz * rwx - wwx * rwz) - _uy; vz = vOz + (wwx * rwy - wwy * rwx) - _uz;
      var vnOut = -(vx * upx + vy * upy + vz * upz);
      var spd = Math.sqrt(vx * vx + vy * vy + vz * vz);
      var fbu = RHO_W * G * hp.A * sub;
      var fnr = RHO_W * hp.A * geo.kPlane * (vnOut > 0 ? vnOut : 0) * spd + geo.cHeave * hp.A * vnOut;
      if (fnr < -0.5 * fbu) fnr = -0.5 * fbu;
      var wetF = depth < 0.03 ? depth / 0.03 : 1;
      var vtx = vx + vnOut * upx, vty = vy + vnOut * upy, vtz = vz + vnOut * upz;
      var vt = Math.sqrt(vtx * vtx + vty * vty + vtz * vtz);
      var cf = 0.5 * RHO_W * geo.Cf * hp.A * wetF * vt;
      var vlat = vx * rtx + vy * rty + vz * rtz;
      var flat = -0.5 * RHO_W * geo.Clat * hp.Alat * (sub / Tb) * Math.abs(vlat) * vlat;
      fwx = fnr * upx - cf * vtx + flat * rtx;
      fwy = fbu + fnr * upy - cf * vty + flat * rty;
      fwz = fnr * upz - cf * vtz + flat * rtz;
      Fx += fwx; Fy += fwy; Fz += fwz;
      Tx += rwy * fwz - rwz * fwy; Ty += rwz * fwx - rwx * fwz; Tz += rwx * fwy - rwy * fwx;
      support += fbu + fnr * upy;
      var wA = hp.A * wetF; wetA += wA; mx += rwx * wA; my += rwy * wA; mz += rwz * wA;
    }
    // vitesse de la planche par rapport à l'eau de surface
    var vRx = vOx - uOx, vRy = vOy - uOy, vRz = vOz - uOz;
    // Planche de faible volume : si le pont s'enfonce, les jambes du rider flottent aussi
    // (départ « sinker » : la planche reste sous l'eau tant qu'on n'avance pas).
    var legDepth = etaO - Oy - 0.02;
    if (legDepth > 0) {
      var fLeg = RHO_W * G * 0.035 * Math.min(legDepth, 0.9) - 900 * 0.035 * vRy;
      if (fLeg > 0) { Fy += fLeg; support += fLeg; }
      var vOm = Math.sqrt(vRx * vRx + vRz * vRz), kLeg = -0.5 * RHO_W * 1.0 * 0.11 * Math.min(legDepth, 0.9) * vOm;   // les jambes freinent
      Fx += kLeg * vRx; Fz += kLeg * vRz;
    }
    var vOh = Math.sqrt(vRx * vRx + vRz * vRz);
    if (support > 1 && wetA > 0 && vOh > 0.05) {
      var Fn = vOh / Math.sqrt(G * geo.gear.board.L);
      var cw = 0.105 * Math.exp(-Math.pow((Fn - 0.65) / 0.25, 2)) + 0.035 * smooth01((Fn - 0.3) / 0.7);
      var Dw = support * cw;
      fwx = -Dw * vRx / vOh; fwz = -Dw * vRz / vOh;
      mx /= wetA; my /= wetA; mz /= wetA;
      Fx += fwx; Fz += fwz;
      Tx += my * fwz; Ty += mz * fwx - mx * fwz; Tz += -my * fwx;
    }

    // ---------- 4. Wing et traînée aérodynamique du rider ----------
    S.windAt(Ox, Oz);
    var wxw = S._wx, wzw = S._wz;
    var hx = S.cx + 0.28 * (1 - 0.5 * ks) + S.fa, hy = (1.28 - 0.48 * ks) + 0.42 * Math.sin(S.eps), hz = S.sigma * (0.28 + 0.30 * Math.cos(S.eps));
    var hwx = n00 * hx + n01 * hy + n02 * hz, hwy = n10 * hx + n11 * hy + n12 * hz, hwz = n20 * hx + n21 * hy + n22 * hz;
    // vitesse des bras (pumping) : en bordant, la wing est tirée vers l'arrière, le bas et les hanches
    // (au retour, on choque surtout en ouvrant la main arrière : la wing repart moins vite qu'elle n'est venue)
    var sv = clamp(S.sheetRate * geo.pumpLs, -geo.pumpVback, geo.pumpVmax);
    var pd = geo.pumpDir, sbx = pd[0] * sv, sby = pd[1] * sv, sbz = pd[2] * S.sigma * sv;
    var swx = n00 * sbx + n01 * sby + n02 * sbz, swy = n10 * sbx + n11 * sby + n12 * sbz, swz = n20 * sbx + n21 * sby + n22 * sbz;
    var vhx = vOx + (wny * hwz - wnz * hwy) + swx, vhy = vOy + (wnz * hwx - wnx * hwz) + swy, vhz = vOz + (wnx * hwy - wny * hwx) + swz;
    var Ax = wxw - vhx, Ay = -vhy, Az = wzw - vhz;
    var Ah = Math.sqrt(Ax * Ax + Az * Az), Am = Math.sqrt(Ax * Ax + Ay * Ay + Az * Az);
    var Fwx = 0, Fwy = 0, Fwz = 0, wCl = 0, wAlpha = 0, wStall = 0, tipDepth = 0;
    var lx = 0, ly = 1, lz = 0, axn = 0, ayn = 0, azn = 1;
    var windSide = S.sigma;
    // sur-portance dynamique : monte pendant la traction, retombe en un dixième de seconde
    var dynT = flipActive ? 0 : geo.pumpBonus * smooth01(sv / geo.pumpV0);
    S.dynB += (dynT - S.dynB) * expK(dt, dynT > S.dynB ? 0.02 : geo.pumpTau);
    if (Am > 0.3 && Ah > 0.1) {
      axn = Ax / Am; ayn = Ay / Am; azn = Az / Am;
      var ce = Math.cos(S.eps), se = Math.sin(S.eps);
      lx = ce * S.sigma * Az / Ah; ly = se; lz = -ce * S.sigma * Ax / Ah;
      var dl = lx * axn + ly * ayn + lz * azn;
      lx -= dl * axn; ly -= dl * ayn; lz -= dl * azn;
      var ll = Math.sqrt(lx * lx + ly * ly + lz * lz) || 1;
      lx /= ll; ly /= ll; lz /= ll;
      var alphaSet = flipActive ? 5 * DEG : S.sheet * geo.alphaFull;
      var dA = Math.atan2(-(swx * lx + swy * ly + swz * lz), Am) * smooth01(S.sheet / 0.15);
      wAlpha = flipActive ? alphaSet : Math.max(0, alphaSet + dA);
      polar(wAlpha, geo.wpol, S.dynB);
      wCl = _cl; wStall = _st;
      var qSw = 0.5 * RHO_A * Am * Am * geo.wS;
      Fwx = qSw * (_cl * lx + _cd * axn); Fwy = qSw * (_cl * ly + _cd * ayn); Fwz = qSw * (_cl * lz + _cd * azn);
      // bout d'aile dans l'eau
      var sy = azn * lx - axn * lz;                         // composante verticale de l'envergure (â × l̂)
      var tipY = Oy + hwy - 0.5 * geo.wSpan * Math.abs(sy);
      tipDepth = S.eta(Ox + hwx, Oz + hwz) - tipY;
      if (tipDepth > 0) {
        var vhm = Math.sqrt(vhx * vhx + vhz * vhz);
        var kt = -0.5 * RHO_W * 1.0 * 0.25 * Math.min(tipDepth, 0.6) * vhm;
        Fwx += kt * vhx; Fwz += kt * vhz;
      }
      windSide = (Ax * rhx + Az * rhz) > 0 ? 1 : -1;        // +1 : l'air va vers tribord (vent de bâbord)
    }
    var Arx = wxw - S.v[0], Ary = -S.v[1], Arz = wzw - S.v[2];
    var Arm = Math.sqrt(Arx * Arx + Ary * Ary + Arz * Arz);
    var kdr = 0.5 * RHO_A * geo.riderCdA * (1 - 0.33 * ks) * Arm;
    var Fdx = kdr * Arx, Fdy = kdr * Ary, Fdz = kdr * Arz;

    // moments de la wing par rapport à O (monde)
    var Tax = hwy * Fwz - hwz * Fwy, Tay = hwz * Fwx - hwx * Fwz, Taz = hwx * Fwy - hwy * Fwx;

    // ---------- 5. Réflexes du rider ----------
    // passage au repère planche
    var Fhbx = r00 * Fx + r10 * Fy + r20 * Fz, Fhby = r01 * Fx + r11 * Fy + r21 * Fz, Fhbz = r02 * Fx + r12 * Fy + r22 * Fz;
    var Thbx = r00 * Tx + r10 * Ty + r20 * Tz, Thby = r01 * Tx + r11 * Ty + r21 * Tz, Thbz = r02 * Tx + r12 * Ty + r22 * Tz;
    var Fabx = r00 * Fwx + r10 * Fwy + r20 * Fwz, Faby = r01 * Fwx + r11 * Fwy + r21 * Fwz, Fabz = r02 * Fwx + r12 * Fwy + r22 * Fwz;
    var Tabx = r00 * Tax + r10 * Tay + r20 * Taz, Taby = r01 * Tax + r11 * Tay + r21 * Taz;

    // fraction de vol : 0 = porté par la coque, 1 = porté par le foil
    var fraw = clamp(1 - support / (0.35 * Wt), 0, 1);
    S.foilFrac += (fraw - S.foilFrac) * expK(dt, 0.15);
    var foil = S.foilFrac;
    var boardH = Oy - Tb - etaO;                            // hauteur du dessous de planche au-dessus de l'eau
    // vitesse verticale par rapport à la surface (sur la houle, la surface bouge aussi)
    var hRaw = S.hPrev === null ? 0 : clamp((boardH - S.hPrev) / dt, -8, 8);
    S.hPrev = boardH;
    S.hRate += (hRaw - S.hRate) * expK(dt, 0.04);

    // --- consigne d'assiette (tangage)
    var lean = clamp(u.lean || 0, -1, 1) * (1 - 0.7 * ks);
    if (foil > 0.5) {
      if (A.trimK > 0) {
        var dTh = -A.trimK * (S.hRate + lean * 0.9);        // manche = taux de montée demandé
        if (A.heightK > 0) dTh += A.heightK * (A.hTarget * geo.gear.mast.len - boardH) * (1 - Math.abs(lean));
        S.thetaI = clamp(S.thetaI + dTh * dt, -6 * DEG, 11 * DEG);
      } else S.thetaI += (0 - S.thetaI) * expK(dt, 0.5);
    } else S.thetaI += (0 - S.thetaI) * expK(dt, 0.8);
    var thetaCmd = S.thetaI - lean * (lean > 0 ? 6.5 : 9) * DEG;

    // --- consigne de gîte (roulis)
    // La force latérale de la wing est reprise en partie par l'inclinaison du foil (contre-gîte),
    // en partie par le mât (légère dérive), le corps du rider se penchant au vent pour équilibrer.
    // Quand le corps arrive en butée, la planche gîte davantage.
    var rollIn = clamp(u.roll || 0, -1, 1) * (1 - 0.75 * ks);
    var Ylat = Fwx * rhx + Fwz * rhz;
    var Tfwd = (Fwx + Fdx) * fhx + (Fwz + Fdz) * fhz;
    var Fvert = Wt - Fwy;
    var czMaxW = (heelside ? 0.55 : 0.40) * (1 - 0.6 * ks);
    var kHt = 0.5 + 0.45 * smooth01((Math.abs(S.cz) / czMaxW - 0.75) / 0.25);
    S.kHeel += (kHt - S.kHeel) * expK(dt, 0.5);
    var phiFFt = clamp(-S.kHeel * Math.atan2(Ylat, Math.max(Fvert, 250)), -24 * DEG, 24 * DEG) * foil;
    S.phiFF += (phiFFt - S.phiFF) * expK(dt, A.leanTau);
    var Ybeta = 0.5 * RHO_W * Vh * Vh * mastSub * geo.gear.mast.chord * 3.2;            // N par radian de dérive
    var bDesT = Ybeta > 200 ? clamp((1 - S.kHeel) * Ylat / Ybeta, -5 * DEG, 5 * DEG) * foil : 0;
    S.betaDes += (bDesT - S.betaDes) * expK(dt, 0.3);
    if (foil > 0.5 && A.rollTrimK > 0) {
      S.phiI = clamp(S.phiI - A.rollTrimK * (psiDot - rollIn * 1.1) * dt, -12 * DEG, 12 * DEG);
    } else S.phiI += (0 - S.phiI) * expK(dt, 0.8);
    // contre-gîte d'équilibre (limitée) + carre demandée par le joueur
    var phiCmd = clamp(clamp(S.phiFF + S.phiI, -30 * DEG, 30 * DEG) + rollIn * 30 * DEG * (0.25 + 0.75 * foil), -46 * DEG, 46 * DEG);

    // --- tangage : la planche pivote sous les pieds ; le rider déplace son centre de pression
    var Kp = 2600, Kd = 230;
    var Mdes = Kp * (thetaCmd - theta) - Kd * wz;
    var Mh = Thbz, Fny = Fhby, Mfeet, xcp;
    // équilibre avant/arrière du corps face à la traction de la wing
    var Dl = clamp(Tfwd * (1.4 - 0.5 * ks) / Math.max(Fny, 300), -0.3, 0.9);
    S.leanBack += (clamp(Dl, -0.15, 0.55) - S.leanBack) * expK(dt, A.leanTau * 1.4);
    var imb = Dl - S.leanBack;
    var xLim = (switching ? 0.10 : 0.35) * (1 - 0.5 * ks);
    if (Fny > 60) {
      S.xff += (clamp(Mh / Fny, -0.7, 0.7) - S.xff) * expK(dt, A.reflexTau);
      xcp = clamp(S.xff - Mdes / Fny + 0.6 * imb, -xLim, xLim);
      Mfeet = -xcp * Fny + clamp(Mdes, -25, 25) * 0.4;
    } else {
      xcp = 0; S.xff += (0 - S.xff) * expK(dt, 0.2);
      Mfeet = clamp(Mdes, -30, 30);
    }
    S.xcp = xcp;
    S.xcpS += (xcp - S.xcpS) * expK(dt, 0.3);
    S.cx = clamp(S.xcpS - S.leanBack, -0.55, 0.35);
    var aPitch = (Mh + Mfeet) / geo.Iz;

    // --- roulis : tout le système tourne ; le rider déplace ses hanches (cz)
    var FyTot = Fhby + Faby;
    var tauX0 = Thbx + Tabx - cby * (Fhbz + Fabz);
    S.tauX0f += (tauX0 - S.tauX0f) * expK(dt, A.reflexTau + 0.35 * (1 - foil));
    var Kpr = 1500, Kdr = 340, gR = 0.25 + 0.75 * foil;
    var MdesR = (Kpr * (phiCmd - phi) - Kdr * wx) * gR;
    // Deux actionneurs : (a) l'appui talons/orteils, rapide mais limité à la longueur du pied ;
    // (b) l'inclinaison du corps (cz), ample mais lente.
    var czW = switching ? 0.14 : czMaxW, czL = (switching ? 0.10 : 0.25) * (1 - 0.6 * ks);
    var czLo = S.sigma > 0 ? -czW : -czL, czHi = S.sigma > 0 ? czL : czW;
    var tauNeed = MdesR - S.tauX0f;
    var czT = FyTot > 80 ? clamp(tauNeed / FyTot, czLo, czHi) : 0;
    var czRate = switching ? 0.4 : (heelside ? 0.8 : 0.6);
    var dcz2 = clamp((czT - S.cz) * expK(dt, 0.08), -czRate * dt, czRate * dt);
    S.cz += dcz2; S.czVel = dcz2 / dt;
    var zAnk = switching ? 0.04 : (heelside ? 0.11 : 0.09);
    var tauAnk = FyTot > 80 ? clamp(tauNeed - S.cz * FyTot, -zAnk * FyTot, zAnk * FyTot) : clamp(MdesR, -25, 25);
    S.ankle += (tauAnk - S.ankle) * expK(dt, 0.03);
    var aRoll = (tauX0 + cbz * FyTot + S.ankle) / geo.Ix;
    // Sur l'eau, tant que le foil ne porte pas : à genoux la planche est stable ; debout, c'est la vitesse
    // (ou la traction de la wing) qui la stabilise. Debout à l'arrêt, l'équilibre est précaire et se dégrade
    // avec le temps : il faut avancer, ou se remettre à genoux (séquence de départ complète uniquement).
    var precarious = S.fullStart && A.level !== 'assiste';
    var stab = Math.max(clamp((Vh - 0.8) / 1.4, 0, 1), 0.7 * clamp(S.wForceF / 120, 0, 1));
    var unst = precarious ? (1 - ks) * (1 - stab) * (1 - foil) : 0;
    var sup = precarious ? ks + (1 - ks) * (0.25 + 0.75 * stab) : 1;
    aRoll += (-2500 * sup * (phi - phiCmd * 0.5) - 520 * wx) * (1 - foil) / geo.Ix;
    if (unst > 0.25) S.standT = Math.min(8, S.standT + dt); else S.standT = Math.max(0, S.standT - 1.5 * dt);
    if (unst > 0.02) {
      var wob = unst * Math.min(1, 0.5 + S.standT / 6) * (A.level === 'expert' ? 1.25 : 1);
      aRoll += (wob * geo.wobK * (330 * Math.sin(2.3 * S.t + 0.7) + 200 * Math.sin(3.9 * S.t + 2.0) + 120 * Math.sin(6.1 * S.t)) + geo.wobIn * unst * rollIn) / geo.Ix;
    }

    // --- lacet : moments physiques + le rider aligne la planche sur sa trajectoire (à la dérive voulue près)
    var tauY = Thby + Taby - (cbz * (Fhbx + Fabx) - cbx * (Fhbz + Fabz));
    // dérapage mesuré par rapport à l'eau (dans la houle, l'eau se déplace : le rider sent l'écoulement, pas le fond)
    var bvx = S.v[0] - uOx, bvz = S.v[2] - uOz;
    var beta = Vh > 0.3 ? Math.atan2(bvx * rhx + bvz * rhz, bvx * fhx + bvz * fhz) : 0;
    var Kb = 2500 * clamp((Vh - 1) / 4, 0, 1) * (0.12 + 0.88 * foil);   // réflexe surtout utile en vol ; sur l'eau, on barre à la wing
    // amortissement sur la vitesse de dérapage (pas sur le taux de virage : un virage coordonné n'est pas freiné)
    var bDot = clamp((beta - S.betaPrev) / dt, -6, 6);
    S.betaPrev = beta;
    S.betaDot += (bDot - S.betaDot) * expK(dt, 0.03);
    // le rider ajuste peu à peu son cap pour obtenir la dérive voulue (action intégrale lente)
    // — seulement en route stable : dans un virage ou une manœuvre, il relâche ce réglage
    if (foil > 0.5 && Vh > 2 && Math.abs(rollIn) < 0.35 && Math.abs(psiDot) < 0.3 && !flipActive) {
      S.betaI = clamp(S.betaI + geo.betaKi * (beta - S.betaDes) * dt, -4 * DEG, 4 * DEG);
    } else S.betaI += (0 - S.betaI) * expK(dt, 0.4);
    tauY += -Kb * (beta - S.betaDes + S.betaI) - 0.096 * Kb * S.betaDot - (25 + 2 * Vh + 130 * (1 - foil)) * wy - 70 * rollIn * (1 - 0.6 * foil) * clamp(Vh / 1.5, 0.3, 1);
    var aYaw = tauY / geo.Iy;

    // perturbation pendant le changement de pieds
    if (switching) {
      var ph = S.t * 9.0;
      aPitch += 1.2 * Math.sin(ph * 1.7 + 0.5); aRoll += 0.35 * Math.sin(ph + 1.1);
    }

    // ---------- 6. Intégration ----------
    var ax = (Fx + Fwx + Fdx) / M, ay = (Fy + Fwy + Fdy) / M - G, az = (Fz + Fwz + Fdz) / M;
    if (S.tow) { ax += S.tow[0] * fhx / M; az += S.tow[0] * fhz / M; ay += S.tow[1] / M; }   // banc d'essai (remorquage)
    S.v[0] += ax * dt; S.v[1] += ay * dt; S.v[2] += az * dt;
    S.p[0] += S.v[0] * dt; S.p[1] += S.v[1] * dt; S.p[2] += S.v[2] * dt;
    wx += aRoll * dt; wy += aYaw * dt; wz += aPitch * dt;
    S.w[0] = wx; S.w[1] = wy; S.w[2] = wz;
    var hdt = 0.5 * dt;
    var nqw = qw + hdt * (-qx * wx - qy * wy - qz * wz);
    var nqx = qx + hdt * (qw * wx + qy * wz - qz * wy);
    var nqy = qy + hdt * (qw * wy + qz * wx - qx * wz);
    var nqz = qz + hdt * (qw * wz + qx * wy - qy * wx);
    var qn = Math.sqrt(nqw * nqw + nqx * nqx + nqy * nqy + nqz * nqz);
    q[0] = nqw / qn; q[1] = nqx / qn; q[2] = nqy / qn; q[3] = nqz / qn;

    // ---------- 7. États, événements, chutes ----------
    if (!S.flying && foil > 0.8 && boardH > 0.03) {
      S.flying = true; S.airT = 0;
      if (A.liftoffTrim) S.thetaI = clamp(theta - 1.5 * DEG, 0, 8 * DEG);
      S.events.push({ type: 'takeoff', t: S.t, speed: Vh });
    } else if (S.flying && foil < 0.35) {
      S.flying = false;
      S.events.push({ type: 'touchdown', t: S.t, speed: Vh, air: S.airT });
    }
    if (S.flying) S.airT += dt;

    // auto-retournement de la wing et changement de pieds automatique (assistance)
    var wrongSide = (windSide !== S.sigma) && Ah > 2.0;
    if (wrongSide) S.wrongT += dt; else S.wrongT = 0;
    if (A.autoFlip && S.wrongT > 0.12 && S.flipT <= 0) { S.flipDur = 0.45; S.flipT = S.flipDur; }
    if (A.autoFeet && !heelside && ks < 0.05 && S.feetT <= 0 && S.flipT <= 0 && S.wrongT === 0 && Math.abs(phi - phiCmd) < 8 * DEG && Math.abs(wx) < 0.3) {
      S.feetDur = 0.6; S.feetT = S.feetDur;
    }

    // détection de virement / empannage : le vent réel passe d'un bord à l'autre
    var twaS = wrapPi(S._wd - psi);                         // > 0 : vent venant de tribord
    var tackSide = twaS < 0 ? 1 : -1;                       // +1 : vent de bâbord
    if (tackSide !== S.lastTackSide && Math.abs(twaS) > 12 * DEG && Math.abs(twaS) < 168 * DEG) {
      S.events.push({ type: Math.abs(twaS) < 90 * DEG ? 'tack' : 'jibe', t: S.t, flying: S.flying, speed: Vh });
      S.lastTackSide = tackSide;
    }

    // retombée de la planche sur l'eau : trop violente (après une sortie du foil) ou nez en avant = chute
    var onHull = support > 0.25 * Wt;
    if (onHull && !S.onHull && Vh > 3) {
      var vImp = -S.hRate, vMax = 2.3 + 1.0 * clamp((geo.sMax - S.s) / (geo.sMax - geo.sMin), 0, 1);   // jambes fléchies : on amortit mieux
      if (vImp > vMax) S.crash('impact');
      else if (theta < -7 * DEG && Vh > 3.5) S.crash('enfournement');
    }
    S.onHull = onHull;

    // obstacles du plan d'eau (îles, rochers, jetée, bateaux)
    var obs = S.obstacles, hitObs = false;
    if (obs.length) {
      for (i = 0; i < obs.length; i++) {
        var ob1 = obs[i], odx = Ox - ob1.x, odz = Oz - ob1.z, od2 = odx * odx + odz * odz, rb = ob1.rm || ob1.r;
        if (od2 > rb * rb) continue;
        var ro1 = obstacleR(ob1, odx, odz);
        if (od2 < ro1 * ro1) { hitObs = true; break; }
      }
    }

    // chutes
    var force = Math.sqrt(Fwx * Fwx + Fwy * Fwy + Fwz * Fwz);
    S.wForce = force;
    S.wForceF += (force - S.wForceF) * expK(dt, geo.armTau);
    if (hitObs) S.crash('obstacle');
    else if (Math.abs(phi) > 65 * DEG) S.crash(phi * S.sigma > 0 ? 'arrache' : 'chute_au_vent');
    else if (unst > 0.15 && Math.abs(phi) > 27 * DEG) S.crash('equilibre');
    else if (theta > 45 * DEG) S.crash('cabrage');
    else if (theta < -35 * DEG) S.crash('enfournement');
    else if (noseDepth > 0.14 && Vh > 2.5 && theta < -4 * DEG) S.crash('enfournement');
    else if (Oy - etaO < -0.75) S.crash('coule');
    else if (tipDepth > 0.25 && Vh > 4) S.crash('bout_de_wing');
    else {
      if (imb > 0.42) S.imbT += dt; else S.imbT = Math.max(0, S.imbT - dt);
      if (S.imbT > 0.6) S.crash('surpuissance');
      if (wrongSide && force > 110 && !flipActive) S.backT += dt; else S.backT = Math.max(0, S.backT - 2 * dt);
      if (S.backT > 0.9) S.crash('wing_a_contre');
    }

    // ---------- 8. Télémétrie ----------
    var tel = S.tel;
    tel.t = S.t;
    tel.O = [Ox, Oy, Oz];
    tel.speed = Vh; tel.speedKn = Vh / KN; tel.vy = S.hRate; tel.vyAbs = vOy;
    tel.heading = psi; tel.pitch = theta; tel.roll = phi;
    tel.thetaCmd = thetaCmd; tel.phiCmd = phiCmd;
    tel.boardH = boardH; tel.eta = etaO;
    tel.foilDepth = S.eta(Ox + r00 * geo.xWing + r01 * geo.yFoil, Oz + r20 * geo.xWing + r21 * geo.yFoil) - (Oy + r10 * geo.xWing + r11 * geo.yFoil);
    tel.mast = geo.gear.mast.len;
    tel.rideFrac = clamp(boardH / geo.gear.mast.len, -0.2, 1.2);
    tel.foil = foil; tel.flying = S.flying; tel.support = support;
    tel.tws = S._ws; tel.twd = S._wd; tel.twa = twaS;
    tel.aws = Ah; tel.awa = Math.atan2(-(Ax * rhx + Az * rhz), -(Ax * fhx + Az * fhz));   // d'où vient le vent apparent, relatif au nez (+ tribord)
    tel.sheet = S.sheet; tel.wingAlpha = wAlpha; tel.wingCl = wCl; tel.wingStall = wStall;
    tel.wingForce = force; tel.drive = Fwx * fhx + Fwz * fhz; tel.side = Ylat; tel.wingLift = Fwy;
    tel.eps = S.eps; tel.fa = S.fa; tel.sigma = S.sigma; tel.stance = S.stance; tel.heelside = heelside;
    tel.windSide = windSide; tel.wrongSide = wrongSide;
    tel.flipT = S.flipT; tel.flipDur = S.flipDur; tel.feetT = S.feetT; tel.feetDur = S.feetDur;
    tel.xcp = xcp; tel.frontFoot = clamp(0.5 + xcp / (2 * geo.xFoot), 0, 1);
    tel.cz = S.cz; tel.czSat = (FyTot > 80) && (S.cz <= czLo + 0.005 || S.cz >= czHi - 0.005);
    tel.ankle = FyTot > 80 ? S.ankle / (zAnk * FyTot) : 0;
    tel.cx = S.cx; tel.legs = S.s; tel.leanBack = S.leanBack; tel.imb = imb;
    tel.stall = stall; tel.breach = breach; tel.liftFoil = liftN;
    tel.tipDepth = tipDepth; tel.beta = beta; tel.betaDes = S.betaDes; tel.kHeel = S.kHeel; tel.psiDot = psiDot;
    tel.pumpT = pumpT; tel.dynB = S.dynB;
    tel.overpower = S.sheetCap < 0.985; tel.sheetCap = S.sheetCap; tel.Fhold = Fhold; tel.wingForceF = S.wForceF;
    tel.lift = [lx, ly, lz]; tel.app = [axn, ayn, azn];
    tel.hand = [hwx, hwy, hwz];
    tel.wind = [wxw, 0, wzw];
    tel.hydroDrag = -(Fx * S.v[0] + Fz * S.v[2]) / (Vh > 0.1 ? Vh : 0.1);
    tel.posture = S.posture; tel.kn = S.kn; tel.knT = S.knT; tel.mountT = 0; tel.unstable = unst;
    tel.crashed = S.crashed;
    if (S.debug) {
      tel.dbg = { tauX0: tauX0, FyTot: FyTot, MdesR: MdesR, Thbx: Thbx, Tabx: Tabx, cby: cby, Fhbz: Fhbz, Fabz: Fabz, Faby: Faby,
                  phiFF: S.phiFF, phiI: S.phiI, thetaI: S.thetaI, Mh: Mh, Fny: Fny, Mdes: Mdes, tauY: tauY, Thby: Thby, Taby: Taby,
                  Fhbx: Fhbx, Fabx: Fabx, cbx: cbx, cbz: cbz, czT: czT, hz: hz, hy: hy, hx: hx, xff: S.xff,
                  aRoll: aRoll, aYaw: aYaw, aPitch: aPitch, wx: wx, wy: wy, wz: wz, vO: [vOx, vOy, vOz], Fhby: Fhby, Ybeta: Ybeta, uO: [uOx, uOy, uOz] };
    }
  };

  // Télémétrie minimale quand la dynamique ne tourne pas (reset, chute, dans l'eau)
  FoilSim.prototype.updateTelemetryOnly = function () {
    var S = this, geo = S.geo, q = S.q, qw = q[0], qx = q[1], qy = q[2], qz = q[3];
    var r00 = 1 - 2 * (qy * qy + qz * qz), r10 = 2 * (qx * qy + qw * qz), r20 = 2 * (qx * qz - qw * qy);
    var r11 = 1 - 2 * (qx * qx + qz * qz), r12 = 2 * (qy * qz - qw * qx);
    var psi = Math.atan2(r00, -r20), theta = Math.asin(clamp(r10, -1, 1)), phi = Math.atan2(-r12, r11);
    var sps = Math.sin(psi), cps = Math.cos(psi), sph = Math.sin(phi), cph = Math.cos(phi);
    var ks = smooth01(S.kn), cyS = geo.cy0 + geo.mu * (S.s - geo.sMax), cx = S.cx, cy = cyS + (geo.cyKneel - cyS) * ks;
    var Ox = S.p[0] - (sps * cx + cps * sph * cy);
    var Oy = S.p[1] - (cph * cy);
    var Oz = S.p[2] - (-cps * cx + sps * sph * cy);
    S.windAt(Ox, Oz);
    var tel = S.tel, Vh = Math.sqrt(S.v[0] * S.v[0] + S.v[2] * S.v[2]), e0 = S.eta(Ox, Oz);
    tel.t = S.t; tel.O = [Ox, Oy, Oz];
    tel.speed = Vh; tel.speedKn = Vh / KN; tel.vy = 0; tel.vyAbs = S.v[1];
    tel.heading = psi; tel.pitch = theta; tel.roll = phi;
    tel.boardH = Oy - geo.T - e0; tel.eta = e0;
    tel.mast = geo.gear.mast.len;
    tel.rideFrac = clamp(tel.boardH / tel.mast, -0.2, 1.2);
    tel.foil = S.foilFrac; tel.flying = S.flying;
    tel.tws = S._ws; tel.twd = S._wd; tel.twa = wrapPi(S._wd - psi);
    if (tel.aws === undefined) {
      tel.aws = S._ws; tel.awa = tel.twa; tel.sheet = S.sheet; tel.wingForce = 0; tel.drive = 0; tel.side = 0; tel.wingLift = 0;
      tel.wingAlpha = 0; tel.wingCl = 0; tel.wingStall = 0; tel.xcp = 0; tel.frontFoot = 0.5; tel.cz = 0; tel.czSat = false;
      tel.stall = 0; tel.breach = 0; tel.tipDepth = 0; tel.wrongSide = false; tel.imb = 0; tel.liftFoil = 0; tel.support = 0;
      tel.lift = [0, 1, 0]; tel.app = [0, 0, 1]; tel.hand = [0, 1.5, 0]; tel.thetaCmd = 0; tel.phiCmd = 0; tel.beta = 0; tel.psiDot = 0;
      tel.foilDepth = 0; tel.hydroDrag = 0; tel.leanBack = 0; tel.betaDes = 0; tel.kHeel = 0.5; tel.pumpT = 0; tel.dynB = 0; tel.unstable = 0;
      tel.overpower = false;
    }
    tel.eps = S.eps; tel.fa = S.fa; tel.sigma = S.sigma; tel.stance = S.stance; tel.heelside = (S.sigma === S.stance);
    tel.windSide = S.sigma; tel.flipT = S.flipT; tel.flipDur = S.flipDur; tel.feetT = S.feetT; tel.feetDur = S.feetDur;
    tel.cx = S.cx; tel.legs = S.s; tel.wind = [S._wx, 0, S._wz];
    tel.posture = S.posture; tel.kn = S.kn; tel.knT = S.knT; tel.mountT = S.mountT;
    tel.crashed = S.crashed;
  };

  FoilSim.prototype.drainEvents = function () { var e = this.events; this.events = []; return e; };

  // ------------------------------------------------------------------
  // Essai de décollage standard (plan d'eau plat, vent régulier, départ debout, sans pomper) :
  // sert à estimer le vent minimal d'un matériel donné. Renvoie { ok, t, v } (temps et vitesse de décollage).
  // ------------------------------------------------------------------
  function takeoffTest(spec, kn, T) {
    var sim = new FoilSim({ gear: spec });
    sim.env.windSpeed = kn * KN; sim.env.gust = 0; sim.env.shift = 0; sim.env.chop = 0; sim.env.swellH = 0;
    sim.reset({});
    var dt = 1 / 480, t = 0, tTake = -1, vTake = 0, u = { sheet: 0.8, lean: 0, wingFA: 0 }, i, ev;
    T = T || 40;
    while (t < T && !sim.crashed) {
      var s = sim.tel;
      if (s.flying) { u.lean = clamp(1.2 * (s.boardH - 0.5 * s.mast) + 0.9 * (s.vy || 0), -1, 1); u.sheet = 0.7; u.wingFA = 0; }
      else { u.sheet = 0.8; u.wingFA = clamp(0.08 * (95 - Math.abs(s.twa) / DEG), -1, 1); u.lean = s.speed > 0.93 * sim.geo.vStall ? -1 : 0; }
      sim.step(dt, u); t += dt;
      if (sim.events.length) {
        ev = sim.drainEvents();
        for (i = 0; i < ev.length; i++) if (ev[i].type === 'takeoff' && tTake < 0) { tTake = t; vTake = ev[i].speed; }
      }
      if (tTake >= 0 && t > tTake + 5) break;
    }
    return { ok: tTake >= 0 && sim.tel.flying && !sim.crashed, t: tTake, v: vTake };
  }

  return {
    FoilSim: FoilSim, GEAR: GEAR, CUSTOM_DEFAULT: CUSTOM_DEFAULT, CUSTOM_RANGE: CUSTOM_RANGE, customGear: customGear,
    makeAssist: makeAssist, buildGeometry: buildGeometry, takeoffTest: takeoffTest,
    DEG: DEG, KN: KN, G: G, RHO_W: RHO_W, RHO_A: RHO_A,
    clamp: clamp, wrapPi: wrapPi, smooth01: smooth01, polar: function (a, p) { polar(a, p); return { cl: _cl, cd: _cd, stall: _st }; }
  };
});
