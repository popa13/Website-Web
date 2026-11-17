/* =============================================================================
   Tests de convergence — application interactive (UQTR, MPU1054)
   Application autonome (HTML/CSS/JS) : il suffit d'ouvrir index.html.
   Calculs : serie-core.js (analyse du terme général, valeurs exactes) et
   tests-core.js (termes en logarithme, limites, rangs, sommes des aires).
   KaTeX (vendor/katex) écrit les formules.

   L'idée : pour une série à termes positifs, x_n est l'aire d'un rectangle de
   largeur 1. Chaque test compare l'aire à partir d'un rang N à celle d'une
   série connue : y_n (comparaison), r y_n (comparaison par limite), une série
   géométrique (racine, quotient).

   Paramètres d'adresse : ?lang=fr|en
                          ?t=comparaison|limite|racine|quotient
                          ?x=<terme général> &y=<série de comparaison>
                          ?N=<rang> &eps=<ε> &r1=<r1>
                          ?embed=1 (dans une page de mathopo.ca)  ?test=1 (tests)
   ============================================================================= */
'use strict';

(function () {
  const S = window.SerieNoyau;
  const T = window.TestsNoyau;
  const MODE_TEST = /[?&]test=1\b/.test(location.search);
  const INTEGRE = document.documentElement.classList.contains('integre');   // dans une page de mathopo.ca
  if (MODE_TEST) {
    window.addEventListener('error', (e) => {
      const pre = document.getElementById('tests') || document.body.appendChild(Object.assign(document.createElement('pre'), { id: 'tests' }));
      pre.textContent += '\nERREUR : ' + e.message + ' (ligne ' + e.lineno + ')';
    });
  }

  // ===========================================================================
  //  Constantes
  // ===========================================================================
  const NS = 'http://www.w3.org/2000/svg';
  const REDUIT = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const etroit = () => !!(window.matchMedia && window.matchMedia('(max-width: 560px)').matches);
  const MODES = ['comparaison', 'limite', 'racine', 'quotient'];
  const AVEC_Y = { comparaison: true, limite: true, racine: false, quotient: false };
  const X_DEFAUT = '1/(n^2+n)', Y_DEFAUT = '1/n^2';
  const MARGE = { g: 52, d: 16, h: 38, b: 26 };     // marges des deux graphes (mêmes abscisses)
  const LARGEUR_MAX_VUE = 4000;                      // termes visibles au plus
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const $ = (id) => document.getElementById(id);

  // Exemples : les notes de cours (sections 3.1 et 3.3) et l'exercice P1 de la section 3.3
  const EXEMPLES = [
    { mode: 'comparaison', x: '1/(n^2+n)', y: '1/n^2', tex: '\\tfrac{1}{n^2+n} \\le \\tfrac{1}{n^2}', src: 'notes31' },
    { mode: 'comparaison', x: '(n^2 (n+1))^(-1/2)', y: 'n^(-3/2)', tex: '\\tfrac{1}{\\sqrt{n^2(n+1)}} \\le \\tfrac{1}{n^{3/2}}', src: 'P1c' },
    { mode: 'comparaison', x: 'n!/n^n', y: '2/n^2', tex: '\\tfrac{n!}{n^n} \\le \\tfrac{2}{n^2}', src: 'P1d' },
    { mode: 'comparaison', x: '1/sqrt(n)', y: '1/n', tex: '\\tfrac{1}{n} \\le \\tfrac{1}{\\sqrt{n}}', src: '' },
    { mode: 'comparaison', x: '(2+sin n)/n^2', y: '3/n^2', tex: '\\tfrac{2+\\sin n}{n^2} \\le \\tfrac{3}{n^2}', src: '' },
    { mode: 'comparaison', x: '1/(n log n)', y: '1/n', tex: '\\tfrac{1}{n \\log n} \\le \\tfrac{1}{n}', src: 'piege' },
    { mode: 'limite', x: '1/(n^2-n+1)', y: '1/n^2', tex: '\\tfrac{1}{n^2-n+1},\\ \\tfrac{1}{n^2}', src: 'notes31' },
    { mode: 'limite', x: 'n/(n^3+1)', y: '1/n^2', tex: '\\tfrac{n}{n^3+1},\\ \\tfrac{1}{n^2}', src: 'notes33' },
    { mode: 'limite', x: 'n/((n+1)(n+2))', y: '1/n', tex: '\\tfrac{n}{(n+1)(n+2)},\\ \\tfrac{1}{n}', src: 'P1a' },
    { mode: 'limite', x: '(log n) e^(-sqrt n)', y: '1/n^2', tex: '(\\log n)\\, e^{-\\sqrt{n}},\\ \\tfrac{1}{n^2}', src: 'P1g' },
    { mode: 'limite', x: '1/(n log n)', y: '1/n', tex: '\\tfrac{1}{n \\log n},\\ \\tfrac{1}{n}', src: 'P1f' },
    { mode: 'limite', x: '1/sqrt(n+1)', y: '1/sqrt(n)', tex: '\\tfrac{1}{\\sqrt{n+1}},\\ \\tfrac{1}{\\sqrt{n}}', src: 'P2d31' },
    { mode: 'racine', x: '(n/(2n+1))^n', tex: '\\left(\\tfrac{n}{2n+1}\\right)^{n}', src: 'notes33' },
    { mode: 'racine', x: '(log n)^(-n)', tex: '(\\log n)^{-n}', src: 'P1e' },
    { mode: 'racine', x: 'n^3/2^n', tex: '\\tfrac{n^3}{2^n}', src: '' },
    { mode: 'racine', x: '2^n/n^3', tex: '\\tfrac{2^n}{n^3}', src: '' },
    { mode: 'racine', x: '1/n^2', tex: '\\tfrac{1}{n^2}', src: 'notes33' },
    { mode: 'quotient', x: '2^n/n!', tex: '\\tfrac{2^n}{n!}', src: 'notes33' },
    { mode: 'quotient', x: 'n/2^n', tex: '\\tfrac{n}{2^n}', src: 'P1b' },
    { mode: 'quotient', x: 'n!/n^n', tex: '\\tfrac{n!}{n^n}', src: 'P1d' },
    { mode: 'quotient', x: 'n! e^(-n)', tex: 'n!\\, e^{-n}', src: 'P1h' },
    { mode: 'quotient', x: '(n!)^2/(2n)!', tex: '\\tfrac{(n!)^2}{(2n)!}', src: '' },
    { mode: 'quotient', x: '1/n^2', tex: '\\tfrac{1}{n^2}', src: 'notes33' },
  ];

  // ===========================================================================
  //  Langue (fr par défaut ; ?lang=en ou bouton EN/FR)
  //  Le français est le texte du HTML (capturé au démarrage) ; l'anglais est
  //  donné ici avec les mêmes clés. MSG : les chaînes produites par le code.
  // ===========================================================================
  const TRAD = {
    fr: {},
    en: {
      titre: 'Convergence tests',
      sousTitre: 'Series of positive terms: each term is the area of a rectangle, and each test compares areas.',
      btnAide: '?&nbsp;Help', 'title:btnAide': 'Help (key ?)',
      btnPanneau: 'Panel', 'title:btnPanneau': 'Show or hide the panel (key P)',
      btnPleinEcran: '⛶<span class="libelle">&nbsp;Full screen</span>', 'title:btnPleinEcran': 'Full screen',
      'aria:zoneGraphe': 'Graphs of the test', 'aria:onglets': 'The test',
      nomComparaison: 'Comparison', nomLimite: 'Limit comparison', nomRacine: 'Root', nomQuotient: 'Ratio',
      'title:ongletComparaison': 'Comparison test (key 1)', 'title:ongletLimite': 'Limit comparison test (key 2)',
      'title:ongletRacine': 'Root test (key 3)', 'title:ongletQuotient': 'Ratio test (key 4)',
      'aria:grapheAires': 'The terms of the series, drawn as rectangles of width 1',
      'aria:grapheSuite': 'The sequence of the test',
      'title:btnAdditionner': 'Add up the areas one by one (Space)', additionner: 'Add up the areas',
      'title:btnZoomMoins': 'See more terms (mouse wheel)', 'title:btnZoomPlus': 'See fewer terms (mouse wheel)',
      btnRecadrer: 'Reset view', 'title:btnRecadrer': 'Back to the initial view (double-click, key F)',
      btnQueue: '⇥&nbsp;The tail', 'title:btnQueue': 'Follow the tail of the series: the terms from N on, enlarged',
      echelleLog: 'Log scale', 'title:btnLog': 'Logarithmic scale for the terms (key L)',
      btnLien: '🔗&nbsp;Copy link', 'title:btnLien': 'Copy the address of this configuration',
      carteSeries: 'The series', exemplesTete: 'Examples', 'aria:exemples': 'Examples',
      carteRaisonnement: 'The reasoning',
      pied: 'Convergence tests · UQTR · P.-O. Parisé · 2026',
      btnFermer: 'Close',
      aide: `
    <h2>Convergence tests</h2>
    <p>For a series of positive terms <span class="m">\\(\\sum x_n\\)</span>, each term <span class="m">\\(x_n\\)</span> is the <b>area of a rectangle</b> of width 1 and height <span class="m">\\(x_n\\)</span>. The partial sums increase: the series converges if and only if the total area is finite. The first terms do not matter; only the <b>tail</b> counts, the area from some rank <span class="m">\\(N\\)</span> on. The four tests rest on the same idea: <b>compare this area with that of a series whose nature is known</b>.</p>
    <ul>
      <li><b>Comparison:</b> if <span class="m">\\(0 \\le x_n \\le y_n\\)</span> for <span class="m">\\(n \\ge N\\)</span>, the gold rectangles lie inside the green ones. If the green area is finite, so is the gold area; if the gold area is infinite, so is the green area.</li>
      <li><b>Limit comparison:</b> if <span class="m">\\(\\frac{x_n}{y_n} \\to r > 0\\)</span>, then <span class="m">\\(\\frac{r}{2} y_n < x_n < \\frac{3r}{2} y_n\\)</span> from some rank <span class="m">\\(N\\)</span> on: the gold rectangles stay in a tube around <span class="m">\\(r\\,y_n\\)</span>, and both areas are finite, or infinite, together. If <span class="m">\\(r = 0\\)</span>, only the upper bound remains.</li>
      <li><b>Root (Cauchy):</b> if <span class="m">\\(x_n^{1/n} \\to r < 1\\)</span>, choose <span class="m">\\(r_1\\)</span> between <span class="m">\\(r\\)</span> and 1; from some rank <span class="m">\\(K\\)</span> on, <span class="m">\\(x_n \\le r_1^{\\,n}\\)</span>: the rectangles lie under those of a geometric series. If <span class="m">\\(r > 1\\)</span>, <span class="m">\\(x_n \\ge 1\\)</span> from some rank on: the area is infinite.</li>
      <li><b>Ratio (d’Alembert; the course notes call it the quotient test):</b> if <span class="m">\\(\\frac{x_{n+1}}{x_n} \\to r < 1\\)</span>, with <span class="m">\\(r < r_1 < 1\\)</span>, we get <span class="m">\\(x_n \\le x_K\\, r_1^{\\,n-K}\\)</span> for <span class="m">\\(n \\ge K\\)</span>: a geometric series again. If <span class="m">\\(r > 1\\)</span>, <span class="m">\\(x_n \\ge x_K > 0\\)</span> from some rank on.</li>
      <li>If <span class="m">\\(r = 1\\)</span>, the root and ratio tests are inconclusive: <span class="m">\\(\\sum \\frac{1}{n}\\)</span> diverges, <span class="m">\\(\\sum \\frac{1}{n^2}\\)</span> converges, and both give <span class="m">\\(r = 1\\)</span>.</li>
    </ul>
    <h3>The graphs</h3>
    <ul>
      <li><b>Top:</b> the rectangles of <span class="m">\\(x_n\\)</span> (gold) and those of the comparison series (green). The vertical line marks the rank <span class="m">\\(N\\)</span> (or <span class="m">\\(K\\)</span>): drag it, or click a rectangle. What sticks out is red.</li>
      <li><b>Middle:</b> the sequence that decides the test (<span class="m">\\(\\frac{x_n}{y_n}\\)</span>, <span class="m">\\(x_n^{1/n}\\)</span> or <span class="m">\\(\\frac{x_{n+1}}{x_n}\\)</span>), with its limit <span class="m">\\(r\\)</span>. Drag the gold line <span class="m">\\(r_1\\)</span>, or the edge of the band.</li>
      <li><b>Bottom:</b> the areas from <span class="m">\\(N\\)</span> on. “Add up the areas” adds the rectangles one by one, then faster and faster: both areas stay finite, or become infinite, together.</li>
      <li><b>Navigation:</b> wheel = zoom, drag = move, double-click or <kbd>F</kbd> = reset view, “The tail” = the terms from <span class="m">\\(N\\)</span> on, enlarged. <kbd>1</kbd> to <kbd>4</kbd>: the test · <kbd>←</kbd> <kbd>→</kbd>: the rank · <kbd>↑</kbd> <kbd>↓</kbd>: <span class="m">\\(r_1\\)</span> or <span class="m">\\(\\varepsilon\\)</span> · <kbd>L</kbd>: logarithmic scale · <kbd>Space</kbd>: add up.</li>
    </ul>
    <h3>Typing the general term</h3>
    <p>In terms of <span class="m">\\(n\\)</span>: <code>+ - * / ^</code>, parentheses, <code>sqrt</code>, <code>log</code> (natural logarithm, as in the notes; also <code>ln</code>), <code>exp</code> or <code>e^</code>, <code>sin</code>, <code>cos</code>, <code>arctan</code>, <code>n!</code>, <code>pi</code>. Products can be implicit and the parentheses of <code>log n</code> are optional: <code>2n</code>, <code>n(n+1)</code>, <code>(log n)^(-n)</code>, <code>n! e^(-n)</code>. The series starts at the first <span class="m">\\(n \\ge 1\\)</span> where the term is defined (<span class="m">\\(n = 2\\)</span> for <code>1/(n log n)</code>). If some terms are negative, the application studies <span class="m">\\(\\sum |x_n|\\)</span> (absolute convergence, Sections 3.2 and 3.3).</p>
    <p class="indice">The limits <span class="m">\\(r\\)</span> and the ranks <span class="m">\\(N\\)</span>, <span class="m">\\(K\\)</span> are computed numerically: the terms are evaluated up to <span class="m">\\(n \\approx 10^7\\)</span>, as logarithms, which makes it possible to follow <span class="m">\\(n!/n^n\\)</span> or <span class="m">\\(2^n/n!\\)</span> far beyond <span class="m">\\(n = 1000\\)</span>. A recognized value (a fraction, <span class="m">\\(e\\)</span>, <span class="m">\\(1/e\\)</span>…) is shown exactly. The nature of the usual comparison series (<span class="m">\\(p\\)</span>-series, geometric series) is recognized from the general term.</p>`,
    },
  };

  const MSG = {
    fr: {
      titrePage: 'Tests de convergence — UQTR',
      btnLangue: 'EN', btnLangueTitre: 'English version',
      titreTest: { comparaison: 'Test de comparaison', limite: 'Test de comparaison par limite', racine: 'Test de la racine', quotient: 'Test du quotient' },
      sources: { notes31: 'notes 3.1', notes33: 'notes 3.3', P1a: 'P1 (a)', P1b: 'P1 (b)', P1c: 'P1 (c)', P1d: 'P1 (d)', P1e: 'P1 (e)', P1f: 'P1 (f)', P1g: 'P1 (g)', P1h: 'P1 (h)', P2d31: '3.1 P2 (d)', piege: 'piège' },
      sourceTitre: 'Exercice {e} de la section 3.3',
      titreAires: 'Les termes : rectangles de largeur 1, d’aire',
      titreAiresLog: 'Les termes, en échelle logarithmique (les aires ne sont plus à l’échelle)',
      titreSuite: 'La suite du test',
      legX: 'série étudiée', legY: 'série de comparaison', legTube: 'tube', legGeo: 'série géométrique', legMin: 'minorante', legRouge: 'dépasse',
      rang: { N: 'N', K: 'K' },
      auDela: 'au-delà de',
      ajouteJusqu: 'jusqu’à',
      jaugesTitre: 'Les aires à partir de {r}',
      jaugesVide: 'Les aires : le test ne fournit pas de série de comparaison.',
      inconnue: '?',
      partielle: 'somme numérique, sans conclusion',
      infini: '+∞',
      noteGeo: 'La série de comparaison est la série géométrique fournie par le test.',
      noteNeg: 'Des termes sont négatifs : on étudie {s} (convergence absolue, sections 3.2 et 3.3).',
      noteDebut: 'Le terme n’est pas défini pour n = 1 : la série commence à n = {n}.',
      natures: {
        p: 'p-série, {p} : {nat}', geo: 'série géométrique de raison {r} : {nat}', npgeo: '{f} : {nat} (test de la racine)',
        pequiv: 'se comporte comme {f} : {nat}', pplus: 'plus grande que {f} à partir d’un rang : diverge',
        pnum: 'décroît environ comme {f} : {nat}', quotient: 'test du quotient, r ≈ {r} : {nat}', racine: 'test de la racine, r ≈ {r} : {nat}',
        grossiere: 'le terme général ne tend pas vers 0 : diverge', inconnue: 'nature non reconnue',
        conv: 'converge', div: 'diverge', numerique: '(estimation numérique)',
      },
      lienCopie: '✓&nbsp;Lien copié', lienEchec: 'Copiez l’adresse de la barre du navigateur.',
      arreter: '⏸&nbsp;Arrêter',
      erreurs: {
        vide: 'Tapez le terme général, en fonction de <i>n</i>.',
        caractere: 'Caractère non reconnu : <code>{texte}</code>.',
        fin: 'L’expression est incomplète.',
        parenthese: 'Il manque une parenthèse fermante <code>)</code>.',
        barre: 'Il manque une barre fermante <code>|</code>.',
        inattendu: '<code>{texte}</code> est inattendu ici.',
        fonctionParenthese: 'Mettez l’argument de <code>{texte}</code> entre parenthèses : <code>{texte}(n)</code>.',
        variable: 'La variable est <i>n</i> : remplacez <code>{texte}</code> par <code>n</code>.',
        inconnu: 'Nom inconnu : <code>{texte}</code>.',
        indefini: 'Le terme n’est défini pour aucun des premiers <i>n</i> (division par zéro ou valeur hors domaine).',
        taille: 'Les nombres deviennent trop grands.',
        nul: 'Tous les termes sont nuls.',
        interne: 'Expression non reconnue.',
      },
      verifie: 'vérifié pour n\u00a0≤\u00a065\u202f536, puis par sondage jusqu’à\u00a010⁷',
    },
    en: {
      titrePage: 'Convergence tests — UQTR',
      btnLangue: 'FR', btnLangueTitre: 'Version française',
      titreTest: { comparaison: 'Comparison test', limite: 'Limit comparison test', racine: 'Root test', quotient: 'Ratio test' },
      sources: { notes31: 'notes 3.1', notes33: 'notes 3.3', P1a: 'P1 (a)', P1b: 'P1 (b)', P1c: 'P1 (c)', P1d: 'P1 (d)', P1e: 'P1 (e)', P1f: 'P1 (f)', P1g: 'P1 (g)', P1h: 'P1 (h)', P2d31: '3.1 P2 (d)', piege: 'trap' },
      sourceTitre: 'Exercise {e} of Section 3.3',
      titreAires: 'The terms: rectangles of width 1 and area',
      titreAiresLog: 'The terms, on a logarithmic scale (the areas are no longer to scale)',
      titreSuite: 'The sequence of the test',
      legX: 'series studied', legY: 'comparison series', legTube: 'tube', legGeo: 'geometric series', legMin: 'lower bound', legRouge: 'sticks out',
      rang: { N: 'N', K: 'K' },
      auDela: 'beyond',
      ajouteJusqu: 'up to',
      jaugesTitre: 'The areas from {r} on',
      jaugesVide: 'The areas: the test provides no comparison series.',
      inconnue: '?',
      partielle: 'numerical sum, no conclusion',
      infini: '+∞',
      noteGeo: 'The comparison series is the geometric series provided by the test.',
      noteNeg: 'Some terms are negative: the application studies {s} (absolute convergence, Sections 3.2 and 3.3).',
      noteDebut: 'The term is not defined for n = 1: the series starts at n = {n}.',
      natures: {
        p: 'p-series, {p}: {nat}', geo: 'geometric series of ratio {r}: {nat}', npgeo: '{f}: {nat} (root test)',
        pequiv: 'behaves like {f}: {nat}', pplus: 'larger than {f} from some rank on: diverges',
        pnum: 'decreases roughly like {f}: {nat}', quotient: 'ratio test, r ≈ {r}: {nat}', racine: 'root test, r ≈ {r}: {nat}',
        grossiere: 'the general term does not tend to 0: diverges', inconnue: 'nature not recognized',
        conv: 'converges', div: 'diverges', numerique: '(numerical estimate)',
      },
      lienCopie: '✓&nbsp;Link copied', lienEchec: 'Copy the address from the browser bar.',
      arreter: '⏸&nbsp;Stop',
      erreurs: {
        vide: 'Type the general term, in terms of <i>n</i>.',
        caractere: 'Unrecognized character: <code>{texte}</code>.',
        fin: 'The expression is incomplete.',
        parenthese: 'A closing parenthesis <code>)</code> is missing.',
        barre: 'A closing bar <code>|</code> is missing.',
        inattendu: '<code>{texte}</code> is unexpected here.',
        fonctionParenthese: 'Put the argument of <code>{texte}</code> in parentheses: <code>{texte}(n)</code>.',
        variable: 'The variable is <i>n</i>: replace <code>{texte}</code> by <code>n</code>.',
        inconnu: 'Unknown name: <code>{texte}</code>.',
        indefini: 'The term is not defined for any of the first values of <i>n</i> (division by zero or value out of the domain).',
        taille: 'The numbers become too large.',
        nul: 'All the terms are zero.',
        interne: 'Unrecognized expression.',
      },
      verifie: 'checked for n\u00a0≤\u00a065,536, then by sampling up to\u00a010⁷',
    },
  };

  // ===========================================================================
  //  État
  // ===========================================================================
  const el = {
    zone: document.querySelector('.zone-graphe'),
    onglets: Array.from(document.querySelectorAll('.onglet')),
    aires: $('graphe-aires'), consAires: $('conteneur-aires'), etiqAires: $('etiq-aires'),
    titreAires: $('titre-aires'), legende: $('legende-aires'),
    suite: $('graphe-suite'), consSuite: $('conteneur-suite'), etiqSuite: $('etiq-suite'), titreSuite: $('titre-suite'),
    jauges: $('jauges'), jaugesTitre: $('jauges-titre'), jaugesLignes: $('jauges-lignes'), btnAdditionner: $('btn-additionner'),
    btnZoomMoins: $('btn-zoom-moins'), btnZoomPlus: $('btn-zoom-plus'), btnRecadrer: $('btn-recadrer'), btnQueue: $('btn-queue'),
    caseLog: $('case-log'), btnLien: $('btn-lien'), bulle: $('bulle'),
    champX: $('champ-x'), apercuX: $('apercu-x'), erreurX: $('erreur-x'),
    blocY: $('bloc-y'), champY: $('champ-y'), apercuY: $('apercu-y'), erreurY: $('erreur-y'),
    noteGeo: $('note-geo'), noteSeries: $('note-series'), exemples: $('exemples'),
    titreTest: $('titre-test'), enonce: $('enonce'), statut: $('statut'),
    paramN: $('param-n'), curseurN: $('curseur-n'), valN: $('val-n'), libelleN: $('libelle-n'),
    paramEps: $('param-eps'), curseurEps: $('curseur-eps'), valEps: $('val-eps'), libelleEps: $('libelle-eps'),
    paramR1: $('param-r1'), curseurR1: $('curseur-r1'), valR1: $('val-r1'),
    etapes: $('etapes'), verdict: $('verdict'), infoNature: $('info-nature'),
    btnAide: $('btn-aide'), btnPanneau: $('btn-panneau'), btnPleinEcran: $('btn-plein-ecran'), btnLangue: $('btn-langue'),
    aide: $('aide'), btnFermerAide: $('btn-fermer-aide'), annonce: $('annonce'),
  };

  const etat = {
    langue: 'fr',
    mode: 'comparaison',
    srcX: X_DEFAUT, srcY: Y_DEFAUT,
    X: null, Y: null, TX: null, TY: null, n0: 1,
    base: null, res: null,
    N: null, eps: null, r1: null,              // choix de l'utilisateur (null : automatique)
    vue: { a: 0.4, b: 20.4 }, vueAuto: true,
    log: false,
    survol: null,                               // n survolé
    glisse: null,                               // { type: 'rang' | 'r1' | 'eps' | 'pan', … }
    addition: null,                             // { M, … } pendant l'animation
    nouveau: true,                              // faire pousser les rectangles au prochain dessin
    accent: null,                               // élément mis en valeur par une étape du raisonnement
    tailles: { aires: { W: 800, H: 300 }, suite: { W: 800, H: 180 } },
    exempleActif: null,
  };

  // ===========================================================================
  //  Traductions et formats
  // ===========================================================================
  function t(cle, params) {
    let s = MSG[etat.langue][cle];
    if (s === undefined) s = MSG.fr[cle];
    if (s === undefined) return cle;
    if (params && typeof s === 'string') for (const k in params) s = s.split('{' + k + '}').join(String(params[k]));
    return s;
  }
  function remplir(s, params) {
    for (const k in params) s = s.split('{' + k + '}').join(String(params[k]));
    return s;
  }
  function tErreur(code, details) {
    const d = details || {};
    let s = (MSG[etat.langue].erreurs[code] || MSG.fr.erreurs[code] || MSG[etat.langue].erreurs.interne);
    for (const k in d) s = s.split('{' + k + '}').join(echapper(String(d[k])));
    return s;
  }
  function echapper(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  const fr = () => etat.langue === 'fr';
  const ET = (fr_, en_) => (fr() ? fr_ : en_);
  const DP = () => (fr() ? '\u00a0: ' : ': ');

  // Nombre décimal : virgule en français, vrai signe moins
  function fmt(v, ch) {
    if (v === Infinity) return '+∞';
    if (!Number.isFinite(v)) return '—';
    const chiffres = ch === undefined ? 4 : ch;
    const a = Math.abs(v);
    let s;
    if (a !== 0 && (a < 1e-4 || a >= 1e7)) {
      const [m, e] = v.toExponential(2).split('e');
      s = m + ' × 10' + exposantTexte(Number(e));
    } else s = v.toFixed(chiffres);
    if (fr()) s = s.replace('.', ',');
    return s.replace(/^-/, '−');
  }
  function exposantTexte(e) {
    const sup = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
    return String(e).split('').map((c) => sup[c] || c).join('');
  }
  // Même chose, en LaTeX
  function fmtTex(v, ch) {
    if (v === Infinity) return '+\\infty';
    if (!Number.isFinite(v)) return '\\text{—}';
    const a = Math.abs(v);
    const chiffres = ch === undefined ? 4 : ch;
    let s;
    if (a !== 0 && (a < 1e-4 || a >= 1e7)) {
      const [m, e] = v.toExponential(2).split('e');
      s = m + ' \\cdot 10^{' + Number(e) + '}';
    } else s = v.toFixed(chiffres);
    if (fr()) s = s.replace('.', '{,}');
    return s;
  }
  // Valeur courte (significative) : 0,75 ; 0,3679 ; 1,2 · 10⁻⁵
  function fmtCourt(v, sig) {
    if (v === Infinity) return '+\\infty';
    if (!Number.isFinite(v)) return '\\text{—}';
    const a = Math.abs(v);
    let s;
    if (a !== 0 && (a < 1e-3 || a >= 1e6)) {
      const [m, e] = v.toExponential((sig || 3) - 1).split('e');
      s = String(Number(m)) + ' \\cdot 10^{' + Number(e) + '}';
    } else s = String(Number(v.toPrecision(sig || 4)));
    if (fr()) s = s.replace('.', '{,}');
    return s;
  }
  // Un entier : 65 536 ; 10⁷
  function fmtEntier(n) {
    if (n >= 1e6) {
      const e = Math.floor(Math.log10(n));
      const m = n / 10 ** e;
      return (Math.abs(m - 1) < 1e-9 ? '' : String(Number(m.toPrecision(2))).replace('.', fr() ? ',' : '.') + ' × ') + '10' + exposantTexte(e);
    }
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, fr() ? '\u202f' : ',');
  }
  function fmtEntierTex(n) {
    if (n >= 1e6) {
      const e = Math.floor(Math.log10(n));
      const m = n / 10 ** e;
      return (Math.abs(m - 1) < 1e-9 ? '' : String(Number(m.toPrecision(2))).replace('.', fr() ? '{,}' : '.') + ' \\cdot ') + '10^{' + e + '}';
    }
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, fr() ? '\\,' : '{,}');
  }

  function katexHTML(tex, affichage) {
    try {
      return katex.renderToString(tex, { displayMode: !!affichage, throwOnError: false, strict: 'ignore', output: 'html' });
    } catch (_) { return echapper(tex); }
  }
  const K_ = (tex) => katexHTML(tex, false);
  function rendreMaths(racine) {
    racine.querySelectorAll('.m').forEach((e) => {
      const src = e.dataset.tex || e.textContent.replace(/^\s*\\\(|\\\)\s*$/g, '');
      e.dataset.tex = src;
      e.innerHTML = katexHTML(src, false);
    });
  }

  // ===========================================================================
  //  Les séries
  // ===========================================================================
  const avecY = () => AVEC_Y[etat.mode];

  function analyserSource(src) {
    const X = T.creerSerie(src);
    return X;
  }

  // Charge les deux séries (x obligatoire, y si fourni) ; false si x est invalide
  function chargerSeries(srcX, srcY, opts) {
    const o = opts || {};
    let X, Y = null;
    try { X = analyserSource(srcX); cacherErreur('x'); }
    catch (e) { montrerErreur('x', e); return false; }
    if (srcY) {
      try { Y = analyserSource(srcY); cacherErreur('y'); }
      catch (e) { montrerErreur('y', e); if (AVEC_Y[etat.mode]) return false; Y = null; }
    }
    const n0 = Math.max(X.n0, Y ? Y.n0 : 1);
    const TX = T.tabuler(X, n0);
    let TY = null;
    if (Y) TY = T.tabuler(Y, n0);
    // tous les termes nuls ?
    if (TX.nNul >= 64 && TX.nNul > TX.M - n0 - 8) { montrerErreur('x', { code: 'nul' }); return false; }
    etat.srcX = srcX; etat.srcY = srcY || etat.srcY;
    etat.X = X; etat.Y = Y; etat.TX = TX; etat.TY = TY; etat.n0 = n0;
    etat.base = null;
    if (!o.garderParametres) { etat.N = null; etat.eps = null; etat.r1 = null; }
    arreterAddition();
    analyserTout();
    if (!o.garderVue) recadrer(true);
    etat.nouveau = true;
    majPanneauSeries();
    majTout();
    majURLDiffere();
    return true;
  }

  function montrerErreur(qui, e) {
    const champ = qui === 'x' ? el.champX : el.champY;
    const boite = qui === 'x' ? el.erreurX : el.erreurY;
    const apercu = qui === 'x' ? el.apercuX : el.apercuY;
    champ.classList.add('invalide');
    boite.innerHTML = tErreur(e && e.code ? e.code : 'interne', e && e.details);
    boite.hidden = false;
    apercu.classList.add('perime');
  }
  function cacherErreur(qui) {
    const champ = qui === 'x' ? el.champX : el.champY;
    const boite = qui === 'x' ? el.erreurX : el.erreurY;
    const apercu = qui === 'x' ? el.apercuX : el.apercuY;
    champ.classList.remove('invalide');
    boite.hidden = true;
    apercu.classList.remove('perime');
  }

  // ===========================================================================
  //  L'analyse du test
  // ===========================================================================
  function analyserTout() {
    if (!etat.X) return;
    const yOK = avecY() && etat.Y;
    if (avecY() && !etat.Y) { etat.res = null; return; }
    if (!etat.base || etat.base.mode !== etat.mode) {
      etat.base = T.preparer(etat.mode, etat.X, etat.TX, yOK ? etat.Y : null, yOK ? etat.TY : null);
    }
    etat.res = T.analyser(etat.mode, etat.X, etat.TX, yOK ? etat.Y : null, yOK ? etat.TY : null,
      { eps: etat.eps, r1: etat.r1 }, etat.base);
  }

  // Le rang utilisé (N ou K) et son minimum
  function rangInfo() {
    const r = etat.res;
    if (!r) return { rang: etat.n0, min: null, ok: false };
    const min = r.mode === 'racine' || r.mode === 'quotient' ? (r.Kmin !== undefined ? r.Kmin : null) : (r.Nmin !== undefined ? r.Nmin : null);
    let rang = etat.N != null ? Math.max(etat.n0, Math.round(etat.N)) : (min != null ? min : etat.n0);
    rang = Math.min(rang, etat.TX.M - 1);
    return { rang, min, ok: min != null && rang >= min };
  }
  const lettreRang = () => (etat.mode === 'racine' || etat.mode === 'quotient' ? 'K' : 'N');

  // Les valeurs |x_n| et la série de comparaison au rang n (pour les dessins)
  const xVal = (n) => (n >= etat.n0 && n <= etat.TX.M ? etat.TX.V[n] : NaN);
  const yVal = (n) => (etat.TY && n >= etat.n0 && n <= etat.TY.M ? etat.TY.V[n] : NaN);
  // { bas, haut } : la ou les bornes que fournit le test au rang n (null si aucune)
  function bornes(n) {
    const r = etat.res;
    if (!r) return null;
    const { rang } = rangInfo();
    switch (r.mode) {
      case 'comparaison': {
        const y = yVal(n);
        if (!Number.isFinite(y)) return null;
        return r.sens === 'yx' ? { bas: y } : { haut: y };
      }
      case 'limite': {
        const y = yVal(n);
        if (!Number.isFinite(y) || r.r === null || r.r === undefined) return null;
        if (r.r === 0) return { haut: r.eps * y };
        if (r.r === Infinity) return { bas: r.eps * y };
        return { bas: (r.r - r.eps) * y, haut: (r.r + r.eps) * y, tube: true };
      }
      case 'racine': case 'quotient': {
        if (n < rang || r.Kmin == null) return null;
        if (r.cas === 'a') {
          if (r.mode === 'racine') return { haut: Math.exp(n * Math.log(r.r1)) };
          return { haut: Math.exp(etat.TX.L[rang] + (n - rang) * Math.log(r.r1)) };
        }
        if (r.cas === 'b') return { bas: r.mode === 'racine' ? 1 : xVal(rang) };
        return null;
      }
      default: return null;
    }
  }
  // La suite du test au rang n
  function suiteVal(n) {
    const TX = etat.TX;
    if (n < etat.n0 || n > TX.M) return NaN;
    switch (etat.mode) {
      case 'comparaison': case 'limite':
        return etat.TY ? Math.exp(TX.L[n] - etat.TY.L[n]) : NaN;
      case 'racine': return Math.exp(TX.L[n] / n);
      case 'quotient': return n < TX.M ? Math.exp(TX.L[n + 1] - TX.L[n]) : NaN;
      default: return NaN;
    }
  }
  // La condition du test est-elle vérifiée au rang n ? (true, false, ou null : sans objet)
  function conditionOK(n) {
    const r = etat.res;
    if (!r) return null;
    const v = suiteVal(n);
    if (!Number.isFinite(v)) return null;
    const tol = 1e-12;
    switch (r.mode) {
      case 'comparaison': return r.sens === 'yx' ? v >= 1 - tol : v <= 1 + tol;
      case 'limite':
        if (r.r === null || r.r === undefined) return null;
        if (r.r === 0) return v < r.eps;
        if (r.r === Infinity) return v > r.eps;
        return Math.abs(v - r.r) < r.eps;
      case 'racine': case 'quotient':
        if (r.cas === 'a') return v <= r.r1 * (1 + tol);
        if (r.cas === 'b') return v >= 1 - tol;
        return null;
      default: return null;
    }
  }

  // ===========================================================================
  //  La vue (les abscisses communes aux deux graphes)
  // ===========================================================================
  function vueDefaut() {
    const n0 = etat.n0;
    const { rang } = rangInfo();
    if (aUnRang() && rang > n0 + 13) return { a: rang - 10.6, b: rang + 14.4 };
    return { a: n0 - 0.6, b: n0 + 19.4 };
  }
  function recadrer(immediat) {
    etat.vueAuto = true;
    allerVers(vueDefaut(), immediat);
  }
  function allerVers(v, immediat) {
    const n0 = etat.n0;
    let a = Math.max(n0 - 0.6, v.a), b = v.b;
    if (b - a < 4) b = a + 4;
    if (b - a > LARGEUR_MAX_VUE) b = a + LARGEUR_MAX_VUE;
    const Mmax = etat.TX ? etat.TX.M - 1 : 1e5;
    if (b > Mmax + 0.6) { const d = b - (Mmax + 0.6); a -= d; b -= d; a = Math.max(n0 - 0.6, a); }
    const cible = { a, b };
    if (immediat || REDUIT) { etat.vue = cible; etat.anim = null; dessiner(); return; }
    etat.anim = { de: Object.assign({}, etat.vue), vers: cible, debut: performance.now() };
    requestAnimationFrame(animerVue);
  }
  function animerVue(maintenant) {
    const A = etat.anim;
    if (!A) return;
    const u = clamp((maintenant - A.debut) / 320, 0, 1);
    const e = 1 - Math.pow(1 - u, 3);
    etat.vue = { a: A.de.a + (A.vers.a - A.de.a) * e, b: A.de.b + (A.vers.b - A.de.b) * e };
    dessiner();
    if (u < 1) requestAnimationFrame(animerVue); else etat.anim = null;
  }
  function zoomer(facteur, centre) {
    const v = etat.anim ? etat.anim.vers : etat.vue;
    const c = centre === undefined ? (v.a + v.b) / 2 : centre;
    etat.vueAuto = false;
    allerVers({ a: c - (c - v.a) * facteur, b: c + (v.b - c) * facteur }, false);
  }
  function voirQueue() {
    const { rang } = rangInfo();
    etat.vueAuto = false;
    allerVers({ a: rang - 0.6, b: rang + 24.4 }, false);
  }

  // ===========================================================================
  //  Dessin : outils
  // ===========================================================================
  function svg(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function etiquette(couche, x, y, html, classe) {
    const d = document.createElement('div');
    d.className = 'etiq ' + (classe || '');
    d.style.left = Math.round(x) + 'px';
    d.style.top = Math.round(y) + 'px';
    d.innerHTML = html;
    couche.appendChild(d);
    return d;
  }
  // Pas « joli » pour une graduation
  function pasJoli(etendue, cible) {
    const brut = etendue / Math.max(1, cible);
    const p = Math.pow(10, Math.floor(Math.log10(brut)));
    const m = brut / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }
  function geometrie(quel) {
    const taille = etat.tailles[quel];
    const x0 = MARGE.g, x1 = taille.W - MARGE.d;
    const y0 = taille.H - MARGE.b, y1 = MARGE.h;
    const v = etat.vue;
    const X = (n) => x0 + (n - v.a) / (v.b - v.a) * (x1 - x0);
    const nDe = (px) => v.a + (px - x0) / (x1 - x0) * (v.b - v.a);
    return { W: taille.W, H: taille.H, x0, x1, y0, y1, X, nDe, w: (x1 - x0) / (v.b - v.a) };
  }
  function nVisibles() {
    const v = etat.vue;
    const deb = Math.max(etat.n0, Math.ceil(v.a - 0.5));
    const fin = Math.min(etat.TX.M - 1, Math.floor(v.b + 0.5));
    return { deb, fin };
  }
  function graduationsX(g, groupe, couche) {
    const { deb, fin } = nVisibles();
    const pas = Math.max(1, pasJoli(fin - deb + 1, (g.x1 - g.x0) / 56));
    const premier = Math.ceil(deb / pas) * pas;
    const xN = g.x1 - 2;     // la lettre n au bout de l'axe
    for (let n = premier; n <= fin; n += pas) {
      const x = g.X(n);
      svg('line', { x1: x, x2: x, y1: g.y0, y2: g.y0 + 4, class: 'axe' }, groupe);
      const txt = fmtEntier(n);
      // pas de nombre collé sur le n (écrans étroits)
      if (x + 3.4 * txt.length <= xN - 6) etiquette(couche, x, g.y0 + 5, txt, 'axe axe-x');
    }
    etiquette(couche, xN, g.y0 + 5, '<i>n</i>', 'axe axe-x');
  }

  // ===========================================================================
  //  Graphe des aires
  // ===========================================================================
  function echelleAires(g) {
    const { deb, fin } = nVisibles();
    let ymax = 0, ymin = Infinity;
    for (let n = deb; n <= fin; n++) {
      const x = xVal(n);
      if (Number.isFinite(x)) { ymax = Math.max(ymax, x); if (x > 0) ymin = Math.min(ymin, x); }
      const b = bornes(n);
      if (b) for (const k of ['bas', 'haut']) {
        const v = b[k];
        if (Number.isFinite(v)) { ymax = Math.max(ymax, v); if (v > 0) ymin = Math.min(ymin, v); }
      }
    }
    if (!(ymax > 0)) ymax = 1;
    if (etat.log) {
      if (!(ymin < Infinity)) ymin = ymax / 10;
      let lo = Math.floor(Math.log10(ymin)), hi = Math.ceil(Math.log10(ymax) + 0.02);
      if (hi - lo < 1) lo = hi - 1;
      if (hi - lo > 300) lo = hi - 300;
      const Y = (v) => (v > 0 ? g.y0 - (Math.log10(v) - lo) / (hi - lo) * (g.y0 - g.y1) : g.y0 + 2);
      return { Y, lo, hi, log: true, ymax: 10 ** hi };
    }
    const pas = pasJoli(ymax, 4);
    const haut = Math.ceil(ymax * 1.08 / pas) * pas;
    const Y = (v) => g.y0 - v / haut * (g.y0 - g.y1);
    return { Y, haut, pas, log: false, ymax: haut };
  }

  function dessinerAires() {
    const svgEl = el.aires, couche = el.etiqAires;
    svgEl.innerHTML = '';
    couche.innerHTML = '';
    if (!etat.TX) return;
    const g = geometrie('aires');
    const E = echelleAires(g);
    const { deb, fin } = nVisibles();
    const { rang, ok } = rangInfo();
    const res = etat.res;
    const add = etat.addition;

    // grille et axes
    const gr = svg('g', {}, svgEl);
    if (E.log) {
      const pasDec = Math.max(1, Math.ceil((E.hi - E.lo) / 6));
      for (let d = E.lo; d <= E.hi; d += pasDec) {
        const y = E.Y(10 ** d);
        svg('line', { x1: g.x0, x2: g.x1, y1: y, y2: y, class: 'grille' }, gr);
        etiquette(couche, g.x0 - 6, y, K_('10^{' + d + '}'), 'axe axe-y');
      }
    } else {
      graduationsY(g, E, gr, couche);
    }
    // zone avant le rang
    const xr = g.X(rang - 0.5);
    if (xr > g.x0 && aUnRang()) svg('rect', { x: g.x0, y: g.y1, width: Math.min(xr, g.x1) - g.x0, height: g.y0 - g.y1, class: 'zone-avant' }, svgEl);
    // le drapeau du rang (dessiné plus loin, en haut de la ligne) : les valeurs exactes l'évitent
    const drapeau = aUnRang() && xr >= g.x0 - 1 && xr <= g.x1 + 1
      ? { x1: xr - 2, x2: xr + 43 + 6.3 * String(rang).length + (rang >= 1000 ? 2 : 0), y2: g.y1 + 24 } : null;

    // survol
    if (etat.survol !== null && etat.survol >= deb && etat.survol <= fin) {
      const xs = g.X(etat.survol);
      svg('rect', { x: xs - g.w / 2, y: g.y1, width: g.w, height: g.y0 - g.y1, class: 'colonne-survol' }, svgEl);
    }

    const nb = fin - deb + 1;
    const ecart = g.w > 6 ? Math.min(2.5, g.w * 0.1) : 0;
    const groupeY = svg('g', {}, svgEl);          // majorantes et tubes : derrière l'or
    const groupeX = svg('g', {}, svgEl);
    const groupeDevant = svg('g', {}, svgEl);     // minorantes et bords du tube : devant
    const groupeRouge = svg('g', {}, svgEl);
    if (etat.nouveau && !REDUIT && nb <= 160) etat.pousse = { debut: performance.now() };
    const ecoule = etat.pousse ? performance.now() - etat.pousse.debut : Infinity;
    if (ecoule > 1600) etat.pousse = null;
    const anim = !!etat.pousse;
    const yBas = E.log ? g.y0 : E.Y(0);

    if (nb <= 600) {
      for (let n = deb; n <= fin; n++) {
        const x = xVal(n);
        if (!Number.isFinite(x)) continue;
        const xc = g.X(n), gauche = xc - g.w / 2 + ecart, larg = Math.max(0.6, g.w - 2 * ecart);
        const avant = n < rang && aUnRang();
        const ajoutee = add && n >= rang && n <= add.M;
        const yx = E.Y(x);
        const rx = svg('rect', {
          x: gauche, y: Math.min(yx, yBas), width: larg, height: Math.max(0, yBas - yx),
          class: 'barre-x' + (avant ? ' avant' : '') + (ajoutee ? ' ajoutee' : '') + (etat.survol === n ? ' survol' : '') + (anim ? ' pousse' : ''),
        }, groupeX);
        if (anim) rx.style.animationDelay = (Math.min(900, (n - deb) * 22) - ecoule) + 'ms';
        const b = bornes(n);
        if (b) {
          if (b.tube) {
            const yh = E.Y(b.haut), yb = E.Y(Math.max(b.bas, 0));
            svg('rect', { x: gauche, y: yh, width: larg, height: Math.max(0, yb - yh), class: 'barre-tube' + (avant ? ' avant' : '') }, groupeY);
            svg('line', { x1: gauche, x2: gauche + larg, y1: yh, y2: yh, class: 'bord-tube' + (avant ? ' avant' : '') }, groupeDevant);
            svg('line', { x1: gauche, x2: gauche + larg, y1: yb, y2: yb, class: 'bord-tube bas' + (avant ? ' avant' : '') }, groupeDevant);
          } else {
            const majorante = Number.isFinite(b.haut);
            const v = majorante ? b.haut : b.bas;
            if (Number.isFinite(v)) {
              const yv = E.Y(v);
              const ry = svg('rect', {
                x: gauche, y: Math.min(yv, yBas), width: larg, height: Math.max(0, yBas - yv),
                class: 'barre-y' + (majorante ? '' : ' devant') + (avant ? ' avant' : '') + (ajoutee ? ' ajoutee' : '') + (anim ? ' pousse' : ''),
              }, majorante ? groupeY : groupeDevant);
              if (anim) ry.style.animationDelay = (Math.min(900, (n - deb) * 22 + 120) - ecoule) + 'ms';
            }
          }
          // ce qui dépasse (n ≥ rang seulement)
          if (!avant) {
            if (Number.isFinite(b.haut) && x > b.haut * (1 + 1e-9)) {
              const y1 = E.Y(x), y2 = E.Y(b.haut);
              svg('rect', { x: gauche, y: y1, width: larg, height: Math.max(1.5, y2 - y1), class: 'depasse' }, groupeRouge);
            }
            if (Number.isFinite(b.bas) && x < b.bas * (1 - 1e-9)) {
              const y1 = E.Y(b.bas), y2 = E.Y(x);
              svg('rect', { x: gauche + 1, y: y1, width: Math.max(0, larg - 2), height: Math.max(1.5, y2 - y1), class: 'manque' }, groupeRouge);
            }
          }
        }
        // valeur exacte au-dessus du rectangle (si la place le permet) ; sinon dans le
        // rectangle, sous le drapeau du rang au besoin
        if (g.w >= 30 && nb <= 30) {
          const haut = Math.max(x, b && Number.isFinite(b.haut) ? b.haut : 0, b && Number.isFinite(b.bas) ? b.bas : 0);
          const ex = texTerme(etat.X, n, true);
          const wl = ex ? largeurTex(ex) : Infinity;
          if (wl <= g.w - 3) {
            const touche = (yHaut) => drapeau && xc + wl / 2 > drapeau.x1 && xc - wl / 2 < drapeau.x2 && yHaut < drapeau.y2;
            const yb = E.Y(haut) - 3;
            if (yb > g.y1 + 14 && !touche(yb - H_ETIQ)) etiquette(couche, xc, yb, K_(ex), 'terme');
            else {
              let yh = E.Y(haut) + 3;
              if (touche(yh)) yh = drapeau.y2 + 2;
              if (yh + H_ETIQ + 2 <= yBas) etiquette(couche, xc, yh, K_(ex), 'terme dedans');
            }
          }
        }
      }
    } else {
      // beaucoup de termes : des escaliers
      let dX = '', dY = '';
      for (let n = deb; n <= fin; n++) {
        const x = xVal(n);
        if (!Number.isFinite(x)) continue;
        const g1 = g.X(n - 0.5), g2 = g.X(n + 0.5);
        dX += (dX ? 'L' : 'M') + g1.toFixed(1) + ',' + E.Y(x).toFixed(1) + 'L' + g2.toFixed(1) + ',' + E.Y(x).toFixed(1);
        const b = bornes(n);
        const v = b ? (Number.isFinite(b.haut) ? b.haut : b.bas) : NaN;
        if (Number.isFinite(v)) dY += (dY ? 'L' : 'M') + g1.toFixed(1) + ',' + E.Y(v).toFixed(1) + 'L' + g2.toFixed(1) + ',' + E.Y(v).toFixed(1);
      }
      if (dX) svg('path', { d: dX + 'L' + g.X(fin + 0.5).toFixed(1) + ',' + yBas + 'L' + g.X(deb - 0.5).toFixed(1) + ',' + yBas + 'Z', class: 'barre-x' }, groupeX);
      if (dY) svg('path', { d: dY, class: 'barre-y', fill: 'none' }, groupeY);
    }

    // axes
    svg('line', { x1: g.x0, x2: g.x1, y1: yBas, y2: yBas, class: 'axe' }, svgEl);
    svg('line', { x1: g.x0, x2: g.x0, y1: g.y0, y2: g.y1 - 4, class: 'axe' }, svgEl);
    graduationsX(g, svgEl, couche);

    // front de l'addition
    if (add && add.M >= rang && add.M <= fin) {
      const xf = g.X(add.M + 0.5);
      svg('line', { x1: xf, x2: xf, y1: g.y0, y2: g.y1, class: 'front-addition' }, svgEl);
    }
    // ligne du rang
    dessinerLigneRang(svgEl, couche, g, rang, ok, true);
    etat.geoAires = { g, E };
  }
  // Graduations de l'axe vertical ; un facteur commun 10^k si les nombres sont très petits ou très grands
  function graduationsY(g, E, groupe, couche) {
    let k = 0;
    if (E.haut < 1e-2 || E.haut >= 1e5) k = Math.floor(Math.log10(E.haut));
    const f = 10 ** k;
    for (let i = 0, v = 0; v <= E.haut * (1 + 1e-9); i++, v = i * E.pas) {
      const y = E.Y(v);
      if (v > 0) svg('line', { x1: g.x0, x2: g.x1, y1: y, y2: y, class: 'grille' }, groupe);
      etiquette(couche, g.x0 - 6, y, fmtGrad(v / f, E.pas / f), 'axe axe-y');
    }
    if (k) etiquette(couche, g.x0 + 5, g.y1 + 7, K_('\\times 10^{' + k + '}'), 'axe facteur');
  }
  function fmtGrad(v, pas) {
    if (v === 0) return '0';
    const dec = Math.max(0, -Math.floor(Math.log10(pas) + 1e-9));
    const s = v.toFixed(Math.min(dec, 8));
    return fr() ? s.replace('.', ',') : s;
  }
  // Le test fournit-il un rang ? (pas si r = 1, ni sans limite, ni sans inégalité)
  function aUnRang() {
    const r = etat.res;
    if (!r) return false;
    if (r.mode === 'comparaison') return !!r.sens;
    if (r.mode === 'limite') return r.r != null;
    return r.cas === 'a' || r.cas === 'b';
  }
  function dessinerLigneRang(svgEl, couche, g, rang, ok, avecPoignee) {
    if (!aUnRang()) return;
    const xr = g.X(rang - 0.5);
    const lettre = lettreRang();
    if (xr < g.x0 - 1) {
      etiquette(couche, g.x0 + 6, g.y1 + 2, '← ' + K_(lettre + ' = ' + fmtEntierTex(rang)), 'rang' + (ok ? '' : ' echec'));
      return;
    }
    if (xr > g.x1 + 1) {
      etiquette(couche, g.x1 - 4, g.y1 + 12, K_(lettre + ' = ' + fmtEntierTex(rang)) + ' →', 'rang' + (ok ? '' : ' echec'));
      return;
    }
    svg('line', { x1: xr, x2: xr, y1: g.y0, y2: g.y1 - 6, class: 'ligne-rang' + (ok ? '' : ' echec') }, svgEl);
    if (avecPoignee) {
      svg('circle', { cx: xr, cy: g.y0, r: 6, class: 'poignee-rang' }, svgEl);
      etiquette(couche, xr, g.y1 + 2, K_(lettre + ' = ' + fmtEntierTex(rang)), 'rang drapeau' + (ok ? '' : ' echec'));
    }
  }

  // Largeur approximative (px) d'une petite formule : une fraction prend la largeur
  // de son plus long étage
  const H_ETIQ = 15;      // hauteur d'une valeur exacte (px)
  function largeurTex(tex) {
    const visible = (s) => s.replace(/\\(left|right|cdot|,)/g, '').replace(/\\[a-zA-Z]+/g, 'xx').replace(/[{}\\^_ ]/g, '').length;
    const m = /^\\frac\{((?:[^{}]|\{[^{}]*\})*)\}\{((?:[^{}]|\{[^{}]*\})*)\}$/.exec(tex);
    if (m) return Math.max(visible(m[1]), visible(m[2])) * 6.2 + 6;
    return visible(tex) * 6.6 + 4;
  }
  // Valeur exacte de x_n en LaTeX (ou décimale courte ; exactSeulement : null si pas exacte)
  function texTerme(serie, n, exactSeulement) {
    try {
      if (!serie.cache) serie.cache = new Map();
      if (!serie.cache.has(n)) serie.cache.set(n, serie.exact(n));
      const e = serie.cache.get(n);
      if (e && e.tex && !e.indefini) return e.tex.replace(/^-/, '');
    } catch (_) { /* rien */ }
    if (exactSeulement) return null;
    const v = n <= etat.TX.M ? (serie === etat.X ? xVal(n) : yVal(n)) : NaN;
    return Number.isFinite(v) ? fmtCourt(v, 3) : null;
  }

  // ===========================================================================
  //  Graphe de la suite du test
  // ===========================================================================
  function echelleSuite(g) {
    const r = etat.res;
    const { deb, fin } = nVisibles();
    const ref = [0];
    if (r) {
      if (r.mode === 'comparaison') ref.push(1);
      if (r.mode === 'limite' && r.r != null) {
        if (r.r === Infinity || r.r === 0) ref.push(r.eps);
        else ref.push(r.r + r.eps, r.r);
      }
      if (r.mode === 'racine' || r.mode === 'quotient') {
        ref.push(1);
        if (Number.isFinite(r.r)) ref.push(r.r);
        if (r.r1) ref.push(r.r1);
      }
    }
    const refMax = Math.max(...ref);
    let vmax = 0;
    for (let n = deb; n <= fin; n++) { const v = suiteVal(n); if (Number.isFinite(v)) vmax = Math.max(vmax, v); }
    let haut = Math.max(refMax * 1.25, Math.min(vmax * 1.08, Math.max(refMax, 0.05) * 3.2));
    if (!(haut > 0)) haut = 1;
    const pas = pasJoli(haut, 4);
    haut = Math.ceil(haut / pas) * pas;
    const Y = (v) => g.y0 - v / haut * (g.y0 - g.y1);
    const v = (py) => (g.y0 - py) / (g.y0 - g.y1) * haut;
    return { Y, v, haut, pas };
  }

  function dessinerSuite() {
    const svgEl = el.suite, couche = el.etiqSuite;
    svgEl.innerHTML = '';
    couche.innerHTML = '';
    const r = etat.res;
    if (!etat.TX || !r) return;
    const g = geometrie('suite');
    const E = echelleSuite(g);
    const { deb, fin } = nVisibles();
    const { rang, ok } = rangInfo();

    graduationsY(g, E, svgEl, couche);
    const xr = clamp(g.X(rang - 0.5), g.x0, g.x1);
    const zone = (y1v, y2v, div) => {
      const ya = E.Y(Math.min(y2v, E.haut)), yb = E.Y(Math.max(y1v, 0));
      if (yb > ya) svg('rect', { x: xr, y: ya, width: Math.max(0, g.x1 - xr), height: yb - ya, class: 'zone-ok' + (div ? ' div' : '') }, svgEl);
    };
    const ligneH = (v, classe, etiq, classeEtiq) => {
      if (!(v >= 0 && v <= E.haut)) return;
      const y = E.Y(v);
      svg('line', { x1: g.x0, x2: g.x1, y1: y, y2: y, class: classe }, svgEl);
      if (etiq) etiquette(couche, g.x1 - 4, y - 9, etiq, classeEtiq).style.transform = 'translate(-100%, -50%)';
    };

    // zones, lignes et poignées selon le test
    const poignees = [];
    if (r.mode === 'comparaison') {
      if (r.sens === 'yx') zone(1, E.haut, false); else zone(0, 1, false);
      ligneH(1, 'bord-bande', K_('1'), 'ligne-bande');
    } else if (r.mode === 'limite' && r.r != null) {
      if (r.r === 0) {
        zone(0, r.eps, false);
        ligneH(r.eps, 'bord-bande', K_('\\varepsilon = ' + fmtCourt(r.eps, 3)), 'ligne-bande');
        poignees.push({ type: 'eps', v: r.eps });
      } else if (r.r === Infinity) {
        zone(r.eps, E.haut, false);
        ligneH(r.eps, 'bord-bande', K_('M = ' + fmtCourt(r.eps, 3)), 'ligne-bande');
        poignees.push({ type: 'eps', v: r.eps });
      } else {
        zone(r.r - r.eps, r.r + r.eps, false);
        ligneH(r.r + r.eps, 'bord-bande', K_('r + \\varepsilon'), 'ligne-bande');
        ligneH(Math.max(0, r.r - r.eps), 'bord-bande', r.r - r.eps > 0.08 * E.haut ? K_('r - \\varepsilon') : '', 'ligne-bande');
        ligneH(r.r, 'ligne-limite', K_('r ' + (r.rExact ? '= ' + r.rExact.tex : '\\approx ' + fmtCourt(r.r, 4))), 'ligne-r');
        poignees.push({ type: 'eps', v: r.r + r.eps });
        if (r.r - r.eps > 0) poignees.push({ type: 'eps-bas', v: r.r - r.eps });
      }
    } else if (r.mode === 'racine' || r.mode === 'quotient') {
      if (r.cas === 'a') {
        zone(0, r.r1, false);
        ligneH(1, 'ligne-un', K_('1'), 'ligne-un');
        if (Number.isFinite(r.r)) ligneH(r.r, 'ligne-limite', K_('r ' + (r.rExact ? '= ' + r.rExact.tex : '\\approx ' + fmtCourt(r.r, 4))), 'ligne-r');
        ligneH(r.r1, 'ligne-r1', K_('r_1 = ' + fmtCourt(r.r1, 3)), 'ligne-r1');
        poignees.push({ type: 'r1', v: r.r1 });
      } else {
        if (r.cas === 'b') zone(1, E.haut, true);
        ligneH(1, 'ligne-un', K_('1'), 'ligne-un');
        if (Number.isFinite(r.r) && r.r <= E.haut) ligneH(r.r, 'ligne-limite', r.cas === 'r1' ? '' : K_('r ' + (r.rExact ? '= ' + r.rExact.tex : '\\approx ' + fmtCourt(r.r, 4))), 'ligne-r');
      }
    }
    // poignées invisibles (zone de saisie plus large)
    for (const p of poignees) {
      const y = E.Y(p.v);
      if (y < g.y1 - 2 || y > g.y0 + 2) continue;
      svg('line', { x1: g.x0, x2: g.x1, y1: y, y2: y, class: p.type === 'r1' ? 'ligne-r1-halo' : 'bord-bande-halo', 'data-poignee': p.type }, svgEl);
    }

    // survol
    if (etat.survol !== null && etat.survol >= deb && etat.survol <= fin) {
      const xs = g.X(etat.survol);
      svg('rect', { x: xs - g.w / 2, y: g.y1, width: g.w, height: g.y0 - g.y1, class: 'colonne-survol' }, svgEl);
    }

    // les points
    const nb = fin - deb + 1;
    const rayon = clamp(g.w * 0.22, 1.6, 4.6);
    const pts = svg('g', {}, svgEl);
    const pasPts = nb > 1500 ? Math.ceil(nb / 1500) : 1;
    for (let n = deb; n <= fin; n += pasPts) {
      const v = suiteVal(n);
      if (!Number.isFinite(v)) continue;
      const c = conditionOK(n);
      const classe = n < rang && aUnRang() ? 'avant' : c === false ? 'echec' : 'ok';
      const x = g.X(n);
      if (v > E.haut) {
        const y = g.y1 + 1;
        svg('path', { d: `M${x - 4},${y + 7}L${x},${y}L${x + 4},${y + 7}Z`, class: 'fleche-hors ' + classe }, pts);
        continue;
      }
      svg('circle', { cx: x, cy: E.Y(v), r: rayon, class: 'pt ' + classe + (etat.survol === n ? ' survol' : '') }, pts);
    }

    svg('line', { x1: g.x0, x2: g.x1, y1: g.y0, y2: g.y0, class: 'axe' }, svgEl);
    svg('line', { x1: g.x0, x2: g.x0, y1: g.y0, y2: g.y1 - 4, class: 'axe' }, svgEl);
    graduationsX(g, svgEl, couche);
    dessinerLigneRang(svgEl, couche, g, rang, ok, false);
    etat.geoSuite = { g, E };
  }

  // ===========================================================================
  //  Titres et légende des graphes
  // ===========================================================================
  function majTitres() {
    const r = etat.res;
    el.titreAires.innerHTML = etat.log ? t('titreAiresLog') : t('titreAires') + ' ' + K_('x_n');
    const leg = ['<span class="leg leg-x"><i></i>' + K_('x_n') + '</span>'];
    if (r) {
      if (r.mode === 'comparaison') leg.push('<span class="leg leg-y"><i></i>' + K_('y_n') + '</span>');
      else if (r.mode === 'limite' && r.r != null) {
        if (r.r === 0) leg.push('<span class="leg leg-y"><i></i>' + K_('\\varepsilon\\, y_n') + '</span>');
        else if (r.r === Infinity) leg.push('<span class="leg leg-y"><i></i>' + K_('M y_n') + '</span>');
        else leg.push('<span class="leg leg-tube"><i></i>' + K_('(r \\pm \\varepsilon)\\, y_n') + '</span>');
      } else if (r.cas === 'a') leg.push('<span class="leg leg-y"><i></i>' + K_(r.mode === 'racine' ? 'r_1^{\\,n}' : 'x_K\\, r_1^{\\,n-K}') + '</span>');
      else if (r.cas === 'b') leg.push('<span class="leg leg-y"><i></i>' + K_(r.mode === 'racine' ? '1' : 'x_K') + '</span>');
      leg.push('<span class="leg leg-rouge"><i></i>' + t('legRouge') + '</span>');
    }
    el.legende.innerHTML = leg.join('');
    let tex;
    switch (etat.mode) {
      case 'comparaison': case 'limite': tex = '\\dfrac{x_n}{y_n}'; break;
      case 'racine': tex = 'x_n^{1/n}'; break;
      default: tex = '\\dfrac{x_{n+1}}{x_n}';
    }
    el.titreSuite.innerHTML = t('titreSuite') + DP() + K_(tex.replace('\\dfrac', '\\tfrac'));
  }

  // ===========================================================================
  //  Les aires à partir du rang (jauges)
  // ===========================================================================
  // Somme de la série étudiée, ou de y, de N à M (M ≤ table)
  const partielX = (N, M) => T.sommePartielle(etat.TX, N, M);
  const partielY = (N, M) => (etat.TY ? T.sommePartielle(etat.TY, N, M) : NaN);
  function totalQueue(serie, tab, nature, N) {
    if (!nature || !nature.nature) return null;
    if (nature.nature === 'div') return Infinity;
    const R = T.reste(serie, tab);
    if (!Number.isFinite(R.R)) return R.R === Infinity ? Infinity : null;
    return T.sommePartielle(tab, N, tab.M) + R.R;
  }
  // Les lignes de jauges : { cls, nom (LaTeX), partiel(M) → [bas, haut] ou v, total }
  function lignesJauges() {
    const r = etat.res;
    if (!r) return [];
    const { rang } = rangInfo();
    const N = rang;
    const sig = (s) => '\\sum_{n \\ge ' + N + '} ' + s;
    const natX = conclusionNatureX();
    const lignes = [{ cls: 'x', nom: sig('x_n'), partiel: (M) => partielX(N, M), total: totalQueue(etat.X, etat.TX, natX, N) }];
    const Mt = etat.TX.M;
    if (r.mode === 'comparaison' && etat.TY) {
      lignes.push({ cls: 'y', nom: sig('y_n'), partiel: (M) => partielY(N, M), total: totalQueue(etat.Y, etat.TY, r.natureY, N) });
    } else if (r.mode === 'limite' && etat.TY && r.r != null) {
      const totY = totalQueue(etat.Y, etat.TY, r.natureY, N);
      if (r.r === 0) lignes.push({ cls: 'y', nom: sig('\\varepsilon\\, y_n'), partiel: (M) => r.eps * partielY(N, M), total: totY === null ? null : r.eps * totY });
      else if (r.r === Infinity) lignes.push({ cls: 'y', nom: sig('M y_n'), partiel: (M) => r.eps * partielY(N, M), total: totY === null ? null : r.eps * totY });
      else {
        const lo = r.r - r.eps, hi = r.r + r.eps;
        lignes.push({
          cls: 'tube', nom: sig('(r \\pm \\varepsilon)\\, y_n'),
          partiel: (M) => [lo * partielY(N, M), hi * partielY(N, M)],
          total: totY === null ? null : totY === Infinity ? Infinity : [lo * totY, hi * totY],
        });
      }
    } else if ((r.mode === 'racine' || r.mode === 'quotient') && r.Kmin != null) {
      if (r.cas === 'a') {
        const q = r.r1;
        const premier = r.mode === 'racine' ? Math.exp(N * Math.log(q)) : xVal(N);
        const somme = (M) => premier * (1 - Math.pow(q, M - N + 1)) / (1 - q);
        lignes.push({ cls: 'y', nom: sig(r.mode === 'racine' ? 'r_1^{\\,n}' : 'x_K r_1^{\\,n-K}'), partiel: (M) => (M < N ? 0 : somme(M)), total: premier / (1 - q), geo: true });
      } else if (r.cas === 'b') {
        const c = r.mode === 'racine' ? 1 : xVal(N);
        lignes.push({ cls: 'y', nom: sig(r.mode === 'racine' ? '1' : 'x_K'), partiel: (M) => Math.max(0, M - N + 1) * c, total: Infinity });
      }
    }
    lignes.Mt = Mt;
    return lignes;
  }
  // La nature de Σ x_n telle que le test la donne, sinon telle que l'application la reconnaît
  function conclusionNatureX() {
    const r = etat.res;
    if (!r) return null;
    const c = r.conclusion;
    if (c && c.nature && c.serie === 'x') return { nature: c.nature };
    return r.natureX;
  }

  function majJauges() {
    const r = etat.res;
    const lignes = lignesJauges();
    const { rang } = rangInfo();
    el.jaugesTitre.innerHTML = r ? remplir(t('jaugesTitre'), { r: K_(lettreRang() + ' = ' + fmtEntierTex(rang)) }) : '';
    const add = etat.addition;
    const M = add ? add.M : null;
    // l'échelle : les totaux finis (ou les sommes partielles pendant l'addition)
    let echelle = 0;
    const valeursFinies = [];
    for (const L of lignes) {
      const tot = L.total;
      if (Array.isArray(tot)) valeursFinies.push(tot[1]);
      else if (Number.isFinite(tot)) valeursFinies.push(tot);
    }
    if (valeursFinies.length) echelle = Math.max(...valeursFinies);
    else {
      // aucune aire finie connue : l'échelle des 100 premiers termes à partir du rang
      for (const L of lignes) { const p = L.partiel(Math.min(lignes.Mt, rang + 99)); echelle = Math.max(echelle, Array.isArray(p) ? p[1] : p); }
    }
    if (!(echelle > 0)) echelle = 1;
    echelle *= 1.08;
    const html = [];
    for (const L of lignes) {
      let bas = 0, haut, val, classeVal = '', infini = false, limite = null;
      if (add) {
        const p = L.partiel(M);
        if (Array.isArray(p)) { bas = p[0]; haut = p[1]; } else haut = p;
        if (haut > echelle) { haut = echelle; infini = L.total === Infinity || L.total === null; }
        val = K_(fmtTex(Array.isArray(p) ? p[1] : p, 4));
        if (Array.isArray(L.total)) limite = L.total[1];
        else if (Number.isFinite(L.total)) limite = L.total;
      } else if (L.total === Infinity) {
        haut = echelle; infini = true; val = K_('+\\infty'); classeVal = 'infini';
      } else if (L.total === null) {
        const p = L.partiel(lignes.Mt);
        haut = Math.min(Array.isArray(p) ? p[1] : p, echelle);
        val = '?'; classeVal = 'inconnu';
      } else if (Array.isArray(L.total)) {
        bas = L.total[0]; haut = L.total[1];
        const ch = etroit() ? 2 : 3;
        val = K_(fmtTex(L.total[0], ch) + ' \\ldots ' + fmtTex(L.total[1], ch));
        classeVal = 'intervalle';
        limite = null;
      } else {
        haut = L.total; val = K_('\\approx ' + fmtTex(L.total, 4)); limite = L.total;
      }
      const g = clamp(bas / echelle * 100, 0, 100), d = clamp(haut / echelle * 100, 0, 100);
      html.push('<div class="jauge ' + L.cls + (add ? ' sans-transition' : '') + '">' +
        '<span class="jauge-nom">' + K_(L.nom) + '</span>' +
        '<div class="jauge-piste"><div class="jauge-barre" style="left:' + g.toFixed(2) + '%;width:' + Math.max(0, d - g).toFixed(2) + '%"></div>' +
        (add && limite !== null && Number.isFinite(limite) ? '<div class="jauge-limite" style="left:' + clamp(limite / echelle * 100, 0, 100).toFixed(2) + '%"></div>' : '') +
        (infini && add ? '<span class="jauge-infini">' + K_('\\to \\infty') + '</span>' : '') + '</div>' +
        '<span class="jauge-val ' + classeVal + '">' + val + '</span></div>');
    }
    if (add) html.push('<div class="indice" style="margin:2px 0 0;text-align:right">' + K_('M = ' + fmtEntierTex(M)) + '</div>');
    el.jaugesLignes.innerHTML = html.join('');
  }

  // ===========================================================================
  //  « Additionner les aires » : les rectangles un à un, puis de plus en plus vite
  // ===========================================================================
  function lancerAddition() {
    if (etat.addition) { arreterAddition(true); return; }
    const { rang } = rangInfo();
    etat.addition = { M: rang - 1, debut: performance.now(), dernier: performance.now() };
    el.btnAdditionner.classList.add('en-cours');
    el.btnAdditionner.innerHTML = t('arreter');
    requestAnimationFrame(pasAddition);
  }
  function pasAddition(maintenant) {
    const A = etat.addition;
    if (!A) return;
    const { fin } = nVisibles();
    const Mt = etat.TX.M;
    if (A.M < fin) {
      if (maintenant - A.dernier >= (REDUIT ? 0 : 140)) { A.M++; A.dernier = maintenant; }
    } else if (A.M < Mt) {
      if (maintenant - A.dernier >= 60) { A.M = Math.min(Mt, Math.ceil(A.M * 1.32 + 1)); A.dernier = maintenant; }
    } else {
      if (maintenant - A.dernier > 700) { arreterAddition(true); return; }
    }
    dessinerAires();
    majJauges();
    requestAnimationFrame(pasAddition);
  }
  function arreterAddition(redessiner) {
    if (!etat.addition) return;
    etat.addition = null;
    el.btnAdditionner.classList.remove('en-cours');
    el.btnAdditionner.innerHTML = '▶&nbsp;<span data-i18n="additionner">' + (TRAD[etat.langue].additionner || TRAD.fr.additionner) + '</span>';
    if (redessiner) { dessinerAires(); majJauges(); }
  }

  // ===========================================================================
  //  Panneau : les séries
  // ===========================================================================
  function texNature(nat) {
    if (!nat) return '';
    const N = MSG[etat.langue].natures;
    const nature = nat.nature ? N[nat.nature] : '';
    const num = nat.certain ? '' : ' ' + N.numerique;
    switch (nat.type) {
      case 'p': return remplir(N.p, { p: K_('p = ' + fmtCourt(nat.p, 4) + (nat.p > 1 ? ' > 1' : ' \\le 1')), nat: nature });
      case 'geo': return remplir(N.geo, { r: K_(fmtCourt(nat.r, 4) + (nat.r < 1 ? ' < 1' : ' \\ge 1')), nat: nature });
      case 'npgeo': return remplir(N.npgeo, { f: K_('n^{' + fmtCourt(nat.a, 3) + '} \\cdot ' + fmtCourt(nat.r, 3) + '^{\\,n}'), nat: nature });
      case 'pequiv': return remplir(N.pequiv, { f: K_('\\frac{1}{n^{' + fmtCourt(nat.p, 3) + '}}'), nat: nature }) + num;
      case 'pplus': return remplir(N.pplus, { f: K_('\\frac{1}{n}') }) + num;
      case 'pnum': return remplir(N.pnum, { f: K_('\\frac{1}{n^{' + fmtCourt(nat.p, 3) + '}}'), nat: nature }) + num;
      case 'quotient': return remplir(N.quotient, { r: fmtCourt(nat.r, 3).replace('{,}', ','), nat: nature }) + num;
      case 'racine': return remplir(N.racine, { r: fmtCourt(nat.r, 3).replace('{,}', ','), nat: nature }) + num;
      case 'grossiere': return N.grossiere + num;
      default: return N.inconnue;
    }
  }
  // Pourquoi la série converge ou diverge (pour le raisonnement, sans répéter le verdict)
  function raison(nat) {
    if (!nat) return '';
    const num = nat.certain ? '' : ET(' (estimation numérique)', ' (numerical estimate)');
    const p = () => K_('p = ' + fmtCourt(nat.p, 4) + (nat.p > 1 ? ' > 1' : ' \\le 1'));
    switch (nat.type) {
      case 'p': return ET('c’est une ', 'it is a ') + K_('p') + ET('-série, avec ', '-series with ') + p();
      case 'geo': return ET('c’est une série géométrique de raison ', 'it is a geometric series with ratio ') + K_(fmtCourt(nat.r, 4) + (nat.r < 1 ? ' < 1' : ' \\ge 1'));
      case 'npgeo': return ET('son terme général est ', 'its general term is ') + K_('n^{' + fmtCourt(nat.a, 3) + '} \\cdot ' + fmtCourt(nat.r, 3) + '^{\\,n}') + ET(' (test de la racine)', ' (root test)');
      case 'pequiv': return ET('son terme général se comporte comme ', 'its general term behaves like ') + K_('\\frac{1}{n^{' + fmtCourt(nat.p, 3) + '}}') + ET(' (comparaison par limite)', ' (limit comparison)') + num;
      case 'pplus': return ET('son terme général dépasse ', 'its general term exceeds ') + K_('\\frac{1}{n}') + ET(' à partir d’un certain rang', ' from some rank on') + num;
      case 'pnum': return ET('son terme général décroît environ comme ', 'its general term decreases roughly like ') + K_('\\frac{1}{n^{' + fmtCourt(nat.p, 3) + '}}') + num;
      case 'quotient': return ET('test du quotient, ', 'ratio test, ') + K_('r \\approx ' + fmtCourt(nat.r, 3)) + num;
      case 'racine': return ET('test de la racine, ', 'root test, ') + K_('r \\approx ' + fmtCourt(nat.r, 3)) + num;
      case 'grossiere': return ET('son terme général ne tend pas vers 0', 'its general term does not tend to 0') + num;
      default: return '';
    }
  }
  function majPanneauSeries() {
    const virgule = fr();
    if (etat.X) el.apercuX.innerHTML = katexHTML('x_n = ' + S.texGeneral(etat.X.arbre, { virgule }), true);
    if (etat.Y) {
      const natY = etat.res && etat.res.natureY;
      el.apercuY.innerHTML = katexHTML('y_n = ' + S.texGeneral(etat.Y.arbre, { virgule }), true) +
        (natY && avecY() ? '<span class="nature">' + texNature(natY) + '</span>' : '');
    }
    el.blocY.hidden = !avecY();
    el.noteGeo.hidden = avecY();
    el.noteGeo.innerHTML = t('noteGeo');
    const notes = [];
    if (etat.TX && etat.TX.nNeg > 0) notes.push(remplir(t('noteNeg'), { s: K_('\\sum |x_n|') }));
    if (etat.n0 > 1) notes.push(remplir(t('noteDebut'), { n: etat.n0 }));
    el.noteSeries.innerHTML = notes.join(' ');
    el.noteSeries.hidden = !notes.length;
    // exemples du test courant
    el.exemples.innerHTML = '';
    EXEMPLES.forEach((ex, i) => {
      if (ex.mode !== etat.mode) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'exemple';
      b.dataset.i = i;
      const actif = ex.x === etat.srcX && (!ex.y || ex.y === etat.srcY);
      b.setAttribute('aria-pressed', actif ? 'true' : 'false');
      const src = ex.src ? MSG[etat.langue].sources[ex.src] : '';
      b.innerHTML = K_(ex.tex) + (src ? '<span class="source">' + src + '</span>' : '');
      if (/^P1/.test(ex.src)) b.title = remplir(t('sourceTitre'), { e: src });
      el.exemples.appendChild(b);
    });
  }

  // ===========================================================================
  //  Panneau : le test (énoncé, paramètres, statut)
  // ===========================================================================
  function enonceHTML() {
    const r = etat.res;
    const c = r && r.conclusion;
    const partie = (cle, html) => '<span class="partie' + (c && String(c.enonce) === cle ? ' utilisee' : '') + '">' + html + '</span>';
    switch (etat.mode) {
      case 'comparaison':
        return ET('<b>Théorème.</b> Si ', '<b>Theorem.</b> If ') + K_('0 \\le x_n \\le y_n') + ET(' lorsque ', ' when ') + K_('n \\ge N') + ET('\u00a0:', ':') +
          partie('1', '(1) ' + ET('si ', 'if ') + K_('\\sum y_n') + ET(' converge, alors ', ' converges, then ') + K_('\\sum x_n') + ET(' converge\u202f;', ' converges;')) +
          partie('2', '(2) ' + ET('si ', 'if ') + K_('\\sum x_n') + ET(' diverge, alors ', ' diverges, then ') + K_('\\sum y_n') + ET(' diverge.', ' diverges.'));
      case 'limite':
        return ET('<b>Théorème.</b> Si ', '<b>Theorem.</b> If ') + K_('x_n > 0') + ', ' + K_('y_n > 0') + ET(' et si ', ' and ') + K_('r := \\lim \\frac{x_n}{y_n}') + ET(' existe\u00a0:', ' exists:') +
          partie('1', '(1) ' + ET('si ', 'if ') + K_('r > 0') + ', ' + K_('\\sum x_n') + ET(' converge ', ' converges ') + K_('\\iff') + ' ' + K_('\\sum y_n') + ET(' converge\u202f;', ' converges;')) +
          partie('2', '(2) ' + ET('si ', 'if ') + K_('r = 0') + ET(' et si ', ' and ') + K_('\\sum y_n') + ET(' converge, alors ', ' converges, then ') + K_('\\sum x_n') + ET(' converge.', ' converges.'));
      case 'racine':
        return ET('<b>Corollaire.</b> Si ', '<b>Corollary.</b> If ') + K_('r := \\lim x_n^{1/n}') + ET(' existe, alors ', ' exists, then ') + K_('\\sum x_n') + ET('\u00a0:', ':') +
          partie('a', ET('(a) converge si ', '(a) converges if ') + K_('r < 1') + ET('\u202f;', ';')) +
          partie('b', ET('(b) diverge si ', '(b) diverges if ') + K_('r > 1') + '.');
      default:
        return ET('<b>Corollaire.</b> Si ', '<b>Corollary.</b> If ') + K_('r := \\lim \\frac{x_{n+1}}{x_n}') + ET(' existe, alors ', ' exists, then ') + K_('\\sum x_n') + ET('\u00a0:', ':') +
          partie('a', ET('(a) converge si ', '(a) converges if ') + K_('r < 1') + ET('\u202f;', ';')) +
          partie('b', ET('(b) diverge si ', '(b) diverges if ') + K_('r > 1') + '.');
    }
  }

  function majPanneauTest() {
    const r = etat.res;
    el.titreTest.textContent = MSG[etat.langue].titreTest[etat.mode];
    el.enonce.innerHTML = enonceHTML();
    if (!r) { el.statut.innerHTML = ''; return; }
    const { rang, min, ok } = rangInfo();
    // le rang
    el.libelleN.innerHTML = '<i>' + lettreRang() + '</i> =';
    const maxN = Math.max(etat.n0 + 30, (min || etat.n0) + 25, rang + 10);
    el.curseurN.min = etat.n0;
    el.curseurN.max = Math.min(etat.TX.M - 1, maxN);
    el.curseurN.value = rang;
    el.valN.textContent = fmtEntier(rang);
    // ε
    const avecEps = r.mode === 'limite' && r.r != null;
    el.paramEps.hidden = !avecEps;
    if (avecEps) {
      let lo, hi, pas;
      if (r.r === 0) { lo = 0.02; hi = 2; pas = 0.01; el.libelleEps.innerHTML = '<i>ε</i> ='; }
      else if (r.r === Infinity) { lo = 0.1; hi = 10; pas = 0.05; el.libelleEps.innerHTML = '<i>M</i> ='; }
      else { lo = r.r / 50; hi = r.r * 0.98; pas = r.r / 200; el.libelleEps.innerHTML = '<i>ε</i> ='; }
      el.curseurEps.min = lo; el.curseurEps.max = hi; el.curseurEps.step = pas;
      el.curseurEps.value = r.eps;
      el.valEps.innerHTML = K_(Number.isFinite(r.r) && r.r > 0 && Math.abs(r.eps - r.r / 2) < 1e-12 ? '\\tfrac{r}{2}' : fmtCourt(r.eps, 3));
    }
    // r1
    const avecR1 = (r.mode === 'racine' || r.mode === 'quotient') && r.cas === 'a';
    el.paramR1.hidden = !avecR1;
    if (avecR1) {
      const lo = Math.min(0.999, r.r + Math.max(1e-3, (1 - r.r) * 0.01)), hi = 0.995;
      el.curseurR1.min = lo; el.curseurR1.max = hi; el.curseurR1.step = Math.max(1e-4, (hi - lo) / 400);
      el.curseurR1.value = r.r1;
      el.valR1.innerHTML = K_(fmtCourt(r.r1, 3));
    }
    el.paramN.hidden = !(r.mode === 'comparaison' || min != null);
    el.statut.innerHTML = statutHTML(rang, min, ok);
  }

  function statutHTML(rang, min, ok) {
    const r = etat.res;
    const L = lettreRang();
    const jusqu = t('verifie');
    const cond = conditionTex();
    if (!cond) return '';
    if (min == null) {
      const ech = r.echec ? K_('n = ' + fmtEntierTex(r.echec)) : '';
      return '<span class="non">✗</span> ' + ET('Aucun rang ne convient : ', 'No rank works: ') + K_(cond) + ET(' échoue encore pour ', ' still fails for ') + ech + '.';
    }
    if (!ok) {
      return '<span class="non">✗</span> ' + K_(cond) + ET(' échoue pour ', ' fails for ') + K_('n = ' + (min - 1)) + ET(' : prenez ', ': take ') + K_(L + ' \\ge ' + min) + '.';
    }
    return '<span class="ok">✓</span> ' + K_(cond) + ET(' pour tout ', ' for all ') + K_('n \\ge ' + fmtEntierTex(rang)) + ' <span class="petit">(' + jusqu + ')</span>' +
      (rang > min ? ET(' ; le plus petit rang est ', '; the smallest rank is ') + K_(L + ' = ' + fmtEntierTex(min)) + '.' : '.');
  }
  // La condition du test, en LaTeX
  function conditionTex() {
    const r = etat.res;
    if (!r) return null;
    switch (r.mode) {
      case 'comparaison': return r.sens === 'yx' ? '0 \\le y_n \\le x_n' : '0 \\le x_n \\le y_n';
      case 'limite':
        if (r.r == null) return null;
        if (r.r === 0) return '\\frac{x_n}{y_n} < ' + fmtCourt(r.eps, 3);
        if (r.r === Infinity) return '\\frac{x_n}{y_n} > ' + fmtCourt(r.eps, 3);
        return '\\left|\\frac{x_n}{y_n} - r\\right| < ' + (Math.abs(r.eps - r.r / 2) < 1e-12 ? '\\frac{r}{2}' : fmtCourt(r.eps, 3));
      case 'racine':
        if (r.cas === 'a') return 'x_n^{1/n} \\le ' + fmtCourt(r.r1, 3);
        if (r.cas === 'b') return 'x_n^{1/n} \\ge 1';
        return null;
      default:
        if (r.cas === 'a') return '\\frac{x_{n+1}}{x_n} \\le ' + fmtCourt(r.r1, 3);
        if (r.cas === 'b') return '\\frac{x_{n+1}}{x_n} \\ge 1';
        return null;
    }
  }

  // ===========================================================================
  //  Panneau : le raisonnement
  // ===========================================================================
  const tx = () => S.texGeneral(etat.X.arbre, { virgule: fr() });
  const ty = () => S.texGeneral(etat.Y.arbre, { virgule: fr() });
  function texR(r) {
    if (!r) return '';
    if (r.r === Infinity) return '+\\infty';
    if (r.rExact) return r.rExact.tex;
    return '\\approx ' + fmtCourt(r.r, 4);
  }
  const egalR = (r) => (r.rExact || r.r === Infinity ? 'r = ' : 'r ') + texR(r);
  function texSuite() {
    const a = etat.X.arbre;
    if (etat.mode === 'racine') {
      const rs = T.racineSimple(a);
      if (rs) {
        let base = S.texGeneral(rs.base, { virgule: fr() });
        const sp = rs.base.t === 'par' ? rs.base.a : rs.base;
        if (sp.t !== 'n' && sp.t !== 'num' && sp.t !== 'div' && sp.t !== 'fn') base = '\\left(' + base + '\\right)';
        if (rs.c === 1) return 'x_n^{1/n} = ' + base;
        if (rs.c === -1) return 'x_n^{1/n} = \\frac{1}{' + base.replace(/^\\left\(|\\right\)$/g, '') + '}';
        return 'x_n^{1/n} = ' + base + '^{' + fmtCourt(rs.c, 3) + '}';
      }
      return 'x_n^{1/n} = \\left(' + tx() + '\\right)^{1/n}';
    }
    if (etat.mode === 'quotient') {
      const a1 = T.remplacerN(a, T.N_PLUS_1);
      const sa = a.t === 'par' ? a.a : a;
      if (sa.t === 'div') {
        const s1 = a1.t === 'par' ? a1.a : a1;
        const vg = { virgule: fr() };
        const P1 = S.texGeneral(s1.a, vg), Q1 = S.texGeneral(s1.b, vg), P = S.texGeneral(sa.a, vg), Q = S.texGeneral(sa.b, vg);
        return '\\frac{x_{n+1}}{x_n} = \\frac{' + P1 + '}{' + Q1 + '} \\cdot \\frac{' + Q + '}{' + P + '}';
      }
      return '\\frac{x_{n+1}}{x_n} = \\frac{' + S.texGeneral(a1, { virgule: fr() }) + '}{' + tx() + '}';
    }
    // x_n / y_n
    const b = etat.Y.arbre;
    const sb = b.t === 'par' ? b.a : b;
    if (sb.t === 'div' && sb.a.t === 'num' && sb.a.q.n === 1n && sb.a.q.d === 1n) {
      const D = S.texGeneral(sb.b, { virgule: fr() });
      const sx = etat.X.arbre.t === 'par' ? etat.X.arbre.a : etat.X.arbre;
      const ax = sx.t === 'add' || sx.t === 'sub' ? '\\left(' + tx() + '\\right)' : tx();
      const dd = /[+-]/.test(D) && !/^\\left/.test(D) ? '\\left(' + D + '\\right)' : D;
      return '\\frac{x_n}{y_n} = ' + ax + ' \\cdot ' + dd;
    }
    return '\\frac{x_n}{y_n} = \\frac{' + tx() + '}{' + ty() + '}';
  }

  function majRaisonnement() {
    const r = etat.res;
    const etapes = [];       // { html, cible, attention }
    let verdict = null;      // { cls, html, sous }
    if (!r) { el.etapes.innerHTML = ''; el.verdict.innerHTML = ''; el.verdict.className = 'verdict'; return; }
    const { rang, min, ok } = rangInfo();
    const L = lettreRang();
    const sx = K_('\\sum x_n'), sy = K_('\\sum y_n');
    const conv = ET('converge', 'converges'), div = ET('diverge', 'diverges');
    const natTexte = (nat) => (nat && nat.nature ? raison(nat) : '');
    const nonConcl = { cls: 'aucune', html: ET('Le test ne permet pas de conclure.', 'The test is inconclusive.') };

    if (r.mode === 'comparaison') {
      if (!r.sens) {
        etapes.push({ html: ET('Ni ', 'Neither ') + K_('x_n \\le y_n') + ET(' ni ', ' nor ') + K_('y_n \\le x_n') + ET(' ne vaut à partir d’un certain rang', ' holds from some rank on') + (r.echec ? ' (' + K_('n = ' + fmtEntierTex(r.echec)) + ')' : '') + '.', cible: 'suite', attention: true });
        verdict = { cls: 'aucune', html: ET('Le test de comparaison ne s’applique pas à ces deux séries.', 'The comparison test does not apply to these two series.') };
      } else {
        const petite = r.sens === 'xy' ? 'x' : 'y', grande = r.sens === 'xy' ? 'y' : 'x';
        etapes.push({ html: ET('Pour ', 'For ') + K_('n \\ge ' + L + ' = ' + fmtEntierTex(rang)) + ', ' + K_('0 \\le ' + petite + '_n \\le ' + grande + '_n') +
          ET(' : les rectangles de ', ': the rectangles of ') + K_(petite + '_n') + ET(' sont dans ceux de ', ' lie inside those of ') + K_(grande + '_n') + '.' +
          (ok ? '' : ' <span class="petit">' + ET('(faux pour ', '(false for ') + K_('n = ' + (min - 1)) + ET(' : déplacez la ligne)', ': move the line)') + '</span>'),
        cible: 'rang', attention: !ok });
        const natG = grande === 'y' ? r.natureY : r.natureX, natP = petite === 'y' ? r.natureY : r.natureX;
        const c = r.conclusion;
        if (c.enonce === 1) {
          etapes.push({ html: K_('\\sum ' + grande + '_n') + ' ' + conv + DP() + natTexte(natG) + '.', cible: 'y' });
          etapes.push({ html: ET('Les aires à partir de ', 'The areas from ') + K_(L) + ET(' : ', ' on: ') + K_('\\sum_{n=' + rang + '}^{M} ' + petite + '_n \\le \\sum_{n \\ge ' + rang + '} ' + grande + '_n') + ET(' pour tout ', ' for all ') + K_('M') + ET(' : les sommes partielles de ', ': the partial sums of ') + K_('\\sum ' + petite + '_n') + ET(' sont bornées.', ' are bounded.'), cible: 'jauges' });
          verdict = { cls: 'conv', html: K_('\\sum ' + c.serie + '_n') + ' ' + conv + ET(' (énoncé (1)).', ' (statement (1)).') };
        } else if (c.enonce === 2) {
          etapes.push({ html: K_('\\sum ' + petite + '_n') + ' ' + div + DP() + natTexte(natP) + '.', cible: 'x' });
          etapes.push({ html: ET('L’aire sous ', 'The area under ') + K_(petite + '_n') + ET(' à partir de ', ' from ') + K_(L) + ET(' est infinie ; celle de ', ' on is infinite; that of ') + K_(grande + '_n') + ET(', plus grande, aussi.', ', larger, is infinite too.'), cible: 'jauges' });
          verdict = { cls: 'div', html: K_('\\sum ' + c.serie + '_n') + ' ' + div + ET(' (énoncé (2)).', ' (statement (2)).') };
        } else {
          etapes.push({ html: (natG && natG.nature === 'div'
            ? K_('\\sum ' + grande + '_n') + ' ' + div + DP() + natTexte(natG) + '. ' + ET('Être plus petite qu’une série divergente ne dit rien : ', 'Being smaller than a divergent series says nothing: ') + K_('\\frac{1}{n^2} \\le \\frac{1}{n}') + ET(' converge, ', ' converges, ') + K_('\\frac{1}{2n} \\le \\frac{1}{n}') + ET(' diverge.', ' diverges.')
            : (natP && natP.nature === 'conv' ? K_('\\sum ' + petite + '_n') + ' ' + conv + '. ' + ET('Être plus grande qu’une série convergente ne dit rien.', 'Being larger than a convergent series says nothing.') : ET('La nature de ', 'The nature of ') + K_('\\sum ' + grande + '_n') + ET(' n’est pas reconnue.', ' is not recognized.'))),
          cible: 'y', attention: true });
          verdict = nonConcl;
        }
        if (verdict && verdict.cls !== 'aucune' && c.serie !== 'x') verdict.sous = ET('Ici, c’est ', 'Here, it is ') + K_('\\sum ' + c.serie + '_n') + ET(' qui est la série « inconnue » : les rôles sont inversés.', ' that is the “unknown” series: the roles are reversed.');
        if (!ok && verdict) verdict.sous = (verdict.sous ? verdict.sous + ' ' : '') + ET('(Pour ce rang, l’hypothèse n’est pas vérifiée.)', '(For this rank, the hypothesis does not hold.)');
      }
    } else if (r.mode === 'limite') {
      etapes.push({ html: ET('On calcule ', 'We compute ') + K_(texSuite()) + (r.r != null ? ' ' + K_('\\to ' + (r.r === Infinity ? '+\\infty' : (r.rExact ? r.rExact.tex : '\\approx ' + fmtCourt(r.r, 4)))) : '') + '. <span class="petit">' + ET('(limite estimée numériquement)', '(limit estimated numerically)') + '</span>', cible: 'suite' });
      if (r.r == null) {
        const lim = r.limite || {};
        etapes.push({ html: lim.type === 'oscille'
          ? ET('La suite oscille entre ', 'The sequence oscillates between ') + K_(fmtCourt(lim.lo, 3)) + ET(' et ', ' and ') + K_(fmtCourt(lim.hi, 3)) + ET(' : la limite n’existe pas, le théorème ne s’applique pas. Si la suite reste bornée, le test de comparaison avec un multiple de ', ': the limit does not exist, the theorem does not apply. If the sequence stays bounded, the comparison test with a multiple of ') + K_('y_n') + ET(' peut servir.', ' can help.')
          : ET('Impossible d’estimer la limite.', 'The limit could not be estimated.'), cible: 'suite', attention: true });
        verdict = nonConcl;
      } else if (r.r > 0 && r.r < Infinity) {
        const epsTex = Math.abs(r.eps - r.r / 2) < 1e-12 ? '\\frac{r}{2}' : fmtCourt(r.eps, 3);
        etapes.push({ html: K_('r > 0') + ET(' : avec ', ': with ') + K_('\\varepsilon = ' + epsTex) + ', ' + K_(L + ' = ' + (min != null ? fmtEntierTex(rang) : '?')) + ET(' convient : ', ' works: ') + K_('r - \\varepsilon < \\frac{x_n}{y_n} < r + \\varepsilon') + ET(' pour ', ' for ') + K_('n \\ge ' + L) + '.', cible: 'bande', attention: !ok });
        etapes.push({ html: ET('Donc ', 'So ') + K_('(r - \\varepsilon)\\, y_n < x_n < (r + \\varepsilon)\\, y_n') + ET(' : les rectangles dorés restent dans le tube vert.', ': the gold rectangles stay in the green tube.'), cible: 'y' });
        const nY = r.natureY;
        if (nY && nY.nature) {
          etapes.push({ html: sy + ' ' + (nY.nature === 'conv' ? conv : div) + DP() + natTexte(nY) + '.', cible: 'jauges' });
          etapes.push({ html: nY.nature === 'conv'
            ? ET('Comme ', 'Since ') + K_('x_n < (r + \\varepsilon)\\, y_n') + ET(' et que ', ' and ') + K_('\\sum (r+\\varepsilon)\\, y_n') + ET(' converge, le test de comparaison donne la convergence de ', ' converges, the comparison test gives the convergence of ') + sx + '.'
            : ET('Comme ', 'Since ') + K_('y_n < \\frac{1}{r - \\varepsilon}\\, x_n') + ET(' et que ', ' and ') + sy + ET(' diverge, le test de comparaison donne la divergence de ', ' diverges, the comparison test gives the divergence of ') + sx + '.', cible: 'jauges' });
          verdict = { cls: nY.nature === 'conv' ? 'conv' : 'div', html: sx + ' ' + (nY.nature === 'conv' ? conv : div) + ET(' (énoncé (1)).', ' (statement (1)).') };
        } else {
          etapes.push({ html: ET('La nature de ', 'The nature of ') + sy + ET(' n’est pas reconnue : choisissez une série de comparaison connue (une ', ' is not recognized: choose a known comparison series (a ') + K_('p') + ET('-série, une série géométrique).', '-series, a geometric series).'), cible: 'y', attention: true });
          verdict = nonConcl;
        }
      } else if (r.r === 0) {
        etapes.push({ html: K_('r = 0') + ET(' : avec ', ': with ') + K_('\\varepsilon = ' + fmtCourt(r.eps, 3)) + ', ' + K_('x_n < \\varepsilon\\, y_n') + ET(' pour ', ' for ') + K_('n \\ge ' + L + ' = ' + (min != null ? fmtEntierTex(rang) : '?')) + '.', cible: 'bande', attention: !ok });
        const nY = r.natureY;
        if (nY && nY.nature === 'conv') {
          etapes.push({ html: sy + ' ' + conv + DP() + natTexte(nY) + ET('. Les rectangles dorés sont sous ceux de ', '. The gold rectangles lie under those of ') + K_('\\varepsilon\\, y_n') + ET(', d’aire finie.', ', whose area is finite.'), cible: 'jauges' });
          verdict = { cls: 'conv', html: sx + ' ' + conv + ET(' (énoncé (2)).', ' (statement (2)).') };
        } else {
          etapes.push({ html: (nY && nY.nature === 'div' ? sy + ' ' + div + DP() + natTexte(nY) + '. ' : '') + ET('Avec ', 'With ') + K_('r = 0') + ET(', seule la majoration ', ', only the bound ') + K_('x_n < \\varepsilon\\, y_n') + ET(' reste : elle ne dit rien si ', ' remains: it says nothing if ') + sy + ET(' diverge. Essayez une autre série de comparaison.', ' diverges. Try another comparison series.'), cible: 'y', attention: true });
          verdict = nonConcl;
        }
      } else {
        // r = +∞
        etapes.push({ html: K_('r = +\\infty') + ET(' : le théorème ne s’applique pas tel quel, mais ', ': the theorem does not apply as such, but ') + K_('x_n > M y_n') + ET(' pour ', ' for ') + K_('n \\ge ' + L + ' = ' + (min != null ? fmtEntierTex(rang) : '?')) + '.', cible: 'bande', attention: !ok });
        const nY = r.natureY;
        if (nY && nY.nature === 'div') {
          etapes.push({ html: sy + ' ' + div + DP() + natTexte(nY) + ET('. Par le test de comparaison (2), ', '. By the comparison test (2), ') + sx + ' ' + div + '.', cible: 'jauges' });
          verdict = { cls: 'div', html: sx + ' ' + div + ET(' (test de comparaison).', ' (comparison test).') };
        } else {
          etapes.push({ html: ET('Être plus grande qu’une série convergente ne dit rien.', 'Being larger than a convergent series says nothing.'), cible: 'y', attention: true });
          verdict = nonConcl;
        }
      }
    } else {
      // racine et quotient
      const estQ = r.mode === 'quotient';
      etapes.push({ html: ET('On calcule ', 'We compute ') + K_(texSuite()) + (r.r != null ? ' ' + K_('\\to ' + egalR(r)) : '') + '. <span class="petit">' + ET('(limite estimée numériquement)', '(limit estimated numerically)') + '</span>', cible: 'suite' });
      if (r.cas === 'a') {
        const r1 = fmtCourt(r.r1, 3);
        etapes.push({ html: K_('r < 1') + ET(' : on choisit ', ': choose ') + K_('r_1 = ' + r1) + ET(' entre ', ' between ') + K_('r') + ET(' et 1 (glissez la ligne dorée).', ' and 1 (drag the gold line).'), cible: 'r1' });
        etapes.push({ html: ET('À partir de ', 'From ') + K_('K = ' + (min != null ? fmtEntierTex(rang) : '?')) + ', ' + K_(estQ ? '\\frac{x_{n+1}}{x_n} \\le r_1' : 'x_n^{1/n} \\le r_1') + '.' + (ok ? '' : ' <span class="petit">' + (min != null ? ET('(faux pour ', '(false for ') + K_('n = ' + (min - 1)) + ')' : ET('(aucun rang trouvé)', '(no rank found)')) + '</span>'), cible: 'rang', attention: !ok });
        if (estQ) {
          etapes.push({ html: ET('Par récurrence, ', 'By induction, ') + K_('x_n \\le x_K\\, r_1^{\\,n-K}') + ET(' pour ', ' for ') + K_('n \\ge K') + ET(' : les rectangles sont sous ceux d’une série géométrique.', ': the rectangles lie under those of a geometric series.'), cible: 'y' });
          etapes.push({ html: ET('La série géométrique converge, car ', 'The geometric series converges, since ') + K_('0 < r_1 < 1') + DP() + K_('\\sum_{n \\ge K} x_K\\, r_1^{\\,n-K} = \\frac{x_K}{1 - r_1}') + (Number.isFinite(xVal(rang)) ? ' ' + K_('\\approx ' + fmtTex(xVal(rang) / (1 - r.r1), 4)) : '') + '.', cible: 'jauges' });
        } else {
          etapes.push({ html: ET('Donc ', 'So ') + K_('x_n \\le r_1^{\\,n}') + ET(' pour ', ' for ') + K_('n \\ge K') + ET(' : les rectangles sont sous ceux de la série géométrique ', ': the rectangles lie under those of the geometric series ') + K_('\\sum r_1^{\\,n}') + '.', cible: 'y' });
          etapes.push({ html: ET('Elle converge, car ', 'It converges, since ') + K_('0 \\le r_1 < 1') + DP() + K_('\\sum_{n \\ge K} r_1^{\\,n} = \\frac{r_1^{\\,K}}{1 - r_1}') + ' ' + K_('\\approx ' + fmtTex(Math.exp(rang * Math.log(r.r1)) / (1 - r.r1), 4)) + '.', cible: 'jauges' });
        }
        verdict = { cls: 'conv', html: sx + ' ' + conv + ET(' (test de comparaison avec une série géométrique).', ' (comparison test with a geometric series).') };
      } else if (r.cas === 'b') {
        etapes.push({ html: K_(r.r === Infinity ? 'r = +\\infty' : 'r > 1') + ET(' : à partir de ', ': from ') + K_('K = ' + (min != null ? fmtEntierTex(rang) : '?')) + ', ' + K_(estQ ? '\\frac{x_{n+1}}{x_n} \\ge 1' : 'x_n^{1/n} \\ge 1') + '.' + (r.r === Infinity ? ' <span class="petit">' + ET('(Le corollaire ne s’applique pas tel quel ; l’énoncé (b) du test, oui.)', '(The corollary does not apply as such; statement (b) of the test does.)') + '</span>' : ''), cible: 'rang', attention: !ok });
        etapes.push({ html: ET('Donc ', 'So ') + K_(estQ ? 'x_n \\ge x_K > 0' : 'x_n \\ge 1') + ET(' pour ', ' for ') + K_('n \\ge K') + ET(' : les rectangles ne rapetissent pas, ', ': the rectangles do not shrink, ') + K_('x_n \\not\\to 0') + '.', cible: 'y' });
        etapes.push({ html: ET('L’aire à partir de ', 'The area from ') + K_('K') + ET(' est infinie : par le test du terme général, ', ' on is infinite: by the general term test, ') + sx + ' ' + div + '.', cible: 'jauges' });
        verdict = { cls: 'div', html: sx + ' ' + div + '.' };
      } else if (r.cas === 'r1') {
        etapes.push({ html: K_('r = 1') + ET(' : le test ne permet pas de conclure. Les ', ': the test is inconclusive. The ') + K_('p') + ET('-séries donnent toutes ', '-series all give ') + K_('r = 1') + ET(', qu’elles convergent (', ', whether they converge (') + K_('\\sum \\frac{1}{n^2}') + ET(') ou non (', ') or not (') + K_('\\sum \\frac{1}{n}') + ').', cible: 'suite', attention: true });
        etapes.push({ html: ET('Essayez un test de comparaison (onglets 1 et 2).', 'Try a comparison test (tabs 1 and 2).'), cible: null });
        verdict = nonConcl;
      } else {
        const lim = r.limite || {};
        etapes.push({ html: lim.type === 'oscille'
          ? ET('La suite oscille entre ', 'The sequence oscillates between ') + K_(fmtCourt(lim.lo, 3)) + ET(' et ', ' and ') + K_(fmtCourt(lim.hi, 3)) + ET(' : la limite n’existe pas, le corollaire ne s’applique pas.', ': the limit does not exist, the corollary does not apply.')
          : ET('Impossible d’estimer la limite.', 'The limit could not be estimated.'), cible: 'suite', attention: true });
        verdict = nonConcl;
      }
    }
    el.etapes.innerHTML = etapes.map((e) => '<li' + (e.cible ? ' class="lie' + (e.attention ? ' attention' : '') + '" data-cible="' + e.cible + '"' : (e.attention ? ' class="attention"' : '')) + '>' + e.html + '</li>').join('');
    if (verdict) {
      el.verdict.className = 'verdict ' + verdict.cls;
      el.verdict.innerHTML = verdict.html + (verdict.sous ? '<span class="sous">' + verdict.sous + '</span>' : '');
    }
    // pour information : la nature de Σ x_n quand le test ne conclut pas
    const natX = r.natureX;
    const conclut = verdict && verdict.cls !== 'aucune' && r.conclusion && r.conclusion.serie === 'x';
    if (!conclut && natX && natX.nature) {
      el.infoNature.hidden = false;
      el.infoNature.innerHTML = ET('Pour information : ', 'For information: ') + sx + ' ' + (natX.nature === 'conv' ? conv : div) + ' (' + texNature(natX) + ').';
    } else if (!conclut && etat.X && /log/.test(etat.srcX) && (!natX || !natX.nature)) {
      el.infoNature.hidden = false;
      el.infoNature.innerHTML = ET('Pour une série comme ', 'For a series like ') + K_('\\sum \\frac{1}{n \\log n}') + ET(', aucune comparaison avec une ' + K_('p') + '-série ne conclut, et la racine comme le quotient donnent ' + K_('r = 1') + ' : on utilise le test de l’intégrale (section 3.3).', ', no comparison with a ' + K_('p') + '-series concludes, and both the root and the ratio tests give ' + K_('r = 1') + ': use the integral test instead (Section 3.3).');
    } else el.infoNature.hidden = true;
  }

  // ===========================================================================
  //  Mise à jour générale
  // ===========================================================================
  function dessiner() {
    if (!etat.TX) return;
    dessinerAires();
    dessinerSuite();
    etat.nouveau = false;
    appliquerAccent();
  }
  function majTout() {
    majTitres();
    majPanneauTest();
    majRaisonnement();
    majJauges();
    dessiner();
    majOnglets();
  }
  function majOnglets() {
    el.onglets.forEach((b) => b.setAttribute('aria-selected', b.dataset.mode === etat.mode ? 'true' : 'false'));
  }
  function appliquerAccent() {
    const c = etat.accent;
    [el.aires, el.suite].forEach((s) => s.setAttribute('data-accent', c || ''));
    el.jauges.classList.toggle('accent', c === 'jauges');
  }

  function changerMode(mode) {
    if (!MODES.includes(mode) || mode === etat.mode) return;
    arreterAddition();
    etat.mode = mode;
    etat.N = null; etat.eps = null; etat.r1 = null;
    etat.base = null;
    if (AVEC_Y[mode] && !etat.Y) {
      el.champY.value = etat.srcY || Y_DEFAUT;
      try { etat.Y = analyserSource(el.champY.value); } catch (_) { etat.Y = null; }
      if (etat.Y) etat.TY = T.tabuler(etat.Y, etat.n0);
    }
    analyserTout();
    etat.nouveau = true;
    recadrer(true);
    majPanneauSeries();
    majTout();
    majURLDiffere();
    annoncer(MSG[etat.langue].titreTest[mode]);
  }

  function choisirExemple(i) {
    const ex = EXEMPLES[i];
    if (!ex) return;
    if (ex.mode !== etat.mode) { etat.mode = ex.mode; etat.base = null; }
    el.champX.value = ex.x;
    if (ex.y) el.champY.value = ex.y;
    chargerSeries(ex.x, ex.y || el.champY.value.trim());
  }

  // Changer le rang, ε ou r1
  function changerRang(n) {
    const v = clamp(Math.round(n), etat.n0, etat.TX.M - 2);
    if (etat.N === v) return;
    etat.N = v;
    arreterAddition();
    majTitres(); majPanneauTest(); majRaisonnement(); majJauges(); dessiner();
    majURLDiffere();
  }
  function changerEps(v) {
    const r = etat.res;
    if (!r || r.r == null) return;
    let lo, hi;
    if (r.r === 0) { lo = 0.02; hi = 2; } else if (r.r === Infinity) { lo = 0.1; hi = 10; } else { lo = r.r / 50; hi = r.r * 0.98; }
    etat.eps = clamp(v, lo, hi);
    etat.N = null;
    arreterAddition();
    analyserTout();
    majTitres(); majPanneauTest(); majRaisonnement(); majJauges(); dessiner();
    majURLDiffere();
  }
  function changerR1(v) {
    const r = etat.res;
    if (!r || r.cas !== 'a') return;
    etat.r1 = clamp(v, r.r + 1e-6, 0.995);
    etat.N = null;
    arreterAddition();
    analyserTout();
    const { rang } = rangInfo();
    const vb = etat.anim ? etat.anim.vers : etat.vue;
    if (rang > vb.b - 3 || rang < vb.a) allerVers(vueDefaut(), false);
    majTitres(); majPanneauTest(); majRaisonnement(); majJauges(); dessiner();
    majURLDiffere();
  }

  // ===========================================================================
  //  Souris : survol, glisser (rang, r1, ε, déplacement), molette, clic
  // ===========================================================================
  function posDans(svgEl, ev) {
    const r = svgEl.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }
  function quelGraphe(svgEl) { return svgEl === el.aires ? 'aires' : 'suite'; }
  function prise(svgEl, p) {
    const g = geometrie(quelGraphe(svgEl));
    const { rang } = rangInfo();
    const xr = g.X(rang - 0.5);
    if (p.y >= g.y1 - 8 && p.y <= g.y0 + 8 && (Math.abs(p.x - xr) <= 9 || (svgEl === el.aires && p.x >= xr && p.x <= xr + 64 && p.y <= g.y1 + 26))) return { type: 'rang' };
    if (svgEl === el.suite && etat.geoSuite) {
      const r = etat.res;
      const E = etat.geoSuite.E;
      const proche = (v) => Number.isFinite(v) && Math.abs(E.Y(v) - p.y) <= 8;
      if (r && (r.mode === 'racine' || r.mode === 'quotient') && r.cas === 'a' && proche(r.r1)) return { type: 'r1' };
      if (r && r.mode === 'limite' && r.r != null) {
        if (r.r === 0 || r.r === Infinity) { if (proche(r.eps)) return { type: 'eps' }; }
        else if (proche(r.r + r.eps)) return { type: 'eps' };
        else if (proche(r.r - r.eps)) return { type: 'eps-bas' };
      }
    }
    return null;
  }
  function brancherGraphe(svgEl) {
    svgEl.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      const p = posDans(svgEl, ev);
      const pr = prise(svgEl, p);
      svgEl.setPointerCapture(ev.pointerId);
      if (pr) etat.glisse = Object.assign({ svg: svgEl }, pr);
      else etat.glisse = { type: 'pan', svg: svgEl, depart: p, vue: Object.assign({}, etat.vue), bouge: false };
      svgEl.classList.add('glisse');
      cacherBulle();
    });
    svgEl.addEventListener('pointermove', (ev) => {
      const p = posDans(svgEl, ev);
      const G = etat.glisse;
      const g = geometrie(quelGraphe(svgEl));
      if (G && G.svg === svgEl) {
        if (G.type === 'rang') changerRang(g.nDe(p.x) + 0.5);
        else if (G.type === 'r1' && etat.geoSuite) changerR1(etat.geoSuite.E.v(p.y));
        else if (G.type === 'eps' && etat.geoSuite) {
          const r = etat.res, v = etat.geoSuite.E.v(p.y);
          changerEps(r.r === 0 || r.r === Infinity ? v : v - r.r);
        } else if (G.type === 'eps-bas' && etat.geoSuite) changerEps(etat.res.r - etat.geoSuite.E.v(p.y));
        else if (G.type === 'pan') {
          const dx = p.x - G.depart.x;
          if (Math.abs(dx) > 4) G.bouge = true;
          if (G.bouge) {
            const dn = -dx / g.w;
            etat.vueAuto = false;
            etat.anim = null;
            const larg = G.vue.b - G.vue.a;
            let a = G.vue.a + dn;
            a = Math.max(etat.n0 - 0.6, a);
            etat.vue = { a, b: a + larg };
            svgEl.classList.add('deplace');
            dessiner();
          }
        }
        return;
      }
      // survol
      const pr = prise(svgEl, p);
      svgEl.classList.toggle('sur-ligne-v', !!pr && pr.type === 'rang');
      svgEl.classList.toggle('sur-ligne-h', !!pr && pr.type !== 'rang');
      const n = Math.round(g.nDe(p.x));
      const { deb, fin } = nVisibles();
      const dedans = p.x >= g.x0 && p.x <= g.x1 && p.y >= g.y1 - 10 && p.y <= g.y0;
      const ns = dedans && n >= deb && n <= fin ? n : null;
      if (ns !== etat.survol) { etat.survol = ns; dessiner(); }
      if (ns !== null && !pr) montrerBulle(ns, ev); else cacherBulle();
    });
    const fin = (ev) => {
      const G = etat.glisse;
      if (!G || G.svg !== svgEl) return;
      etat.glisse = null;
      svgEl.classList.remove('glisse', 'deplace');
      if (G.type === 'pan' && !G.bouge && ev.type === 'pointerup') {
        // un clic sur un rectangle : le rang devient ce n
        const g = geometrie(quelGraphe(svgEl));
        const p = posDans(svgEl, ev);
        const n = Math.round(g.nDe(p.x));
        const { deb, fin: f } = nVisibles();
        if (p.x >= g.x0 && p.x <= g.x1 && n >= deb && n <= f) changerRang(n);
      }
    };
    svgEl.addEventListener('pointerup', fin);
    svgEl.addEventListener('pointercancel', fin);
    svgEl.addEventListener('pointerleave', () => {
      if (etat.glisse) return;
      if (etat.survol !== null) { etat.survol = null; dessiner(); }
      cacherBulle();
    });
    svgEl.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const g = geometrie(quelGraphe(svgEl));
      const p = posDans(svgEl, ev);
      const facteur = Math.exp(clamp(ev.deltaY, -120, 120) * 0.0022);
      zoomer(facteur, g.nDe(p.x));
    }, { passive: false });
    svgEl.addEventListener('dblclick', () => recadrer(false));
  }

  function montrerBulle(n, ev) {
    const zone = el.zone.getBoundingClientRect();
    const lignes = [];
    const ex = texTerme(etat.X, n);
    const x = xVal(n);
    lignes.push(K_('x_{' + n + '} = ' + (ex || '?') + (Number.isFinite(x) && ex && !/^[\d{},.]+$/.test(ex) ? ' \\approx ' + fmtCourt(x, 4) : '')));
    const b = bornes(n);
    const r = etat.res;
    if (r && r.mode === 'comparaison' && etat.Y) {
      const ey = texTerme(etat.Y, n);
      lignes.push(K_('y_{' + n + '} = ' + (ey || '?') + (ey && !/^[\d{},.]+$/.test(ey) ? ' \\approx ' + fmtCourt(yVal(n), 4) : '')));
    } else if (b) {
      if (b.tube) lignes.push(K_('(r \\pm \\varepsilon)\\, y_{' + n + '} : ' + fmtCourt(b.bas, 3) + ' \\ldots ' + fmtCourt(b.haut, 3)));
      else if (Number.isFinite(b.haut)) {
        const K = rangInfo().rang;
        lignes.push(K_((r.mode === 'racine' ? 'r_1^{\\,' + n + '}' : r.mode === 'quotient' ? 'x_{' + K + '}\\, r_1^{\\,' + (n - K) + '}' : '\\varepsilon\\, y_{' + n + '}') + ' \\approx ' + fmtCourt(b.haut, 4)));
      } else if (Number.isFinite(b.bas)) lignes.push(K_((r.mode === 'racine' ? '1' : r.mode === 'quotient' ? 'x_{' + rangInfo().rang + '}' : 'M y_{' + n + '}') + ' \\approx ' + fmtCourt(b.bas, 4)));
    }
    const s = suiteVal(n);
    if (Number.isFinite(s)) {
      const nom = etat.mode === 'racine' ? 'x_{' + n + '}^{1/' + n + '}' : etat.mode === 'quotient' ? '\\frac{x_{' + (n + 1) + '}}{x_{' + n + '}}' : '\\frac{x_{' + n + '}}{y_{' + n + '}}';
      lignes.push('<span class="petit">' + K_(nom + ' \\approx ' + fmtCourt(s, 4)) + '</span>');
    }
    const c = conditionOK(n);
    el.bulle.className = 'bulle' + (c === false && n >= rangInfo().rang ? ' echec' : '');
    el.bulle.innerHTML = lignes.join('<br>');
    el.bulle.hidden = false;
    const bw = el.bulle.offsetWidth, bh = el.bulle.offsetHeight;
    let left = ev.clientX - zone.left + 16, top = ev.clientY - zone.top + 14;
    if (left + bw > zone.width - 6) left = ev.clientX - zone.left - bw - 16;
    if (top + bh > zone.height - 6) top = ev.clientY - zone.top - bh - 12;
    el.bulle.style.left = Math.max(4, left) + 'px';
    el.bulle.style.top = Math.max(4, top) + 'px';
  }
  function cacherBulle() { el.bulle.hidden = true; }

  // ===========================================================================
  //  Adresse (partage), annonces
  // ===========================================================================
  function adresse() {
    const q = new URLSearchParams();
    q.set('lang', etat.langue);
    if (etat.mode !== 'comparaison') q.set('t', etat.mode);
    if (etat.srcX !== X_DEFAUT) q.set('x', etat.srcX);
    if (avecY() && etat.srcY !== Y_DEFAUT) q.set('y', etat.srcY);
    if (etat.N != null) q.set('N', String(etat.N));
    if (etat.eps != null) q.set('eps', String(+etat.eps.toPrecision(6)));
    if (etat.r1 != null) q.set('r1', String(+etat.r1.toPrecision(6)));
    if (INTEGRE) q.set('embed', '1');
    if (MODE_TEST) q.set('test', '1');
    return location.pathname + '?' + q.toString() + location.hash;
  }
  function majURL() {
    try { history.replaceState(null, '', adresse()); } catch (_) { /* file:// */ }
  }
  function majURLDiffere() {
    clearTimeout(majURLDiffere.m);
    majURLDiffere.m = setTimeout(majURL, 400);
  }
  // Dans une page de mathopo.ca, le lien est celui de la page (tests-convergence.html?t=…&x=…),
  // qui passe ces paramètres à l'application ; sinon, celui de l'application.
  function lienAPartager() {
    if (INTEGRE && window.parent !== window) {
      try {
        const q = new URL(adresse(), location.href).searchParams;
        q.delete('lang'); q.delete('test'); q.delete('embed');
        const s = q.toString();
        return parent.location.origin + parent.location.pathname + (s ? '?' + s : '');
      } catch (_) { /* page d'une autre origine */ }
    }
    return location.href;
  }
  async function copierLien() {
    majURL();
    const url = lienAPartager();
    try {
      await navigator.clipboard.writeText(url);
      el.btnLien.innerHTML = t('lienCopie');
      el.btnLien.classList.add('confirme');
      setTimeout(() => { el.btnLien.innerHTML = (TRAD[etat.langue].btnLien || TRAD.fr.btnLien); el.btnLien.classList.remove('confirme'); }, 1800);
    } catch (_) {
      el.btnLien.title = t('lienEchec');
    }
  }
  function annoncer(texte) {
    clearTimeout(annoncer.m);
    annoncer.m = setTimeout(() => { el.annonce.textContent = texte; }, 120);
  }

  // ===========================================================================
  //  Langue
  // ===========================================================================
  function capturerFrancais() {
    document.querySelectorAll('[data-i18n]').forEach((e) => { TRAD.fr[e.dataset.i18n] = e.innerHTML; });
    document.querySelectorAll('[data-i18n-title]').forEach((e) => { TRAD.fr['title:' + e.dataset.i18nTitle] = e.title; });
    document.querySelectorAll('[data-i18n-aria]').forEach((e) => { TRAD.fr['aria:' + e.dataset.i18nAria] = e.getAttribute('aria-label'); });
  }
  function appliquerLangue(lang) {
    etat.langue = TRAD[lang] ? lang : 'fr';
    document.documentElement.lang = etat.langue;
    const d = Object.assign({}, TRAD.fr, TRAD[etat.langue]);
    document.querySelectorAll('[data-i18n]').forEach((e) => { const v = d[e.dataset.i18n]; if (v !== undefined) e.innerHTML = v; });
    document.querySelectorAll('[data-i18n-title]').forEach((e) => { const v = d['title:' + e.dataset.i18nTitle]; if (v !== undefined) e.title = v; });
    document.querySelectorAll('[data-i18n-aria]').forEach((e) => { const v = d['aria:' + e.dataset.i18nAria]; if (v !== undefined) e.setAttribute('aria-label', v); });
    document.title = t('titrePage');
    el.btnLangue.textContent = t('btnLangue');
    el.btnLangue.title = t('btnLangueTitre');
    rendreMaths(el.aide);
    if (etat.addition) arreterAddition();
    if (etat.TX) { majPanneauSeries(); majTout(); }
  }
  function changerLangue(lang) {
    appliquerLangue(lang);
    majURLDiffere();
  }

  // ===========================================================================
  //  Événements
  // ===========================================================================
  function brancher() {
    el.onglets.forEach((b) => b.addEventListener('click', () => changerMode(b.dataset.mode)));
    el.onglets.forEach((b, i) => b.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const j = (i + (e.key === 'ArrowRight' ? 1 : 3)) % 4;
        el.onglets[j].focus();
        changerMode(el.onglets[j].dataset.mode);
      }
    }));
    el.exemples.addEventListener('click', (e) => {
      const b = e.target.closest('.exemple');
      if (b) choisirExemple(+b.dataset.i);
    });
    const brancherChamp = (champ, qui) => {
      let minut = null;
      const appliquer = () => {
        const sx = el.champX.value.trim(), sy = el.champY.value.trim();
        if (qui === 'x' && sx === etat.srcX) { cacherErreur('x'); return; }
        if (qui === 'y' && sy === etat.srcY && etat.Y) { cacherErreur('y'); return; }
        chargerSeries(sx, sy, { garderVue: false });
      };
      champ.addEventListener('input', () => {
        clearTimeout(minut);
        minut = setTimeout(() => {
          try { T.creerSerie(champ.value); } catch (e) { montrerErreur(qui, e); return; }
          appliquer();
        }, 380);
      });
      champ.addEventListener('keydown', (e) => { if (e.key === 'Enter') { clearTimeout(minut); appliquer(); champ.blur(); } });
    };
    brancherChamp(el.champX, 'x');
    brancherChamp(el.champY, 'y');

    el.curseurN.addEventListener('input', () => changerRang(+el.curseurN.value));
    el.curseurEps.addEventListener('input', () => changerEps(+el.curseurEps.value));
    el.curseurR1.addEventListener('input', () => changerR1(+el.curseurR1.value));

    el.btnAdditionner.addEventListener('click', lancerAddition);
    el.btnZoomMoins.addEventListener('click', () => zoomer(1.6));
    el.btnZoomPlus.addEventListener('click', () => zoomer(1 / 1.6));
    el.btnRecadrer.addEventListener('click', () => recadrer(false));
    el.btnQueue.addEventListener('click', voirQueue);
    el.caseLog.addEventListener('change', () => { etat.log = el.caseLog.checked; majTitres(); dessiner(); });
    el.btnLien.addEventListener('click', copierLien);

    // les étapes du raisonnement mettent en valeur une partie des graphes
    el.etapes.addEventListener('pointerover', (e) => {
      const li = e.target.closest('li[data-cible]');
      const c = li ? li.dataset.cible : null;
      if (c !== etat.accent) { etat.accent = c; appliquerAccent(); }
    });
    el.etapes.addEventListener('pointerleave', () => { etat.accent = null; appliquerAccent(); });

    brancherGraphe(el.aires);
    brancherGraphe(el.suite);

    el.btnAide.addEventListener('click', ouvrirAide);
    el.btnFermerAide.addEventListener('click', () => el.aide.close());
    el.aide.addEventListener('click', (e) => { if (e.target === el.aide) el.aide.close(); });
    el.btnPanneau.addEventListener('click', basculerPanneau);
    el.btnPleinEcran.addEventListener('click', () => {
      try {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
      } catch (_) { /* plein écran refusé */ }
    });
    el.btnLangue.addEventListener('click', () => changerLangue(etat.langue === 'fr' ? 'en' : 'fr'));

    document.addEventListener('keydown', (e) => {
      if (el.aide.open) return;
      const cible = e.target;
      if (cible && (cible.tagName === 'INPUT' && cible.type !== 'range' && cible.type !== 'checkbox' || cible.tagName === 'TEXTAREA' || cible.isContentEditable)) return;
      if (cible && cible.type === 'range') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const r = etat.res;
      switch (e.key) {
        case '1': case '2': case '3': case '4': changerMode(MODES[+e.key - 1]); break;
        case 'ArrowLeft': e.preventDefault(); changerRang(rangInfo().rang - 1); break;
        case 'ArrowRight': e.preventDefault(); changerRang(rangInfo().rang + 1); break;
        case 'ArrowUp': case 'ArrowDown': {
          if (!r) break;
          const s = e.key === 'ArrowUp' ? 1 : -1;
          if (r.cas === 'a') { e.preventDefault(); changerR1(r.r1 + s * Math.max(0.002, (1 - r.r) / 50)); }
          else if (r.mode === 'limite' && r.eps) { e.preventDefault(); changerEps(r.eps * (s > 0 ? 1.08 : 1 / 1.08)); }
          break;
        }
        case 'l': case 'L': el.caseLog.checked = !el.caseLog.checked; etat.log = el.caseLog.checked; majTitres(); dessiner(); break;
        case 'f': case 'F': recadrer(false); break;
        case 'q': case 'Q': voirQueue(); break;
        case '+': case '=': zoomer(1 / 1.6); break;
        case '-': zoomer(1.6); break;
        case ' ': if (cible && cible.tagName === 'BUTTON') return; e.preventDefault(); lancerAddition(); break;
        case 'Escape': arreterAddition(true); break;
        case '?': ouvrirAide(); break;
        case 'p': case 'P': basculerPanneau(); break;
        default: break;
      }
    });

    const ro = window.ResizeObserver ? new ResizeObserver(redimensionner) : null;
    if (ro) { ro.observe(el.consAires); ro.observe(el.consSuite); }
    else window.addEventListener('resize', redimensionner);
  }
  function ouvrirAide() {
    el.aide.showModal();
    el.aide.scrollTop = 0;
    el.btnFermerAide.focus({ preventScroll: true });
  }
  function basculerPanneau() {
    document.body.classList.toggle('sans-panneau');
    el.btnPanneau.setAttribute('aria-pressed', document.body.classList.contains('sans-panneau') ? 'false' : 'true');
  }
  function redimensionner() {
    const ra = el.consAires.getBoundingClientRect(), rs = el.consSuite.getBoundingClientRect();
    etat.tailles = {
      aires: { W: Math.max(220, Math.round(ra.width)), H: Math.max(150, Math.round(ra.height)) },
      suite: { W: Math.max(220, Math.round(rs.width)), H: Math.max(110, Math.round(rs.height)) },
    };
    if (etat.TX) dessiner();
  }

  // ===========================================================================
  //  Démarrage
  // ===========================================================================
  const params = new URLSearchParams(location.search);
  capturerFrancais();
  etat.langue = params.get('lang') === 'en' ? 'en' : 'fr';
  const t0 = params.get('t');
  if (MODES.includes(t0)) etat.mode = t0;
  rendreMaths(document.querySelector('.onglets'));
  brancher();
  redimensionner();
  appliquerLangue(etat.langue);
  const x0 = params.get('x'), y0 = params.get('y');
  el.champX.value = x0 || (etat.mode === 'comparaison' ? X_DEFAUT : EXEMPLES.find((e) => e.mode === etat.mode).x);
  el.champY.value = y0 || (etat.mode === 'limite' && !x0 ? EXEMPLES.find((e) => e.mode === 'limite').y : Y_DEFAUT);
  if (!x0 && etat.mode === 'limite') el.champX.value = EXEMPLES.find((e) => e.mode === 'limite').x;
  if (!chargerSeries(el.champX.value.trim(), el.champY.value.trim())) {
    el.champX.value = X_DEFAUT; el.champY.value = Y_DEFAUT;
    chargerSeries(X_DEFAUT, Y_DEFAUT);
  }
  // paramètres d'adresse : rang, ε, r1
  const N0 = parseInt(params.get('N'), 10), e0 = parseFloat(params.get('eps')), r10 = parseFloat(params.get('r1'));
  if (Number.isFinite(e0)) changerEps(e0);
  if (Number.isFinite(r10)) changerR1(r10);
  if (Number.isFinite(N0)) changerRang(N0);
  if (Number.isFinite(e0) || Number.isFinite(r10) || Number.isFinite(N0)) recadrer(true);

  // Accès pour les tests automatisés (Playwright) et la console
  window.__tc = { etat, changerMode, choisirExemple, changerRang, changerEps, changerR1, chargerSeries, lancerAddition, arreterAddition, rangInfo, recadrer, zoomer, changerLangue, EXEMPLES, T };

  // ===========================================================================
  //  Tests automatiques (index.html?test=1)
  // ===========================================================================
  if (MODE_TEST) setTimeout(lancerTests, 50);
  function lancerTests() {
    const sortie = [];
    let ok = 0, ko = 0;
    const verifier = (nom, cond, detail) => {
      if (cond) ok++; else { ko++; sortie.push('✗ ' + nom + (detail ? ' — ' + detail : '')); }
    };
    const choisir = (mode, x, y) => {
      if (etat.mode !== mode) changerMode(mode);
      el.champX.value = x; if (y) el.champY.value = y;
      chargerSeries(x, y || el.champY.value.trim());
      return etat.res;
    };
    try {
      // 1. Comparaison (notes 3.1)
      let r = choisir('comparaison', '1/(n^2+n)', '1/n^2');
      verifier('comparaison : sens', r.sens === 'xy');
      verifier('comparaison : N = 1', rangInfo().rang === 1 && rangInfo().ok);
      verifier('comparaison : converge', el.verdict.classList.contains('conv'));
      const tot = lignesJauges();
      verifier('jauge y : π²/6', Math.abs(tot[1].total - Math.PI ** 2 / 6) < 1e-8, String(tot[1].total));
      verifier('jauge x : 1', Math.abs(tot[0].total - 1) < 1e-8, String(tot[0].total));
      // 2. Comparaison : rôles inversés, divergence
      r = choisir('comparaison', '1/sqrt(n)', '1/n');
      verifier('comparaison inversée : sens yx', r.sens === 'yx');
      verifier('comparaison inversée : diverge', el.verdict.classList.contains('div'));
      // 3. Piège : 1/(n log n) ≤ 1/n
      r = choisir('comparaison', '1/(n log n)', '1/n');
      verifier('piège : n0 = 2', etat.n0 === 2);
      verifier('piège : N = 3', rangInfo().rang === 3, String(rangInfo().rang));
      verifier('piège : aucune conclusion', el.verdict.classList.contains('aucune'));
      // 4. Rang trop petit
      choisir('comparaison', '1/n^2', '10/n^3');
      verifier('rang minimal 10', rangInfo().min === 10, String(rangInfo().min));
      changerRang(4);
      verifier('rang 4 : échec signalé', !rangInfo().ok && /✗/.test(el.statut.textContent));
      // 5. Comparaison par limite (exercice P1 (a))
      r = choisir('limite', 'n/((n+1)(n+2))', '1/n');
      verifier('limite : r = 1', r.rExact && r.rExact.valeur === 1);
      verifier('limite : diverge', el.verdict.classList.contains('div'));
      verifier('limite : tube', !!bornes(rangInfo().rang).tube);
      // 6. r = 0 (P1 (g))
      r = choisir('limite', '(log n) e^(-sqrt n)', '1/n^2');
      verifier('limite r = 0', r.r === 0);
      verifier('limite r = 0 : converge', el.verdict.classList.contains('conv'));
      // 7. Racine
      r = choisir('racine', '(n/(2n+1))^n');
      verifier('racine : r = 1/2', r.rExact && r.rExact.texte === '1/2');
      verifier('racine : r1 = 3/4', Math.abs(r.r1 - 0.75) < 1e-12);
      verifier('racine : converge', el.verdict.classList.contains('conv'));
      r = choisir('racine', '(log n)^(-n)');
      verifier('racine (log n)^-n : r = 0, K = 8', r.r === 0 && r.Kmin === 8, r.r + ' ' + r.Kmin);
      r = choisir('racine', '2^n/n^3');
      verifier('racine 2^n/n^3 : r = 2, K = 10, diverge', r.cas === 'b' && r.Kmin === 10 && el.verdict.classList.contains('div'));
      // 8. Quotient
      r = choisir('quotient', 'n!/n^n');
      verifier('quotient n!/n^n : 1/e', r.rExact && r.rExact.texte === '1/e');
      r = choisir('quotient', '1/n^2');
      verifier('quotient 1/n^2 : r = 1, pas de conclusion', r.cas === 'r1' && el.verdict.classList.contains('aucune'));
      r = choisir('quotient', 'n! e^(-n)');
      verifier('quotient n! e^-n : diverge', r.cas === 'b' && el.verdict.classList.contains('div'));
      r = choisir('quotient', 'n/2^n');
      changerR1(0.51);
      verifier('quotient n/2^n, r1 = 0,51 : K = 50', etat.res.Kmin === 50, String(etat.res.Kmin));
      verifier('vue suit K', etat.anim ? etat.anim.vers.b >= 50 : etat.vue.b >= 50);
      const geo = lignesJauges()[1];
      verifier('jauge géométrique', geo && geo.geo && Number.isFinite(geo.total));
      // 9. Langue
      changerLangue('en');
      verifier('anglais : titre du test', el.titreTest.textContent === 'Ratio test');
      verifier('anglais : verdict', /converges/.test(el.verdict.textContent));
      changerLangue('fr');
      verifier('français : verdict', /converge/.test(el.verdict.textContent));
      // 10. Erreur de saisie
      el.champX.value = 'n^'; chargerSeries('n^', etat.srcY);
      verifier('erreur affichée', !el.erreurX.hidden);
      choisir('comparaison', X_DEFAUT, Y_DEFAUT);
      verifier('erreur effacée', el.erreurX.hidden);
      // 11. Échelle log, addition
      etat.log = true; dessiner();
      verifier('échelle log : rectangles', el.aires.querySelectorAll('.barre-x').length > 5);
      etat.log = false; dessiner();
      lancerAddition();
      verifier('addition lancée', !!etat.addition);
      arreterAddition(true);
      verifier('addition arrêtée', !etat.addition);
      // 12. Exemples : chacun se charge et conclut comme prévu
      const attendus = ['conv', 'conv', 'conv', 'div', 'conv', 'aucune', 'conv', 'conv', 'div', 'conv', 'aucune', 'div', 'conv', 'conv', 'conv', 'div', 'aucune', 'conv', 'conv', 'conv', 'div', 'conv', 'aucune'];
      EXEMPLES.forEach((ex, i) => {
        choisirExemple(i);
        const cls = ['conv', 'div', 'aucune'].find((c) => el.verdict.classList.contains(c));
        verifier('exemple ' + i + ' (' + ex.mode + ' ' + ex.x + ')', cls === attendus[i], cls);
      });
      choisir('comparaison', X_DEFAUT, Y_DEFAUT);
    } catch (e) {
      ko++;
      sortie.push('✗ exception : ' + e.message + '\n' + e.stack);
    }
    window.__resultatTests = { ok, ko, sortie };
    const pre = document.getElementById('tests') || document.body.appendChild(Object.assign(document.createElement('pre'), { id: 'tests' }));
    pre.textContent = (ko ? '✗ ' : '✓ ') + ok + ' test(s) réussi(s), ' + ko + ' échec(s)' + (sortie.length ? '\n' + sortie.join('\n') : '');
  }
})();
