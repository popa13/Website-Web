/*
 * Wing Foil Simulation — boucle de jeu, menu, plans d'eau, matériel, coach, statistiques, son (version 2)
 */
(function () {
  'use strict';
  var P = window.FoilPhysics, DEG = P.DEG, KN = P.KN;
  var KEY = 'foilgame.v2.reglages', KEY_V1 = 'foilgame.v1.reglages';
  var DEF = { assist: 'realiste', spot: 'baie', wind: 18, gust: 1, sea: 1, gear: 'freeride', custom: null, stance: 1, start: 'knees', sound: 1, coach: 1, help: 1 };
  var GUST = [[0, 0], [0.12, 4], [0.24, 8]];
  // état de la mer : clapot (amplitude), houle (hauteur creux-crête en m, période en s)
  var SEA = [
    { label: 'mer plate', chop: 0, H: 0, T: 5, hint: 'Eau plate : le meilleur terrain pour apprendre et pour aller vite.' },
    { label: 'clapot', chop: 0.10, H: 0, T: 5, hint: 'Clapot court d\'une vingtaine de centimètres : il secoue la planche sur l\'eau, le foil passe dessous en vol.' },
    { label: 'petite houle', chop: 0.04, H: 0.6, T: 4, hint: 'Houle de 60 cm toutes les 4 secondes, dans le lit du vent : elle te pousse au portant, il faut l\'accompagner en hauteur.' },
    { label: 'houle', chop: 0.06, H: 1.3, T: 5.5, hint: 'Houle formée de 1,3 m toutes les 5,5 secondes : des vagues à surfer au largue, et un foil qui sort vite dans les creux.' }
  ];
  var ASSIST = {
    assiste: ['Assisté', 'Le rider tient la hauteur et le cap tout seul ; il se lève, remonte sur la planche et change de mains et de pieds automatiquement. Pour découvrir.'],
    realiste: ['Réaliste', 'Tu gères la hauteur au pied avant / pied arrière, la puissance, le départ à genoux, le changement de mains et de pieds. Le rider garde son équilibre latéral.'],
    expert: ['Expert', 'Réflexes plus lents, aucun maintien de cap : tout se pilote, y compris l\'équilibre face à la traction de la wing.']
  };
  var START = {
    knees: 'La séquence complète : à genoux, wing en l\'air, on borde, on se lève une fois lancé. Après une chute, il faut remonter sur la planche.',
    standing: 'Départ debout sur la planche, retour automatique après une chute (comme en version 1).',
    flying: 'Départ déjà en vol, pour travailler directement le pilotage et les manœuvres.'
  };
  var CRASH = {
    arrache: 'Arraché sous le vent : trop de puissance dans la wing.',
    chute_au_vent: 'Chute au vent : la wing ne te retenait plus.',
    cabrage: 'Planche trop cabrée.',
    enfournement: 'Enfournement : le nez a planté.',
    coule: 'La planche a coulé sous toi.',
    bout_de_wing: 'Le bout de la wing a accroché l\'eau.',
    surpuissance: 'Arraché vers l\'avant par la wing.',
    wing_a_contre: 'Wing à contre : il fallait changer de mains.',
    impact: 'Le foil est sorti de l\'eau : retombée trop violente.',
    equilibre: 'Perte d\'équilibre : debout à l\'arrêt, la planche est trop instable.',
    obstacle: 'Échoué : le foil a touché le fond.'
  };

  // ---------------- plans d'eau ----------------
  // Positions en mètres autour du point de départ (x = est, z = sud). windDir : d'où vient le vent (degrés, 0 = nord).
  var SPOTS = {
    lagon: {
      label: 'Lagon', windDir: 100, wind: 16, gust: 0, sea: 0, swellOff: 0,
      desc: 'Lagon : eau plate et turquoise derrière la barrière de corail, alizé régulier. Un motu et ses cocotiers au vent, la passe balisée au sud.',
      pal: { skyH: [0.80, 0.91, 0.97], skyZ: [0.13, 0.48, 0.90], deep: [0.02, 0.44, 0.48], fog: [0.78, 0.90, 0.96], light: [0.25, 0.86, 0.30], cloud: 0 },
      coast: { seed: 1.7, col0: [0.15, 0.36, 0.30], col1: [0.30, 0.52, 0.40], arc: [150, 262], peak: 470, base: 30, amp: 0.8 },
      marks: [
        { t: 'island', x: 330, z: -210, r: 58, h: 3.4, kind: 'sand', palms: 10, seed: 1.3 },
        { t: 'island', x: -380, z: 300, r: 30, h: 2.4, kind: 'sand', palms: 4, seed: 4.1 },
        { t: 'reef', x: 640, z: 60, len: 620, dir: 5, seed: 2.2 },
        { t: 'boat', x: -170, z: -280, len: 12, sail: true, dir: 100 },
        { t: 'beacon', x: -60, z: 420, col: 'red' }, { t: 'beacon', x: 40, z: 440, col: 'green' }
      ]
    },
    baie: {
      label: 'Baie', windDir: 315, wind: 18, gust: 1, sea: 1, swellOff: 0,
      desc: 'Baie : clapot et vent de nord-ouest irrégulier, entre le phare de la pointe, sa jetée et les bateaux au mouillage.',
      pal: { skyH: [0.74, 0.86, 0.95], skyZ: [0.20, 0.47, 0.84], deep: [0.015, 0.20, 0.30], fog: [0.72, 0.84, 0.93], light: [0.45, 0.72, 0.35], cloud: 0.3 },
      coast: { seed: 0.7 },
      marks: [
        { t: 'island', x: 420, z: -380, r: 75, h: 10, kind: 'green', lighthouse: 17, seed: 0.9 },
        { t: 'pier', x: 357, z: -317, len: 46, dir: 225 },
        { t: 'boat', x: 318, z: -252, len: 9, sail: true, dir: 315 },
        { t: 'boat', x: 286, z: -300, len: 7, sail: false, dir: 315, col: [0.86, 0.30, 0.20] },
        { t: 'boat', x: 356, z: -226, len: 8, sail: true, dir: 315 },
        { t: 'island', x: -480, z: 260, r: 30, h: 5, kind: 'rock', tower: 7, seed: 3.3 },
        { t: 'beacon', x: 160, z: 240, col: 'yellow' }, { t: 'beacon', x: -230, z: -170, col: 'yellow' }
      ]
    },
    large: {
      label: 'Large', windDir: 250, wind: 22, gust: 1, sea: 3, swellOff: 18,
      desc: 'Large : vent soutenu et houle formée entre les îles, la tourelle sur son rocher pour repère. Des vagues à surfer au portant.',
      pal: { skyH: [0.80, 0.86, 0.90], skyZ: [0.34, 0.52, 0.74], deep: [0.03, 0.17, 0.27], fog: [0.76, 0.83, 0.88], light: [0.55, 0.56, 0.30], cloud: 1 },
      coast: { seed: 2.9, arc: [330, 62], base: 18, amp: 0.55, col0: [0.26, 0.34, 0.36], col1: [0.38, 0.45, 0.46] },
      marks: [
        { t: 'island', x: -620, z: -430, r: 95, h: 48, kind: 'rock', seed: 2.2 },
        { t: 'island', x: 700, z: 360, r: 62, h: 30, kind: 'rock', seed: 5.4 },
        { t: 'island', x: 230, z: -320, r: 15, h: 3.5, kind: 'rock', tower: 13, seed: 1.1 },
        { t: 'boat', x: -180, z: 380, len: 13, sail: false, dir: 250, col: [0.20, 0.36, 0.55] },
        { t: 'beacon', x: 60, z: 150, col: 'yellow' }
      ]
    }
  };
  Object.keys(SPOTS).forEach(function (k) { SPOTS[k].key = k; });
  function spotObstacles(sp) {
    var out = [];
    sp.marks.forEach(function (m) {
      var t, dx, dz;
      // île : même contour que le dessin ; le foil touche le fond un peu avant le rivage
      if (m.t === 'island') out.push({ x: m.x, z: m.z, r: m.r * 1.07, rm: m.r * 1.07 * 1.26,
                                       lobes: [[2, 0.13, 3.1 * m.seed], [3, 0.08, 7.7 * m.seed], [5, 0.05, 1.3 * m.seed]] });
      else if (m.t === 'boat') out.push({ x: m.x, z: m.z, r: m.len * 0.5 });
      else if (m.t === 'beacon') out.push({ x: m.x, z: m.z, r: 1.3 });
      else if (m.t === 'pier') { dx = Math.sin(m.dir * DEG); dz = -Math.cos(m.dir * DEG); for (t = 3; t <= m.len; t += 7) out.push({ x: m.x + dx * t, z: m.z + dz * t, r: 4.2 }); }
      else if (m.t === 'reef') { dx = Math.sin(m.dir * DEG); dz = -Math.cos(m.dir * DEG); for (t = -m.len / 2; t <= m.len / 2; t += 13) out.push({ x: m.x + dx * t, z: m.z + dz * t, r: 9 }); }
    });
    return out;
  }

  // curseurs du matériel libre : [clé, libellé, unité, décimales]
  var CUSTOM_UI = [
    ['riderMass', 'Rider', 'kg', 0], ['wingArea', 'Wing', 'm²', 1],
    ['boardVol', 'Planche', 'L', 0], ['boardLen', 'Longueur', 'cm', 0],
    ['foilArea', 'Foil avant', 'cm²', 0], ['foilAR', 'Allongement', '', 1],
    ['mastLen', 'Mât', 'cm', 0], ['mastPos', 'Mât avancé de', 'cm', 1],
    ['stabArea', 'Stabilisateur', 'cm²', 0], ['stabInc', 'Calage du stab', '°', 1]
  ];

  function $(id) { return document.getElementById(id); }
  function fr(x, d) { return x.toFixed(d === undefined ? 1 : d).replace('.', ','); }
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function copy(o) { var r = {}, k; for (k in o) r[k] = o[k]; return r; }

  // ---------------- réglages ----------------
  var S = (function () {
    var s = {}, k, o = null;
    for (k in DEF) s[k] = DEF[k];
    s.custom = copy(P.CUSTOM_DEFAULT);
    try {
      o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!o) {                                            // reprise des réglages de la version 1
        var o1 = JSON.parse(localStorage.getItem(KEY_V1) || 'null');
        if (o1) { o = { assist: o1.assist, wind: o1.wind, gust: o1.gust, gear: o1.gear, stance: o1.stance, sound: o1.sound, coach: o1.coach, help: o1.help,
                        sea: o1.chop ? 1 : 0, start: o1.start === 'flying' ? 'flying' : 'knees' }; }
      }
    } catch (e) { o = null; /* stockage indisponible */ }
    if (o) for (k in o) if (k in DEF && o[k] !== undefined && o[k] !== null) {
      if (k === 'custom') { for (var c in s.custom) if (typeof o.custom[c] === 'number') s.custom[c] = o.custom[c]; } else s[k] = o[k];
    }
    var q = new URLSearchParams(location.search);
    ['assist', 'gear', 'start', 'spot'].forEach(function (n) { if (q.get(n)) s[n] = q.get(n); });
    if (q.get('spot') && SPOTS[q.get('spot')]) { var sp = SPOTS[q.get('spot')]; s.wind = sp.wind; s.gust = sp.gust; s.sea = sp.sea; }
    ['wind', 'gust', 'sea', 'stance', 'sound', 'coach', 'help'].forEach(function (n) { if (q.get(n) !== null) s[n] = parseFloat(q.get(n)); });
    if (q.get('chop') !== null) s.sea = parseFloat(q.get('chop')) > 0 ? 1 : 0;        // ancien paramètre
    if (s.start === 'water') s.start = 'standing';
    if (!ASSIST[s.assist]) s.assist = 'realiste';
    if (!P.GEAR[s.gear] && s.gear !== 'custom') s.gear = 'freeride';
    if (!SPOTS[s.spot]) s.spot = 'baie';
    if (!START[s.start]) s.start = 'knees';
    s.sea = clamp(Math.round(s.sea) || 0, 0, SEA.length - 1); s.gust = clamp(Math.round(s.gust) || 0, 0, 2);
    s.wind = clamp(Math.round(s.wind) || 17, 8, 30);
    return s;
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignoré */ } }

  // ---------------- le jeu dans une page web (cadre <iframe>, comme sur mathopo.ca) ----------------
  // La page peut avoir un bouton « Son » : elle envoie { type: 'mathopo:son', son: true | false } au jeu,
  // et le jeu lui annonce son réglage par le même message (au chargement, puis quand il change dans le jeu).
  var EMBED = window.parent !== window;
  function tellSound() {
    if (!EMBED) return;
    try { window.parent.postMessage({ type: 'mathopo:son', son: !!S.sound }, '*'); } catch (e) { /* page inaccessible */ }
  }
  function gearSpec() { return S.gear === 'custom' ? copy(S.custom) : S.gear; }

  // ---------------- initialisation ----------------
  var sim, input, renderer, hud;
  try {
    sim = new P.FoilSim({ assist: S.assist, gear: gearSpec(), stance: S.stance });
    input = new window.FoilInput(window);
    renderer = new window.FoilRenderer($('gl'));
    hud = new window.FoilHUD($('hud'));
  } catch (err) {
    $('menu').hidden = true; $('fatal').hidden = false;
    $('fatalMsg').textContent = 'Ce navigateur ne peut pas afficher le jeu (WebGL requis). Détail : ' + err.message;
    return;
  }

  var state = 'menu';             // menu | play | pause
  var acc = 0, last = 0, snap = true, curSpot = SPOTS[S.spot];
  var ctl = { lean: 0, roll: 0, sheet: 0, crouch: 0, wingFA: 0, wingUp: 0, flip: false, feet: false, action: false };
  var stats, pending = null, coachT = 0, tipT = 0, tipI = 0, slowT = 0, vRef = 0, toeT = 0, breachPrev = false, crashText = '', actArmed = false;
  var H = 1 / 480, resetT = 0;

  function newStats() { return { flight: 0, bestFlight: 0, vmax: 0, dist: 0, tacks: 0, jibes: 0, touch: 0, crashes: 0, time: 0 }; }
  stats = newStats();

  function applyEnv() {
    var e = sim.env, sea = SEA[S.sea];
    e.windDir = curSpot.windDir * DEG;
    e.windSpeed = S.wind * KN;
    e.gust = GUST[S.gust][0]; e.shift = GUST[S.gust][1] * DEG;
    e.chop = sea.chop; e.swellH = sea.H; e.swellT = sea.T;
    e.swellDir = e.windDir + Math.PI + curSpot.swellOff * DEG;
  }
  function loadSpot() {
    curSpot = SPOTS[S.spot];
    sim.obstacles = spotObstacles(curSpot);
    renderer.setSpot(curSpot);
    applyEnv();
  }
  function placeRider() {
    sim.setAssist(S.assist);
    sim.setGear(gearSpec());
    sim.stance = S.stance;
    sim.fullStart = S.start === 'knees';
    sim.reset({ mode: S.start === 'flying' ? 'flying' : 'water', posture: S.start === 'knees' ? 'kneel' : 'stand',
                keepStance: true, stance: S.stance, side: S.stance });
    sim.drainEvents();
    snap = true;
  }
  function startRun() {
    loadSpot();
    placeRider();
    input.resetStates();
    if (S.start === 'flying') input.kb.sheetBase = 0.5;
    stats = newStats(); pending = null; acc = 0; actArmed = false;
    hud.toasts = []; hud.setCoach('');
  }
  loadSpot();
  placeRider();

  // ---------------- son (WebAudio, bruit filtré) ----------------
  var audio = null;
  function initAudio() {
    if (audio || !S.sound) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      var ac = new AC(), n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0), b0 = 0, i;
      for (i = 0; i < n; i++) { var w = Math.random() * 2 - 1; b0 = 0.97 * b0 + 0.03 * w; d[i] = 0.55 * w + 4.0 * b0; }
      var master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
      var chain = function (type, f, q) {
        var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
        var fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
        var gn = ac.createGain(); gn.gain.value = 0;
        src.connect(fl); fl.connect(gn); gn.connect(master); src.start();
        return { f: fl, g: gn };
      };
      var osc = ac.createOscillator(); osc.type = 'triangle'; osc.frequency.value = 120;
      var og = ac.createGain(); og.gain.value = 0; osc.connect(og); og.connect(master); osc.start();
      audio = { ac: ac, master: master, wind: chain('bandpass', 700, 0.5), water: chain('lowpass', 1400, 0.7), splash: chain('bandpass', 1800, 0.4), osc: osc, og: og, sp: 0 };
    } catch (e) { audio = null; }
  }
  function updateAudio(dt) {
    if (!audio) return;
    var t = sim.tel, on = (state === 'play' && S.sound) ? 1 : 0, now = audio.ac.currentTime;
    var aw = clamp((t.aws || 0) / 16, 0, 1.3);
    audio.wind.g.gain.setTargetAtTime(on * 0.10 * aw * aw, now, 0.15);
    audio.wind.f.frequency.setTargetAtTime(450 + 500 * aw, now, 0.2);
    var hull = clamp((t.support || 0) / 500, 0, 1) * clamp((t.speed || 0) / 5, 0, 1.2);
    audio.water.g.gain.setTargetAtTime(on * (0.42 * hull + (t.flying ? 0.035 * clamp(t.speed / 8, 0, 1) : 0)), now, 0.08);
    audio.water.f.frequency.setTargetAtTime(700 + 260 * (t.speed || 0), now, 0.1);
    audio.osc.frequency.setTargetAtTime(70 + 16 * (t.speed || 0), now, 0.1);
    audio.og.gain.setTargetAtTime(on * (t.flying ? 0.018 * clamp((t.speed - 3) / 6, 0, 1) : 0), now, 0.12);
    audio.sp = Math.max(0, audio.sp - dt * 2.2);
    audio.splash.g.gain.setTargetAtTime(on * audio.sp, now, 0.02);
    audio.master.gain.setTargetAtTime(S.sound ? 0.5 : 0, now, 0.05);
    // contexte créé sans geste de l'utilisateur (partie lancée à la manette, son remis depuis la page) : le navigateur
    // le laisse en attente ; on le relance dès qu'un clic ou une touche a eu lieu
    if (on && audio.ac.state === 'suspended') {
      audio.rt = (audio.rt || 0) - dt;
      if (audio.rt <= 0) {
        audio.rt = 1.5;
        var ua = navigator.userActivation;
        if (!ua || ua.hasBeenActive) resumeAudio();
      }
    }
  }
  function setSound(on, fromPage) {
    S.sound = on ? 1 : 0; save();
    if (S.sound) { initAudio(); if (state === 'play') resumeAudio(); }
    if (state !== 'play') refreshMenu();
    if (!fromPage) tellSound();
  }
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!EMBED || e.source !== window.parent || !d || d.type !== 'mathopo:son') return;
    setSound(!!d.son, true);
    if (state === 'play') hud.toast(S.sound ? 'Son activé' : 'Son coupé', 'info', 1.2);
  });
  function splash(v) { if (audio) audio.sp = Math.max(audio.sp, v); }
  function resumeAudio() {
    if (!audio || audio.ac.state !== 'suspended') return;
    try { var pz = audio.ac.resume(); if (pz && pz.catch) pz.catch(function () { /* refusé : on réessaiera */ }); } catch (e) { /* refusé */ }
  }

  // ---------------- vent minimal du matériel (essais de décollage simulés, en tâche de fond) ----------------
  var mwCache = {}, mwJob = null, mwTimer = 0;
  function mwKey() { return S.gear === 'custom' ? 'c:' + JSON.stringify(S.custom) : S.gear; }
  function requestMinWind() {
    var key = mwKey();
    if (mwCache[key] !== undefined || (mwJob && mwJob.key === key)) return;
    clearTimeout(mwTimer);
    mwTimer = setTimeout(function () {
      if (mwKey() !== key) return;                         // le matériel a encore changé entre-temps
      var job = { key: key, spec: gearSpec(), lo: 6, hi: 32, first: true };
      mwJob = job;
      (function stepJob() {
        if (mwJob !== job) return;                         // remplacée par une demande plus récente
        if (state === 'play') { setTimeout(stepJob, 600); return; }      // jamais pendant la navigation
        if (job.first) {
          job.first = false;
          if (!P.takeoffTest(job.spec, 32, 30).ok) { mwCache[key] = 99; mwJob = null; refreshHints(); return; }
        } else if (job.hi - job.lo <= 1) { mwCache[key] = job.hi; mwJob = null; refreshHints(); return; }
        else { var mid = Math.round((job.lo + job.hi) / 2); if (P.takeoffTest(job.spec, mid, 30).ok) job.hi = mid; else job.lo = mid; }
        setTimeout(stepJob, 0);
      })();
    }, 350);
  }

  // ---------------- menu ----------------
  var menu = $('menu'), menuBody = $('menuBody'), rows = [], focus = [0, 0];
  (function buildCustomPanel() {
    var grid = $('customGrid'), html = '', i, c, r;
    for (i = 0; i < CUSTOM_UI.length; i++) {
      c = CUSTOM_UI[i]; r = P.CUSTOM_RANGE[c[0]];
      html += '<label class="cs" data-row><span class="csl">' + c[1] + '</span>' +
              '<input class="nav" type="range" data-c="' + c[0] + '" min="' + r[0] + '" max="' + r[1] + '" step="' + r[2] + '">' +
              '<output id="co_' + c[0] + '"></output></label>';
    }
    grid.innerHTML = html;
    grid.addEventListener('input', function (e) { var k = e.target && e.target.dataset && e.target.dataset.c; if (k) onCustom(k, parseFloat(e.target.value)); });
  })();

  function gearLine(geo) {
    var g = geo.gear, B = g.board, float = B.vol - geo.M;
    return 'Planche ' + fr(B.vol, 0) + ' L (' + Math.round(B.L * 100) + ' cm) · foil avant ' + Math.round(g.wing.S * 10000) + ' cm² · mât ' + Math.round(g.mast.len * 100) +
           ' cm · wing ' + fr(g.handWing.S, 1) + ' m² · rider ' + fr(g.riderMass, 0) + ' kg — décrochage du foil à ' + fr(geo.vStall / KN) + ' nœuds, ' +
           (float > 12 ? 'la planche porte bien' : (float > -4 ? 'la planche flotte tout juste' : 'la planche coule à l\'arrêt')) + '.';
  }
  function refreshHints() {
    $('assistHint').textContent = ASSIST[S.assist][1];
    $('spotHint').textContent = SPOTS[S.spot].desc + (state === 'pause' && curSpot !== SPOTS[S.spot] ? ' (au prochain « Repartir du début »)' : '');
    $('seaHint').textContent = SEA[S.sea].hint;
    $('startHint').textContent = START[S.start];
    // le matériel affiché est celui des réglages (en pause, il peut différer de celui qui navigue)
    $('gearHint').textContent = gearLine(P.buildGeometry(gearSpec()));
    var w = S.wind, mw = mwCache[mwKey()], txt;
    if (mw === undefined) { txt = 'Calcul du vent minimal pour ce matériel…'; requestMinWind(); }
    else if (mw >= 99) txt = 'Ce matériel ne décolle pas, même par 32 nœuds : wing trop petite ou foil trop petit pour ce poids.';
    else if (w < mw - 3) txt = 'Vent trop faible pour ce matériel, qui décolle sans pomper vers ' + mw + ' nœuds : décoller sera très difficile, voire impossible.';
    else if (w < mw) txt = 'Vent léger : il faudra pomper la wing et la planche pour décoller (sans pomper, il faut ' + mw + ' nœuds).';
    else if (w > mw + 9) txt = 'Vent fort pour ce matériel (il décolle dès ' + mw + ' nœuds) : surpuissance probable, pense à choquer et à monter la wing.';
    else txt = 'Bon vent pour ce matériel : il décolle sans pomper dès ' + mw + ' nœuds.';
    $('windHint').textContent = txt;
  }
  function refreshMenu() {
    var segs = menu.querySelectorAll('.seg'), i, c;
    for (i = 0; i < segs.length; i++) segs[i].classList.toggle('on', String(S[segs[i].dataset.set]) === segs[i].dataset.val);
    $('wind').value = S.wind; $('windOut').textContent = S.wind + ' nœuds';
    $('customPanel').hidden = S.gear !== 'custom';
    for (i = 0; i < CUSTOM_UI.length; i++) {
      c = CUSTOM_UI[i];
      var el = menu.querySelector('input[data-c="' + c[0] + '"]');
      if (el && document.activeElement !== el) el.value = S.custom[c[0]];
      $('co_' + c[0]).textContent = fr(S.custom[c[0]], c[3]) + (c[2] ? ' ' + c[2] : '');
    }
    refreshHints();
    $('btnPlay').textContent = state === 'pause' ? 'Reprendre' : 'Naviguer';
    $('btnRestart').hidden = state !== 'pause';
    $('menuTitle').textContent = state === 'pause' ? 'Pause' : 'Wing Foil Simulation';
    $('menuSub').textContent = state === 'pause' ? 'Vent, rafales, mer et pilotage s\'appliquent tout de suite ; le plan d\'eau, le matériel et le départ au prochain « Repartir du début ».'
                                                 : 'Version 2 : départ à genoux, houle, plans d\'eau, ton matériel';
    // lignes navigables à la manette / aux flèches ; le focus reste sur le même élément quand des lignes apparaissent
    var cur = rows[focus[0]] && rows[focus[0]][focus[1]], j;
    rows = [];
    var rr = menu.querySelectorAll('[data-row]');
    for (i = 0; i < rr.length; i++) {
      if (rr[i].closest && rr[i].closest('[hidden]')) continue;
      var list = [].slice.call(rr[i].querySelectorAll('.nav')).filter(function (e) { return !e.hidden; });
      if (list.length) rows.push(list);
    }
    if (cur) for (i = 0; i < rows.length; i++) { j = rows[i].indexOf(cur); if (j >= 0) { focus = [i, j]; break; } }
    moreHint();
  }
  // la liste des réglages s'estompe en bas tant qu'il reste des réglages plus bas
  function moreHint() { menuBody.classList.toggle('more', menuBody.scrollTop + menuBody.clientHeight < menuBody.scrollHeight - 6); }
  menuBody.addEventListener('scroll', moreHint);
  window.addEventListener('resize', moreHint);
  function focusEl(el) {
    for (var i = 0; i < rows.length; i++) { var j = rows[i].indexOf(el); if (j >= 0) { setFocus(i, j); return; } }
  }
  function setFocus(r, c) {
    r = clamp(r, 0, rows.length - 1); c = clamp(c, 0, rows[r].length - 1); focus = [r, c];
    var all = menu.querySelectorAll('.nav.focus'), i; for (i = 0; i < all.length; i++) all[i].classList.remove('focus');
    rows[r][c].classList.add('focus');
    reveal(rows[r][c], r === 0);
  }
  // Montre l'élément dans la liste des réglages. On ne fait défiler que cette liste : scrollIntoView ferait
  // aussi défiler la page qui contient le jeu quand il est intégré dans un cadre.
  function reveal(el, first) {
    var box = menuBody;
    if (!box.contains(el)) return;
    if (first) { box.scrollTop = 0; return; }
    var b = box.getBoundingClientRect(), r = el.getBoundingClientRect(), pad = 12;
    if (r.top < b.top + pad) box.scrollTop -= b.top + pad - r.top;
    else if (r.bottom > b.bottom - pad) box.scrollTop += r.bottom - b.bottom + pad;
  }
  function focusPlay() {
    for (var i = 0; i < rows.length; i++) if (rows[i][0].id === 'btnPlay') { setFocus(i, 0); return; }
    setFocus(rows.length - 1, 0);
  }
  function onSetting(key, val) {
    var num = ['gust', 'sea', 'stance', 'sound', 'coach', 'wind'].indexOf(key) >= 0;
    S[key] = num ? parseFloat(val) : val;
    if (key === 'spot') { var sp = SPOTS[S.spot]; S.wind = sp.wind; S.gust = sp.gust; S.sea = sp.sea; }   // chaque plan d'eau a son vent et sa mer
    save();
    if (state === 'menu') {
      if (key === 'spot') loadSpot();
      if (key === 'spot' || key === 'gear' || key === 'stance' || key === 'start' || key === 'assist') placeRider();
    }
    applyEnv(); sim.setAssist(S.assist);
    if (key === 'sound') { if (S.sound) initAudio(); tellSound(); }
    refreshMenu();
  }
  function onCustom(key, val) {
    var r = P.CUSTOM_RANGE[key]; if (!r || isNaN(val)) return;
    S.custom[key] = clamp(val, r[0], r[1]);
    save();
    if (state === 'menu' && S.gear === 'custom') placeRider();
    refreshMenu();
  }
  menu.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.seg') : null;
    if (b) { onSetting(b.dataset.set, b.dataset.val); focusEl(b); }
  });
  $('wind').addEventListener('input', function () { onSetting('wind', this.value); });
  $('btnCustomReset').addEventListener('click', function () {
    S.custom = copy(P.CUSTOM_DEFAULT); save();
    if (state === 'menu' && S.gear === 'custom') placeRider();
    refreshMenu(); focusEl(this);
  });
  $('btnPlay').addEventListener('click', function () { play(); });
  $('btnRestart').addEventListener('click', function () { state = 'menu'; play(); });
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  $('btnFull').addEventListener('click', function () {
    var el = document.documentElement, p;
    try {
      if (fsEl()) p = (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
      if (p && p.catch) p.catch(function () { /* refusé */ });
    } catch (e) { /* refusé */ }
  });
  function fsLabel() { $('btnFull').textContent = fsEl() ? 'Quitter le plein écran' : 'Plein écran'; }
  document.addEventListener('fullscreenchange', fsLabel);
  document.addEventListener('webkitfullscreenchange', fsLabel);
  // Dans une page web, c'est la page qui met le cadre du jeu en plein écran (son bouton, au-dessus du jeu) : le bouton
  // du menu est masqué. Il l'est aussi là où le plein écran n'est pas possible.
  if (EMBED || !(document.fullscreenEnabled || document.webkitFullscreenEnabled)) $('btnFull').hidden = true;
  function play() {
    initAudio(); resumeAudio();
    if (state === 'menu') startRun();
    state = 'play'; menu.hidden = true; last = 0; actArmed = false;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function pause() { if (state !== 'play') return; state = 'pause'; menu.hidden = false; refreshMenu(); focusPlay(); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  // Au clavier, si le jeu perd le focus (clic ailleurs dans la page qui le contient, autre fenêtre), les touches
  // n'arrivent plus : pause. On attend un instant, car la page peut rendre le focus aussitôt (ses boutons « Son »
  // et « Plein écran »). À la manette, le jeu continue : elle fonctionne sans le focus.
  var blurTimer = 0;
  window.addEventListener('blur', function () {
    clearTimeout(blurTimer);
    blurTimer = setTimeout(function () { if (state === 'play' && input.device !== 'gamepad' && !document.hasFocus()) pause(); }, 400);
  });
  window.addEventListener('focus', function () { clearTimeout(blurTimer); });
  refreshMenu(); focusPlay();

  function menuInput(pr) {
    var r = focus[0], c = focus[1], el = rows[r] && rows[r][c];
    if (pr.menuUp) setFocus(r - 1, c);
    if (pr.menuDown) setFocus(r + 1, c);
    if (el && el.type === 'range') {
      if (pr.menuLeft || pr.menuRight) {
        // pas d'un quarantième de la plage (au moins un cran) : on traverse le curseur en une quarantaine d'appuis
        var st = +el.step || 1, big = Math.max(st, Math.round((+el.max - +el.min) / 40 / st) * st);
        var nv = clamp(+el.value + (pr.menuRight ? big : -big), +el.min, +el.max);
        el.value = Math.round(nv / st) * st;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        focusEl(el);
      }
    } else {
      if (pr.menuLeft) setFocus(r, c - 1);
      if (pr.menuRight) setFocus(r, c + 1);
    }
    if (pr.accept && el && el.type !== 'range') { el.click(); if (state !== 'play') { refreshMenu(); focusEl(el); } }
    if ((pr.pause || pr.back) && state === 'pause') play();
  }

  // ---------------- événements de la simulation ----------------
  function onEvents() {
    var ev = sim.drainEvents(), i, e, t = sim.tel;
    for (i = 0; i < ev.length; i++) {
      e = ev[i];
      if (e.type === 'takeoff') { hud.toast('Décollage à ' + fr(e.speed / KN) + ' nœuds', 'good'); input.rumble(0.2, 0.5, 120); }
      else if (e.type === 'touchdown') {
        stats.touch++; splash(0.5); input.rumble(0.7, 0.4, 180);
        burst(40, 0.9);
        if (e.air > 1.5) hud.toast('Touchdown', 'info', 1.6);
        if (pending) { pending.ok = false; }
      } else if (e.type === 'crash') {
        stats.crashes++; crashText = CRASH[e.reason] || ''; splash(1.0); input.rumble(1, 1, 450); burst(140, 1.6); pending = null;
      } else if (e.type === 'tack' || e.type === 'jibe') {
        if (e.flying) pending = { type: e.type, t: 0, ok: true };
        else hud.toast(e.type === 'tack' ? 'Virement de bord (sur l\'eau)' : 'Empannage (sur l\'eau)', 'info', 2);
      } else if (e.type === 'breach') { hud.toast('Le foil sort de l\'eau !', 'bad', 1.4); input.rumble(0.3, 1, 200); }
      else if (e.type === 'feet') { hud.toast('Pieds changés : ' + (t.sigma === sim.stance ? 'heelside' : 'toeside'), 'info', 1.6); }
      else if (e.type === 'standup') { hud.toast('Debout !', 'info', 1.2); }
      else if (e.type === 'kneel') { hud.toast('À genoux', 'info', 1.2); }
      else if (e.type === 'mounting') { splash(0.35); }
      else if (e.type === 'mounted') { hud.toast('Sur la planche, à genoux', 'info', 1.6); input.resetStates(); }
      else if (e.type === 'swim') { input.resetStates(); }
      else if (e.type === 'respawn') { snap = true; input.resetStates(); }
    }
  }
  function burst(n, sp) {
    var O = sim.tel.O; if (!O) return;
    renderer.emit([O[0], (sim.tel.eta || 0) + 0.05, O[2]], [sim.v[0] * 0.3, 2.2 * sp, sim.v[2] * 0.3], 0.16, 0.9, n, 1.4 * sp);
  }

  // ---------------- embruns continus ----------------
  function spray(dt) {
    var t = sim.tel, O = t.O; if (!O) return;
    var hd = t.heading, f = [Math.sin(hd), 0, -Math.cos(hd)], r = [Math.cos(hd), 0, Math.sin(hd)], v = t.speed || 0, y0 = t.eta || 0;
    if ((t.support || 0) > 40 && v > 1.2) {
      var rate = clamp(v * 9 * clamp(t.support / 500, 0.2, 1), 0, 90) * dt, n = Math.floor(rate + Math.random());
      for (var i = 0; i < n; i++) {
        var sd = Math.random() < 0.5 ? -1 : 1, fx = 0.2 + Math.random() * 0.5;
        renderer.emit([O[0] + f[0] * fx + r[0] * sd * 0.3, y0 + 0.03, O[2] + f[2] * fx + r[2] * sd * 0.3],
                      [sim.v[0] * 0.45 + r[0] * sd * (0.8 + v * 0.18), 0.5 + v * 0.16, sim.v[2] * 0.45 + r[2] * sd * (0.8 + v * 0.18)], 0.10, 0.55, 1, 0.15);
      }
    } else if (t.flying && v > 3) {
      // sillage du mât qui perce la surface
      if (Math.random() < 14 * dt) {
        var mx = sim.geo.xMast;
        renderer.emit([O[0] + f[0] * mx, y0 + 0.02, O[2] + f[2] * mx], [sim.v[0] * 0.25, 0.5 + v * 0.07, sim.v[2] * 0.25], 0.06, 0.4, 1, 0.08);
      }
    }
  }

  // distance au bord de l'obstacle le plus proche droit devant (m), ou Infinity
  function hazardAhead() {
    var t = sim.tel, O = t.O, ob = sim.obstacles, v = t.speed || 0, best = Infinity, i;
    if (!O || v < 1) return best;
    var ux = sim.v[0] / v, uz = sim.v[2] / v;
    for (i = 0; i < ob.length; i++) {
      var dx = ob[i].x - O[0], dz = ob[i].z - O[2], al = dx * ux + dz * uz;
      if (al < 0) continue;
      var lat = Math.abs(dx * uz - dz * ux);
      var rr = ob[i].rm ? ob[i].r * 1.12 : ob[i].r;
      if (lat < rr + 4) { var d = al - Math.sqrt(Math.max(0, rr * rr - lat * lat)); if (d < best) best = d; }
    }
    return best;
  }

  // ---------------- coach ----------------
  var TIPS = [
    'Pour remonter au vent : carre au vent, wing basse et reculée.',
    'Pour virer : prends de la vitesse, lofe en carrant, monte la wing au-dessus de la tête, change de mains face au vent.',
    'Les risées se lisent sur l\'eau : les zones plus sombres annoncent plus de vent.',
    'Entraîne-toi aux touchdowns : pied avant pour poser la planche, pied arrière pour redécoller.',
    'Vole plutôt au milieu du mât : trop haut, le foil sort de l\'eau ; trop bas, la planche touche.'
  ];
  var TIPS_SWELL = [
    'Dans la houle, accompagne la surface : un peu de pied arrière quand la vague monte, de pied avant quand elle redescend.',
    'Au largue, laisse la houle te pousser : sur la face de la vague, la planche accélère toute seule, tu peux choquer.',
    'Garde de la marge sous la planche dans les creux : c\'est là que le foil sort de l\'eau.'
  ];
  function coach(dt) {
    if (!S.coach) { hud.setCoach(''); return; }
    coachT -= dt; if (coachT > 0) return; coachT = 0.4;
    var t = sim.tel, kb = input.device !== 'gamepad', msg = '', at = Math.abs(t.twa || 0) / DEG, v = t.speedKn || 0;
    var K = function (k, p) { return kb ? k : p; };
    var act = K('Entrée', 'A'), haz = hazardAhead();
    slowT = (v > vRef + 0.25) ? 0 : slowT + 0.4; if (slowT === 0 || v < vRef - 0.5) vRef = v;
    toeT = (!t.heelside && t.flying && t.flipT <= 0) ? toeT + 0.4 : 0;
    if (t.crashed) msg = '';
    else if (t.posture === 'swim') msg = t.mountT > 0 ? '' : 'Remonte sur la planche (' + act + ').';
    else if (haz < Math.max(18, 3.5 * (t.speed || 0))) msg = 'Attention, haut-fond droit devant : change de cap !';
    else if (t.posture === 'kneel') {
      if (t.knT === 0) msg = '';
      else if (t.sheet < 0.12 && v < 1.8) msg = 'À genoux, wing en l\'air : borde (' + K('E', 'gâchette droite') + ') pour avancer, travers au vent.';
      else if (at < 52 && v < 5) msg = 'Trop près du vent : avance la wing vers le nez (' + K('↑', 'stick droit vers l\'avant') + ') pour abattre.';
      else if (at > 135 && v < 5) msg = 'Trop abattu : recule la wing (' + K('↓', 'stick droit vers l\'arrière') + ') pour lofer.';
      else if (v >= 2.5) msg = 'Tu avances : lève-toi (' + act + ').';
      else msg = 'Laisse la planche prendre un peu de vitesse avant de te lever.';
    }
    else if ((t.unstable || 0) > 0.3 && !t.flying) msg = 'Debout à l\'arrêt, c\'est instable : borde pour avancer, ou remets-toi à genoux (' + act + ').';
    else if (t.wrongSide && v > 2) msg = 'La wing est du mauvais côté : change de mains (' + K('F', 'X') + ').';
    else if (!t.flying) {
      if (t.sheet < 0.12 && v < 2.5) msg = 'Borde la wing pour avancer (' + K('E', 'gâchette droite') + '), planche à plat, travers au vent.';
      else if (at < 52 && v < 6) msg = 'Trop près du vent : avance la wing vers le nez (' + K('↑', 'stick droit vers l\'avant') + ') pour abattre.';
      else if (at > 135 && v < 6) msg = 'Trop abattu : recule la wing (' + K('↓', 'stick droit vers l\'arrière') + ') pour lofer.';
      else if (t.wingStall > 0.4 && t.sheet > 0.85 && (t.dynB || 0) < 0.1) msg = 'Sur-bordé : la wing décroche. Relâche un peu la main arrière.';
      else if (v >= (sim.geo.vStall / KN) * 1.04) msg = 'Tu as la vitesse : pied arrière un court instant (' + K('S', 'stick vers toi') + ') pour décoller.';
      else if ((t.pitch || 0) > 5 * DEG && v < 5.5) msg = 'Planche trop cabrée : elle freine. Remets-la à plat pour accélérer.';
      else if (v > 2.5 && slowT > 2.4) msg = 'La vitesse plafonne : pompe ! Appuie et relâche ensemble ' + K('Espace et Maj', 'les deux gâchettes') + ', une à deux fois par seconde.';
      else if (t.sheet > 0.12) msg = 'Laisse la planche accélérer à plat ; le décollage se fait vers ' + fr(sim.geo.vStall / KN * 1.07, 0) + ' nœuds.';
    } else {
      if (t.rideFrac > 0.80) msg = 'Trop haut : pied avant (' + K('W', 'stick vers l\'avant') + '), le foil va sortir de l\'eau.';
      else if ((t.stall > 0.35 || v < (sim.geo.vStall / KN) * 0.98) && t.rideFrac < 0.6) msg = 'Trop lent, le foil décroche : borde, ou abats un peu pour reprendre de la vitesse.';
      else if (t.rideFrac < 0.14) msg = 'Trop bas : pied arrière (' + K('S', 'stick vers toi') + ').';
      else if (sim.airT < 2.5 && (t.pitch || 0) > 4.5 * DEG) msg = 'Pied avant ! Remets la planche à plat.';
      else if (t.overpower || (t.czSat && t.wingForce > 260 && Math.abs(t.psiDot || 0) < 0.3)) msg = 'Trop de puissance : choque (' + K('Q', 'relâche la gâchette') + ') ou monte la wing.';
      else if (t.tipDepth > -0.12) msg = 'Le bout de la wing frôle l\'eau : monte-la (' + K('→ ou ←', 'stick droit') + ').';
      else if (t.wingStall > 0.4 && t.sheet > 0.85) msg = 'Sur-bordé : la wing décroche. Relâche un peu la main arrière.';
      else if (toeT > 3.5 && Math.abs(t.psiDot || 0) < 0.15) msg = 'Tu navigues toeside : change de pieds (' + K('G', 'Y') + ') quand le vol est stable.';
      else if (at < 38) msg = 'Face au vent : continue le virement ou abats, tu perds ta vitesse.';
      else {
        var tips = SEA[S.sea].H > 0 ? TIPS_SWELL.concat(TIPS) : TIPS;
        tipT += 0.4; if (tipT > 14) { tipT = 0; tipI = (tipI + 1) % tips.length; }
        if (tipT < 6 && stats.time > 25) msg = tips[tipI % tips.length];
      }
    }
    hud.setCoach(msg);
  }

  // ---------------- boucle ----------------
  function frame(ts) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min(0.1, (ts - last) / 1000) : 0.016; last = ts;
    var persist = sim.assist.trimK === 0;
    var o = input.poll(dt, { leanPersistent: persist && state === 'play' });
    var pr = input.pressed, t = sim.tel;

    if (state !== 'play') { menuInput(pr); sim.t += dt; }
    else {
      if (pr.pause) pause();
      if (pr.camera) { renderer.camMode = (renderer.camMode + 1) % 4; hud.toast(['Caméra : poursuite', 'Caméra : latérale', 'Caméra : haute', 'Caméra : de face'][renderer.camMode], 'info', 1.2); }
      if (pr.help) { S.help = S.help ? 0 : 1; save(); }
      if (pr.mute) { setSound(!S.sound); hud.toast(S.sound ? 'Son activé' : 'Son coupé', 'info', 1.2); }
      if (pr.windUp || pr.windDown) {
        if (pr.windDown) S.wind = Math.max(8, S.wind - 1);
        else if (pr.gp_up) S.wind = Math.min(30, S.wind + 1);
        else S.wind = S.wind >= 30 ? 8 : S.wind + 1;                 // clavier : V fait défiler 8 → 30 nœuds
        save(); applyEnv(); hud.toast('Vent : ' + S.wind + ' nœuds', 'info', 1.2);
      }
      // repartir : immédiat sur l'eau, en maintenant la touche si l'on est en vol (évite les fausses manœuvres)
      if (o.resetHeld && !sim.crashed) {
        resetT += dt;
        if ((pr.reset && !t.flying) || resetT > 0.7) { sim.respawn(); sim.drainEvents(); input.resetStates(); snap = true; resetT = -1e9; hud.toast('Retour sur la planche', 'info', 1.2); }
        else if (pr.reset && t.flying) hud.toast('Maintiens pour repartir', 'info', 0.9);
      } else if (!o.resetHeld) resetT = 0;

      ctl.lean = o.lean; ctl.roll = o.roll; ctl.sheet = o.sheet; ctl.crouch = o.crouch; ctl.wingFA = o.wingFA;
      // stick droit latéral : vers la wing = plus basse, à l'opposé = au-dessus de la tête
      // (au clavier : → = plus haute, ← = plus basse)
      ctl.wingUp = input.device === 'gamepad' ? -o.wingLat * sim.sigma * (renderer.camMode === 3 ? -1 : 1) : o.wingLat;
      ctl.flip = o.flip; ctl.feet = o.feet;
      // le bouton d'action ne compte qu'après avoir été relâché une fois (il a pu servir à lancer la partie)
      if (!o.action) actArmed = true;
      ctl.action = actArmed && o.action;

      acc += dt; var steps = 0;
      while (acc >= H && steps < 96) { sim.step(H, ctl); acc -= H; steps++; }
      if (steps >= 96) acc = 0;
      onEvents();
      t = sim.tel;
      if (!sim.fullStart && sim.crashed && sim.crashT > 2.3) { sim.respawn('stand'); }
      // statistiques
      stats.time += dt; stats.dist += (t.speed || 0) * dt;
      if (t.flying) { stats.flight += dt; if (stats.flight > stats.bestFlight) stats.bestFlight = stats.flight; if (t.speedKn > stats.vmax) stats.vmax = t.speedKn; }
      else stats.flight = 0;
      if (pending) {
        pending.t += dt;
        if (!pending.ok || sim.crashed) { hud.toast(pending.type === 'tack' ? 'Virement terminé sur l\'eau' : 'Empannage terminé sur l\'eau', 'warn', 2); pending = null; }
        else if (pending.t > 2.2) {
          if (pending.type === 'tack') { stats.tacks++; hud.toast('Virement de bord réussi en vol !', 'good', 3.2); }
          else { stats.jibes++; hud.toast('Empannage réussi en vol !', 'good', 3.2); }
          input.rumble(0.3, 0.8, 200); pending = null;
        }
      }
      var br = t.breach > 1 && t.flying;
      if (br && !breachPrev) input.rumble(0.1, 0.7, 140);
      breachPrev = br;
      spray(dt);
      coach(dt);
    }
    updateAudio(dt);
    renderer.draw(sim, { dt: dt, snap: snap }); snap = false;
    hud.draw(sim, { state: state, stats: stats, ctl: ctl, device: input.device, showHelp: !!S.help, persist: persist,
                    assistLabel: ASSIST[S.assist][0], crashText: crashText, fullStart: sim.fullStart,
                    place: curSpot.label + ' · ' + SEA[S.sea].label }, dt);
    if (state !== 'play') {
      $('padInfo').textContent = input.gpName ? ('Manette détectée : ' + input.gpName.slice(0, 60) + (input.gpMapping === 'standard' ? '' : ' (disposition non standard : vérifie les gâchettes)'))
                                              : (input.gpDenied ? 'Manette indisponible ici : la page qui contient le jeu ne l\'autorise pas. Le clavier fonctionne.'
                                                                : 'Manette : branche-la puis appuie sur un bouton pour qu\'elle soit détectée.');
    }
  }

  // accès pour les tests et la mise au point
  window.__foil = { sim: sim, input: input, renderer: renderer, hud: hud, settings: S, play: play, pause: pause, spots: SPOTS, sea: SEA,
                    state: function () { return state; }, stats: function () { return stats; }, minWind: function () { return mwCache[mwKey()]; } };
  tellSound();
  if (new URLSearchParams(location.search).get('autostart')) play();
  requestAnimationFrame(frame);
})();
