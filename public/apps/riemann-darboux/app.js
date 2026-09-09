/* =============================================================================
   RiApp — Sommes de Riemann et de Darboux (MPU1054, UQTR)
   Application autonome (HTML/CSS/JS) : aucune dépendance externe, fonctionne
   en ouvrant simplement index.html dans un navigateur.

   Notation (sections 1.1 et 1.2 du cours) :
     P = {x_0, x_1, ..., x_n}, a = x_0 < x_1 < ... < x_n = b ;   ‖P‖ = max (x_k − x_{k−1})
     S(f;Ṗ) = Σ f(t_k)(x_k − x_{k−1})            (somme de Riemann, marques t_k)
     L(f;P) = Σ m_k (x_k − x_{k−1}),  m_k = inf f sur [x_{k−1}, x_k]   (Darboux inf.)
     U(f;P) = Σ M_k (x_k − x_{k−1}),  M_k = sup f sur [x_{k−1}, x_k]   (Darboux sup.)
   ============================================================================= */
'use strict';

(function () {
  const MODE_TEST = /[?&]test=1/.test(location.search);
  let nbDessins = 0;
  if (MODE_TEST) {
    window.addEventListener('error', (e) => {
      const pre = document.getElementById('tests') || document.body.appendChild(Object.assign(document.createElement('pre'), { id: 'tests' }));
      pre.textContent += '\nERREUR : ' + e.message + ' (ligne ' + e.lineno + ')';
    });
  }

  // ===========================================================================
  //  Couleurs de l'UQTR (voir 1-beamer/packages.tex et integrale-figures.tex)
  // ===========================================================================
  const C = {
    noir: '#000000',
    vert: '#0E8954', vertMoyen: '#87C4AA', vertClair: '#B7DCCC',
    or: '#DBA326', orMoyen: '#E9C87D', orClair: '#F2DFB3',
    grille: '#ECEAE2', gris: '#6F6E68', texte: '#1C1C1A', bord: '#E3E1D8',
  };
  const POLICE_UI = '"Carlito","Calibri","Segoe UI","Helvetica Neue",Arial,sans-serif';
  const POLICE_MATH = '"Latin Modern Roman","STIX Two Text","Cambria","Georgia","Times New Roman",serif';
  const NMAX = 1000;          // nombre maximal de sous-intervalles
  const N_ANIMATION = 200;    // l'animation raffine jusqu'à cette valeur

  // ===========================================================================
  //  Langue (fr par défaut ; ?lang=en ou bouton EN/FR)
  //  Le français est le texte du HTML (capturé au démarrage) ; l'anglais est
  //  donné ici, avec les mêmes clés (data-i18n, data-i18n-title, -placeholder).
  //  MSG contient les chaînes produites par le code (dans les deux langues).
  // ===========================================================================
  const TRAD = {
    fr: {},
    en: {
      titre: 'Riemann and Darboux Sums',
      sousTitre: 'MPU1054 · Analysis in One Real Variable II · Chapter 1, Sections 1.1 and 1.2',
      btnAide: '?&nbsp;Help', 'title:btnAide': 'Help (key ?)',
      btnPanneau: 'Panel', 'title:btnPanneau': 'Show or hide the panel (key P)',
      btnPleinEcran: '⛶&nbsp;Full screen', 'title:btnPleinEcran': 'Full screen',
      carteFonction: 'Function',
      'placeholder:exprPlaceholder': 'e.g. sqrt(x), sin(x) + x/2, e^(-x^2)',
      carteIntervalle: 'Interval [<i>a</i>, <i>b</i>]',
      btnRecadrer: 'Fit view', 'title:btnRecadrer': 'Fit the view to [a, b] (key F)',
      indiceIntervalle: 'Drag the black dots <i>a</i> and <i>b</i> on the axis to change the interval.',
      cartePartition: 'Partition',
      'title:btnMoins': 'Remove a point (↓)', 'title:btnPlus': 'Add a point (↑)',
      'title:btnDoubler': 'Refine: 2n subintervals (key D)', 'title:btnAnimer': 'Refine automatically up to n = 200 (key A)',
      partUniforme: 'Uniform', partQuadratique: 'Quadratic', partAleatoire: 'Random', partLibre: 'Free',
      'title:partAleatoire': 'Uniform points randomly perturbed', 'title:partLibre': 'Points moved by hand',
      btnTirage: '🎲 New draw',
      'title:btnTiragePartition': 'New draw of the random partition (key R)',
      'title:btnTirageMarques': 'New draw of the random tags (key R)',
      indicePartition: 'Mouse wheel: refine or coarsen. Drag a tick <span class="math"><i>x<sub>k</sub></i></span>: free partition. Double-click: add or remove a point.',
      carteMarques: 'Tags',
      marqGauche: 'Left', marqDroite: 'Right', marqMilieu: 'Midpoint', marqAleatoire: 'Random', marqLibre: 'Free',
      'title:marqAleatoire': 't_k chosen at random in [x_{k−1}, x_k]', 'title:marqLibre': 'Tags moved by hand',
      indiceMarques: 'Drag a green dot on the curve to move the tag <span class="math"><i>t<sub>k</sub></i></span>.',
      carteAffichage: 'Display',
      affRiemann: 'Riemann sum <span class="math"><i>S</i>(<i>f</i> ; <i>Ṗ</i>)</span>',
      affInf: 'Lower Darboux sum <span class="math"><i>L</i>(<i>f</i> ; <i>P</i>)</span>',
      affSup: 'Upper Darboux sum <span class="math"><i>U</i>(<i>f</i> ; <i>P</i>)</span>',
      formL: '<i>L</i>(<i>f</i> ; <i>P</i>) = Σ <i>m<sub>k</sub></i> (<i>x<sub>k</sub></i> − <i>x</i><sub><i>k</i>−1</sub>), <i>m<sub>k</sub></i> = inf <i>f</i> on [<i>x</i><sub><i>k</i>−1</sub>, <i>x<sub>k</sub></i>]',
      formU: '<i>U</i>(<i>f</i> ; <i>P</i>) = Σ <i>M<sub>k</sub></i> (<i>x<sub>k</sub></i> − <i>x</i><sub><i>k</i>−1</sub>), <i>M<sub>k</sub></i> = sup <i>f</i> on [<i>x</i><sub><i>k</i>−1</sub>, <i>x<sub>k</sub></i>]',
      optEtiquettes: 'Labels', optLegende: 'Values on the graph', optTableau: 'Table', optDecimales: 'Decimals',
      carteValeurs: 'Values', notePas: '(norm)', noteReference: '(reference)',
      indiceEncadrement: 'For every partition, <span class="math"><i>m</i>(<i>b</i> − <i>a</i>) ≤ <i>L</i>(<i>f</i> ; <i>P</i>) ≤ <i>S</i>(<i>f</i> ; <i>Ṗ</i>) ≤ <i>U</i>(<i>f</i> ; <i>P</i>) ≤ <i>M</i>(<i>b</i> − <i>a</i>)</span>.',
      carteTableau: 'Subintervals',
      pied: 'MPU1054 — Analysis in One Real Variable II · UQTR · Fall 2026 · P.-O. Parisé',
      btnFermer: 'Close',
      aide: '<h2>How to use</h2>'
        + '<h3>With the mouse</h3><ul>'
        + '<li><b>Drag</b> a black dot <i>a</i> or <i>b</i> on the axis: change the interval (the partition is rescaled).</li>'
        + '<li><b>Drag</b> a tick <i>x<sub>k</sub></i>: move a point of the partition (it becomes <i>free</i>).</li>'
        + '<li><b>Double-click</b> in the graph: add the point <i>z</i> to the partition (refinement 𝒫 ∪ {<i>z</i>}); double-click on a tick <i>x<sub>k</sub></i>: remove it.</li>'
        + '<li><b>Drag</b> a green dot on the curve: move the tag <i>t<sub>k</sub></i> within [<i>x</i><sub><i>k</i>−1</sub>, <i>x<sub>k</sub></i>] (the tags become <i>free</i>).</li>'
        + '<li><b>Mouse wheel</b>: refine (scroll up) or coarsen (scroll down) the partition. In a free partition, refining bisects the largest subinterval.</li>'
        + '<li><b>Shift + wheel</b> (or Ctrl + wheel): zoom; <b>drag the background</b>: pan the view.</li></ul>'
        + '<h3>With the keyboard</h3><ul>'
        + '<li><kbd>↑</kbd> / <kbd>↓</kbd> (or <kbd>+</kbd> / <kbd>−</kbd>): <i>n</i> ± 1 &nbsp;·&nbsp; <kbd>D</kbd>: double <i>n</i> &nbsp;·&nbsp; <kbd>A</kbd>: animate the refinement</li>'
        + '<li><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> <kbd>4</kbd>: left, right, midpoint, random tags</li>'
        + '<li><kbd>S</kbd> <kbd>L</kbd> <kbd>U</kbd>: show or hide the Riemann sum, the lower sum, the upper sum</li>'
        + '<li><kbd>R</kbd>: new random draws &nbsp;·&nbsp; <kbd>F</kbd>: fit view &nbsp;·&nbsp; <kbd>E</kbd>: labels &nbsp;·&nbsp; <kbd>P</kbd>: panel &nbsp;·&nbsp; <kbd>?</kbd>: this help</li></ul>'
        + '<h3>Reading the graph</h3><ul>'
        + '<li><span class="pastille U pastille-inline"></span> Gold rectangles: upper sum (heights <i>M<sub>k</sub></i>); <span class="pastille L pastille-inline"></span> green rectangles: lower sum (heights <i>m<sub>k</sub></i>). When both are shown, the visible gold band has area <i>U</i>(<i>f</i> ; <i>P</i>) − <i>L</i>(<i>f</i> ; <i>P</i>).</li>'
        + '<li>The Riemann sum is drawn in gold when shown alone, and as a black staircase (heights <i>f</i>(<i>t<sub>k</sub></i>)) when a Darboux sum is also shown: one then sees <i>L</i> ≤ <i>S</i> ≤ <i>U</i>.</li>'
        + '<li>For a function of arbitrary sign, rectangles below the axis count negatively (signed area).</li>'
        + '<li>Custom function: <code>x^2</code>, <code>2x</code>, <code>sqrt(x)</code>, <code>sin(x)</code>, <code>e^x</code>, <code>ln(x)</code>, <code>abs(x)</code>, <code>floor(x)</code>, <code>pi</code>… Write arguments in parentheses.</li></ul>',
    },
  };
  const MSG = {
    fr: {
      titrePage: 'Sommes de Riemann et de Darboux — MPU1054',
      btnLangue: 'EN', btnLangueTitre: 'English version',
      generique: 'Générique', autre: 'Autre…',
      animer: '▶ Animer', arreter: '■ Arrêter',
      nonBornee: 'f non bornée ou non définie sur [a, b]',
      avertissement: 'f n’est pas bornée (ou pas définie) sur [a, b] : les sommes de Darboux n’existent pas.',
      tableauNote: 'Tableau affiché pour n ≤ 40 (ici n = {n}).',
      'part.uniforme': 'x_k = a + k (b − a)/n', 'part.quadratique': 'x_k = a + (b − a)(k/n)²',
      'part.aleatoire': 'points uniformes perturbés au hasard', 'part.libre': 'points déplacés à la main',
      'marq.gauche': 't_k = x_{k−1}', 'marq.droite': 't_k = x_k', 'marq.milieu': 't_k = (x_{k−1} + x_k)/2',
      'marq.aleatoire': 't_k au hasard dans [x_{k−1}, x_k]', 'marq.libre': 'marques déplacées à la main',
      errNomInconnu: 'Nom inconnu : « {x} »', errNombre: 'Nombre mal formé', errCaractere: 'Caractère inattendu : « {x} »',
      errVide: 'Expression vide', errAttendu: '« {x} » attendu', errFin: 'Fin inattendue de l’expression',
      errJeton: 'Jeton inattendu : « {x} »', errInvalide: 'Expression invalide',
    },
    en: {
      titrePage: 'Riemann and Darboux Sums — MPU1054',
      btnLangue: 'FR', btnLangueTitre: 'Version française',
      generique: 'Generic', autre: 'Other…',
      animer: '▶ Animate', arreter: '■ Stop',
      nonBornee: 'f unbounded or undefined on [a, b]',
      avertissement: 'f is not bounded (or not defined) on [a, b]: the Darboux sums do not exist.',
      tableauNote: 'Table shown for n ≤ 40 (here n = {n}).',
      'part.uniforme': 'x_k = a + k (b − a)/n', 'part.quadratique': 'x_k = a + (b − a)(k/n)²',
      'part.aleatoire': 'uniform points randomly perturbed', 'part.libre': 'points moved by hand',
      'marq.gauche': 't_k = x_{k−1}', 'marq.droite': 't_k = x_k', 'marq.milieu': 't_k = (x_{k−1} + x_k)/2',
      'marq.aleatoire': 't_k at random in [x_{k−1}, x_k]', 'marq.libre': 'tags moved by hand',
      errNomInconnu: 'Unknown name: “{x}”', errNombre: 'Malformed number', errCaractere: 'Unexpected character: “{x}”',
      errVide: 'Empty expression', errAttendu: '“{x}” expected', errFin: 'Unexpected end of expression',
      errJeton: 'Unexpected token: “{x}”', errInvalide: 'Invalid expression',
    },
  };

  /** Chaîne produite par le code, dans la langue courante (avec substitution de {param}). */
  function t(cle, params) {
    const lang = (typeof etat !== 'undefined' && etat.langue) || 'fr';
    let s = (MSG[lang] && MSG[lang][cle] !== undefined) ? MSG[lang][cle] : (MSG.fr[cle] !== undefined ? MSG.fr[cle] : cle);
    if (params) for (const k in params) s = s.replace('{' + k + '}', String(params[k]));
    return s;
  }

  /** Mémorise le texte français du HTML pour pouvoir y revenir. */
  function capturerFrancais() {
    document.querySelectorAll('[data-i18n]').forEach((e) => { TRAD.fr[e.dataset.i18n] = e.innerHTML; });
    document.querySelectorAll('[data-i18n-title]').forEach((e) => { TRAD.fr['title:' + e.dataset.i18nTitle] = e.title; });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((e) => { TRAD.fr['placeholder:' + e.dataset.i18nPlaceholder] = e.placeholder; });
  }

  function appliquerLangue(lang, rafraichir) {
    etat.langue = TRAD[lang] ? lang : 'fr';
    document.documentElement.lang = etat.langue;
    const d = Object.assign({}, TRAD.fr, TRAD[etat.langue]);
    document.querySelectorAll('[data-i18n]').forEach((e) => { const v = d[e.dataset.i18n]; if (v !== undefined) e.innerHTML = v; });
    document.querySelectorAll('[data-i18n-title]').forEach((e) => { const v = d['title:' + e.dataset.i18nTitle]; if (v !== undefined) e.title = v; });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((e) => { const v = d['placeholder:' + e.dataset.i18nPlaceholder]; if (v !== undefined) e.placeholder = v; });
    document.title = t('titrePage');
    el.btnLangue.textContent = t('btnLangue'); el.btnLangue.title = t('btnLangueTitre');
    el.animer.textContent = etat.animation ? t('arreter') : t('animer');
    majBoutonsFonctions();
    if (rafraichir !== false) maj();
  }

  function changerLangue(lang) {
    appliquerLangue(lang);
    try { history.replaceState(null, '', location.pathname + '?lang=' + lang + (MODE_TEST ? '&test=1' : '') + location.hash); } catch (_) { /* file:// */ }
  }

  // ===========================================================================
  //  Utilitaires numériques
  // ===========================================================================
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /** Nombre pseudo-aléatoire déterministe dans [0, 1) associé au couple (graine, k). */
  function hash01(graine, k) {
    let h = (Math.imul(graine | 0, 0x9E3779B1) ^ Math.imul((k | 0) + 0x632BE5AB, 0x85EBCA77)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 0x2C1B3C6D) >>> 0;
    h = Math.imul(h ^ (h >>> 12), 0x297A2D39) >>> 0;
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }

  /** Format français à d décimales : virgule décimale, vrai signe moins. */
  function fmt(v, d) {
    if (d === undefined) d = etat.decimales;
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    if (!Number.isFinite(v)) return v > 0 ? '+∞' : '−∞';
    const s = Math.abs(v).toFixed(d).replace('.', etat.langue === 'en' ? '.' : ',');
    const nul = /^[0.,]*$/.test(s);
    return (v < 0 && !nul ? '−' : '') + s;
  }

  /** Étiquette d'axe pour la valeur v, avec juste assez de décimales pour le pas donné. */
  function fmtAxe(v, pas) {
    let d = 0;
    while (d < 8 && Math.abs(pas * Math.pow(10, d) - Math.round(pas * Math.pow(10, d))) > 1e-9) d++;
    if (Math.abs(v) < pas / 1e6) v = 0;
    return fmt(v, d);
  }

  /** Pas « rond » (1, 2 ou 5 × 10^k) pour environ `cible` graduations sur `plage`. */
  function pasJoli(plage, cible) {
    const brut = Math.abs(plage) / Math.max(1, cible);
    const p = Math.pow(10, Math.floor(Math.log10(brut)));
    const r = brut / p;
    return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * p;
  }

  /** Recherche par la section dorée d'un extremum (signe = +1 : maximum, −1 : minimum) de f sur [lo, hi]. */
  function extremum(f, lo, hi, signe, iters) {
    const gr = (Math.sqrt(5) - 1) / 2;
    let c = hi - gr * (hi - lo), d = lo + gr * (hi - lo);
    let fc = signe * f(c), fd = signe * f(d);
    for (let i = 0; i < (iters || 34); i++) {
      if (fc > fd) { hi = d; d = c; fd = fc; c = hi - gr * (hi - lo); fc = signe * f(c); }
      else { lo = c; c = d; fc = fd; d = lo + gr * (hi - lo); fd = signe * f(d); }
    }
    return (lo + hi) / 2;
  }

  /**
   * Infimum et supremum de f sur [u, v] : extrémités, points critiques connus (crit),
   * échantillonnage en nEch points, puis raffinement de chaque extremum local détecté.
   * Renvoie { m, M, ok } ; ok = false si f n'est pas finie quelque part.
   */
  function infSup(f, u, v, crit, nEch) {
    let m = Infinity, M = -Infinity, ok = true;
    const voir = (x) => {
      const y = f(x);
      if (Number.isFinite(y)) { if (y < m) m = y; if (y > M) M = y; } else ok = false;
    };
    voir(u); voir(v);
    if (crit) for (let i = 0; i < crit.length; i++) { const c = crit[i]; if (c > u && c < v) voir(c); }
    const N = Math.max(4, nEch | 0);
    const h = (v - u) / N;
    const ys = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) {
      const y = f(u + i * h); ys[i] = y;
      if (Number.isFinite(y)) { if (y < m) m = y; if (y > M) M = y; } else ok = false;
    }
    if (!ok) return { m: NaN, M: NaN, ok: false };
    for (let i = 1; i < N; i++) {
      const y0 = ys[i - 1], y1 = ys[i], y2 = ys[i + 1];
      if (y1 >= y0 && y1 >= y2 && (y1 > y0 || y1 > y2)) voir(extremum(f, u + (i - 1) * h, u + (i + 1) * h, +1));
      if (y1 <= y0 && y1 <= y2 && (y1 < y0 || y1 < y2)) voir(extremum(f, u + (i - 1) * h, u + (i + 1) * h, -1));
    }
    return { m, M, ok };
  }

  /** Intégrale de f sur [a, b] par la méthode de Simpson adaptative. */
  function simpsonAdaptatif(f, a, b, tol, profMax) {
    tol = tol || 1e-10; profMax = profMax === undefined ? 22 : profMax;
    const fa = f(a), fb = f(b), fm = f((a + b) / 2);
    const rec = (a, b, fa, fm, fb, S, tol, prof) => {
      const c = (a + b) / 2, d = (a + c) / 2, e = (c + b) / 2;
      const fd = f(d), fe = f(e);
      const Sg = (c - a) / 6 * (fa + 4 * fd + fm), Sd = (b - c) / 6 * (fm + 4 * fe + fb);
      const S2 = Sg + Sd;
      if (prof <= 0 || Math.abs(S2 - S) <= 15 * tol) return S2 + (S2 - S) / 15;
      return rec(a, c, fa, fd, fm, Sg, tol / 2, prof - 1) + rec(c, b, fm, fe, fb, Sd, tol / 2, prof - 1);
    };
    const r = rec(a, b, fa, fm, fb, (b - a) / 6 * (fa + 4 * fm + fb), tol, profMax);
    return Number.isFinite(r) ? r : NaN;
  }

  // ===========================================================================
  //  Analyseur d'expressions (fonction personnalisée)
  //  Grammaire : + − * / ^ (associatif à droite), moins unaire, parenthèses,
  //  multiplication implicite (2x, 3 sin(x), (x+1)(x−1)), fonctions usuelles,
  //  constantes pi et e, variable x. Produit une fonction JavaScript.
  // ===========================================================================
  const FONCS = {
    sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan',
    asin: 'Math.asin', acos: 'Math.acos', atan: 'Math.atan',
    arcsin: 'Math.asin', arccos: 'Math.acos', arctan: 'Math.atan',
    sinh: 'Math.sinh', cosh: 'Math.cosh', tanh: 'Math.tanh',
    exp: 'Math.exp', ln: 'Math.log', log: 'Math.log10', log10: 'Math.log10', log2: 'Math.log2',
    sqrt: 'Math.sqrt', racine: 'Math.sqrt', abs: 'Math.abs',
    floor: 'Math.floor', plancher: 'Math.floor', ceil: 'Math.ceil', plafond: 'Math.ceil',
    round: 'Math.round', sign: 'Math.sign', signe: 'Math.sign',
  };
  const CONSTS = { pi: 'Math.PI', e: 'Math.E' };
  const NOMS = Object.keys(FONCS).concat(Object.keys(CONSTS), ['x']).sort((p, q) => q.length - p.length);

  function pretraiter(s) {
    return s.replace(/²/g, '^2').replace(/³/g, '^3').replace(/[×·]/g, '*').replace(/÷/g, '/')
      .replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/,/g, '.').replace(/\*\*/g, '^');
  }

  /** « xsin » → x, sin ; « x2 » → x, 2 (plus long nom connu d'abord). */
  function decouperIdent(mot) {
    const out = [];
    let reste = mot;
    while (reste.length) {
      if (/^\d/.test(reste)) {
        const m = /^\d+(\.\d*)?/.exec(reste)[0];
        out.push({ type: 'num', valeur: parseFloat(m) }); reste = reste.slice(m.length); continue;
      }
      const nom = NOMS.find((n) => reste.startsWith(n));
      if (!nom) throw new Error(t('errNomInconnu', { x: reste }));
      out.push({ type: 'id', valeur: nom }); reste = reste.slice(nom.length);
    }
    return out;
  }

  function lexer(src) {
    const toks = [];
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }
      if (/[0-9.]/.test(c)) {
        const m = /^(\d+(\.\d*)?|\.\d+)/.exec(src.slice(i));
        if (!m) throw new Error(t('errNombre'));
        toks.push({ type: 'num', valeur: parseFloat(m[0]) }); i += m[0].length; continue;
      }
      if (/[a-zA-Z_]/.test(c)) {
        let j = i;
        while (j < src.length && /[a-zA-Z_0-9]/.test(src[j])) j++;
        const mot = src.slice(i, j);
        if (NOMS.indexOf(mot) >= 0) toks.push({ type: 'id', valeur: mot }); else toks.push.apply(toks, decouperIdent(mot));
        i = j; continue;
      }
      if ('+-*/^()'.indexOf(c) >= 0) { toks.push({ type: 'op', valeur: c }); i++; continue; }
      throw new Error(t('errCaractere', { x: c }));
    }
    return toks;
  }

  function compilerExpression(src) {
    const toks = lexer(pretraiter(String(src).trim()));
    if (!toks.length) throw new Error(t('errVide'));
    let p = 0;
    const estOp = (v) => { const t = toks[p]; return !!t && t.type === 'op' && t.valeur === v; };
    const attendre = (v) => { if (!estOp(v)) throw new Error(t('errAttendu', { x: v })); p++; };
    const debutFacteur = (t) => !!t && (t.type === 'num' || t.type === 'id' || (t.type === 'op' && t.valeur === '('));

    function expression() {
      let g = terme();
      while (estOp('+') || estOp('-')) { const op = toks[p++].valeur; const d = terme(); g = '(' + g + op + d + ')'; }
      return g;
    }
    function terme() {
      let g = unaire();
      for (;;) {
        if (estOp('*') || estOp('/')) { const op = toks[p++].valeur; g = '(' + g + op + unaire() + ')'; }
        else if (debutFacteur(toks[p])) g = '(' + g + '*' + puissance() + ')';   // multiplication implicite
        else return g;
      }
    }
    function unaire() {
      if (estOp('-')) { p++; return '(-' + unaire() + ')'; }
      if (estOp('+')) { p++; return unaire(); }
      return puissance();
    }
    function puissance() {
      const base = atome();
      if (estOp('^')) { p++; const ex = unaire(); return 'Math.pow(' + base + ',' + ex + ')'; }
      return base;
    }
    function atome() {
      const tk = toks[p];
      if (!tk) throw new Error(t('errFin'));
      if (tk.type === 'num') { p++; return String(tk.valeur); }
      if (tk.type === 'op' && tk.valeur === '(') { p++; const e = expression(); attendre(')'); return '(' + e + ')'; }
      if (tk.type === 'id') {
        p++;
        if (tk.valeur === 'x') return 'x';
        if (CONSTS[tk.valeur]) return CONSTS[tk.valeur];
        const fn = FONCS[tk.valeur];
        if (estOp('(')) { p++; const e = expression(); attendre(')'); return fn + '(' + e + ')'; }
        return fn + '(' + unaire() + ')';
      }
      throw new Error(t('errJeton', { x: tk.valeur }));
    }
    const code = expression();
    if (p < toks.length) throw new Error(t('errJeton', { x: toks[p].valeur }));
    const f = new Function('x', 'return ' + code + ';');   // code engendré uniquement à partir de nos jetons
    if (typeof f(0.5) !== 'number') throw new Error(t('errInvalide'));
    return f;
  }

  // ===========================================================================
  //  Fonctions prédéfinies
  //  f : la fonction ; F : une primitive (valeur de référence exacte de l'intégrale) ;
  //  crit : points critiques exacts (pour inf/sup) ; a, b : intervalle par défaut.
  // ===========================================================================
  const RAC3 = Math.sqrt(1 / 3);
  const PREDEFINIES = [
    { id: 'generique', libelle: 'generique',
      formule: '<i>f</i>(<i>x</i>) = 1.35 + 0.55 sin(1.5<i>x</i> + 0.4) + 0.3 cos(3.1<i>x</i>)',
      f: (x) => 1.35 + 0.55 * Math.sin(1.5 * x + 0.4) + 0.30 * Math.cos(3.1 * x),
      F: (x) => 1.35 * x - (0.55 / 1.5) * Math.cos(1.5 * x + 0.4) + (0.30 / 3.1) * Math.sin(3.1 * x),
      a: 0, b: 4 },
    { id: 'x', bouton: '<i>x</i>', formule: '<i>f</i>(<i>x</i>) = <i>x</i>',
      f: (x) => x, F: (x) => x * x / 2, crit: [], a: 0, b: 1 },
    { id: 'x2', bouton: '<i>x</i><sup>2</sup>', formule: '<i>f</i>(<i>x</i>) = <i>x</i><sup>2</sup>',
      f: (x) => x * x, F: (x) => x * x * x / 3, crit: [0], a: 0, b: 2 },
    { id: 'x3', bouton: '<i>x</i><sup>3</sup>', formule: '<i>f</i>(<i>x</i>) = <i>x</i><sup>3</sup>',
      f: (x) => x * x * x, F: (x) => x * x * x * x / 4, crit: [], a: -1, b: 1 },
    { id: 'x3x', bouton: '<i>x</i><sup>3</sup> − <i>x</i>', formule: '<i>f</i>(<i>x</i>) = <i>x</i><sup>3</sup> − <i>x</i>',
      f: (x) => x * x * x - x, F: (x) => x * x * x * x / 4 - x * x / 2, crit: [-RAC3, RAC3], a: -1, b: 1.5 },
    { id: 'perso', libelle: 'autre', formule: '', f: null, a: 0, b: 1 },
  ];

  // ===========================================================================
  //  État de l'application
  // ===========================================================================
  const etat = {
    langue: 'fr',
    fonction: 'generique',
    exprPerso: 'sqrt(x)', fPerso: null, erreurPerso: '',
    a: 0, b: 4,
    noeuds: [],                    // x_0, ..., x_n
    typePartition: 'uniforme',     // uniforme | quadratique | aleatoire | libre
    graine: 2026,
    typeMarques: 'aleatoire',      // gauche | droite | milieu | aleatoire | libre
    graineMarques: 1054,
    u: [],                         // positions relatives des marques (mode libre)
    affiche: { riemann: true, inf: false, sup: false },
    etiquettes: true, legende: true, tableau: false,
    decimales: 4,
    vue: { xmin: -0.6, xmax: 4.6, ymin: -0.8, ymax: 2.6 },
    survol: null, glisse: null, survolK: -1, animation: null,
  };

  const predef = () => PREDEFINIES.find((p) => p.id === etat.fonction) || PREDEFINIES[0];
  /** Formule d'une fonction prédéfinie, avec la virgule décimale en français. */
  const formuleHTML = (p) => (etat.langue === 'en' ? p.formule : p.formule.replace(/(\d)\.(\d)/g, '$1,$2'));
  const libelleFonction = (p) => (p.libelle ? t(p.libelle) : '<span class="math">' + p.bouton + '</span>');
  function fonctionCourante() {
    if (etat.fonction === 'perso') return etat.fPerso || ((x) => NaN);
    return predef().f;
  }
  const critCourants = () => (etat.fonction === 'perso' ? null : predef().crit || null);

  // ===========================================================================
  //  Partition et marques
  // ===========================================================================
  function genererNoeuds(type, n, a, b, graine) {
    const xs = new Array(n + 1);
    for (let k = 0; k <= n; k++) {
      let s = k / n;
      if (type === 'quadratique') s = s * s;
      else if (type === 'aleatoire' && k > 0 && k < n) s = (k + 0.9 * (hash01(graine, k) - 0.5)) / n;
      xs[k] = a + (b - a) * s;
    }
    xs[0] = a; xs[n] = b;
    return xs;
  }

  /** Marques t_k (k = 1..n) selon le mode courant. */
  function marques() {
    const xs = etat.noeuds, n = xs.length - 1, t = new Array(n);
    for (let k = 1; k <= n; k++) {
      let u;
      switch (etat.typeMarques) {
        case 'gauche': u = 0; break;
        case 'droite': u = 1; break;
        case 'milieu': u = 0.5; break;
        case 'aleatoire': u = hash01(etat.graineMarques, k); break;
        default: u = etat.u[k - 1] !== undefined ? etat.u[k - 1] : 0.5;
      }
      t[k - 1] = xs[k - 1] + u * (xs[k] - xs[k - 1]);
    }
    return t;
  }

  /** Positions relatives u_k des marques courantes (pour passer en mode libre). */
  function positionsRelatives() {
    const xs = etat.noeuds, t = marques();
    return t.map((tk, k) => clamp((tk - xs[k]) / (xs[k + 1] - xs[k]), 0, 1));
  }

  function passerMarquesLibres() {
    if (etat.typeMarques !== 'libre') { etat.u = positionsRelatives(); etat.typeMarques = 'libre'; }
  }

  function ajusterU(n) {
    if (etat.typeMarques !== 'libre') return;
    const u = etat.u.slice(0, n);
    while (u.length < n) u.push(0.5);
    etat.u = u;
  }

  /** Insère le point x dans la partition (raffinement P ∪ {x}). */
  function ajouterNoeud(x) {
    const xs = etat.noeuds;
    if (!(x > etat.a && x < etat.b)) return false;
    let k = 1;
    while (k < xs.length && xs[k] < x) k++;
    const ecart = (etat.b - etat.a) * 1e-9;
    if (Math.abs(x - xs[k]) < ecart || Math.abs(x - xs[k - 1]) < ecart) return false;
    xs.splice(k, 0, x);
    if (etat.typeMarques === 'libre') etat.u.splice(k - 1, 0, etat.u[k - 1] !== undefined ? etat.u[k - 1] : 0.5);
    etat.typePartition = 'libre';
    return true;
  }

  /** Retire le point intérieur x_k. */
  function retirerNoeud(k) {
    const xs = etat.noeuds;
    if (k <= 0 || k >= xs.length - 1 || xs.length <= 2) return false;
    xs.splice(k, 1);
    if (etat.typeMarques === 'libre') etat.u.splice(k, 1);
    etat.typePartition = 'libre';
    return true;
  }

  function bissecterPlusGrand() {
    const xs = etat.noeuds;
    let kmax = 1, dmax = -1;
    for (let k = 1; k < xs.length; k++) { const d = xs[k] - xs[k - 1]; if (d > dmax) { dmax = d; kmax = k; } }
    ajouterNoeud((xs[kmax - 1] + xs[kmax]) / 2);
  }

  function retirerNoeudMoinsUtile() {
    const xs = etat.noeuds;
    if (xs.length <= 2) return;
    let kmin = 1, dmin = Infinity;
    for (let k = 1; k < xs.length - 1; k++) { const d = xs[k + 1] - xs[k - 1]; if (d < dmin) { dmin = d; kmin = k; } }
    retirerNoeud(kmin);
  }

  function definirN(n2) {
    n2 = clamp(Math.round(n2), 1, NMAX);
    const n = etat.noeuds.length - 1;
    if (n2 === n) return;
    if (etat.typePartition === 'libre') {
      while (etat.noeuds.length - 1 < n2) bissecterPlusGrand();
      while (etat.noeuds.length - 1 > n2) retirerNoeudMoinsUtile();
    } else {
      etat.noeuds = genererNoeuds(etat.typePartition, n2, etat.a, etat.b, etat.graine);
      ajusterU(n2);
    }
    maj();
  }

  function pasN(n, sens) {
    const m = sens > 0 ? n : n - 1;
    return m < 20 ? 1 : m < 50 ? 2 : m < 100 ? 5 : m < 300 ? 10 : 50;
  }
  function changerN(sens) {
    const n = etat.noeuds.length - 1;
    definirN(n + sens * pasN(n, sens));
  }

  /** Raffinement dyadique : 2n sous-intervalles. */
  function doubler() {
    const n = etat.noeuds.length - 1;
    if (2 * n > NMAX) return;
    if (etat.typePartition === 'uniforme' || etat.typePartition === 'quadratique') { definirN(2 * n); return; }
    const xs = etat.noeuds, nouveaux = [xs[0]];
    for (let k = 1; k < xs.length; k++) nouveaux.push((xs[k - 1] + xs[k]) / 2, xs[k]);
    if (etat.typeMarques === 'libre') { const u = []; etat.u.forEach((v) => u.push(v, v)); etat.u = u; }
    etat.noeuds = nouveaux;
    etat.typePartition = 'libre';
    maj();
  }

  function definirTypePartition(type) {
    etat.typePartition = type;
    if (type !== 'libre') {
      const n = etat.noeuds.length - 1;
      etat.noeuds = genererNoeuds(type, n, etat.a, etat.b, etat.graine);
    }
    maj();
  }

  /** Déplace a ou b ; les autres points sont mis à l'échelle (affinement). */
  function deplacerExtremite(quel, val) {
    const a0 = etat.a, b0 = etat.b;
    const a1 = quel === 'a' ? val : a0, b1 = quel === 'b' ? val : b0;
    if (!(b1 > a1) || !Number.isFinite(a1) || !Number.isFinite(b1)) return false;
    const xs = etat.noeuds, s = (b1 - a1) / (b0 - a0);
    for (let k = 0; k < xs.length; k++) xs[k] = a1 + (xs[k] - a0) * s;
    xs[0] = a1; xs[xs.length - 1] = b1;
    etat.a = a1; etat.b = b1;
    return true;
  }

  // ===========================================================================
  //  Calculs
  // ===========================================================================
  let resultats = null;          // cache des sommes pour l'état courant
  let cacheBornes = { cle: '', val: null };
  let cacheIntegrale = { cle: '', val: NaN };

  const cleFonction = () => etat.fonction + '|' + (etat.fonction === 'perso' ? etat.exprPerso : '') + '|' + etat.a + '|' + etat.b;

  function calculer() {
    const f = fonctionCourante(), xs = etat.noeuds, n = xs.length - 1, t = marques(), crit = critCourants();
    const nEch = clamp(Math.ceil(2400 / n), 8, 160);
    let S = 0, L = 0, U = 0, pas = 0, ok = true;
    const lignes = new Array(n);
    for (let k = 1; k <= n; k++) {
      const x0 = xs[k - 1], x1 = xs[k], dx = x1 - x0;
      if (dx > pas) pas = dx;
      const ft = f(t[k - 1]);
      const b = infSup(f, x0, x1, crit, nEch);
      if (!b.ok || !Number.isFinite(ft)) ok = false;
      S += ft * dx; L += b.m * dx; U += b.M * dx;
      lignes[k - 1] = { k, x0, x1, dx, t: t[k - 1], ft, m: b.m, M: b.M };
    }
    if (!ok) { S = Number.isFinite(S) ? S : NaN; L = NaN; U = NaN; }
    return { n, pas, S, L, U, ok, lignes, t };
  }

  /** inf et sup de f sur [a, b] (bornes m et M du lemme). */
  function bornesGlobales() {
    const cle = cleFonction();
    if (cacheBornes.cle !== cle) cacheBornes = { cle, val: infSup(fonctionCourante(), etat.a, etat.b, critCourants(), 600) };
    return cacheBornes.val;
  }

  /** Valeur de référence de ∫_a^b f : primitive si connue, sinon Simpson adaptatif. */
  function integraleCourante() {
    const cle = cleFonction();
    if (cacheIntegrale.cle !== cle) {
      const p = predef();
      let val;
      if (etat.fonction !== 'perso' && p.F) val = p.F(etat.b) - p.F(etat.a);
      else val = simpsonAdaptatif(fonctionCourante(), etat.a, etat.b);
      cacheIntegrale = { cle, val };
    }
    return cacheIntegrale.val;
  }

  // ===========================================================================
  //  Canevas et transformations
  // ===========================================================================
  const canvas = document.getElementById('graphe');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const zone = { x: 0, y: 0, w: 0, h: 0 };             // zone de tracé (px CSS)
  const MARGE = { gauche: 48, bas: 26, haut: 12, droite: 16 };

  function redimensionner() {
    const r = canvas.parentElement.getBoundingClientRect();
    W = Math.max(60, Math.round(r.width)); H = Math.max(60, Math.round(r.height));
    dpr = window.devicePixelRatio || 1;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    zone.x = MARGE.gauche; zone.y = MARGE.haut;
    zone.w = W - MARGE.gauche - MARGE.droite; zone.h = H - MARGE.haut - MARGE.bas;
    demanderDessin();
  }

  const sx = (x) => zone.x + (x - etat.vue.xmin) / (etat.vue.xmax - etat.vue.xmin) * zone.w;
  const sy = (y) => zone.y + zone.h - (y - etat.vue.ymin) / (etat.vue.ymax - etat.vue.ymin) * zone.h;
  const wx = (px) => etat.vue.xmin + (px - zone.x) / zone.w * (etat.vue.xmax - etat.vue.xmin);
  const wy = (py) => etat.vue.ymin + (zone.y + zone.h - py) / zone.h * (etat.vue.ymax - etat.vue.ymin);

  /** Ordonnée (px) du « rail » portant les poignées : l'axe des x, ramené dans la zone visible. */
  const railCourant = () => clamp(sy(0), zone.y + 24, zone.y + zone.h - 44);

  function recadrer() {
    const a = etat.a, b = etat.b;
    const g = bornesGlobales();
    let ymin = Math.min(0, g.ok ? g.m : 0), ymax = Math.max(0, g.ok ? g.M : 1);
    if (!(ymax - ymin > 1e-12)) { ymin -= 1; ymax += 1; }
    const px = (b - a) * 0.16, py = (ymax - ymin) * 0.16;
    etat.vue = { xmin: a - px, xmax: b + px, ymin: ymin - (ymin >= -1e-12 ? 2.2 * py : py), ymax: ymax + py };
    demanderDessin();
  }

  // ===========================================================================
  //  Dessin
  // ===========================================================================
  let dessinDemande = false;
  function demanderDessin() {
    if (!dessinDemande) { dessinDemande = true; requestAnimationFrame(dessiner); }
  }

  /** Invalide les calculs, met à jour le panneau et redessine. */
  function maj() {
    resultats = null;
    majPanneau();
    demanderDessin();
  }

  function cercle(X, Y, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.arc(X, Y, r, 0, 2 * Math.PI);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }

  function rectangle(X0, Y0, X1, Y1, fill, stroke) {
    const x = Math.min(X0, X1), y = Math.min(Y0, Y1), w = Math.abs(X1 - X0), h = Math.abs(Y1 - Y0);
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
    if (stroke && w > 2.5 && h > 1) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1)); }
  }

  const estLettre = (ch) => /[a-zA-ZÀ-ɏḀ-ỿ]/.test(ch);

  /** Découpe une chaîne « mathématique » (x_k, t_{12}, f(t_k), a = x_0, ‖P‖) en segments. */
  function segmenterMath(texte) {
    const segs = [];
    const pousser = (t, it, niveau) => {
      const d = segs[segs.length - 1];
      if (d && d.it === it && d.niveau === niveau) d.t += t; else segs.push({ t, it, niveau });
    };
    let i = 0;
    while (i < texte.length) {
      const c = texte[i];
      if (c === '_' || c === '^') {
        const niveau = c === '_' ? -1 : 1;
        i++;
        let contenu;
        if (texte[i] === '{') { const j = texte.indexOf('}', i); contenu = texte.slice(i + 1, j < 0 ? texte.length : j); i = j < 0 ? texte.length : j + 1; }
        else { contenu = texte[i] || ''; i++; }
        for (const ch of contenu) pousser(ch, estLettre(ch), niveau);
        continue;
      }
      pousser(c, estLettre(c), 0); i++;
    }
    return segs;
  }

  /** Dessine du texte mathématique (lettres en italique, indices/exposants). Renvoie la largeur. */
  function dessinerMath(texte, X, Y, o) {
    o = o || {};
    const taille = o.taille || 13, couleur = o.couleur || C.texte, align = o.align || 'center';
    const gras = o.gras ? 'bold ' : '';
    const segs = segmenterMath(texte);
    ctx.textBaseline = o.base || 'alphabetic';
    let largeur = 0;
    for (const s of segs) {
      s.font = (s.it ? 'italic ' : '') + gras + (s.niveau ? Math.round(taille * 0.74) : taille) + 'px ' + POLICE_MATH;
      ctx.font = s.font; s.w = ctx.measureText(s.t).width; largeur += s.w;
    }
    if (o.mesurer) return largeur;
    let x = align === 'center' ? X - largeur / 2 : align === 'right' ? X - largeur : X;
    ctx.textAlign = 'left'; ctx.fillStyle = couleur;
    for (const s of segs) {
      ctx.font = s.font;
      const dy = s.niveau < 0 ? taille * 0.3 : s.niveau > 0 ? -taille * 0.42 : 0;
      ctx.fillText(s.t, x, Y + dy); x += s.w;
    }
    return largeur;
  }

  function dessiner() {
    dessinDemande = false;
    nbDessins++;
    if (!zone.w || !zone.h) return;
    if (!resultats) resultats = calculer();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);

    const grad = dessinerGrille();
    ctx.save();
    ctx.beginPath(); ctx.rect(zone.x, zone.y, zone.w, zone.h); ctx.clip();
    dessinerSurvolIntervalle();
    dessinerRectangles();
    dessinerAxes();
    dessinerCourbe();
    dessinerNoeudsEtMarques();
    ctx.restore();
    dessinerEtiquettesAxes(grad);
    if (etat.legende) dessinerLegende();
    dessinerInfobulle();
  }

  function dessinerGrille() {
    const v = etat.vue;
    const px = pasJoli(v.xmax - v.xmin, zone.w / 110), py = pasJoli(v.ymax - v.ymin, zone.h / 70);
    ctx.save();
    ctx.beginPath(); ctx.rect(zone.x, zone.y, zone.w, zone.h); ctx.clip();
    ctx.strokeStyle = C.grille; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = Math.ceil(v.xmin / px); i * px <= v.xmax; i++) { const X = Math.round(sx(i * px)) + 0.5; ctx.moveTo(X, zone.y); ctx.lineTo(X, zone.y + zone.h); }
    for (let i = Math.ceil(v.ymin / py); i * py <= v.ymax; i++) { const Y = Math.round(sy(i * py)) + 0.5; ctx.moveTo(zone.x, Y); ctx.lineTo(zone.x + zone.w, Y); }
    ctx.stroke();
    ctx.restore();
    return { px, py };
  }

  function dessinerEtiquettesAxes(grad) {
    const v = etat.vue;
    ctx.fillStyle = C.gris; ctx.font = '11.5px ' + POLICE_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let i = Math.ceil(v.xmin / grad.px); i * grad.px <= v.xmax; i++) {
      const X = sx(i * grad.px);
      if (X < zone.x + 8 || X > zone.x + zone.w - 8) continue;
      ctx.fillText(fmtAxe(i * grad.px, grad.px), X, zone.y + zone.h + 7);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let i = Math.ceil(v.ymin / grad.py); i * grad.py <= v.ymax; i++) {
      const Y = sy(i * grad.py);
      if (Y < zone.y + 6 || Y > zone.y + zone.h - 6) continue;
      ctx.fillText(fmtAxe(i * grad.py, grad.py), zone.x - 7, Y);
    }
  }

  function dessinerAxes() {
    ctx.strokeStyle = C.noir; ctx.fillStyle = C.noir; ctx.lineWidth = 1.3;
    const Y0 = sy(0), X0 = sx(0);
    if (Y0 >= zone.y && Y0 <= zone.y + zone.h) {
      ctx.beginPath(); ctx.moveTo(zone.x, Y0); ctx.lineTo(zone.x + zone.w - 2, Y0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(zone.x + zone.w - 1, Y0); ctx.lineTo(zone.x + zone.w - 10, Y0 - 4); ctx.lineTo(zone.x + zone.w - 10, Y0 + 4); ctx.closePath(); ctx.fill();
      dessinerMath('x', zone.x + zone.w - 9, Y0 - 9, { taille: 13, align: 'right' });
    }
    if (X0 >= zone.x && X0 <= zone.x + zone.w) {
      ctx.beginPath(); ctx.moveTo(X0, zone.y + zone.h); ctx.lineTo(X0, zone.y + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X0, zone.y + 1); ctx.lineTo(X0 - 4, zone.y + 10); ctx.lineTo(X0 + 4, zone.y + 10); ctx.closePath(); ctx.fill();
      dessinerMath('y', X0 + 9, zone.y + 14, { taille: 13, align: 'left' });
    }
  }

  function dessinerSurvolIntervalle() {
    if (etat.survolK < 0 || !resultats || etat.survolK >= resultats.n) return;
    const L = resultats.lignes[etat.survolK];
    ctx.fillStyle = 'rgba(219,163,38,0.16)';
    ctx.fillRect(sx(L.x0), zone.y, sx(L.x1) - sx(L.x0), zone.h);
  }

  function dessinerRectangles() {
    const r = resultats, aff = etat.affiche, n = r.n, Y0 = sy(0);
    const riemannSeul = aff.riemann && !aff.inf && !aff.sup;
    if (aff.inf || aff.sup) {
      for (let k = 0; k < n; k++) {
        const L = r.lignes[k];
        if (!Number.isFinite(L.m) || !Number.isFinite(L.M)) continue;
        const X0 = sx(L.x0), X1 = sx(L.x1);
        const rects = [];
        if (aff.sup) rects.push({ h: L.M, fill: C.orClair, stroke: C.orMoyen });
        if (aff.inf) rects.push({ h: L.m, fill: C.vertClair, stroke: C.vertMoyen });
        if (rects.length === 2 && Math.abs(L.m) > Math.abs(L.M)) rects.reverse();   // le plus grand d'abord
        for (const q of rects) rectangle(X0, Y0, X1, sy(q.h), q.fill, q.stroke);
      }
    }
    if (aff.riemann) {
      if (riemannSeul) {
        for (let k = 0; k < n; k++) {
          const L = r.lignes[k];
          if (!Number.isFinite(L.ft)) continue;
          rectangle(sx(L.x0), Y0, sx(L.x1), sy(L.ft), C.orClair, C.orMoyen);
        }
      }
      // lignes pointillées à t_k (si peu de sous-intervalles)
      if (n <= 60) {
        ctx.save();
        ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.strokeStyle = riemannSeul ? C.orMoyen : 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        for (let k = 0; k < n; k++) {
          const L = r.lignes[k];
          if (!Number.isFinite(L.ft)) continue;
          const X = sx(L.t); ctx.moveTo(X, Y0); ctx.lineTo(X, sy(L.ft));
        }
        ctx.stroke();
        ctx.restore();
      }
      if (!riemannSeul) {   // escalier noir : hauteurs f(t_k), entre L et U
        ctx.strokeStyle = C.noir; ctx.lineWidth = 1.8; ctx.lineJoin = 'miter';
        ctx.beginPath();
        for (let k = 0; k < n; k++) {
          const L = r.lignes[k];
          if (!Number.isFinite(L.ft)) continue;
          const X0 = sx(L.x0), X1 = sx(L.x1), Y = sy(L.ft);
          ctx.moveTo(X0, Y0); ctx.lineTo(X0, Y); ctx.lineTo(X1, Y); ctx.lineTo(X1, Y0);
        }
        ctx.stroke();
      }
    }
  }

  function dessinerCourbe() {
    const f = fonctionCourante();
    ctx.strokeStyle = C.vert; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath();
    let plume = false;
    const yHaut = zone.y - 3000, yBas = zone.y + zone.h + 3000;
    for (let px = zone.x; px <= zone.x + zone.w; px += 1) {
      const y = f(wx(px));
      if (!Number.isFinite(y)) { plume = false; continue; }
      const Y = clamp(sy(y), yHaut, yBas);
      if (!plume) { ctx.moveTo(px, Y); plume = true; } else ctx.lineTo(px, Y);
    }
    ctx.stroke();
  }

  function dessinerNoeudsEtMarques() {
    const r = resultats, n = r.n, xs = etat.noeuds;
    const railY = railCourant(), Y0 = sy(0);
    const axeVisible = Math.abs(railY - Y0) < 0.5;
    if (!axeVisible) {   // rail de substitution lorsque l'axe des x n'est pas visible
      ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = '#B9B7AE'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(zone.x, railY + 0.5); ctx.lineTo(zone.x + zone.w, railY + 0.5); ctx.stroke(); ctx.restore();
    }
    const etiq = etat.etiquettes && n <= 12;

    // Marques : point noir sur l'axe (étiquette t_k) et point vert sur la courbe (poignée)
    if (etat.affiche.riemann) {
      for (let k = 0; k < n; k++) {
        const L = r.lignes[k];
        if (!Number.isFinite(L.ft)) continue;
        const X = sx(L.t);
        cercle(X, railY, 2.6, C.noir);
        if (etiq) dessinerMath('t_{' + (k + 1) + '}', X, railY + 11, { taille: 11.5, base: 'top' });
      }
      for (let k = 0; k < n; k++) {
        const L = r.lignes[k];
        if (!Number.isFinite(L.ft)) continue;
        const surv = etat.survol && etat.survol.type === 'marque' && etat.survol.k === k;
        cercle(sx(L.t), sy(L.ft), surv ? 6.5 : 4.3, surv ? C.or : C.vert, '#fff', 1.6);
      }
    }

    // Nœuds : traits noirs, a et b en points pleins
    const survNoeud = etat.survol && etat.survol.type === 'noeud' ? etat.survol.k : -1;
    for (let k = 0; k <= n; k++) {
      const X = sx(xs[k]), ext = (k === 0 || k === n), surv = k === survNoeud;
      if (surv) {
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = C.or; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X, zone.y); ctx.lineTo(X, zone.y + zone.h); ctx.stroke(); ctx.restore();
      }
      ctx.strokeStyle = surv ? C.or : C.noir; ctx.lineWidth = ext ? 2.4 : (surv ? 3 : 2);
      const demi = ext ? 9 : 7;
      ctx.beginPath(); ctx.moveTo(X, railY - demi); ctx.lineTo(X, railY + demi); ctx.stroke();
      if (ext) cercle(X, railY, surv ? 7 : 5.5, surv ? C.or : C.noir, '#fff', 1.6);
    }

    // Étiquettes des nœuds
    if (etat.etiquettes) {
      const yEt = railY + (etat.affiche.riemann && etiq ? 27 : 13);
      if (n <= 12) {
        let dernierX = -Infinity;
        for (let k = 0; k <= n; k++) {
          const X = sx(xs[k]);
          const texte = k === 0 ? 'a = x_0' : k === n ? 'x_{' + n + '} = b' : 'x_{' + k + '}';
          if (k !== 0 && k !== n && X - dernierX < 34) continue;
          dessinerMath(texte, X, yEt, { taille: 13.5, base: 'top' });
          dernierX = X;
        }
      } else {
        dessinerMath('a', sx(xs[0]), yEt, { taille: 15, base: 'top', gras: true });
        dessinerMath('b', sx(xs[n]), yEt, { taille: 15, base: 'top', gras: true });
      }
    }
  }

  function dessinerLegende() {
    const r = resultats, aff = etat.affiche, d = etat.decimales;
    const lignes = [];
    lignes.push({ math: 'n = ' + r.n + '     ‖P‖ = ' + fmt(r.pas, d) });
    if (aff.riemann) lignes.push({ pastille: 'S', math: 'S(f;Ṗ)', valeur: fmt(r.S, d) });
    if (aff.inf) lignes.push({ pastille: 'L', math: 'L(f;P)', valeur: fmt(r.L, d) });
    if (aff.sup) lignes.push({ pastille: 'U', math: 'U(f;P)', valeur: fmt(r.U, d) });
    if (aff.inf && aff.sup) lignes.push({ math: 'U − L', valeur: fmt(r.U - r.L, d) });
    lignes.push({ math: '∫_a^b f', valeur: fmt(integraleCourante(), d), accent: true });
    if (!r.ok) lignes.push({ texte: t('nonBornee') });

    const taille = 14, hl = 21, pad = 10;
    let wMax = 0;
    for (const l of lignes) {
      let w = 0;
      if (l.math) w += dessinerMath(l.math, 0, 0, { taille, mesurer: true });
      if (l.valeur) { ctx.font = taille + 'px ' + POLICE_UI; w = Math.max(w, 78) + 14 + ctx.measureText(l.valeur).width; }
      if (l.texte) { ctx.font = 'bold ' + taille + 'px ' + POLICE_UI; w = ctx.measureText(l.texte).width; }
      if (l.pastille) w += 22;
      wMax = Math.max(wMax, w);
    }
    const bw = wMax + 2 * pad, bh = lignes.length * hl + 2 * pad - 4;
    const X0 = sx(0);   // l'encadré s'écarte de l'axe des y s'il est près du bord gauche
    const bx = (X0 >= zone.x - 1 && X0 < zone.x + 170) ? X0 + 16 : zone.x + 10, by = zone.y + 10;
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = C.bord; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(bx + 0.5, by + 0.5, bw, bh, 7); ctx.fill(); ctx.stroke();
    let y = by + pad + taille;
    for (const l of lignes) {
      let x = bx + pad;
      if (l.pastille) {
        const st = l.pastille === 'L' ? [C.vertClair, C.vertMoyen] : l.pastille === 'U' ? [C.orClair, C.orMoyen] : [C.orClair, C.noir];
        ctx.fillStyle = st[0]; ctx.fillRect(x, y - 11, 13, 13); ctx.strokeStyle = st[1]; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y - 10.5, 12, 12);
        x += 22;
      }
      if (l.math) dessinerMath(l.math, x, y, { taille, align: 'left', couleur: C.texte });
      if (l.valeur) {
        ctx.font = (l.accent ? 'bold ' : '') + taille + 'px ' + POLICE_UI; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = l.accent ? '#0B6E43' : C.texte; ctx.fillText(l.valeur, bx + bw - pad, y);
      }
      if (l.texte) { ctx.font = 'bold ' + taille + 'px ' + POLICE_UI; ctx.textAlign = 'left'; ctx.fillStyle = C.texte; ctx.fillText(l.texte, x, y); }
      y += hl;
    }
  }

  let pointeur = { x: 0, y: 0 };
  function dessinerInfobulle() {
    const s = etat.survol;
    if (!s || !resultats) return;
    let texte;
    const xs = etat.noeuds, n = xs.length - 1;
    if (s.type === 'noeud') texte = (s.k === 0 ? 'a = x_0 = ' : s.k === n ? 'b = x_{' + n + '} = ' : 'x_{' + s.k + '} = ') + fmt(xs[s.k]);
    else { const L = resultats.lignes[s.k]; texte = 't_{' + (s.k + 1) + '} = ' + fmt(L.t) + ',   f(t_{' + (s.k + 1) + '}) = ' + fmt(L.ft); }
    const taille = 13, w = dessinerMath(texte, 0, 0, { taille, mesurer: true }) + 16, h = 24;
    let x = pointeur.x + 14, y = pointeur.y - 30;
    if (x + w > zone.x + zone.w) x = pointeur.x - w - 10;
    if (y < zone.y) y = pointeur.y + 18;
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = C.or; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x + 0.5, y + 0.5, w, h, 5); ctx.fill(); ctx.stroke();
    dessinerMath(texte, x + 8, y + 17, { taille, align: 'left' });
  }

  // ===========================================================================
  //  Interactions avec le graphe
  // ===========================================================================
  const posEvt = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  function trouverCible(px, py) {
    if (!resultats) resultats = calculer();
    const xs = etat.noeuds, n = xs.length - 1, railY = railCourant();
    let meilleur = null, dmin = Infinity;
    if (Math.abs(py - railY) <= 16) {
      for (let k = 0; k <= n; k++) {
        const d = Math.abs(px - sx(xs[k])), tol = (k === 0 || k === n) ? 11 : 8;
        if (d <= tol && d < dmin) { dmin = d; meilleur = { type: 'noeud', k }; }
      }
    }
    if (meilleur) return meilleur;
    if (etat.affiche.riemann) {
      for (let k = 0; k < n; k++) {
        const L = resultats.lignes[k];
        if (!Number.isFinite(L.ft)) continue;
        const d = Math.hypot(px - sx(L.t), py - sy(L.ft));
        if (d <= 11 && d < dmin) { dmin = d; meilleur = { type: 'marque', k }; }
      }
    }
    return meilleur;
  }
  const memeCible = (c1, c2) => (!c1 && !c2) || (!!c1 && !!c2 && c1.type === c2.type && c1.k === c2.k);

  function indiceSousIntervalle(x) {
    const xs = etat.noeuds;
    if (x < xs[0] || x > xs[xs.length - 1]) return -1;
    let k = 1;
    while (k < xs.length - 1 && xs[k] < x) k++;
    return k - 1;
  }

  function glisser(p) {
    const g = etat.glisse;
    if (g.type === 'pan') {
      const dx = (p.x - g.x0) / zone.w * (g.vue0.xmax - g.vue0.xmin), dy = (p.y - g.y0) / zone.h * (g.vue0.ymax - g.vue0.ymin);
      etat.vue = { xmin: g.vue0.xmin - dx, xmax: g.vue0.xmax - dx, ymin: g.vue0.ymin + dy, ymax: g.vue0.ymax + dy };
      demanderDessin();
      return;
    }
    const x = wx(p.x), xs = etat.noeuds, n = xs.length - 1;
    const pxMonde = (etat.vue.xmax - etat.vue.xmin) / zone.w;
    if (g.type === 'noeud') {
      if (g.k === 0) deplacerExtremite('a', Math.min(x, etat.b - 14 * pxMonde));
      else if (g.k === n) deplacerExtremite('b', Math.max(x, etat.a + 14 * pxMonde));
      else {
        const ecart = Math.max(2 * pxMonde, (etat.b - etat.a) * 1e-6);
        xs[g.k] = clamp(x, xs[g.k - 1] + ecart, xs[g.k + 1] - ecart);
        etat.typePartition = 'libre';
      }
    } else if (g.type === 'marque') {
      passerMarquesLibres();
      const x0 = xs[g.k], x1 = xs[g.k + 1];
      etat.u[g.k] = clamp((x - x0) / (x1 - x0), 0, 1);
    }
    maj();
  }

  function majCurseur(cible) {
    canvas.classList.toggle('poignee', !!cible && !etat.glisse);
    canvas.classList.toggle('glisse', !!etat.glisse && etat.glisse.type === 'pan');
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(e.pointerId);
    const p = posEvt(e), cible = trouverCible(p.x, p.y);
    etat.glisse = cible ? Object.assign({}, cible) : { type: 'pan', x0: p.x, y0: p.y, vue0: Object.assign({}, etat.vue) };
    majCurseur(cible);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = posEvt(e); pointeur = p;
    if (etat.glisse) { glisser(p); return; }
    const c = trouverCible(p.x, p.y);
    if (!memeCible(c, etat.survol)) { etat.survol = c; majCurseur(c); }
    if (etat.tableau) {
      const k = indiceSousIntervalle(wx(p.x));
      if (k !== etat.survolK) { etat.survolK = k; majSurvolTableau(); }
    }
    if (c || etat.survol) demanderDessin();
  });
  const finGlisse = () => { if (etat.glisse) { etat.glisse = null; majCurseur(etat.survol); demanderDessin(); } };
  canvas.addEventListener('pointerup', finGlisse);
  canvas.addEventListener('pointercancel', finGlisse);
  canvas.addEventListener('pointerleave', () => { etat.survol = null; if (etat.survolK !== -1) { etat.survolK = -1; majSurvolTableau(); } majCurseur(null); demanderDessin(); });

  canvas.addEventListener('dblclick', (e) => {
    const p = posEvt(e), c = trouverCible(p.x, p.y), n = etat.noeuds.length - 1;
    if (c && c.type === 'noeud') { if (c.k > 0 && c.k < n && retirerNoeud(c.k)) maj(); return; }
    if (c) return;
    if (ajouterNoeud(wx(p.x))) maj();
  });

  let accumMolette = 0;
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
    if (e.ctrlKey || e.shiftKey || e.metaKey) { zoomer(posEvt(e), Math.exp(delta * 0.0018)); return; }
    accumMolette += delta;
    if (Math.abs(accumMolette) < 24) return;
    const sens = accumMolette < 0 ? 1 : -1;
    accumMolette = 0;
    changerN(sens);
  }, { passive: false });

  function zoomer(p, facteur) {
    const v = etat.vue, x = wx(p.x), y = wy(p.y);
    etat.vue = { xmin: x - (x - v.xmin) * facteur, xmax: x + (v.xmax - x) * facteur, ymin: y - (y - v.ymin) * facteur, ymax: y + (v.ymax - y) * facteur };
    demanderDessin();
  }

  // ===========================================================================
  //  Panneau de commandes
  // ===========================================================================
  const $ = (id) => document.getElementById(id);
  const el = {
    fonctions: $('fonctions'), perso: $('perso'), expr: $('expr'), erreurExpr: $('erreur-expr'), formule: $('formule'),
    a: $('champ-a'), b: $('champ-b'), recadrer: $('btn-recadrer'),
    n: $('champ-n'), curseur: $('curseur-n'), moins: $('btn-moins'), plus: $('btn-plus'), doubler: $('btn-doubler'), animer: $('btn-animer'),
    typesPartition: $('types-partition'), tiragePartition: $('btn-tirage-partition'), descPartition: $('desc-partition'),
    typesMarques: $('types-marques'), tirageMarques: $('btn-tirage-marques'), descMarques: $('desc-marques'),
    affRiemann: $('aff-riemann'), affInf: $('aff-inf'), affSup: $('aff-sup'),
    optEtiquettes: $('opt-etiquettes'), optLegende: $('opt-legende'), optTableau: $('opt-tableau'), decimales: $('decimales'),
    valN: $('val-n'), valPas: $('val-pas'), valS: $('val-S'), valL: $('val-L'), valU: $('val-U'), valUL: $('val-UL'), valInt: $('val-int'),
    avertissement: $('avertissement'), encadrement: $('encadrement'),
    carteTableau: $('carte-tableau'), tableau: $('tableau').querySelector('tbody'), tableauNote: $('tableau-note'),
    aide: $('aide'), btnAide: $('btn-aide'), fermerAide: $('btn-fermer-aide'), btnPanneau: $('btn-panneau'), btnPleinEcran: $('btn-plein-ecran'),
    btnLangue: $('btn-langue'),
  };

  function majSegment(conteneur, attribut, valeur) {
    conteneur.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b.dataset[attribut] === valeur ? 'true' : 'false'));
  }

  function majChampsAB() {
    if (document.activeElement !== el.a) el.a.value = String(Math.round(etat.a * 1e6) / 1e6);
    if (document.activeElement !== el.b) el.b.value = String(Math.round(etat.b * 1e6) / 1e6);
  }

  function majPanneau() {
    if (!resultats) resultats = calculer();
    const r = resultats, aff = etat.affiche;
    const n = r.n;
    if (document.activeElement !== el.n) el.n.value = String(n);
    el.curseur.value = String(Math.min(n, +el.curseur.max));
    el.doubler.disabled = 2 * n > NMAX;
    el.plus.disabled = n >= NMAX;
    el.moins.disabled = n <= 1;
    majChampsAB();
    majSegment(el.fonctions, 'fonction', etat.fonction);
    majSegment(el.typesPartition, 'type', etat.typePartition);
    majSegment(el.typesMarques, 'marques', etat.typeMarques);
    el.descPartition.textContent = t('part.' + etat.typePartition);
    el.descMarques.textContent = t('marq.' + etat.typeMarques);
    el.perso.hidden = etat.fonction !== 'perso';
    el.formule.innerHTML = etat.fonction === 'perso'
      ? '<i>f</i>(<i>x</i>) = ' + echapper(etat.exprPerso)
      : formuleHTML(predef());
    el.affRiemann.checked = aff.riemann; el.affInf.checked = aff.inf; el.affSup.checked = aff.sup;
    el.optEtiquettes.checked = etat.etiquettes; el.optLegende.checked = etat.legende; el.optTableau.checked = etat.tableau;

    el.valN.textContent = String(n);
    el.valPas.textContent = fmt(r.pas);
    el.valS.textContent = fmt(r.S); el.valS.classList.toggle('inactif', !aff.riemann);
    el.valL.textContent = fmt(r.L); el.valL.classList.toggle('inactif', !aff.inf);
    el.valU.textContent = fmt(r.U); el.valU.classList.toggle('inactif', !aff.sup);
    el.valUL.textContent = fmt(r.U - r.L); el.valUL.classList.toggle('inactif', !(aff.inf && aff.sup));
    el.valInt.textContent = fmt(integraleCourante());
    el.avertissement.hidden = r.ok;
    if (!r.ok) el.avertissement.textContent = t('avertissement');
    dessinerEncadrement();
    el.carteTableau.hidden = !etat.tableau;
    if (etat.tableau) majTableau();
  }

  const echapper = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /** Schéma m(b−a) ≤ L ≤ S ≤ U ≤ M(b−a) avec la valeur de l'intégrale. */
  function dessinerEncadrement() {
    const r = resultats, g = bornesGlobales(), ba = etat.b - etat.a;
    const I = integraleCourante();
    const cont = el.encadrement;
    if (!r.ok || !g.ok) { cont.innerHTML = ''; return; }
    const lo = g.m * ba, hi = g.M * ba;
    const vals = [lo, hi, r.L, r.U, r.S, I].filter(Number.isFinite);
    let vmin = Math.min.apply(null, vals), vmax = Math.max.apply(null, vals);
    if (vmax - vmin < 1e-12) { vmin -= 1; vmax += 1; }
    const marge = (vmax - vmin) * 0.07; vmin -= marge; vmax += marge;
    const Wd = Math.max(240, cont.clientWidth || 340), Hd = 86, x0 = 10, x1 = Wd - 10, yT = 44;
    const X = (v) => x0 + (v - vmin) / (vmax - vmin) * (x1 - x0);
    const f3 = (v) => fmt(v, Math.min(etat.decimales, 3));
    const aff = etat.affiche;
    let s = '<svg viewBox="0 0 ' + Wd + ' ' + Hd + '" xmlns="http://www.w3.org/2000/svg" font-family="' + POLICE_MATH.replace(/"/g, '&quot;') + '" font-size="12.5">';
    s += '<line x1="' + x0 + '" y1="' + yT + '" x2="' + x1 + '" y2="' + yT + '" stroke="#CFCDC4" stroke-width="2"/>';
    // bornes m(b−a) et M(b−a)
    for (const [v, lab, anc] of [[lo, 'm(b − a)', 'start'], [hi, 'M(b − a)', 'end']]) {
      s += '<line x1="' + X(v) + '" y1="' + (yT - 9) + '" x2="' + X(v) + '" y2="' + (yT + 9) + '" stroke="#8C8A82" stroke-width="1.5"/>';
      s += '<text x="' + X(v) + '" y="' + (Hd - 4) + '" text-anchor="' + anc + '" fill="#63625B" font-style="italic">' + lab + '</text>';
    }
    // bande U − L
    if (Number.isFinite(r.L) && Number.isFinite(r.U)) {
      s += '<rect x="' + X(r.L) + '" y="' + (yT - 6) + '" width="' + Math.max(1.5, X(r.U) - X(r.L)) + '" height="12" fill="' + C.orClair + '" stroke="' + C.orMoyen + '"/>';
    }
    // L et U : triangles sous la piste
    const tri = (v, fill, stroke, lab, dessus) => {
      const x = X(v);
      const p = dessus ? 'M' + x + ' ' + (yT - 8) + ' l-6 -9 h12 z' : 'M' + x + ' ' + (yT + 8) + ' l-6 9 h12 z';
      let svg = '<path d="' + p + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.2"/>';
      svg += '<text x="' + x + '" y="' + (dessus ? yT - 21 : yT + 30) + '" text-anchor="middle" font-style="italic" font-weight="bold" fill="' + stroke + '">' + lab + '</text>';
      return svg;
    };
    if (aff.inf) s += tri(r.L, C.vertClair, C.vert, 'L', false);
    if (aff.sup) s += tri(r.U, C.orClair, '#B8860B', 'U', false);
    if (aff.riemann && Number.isFinite(r.S)) s += tri(r.S, '#000', '#000', 'S', true);
    if (Number.isFinite(I)) {
      s += '<line x1="' + X(I) + '" y1="' + (yT - 14) + '" x2="' + X(I) + '" y2="' + (yT + 14) + '" stroke="' + C.vert + '" stroke-width="2"/>';
      s += '<text x="' + (X(I) + 5) + '" y="' + (yT - 21) + '" text-anchor="start" fill="' + C.vert + '" font-size="15">∫</text>';
    }
    s += '<title>m(b − a) = ' + f3(lo) + ', M(b − a) = ' + f3(hi) + '</title></svg>';
    cont.innerHTML = s;
  }

  function majTableau() {
    const r = resultats, n = r.n;
    if (n > 40) {
      el.tableau.innerHTML = '';
      el.tableauNote.hidden = false;
      el.tableauNote.textContent = t('tableauNote', { n });
      return;
    }
    el.tableauNote.hidden = true;
    let h = '';
    for (const L of r.lignes) {
      h += '<tr data-k="' + (L.k - 1) + '"' + (L.k - 1 === etat.survolK ? ' class="survol"' : '') + '><td>' + L.k + '</td><td>' + fmt(L.x0) + '</td><td>' + fmt(L.x1) + '</td><td>' + fmt(L.dx) + '</td>'
        + '<td>' + fmt(L.t) + '</td><td>' + fmt(L.ft) + '</td><td>' + fmt(L.m) + '</td><td>' + fmt(L.M) + '</td></tr>';
    }
    el.tableau.innerHTML = h;
  }
  function majSurvolTableau() {
    if (!etat.tableau) return;
    el.tableau.querySelectorAll('tr').forEach((tr) => tr.classList.toggle('survol', +tr.dataset.k === etat.survolK));
    demanderDessin();
  }
  el.tableau.addEventListener('mouseover', (e) => {
    const tr = e.target.closest('tr'); if (!tr) return;
    etat.survolK = +tr.dataset.k; demanderDessin();
  });
  el.tableau.addEventListener('mouseleave', () => { etat.survolK = -1; demanderDessin(); });

  // --- Fonction ------------------------------------------------------------
  PREDEFINIES.forEach((p) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.fonction = p.id; b.innerHTML = libelleFonction(p);
    b.addEventListener('click', () => choisirFonction(p.id));
    el.fonctions.appendChild(b);
  });
  function majBoutonsFonctions() {
    el.fonctions.querySelectorAll('button').forEach((b) => {
      const p = PREDEFINIES.find((q) => q.id === b.dataset.fonction);
      if (p) b.innerHTML = libelleFonction(p);
    });
  }

  function choisirFonction(id) {
    const p = PREDEFINIES.find((q) => q.id === id);
    if (!p) return;
    etat.fonction = id;
    if (id === 'perso') { el.expr.value = etat.exprPerso; compilerPerso(false); }
    const n = etat.noeuds.length - 1;
    etat.a = p.a; etat.b = p.b;
    if (etat.typePartition === 'libre') etat.typePartition = 'uniforme';
    etat.noeuds = genererNoeuds(etat.typePartition, n, etat.a, etat.b, etat.graine);
    resultats = null;
    recadrer();
    maj();
    if (id === 'perso') el.expr.focus();
  }

  function compilerPerso(rafraichir) {
    const src = el.expr.value;
    try {
      const f = compilerExpression(src);
      etat.fPerso = f; etat.exprPerso = src; etat.erreurPerso = '';
      el.erreurExpr.hidden = true;
      el.expr.setCustomValidity('');
    } catch (err) {
      etat.erreurPerso = err.message;
      el.erreurExpr.hidden = false; el.erreurExpr.textContent = err.message;
    }
    if (rafraichir) { resultats = null; maj(); }
  }
  el.expr.addEventListener('input', () => compilerPerso(true));
  el.expr.addEventListener('keydown', (e) => { if (e.key === 'Enter') { compilerPerso(true); recadrer(); } });

  // --- Intervalle ----------------------------------------------------------
  function lireAB() {
    const a = parseFloat(el.a.value.replace(',', '.')), b = parseFloat(el.b.value.replace(',', '.'));
    if (!Number.isFinite(a) || !Number.isFinite(b) || !(b > a)) { majChampsAB(); return; }
    deplacerExtremite('a', a); deplacerExtremite('b', b);
    resultats = null; recadrer(); maj();
  }
  el.a.addEventListener('change', lireAB);
  el.b.addEventListener('change', lireAB);
  el.recadrer.addEventListener('click', () => { recadrer(); });

  // --- Partition -----------------------------------------------------------
  el.n.addEventListener('change', () => definirN(parseInt(el.n.value, 10) || 1));
  el.curseur.addEventListener('input', () => definirN(parseInt(el.curseur.value, 10) || 1));
  el.moins.addEventListener('click', () => changerN(-1));
  el.plus.addEventListener('click', () => changerN(+1));
  el.doubler.addEventListener('click', doubler);
  el.animer.addEventListener('click', basculerAnimation);
  el.typesPartition.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => definirTypePartition(b.dataset.type)));
  el.tiragePartition.addEventListener('click', () => { etat.graine = (Math.random() * 1e9) | 0; definirTypePartition('aleatoire'); });

  function basculerAnimation() {
    if (etat.animation) { clearInterval(etat.animation); etat.animation = null; el.animer.textContent = t('animer'); el.animer.classList.remove('actif'); return; }
    if (etat.noeuds.length - 1 >= N_ANIMATION) definirN(1);
    el.animer.textContent = t('arreter'); el.animer.classList.add('actif');
    etat.animation = setInterval(() => {
      if (etat.noeuds.length - 1 >= N_ANIMATION) { basculerAnimation(); return; }
      changerN(+1);
    }, 170);
  }

  // --- Marques -------------------------------------------------------------
  el.typesMarques.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.marques;
    if (t === 'libre') passerMarquesLibres(); else etat.typeMarques = t;
    maj();
  }));
  el.tirageMarques.addEventListener('click', () => { etat.graineMarques = (Math.random() * 1e9) | 0; etat.typeMarques = 'aleatoire'; maj(); });

  // --- Affichage -----------------------------------------------------------
  el.affRiemann.addEventListener('change', () => { etat.affiche.riemann = el.affRiemann.checked; maj(); });
  el.affInf.addEventListener('change', () => { etat.affiche.inf = el.affInf.checked; maj(); });
  el.affSup.addEventListener('change', () => { etat.affiche.sup = el.affSup.checked; maj(); });
  el.optEtiquettes.addEventListener('change', () => { etat.etiquettes = el.optEtiquettes.checked; demanderDessin(); });
  el.optLegende.addEventListener('change', () => { etat.legende = el.optLegende.checked; demanderDessin(); });
  el.optTableau.addEventListener('change', () => { etat.tableau = el.optTableau.checked; majPanneau(); });
  el.decimales.addEventListener('change', () => { etat.decimales = parseInt(el.decimales.value, 10) || 4; maj(); });

  // --- En-tête -------------------------------------------------------------
  el.btnAide.addEventListener('click', () => el.aide.showModal());
  el.fermerAide.addEventListener('click', () => el.aide.close());
  el.aide.addEventListener('click', (e) => { if (e.target === el.aide) el.aide.close(); });
  el.btnPanneau.addEventListener('click', basculerPanneau);
  el.btnPleinEcran.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
  });
  el.btnLangue.addEventListener('click', () => changerLangue(etat.langue === 'fr' ? 'en' : 'fr'));
  function basculerPanneau() {
    document.body.classList.toggle('sans-panneau');
    el.btnPanneau.setAttribute('aria-pressed', document.body.classList.contains('sans-panneau') ? 'false' : 'true');
    redimensionner();
  }

  // --- Clavier -------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    const cible = e.target;
    if (cible && (cible.tagName === 'INPUT' || cible.tagName === 'SELECT' || cible.tagName === 'TEXTAREA')) return;
    if (el.aide.open) { if (e.key === 'Escape' || e.key === '?') el.aide.close(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    let traite = true;
    switch (e.key) {
      case 'ArrowUp': case 'ArrowRight': case '+': case '=': changerN(+1); break;
      case 'ArrowDown': case 'ArrowLeft': case '-': changerN(-1); break;
      case 'd': case 'D': doubler(); break;
      case 'a': case 'A': basculerAnimation(); break;
      case '1': etat.typeMarques = 'gauche'; maj(); break;
      case '2': etat.typeMarques = 'droite'; maj(); break;
      case '3': etat.typeMarques = 'milieu'; maj(); break;
      case '4': etat.typeMarques = 'aleatoire'; maj(); break;
      case 's': case 'S': etat.affiche.riemann = !etat.affiche.riemann; maj(); break;
      case 'l': case 'L': etat.affiche.inf = !etat.affiche.inf; maj(); break;
      case 'u': case 'U': etat.affiche.sup = !etat.affiche.sup; maj(); break;
      case 'r': case 'R':
        etat.graine = (Math.random() * 1e9) | 0; etat.graineMarques = (Math.random() * 1e9) | 0;
        if (etat.typePartition === 'aleatoire') etat.noeuds = genererNoeuds('aleatoire', etat.noeuds.length - 1, etat.a, etat.b, etat.graine);
        maj(); break;
      case 'f': case 'F': recadrer(); break;
      case 'e': case 'E': etat.etiquettes = !etat.etiquettes; majPanneau(); demanderDessin(); break;
      case 'p': case 'P': basculerPanneau(); break;
      case '?': el.aide.showModal(); break;
      case 'Escape': if (etat.animation) basculerAnimation(); else traite = false; break;
      default: traite = false;
    }
    if (traite) e.preventDefault();
  });

  // ===========================================================================
  //  Tests automatiques (index.html?test=1)
  // ===========================================================================
  function lancerTests() {
    const res = [];
    const ok = (nom, cond) => res.push({ nom, ok: !!cond });
    const approx = (u, v, eps) => Math.abs(u - v) <= (eps || 1e-9);
    try {
      ok('analyseur : 2x^2 - 3x + 1 en x = 2', approx(compilerExpression('2x^2 - 3x + 1')(2), 3));
      ok('analyseur : sin(x)^2 + cos(x)^2', approx(compilerExpression('sin(x)^2 + cos(x)^2')(0.7), 1));
      ok('analyseur : 2^3^2 = 512', approx(compilerExpression('2^3^2')(0), 512));
      ok('analyseur : -x^2 en 3', approx(compilerExpression('-x^2')(3), -9));
      ok('analyseur : e^x', approx(compilerExpression('e^x')(1), Math.E));
      ok('analyseur : x² (exposant unicode)', approx(compilerExpression('x²')(3), 9));
      ok('analyseur : 0,5x (virgule)', approx(compilerExpression('0,5x')(4), 2));
      ok('analyseur : xsin(x)', approx(compilerExpression('xsin(x)')(2), 2 * Math.sin(2)));
      ok('analyseur : √x', approx(compilerExpression('√x')(9), 3));
      ok('analyseur : (x+1)(x-1)', approx(compilerExpression('(x+1)(x-1)')(3), 8));
      ok('analyseur : ln(e)', approx(compilerExpression('ln(e)')(0), 1));
      ok('analyseur : sin x + 1', approx(compilerExpression('sin x + 1')(0), 1));
      let err = false; try { compilerExpression('2 +* x'); } catch (_) { err = true; }
      ok('analyseur : erreur de syntaxe détectée', err);
      err = false; try { compilerExpression('foo(x)'); } catch (_) { err = true; }
      ok('analyseur : nom inconnu détecté', err);

      // Exercice P1 (section 1.1) : f(x) = x² sur [0, 2], P = {0, 1/2, 1, 2}
      const sauvegarde = JSON.stringify({ fonction: etat.fonction, a: etat.a, b: etat.b, noeuds: etat.noeuds, typePartition: etat.typePartition, typeMarques: etat.typeMarques, u: etat.u, graineMarques: etat.graineMarques });
      etat.fonction = 'x2'; etat.a = 0; etat.b = 2; etat.noeuds = [0, 0.5, 1, 2]; etat.typePartition = 'libre';
      etat.typeMarques = 'gauche'; let r = calculer();
      ok('P1 : ‖P‖ = 1', approx(r.pas, 1));
      ok('P1 (a) : S gauche = 1,125', approx(r.S, 1.125));
      ok('P1 : L(f;P) = 1,125', approx(r.L, 1.125));
      ok('P1 : U(f;P) = 4,625', approx(r.U, 4.625));
      etat.typeMarques = 'droite'; r = calculer(); ok('P1 (b) : S droite = 4,625', approx(r.S, 4.625));
      etat.typeMarques = 'milieu'; r = calculer(); ok('P1 (c) : S milieu = 2,5625', approx(r.S, 2.5625));
      etat.typeMarques = 'aleatoire'; r = calculer(); ok('P1 : L ≤ S aléatoire ≤ U', r.L <= r.S && r.S <= r.U);
      cacheIntegrale.cle = ''; ok('∫₀² x² dx = 8/3', approx(integraleCourante(), 8 / 3));
      // x³ − x sur [−1, 1], P = {−1, 0, 1} : extrema intérieurs en ±1/√3
      etat.fonction = 'x3x'; etat.a = -1; etat.b = 1; etat.noeuds = [-1, 0, 1]; r = calculer();
      const Mx = 2 / (3 * Math.sqrt(3));
      ok('x³ − x : L = −2/(3√3)', approx(r.L, -Mx, 1e-7));
      ok('x³ − x : U = +2/(3√3)', approx(r.U, Mx, 1e-7));
      // fonction générique : inf/sup contre une force brute
      etat.fonction = 'generique';
      const g = fonctionCourante(), b = infSup(g, 0.3, 2.1, null, 20);
      let bm = Infinity, bM = -Infinity;
      for (let i = 0; i <= 200000; i++) { const y = g(0.3 + 1.8 * i / 200000); if (y < bm) bm = y; if (y > bM) bM = y; }
      ok('générique : inf ≈ force brute', approx(b.m, bm, 1e-6));
      ok('générique : sup ≈ force brute', approx(b.M, bM, 1e-6));
      const p0 = PREDEFINIES[0];
      ok('Simpson ≈ primitive (générique sur [0, 4])', approx(simpsonAdaptatif(p0.f, 0, 4), p0.F(4) - p0.F(0), 1e-7));
      // partitions
      const xs = genererNoeuds('quadratique', 4, 0, 1, 0);
      ok('quadratique : x_k = (k/4)²', approx(xs[1], 1 / 16) && approx(xs[2], 1 / 4) && approx(xs[3], 9 / 16));
      const xa = genererNoeuds('aleatoire', 50, 0, 1, 42);
      ok('aléatoire : points croissants', xa.every((x, i) => i === 0 || x > xa[i - 1]));
      ok('hash01 dans [0, 1)', [1, 2, 3, 100].every((k) => { const h = hash01(7, k); return h >= 0 && h < 1; }));
      const sep = etat.langue === 'en' ? '.' : ',';
      ok('fmt(−0,5) = « −0' + sep + '5000 »', fmt(-0.5, 4) === '−0' + sep + '5000');
      ok('fmtAxe(0,25 ; pas 0,25) = « 0' + sep + '25 »', fmtAxe(0.25, 0.25) === '0' + sep + '25');
      ok('t() : message anglais', (() => { const l = etat.langue; etat.langue = 'en'; const m = t('errAttendu', { x: ')' }); etat.langue = l; return m === '“)” expected'; })());
      // restauration
      Object.assign(etat, JSON.parse(sauvegarde));
    } catch (e) {
      res.push({ nom: 'exception : ' + e.message, ok: false });
    }
    resultats = null; cacheBornes.cle = ''; cacheIntegrale.cle = '';
    const nOk = res.filter((t) => t.ok).length;
    const pre = document.createElement('pre'); pre.id = 'tests';
    const resume = (nOk === res.length ? 'TOUS LES TESTS RÉUSSIS' : 'ÉCHECS : ' + (res.length - nOk)) + ' (' + nOk + '/' + res.length + ')';
    pre.textContent = resume + '\n' + res.map((r) => (r.ok ? '✔ ' : '✘ ') + r.nom).join('\n');
    document.body.appendChild(pre);
    console.log(pre.textContent);
    maj();
    let diag = '';
    try { dessiner(); } catch (e) { diag += 'EXCEPTION dessiner : ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n') + '\n'; }
    // La capture d'écran headless est prise avant tout tick de rafraîchissement : on copie le canevas dans une image.
    try {
      const img = new Image(); img.src = canvas.toDataURL('image/png');
      img.style.cssText = 'position:absolute;left:0;top:0;width:' + W + 'px;height:' + H + 'px;pointer-events:none';
      img.id = 'copie-canevas'; canvas.parentElement.appendChild(img);
    } catch (e) { diag += 'toDataURL : ' + e.message + '\n'; }
    diag += 'interrupteur : ' + getComputedStyle(el.affRiemann.nextElementSibling).backgroundColor + '\n';
    diag += 'état : visibilité=' + document.visibilityState + ', dessins=' + nbDessins + ', zone=' + JSON.stringify(zone)
      + ', W×H=' + W + '×' + H + ', dpr=' + dpr + ', riemann=' + etat.affiche.riemann + ', case=' + el.affRiemann.checked
      + ', n=' + (etat.noeuds.length - 1) + ', vue=' + JSON.stringify(etat.vue) + ', roundRect=' + (typeof ctx.roundRect)
      + ', canvas=' + canvas.width + '×' + canvas.height + ', style=' + canvas.style.width + '/' + canvas.style.height;
    pre.textContent = diag + '\n' + pre.textContent;
  }

  // ===========================================================================
  //  Démarrage
  // ===========================================================================
  function demarrer() {
    capturerFrancais();
    const m = /[?&]lang=(fr|en)\b/.exec(location.search);
    appliquerLangue(m ? m[1] : 'fr', false);
    try { etat.fPerso = compilerExpression(etat.exprPerso); } catch (_) { /* impossible */ }
    el.expr.value = etat.exprPerso;
    etat.noeuds = genererNoeuds(etat.typePartition, 5, etat.a, etat.b, etat.graine);
    el.btnPanneau.setAttribute('aria-pressed', 'true');
    new ResizeObserver(redimensionner).observe(canvas.parentElement);
    window.addEventListener('resize', () => { redimensionner(); dessinerEncadrement(); });
    redimensionner();
    recadrer();
    maj();
    if (MODE_TEST) lancerTests();
  }

  // Petite API pour la console du navigateur (débogage, démonstrations scriptées)
  window.RiApp = { etat, definirN, doubler, recadrer, choisirFonction, changerLangue, calculer: () => (resultats = calculer()), compilerExpression, maj };

  demarrer();
})();
