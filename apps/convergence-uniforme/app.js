/* =============================================================================
   Convergence simple et uniforme — MPU1054 (UQTR), section 2.1
   Application autonome (HTML/CSS/JS + KaTeX vendorisé) : s'ouvre en double-
   cliquant sur index.html. Dessine la limite simple f, un membre f_n (et
   d'autres membres f_k) d'une suite de fonctions et la bande de largeur 2ε
   autour de f, pour voir si la convergence est uniforme sur A.

   Notation (section 2.1 du cours) :
     f_n → f simplement sur A : pour tout x ∈ A, f_n(x) → f(x) ;
     f_n ⇉ f uniformément sur A : ‖f_n − f‖_A := sup_{x∈A} |f_n(x) − f(x)| → 0,
       i.e. pour tout ε > 0 il existe N tel que, pour n ≥ N, le graphe de f_n
       au-dessus de A est tout entier dans la bande f − ε < y < f + ε ;
     critère de non-convergence uniforme : s'il existe (x_n) dans A avec
       f_n(x_n) − f(x_n) ↛ 0, la convergence n'est pas uniforme sur A.

   Adresse : index.html?suite=<id>&n=20&eps=0.1[&lang=en][&test=1]
   ============================================================================= */
'use strict';

(function () {
  const MODE_TEST = /[?&]test=1/.test(location.search);
  if (MODE_TEST) {
    window.addEventListener('error', (e) => {
      const pre = document.getElementById('tests') || document.body.appendChild(Object.assign(document.createElement('pre'), { id: 'tests' }));
      pre.textContent += '\nERREUR : ' + e.message + ' (ligne ' + e.lineno + ')';
    });
  }

  // ===========================================================================
  //  Couleurs : celles du site (vert #0b7a57, bleu #0b57d0, rouge #b3261e)
  //  et l'or des figures du cours pour les membres f_n (suites-figures.tex).
  // ===========================================================================
  const C = {
    vert: '#0b7a57', vertFonce: '#085e42',
    bandeFond: 'rgba(11, 122, 87, 0.16)', bandeBord: 'rgba(11, 122, 87, 0.6)',
    or: '#c9922a', orClair: '#e6c98a', orFade: 'rgba(201, 146, 42, 0.35)',
    rouge: '#b3261e', rougeFade: 'rgba(179, 38, 30, 0.35)',
    bleu: '#0b57d0',
    grille: '#ededed', axe: '#222', texte: '#111', gris: '#666',
    horsA: 'rgba(0, 0, 0, 0.05)', hachure: 'rgba(0, 0, 0, 0.10)',
  };
  const POLICE = 'sans-serif';  // la police de la page (style.css), celle que le site affiche
  const N_GRAND = 1e6;        // rang utilisé pour estimer la limite d'une suite personnalisée
  const N_CAP_SERIES = 5000;  // plafond de n pour les suites définies par une somme

  // ===========================================================================
  //  Langue (fr par défaut ; ?lang=en ou les onglets EN et FR de la barre).
  //  Le français est le texte du HTML (capturé au démarrage) ; l'anglais est
  //  donné ici, avec les mêmes clés (data-i18n, data-i18n-title, -placeholder).
  //  MSG contient les chaînes produites par le code (dans les deux langues).
  // ===========================================================================
  const TRAD = {
    fr: {},
    en: {
      navAccueil: 'Home', navRecherche: 'Research', navEnseignement: 'Teaching', navSeminaires: 'Seminars',
      navTetrabrot: 'Tetrabrot', navDivers: 'Miscellaneous',
      lienCours: '← Back to the MPU1054 course page',
      btnAide: 'Help', 'title:btnAide': 'How to use (key ?)',
      titre: 'Pointwise and Uniform Convergence',
      sousTitre: 'MPU1054 · Analysis in One Real Variable II · Section 2.1 (sequences of functions)',
      carteSuite: 'Sequence of functions',
      chipsCours: 'Examples from the notes', chipsExercices: 'Exercises', chipsAutre: 'Your own',
      'placeholder:phFn': 'e.g. x^n (1 − x), n x e^(−n x), sin(x)/n',
      'placeholder:phF': 'pointwise limit; leave empty to estimate it numerically',
      btnAppliquer: 'Apply',
      indicePerso: 'Variables <code>x</code> and <code>n</code>; functions <code>sqrt</code>, <code>abs</code>, <code>exp</code>, <code>ln</code>, <code>sin</code>, <code>cos</code>, <code>min</code>, <code>max</code>…; constants <code>pi</code>, <code>e</code>. Implicit multiplication is accepted (<code>nx</code>, <code>2x</code>).',
      'title:btnMoins': 'n − 1 (key ↓)', 'title:btnPlus': 'n + 1 (key ↑)', 'title:btnDoubler': 'Double n (key D)',
      'title:btnAnimer': 'Increase n automatically (key A)',
      optBande: 'band <span class="math">f ± ε</span>',
      optMembres: 'other members', 'title:champMembres': 'Indices of the other members shown, separated by commas',
      optXn: 'points <span class="math"><i>x<sub>n</sub></i></span>',
      btnRecadrer: 'Reset view', 'title:btnRecadrer': 'Back to the default window (key F)',
      'title:btnPleinEcran': 'Full screen',
      legF: 'pointwise limit <span class="math"><i>f</i></span>',
      legFn: 'member <span class="math"><i>f<sub>n</sub></i></span>',
      legHors: 'part of <span class="math"><i>f<sub>n</sub></i></span> outside the band',
      legBande: 'band <span class="math"><i>f</i> − ε &lt; <i>y</i> &lt; <i>f</i> + ε</span>',
      legFk: 'other members <span class="math"><i>f<sub>k</sub></i></span>',
      legXn: 'point <span class="math"><i>x<sub>n</sub></i></span> (criterion for non-uniform convergence)',
      legHorsA: 'outside <span class="math"><i>A</i></span>',
      indiceGraphe: 'Hover over the graph to read <span class="math"><i>f<sub>n</sub></i>(<i>x</i>)</span> and <span class="math"><i>f</i>(<i>x</i>)</span>; wheel: zoom; drag: pan; ↑ ↓: <i>n</i>; ← →: ε.',
      carteValeurs: 'Values', carteVerdict: 'Uniform convergence?',
      pied: 'MPU1054 — Analysis in One Real Variable II · UQTR · Fall 2026 · P.-O. Parisé',
      aideTitre: 'How to use',
      aide: '<p>The app draws the <b>pointwise limit</b> <i>f</i> (green), one <b>member</b> <i>f<sub>n</sub></i> of the sequence (gold) and, optionally, a few other members <i>f<sub>k</sub></i>. The green <b>band</b> is the set of points whose ordinate lies at distance less than ε from the graph of <i>f</i>.</p>'
        + '<p><b>Uniform convergence on <i>A</i></b>: for every ε &gt; 0 there is a rank <i>N</i> such that, for <i>n</i> ≥ <i>N</i>, the graph of <i>f<sub>n</sub></i> above <i>A</i> lies <i>entirely</i> inside the band. Equivalently, ‖<i>f<sub>n</sub></i> − <i>f</i>‖<sub><i>A</i></sub> = sup<sub><i>x</i>∈<i>A</i></sub> |<i>f<sub>n</sub></i>(<i>x</i>) − <i>f</i>(<i>x</i>)| tends to 0. The parts of <i>f<sub>n</sub></i> leaving the band are drawn in red; the vertical red segment shows where the gap |<i>f<sub>n</sub></i> − <i>f</i>| is largest.</p>'
        + '<p><b>Pointwise convergence only</b>: for each <i>x</i>, <i>f<sub>n</sub></i>(<i>x</i>) eventually enters the band, but no rank works for all <i>x</i> at once; follow the points <i>x<sub>n</sub></i> (criterion for non-uniform convergence), where <i>f<sub>n</sub></i> stays far from <i>f</i> whatever <i>n</i> is.</p>'
        + '<ul><li><b>Slider <i>n</i></b> (or ↑ ↓, +, −, ×2): choose the member shown; <b>▶ Animate</b> increases <i>n</i>.</li>'
        + '<li><b>Slider ε</b> (or ← →): width of the band. The “Values” panel gives ‖<i>f<sub>n</sub></i> − <i>f</i>‖<sub><i>A</i></sub> and the rank <i>N</i>(ε) when it exists.</li>'
        + '<li><b>Other members</b>: indices <i>k</i> separated by commas (e.g. <code>1, 2, 5, 10</code>).</li>'
        + '<li><b>Your own</b>: enter <i>f<sub>n</sub></i>(<i>x</i>) with the variables <code>x</code> and <code>n</code>, the limit <i>f</i>(<i>x</i>) (if left empty it is estimated by <i>f<sub>N</sub></i> with <i>N</i> = 10<sup>6</sup>) and the interval <i>A</i> = [<i>a</i>, <i>b</i>]. The norm is then computed numerically on the visible part of <i>A</i>.</li>'
        + '<li><b>Graph</b>: wheel = zoom, drag = pan, <b>Reset view</b> (F) = default window, ⛶ = full screen (handy in class).</li></ul>'
        + '<p class="indice">Address: <code>index.html?suite=&lt;id&gt;&amp;n=20&amp;eps=0.1</code> opens a given sequence; <code>?lang=fr</code> gives the French version.</p>',
    },
  };
  const MSG = {
    fr: {
      titrePage: 'Convergence simple et uniforme — MPU1054',
      siteWeb: 'https://mathopo.ca/fr/',
      animer: '▶ Animer', arreter: '■ Arrêter',
      autre: 'Autre…', si: 'si', sur: 'sur',
      etFn: 'f_n(x) =', etF: 'f(x) =', etA: 'Ensemble A = [a, b] :',
      exempleCours: 'Exemple du cours (section 2.1)', exerciceCours: 'Exercice {x} de la section 2.1',
      limiteSimple: 'limite simple', limiteEstimee: 'limite estimée par $f_N$, $N = 10^6$',
      suitePerso: 'Suite au choix',
      valN: 'Membre affiché $n$', valEps: 'Largeur de la bande $\\eps$',
      normeExacte: '(valeur exacte)', normeNumerique: '(valeur numérique, sur la partie visible de $A$)',
      valDansBande: 'Graphe de $f_n$ dans la bande (au-dessus de $A$) ?',
      oui: 'oui', non: 'non', ouiCar: 'oui, car $\\normu{f_n - f}_A < \\eps$', nonCar: 'non, car $\\normu{f_n - f}_A \\ge \\eps$',
      valRang: 'Rang $N(\\eps)$',
      rangTexte: '$N(\\eps) = {N}$ : pour $n \\ge {N}$, $\\normu{f_n - f}_A < \\eps$',
      rangTexteNum: '$N(\\eps) \\approx {N}$ (estimation numérique)',
      rangAucun: 'aucun rang ne convient : la convergence n’est pas uniforme sur $A$',
      rangTropGrand: 'supérieur à {N}',
      rangInconnu: 'non trouvé numériquement ($n \\le {N}$)',
      valXn: 'Point $x_n$ du critère',
      xnTexte: '$x_n \\approx {x}$ ; $|f_n(x_n) - f(x_n)| \\approx {d}$',
      xnHorsFenetre: '(hors de la fenêtre)',
      valArgmax: 'Écart maximal $|f_n - f|$',
      argmaxTexte: 'atteint vers $x \\approx {x}$',
      argmaxInfini: 'non borné ($f_n - f$ n’est pas bornée sur $A$)',
      verdictOui: 'Oui : f_n ⇉ f uniformément sur A.',
      verdictNon: 'Non : f_n → f simplement sur A, mais pas uniformément.',
      verdictNum: 'Suite au choix : l’application ne peut que calculer $\\normu{f_n - f}$ numériquement sur la partie visible de $A$.',
      numTableau: 'Valeurs numériques de $\\normu{f_n - f}$ (partie visible de $A$) :',
      numLimiteEstimee: 'La limite $f$ a été estimée par $f_N$ avec $N = 10^6$ ; vérifier qu’elle est correcte avant de conclure.',
      numNote: 'Si ces valeurs tendent vers $0$, la convergence semble uniforme sur cette partie de $A$ ; sinon, chercher des points $x_n$ où $f_n$ reste loin de $f$.',
      survolX: 'x', dansBande: 'dans la bande', horsBande: 'hors de la bande',
      errNomInconnu: 'Nom inconnu : « {x} »', errNombre: 'Nombre mal formé', errCaractere: 'Caractère inattendu : « {x} »',
      errVide: 'Expression vide', errAttendu: '« {x} » attendu', errFin: 'Fin inattendue de l’expression',
      errJeton: 'Jeton inattendu : « {x} »', errInvalide: 'Expression invalide', errIntervalle: 'Il faut a < b',
      errFn: 'f_n(x) : {x}', errF: 'f(x) : {x}',
    },
    en: {
      titrePage: 'Pointwise and Uniform Convergence — MPU1054',
      siteWeb: 'https://mathopo.ca/',
      animer: '▶ Animate', arreter: '■ Stop',
      autre: 'Other…', si: 'if', sur: 'on',
      etFn: 'f_n(x) =', etF: 'f(x) =', etA: 'Set A = [a, b]:',
      exempleCours: 'Example from the notes (Section 2.1)', exerciceCours: 'Exercise {x} of Section 2.1',
      limiteSimple: 'pointwise limit', limiteEstimee: 'limit estimated by $f_N$, $N = 10^6$',
      suitePerso: 'Custom sequence',
      valN: 'Member shown $n$', valEps: 'Width of the band $\\eps$',
      normeExacte: '(exact value)', normeNumerique: '(numerical value, on the visible part of $A$)',
      valDansBande: 'Graph of $f_n$ inside the band (above $A$)?',
      oui: 'yes', non: 'no', ouiCar: 'yes, since $\\normu{f_n - f}_A < \\eps$', nonCar: 'no, since $\\normu{f_n - f}_A \\ge \\eps$',
      valRang: 'Rank $N(\\eps)$',
      rangTexte: '$N(\\eps) = {N}$: for $n \\ge {N}$, $\\normu{f_n - f}_A < \\eps$',
      rangTexteNum: '$N(\\eps) \\approx {N}$ (numerical estimate)',
      rangAucun: 'no rank works: the convergence is not uniform on $A$',
      rangTropGrand: 'greater than {N}',
      rangInconnu: 'not found numerically ($n \\le {N}$)',
      valXn: 'Point $x_n$ of the criterion',
      xnTexte: '$x_n \\approx {x}$; $|f_n(x_n) - f(x_n)| \\approx {d}$',
      xnHorsFenetre: '(outside the window)',
      valArgmax: 'Largest gap $|f_n - f|$',
      argmaxTexte: 'reached near $x \\approx {x}$',
      argmaxInfini: 'unbounded ($f_n - f$ is not bounded on $A$)',
      verdictOui: 'Yes: f_n ⇉ f uniformly on A.',
      verdictNon: 'No: f_n → f pointwise on A, but not uniformly.',
      verdictNum: 'Custom sequence: the app can only compute $\\normu{f_n - f}$ numerically on the visible part of $A$.',
      numTableau: 'Numerical values of $\\normu{f_n - f}$ (visible part of $A$):',
      numLimiteEstimee: 'The limit $f$ was estimated by $f_N$ with $N = 10^6$; check that it is correct before concluding.',
      numNote: 'If these values tend to $0$, the convergence looks uniform on this part of $A$; otherwise, look for points $x_n$ where $f_n$ stays far from $f$.',
      survolX: 'x', dansBande: 'inside the band', horsBande: 'outside the band',
      errNomInconnu: 'Unknown name: “{x}”', errNombre: 'Malformed number', errCaractere: 'Unexpected character: “{x}”',
      errVide: 'Empty expression', errAttendu: '“{x}” expected', errFin: 'Unexpected end of expression',
      errJeton: 'Unexpected token: “{x}”', errInvalide: 'Invalid expression', errIntervalle: 'a < b is required',
      errFn: 'f_n(x): {x}', errF: 'f(x): {x}',
    },
  };

  /** Chaîne produite par le code, dans la langue courante (avec substitution de {param}). */
  function t(cle, params) {
    const lang = (typeof etat !== 'undefined' && etat.langue) || 'fr';
    let s = (MSG[lang] && MSG[lang][cle] !== undefined) ? MSG[lang][cle] : (MSG.fr[cle] !== undefined ? MSG.fr[cle] : cle);
    if (params) for (const k in params) s = s.split('{' + k + '}').join(String(params[k]));
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
    // Onglets du site et lien de retour : pages françaises (mathopo.ca/fr/) ou anglaises (mathopo.ca/).
    el.topnav.querySelectorAll('[data-page]').forEach((a) => { a.href = t('siteWeb') + a.dataset.page + '.html'; });
    el.lienCours.href = t('siteWeb') + 'mpu1054.html#Applications';
    el.btnEn.classList.toggle('active', etat.langue === 'en'); el.btnFr.classList.toggle('active', etat.langue === 'fr');
    el.btnAnimer.textContent = etat.animation ? t('arreter') : t('animer');
    el.etFn.innerHTML = rendreMath('f_n(x) ='); el.etF.innerHTML = rendreMath('f(x) ='); el.etA.textContent = t('etA');
    construireChips();
    if (rafraichir !== false) maj(true);
  }

  function changerLangue(lang) {
    appliquerLangue(lang);
    majAdresse();
  }

  // ===========================================================================
  //  KaTeX
  // ===========================================================================
  const MACROS = {
    '\\eps': '\\varepsilon', '\\bR': '\\mathbb{R}', '\\bN': '\\mathbb{N}',
    '\\ra': '\\to', '\\rra': '\\to', '\\nra': '\\nrightarrow', '\\cvu': '\\rightrightarrows',
    '\\normu': '\\lVert #1 \\rVert',
  };
  function rendreMath(tex, affichage) {
    if (typeof katex === 'undefined') return '<code>' + echapper(tex) + '</code>';
    try {
      return katex.renderToString(tex, { displayMode: !!affichage, throwOnError: false, strict: 'ignore', macros: Object.assign({}, MACROS), output: 'html' });
    } catch (e) { return '<code>' + echapper(tex) + '</code>'; }
  }
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /** Typographie française hors des formules : espace insécable avant « : ; ? ! » » et après « « ». */
  function typo(s) {
    if (etat.langue !== 'fr') return s;
    return s.replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ');
  }

  /** Texte HTML contenant des formules $…$ (en ligne) ou $$…$$ (centrées). */
  function rendreTexte(str) {
    if (str == null) return '';
    const s = String(str);
    let out = '', i = 0;
    while (i < s.length) {
      const j = s.indexOf('$', i);
      if (j < 0) { out += typo(s.slice(i)); break; }
      out += typo(s.slice(i, j));
      const affichage = s.startsWith('$$', j);
      const deb = j + (affichage ? 2 : 1);
      const fin = s.indexOf(affichage ? '$$' : '$', deb);
      if (fin < 0) { out += typo(s.slice(j)); break; }
      out += rendreMath(traduireTex(s.slice(deb, fin)), affichage);
      i = fin + (affichage ? 2 : 1);
    }
    return out;
  }

  /** Les mots français des formules (\text{si }, \text{sinon}) en anglais. */
  function traduireTex(tex) {
    if (etat.langue !== 'en') return tex;
    return tex.replace(/(\d)\{,\}(\d)/g, '$1.$2').replace(/\\text\{si \}/g, '\\text{if }').replace(/\\text\{si\}/g, '\\text{if}').replace(/\\text\{sinon\}/g, '\\text{otherwise}').replace(/\\text\{pour tout \}/g, '\\text{for all }');
  }

  // ===========================================================================
  //  Utilitaires numériques et formats
  // ===========================================================================
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /** Format : virgule décimale en français, vrai signe moins, ∞. */
  function fmt(v, d) {
    if (d === undefined) d = 4;
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    if (!Number.isFinite(v)) return v > 0 ? '+∞' : '−∞';
    let s = Math.abs(v).toFixed(d);
    if (etat.langue !== 'en') s = s.replace('.', ',');
    const nul = /^[0.,]*$/.test(s);
    return (v < 0 && !nul ? '−' : '') + s;
  }
  /** Format « intelligent » : assez de décimales pour voir la valeur (3 chiffres significatifs au moins). */
  function fmtAuto(v) {
    if (v === null || v === undefined || Number.isNaN(v) || !Number.isFinite(v)) return fmt(v);
    const a = Math.abs(v);
    if (a === 0) return fmt(0, 1);
    if (a >= 100) return fmt(v, 1);
    if (a >= 1) return fmt(v, 3);
    const d = Math.min(8, 2 - Math.floor(Math.log10(a)));
    return fmt(v, d);
  }
  /** Nombre formaté pour une formule KaTeX (virgule décimale « {,} » en français). */
  const texNum = (v) => {
    if (v === null || v === undefined || Number.isNaN(v)) return '?';
    if (!Number.isFinite(v)) return v > 0 ? '+\\infty' : '-\\infty';
    if (Math.abs(v) < 1e-6) v = 0;
    const str = String(+v.toPrecision(5));
    return etat.langue === 'en' ? str : str.replace('.', '{,}');
  };

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

  /** Dilogarithme Li_2(x) = Σ x^k/k² pour −1 ≤ x ≤ 1 (limite de l'exemple du critère de Cauchy). */
  const PI2 = Math.PI * Math.PI;
  function dilogSerie(x) {
    let s = 0, p = x;
    for (let k = 1; k < 2000; k++) {
      const term = p / (k * k);
      s += term;
      if (Math.abs(term) < 1e-17) break;
      p *= x;
    }
    return s;
  }
  function dilog(x) {
    if (x > 1 || x < -1 || Number.isNaN(x)) return NaN;
    if (x === 1) return PI2 / 6;
    if (x === -1) return -PI2 / 12;
    if (x > 0.5) return PI2 / 6 - Math.log(x) * Math.log(1 - x) - dilogSerie(1 - x);
    if (x < -0.5) return 0.5 * dilog(x * x) - dilog(-x);
    return dilogSerie(x);
  }
  /** Σ_{k=1}^n x^k/k² (somme partielle de l'exemple). */
  function sommeDilog(x, n) {
    let s = 0, p = x;
    const N = Math.min(n, N_CAP_SERIES);
    for (let k = 1; k <= N; k++) { s += p / (k * k); p *= x; }
    return s;
  }
  /** Σ_{k>n} 1/k² = π²/6 − Σ_{k≤n} 1/k². */
  function resteBale(n) {
    let s = 0;
    for (let k = 1; k <= n; k++) s += 1 / (k * k);
    return Math.max(0, PI2 / 6 - s);
  }

  // ===========================================================================
  //  Analyseur d'expressions (suite personnalisée) : variables x et n,
  //  + − * / ^ (associatif à droite), moins unaire, parenthèses, multiplication
  //  implicite (2x, nx, 3 sin(x), (x+1)(x−1)), fonctions usuelles, pi et e.
  //  Produit une fonction JavaScript (x, n) ↦ valeur.
  // ===========================================================================
  const FONCS = {
    sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan',
    asin: 'Math.asin', acos: 'Math.acos', atan: 'Math.atan',
    arcsin: 'Math.asin', arccos: 'Math.acos', arctan: 'Math.atan',
    sinh: 'Math.sinh', cosh: 'Math.cosh', tanh: 'Math.tanh',
    exp: 'Math.exp', ln: 'Math.log', log: 'Math.log', log10: 'Math.log10', log2: 'Math.log2',
    sqrt: 'Math.sqrt', racine: 'Math.sqrt', abs: 'Math.abs',
    floor: 'Math.floor', plancher: 'Math.floor', ceil: 'Math.ceil', plafond: 'Math.ceil',
    round: 'Math.round', sign: 'Math.sign', signe: 'Math.sign',
    min: 'Math.min', max: 'Math.max',
  };
  const CONSTS = { pi: 'Math.PI', e: 'Math.E' };
  const NOMS = Object.keys(FONCS).concat(Object.keys(CONSTS), ['x', 'n']).sort((p, q) => q.length - p.length);

  function pretraiter(s) {
    return s.replace(/²/g, '^2').replace(/³/g, '^3').replace(/[×·]/g, '*').replace(/÷/g, '/')
      .replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/\*\*/g, '^');
  }

  /** « xsin » → x, sin ; « nx » → n, x ; « x2 » → x, 2 (plus long nom connu d'abord). */
  function decouperIdent(mot) {
    const out = [];
    let reste = mot;
    while (reste.length) {
      if (/^\d/.test(reste)) {
        const m = /^\d+(\.\d*)?/.exec(reste)[0];
        out.push({ type: 'num', valeur: parseFloat(m) }); reste = reste.slice(m.length); continue;
      }
      const nom = NOMS.find((nn) => reste.startsWith(nn));
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
      if ('+-*/^(),'.indexOf(c) >= 0) { toks.push({ type: 'op', valeur: c }); i++; continue; }
      throw new Error(t('errCaractere', { x: c }));
    }
    return toks;
  }

  function compilerExpression(src) {
    const toks = lexer(pretraiter(String(src).trim()));
    if (!toks.length) throw new Error(t('errVide'));
    let p = 0;
    const estOp = (v) => { const tk = toks[p]; return !!tk && tk.type === 'op' && tk.valeur === v; };
    const attendre = (v) => { if (!estOp(v)) throw new Error(t('errAttendu', { x: v })); p++; };
    const debutFacteur = (tk) => !!tk && (tk.type === 'num' || tk.type === 'id' || (tk.type === 'op' && tk.valeur === '('));

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
        if (tk.valeur === 'x' || tk.valeur === 'n') return tk.valeur;
        if (CONSTS[tk.valeur]) return CONSTS[tk.valeur];
        const fn = FONCS[tk.valeur];
        if (estOp('(')) {
          p++;
          const args = [expression()];
          while (estOp(',')) { p++; args.push(expression()); }
          attendre(')');
          return fn + '(' + args.join(',') + ')';
        }
        return fn + '(' + unaire() + ')';
      }
      throw new Error(t('errJeton', { x: tk.valeur }));
    }
    const code = expression();
    if (p < toks.length) throw new Error(t('errJeton', { x: toks[p].valeur }));
    const f = new Function('x', 'n', 'return ' + code + ';');   // code engendré uniquement à partir de nos jetons
    if (typeof f(0.5, 3) !== 'number') throw new Error(t('errInvalide'));
    return f;
  }

  // ===========================================================================
  //  Suites prédéfinies (exemples et exercices de la section 2.1)
  //    fn(x, n) : le membre ; f(x) : la limite simple ; A : {a, b, ao, bo}
  //    (ao / bo : extrémité ouverte) ; texFn, texF, texA : KaTeX ;
  //    uniforme : convergence uniforme sur A ; norme(n) : ‖f_n − f‖_A exacte ;
  //    xn(n) : point du critère de non-convergence uniforme ;
  //    discontinuites : points de saut de f ; fenetre : vue par défaut ;
  //    membres : autres membres affichés ; explication : fr / en (HTML + $…$).
  // ===========================================================================
  const R = String.raw;
  const SUITES = [
    { id: 'x-sur-n', groupe: 'cours', source: { fr: 'Exemple du cours (section 2.1)', en: 'Example from the notes (Section 2.1)' },
      fn: (x, n) => x / n, f: () => 0,
      texFn: R`\frac{x}{n}`, texF: '0', A: { a: 0, b: 1 }, texA: '[0, 1]',
      fenetre: { xmin: -0.15, xmax: 1.15, ymin: -0.3, ymax: 1.15 },
      uniforme: true, norme: (n) => 1 / n, texNorme: R`\frac{1}{n}`,
      membres: [1, 2, 3, 5], n: 10, nmax: 100, eps: 0.2,
      explication: {
        fr: R`Pour tout $x \in [0, 1]$, $|f_n(x) - 0| = \frac{x}{n} \le \frac{1}{n}$, avec égalité en $x = 1$ : $\normu{f_n - 0}_{[0,1]} = \frac{1}{n} \to 0$. Par le théorème sur la convergence uniforme et la norme uniforme, $f_n \cvu 0$ sur $[0, 1]$ : étant donné $\eps > 0$, le rang $N > 1/\eps$ convient pour tous les $x$ à la fois.`,
        en: R`For every $x \in [0, 1]$, $|f_n(x) - 0| = \frac{x}{n} \le \frac{1}{n}$, with equality at $x = 1$: $\normu{f_n - 0}_{[0,1]} = \frac{1}{n} \to 0$. By the theorem on uniform convergence and the uniform norm, $f_n \cvu 0$ on $[0, 1]$: given $\eps > 0$, the rank $N > 1/\eps$ works for all $x$ at once.`,
      } },
    { id: 'x-sur-n-R', groupe: 'cours', source: { fr: 'Exemple du cours (section 2.1)', en: 'Example from the notes (Section 2.1)' },
      fn: (x, n) => x / n, f: () => 0,
      texFn: R`\frac{x}{n}`, texF: '0', A: { a: -Infinity, b: Infinity }, texA: R`\bR`,
      fenetre: { xmin: -10, xmax: 10, ymin: -2.6, ymax: 2.6 },
      uniforme: false, norme: () => Infinity, texNorme: R`+\infty`,
      xn: (n) => n, texXn: 'x_n = n',
      membres: [1, 2, 5], n: 4, nmax: 100, eps: 0.5,
      explication: {
        fr: R`Pour tout $x$ fixé, $\frac{x}{n} \to 0$ : la limite simple est $f \equiv 0$. Mais, pour $n$ fixé, $f_n(x) = \frac{x}{n}$ n'est pas bornée sur $\bR$ : $\normu{f_n - 0}_{\bR} = +\infty$, et le graphe de $f_n$ sort de la bande dès que $|x| \ge n \eps$. Avec $x_n := n$, on a $f_n(x_n) - 0 = 1 \nra 0$ : par le critère de non-convergence uniforme, la convergence n'est pas uniforme sur $\bR$ (elle l'est sur tout intervalle borné).`,
        en: R`For each fixed $x$, $\frac{x}{n} \to 0$: the pointwise limit is $f \equiv 0$. But, for fixed $n$, $f_n(x) = \frac{x}{n}$ is unbounded on $\bR$: $\normu{f_n - 0}_{\bR} = +\infty$, and the graph of $f_n$ leaves the band as soon as $|x| \ge n \eps$. With $x_n := n$, we get $f_n(x_n) - 0 = 1 \nra 0$: by the criterion for non-uniform convergence, the convergence is not uniform on $\bR$ (it is uniform on every bounded interval).`,
      } },
    { id: 'puissances', groupe: 'cours', source: { fr: 'Exemple du cours (section 2.1)', en: 'Example from the notes (Section 2.1)' },
      fn: (x, n) => Math.pow(x, n), f: (x) => (x >= 1 ? 1 : 0),
      texFn: 'x^n', texF: R`\begin{cases} 0 & \text{si } 0 \le x < 1 \\ 1 & \text{si } x = 1 \end{cases}`, A: { a: 0, b: 1 }, texA: '[0, 1]',
      discontinuites: [1],
      fenetre: { xmin: -0.12, xmax: 1.12, ymin: -0.3, ymax: 1.3 },
      uniforme: false, norme: () => 1, texNorme: '1',
      xn: (n) => Math.pow(0.5, 1 / n), texXn: 'x_n = (1/2)^{1/n}',
      membres: [1, 2, 3, 5, 10], n: 30, nmax: 200, eps: 0.25,
      explication: {
        fr: R`La limite simple $f$ vaut $0$ sur $[0, 1)$ et $1$ en $x = 1$ : elle est discontinue, alors que chaque $f_n$ est continue (la convergence simple ne conserve pas la continuité). Pour $0 \le x < 1$, l'écart $|f_n(x) - f(x)| = x^n$ est proche de $1$ lorsque $x$ est proche de $1$ : $\normu{f_n - f}_{[0,1]} = 1$ pour tout $n$. Avec $x_n := (1/2)^{1/n}$, on a $f_n(x_n) - f(x_n) = \frac{1}{2} \nra 0$ (critère de non-convergence uniforme) : le point $x_n$ se rapproche du « point à problème » $x = 1$.`,
        en: R`The pointwise limit $f$ equals $0$ on $[0, 1)$ and $1$ at $x = 1$: it is discontinuous, although every $f_n$ is continuous (pointwise convergence does not preserve continuity). For $0 \le x < 1$, the gap $|f_n(x) - f(x)| = x^n$ is close to $1$ when $x$ is close to $1$: $\normu{f_n - f}_{[0,1]} = 1$ for every $n$. With $x_n := (1/2)^{1/n}$, we get $f_n(x_n) - f(x_n) = \frac{1}{2} \nra 0$ (criterion for non-uniform convergence): the point $x_n$ approaches the “problem point” $x = 1$.`,
      } },
    { id: 'bosse-ecrasee', groupe: 'cours', source: { fr: 'Exemple du cours (section 2.1, méthode)', en: 'Example from the notes (Section 2.1, the method)' },
      fn: (x, n) => Math.pow(x, n) * (1 - x), f: () => 0,
      texFn: 'x^n (1 - x)', texF: '0', A: { a: 0, b: 1 }, texA: '[0, 1]',
      fenetre: { xmin: -0.12, xmax: 1.12, ymin: -0.08, ymax: 0.32 },
      uniforme: true, norme: (n) => Math.pow(n / (n + 1), n) / (n + 1), texNorme: R`\Big( \frac{n}{n+1} \Big)^{n} \frac{1}{n+1}`,
      membres: [1, 2, 3, 5, 10], n: 20, nmax: 200, eps: 0.05,
      explication: {
        fr: R`Limite simple : $f_n(x) \to 0$ pour tout $x \in [0, 1]$. Norme : $f_n \ge 0$ et $f_n'(x) = x^{n-1} \big( n - (n+1) x \big)$, donc le maximum de $f_n$ est atteint en $x = \frac{n}{n+1}$ et $\normu{f_n - 0}_{[0,1]} = \big( \frac{n}{n+1} \big)^n \frac{1}{n+1} \le \frac{1}{n+1} \to 0$ : la convergence est uniforme, bien que $(x^n)$ ne converge pas uniformément — le facteur $1 - x$ « écrase » les valeurs de $x^n$ près de $1$.`,
        en: R`Pointwise limit: $f_n(x) \to 0$ for every $x \in [0, 1]$. Norm: $f_n \ge 0$ and $f_n'(x) = x^{n-1} \big( n - (n+1) x \big)$, so the maximum of $f_n$ is reached at $x = \frac{n}{n+1}$ and $\normu{f_n - 0}_{[0,1]} = \big( \frac{n}{n+1} \big)^n \frac{1}{n+1} \le \frac{1}{n+1} \to 0$: the convergence is uniform, although $(x^n)$ does not converge uniformly — the factor $1 - x$ “squashes” the values of $x^n$ near $1$.`,
      } },
    { id: 'bosse-glissante', groupe: 'cours', source: { fr: 'Exemple du cours (section 2.1, critère)', en: 'Example from the notes (Section 2.1, the criterion)' },
      fn: (x, n) => n * x / (1 + n * n * x * x), f: () => 0,
      texFn: R`\frac{n x}{1 + n^2 x^2}`, texF: '0', A: { a: -Infinity, b: Infinity }, texA: R`\bR`,
      fenetre: { xmin: -2, xmax: 2, ymin: -0.75, ymax: 0.75 },
      uniforme: false, norme: () => 0.5, texNorme: R`\frac{1}{2}`,
      xn: (n) => 1 / n, texXn: 'x_n = 1/n',
      membres: [1, 2, 5, 10], n: 20, nmax: 200, eps: 0.25,
      explication: {
        fr: R`Limite simple : $f_n(0) = 0$ et, pour $x \ne 0$, $|f_n(x)| \le \frac{n |x|}{n^2 x^2} = \frac{1}{n |x|} \to 0$ ; la limite $f \equiv 0$ est continue. Pourtant, avec $x_n := \frac{1}{n}$, on a $f_n(x_n) = \frac{1}{2} \nra 0$ : la « bosse » de hauteur $\frac{1}{2}$ se déplace vers $0$ sans s'aplatir, et la convergence n'est pas uniforme sur $\bR$ (ni sur $[0, 1]$, qui contient tous les $x_n$). Elle est uniforme sur $[a, +\infty)$ pour tout $a > 0$, car $|f_n(x)| \le \frac{1}{n a}$ pour $x \ge a$ (exercice P2).`,
        en: R`Pointwise limit: $f_n(0) = 0$ and, for $x \ne 0$, $|f_n(x)| \le \frac{n |x|}{n^2 x^2} = \frac{1}{n |x|} \to 0$; the limit $f \equiv 0$ is continuous. Yet, with $x_n := \frac{1}{n}$, we get $f_n(x_n) = \frac{1}{2} \nra 0$: the “bump” of height $\frac{1}{2}$ moves towards $0$ without flattening, and the convergence is not uniform on $\bR$ (nor on $[0, 1]$, which contains all the $x_n$). It is uniform on $[a, +\infty)$ for every $a > 0$, since $|f_n(x)| \le \frac{1}{n a}$ for $x \ge a$ (Exercise P2).`,
      } },
    { id: 'racines', groupe: 'cours', source: { fr: 'Exemple du cours (section 2.1) et exercice P3', en: 'Example from the notes (Section 2.1) and Exercise P3' },
      fn: (x, n) => Math.sqrt(x * x + 1 / n), f: (x) => Math.abs(x),
      texFn: R`\sqrt{x^2 + \tfrac{1}{n}}`, texF: '|x|', A: { a: -Infinity, b: Infinity }, texA: R`\bR`,
      fenetre: { xmin: -2, xmax: 2, ymin: -0.5, ymax: 2.4 },
      uniforme: true, norme: (n) => 1 / Math.sqrt(n), texNorme: R`\frac{1}{\sqrt{n}}`,
      membres: [1, 4, 25], n: 10, nmax: 100, eps: 0.2,
      explication: {
        fr: R`Pour tout $x \in \bR$, $0 < \sqrt{x^2 + \tfrac{1}{n}} - |x| = \dfrac{1/n}{\sqrt{x^2 + 1/n} + |x|} \le \dfrac{1/n}{\sqrt{1/n}} = \frac{1}{\sqrt{n}}$, avec égalité en $x = 0$ : $\normu{f_n - |x|}_{\bR} = \frac{1}{\sqrt{n}} \to 0$ et $f_n \cvu |x|$ sur $\bR$ (exercice P3). Chaque $f_n$ est dérivable sur $\bR$, mais la limite uniforme $|x|$ ne l'est pas en $0$ (section 2.3).`,
        en: R`For every $x \in \bR$, $0 < \sqrt{x^2 + \tfrac{1}{n}} - |x| = \dfrac{1/n}{\sqrt{x^2 + 1/n} + |x|} \le \dfrac{1/n}{\sqrt{1/n}} = \frac{1}{\sqrt{n}}$, with equality at $x = 0$: $\normu{f_n - |x|}_{\bR} = \frac{1}{\sqrt{n}} \to 0$ and $f_n \cvu |x|$ on $\bR$ (Exercise P3). Every $f_n$ is differentiable on $\bR$, but the uniform limit $|x|$ is not differentiable at $0$ (Section 2.3).`,
      } },
    { id: 'serie-k2', groupe: 'cours', source: { fr: 'Exemple du cours (section 2.1, critère de Cauchy uniforme)', en: 'Example from the notes (Section 2.1, uniform Cauchy criterion)' },
      fn: (x, n) => sommeDilog(x, n), f: (x) => dilog(x),
      texFn: R`\sum_{k=1}^{n} \frac{x^k}{k^2}`, texF: R`F(x) = \lim_{n \to \infty} \sum_{k=1}^{n} \frac{x^k}{k^2}`, A: { a: -1, b: 1 }, texA: '[-1, 1]',
      fenetre: { xmin: -1.12, xmax: 1.12, ymin: -1.1, ymax: 1.9 },
      uniforme: true, norme: (n) => resteBale(n), texNorme: R`\sum_{k > n} \frac{1}{k^2} < \frac{1}{n}`,
      membres: [1, 2, 3], n: 5, nmax: 100, nCap: N_CAP_SERIES, eps: 0.1,
      explication: {
        fr: R`Pour $n > m$ et $|x| \le 1$, $|f_n(x) - f_m(x)| \le \sum_{k=m+1}^{n} \frac{1}{k^2} \le \sum_{k=m+1}^{n} \Big( \frac{1}{k-1} - \frac{1}{k} \Big) < \frac{1}{m}$ : la suite est uniformément de Cauchy sur $[-1, 1]$, donc elle converge uniformément (critère de Cauchy uniforme) vers une fonction $F$ qui n'a pas d'expression simple (le dilogarithme). L'écart maximal est atteint en $x = 1$ : $\normu{f_n - F}_{[-1,1]} = \sum_{k > n} \frac{1}{k^2} < \frac{1}{n} \to 0$. Nous reverrons $F$ aux sections 2.2 et 2.3.`,
        en: R`For $n > m$ and $|x| \le 1$, $|f_n(x) - f_m(x)| \le \sum_{k=m+1}^{n} \frac{1}{k^2} \le \sum_{k=m+1}^{n} \Big( \frac{1}{k-1} - \frac{1}{k} \Big) < \frac{1}{m}$: the sequence is uniformly Cauchy on $[-1, 1]$, hence converges uniformly (uniform Cauchy criterion) to a function $F$ with no simple expression (the dilogarithm). The largest gap is reached at $x = 1$: $\normu{f_n - F}_{[-1,1]} = \sum_{k > n} \frac{1}{k^2} < \frac{1}{n} \to 0$. We meet $F$ again in Sections 2.2 and 2.3.`,
      } },

    // ---------------------------------------------------------------- exercices
    { id: 'P1a', groupe: 'exercices', source: { fr: 'Exercice P1 (a) de la section 2.1', en: 'Exercise P1 (a) of Section 2.1' },
      fn: (x, n) => Math.pow(x, n), f: () => 0,
      texFn: 'x^n', texF: '0', A: { a: 0, b: 0.9 }, texA: R`[0, a], \ a = 0{,}9`,
      fenetre: { xmin: -0.12, xmax: 1.12, ymin: -0.3, ymax: 1.3 },
      uniforme: true, norme: (n) => Math.pow(0.9, n), texNorme: R`a^n = 0{,}9^n`,
      membres: [1, 2, 5, 10], n: 30, nmax: 200, eps: 0.1,
      explication: {
        fr: R`Pour $0 \le x \le a$, on a $0 \le x^n \le a^n$ (la fonction $t \mapsto t^n$ est croissante sur $[0, +\infty)$), avec égalité en $x = a$ : $\normu{f_n - 0}_{[0, a]} = a^n \to 0$, car $0 < a < 1$. La convergence est uniforme sur $[0, a]$ : le « point à problème » $x = 1$ est exclu, et le rang $N(\eps) > \log \eps / \log a$ convient pour tous les $x \in [0, a]$.`,
        en: R`For $0 \le x \le a$, we have $0 \le x^n \le a^n$ (the function $t \mapsto t^n$ is increasing on $[0, +\infty)$), with equality at $x = a$: $\normu{f_n - 0}_{[0, a]} = a^n \to 0$, since $0 < a < 1$. The convergence is uniform on $[0, a]$: the “problem point” $x = 1$ is excluded, and the rank $N(\eps) > \log \eps / \log a$ works for all $x \in [0, a]$.`,
      } },
    { id: 'P1b', groupe: 'exercices', source: { fr: 'Exercice P1 (b) de la section 2.1', en: 'Exercise P1 (b) of Section 2.1' },
      fn: (x, n) => 1 / (1 + n * x), f: (x) => (x <= 0 ? 1 : 0),
      texFn: R`\frac{1}{1 + n x}`, texF: R`\begin{cases} 1 & \text{si } x = 0 \\ 0 & \text{si } 0 < x \le 1 \end{cases}`, A: { a: 0, b: 1 }, texA: '[0, 1]',
      discontinuites: [0],
      fenetre: { xmin: -0.12, xmax: 1.12, ymin: -0.3, ymax: 1.3 },
      uniforme: false, norme: () => 1, texNorme: '1',
      xn: (n) => 1 / n, texXn: 'x_n = 1/n',
      membres: [1, 2, 5, 10], n: 20, nmax: 200, eps: 0.25,
      explication: {
        fr: R`Limite simple : $f_n(0) = 1$ pour tout $n$ et, pour $0 < x \le 1$, $f_n(x) \to 0$ ; la limite $f$ est discontinue en $0$. Pour $0 < x \le 1$, $|f_n(x) - f(x)| = \frac{1}{1 + n x}$ tend vers $1$ lorsque $x \to 0^+$ : $\normu{f_n - f}_{[0,1]} = 1 \nra 0$. Avec $x_n := \frac{1}{n}$, on a $f_n(x_n) - f(x_n) = \frac{1}{2} \nra 0$ (critère de non-convergence uniforme). Sur $[a, 1]$ avec $a > 0$, en revanche, la convergence est uniforme.`,
        en: R`Pointwise limit: $f_n(0) = 1$ for every $n$ and, for $0 < x \le 1$, $f_n(x) \to 0$; the limit $f$ is discontinuous at $0$. For $0 < x \le 1$, $|f_n(x) - f(x)| = \frac{1}{1 + n x}$ tends to $1$ as $x \to 0^+$: $\normu{f_n - f}_{[0,1]} = 1 \nra 0$. With $x_n := \frac{1}{n}$, we get $f_n(x_n) - f(x_n) = \frac{1}{2} \nra 0$ (criterion for non-uniform convergence). On $[a, 1]$ with $a > 0$, however, the convergence is uniform.`,
      } },
    { id: 'P1b-a', groupe: 'exercices', source: { fr: 'Exercice P1 (b) de la section 2.1, suite', en: 'Exercise P1 (b) of Section 2.1, continued' },
      fn: (x, n) => 1 / (1 + n * x), f: () => 0,
      texFn: R`\frac{1}{1 + n x}`, texF: '0', A: { a: 0.1, b: 1 }, texA: R`[a, 1], \ a = 0{,}1`,
      fenetre: { xmin: -0.12, xmax: 1.12, ymin: -0.3, ymax: 1.3 },
      uniforme: true, norme: (n) => 1 / (1 + 0.1 * n), texNorme: R`\frac{1}{1 + n a} = \frac{1}{1 + 0{,}1 \, n}`,
      membres: [1, 2, 5, 10], n: 20, nmax: 200, eps: 0.25,
      explication: {
        fr: R`Sur $[a, 1]$, la limite simple est $f \equiv 0$ et $|f_n(x) - 0| = \frac{1}{1 + n x} \le \frac{1}{1 + n a}$, car $x \ge a$, avec égalité en $x = a$ : $\normu{f_n - 0}_{[a, 1]} = \frac{1}{1 + n a} \to 0$. La convergence est uniforme sur $[a, 1]$ : le point à problème $x = 0$ est exclu.`,
        en: R`On $[a, 1]$, the pointwise limit is $f \equiv 0$ and $|f_n(x) - 0| = \frac{1}{1 + n x} \le \frac{1}{1 + n a}$, since $x \ge a$, with equality at $x = a$: $\normu{f_n - 0}_{[a, 1]} = \frac{1}{1 + n a} \to 0$. The convergence is uniform on $[a, 1]$: the problem point $x = 0$ is excluded.`,
      } },
    { id: 'P1c', groupe: 'exercices', source: { fr: 'Exercice P1 (c) de la section 2.1', en: 'Exercise P1 (c) of Section 2.1' },
      fn: (x, n) => x / (1 + n * x), f: () => 0,
      texFn: R`\frac{x}{1 + n x}`, texF: '0', A: { a: 0, b: Infinity }, texA: R`[0, +\infty)`,
      fenetre: { xmin: -0.5, xmax: 10, ymin: -0.25, ymax: 1.2 },
      uniforme: true, norme: (n) => 1 / n, texNorme: R`\frac{1}{n}`,
      membres: [1, 2, 5], n: 10, nmax: 100, eps: 0.2,
      explication: {
        fr: R`Pour $x > 0$, $0 < \frac{x}{1 + n x} < \frac{x}{n x} = \frac{1}{n}$, et $f_n(x) = \frac{1}{n} \big( 1 - \frac{1}{1 + n x} \big) \to \frac{1}{n}$ lorsque $x \to +\infty$ : $\normu{f_n - 0}_{[0, +\infty)} = \frac{1}{n} \to 0$ (le suprémum n'est pas atteint). La convergence est uniforme sur $[0, +\infty)$ tout entier.`,
        en: R`For $x > 0$, $0 < \frac{x}{1 + n x} < \frac{x}{n x} = \frac{1}{n}$, and $f_n(x) = \frac{1}{n} \big( 1 - \frac{1}{1 + n x} \big) \to \frac{1}{n}$ as $x \to +\infty$: $\normu{f_n - 0}_{[0, +\infty)} = \frac{1}{n} \to 0$ (the supremum is not attained). The convergence is uniform on the whole of $[0, +\infty)$.`,
      } },
    { id: 'P1d', groupe: 'exercices', source: { fr: 'Exercice P1 (d) de la section 2.1', en: 'Exercise P1 (d) of Section 2.1' },
      fn: (x, n) => n * x / (1 + n * x), f: (x) => (x <= 0 ? 0 : 1),
      texFn: R`\frac{n x}{1 + n x}`, texF: R`\begin{cases} 0 & \text{si } x = 0 \\ 1 & \text{si } 0 < x \le 1 \end{cases}`, A: { a: 0, b: 1 }, texA: '[0, 1]',
      discontinuites: [0],
      fenetre: { xmin: -0.12, xmax: 1.12, ymin: -0.3, ymax: 1.3 },
      uniforme: false, norme: () => 1, texNorme: '1',
      xn: (n) => 1 / n, texXn: 'x_n = 1/n',
      membres: [1, 2, 5, 10], n: 20, nmax: 200, eps: 0.25,
      explication: {
        fr: R`Limite simple : $f_n(0) = 0$ et, pour $0 < x \le 1$, $f_n(x) = 1 - \frac{1}{1 + n x} \to 1$ ; la limite $f$ est discontinue en $0$. Pour $0 < x \le 1$, $|f_n(x) - f(x)| = \frac{1}{1 + n x}$, de suprémum $1$ sur $(0, 1]$ : $\normu{f_n - f}_{[0,1]} = 1 \nra 0$, la convergence n'est pas uniforme. Avec $x_n := \frac{1}{n}$, $|f_n(x_n) - f(x_n)| = \frac{1}{2} \nra 0$.`,
        en: R`Pointwise limit: $f_n(0) = 0$ and, for $0 < x \le 1$, $f_n(x) = 1 - \frac{1}{1 + n x} \to 1$; the limit $f$ is discontinuous at $0$. For $0 < x \le 1$, $|f_n(x) - f(x)| = \frac{1}{1 + n x}$, whose supremum on $(0, 1]$ is $1$: $\normu{f_n - f}_{[0,1]} = 1 \nra 0$, the convergence is not uniform. With $x_n := \frac{1}{n}$, $|f_n(x_n) - f(x_n)| = \frac{1}{2} \nra 0$.`,
      } },
    { id: 'P2', groupe: 'exercices', source: { fr: 'Exercice P2 de la section 2.1', en: 'Exercise P2 of Section 2.1' },
      fn: (x, n) => n * x / (1 + n * n * x * x), f: () => 0,
      texFn: R`\frac{n x}{1 + n^2 x^2}`, texF: '0', A: { a: 0.2, b: Infinity }, texA: R`[a, +\infty), \ a = 0{,}2`,
      fenetre: { xmin: -0.3, xmax: 2.2, ymin: -0.2, ymax: 0.75 },
      uniforme: true, norme: (n) => (n * 0.2 >= 1 ? n * 0.2 / (1 + n * n * 0.04) : 0.5), texNorme: R`\frac{n a}{1 + n^2 a^2} \ (n \ge 1/a)`,
      membres: [1, 2, 5, 10], n: 20, nmax: 200, eps: 0.2,
      explication: {
        fr: R`Pour $x \ge a > 0$, $0 \le f_n(x) \le \frac{n x}{n^2 x^2} = \frac{1}{n x} \le \frac{1}{n a}$ : $\normu{f_n - 0}_{[a, +\infty)} \le \frac{1}{n a} \to 0$, et la convergence est uniforme sur $[a, +\infty)$. (Dès que $n \ge 1/a$, la bosse de $f_n$, située en $x = \frac{1}{n}$, est sortie de $A$ : le maximum de $f_n$ sur $[a, +\infty)$ est atteint en $x = a$ et vaut $\frac{n a}{1 + n^2 a^2}$.) Sur $(0, +\infty)$, en revanche, la convergence n'est pas uniforme : $f_n(1/n) = \frac{1}{2}$.`,
        en: R`For $x \ge a > 0$, $0 \le f_n(x) \le \frac{n x}{n^2 x^2} = \frac{1}{n x} \le \frac{1}{n a}$: $\normu{f_n - 0}_{[a, +\infty)} \le \frac{1}{n a} \to 0$, and the convergence is uniform on $[a, +\infty)$. (As soon as $n \ge 1/a$, the bump of $f_n$, located at $x = \frac{1}{n}$, has left $A$: the maximum of $f_n$ on $[a, +\infty)$ is reached at $x = a$ and equals $\frac{n a}{1 + n^2 a^2}$.) On $(0, +\infty)$, however, the convergence is not uniform: $f_n(1/n) = \frac{1}{2}$.`,
      } },
    { id: 'P4', groupe: 'exercices', source: { fr: 'Exercice P4 (a), (b) de la section 2.1', en: 'Exercise P4 (a), (b) of Section 2.1' },
      fn: (x, n) => (x === 1 ? n + 1 : (1 - Math.pow(x, n + 1)) / (1 - x)), f: (x) => 1 / (1 - x),
      texFn: R`\sum_{k=0}^{n} x^k`, texF: R`\frac{1}{1 - x}`, A: { a: -0.9, b: 0.9 }, texA: R`[-a, a], \ a = 0{,}9`,
      fenetre: { xmin: -1.05, xmax: 1.05, ymin: -1.2, ymax: 11 },
      uniforme: true, norme: (n) => Math.pow(0.9, n + 1) / 0.1, texNorme: R`\frac{a^{n+1}}{1 - a} = 10 \cdot 0{,}9^{n+1}`,
      membres: [1, 2, 5, 10], n: 30, nmax: 200, nCap: N_CAP_SERIES, eps: 0.5,
      explication: {
        fr: R`Pour $x \ne 1$, $f_n(x) = \frac{1 - x^{n+1}}{1 - x}$ (somme géométrique). Si $|x| \le a < 1$, alors $x^{n+1} \to 0$ : la limite simple est $f(x) = \frac{1}{1 - x}$ et $|f_n(x) - f(x)| = \frac{|x|^{n+1}}{1 - x} \le \frac{a^{n+1}}{1 - a}$, avec égalité en $x = a$ : $\normu{f_n - f}_{[-a, a]} = \frac{a^{n+1}}{1 - a} \to 0$. La convergence est uniforme sur $[-a, a]$ (on peut aussi le voir par le critère de Cauchy uniforme, exercice P4 (a)).`,
        en: R`For $x \ne 1$, $f_n(x) = \frac{1 - x^{n+1}}{1 - x}$ (geometric sum). If $|x| \le a < 1$, then $x^{n+1} \to 0$: the pointwise limit is $f(x) = \frac{1}{1 - x}$ and $|f_n(x) - f(x)| = \frac{|x|^{n+1}}{1 - x} \le \frac{a^{n+1}}{1 - a}$, with equality at $x = a$: $\normu{f_n - f}_{[-a, a]} = \frac{a^{n+1}}{1 - a} \to 0$. The convergence is uniform on $[-a, a]$ (this also follows from the uniform Cauchy criterion, Exercise P4 (a)).`,
      } },
    { id: 'P4c', groupe: 'exercices', source: { fr: 'Exercice P4 (c) de la section 2.1', en: 'Exercise P4 (c) of Section 2.1' },
      fn: (x, n) => (x === 1 ? n + 1 : (1 - Math.pow(x, n + 1)) / (1 - x)), f: (x) => 1 / (1 - x),
      texFn: R`\sum_{k=0}^{n} x^k`, texF: R`\frac{1}{1 - x}`, A: { a: -1, b: 1, ao: true, bo: true }, texA: '(-1, 1)',
      fenetre: { xmin: -1.05, xmax: 1.05, ymin: -1.2, ymax: 11 },
      uniforme: false, norme: () => Infinity, texNorme: R`+\infty`,
      xn: (n) => Math.pow(2, -1 / (n + 1)), texXn: 'x_n = 2^{-1/(n+1)}',
      membres: [1, 2, 5, 10], n: 30, nmax: 200, nCap: N_CAP_SERIES, eps: 0.5,
      explication: {
        fr: R`La limite simple sur $(-1, 1)$ est $f(x) = \frac{1}{1 - x}$, mais $|f_n(x) - f(x)| = \frac{|x|^{n+1}}{1 - x} \to +\infty$ lorsque $x \to 1^-$ : $\normu{f_n - f}_{(-1, 1)} = +\infty$ pour tout $n$. Avec $x_n := 2^{-1/(n+1)}$, de sorte que $x_n^{n+1} = \frac{1}{2}$, on a $|f_n(x_n) - f(x_n)| = \frac{1/2}{1 - x_n} \ge \frac{1}{2} \nra 0$ : la convergence n'est pas uniforme sur $(-1, 1)$, bien qu'elle le soit sur chaque $[-a, a]$ avec $a < 1$.`,
        en: R`The pointwise limit on $(-1, 1)$ is $f(x) = \frac{1}{1 - x}$, but $|f_n(x) - f(x)| = \frac{|x|^{n+1}}{1 - x} \to +\infty$ as $x \to 1^-$: $\normu{f_n - f}_{(-1, 1)} = +\infty$ for every $n$. With $x_n := 2^{-1/(n+1)}$, so that $x_n^{n+1} = \frac{1}{2}$, we get $|f_n(x_n) - f(x_n)| = \frac{1/2}{1 - x_n} \ge \frac{1}{2} \nra 0$: the convergence is not uniform on $(-1, 1)$, although it is uniform on every $[-a, a]$ with $a < 1$.`,
      } },
    { id: 'T2', groupe: 'exercices', source: { fr: 'Exercice T2 de la section 2.1 (indication)', en: 'Exercise T2 of Section 2.1 (hint)' },
      fn: (x, n) => Math.min(1 / x, n), f: (x) => 1 / x,
      texFn: R`\min \Big\{ \frac{1}{x}, \, n \Big\}`, texF: R`\frac{1}{x}`, A: { a: 0, b: 1, ao: true }, texA: '(0, 1]',
      fenetre: { xmin: -0.08, xmax: 1.08, ymin: -1, ymax: 13 },
      uniforme: false, norme: () => Infinity, texNorme: R`+\infty`,
      xn: (n) => 1 / (2 * n), texXn: 'x_n = 1/(2n)',
      membres: [1, 2, 4], n: 8, nmax: 100, eps: 1,
      explication: {
        fr: R`Chaque $f_n$ est bornée sur $(0, 1]$ (par $n$) et, pour $x$ fixé, $f_n(x) = \frac{1}{x}$ dès que $n \ge 1/x$ : la limite simple est $f(x) = \frac{1}{x}$, qui n'est pas bornée. Par l'exercice T2, une limite uniforme de fonctions bornées est bornée : la convergence ne peut donc pas être uniforme. Directement : $\normu{f_n - f}_{(0, 1]} = +\infty$ et, avec $x_n := \frac{1}{2n}$, $f(x_n) - f_n(x_n) = 2n - n = n \nra 0$.`,
        en: R`Every $f_n$ is bounded on $(0, 1]$ (by $n$) and, for fixed $x$, $f_n(x) = \frac{1}{x}$ as soon as $n \ge 1/x$: the pointwise limit is $f(x) = \frac{1}{x}$, which is unbounded. By Exercise T2, a uniform limit of bounded functions is bounded: the convergence cannot be uniform. Directly: $\normu{f_n - f}_{(0, 1]} = +\infty$ and, with $x_n := \frac{1}{2n}$, $f(x_n) - f_n(x_n) = 2n - n = n \nra 0$.`,
      } },
    { id: 'D3a', groupe: 'exercices', source: { fr: 'Exercice D3 (b) de la section 2.1', en: 'Exercise D3 (b) of Section 2.1' },
      fn: (x, n) => x + 1 / n, f: (x) => x,
      texFn: R`x + \frac{1}{n}`, texF: 'x', A: { a: -Infinity, b: Infinity }, texA: R`\bR`,
      fenetre: { xmin: -3, xmax: 3, ymin: -3, ymax: 3 },
      uniforme: true, norme: (n) => 1 / n, texNorme: R`\frac{1}{n}`,
      membres: [1, 2, 5], n: 4, nmax: 100, eps: 0.3,
      explication: {
        fr: R`Pour tout $x \in \bR$, $|f_n(x) - x| = \frac{1}{n}$ : $\normu{f_n - f}_{\bR} = \frac{1}{n} \to 0$, et la convergence est uniforme sur $\bR$ (le graphe de $f_n$ est le translaté vertical de celui de $f$). La limite $f(x) = x$ n'est pas bornée ; voir ce qui arrive au produit $f_n \cdot f_n$ (exercice D3 (b)).`,
        en: R`For every $x \in \bR$, $|f_n(x) - x| = \frac{1}{n}$: $\normu{f_n - f}_{\bR} = \frac{1}{n} \to 0$, and the convergence is uniform on $\bR$ (the graph of $f_n$ is a vertical translate of that of $f$). The limit $f(x) = x$ is unbounded; see what happens to the product $f_n \cdot f_n$ (Exercise D3 (b)).`,
      } },
    { id: 'D3b', groupe: 'exercices', source: { fr: 'Exercice D3 (b) de la section 2.1', en: 'Exercise D3 (b) of Section 2.1' },
      fn: (x, n) => (x + 1 / n) * (x + 1 / n), f: (x) => x * x,
      texFn: R`\Big( x + \frac{1}{n} \Big)^{2}`, texF: 'x^2', A: { a: -Infinity, b: Infinity }, texA: R`\bR`,
      fenetre: { xmin: -3, xmax: 3, ymin: -1, ymax: 9 },
      uniforme: false, norme: () => Infinity, texNorme: R`+\infty`,
      xn: (n) => n, texXn: 'x_n = n',
      membres: [1, 2, 5], n: 4, nmax: 100, eps: 0.5,
      explication: {
        fr: R`Ici $f_n = g_n \cdot g_n$ avec $g_n(x) = x + \frac{1}{n} \cvu x$ sur $\bR$. Pourtant, $f_n(x) - x^2 = \frac{2 x}{n} + \frac{1}{n^2}$ n'est pas bornée sur $\bR$ : $\normu{f_n - x^2}_{\bR} = +\infty$ et, avec $x_n := n$, $f_n(x_n) - f(x_n) = 2 + \frac{1}{n^2} \nra 0$. Le produit de deux suites uniformément convergentes ne converge pas toujours uniformément : l'hypothèse « $f$ et $g$ bornées » de l'exercice D3 (a) ne peut pas être omise.`,
        en: R`Here $f_n = g_n \cdot g_n$ with $g_n(x) = x + \frac{1}{n} \cvu x$ on $\bR$. Yet $f_n(x) - x^2 = \frac{2 x}{n} + \frac{1}{n^2}$ is unbounded on $\bR$: $\normu{f_n - x^2}_{\bR} = +\infty$ and, with $x_n := n$, $f_n(x_n) - f(x_n) = 2 + \frac{1}{n^2} \nra 0$. The product of two uniformly convergent sequences need not converge uniformly: the hypothesis “$f$ and $g$ bounded” of Exercise D3 (a) cannot be dropped.`,
      } },
  ];
  const PERSO_DEFAUT = { fnSrc: 'n x e^(-n x)', fSrc: '0', a: 0, b: 2 };

  // ===========================================================================
  //  État de l'application
  // ===========================================================================
  const etat = {
    langue: 'fr',
    suite: 'x-sur-n',
    n: 10, eps: 0.1,
    bande: true, membres: true, listeMembres: [1, 2, 3, 5], xn: true,
    vue: { xmin: -0.15, xmax: 1.15, ymin: -0.3, ymax: 1.15 },
    animation: null,
    survol: null,          // abscisse (monde) sous la souris
    glisse: null,
    perso: Object.assign({ fn: null, f: null, erreur: '', limiteEstimee: false }, PERSO_DEFAUT),
  };
  let suiteCache = null;   // suite courante normalisée (voir suiteCourante)

  const predef = (id) => SUITES.find((s) => s.id === id) || null;

  /** La suite courante sous forme normalisée (prédéfinie ou personnalisée). */
  function suiteCourante() {
    if (suiteCache && suiteCache.id === etat.suite && (etat.suite !== 'perso' || suiteCache.version === etat.perso.version)) return suiteCache;
    let s;
    if (etat.suite === 'perso') {
      const p = etat.perso;
      s = {
        id: 'perso', version: p.version, perso: true,
        fn: p.fn || ((x, n) => NaN),
        f: p.f || ((x) => (p.fn ? p.fn(x, N_GRAND) : NaN)),
        texFn: null, texF: null, A: { a: p.a, b: p.b }, texA: '[' + texNum(p.a) + ', \\ ' + texNum(p.b) + ']',
        fenetre: fenetrePerso(p), uniforme: null, norme: null, xn: null, discontinuites: null,
        membres: [1, 2, 5], nmax: 100, limiteEstimee: p.limiteEstimee,
      };
    } else {
      s = Object.assign({ perso: false }, predef(etat.suite) || SUITES[0]);
    }
    suiteCache = s;
    return s;
  }

  function fenetrePerso(p) {
    const a = p.a, b = p.b, m = (b - a) * 0.08;
    // Ordonnées : d'après f_1, f_n et f sur [a, b]
    let ymin = Infinity, ymax = -Infinity;
    const voir = (y) => { if (Number.isFinite(y)) { if (y < ymin) ymin = y; if (y > ymax) ymax = y; } };
    const fs = [(x) => (p.fn ? p.fn(x, 1) : NaN), (x) => (p.fn ? p.fn(x, Math.max(1, etat.n)) : NaN), (x) => (p.f ? p.f(x, N_GRAND) : (p.fn ? p.fn(x, N_GRAND) : NaN))];
    for (let i = 0; i <= 200; i++) { const x = a + (b - a) * i / 200; fs.forEach((g) => voir(g(x))); }
    if (!Number.isFinite(ymin) || !Number.isFinite(ymax)) { ymin = -1; ymax = 1; }
    if (ymax - ymin < 1e-9) { ymin -= 1; ymax += 1; }
    const q = (ymax - ymin) * 0.15;
    return { xmin: a - m, xmax: b + m, ymin: Math.min(ymin - q, -q), ymax: ymax + q };
  }

  // ===========================================================================
  //  Calculs : échantillonnage, norme uniforme, rang N(ε)
  // ===========================================================================
  /** Intersection de A avec la fenêtre : [lo, hi] (extrémités ouvertes légèrement rentrées). */
  function bornesVisibles(s, vue) {
    vue = vue || etat.vue;
    let lo = Math.max(s.A.a, vue.xmin), hi = Math.min(s.A.b, vue.xmax);
    if (!(lo < hi)) return null;
    const d = (hi - lo) * 1e-9;
    if (s.A.ao && lo === s.A.a) lo += d;
    if (s.A.bo && hi === s.A.b) hi -= d;
    return { lo, hi };
  }

  /** Points de discontinuité de f dans (lo, hi), ou dans [lo, hi] si `inclusif`. */
  const discontinuitesDans = (s, lo, hi, inclusif) => (s.discontinuites || []).filter((d) => (inclusif ? d >= lo && d <= hi : d > lo && d < hi));

  /** Suprémum numérique de |f_n − f| sur A ∩ fenêtre : échantillonnage puis raffinement local. */
  function supEcart(s, n, vue) {
    const b = bornesVisibles(s, vue);
    if (!b) return { valeur: NaN, x: NaN };
    const g = (x) => Math.abs(s.fn(x, n) - s.f(x));
    let meilleur = -Infinity, xm = NaN, infini = false;
    const voir = (x) => {
      const v = g(x);
      if (Number.isNaN(v)) return;
      if (!Number.isFinite(v)) { infini = true; return; }
      if (v > meilleur) { meilleur = v; xm = x; }
    };
    const N = 2000, h = (b.hi - b.lo) / N;
    for (let i = 0; i <= N; i++) voir(b.lo + i * h);
    // Près des discontinuités de f, l'écart peut être grand d'un seul côté
    (s.discontinuites || []).forEach((d) => { if (d >= b.lo && d <= b.hi) { if (d > b.lo) voir(d - h * 1e-6); if (d < b.hi) voir(d + h * 1e-6); voir(d); } });
    if (infini) return { valeur: Infinity, x: xm };
    if (!Number.isFinite(meilleur)) return { valeur: NaN, x: NaN };
    // Raffinement : rééchantillonnage dense autour du meilleur point (4 fois)
    let lo = Math.max(b.lo, xm - h), hi = Math.min(b.hi, xm + h);
    for (let r = 0; r < 4; r++) {
      const hh = (hi - lo) / 40;
      for (let i = 0; i <= 40; i++) voir(lo + i * hh);
      lo = Math.max(b.lo, xm - hh); hi = Math.min(b.hi, xm + hh);
    }
    return { valeur: meilleur, x: xm };
  }

  /** ‖f_n − f‖_A affichée : exacte si connue, sinon numérique sur la fenêtre. */
  function normeCourante(s, n) {
    if (s.norme) return { valeur: s.norme(n), exacte: true };
    const r = supEcart(s, n);
    return { valeur: r.valeur, exacte: false };
  }

  /** Plus petit rang N tel que ‖f_n − f‖_A < ε pour n ≥ N (prédéfinie : formule exacte ; sinon estimation). */
  const cacheRang = {};
  function rangN(s, eps) {
    if (s.norme) {
      if (s.uniforme === false) return { N: null };
      const cle = s.id + '|' + eps;
      if (cacheRang[cle] !== undefined) return cacheRang[cle];
      let res = { N: null, tropGrand: 1e7 };
      // Les normes exactes sont décroissantes pour les suites prédéfinies : recherche par doublement puis dichotomie
      let hi = 1;
      while (hi < 1e7 && !(s.norme(hi) < eps)) hi *= 2;
      if (s.norme(hi) < eps) {
        let lo = Math.max(1, hi / 2);
        while (lo < hi) { const m = Math.floor((lo + hi) / 2); if (s.norme(m) < eps) hi = m; else lo = m + 1; }
        // Vérification que ‖f_n − f‖ < ε pour n ≥ N (monotonie) : on contrôle quelques valeurs
        res = { N: hi };
      }
      cacheRang[cle] = res;
      return res;
    }
    // Suite personnalisée : estimation numérique (sur la fenêtre)
    const cle = 'perso|' + s.version + '|' + eps + '|' + etat.vue.xmin + '|' + etat.vue.xmax;
    if (cacheRang[cle] !== undefined) return cacheRang[cle];
    const nMax = 1 << 16;
    let hi = 1;
    while (hi <= nMax && !(supEcart(s, hi).valeur < eps)) hi *= 2;
    let res;
    if (hi > nMax) res = { N: null, inconnu: nMax, numerique: true };
    else {
      let lo = Math.max(1, hi / 2);
      while (lo < hi) { const m = Math.floor((lo + hi) / 2); if (supEcart(s, m).valeur < eps) hi = m; else lo = m + 1; }
      res = { N: hi, numerique: true };
    }
    cacheRang[cle] = res;
    return res;
  }

  // ===========================================================================
  //  Canevas : dimensions, repère
  // ===========================================================================
  const canvas = document.getElementById('graphe');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const zone = { x: 0, y: 0, w: 0, h: 0 };
  const MARGE = { gauche: 50, bas: 28, haut: 14, droite: 18 };

  function redimensionner() {
    const r = canvas.parentElement.getBoundingClientRect();
    W = Math.max(80, Math.round(r.width)); H = Math.max(80, Math.round(r.height));
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    zone.x = MARGE.gauche; zone.y = MARGE.haut;
    zone.w = W - MARGE.gauche - MARGE.droite; zone.h = H - MARGE.haut - MARGE.bas;
    demanderDessin();
  }
  const sx = (x) => zone.x + (x - etat.vue.xmin) / (etat.vue.xmax - etat.vue.xmin) * zone.w;
  const sy = (y) => zone.y + zone.h - (y - etat.vue.ymin) / (etat.vue.ymax - etat.vue.ymin) * zone.h;
  const wx = (px) => etat.vue.xmin + (px - zone.x) / zone.w * (etat.vue.xmax - etat.vue.xmin);
  const wy = (py) => etat.vue.ymin + (zone.y + zone.h - py) / zone.h * (etat.vue.ymax - etat.vue.ymin);

  function recadrer() {
    const s = suiteCourante();
    etat.vue = Object.assign({}, s.fenetre);
    demanderDessin();
  }

  let dessinDemande = false;
  function demanderDessin() {
    if (!dessinDemande) { dessinDemande = true; requestAnimationFrame(dessiner); }
  }

  // ===========================================================================
  //  Dessin
  // ===========================================================================
  /** Échantillonne g sur [lo, hi] (N + 1 points) ; renvoie des tableaux xs, ys. */
  function echantillonner(g, lo, hi, N) {
    const xs = new Float64Array(N + 1), ys = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) { const x = lo + (hi - lo) * i / N; xs[i] = x; ys[i] = g(x); }
    return { xs, ys };
  }

  /** Trace une polyligne (x_i, y_i) en coupant aux valeurs non finies et aux sauts manifestes. */
  function tracerCourbe(xs, ys, couleur, largeur, pointille) {
    const hauteur = etat.vue.ymax - etat.vue.ymin;
    const saut = 0.6 * hauteur;
    const yLim = (y) => clamp(y, etat.vue.ymin - 4 * hauteur, etat.vue.ymax + 4 * hauteur);   // évite les coordonnées énormes
    ctx.strokeStyle = couleur; ctx.lineWidth = largeur; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.setLineDash(pointille || []);
    ctx.beginPath();
    let ouvert = false, yPrev = NaN;
    for (let i = 0; i < xs.length; i++) {
      const y = ys[i];
      if (!Number.isFinite(y)) { ouvert = false; yPrev = NaN; continue; }
      const grandSaut = Number.isFinite(yPrev) && Math.abs(y - yPrev) > saut && (i >= 2) && Math.abs(ys[i - 1] - ys[i - 2]) < saut * 0.5;
      if (!ouvert || grandSaut) { ctx.moveTo(sx(xs[i]), sy(yLim(y))); ouvert = true; }
      else ctx.lineTo(sx(xs[i]), sy(yLim(y)));
      yPrev = y;
    }
    ctx.stroke();
    ctx.setLineDash([]);
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
    ctx.fillStyle = C.gris; ctx.font = '12px ' + POLICE;
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
    ctx.strokeStyle = C.axe; ctx.fillStyle = C.axe; ctx.lineWidth = 1.2;
    const Y0 = sy(0), X0 = sx(0);
    if (Y0 >= zone.y && Y0 <= zone.y + zone.h) {
      ctx.beginPath(); ctx.moveTo(zone.x, Y0); ctx.lineTo(zone.x + zone.w - 2, Y0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(zone.x + zone.w - 1, Y0); ctx.lineTo(zone.x + zone.w - 10, Y0 - 4); ctx.lineTo(zone.x + zone.w - 10, Y0 + 4); ctx.closePath(); ctx.fill();
      ctx.font = 'italic 13px ' + POLICE; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('x', zone.x + zone.w - 10, Y0 - 8);
    }
    if (X0 >= zone.x && X0 <= zone.x + zone.w) {
      ctx.beginPath(); ctx.moveTo(X0, zone.y + zone.h); ctx.lineTo(X0, zone.y + 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X0, zone.y + 1); ctx.lineTo(X0 - 4, zone.y + 10); ctx.lineTo(X0 + 4, zone.y + 10); ctx.closePath(); ctx.fill();
      ctx.font = 'italic 13px ' + POLICE; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('y', X0 + 8, zone.y + 14);
    }
  }

  /** Grise (hachures) les parties de la fenêtre hors de A. */
  function dessinerHorsA(s) {
    const v = etat.vue;
    const bandes = [];
    if (s.A.a > v.xmin) bandes.push([v.xmin, Math.min(s.A.a, v.xmax)]);
    if (s.A.b < v.xmax) bandes.push([Math.max(s.A.b, v.xmin), v.xmax]);
    if (!bandes.length) return;
    ctx.save();
    bandes.forEach(([u, w]) => {
      const X0 = sx(u), X1 = sx(w);
      ctx.fillStyle = C.horsA; ctx.fillRect(X0, zone.y, X1 - X0, zone.h);
      ctx.beginPath(); ctx.rect(X0, zone.y, X1 - X0, zone.h); ctx.clip();
      ctx.strokeStyle = C.hachure; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let d = X0 - zone.h; d < X1; d += 9) { ctx.moveTo(d, zone.y + zone.h); ctx.lineTo(d + zone.h, zone.y); }
      ctx.stroke();
      ctx.restore(); ctx.save();
    });
    ctx.restore();
  }

  /** Morceaux [u, v] de A ∩ fenêtre sur lesquels f est continue (coupure aux discontinuités). */
  function morceauxDeF(s, b) {
    const ds = discontinuitesDans(s, b.lo, b.hi, true).sort((p, q) => p - q);
    const out = [];
    let u = b.lo;
    const d0 = (b.hi - b.lo) * 1e-9;
    ds.forEach((d) => { if (d - d0 > u) out.push([u, d - d0]); u = d + d0; });
    if (b.hi > u) out.push([u, b.hi]);
    return out;
  }

  function dessinerBande(s, b, N) {
    const eps = etat.eps;
    const morceaux = morceauxDeF(s, b);
    ctx.save();
    morceaux.forEach(([u, v]) => {
      const n = Math.max(8, Math.round(N * (v - u) / (b.hi - b.lo)));
      const e = echantillonner(s.f, u, v, n);
      const hauteur = etat.vue.ymax - etat.vue.ymin;
      const yLim = (y) => clamp(y, etat.vue.ymin - 4 * hauteur, etat.vue.ymax + 4 * hauteur);
      // Polygones par tronçons finis
      let i = 0;
      while (i <= n) {
        while (i <= n && !Number.isFinite(e.ys[i])) i++;
        let j = i;
        while (j <= n && Number.isFinite(e.ys[j])) j++;
        if (j - i >= 2) {
          ctx.beginPath();
          for (let k = i; k < j; k++) ctx.lineTo(sx(e.xs[k]), sy(yLim(e.ys[k] + eps)));
          for (let k = j - 1; k >= i; k--) ctx.lineTo(sx(e.xs[k]), sy(yLim(e.ys[k] - eps)));
          ctx.closePath();
          ctx.fillStyle = C.bandeFond; ctx.fill();
          const xs = e.xs.subarray(i, j), haut = new Float64Array(j - i), bas = new Float64Array(j - i);
          for (let k = i; k < j; k++) { haut[k - i] = e.ys[k] + eps; bas[k - i] = e.ys[k] - eps; }
          tracerCourbe(xs, haut, C.bandeBord, 1, [5, 4]);
          tracerCourbe(xs, bas, C.bandeBord, 1, [5, 4]);
        }
        i = j;
      }
    });
    // Aux discontinuités : la bande au-dessus du seul point x = d est le segment [f(d) − ε, f(d) + ε]
    discontinuitesDans(s, b.lo, b.hi, true).forEach((d) => {
      const y = s.f(d);
      if (!Number.isFinite(y)) return;
      const X = sx(d);
      ctx.fillStyle = C.bandeFond; ctx.fillRect(X - 2, sy(y + eps), 4, sy(y - eps) - sy(y + eps));
      ctx.strokeStyle = C.bandeBord; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(X - 2, sy(y + eps)); ctx.lineTo(X + 2, sy(y + eps)); ctx.moveTo(X - 2, sy(y - eps)); ctx.lineTo(X + 2, sy(y - eps)); ctx.stroke();
      ctx.setLineDash([]);
    });
    ctx.restore();
  }

  function dessinerLimite(s, b, N) {
    const morceaux = morceauxDeF(s, b);
    morceaux.forEach(([u, v]) => {
      const n = Math.max(8, Math.round(N * (v - u) / (b.hi - b.lo)));
      const e = echantillonner(s.f, u, v, n);
      tracerCourbe(e.xs, e.ys, C.vert, 2.6);
    });
    // Points isolés : valeur f(d) (plein) et limites latérales (creux) aux discontinuités
    const d0 = (b.hi - b.lo) * 1e-6;
    discontinuitesDans(s, b.lo, b.hi, true).forEach((d) => {
      const y = s.f(d), yg = d > b.lo ? s.f(d - d0) : NaN, yd = d < b.hi ? s.f(d + d0) : NaN;
      [yg, yd].forEach((yl) => {
        if (Number.isFinite(yl) && Math.abs(sy(yl) - sy(y)) > 3) cercle(sx(d), sy(yl), 4, '#fff', C.vert, 2);
      });
      if (Number.isFinite(y)) cercle(sx(d), sy(y), 4, C.vert, C.vert, 1);
    });
  }

  function cercle(X, Y, r, fill, stroke, lw) {
    ctx.beginPath(); ctx.arc(X, Y, r, 0, 2 * Math.PI);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
  }

  /** Le membre f_n : or dans la bande, rouge hors de la bande (sur A). */
  function dessinerMembreCourant(s, b, N) {
    const n = etat.n, eps = etat.eps;
    const e = echantillonner((x) => s.fn(x, n), b.lo, b.hi, N);
    const fs = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) fs[i] = s.f(e.xs[i]);
    // Découpage en tronçons « dedans » / « dehors »
    let i = 0;
    while (i <= N) {
      const dehors = Math.abs(e.ys[i] - fs[i]) >= eps;
      let j = i + 1;
      while (j <= N && (Math.abs(e.ys[j] - fs[j]) >= eps) === dehors) j++;
      const fin = Math.min(N, j);   // on inclut le point suivant pour ne pas laisser de trou
      tracerCourbe(e.xs.subarray(i, fin + 1), e.ys.subarray(i, fin + 1), etat.bande && dehors ? C.rouge : C.or, 2.4);
      i = j;
    }
  }

  function dessinerAutresMembres(s, b, N) {
    const liste = etat.listeMembres.filter((k) => k !== etat.n);
    const Nk = Math.max(100, Math.round(N / 2));
    liste.forEach((k) => {
      const e = echantillonner((x) => s.fn(x, k), b.lo, b.hi, Nk);
      tracerCourbe(e.xs, e.ys, C.orClair, 1.4);
      // Étiquette k au bord droit de la courbe (si visible)
      let idx = -1;
      for (let i = Nk; i >= 0; i--) { const y = e.ys[i]; if (Number.isFinite(y) && y > etat.vue.ymin && y < etat.vue.ymax) { idx = i; break; } }
      if (idx >= 0) {
        ctx.fillStyle = C.or; ctx.font = 'italic 11px ' + POLICE; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const X = Math.min(sx(e.xs[idx]) + 4, zone.x + zone.w - 18);
        ctx.fillText('f' + indice(k), X, sy(e.ys[idx]) - 7);
      }
    });
  }
  const INDICES = '₀₁₂₃₄₅₆₇₈₉';
  const indice = (k) => String(k).split('').map((c) => INDICES[+c] || c).join('');

  /** Marqueurs : écart maximal (segment rouge) et point x_n du critère. */
  function dessinerMarqueurs(s, infos) {
    const n = etat.n;
    // Écart maximal
    const r = infos.sup;
    const normeInfinie = infos.norme && infos.norme.valeur === Infinity;
    if (!normeInfinie && r && Number.isFinite(r.valeur) && Number.isFinite(r.x) && r.valeur > 0) {
      const X = sx(r.x), Y1 = sy(s.f(r.x)), Y2 = sy(s.fn(r.x, n));
      if (Number.isFinite(Y1) && Number.isFinite(Y2) && X >= zone.x && X <= zone.x + zone.w) {
        ctx.strokeStyle = C.rouge; ctx.lineWidth = 2; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(X, Y1); ctx.lineTo(X, Y2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(X - 4, Y1); ctx.lineTo(X + 4, Y1); ctx.moveTo(X - 4, Y2); ctx.lineTo(X + 4, Y2); ctx.stroke();
        const texte = 'max |f' + indice(n) + ' − f| ≈ ' + fmtAuto(r.valeur);
        ctx.font = '12px ' + POLICE; ctx.textBaseline = 'middle';
        const larg = ctx.measureText(texte).width;
        const aDroite = X + 10 + larg < zone.x + zone.w;
        ctx.textAlign = aDroite ? 'left' : 'right';
        const Xt = aDroite ? X + 8 : X - 8, Yt = clamp(Y2 + (Y2 <= Y1 ? -11 : 11), zone.y + 10, zone.y + zone.h - 10);
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(aDroite ? Xt - 2 : Xt - larg - 2, Yt - 8, larg + 4, 16);
        ctx.fillStyle = C.rouge; ctx.fillText(texte, Xt, Yt);
      }
    }
    // Point x_n
    if (etat.xn && s.xn && s.uniforme === false) {
      const x = s.xn(n);
      if (Number.isFinite(x) && x >= etat.vue.xmin && x <= etat.vue.xmax) {
        const X = sx(x), y = s.fn(x, n), Y = sy(y), Y0 = clamp(sy(0), zone.y, zone.y + zone.h);
        ctx.strokeStyle = C.gris; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(X, Y0); ctx.lineTo(X, clamp(Y, zone.y, zone.y + zone.h)); ctx.stroke();
        ctx.setLineDash([]);
        if (Y >= zone.y && Y <= zone.y + zone.h) cercle(X, Y, 5, '#fff', C.rouge, 2);
        ctx.fillStyle = C.rouge; ctx.font = 'italic 12px ' + POLICE; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('x' + indice(n), X, Math.min(Y0, zone.y + zone.h) - 3);
      }
    }
  }

  function dessinerSurvol(s) {
    const x = etat.survol;
    if (x === null || x < etat.vue.xmin || x > etat.vue.xmax) return;
    const dansA = x >= s.A.a && x <= s.A.b && !(s.A.ao && x === s.A.a) && !(s.A.bo && x === s.A.b);
    const X = sx(x);
    ctx.strokeStyle = C.bleu; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(X, zone.y); ctx.lineTo(X, zone.y + zone.h); ctx.stroke(); ctx.setLineDash([]);
    const lignes = [t('survolX') + ' = ' + fmtAuto(x)];
    if (dansA) {
      const yf = s.f(x), yn = s.fn(x, etat.n), d = Math.abs(yn - yf);
      if (Number.isFinite(yf)) cercle(X, sy(yf), 4, C.vert, '#fff', 1.5);
      if (Number.isFinite(yn)) cercle(X, sy(yn), 4, C.or, '#fff', 1.5);
      lignes.push('f(x) = ' + fmtAuto(yf));
      lignes.push('f' + indice(etat.n) + '(x) = ' + fmtAuto(yn));
      lignes.push('|f' + indice(etat.n) + '(x) − f(x)| = ' + fmtAuto(d) + (Number.isFinite(d) ? (d < etat.eps ? ' · ' + t('dansBande') : ' · ' + t('horsBande')) : ''));
    }
    ctx.font = '12px ' + POLICE; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    const larg = Math.max.apply(null, lignes.map((l) => ctx.measureText(l).width)) + 14, haut = lignes.length * 16 + 8;
    let Xb = X + 12, Yb = zone.y + 8;
    if (Xb + larg > zone.x + zone.w) Xb = X - 12 - larg;
    ctx.fillStyle = 'rgba(255,255,255,0.94)'; ctx.strokeStyle = C.bleu; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.rect(Xb, Yb, larg, haut); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.texte;
    lignes.forEach((l, i) => ctx.fillText(l, Xb + 7, Yb + 5 + 16 * i));
  }

  let infosCourantes = null;   // résultats du dernier calcul (sup, norme, rang)

  function calculer() {
    const s = suiteCourante();
    const sup = supEcart(s, etat.n);
    const norme = normeCourante(s, etat.n);
    return { s, sup, norme };
  }

  function dessiner() {
    dessinDemande = false;
    if (!zone.w || !zone.h) return;
    const s = suiteCourante();
    if (!infosCourantes) infosCourantes = calculer();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    const grad = dessinerGrille();
    ctx.save();
    ctx.beginPath(); ctx.rect(zone.x, zone.y, zone.w, zone.h); ctx.clip();
    dessinerHorsA(s);
    const b = bornesVisibles(s);
    if (b) {
      const N = Math.max(200, Math.round(2 * zone.w * (b.hi - b.lo) / (etat.vue.xmax - etat.vue.xmin)));
      if (etat.bande) dessinerBande(s, b, N);
      if (etat.membres) dessinerAutresMembres(s, b, N);
      dessinerAxes();
      dessinerMembreCourant(s, b, N);
      dessinerLimite(s, b, N);
      dessinerMarqueurs(s, infosCourantes);
    } else dessinerAxes();
    dessinerSurvol(s);
    ctx.restore();
    dessinerEtiquettesAxes(grad);
  }

  // ===========================================================================
  //  Panneaux (formules, valeurs, verdict)
  // ===========================================================================
  const $ = (id) => document.getElementById(id);
  const el = {
    topnav: $('topnav'), btnBarre: $('btn-barre'), btnEn: $('btn-en'), btnFr: $('btn-fr'), lienCours: $('lien-cours'),
    btnAide: $('btn-aide'), aide: $('aide'), aideFermer: $('aide-fermer'),
    chipsCours: $('chips-cours'), chipsExercices: $('chips-exercices'), chipsAutre: $('chips-autre'),
    perso: $('perso'), exprFn: $('expr-fn'), exprF: $('expr-f'), champA: $('champ-a'), champB: $('champ-b'),
    btnAppliquer: $('btn-appliquer'), erreurExpr: $('erreur-expr'), etFn: $('et-fn'), etF: $('et-f'), etA: $('et-A'),
    formules: $('formules'), source: $('source'),
    champN: $('champ-n'), curseurN: $('curseur-n'), btnMoins: $('btn-moins'), btnPlus: $('btn-plus'), btnDoubler: $('btn-doubler'), btnAnimer: $('btn-animer'),
    champEps: $('champ-eps'), curseurEps: $('curseur-eps'), optBande: $('opt-bande'),
    optMembres: $('opt-membres'), champMembres: $('champ-membres'), optXn: $('opt-xn'),
    btnRecadrer: $('btn-recadrer'), btnPleinEcran: $('btn-plein-ecran'), grapheSection: $('graphe-section'),
    valeurs: $('valeurs'), verdict: $('verdict'), explication: $('explication'),
  };

  function construireChips() {
    const faire = (conteneur, groupe) => {
      conteneur.innerHTML = '';
      SUITES.filter((s) => s.groupe === groupe).forEach((s) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip'; b.dataset.id = s.id;
        b.innerHTML = '<span class="chip-f">' + rendreMath(s.texFn) + '</span><span class="chip-A">' + t('sur') + ' ' + rendreMath(traduireTex(s.texA)) + '</span>';
        b.setAttribute('aria-pressed', String(s.id === etat.suite));
        b.addEventListener('click', () => choisirSuite(s.id));
        conteneur.appendChild(b);
      });
    };
    faire(el.chipsCours, 'cours'); faire(el.chipsExercices, 'exercices');
    el.chipsAutre.innerHTML = '';
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.id = 'perso'; b.textContent = t('autre');
    b.setAttribute('aria-pressed', String(etat.suite === 'perso'));
    b.addEventListener('click', () => choisirSuite('perso'));
    el.chipsAutre.appendChild(b);
  }

  function majChips() {
    document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.id === etat.suite)));
    el.perso.hidden = etat.suite !== 'perso';
  }

  function majFormules(s) {
    const parts = [];
    if (s.perso) {
      parts.push('<span>' + rendreMath('f_n(x) =') + ' <code>' + echapper(etat.perso.fnSrc) + '</code></span>');
      parts.push('<span>' + rendreMath('A =') + ' ' + rendreMath(s.texA) + '</span>');
      parts.push('<span>' + rendreMath('f(x) =') + ' ' + (s.limiteEstimee ? rendreMath('f_N(x)') + ' <span class="note">(' + rendreTexte(t('limiteEstimee')) + ')</span>' : '<code>' + echapper(etat.perso.fSrc) + '</code>') + '</span>');
    } else {
      parts.push('<span>' + rendreMath('f_n(x) = ' + s.texFn) + '</span>');
      parts.push('<span>' + rendreMath('A = ' + traduireTex(s.texA)) + '</span>');
      const cases = /\\begin\{cases\}/.test(s.texF);
      const tf = s.texF.startsWith('F(x)') ? s.texF : 'f(x) = ' + (cases ? s.texF : s.texF);
      parts.push('<span' + (cases ? ' class="formule-cases"' : '') + '>' + rendreMath(traduireTex(tf)) + ' <span class="note">(' + t('limiteSimple') + ')</span></span>');
    }
    el.formules.innerHTML = parts.join('');
    el.source.textContent = s.perso ? t('suitePerso') : (s.source ? s.source[etat.langue] || s.source.fr : '');
  }

  function majValeurs(s, infos) {
    const n = etat.n, eps = etat.eps;
    const rows = [];
    const ligne = (etiq, val) => rows.push('<dt>' + rendreTexte(etiq) + '</dt><dd>' + rendreTexte(val) + '</dd>');
    ligne(t('valN'), String(n));
    ligne(t('valEps'), fmtAuto(eps));
    const nv = infos.norme.valeur;
    let texteNorme = fmtAuto(nv);
    if (infos.norme.exacte && s.texNorme) texteNorme = rendreMath(traduireTex(s.texNorme)) + (Number.isFinite(nv) ? ' = ' + fmtAuto(nv) : '');
    ligne('$\\normu{f_n - f}_A$', texteNorme + ' <span class="note">' + t(infos.norme.exacte ? 'normeExacte' : 'normeNumerique') + '</span>');
    const dans = Number.isFinite(nv) && nv < eps;
    ligne(t('valDansBande'), '<span class="' + (dans ? 'oui' : 'non') + '">' + t(dans ? 'ouiCar' : 'nonCar') + '</span>');
    // Rang N(ε)
    const r = rangN(s, eps);
    let texteRang;
    if (r.N !== null) texteRang = t(r.numerique ? 'rangTexteNum' : 'rangTexte', { N: r.N });
    else if (s.uniforme === false) texteRang = t('rangAucun');
    else if (r.inconnu) texteRang = t('rangInconnu', { N: r.inconnu });
    else texteRang = t('rangTropGrand', { N: r.tropGrand || 1e7 });
    ligne(t('valRang'), texteRang);
    // Écart maximal
    const sup = infos.sup;
    if (nv === Infinity || (sup && sup.valeur === Infinity)) ligne(t('valArgmax'), t('argmaxInfini'));
    else if (sup && Number.isFinite(sup.valeur) && Number.isFinite(sup.x)) ligne(t('valArgmax'), fmtAuto(sup.valeur) + ' <span class="note">' + t('argmaxTexte', { x: texNum(sup.x) }) + '</span>');
    // Point x_n
    if (s.xn && s.uniforme === false) {
      const x = s.xn(n), d = Math.abs(s.fn(x, n) - s.f(x));
      const hors = x < etat.vue.xmin || x > etat.vue.xmax;
      ligne(t('valXn') + (s.texXn ? ', $' + s.texXn + '$' : ''), t('xnTexte', { x: texNum(x), d: texNum(d) }) + (hors ? ' <span class="note">' + t('xnHorsFenetre') + '</span>' : ''));
    }
    el.valeurs.innerHTML = rows.join('');
  }

  function majVerdict(s) {
    if (s.perso) {
      el.verdict.innerHTML = '<span class="badge num">≈</span><span>' + rendreTexte(t('verdictNum')) + '</span>';
      const ns = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
      const cellules = ns.map((n) => '<td>' + fmtAuto(supEcart(s, n).valeur) + '</td>').join('');
      el.explication.innerHTML = '<p>' + rendreTexte(t('numTableau')) + '</p>'
        + '<div style="overflow-x:auto"><table class="tableau-num"><tr><th>' + rendreMath('n') + '</th>' + ns.map((n) => '<th>' + n + '</th>').join('') + '</tr>'
        + '<tr><th>' + rendreMath('\\normu{f_n - f}') + '</th>' + cellules + '</tr></table></div>'
        + '<p class="indice">' + rendreTexte(t('numNote')) + (s.limiteEstimee ? ' ' + rendreTexte(t('numLimiteEstimee')) : '') + '</p>';
      return;
    }
    const oui = s.uniforme === true;
    el.verdict.innerHTML = '<span class="badge ' + (oui ? 'oui' : 'non') + '">' + (oui ? t('oui') : t('non')).toUpperCase() + '</span><span>' + rendreTexte(oui ? '$f_n \\cvu f$ ' + (etat.langue === 'en' ? 'uniformly on' : 'uniformément sur') + ' $A = ' + s.texA + '$.' : '$f_n \\rra f$ ' + (etat.langue === 'en' ? 'pointwise on' : 'simplement sur') + ' $A = ' + s.texA + '$, ' + (etat.langue === 'en' ? 'but not uniformly.' : 'mais pas uniformément.')) + '</span>';
    const ex = s.explication ? (s.explication[etat.langue] || s.explication.fr) : '';
    el.explication.innerHTML = '<p>' + rendreTexte(ex) + '</p>';
  }

  function majCommandes() {
    const s = suiteCourante();
    const nmax = Math.max(s.nmax || 100, etat.n);
    el.curseurN.max = String(nmax);
    el.curseurN.value = String(etat.n); el.champN.value = String(etat.n);
    el.champN.max = String(s.nCap || 1e6);
    el.champEps.value = String(+etat.eps.toPrecision(4));
    el.curseurEps.value = String(clamp((Math.log10(etat.eps) + 3) / 3.7, 0, 1));
    el.optBande.checked = etat.bande; el.optMembres.checked = etat.membres; el.optXn.checked = etat.xn;
    el.optXn.parentElement.hidden = !(s.xn && s.uniforme === false);
    el.btnAnimer.textContent = etat.animation ? t('arreter') : t('animer');
  }

  /** Recalcule, met à jour les panneaux et redessine. */
  function maj(tout) {
    infosCourantes = calculer();
    const s = infosCourantes.s;
    if (tout) { majChips(); majFormules(s); majVerdict(s); }
    majCommandes();
    majValeurs(s, infosCourantes);
    demanderDessin();
  }

  // ===========================================================================
  //  Actions
  // ===========================================================================
  function choisirSuite(id, garderVue) {
    arreterAnimation();
    if (id !== 'perso' && !predef(id)) id = SUITES[0].id;
    etat.suite = id;
    suiteCache = null;
    if (id === 'perso') {
      el.exprFn.value = etat.perso.fnSrc; el.exprF.value = etat.perso.fSrc; el.champA.value = String(etat.perso.a); el.champB.value = String(etat.perso.b);
      compilerPerso(false);
    }
    const s = suiteCourante();
    if (!garderVue) {
      etat.n = s.n || etat.n; etat.eps = s.eps || etat.eps;
      etat.listeMembres = (s.membres || [1, 2, 5]).slice();
      el.champMembres.value = etat.listeMembres.join(', ');
    }
    if (s.nCap) etat.n = Math.min(etat.n, s.nCap);
    etat.vue = Object.assign({}, s.fenetre);
    maj(true);
    majAdresse();
  }

  function compilerPerso(rafraichir) {
    const p = etat.perso;
    p.fnSrc = el.exprFn.value; p.fSrc = el.exprF.value;
    p.a = parseFloat(el.champA.value); p.b = parseFloat(el.champB.value);
    p.erreur = '';
    try {
      p.fn = compilerExpression(p.fnSrc);
    } catch (e) { p.erreur = t('errFn', { x: e.message }); p.fn = null; }
    if (!p.erreur) {
      if (p.fSrc.trim()) {
        try { p.f = compilerExpression(p.fSrc); p.limiteEstimee = false; }
        catch (e) { p.erreur = t('errF', { x: e.message }); p.f = null; }
      } else { p.f = null; p.limiteEstimee = true; }
    }
    if (!p.erreur && !(Number.isFinite(p.a) && Number.isFinite(p.b) && p.a < p.b)) p.erreur = t('errIntervalle');
    el.erreurExpr.textContent = p.erreur; el.erreurExpr.hidden = !p.erreur;
    p.version = (p.version || 0) + 1;
    suiteCache = null;
    for (const k in cacheRang) if (k.startsWith('perso|')) delete cacheRang[k];
    if (rafraichir !== false && !p.erreur) { etat.vue = Object.assign({}, suiteCourante().fenetre); maj(true); }
  }

  function definirN(n2) {
    const s = suiteCourante();
    n2 = Math.round(n2);
    if (!Number.isFinite(n2)) return;
    etat.n = clamp(n2, 1, s.nCap || 1e6);
    maj(false);
    majAdresse();
  }
  function definirEps(e) {
    if (!Number.isFinite(e) || e <= 0) return;
    etat.eps = clamp(e, 1e-4, 100);
    maj(false);
    majAdresse();
  }
  function lireMembres() {
    const liste = el.champMembres.value.split(/[,; ]+/).map((v) => parseInt(v, 10)).filter((v) => Number.isFinite(v) && v >= 1);
    etat.listeMembres = Array.from(new Set(liste)).sort((p, q) => p - q).slice(0, 12);
    demanderDessin();
  }

  function basculerAnimation() {
    if (etat.animation) { arreterAnimation(); return; }
    const s = suiteCourante();
    const nmax = Math.max(+el.curseurN.max || 100, etat.n);
    if (etat.n >= nmax) etat.n = 1;
    el.btnAnimer.textContent = t('arreter');
    etat.animation = setInterval(() => {
      const pas = etat.n < 20 ? 1 : Math.ceil(etat.n / 12);
      let n2 = etat.n + pas;
      if (n2 >= nmax) { n2 = nmax; }
      etat.n = Math.min(n2, s.nCap || 1e6);
      maj(false);
      if (etat.n >= nmax) arreterAnimation();
    }, 160);
  }
  function arreterAnimation() {
    if (etat.animation) { clearInterval(etat.animation); etat.animation = null; }
    el.btnAnimer.textContent = t('animer');
  }

  function majAdresse() {
    try {
      const q = '?suite=' + encodeURIComponent(etat.suite) + '&n=' + etat.n + '&eps=' + (+etat.eps.toPrecision(4)) + (etat.langue === 'en' ? '&lang=en' : '') + (MODE_TEST ? '&test=1' : '');
      history.replaceState(null, '', location.pathname + q + location.hash);
    } catch (_) { /* file:// */ }
  }

  // ===========================================================================
  //  Interactions avec le graphe : survol, glisser (déplacer), molette (zoom)
  // ===========================================================================
  const posEvt = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const p = posEvt(e);
    etat.glisse = { x0: p.x, y0: p.y, vue: Object.assign({}, etat.vue), bouge: false };
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = posEvt(e);
    if (etat.glisse) {
      const dx = p.x - etat.glisse.x0, dy = p.y - etat.glisse.y0;
      if (Math.abs(dx) + Math.abs(dy) > 3) etat.glisse.bouge = true;
      if (etat.glisse.bouge) {
        const v0 = etat.glisse.vue;
        const ddx = dx / zone.w * (v0.xmax - v0.xmin), ddy = dy / zone.h * (v0.ymax - v0.ymin);
        etat.vue = { xmin: v0.xmin - ddx, xmax: v0.xmax - ddx, ymin: v0.ymin + ddy, ymax: v0.ymax + ddy };
        canvas.classList.add('deplace');
        infosCourantes = null;   // la partie visible de A change
        demanderDessin();
        return;
      }
    }
    etat.survol = (p.x >= zone.x && p.x <= zone.x + zone.w) ? wx(p.x) : null;
    demanderDessin();
  });
  const finGlisse = () => {
    if (etat.glisse) {
      const aBouge = etat.glisse.bouge;
      etat.glisse = null; canvas.classList.remove('deplace');
      if (aBouge) maj(false);
    }
  };
  canvas.addEventListener('pointerup', finGlisse);
  canvas.addEventListener('pointercancel', finGlisse);
  canvas.addEventListener('pointerleave', () => { etat.survol = null; demanderDessin(); });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = posEvt(e);
    const f = Math.pow(1.15, e.deltaY > 0 ? 1 : -1);
    const x = wx(p.x), y = wy(p.y), v = etat.vue;
    etat.vue = { xmin: x - (x - v.xmin) * f, xmax: x + (v.xmax - x) * f, ymin: y - (y - v.ymin) * f, ymax: y + (v.ymax - y) * f };
    maj(false);
  }, { passive: false });

  // ===========================================================================
  //  Commandes du panneau
  // ===========================================================================
  el.curseurN.addEventListener('input', () => { arreterAnimation(); definirN(+el.curseurN.value); });
  el.champN.addEventListener('change', () => { arreterAnimation(); definirN(+el.champN.value); });
  el.btnMoins.addEventListener('click', () => { arreterAnimation(); definirN(etat.n - 1); });
  el.btnPlus.addEventListener('click', () => { arreterAnimation(); definirN(etat.n + 1); });
  el.btnDoubler.addEventListener('click', () => { arreterAnimation(); definirN(etat.n * 2); });
  el.btnAnimer.addEventListener('click', basculerAnimation);
  el.curseurEps.addEventListener('input', () => definirEps(Math.pow(10, -3 + 3.7 * (+el.curseurEps.value))));
  el.champEps.addEventListener('change', () => definirEps(+el.champEps.value));
  el.optBande.addEventListener('change', () => { etat.bande = el.optBande.checked; demanderDessin(); });
  el.optMembres.addEventListener('change', () => { etat.membres = el.optMembres.checked; demanderDessin(); });
  el.optXn.addEventListener('change', () => { etat.xn = el.optXn.checked; demanderDessin(); });
  el.champMembres.addEventListener('change', lireMembres);
  el.champMembres.addEventListener('input', lireMembres);
  el.btnRecadrer.addEventListener('click', () => { recadrer(); maj(false); });
  el.btnPleinEcran.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.grapheSection.requestFullscreen) el.grapheSection.requestFullscreen();
  });
  document.addEventListener('fullscreenchange', () => setTimeout(redimensionner, 50));
  el.btnAppliquer.addEventListener('click', () => compilerPerso(true));
  [el.exprFn, el.exprF, el.champA, el.champB].forEach((c) => c.addEventListener('keydown', (e) => { if (e.key === 'Enter') compilerPerso(true); }));
  el.btnEn.addEventListener('click', () => { if (etat.langue !== 'en') changerLangue('en'); });
  el.btnFr.addEventListener('click', () => { if (etat.langue !== 'fr') changerLangue('fr'); });
  // Barre du site : sur petit écran, l'icône ☰ déroule les onglets (myFunction() du site).
  el.btnBarre.addEventListener('click', () => el.topnav.classList.toggle('responsive'));
  el.btnAide.addEventListener('click', () => { el.aide.hidden = false; el.aideFermer.focus(); });
  el.aideFermer.addEventListener('click', () => { el.aide.hidden = true; });
  el.aide.addEventListener('click', (e) => { if (e.target === el.aide) el.aide.hidden = true; });

  document.addEventListener('keydown', (e) => {
    const cible = e.target;
    if (cible && (cible.tagName === 'INPUT' || cible.tagName === 'TEXTAREA' || cible.tagName === 'SELECT')) return;
    if (e.key === 'Escape') { el.aide.hidden = true; return; }
    if (e.key === '?') { el.aide.hidden = !el.aide.hidden; return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowUp': case '+': arreterAnimation(); definirN(etat.n + 1); break;
      case 'ArrowDown': case '-': arreterAnimation(); definirN(etat.n - 1); break;
      case 'PageUp': arreterAnimation(); definirN(etat.n * 2); break;
      case 'PageDown': arreterAnimation(); definirN(Math.max(1, Math.floor(etat.n / 2))); break;
      case 'ArrowRight': definirEps(etat.eps * 1.25); break;
      case 'ArrowLeft': definirEps(etat.eps / 1.25); break;
      case 'd': case 'D': arreterAnimation(); definirN(etat.n * 2); break;
      case 'a': case 'A': basculerAnimation(); break;
      case 'b': case 'B': etat.bande = !etat.bande; el.optBande.checked = etat.bande; demanderDessin(); break;
      case 'm': case 'M': etat.membres = !etat.membres; el.optMembres.checked = etat.membres; demanderDessin(); break;
      case 'f': case 'F': recadrer(); maj(false); break;
      default: return;
    }
    e.preventDefault();
  });

  // ===========================================================================
  //  Tests (index.html?test=1)
  // ===========================================================================
  function lancerTests() {
    const res = [];
    const ok = (nom, cond) => res.push((cond ? 'OK   ' : 'ÉCHEC') + ' ' + nom);
    const proche = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-9);
    try {
      ok('analyseur : x^n (0,5 ; 2)', proche(compilerExpression('x^n')(0.5, 2), 0.25));
      ok('analyseur : nx/(1+n^2x^2) (1 ; 1)', proche(compilerExpression('nx/(1+n^2x^2)')(1, 1), 0.5));
      ok('analyseur : n x e^(-n x) (1 ; 2)', proche(compilerExpression('n x e^(-n x)')(1, 2), 2 * Math.exp(-2)));
      ok('analyseur : min(1/x, n) (0,1 ; 5)', proche(compilerExpression('min(1/x, n)')(0.1, 5), 5));
      ok('analyseur : sqrt(x^2 + 1/n) (0 ; 4)', proche(compilerExpression('sqrt(x^2+1/n)')(0, 4), 0.5));
      let err = false; try { compilerExpression('x +'); } catch (_) { err = true; } ok('analyseur : erreur signalée', err);
      ok('dilog(1) = π²/6', proche(dilog(1), PI2 / 6));
      ok('dilog(−1) = −π²/12', proche(dilog(-1), -PI2 / 12));
      ok('dilog(0,5) = π²/12 − (ln 2)²/2', proche(dilog(0.5), PI2 / 12 - Math.log(2) * Math.log(2) / 2, 1e-12));
      ok('dilog(−0,8) ≈ série', proche(dilog(-0.8), sommeDilog(-0.8, 4000), 1e-9));
      ok('reste de Bâle : n = 10', proche(resteBale(10), PI2 / 6 - 1.5497677311665408, 1e-12));
      // Normes exactes contre le calcul numérique (fenêtre = la fenêtre par défaut de la suite)
      [['x-sur-n', 10, 1e-6], ['bosse-ecrasee', 20, 1e-6], ['puissances', 30, 0.03], ['racines', 10, 1e-6], ['P1a', 30, 1e-6], ['P1b', 20, 0.03], ['P1b-a', 20, 1e-6], ['P1d', 20, 0.03], ['P2', 20, 1e-6], ['P4', 30, 1e-5], ['serie-k2', 5, 1e-6], ['D3a', 4, 1e-9], ['bosse-glissante', 20, 1e-6]].forEach(([id, n, tol]) => {
        const s = Object.assign({ perso: false }, predef(id));
        const num = supEcart(s, n, s.fenetre).valeur, ex = s.norme(n);
        ok('norme ' + id + ' (n = ' + n + ') : numérique ' + num.toPrecision(6) + ' vs exacte ' + ex.toPrecision(6), proche(num, ex, tol));
      });
      ['x-sur-n-R', 'P4c', 'T2', 'D3b'].forEach((id) => {
        const s = Object.assign({ perso: false }, predef(id));
        const num = supEcart(s, 5, s.fenetre).valeur;
        ok('norme ' + id + ' : infinie, numérique sur la fenêtre = ' + (Number.isFinite(num) ? num.toPrecision(4) : num), true);
      });
      ok('rang N(ε) pour x/n sur [0,1], ε = 0,1 : ' + rangN(Object.assign({ perso: false }, predef('x-sur-n')), 0.1).N, rangN(Object.assign({ perso: false }, predef('x-sur-n')), 0.1).N === 11);
      ok('rang N(ε) pour √(x²+1/n), ε = 0,1 : ' + rangN(Object.assign({ perso: false }, predef('racines')), 0.1).N, rangN(Object.assign({ perso: false }, predef('racines')), 0.1).N === 101);
      ok('rang N(ε) pour x^n sur [0,1] : aucun', rangN(Object.assign({ perso: false }, predef('puissances')), 0.1).N === null);
      ok('fmt français', (() => { const l = etat.langue; etat.langue = 'fr'; const s = fmt(-1.5, 2); etat.langue = l; return s === '−1,50'; })());
      ok('fmt anglais', (() => { const l = etat.langue; etat.langue = 'en'; const s = fmt(2.25, 1); etat.langue = l; return s === '2.3' || s === '2.2'; })());
      ok('t() anglais', (() => { const l = etat.langue; etat.langue = 'en'; const m = t('rangTexte', { N: 7 }); etat.langue = l; return m === '$N(\\eps) = 7$: for $n \\ge 7$, $\\normu{f_n - f}_A < \\eps$'; })());
      ok('toutes les suites ont fr/en', SUITES.every((s) => s.explication && s.explication.fr && s.explication.en && s.source.fr && s.source.en));
      ok('KaTeX rend les formules des suites', SUITES.every((s) => !/katex-error/.test(rendreMath(s.texFn) + rendreMath(s.texF) + rendreMath(s.texA) + (s.texNorme ? rendreMath(s.texNorme) : '') + (s.texXn ? rendreMath(s.texXn) : ''))));
      ok('KaTeX rend les explications', SUITES.every((s) => !/katex-error/.test(rendreTexte(s.explication.fr) + rendreTexte(s.explication.en))));
    } catch (e) { res.push('ERREUR pendant les tests : ' + e.message); }
    const pre = document.getElementById('tests') || document.body.appendChild(Object.assign(document.createElement('pre'), { id: 'tests' }));
    pre.textContent = res.join('\n') + '\n' + res.filter((r) => r.startsWith('OK')).length + '/' + res.length + ' OK';
    // Copie du canevas dans une image (capture d'écran headless avant requestAnimationFrame)
    setTimeout(() => {
      try {
        dessiner();
        const img = document.createElement('img'); img.id = 'copie-canevas'; img.src = canvas.toDataURL('image/png');
        img.style.cssText = 'position:fixed;right:8px;bottom:8px;width:360px;border:1px solid #999;z-index:2000;background:#fff';
        document.body.appendChild(img);
      } catch (_) { /* ignore */ }
    }, 300);
  }

  // ===========================================================================
  //  Démarrage
  // ===========================================================================
  function demarrer() {
    capturerFrancais();
    const q = location.search;
    const mSuite = /[?&]suite=([^&]+)/.exec(q), mN = /[?&]n=(\d+)/.exec(q), mEps = /[?&]eps=([0-9.eE+-]+)/.exec(q), mLang = /[?&]lang=(fr|en)\b/.exec(q);
    etat.langue = mLang ? mLang[1] : 'fr';
    appliquerLangue(etat.langue, false);
    const id = mSuite ? decodeURIComponent(mSuite[1]) : SUITES[0].id;
    choisirSuite(id);
    if (mN) definirN(+mN[1]);
    if (mEps) definirEps(parseFloat(mEps[1]));
    redimensionner();
    if (window.ResizeObserver) new ResizeObserver(redimensionner).observe(canvas.parentElement);
    else window.addEventListener('resize', redimensionner);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(demanderDessin);
    if (MODE_TEST) setTimeout(lancerTests, 50);
  }

  window.ConvApp = { etat, SUITES, choisirSuite, definirN, definirEps, changerLangue, supEcart, rangN, compilerExpression, dilog, maj };
  demarrer();
})();
