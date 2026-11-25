/* =============================================================================
   Séries de fonctions — application interactive (UQTR, MPU1054, section 4.1)
   Application autonome (HTML/CSS/JS) : il suffit d'ouvrir index.html.
   Calculs : fonctions-core.js (analyse du terme général f_n(x), fonctions
   spéciales, outils numériques) et catalogue.js (les séries des notes de cours
   et des exercices de la section 4.1, avec leurs sommes et leurs raisonnements).
   KaTeX (vendor/katex) écrit les formules.

   L'idée : une série de fonctions Σ f_n est la suite de ses sommes partielles
   s_n. En haut, les courbes (s_n en or, la somme f en vert) ; en bas, la suite
   de nombres qui décide. Chaque onglet illustre un résultat de la section 4.1
   sur un ensemble A :
     sommes   : convergence simple, s_n(x_0) → f(x_0) ;
     uniforme : ‖R_n‖_A → 0, la bande f ± ε (R_n := f − s_n, le reste) ;
     cauchy   : critère de Cauchy, le bloc s_m − s_n = f_{n+1} + ⋯ + f_m ;
     terme    : test du terme général, version uniforme, ‖f_n‖_A → 0 ;
     testm    : test M de Weierstrass, |f_n(x)| ≤ M_n et la bande f ± ρ_n.

   Paramètres d'adresse : ?lang=fr|en
                          ?t=sommes|uniforme|cauchy|terme|testm
                          ?s=<série du catalogue>  ou  ?f=<terme général>
                          ?A=<ensemble> &p=<paramètre>  ou  ?A=ab &a=… &b=…
                          ?n=<indice> &m=suivant|double|<indice> &eps=<ε> &x0=<x_0>
                          ?log=1 (échelle log) &prec=0 (sans les sommes précédentes)
                          ?embed=1 (dans une page de mathopo.ca)  ?test=1 (tests)
   ============================================================================= */
'use strict';

(function () {
  const S = window.SeriesFonctionsNoyau;
  const C = window.SeriesFonctionsCatalogue;
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
  const MODES = ['sommes', 'uniforme', 'cauchy', 'terme', 'testm'];
  const SERIE_DEFAUT = 'geometrique';
  const MARGE = { g: 52, d: 16, h: 38, b: 26 };     // marges des deux graphes
  const N_CAP = 5000;                                // plus grand indice n
  const K_SOMME = 4096;                              // termes utilisés pour estimer la somme d'une série au choix
  const K_RANG = 600;                                // rangs explorés pour une borne supérieure numérique
  const LARGEUR_MAX_VUE_N = 4000;                    // indices visibles au plus (graphe du bas)
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const $ = (id) => document.getElementById(id);
  const R = String.raw;

  // ===========================================================================
  //  Langue (fr par défaut ; ?lang=en ou bouton EN/FR)
  //  Le français est le texte du HTML (capturé au démarrage) ; l'anglais est
  //  donné ici avec les mêmes clés. MSG : les chaînes produites par le code
  //  (formules entre $, rendues par rendreTexte).
  // ===========================================================================
  const TRAD = {
    fr: {},
    en: {
      titre: 'Series of functions',
      sousTitre: 'Partial sums, remainder and uniform convergence: the series of the lecture notes and of the exercises of Section 4.1.',
      btnAide: '?&nbsp;Help', 'title:btnAide': 'Help (key ?)',
      btnPanneau: 'Panel', 'title:btnPanneau': 'Show or hide the panel (key P)',
      btnPleinEcran: '⛶<span class="libelle">&nbsp;Full screen</span>', 'title:btnPleinEcran': 'Full screen',
      'aria:zoneGraphe': 'Graphs of the series', 'aria:onglets': 'What is studied',
      nomSommes: '<span class="long">Partial sums</span><span class="court">Sums</span>',
      nomUniforme: '<span class="long">Uniform convergence</span><span class="court">Uniform</span>',
      nomCauchy: '<span class="long">Cauchy criterion</span><span class="court">Cauchy</span>',
      nomTerme: '<span class="long">General term</span><span class="court">Term</span>',
      nomTestM: '<span class="long">Weierstrass <i>M</i>-test</span><span class="court"><i>M</i>-test</span>',
      'title:ongletSommes': 'Partial sums and pointwise convergence (key 1)',
      'title:ongletUniforme': 'Uniform convergence: the remainder and the band (key 2)',
      'title:ongletCauchy': 'Cauchy criterion for series of functions (key 3)',
      'title:ongletTerme': 'Uniform version of the term test (key 4)',
      'title:ongletTestM': 'Weierstrass M-test (key 5)',
      'aria:grapheCourbes': 'The partial sums and the sum of the series',
      'aria:grapheSuite': 'The sequence that decides',
      'title:libelleN': 'Index of the partial sum (keys ← and →)',
      'title:btnNMoins': 'One term fewer (key ←)', 'title:btnNPlus': 'One more term (key →)', 'title:btnNDouble': 'Twice as many terms (key D)',
      'title:btnAdditionner': 'Add up the terms one by one, starting from the first (Space)', additionner: 'Add up the terms',
      'title:btnZoomMoins': 'Zoom out (mouse wheel)', 'title:btnZoomPlus': 'Zoom in (mouse wheel)',
      btnRecadrer: 'Reset view', 'title:btnRecadrer': 'Back to the initial view (double-click, key F)',
      precedentes: 'Earlier sums', 'title:btnPrecedentes': 'Also show earlier partial sums, as in the figures of the notes (key S)',
      echelleLog: 'Log scale', 'title:btnLog': 'Logarithmic scale for the bottom graph (key L)',
      btnLien: '🔗&nbsp;Copy link', 'title:btnLien': 'Copy the address of this configuration',
      carteSerie: 'The series',
      libelleEnsemble: 'Set <i>A</i>', 'aria:ensembles': 'The set A',
      exemplesNotes: 'Lecture notes, Section 4.1', 'aria:exemplesNotes': 'Series of the lecture notes',
      exemplesExercices: 'Exercises of Section 4.1', 'aria:exemplesExercices': 'Series of the exercises',
      libelleM: 'Choice of <i>m</i>', 'aria:choixM': 'Choice of m',
      'title:mSuivant': 'm = n + 1: a single term, f_{n+1}', 'title:mDouble': 'm = 2n: the block of n terms following s_n',
      carteRaisonnement: 'The reasoning',
      pied: 'Series of functions · UQTR · P.-O. Parisé · 2026',
      btnFermer: 'Close',
      aide: `
    <h2>Series of functions</h2>
    <p>A series of functions <span class="m">\\(\\sum f_n\\)</span> is the sequence of its <b>partial sums</b> <span class="m">\\(s_n = f_{n_0} + \\cdots + f_n\\)</span>. The application draws <span class="m">\\(s_n\\)</span> (gold) and the <b>sum</b> <span class="m">\\(f\\)</span> (green) for the series of the examples of the lecture notes and of the exercises of Section 4.1, or for a series you type in. Each tab illustrates a result of the section, on a set <span class="m">\\(A\\)</span> of your choice.</p>
    <ul>
      <li><b>Partial sums:</b> for each fixed <span class="m">\\(x\\)</span>, <span class="m">\\(\\sum f_n(x)\\)</span> is a numerical series. At the bottom, the sequence <span class="m">\\(s_n(x_0)\\)</span> at the chosen point <span class="m">\\(x_0\\)</span>: the speed of convergence depends on <span class="m">\\(x_0\\)</span>.</li>
      <li><b>Uniform convergence:</b> the series converges uniformly to <span class="m">\\(f\\)</span> on <span class="m">\\(A\\)</span> if <span class="m">\\(\\lVert R_n \\rVert_A = \\sup_{x \\in A} |f(x) - s_n(x)| \\to 0\\)</span>, where <span class="m">\\(R_n = f - s_n\\)</span> is the remainder. From some rank on, the graph of <span class="m">\\(s_n\\)</span> above <span class="m">\\(A\\)</span> lies entirely in the band <span class="m">\\(f \\pm \\varepsilon\\)</span>; what leaves it is red.</li>
      <li><b>Cauchy criterion:</b> two partial sums are compared, without knowing the sum. The graph shows the block <span class="m">\\(s_m - s_n = f_{n+1} + \\cdots + f_m\\)</span>; it must stay in the band <span class="m">\\(\\pm \\varepsilon\\)</span> for all <span class="m">\\(m > n\\)</span> from some rank on.</li>
      <li><b>General term:</b> if the series converges uniformly on <span class="m">\\(A\\)</span>, then <span class="m">\\(\\lVert f_n \\rVert_A \\to 0\\)</span>. This test is used to show that a series does <i>not</i> converge uniformly; its converse is false.</li>
      <li><b>Weierstrass <i>M</i>-test:</b> if <span class="m">\\(|f_n(x)| \\le M_n\\)</span> for all <span class="m">\\(x \\in A\\)</span> and if <span class="m">\\(\\sum M_n\\)</span> converges, the series converges uniformly on <span class="m">\\(A\\)</span>, and <span class="m">\\(|f(x) - s_n(x)| \\le \\rho_n = \\sum_{k > n} M_k\\)</span>: the graph of <span class="m">\\(s_n\\)</span> lies in the band <span class="m">\\(f \\pm \\rho_n\\)</span>. At the bottom, the rectangles of <span class="m">\\(\\lVert f_k \\rVert_A\\)</span> (gold) inside those of <span class="m">\\(M_k\\)</span> (green).</li>
    </ul>
    <h3>The graphs</h3>
    <ul>
      <li><b>Top:</b> the curves. The green part of the axis is the set <span class="m">\\(A\\)</span>; outside <span class="m">\\(A\\)</span>, the background is hatched. Drag the endpoints of <span class="m">\\(A\\)</span>, the edge of the band or the line <span class="m">\\(x_0\\)</span>. Wheel = zoom (with <kbd>Shift</kbd>: horizontally only), drag = move, double-click or <kbd>F</kbd> = reset view.</li>
      <li><b>Bottom:</b> the sequence of numbers that decides (<span class="m">\\(s_n(x_0)\\)</span>, <span class="m">\\(\\lVert R_n \\rVert_A\\)</span>, <span class="m">\\(\\lVert s_m - s_n \\rVert_A\\)</span>, <span class="m">\\(\\lVert f_n \\rVert_A\\)</span> or <span class="m">\\(M_n\\)</span>). Drag the line <span class="m">\\(n\\)</span>, or click to place it; the logarithmic scale shows very small values.</li>
      <li><b>“Add up the terms”</b> starts again from the first term and adds the next ones one by one, then faster and faster. “Earlier sums” also shows <span class="m">\\(s_{n/2}\\)</span>, <span class="m">\\(s_{n/4}\\)</span>…, as in the figures of the notes.</li>
      <li><b>Keyboard:</b> <kbd>1</kbd> to <kbd>5</kbd>: the tab · <kbd>←</kbd> <kbd>→</kbd>: <span class="m">\\(n\\)</span> · <kbd>D</kbd>: double <span class="m">\\(n\\)</span> · <kbd>↑</kbd> <kbd>↓</kbd>: <span class="m">\\(\\varepsilon\\)</span> (or <span class="m">\\(x_0\\)</span>) · <kbd>Space</kbd>: add up · <kbd>S</kbd>: earlier sums · <kbd>L</kbd>: logarithmic scale · <kbd>P</kbd>: panel.</li>
    </ul>
    <h3>Typing the general term</h3>
    <p>In terms of <span class="m">\\(n\\)</span> and <span class="m">\\(x\\)</span>: <code>+ - * / ^</code>, parentheses, <code>sqrt</code>, <code>log</code> (natural logarithm, as in the notes; also <code>ln</code>), <code>exp</code> or <code>e^</code>, <code>sin</code>, <code>cos</code>, <code>arctan</code>, <code>|x|</code>, <code>n!</code>, <code>pi</code>, and <code>dist(t)</code>, the distance from <span class="m">\\(t\\)</span> to the nearest integer. Products can be implicit: <code>cos(nx)/n^2</code>, <code>x^n(1-x)</code>, <code>2^n x^n/n!</code>. The series starts at <span class="m">\\(n = 0\\)</span> if the term is defined there on <span class="m">\\(A\\)</span>, otherwise at <span class="m">\\(n = 1\\)</span>. A series of the notes or of the exercises is recognized: the application then gives its exact sum and the reasoning of the notes or of the solutions.</p>
    <p class="indice">For a series of your own (a power series of Section 4.2 or a Taylor series of Section 4.3, for example) or an interval <span class="m">\\([a, b]\\)</span> of your own, the sum, the suprema and the ranks are <b>estimated numerically</b>: the sum from the partial sums up to <span class="m">\\(n = 4096\\)</span> and an extrapolation, the suprema on a grid of points of <span class="m">\\(A\\)</span>. The application then shows values, but cannot conclude: a test is needed.</p>`,
    },
  };

  const MSG = {
    fr: {
      titrePage: 'Séries de fonctions — UQTR',
      btnLangue: 'EN', btnLangueTitre: 'English version',
      arreter: 'Arrêter', lienCopie: '✓&nbsp;Lien copié', lienEchec: 'Copie impossible : copiez l’adresse de la page.',
      titreTest: { sommes: 'Convergence simple', uniforme: 'Convergence uniforme', cauchy: 'Critère de Cauchy', terme: 'Test du terme général', testm: 'Test M de Weierstrass' },
      auChoix: 'au choix',
      titreEnsAb: 'Un intervalle [a, b] au choix (valeurs numériques seulement)',
      // --- titres des graphes
      tSommes: R`Somme partielle $s_{{n}}$ et somme $f$`, tSommesSans: R`Somme partielle $s_{{n}}$`,
      tUniforme: R`Le reste : $@nR \approx {v}$`, tUniformeInf: R`Le reste : $@nR = +\infty$`, tUniformeSans: R`Somme partielle $s_{{n}}$ : pas de somme, pas de reste`,
      tCauchy: R`Le bloc $s_{{m}} - s_{{n}} = {bloc}$`,
      tTerme: R`Le terme $f_{{n}}$ : $@nT \approx {v}$`, tTermeInf: R`Le terme $f_{{n}}$ : $@nT = +\infty$`,
      tTestM: R`$s_{{n}}$ dans la bande $f \pm \rho_{{n}}$, $\rho_{{n}} \approx {v}$`, tTestMNon: R`Somme partielle $s_{{n}}$ : le test $M$ ne s’applique pas`,
      tTestMNum: R`$s_{{n}}$ dans la bande $f \pm \rho_{{n}}$, $\rho_{{n}} \approx {v}$ (numérique)`, tTestMNumNon: R`Somme partielle $s_{{n}}$ : $\sum @nTk$ ne semble pas converger`,
      tTestMNumInf: R`Somme partielle $s_{{n}}$ : des termes ne sont pas bornés sur $@A$`, tTestMNumLoin: R`Somme partielle $s_{{n}}$`,
      sSommes: R`En $x_0 = {x}$ : la suite $s_n(x_0)$`, sSommesLog: R`En $x_0 = {x}$ : l’erreur $|f(x_0) - s_n(x_0)|$`,
      sUniforme: R`La suite $@nRn$`, sCauchy: R`Les écarts $\nrm{s_k - s_{{n}}}{@A}$, $k > {n}$`, sTerme: R`La suite $@nTn$`,
      sTestM: R`Les rectangles de $M_k$ et de $@nTk$`, sTestMNon: R`Les rectangles de $@nTk$`, sTestMNum: R`Les rectangles de $M_k := @nTk$`,
      // --- légendes
      legS: R`$s_{{n}}$`, legF: R`$f$`, legPrec: 'sommes précédentes', legBandeEps: R`bande $f \pm \eps$`, legBandeRho: R`bande $f \pm \rho_n$`,
      legBandeZero: R`bande $\pm \eps$`, legHors: 'hors de la bande', legBloc: R`$s_m - s_n$`, legTerme: R`$f_{{n}}$`, legTermesPrec: 'termes précédents',
      legNorme: R`$\lVert f_k \rVert$`, legM: R`$M_k$`, legQueue: R`queue : $\rho_n$`,
      // --- graphes : messages
      pasDeSomme: 'La série ne converge pas : il n’y a ni somme ni reste.',
      divergeX0: R`En $x_0 = {x}$, la série diverge.`,
      horsVue: 'hors de la vue',
      blocsInfinis: R`Les blocs $s_m - s_n$ ne sont pas bornés sur $@A$ : $\nrm{s_m - s_n}{@A} = +\infty$.`,
      partieVisible: 'sur la partie visible',
      // --- la série
      ensConv: 'Ensemble de convergence', nomNotes: 'Notes de cours : ', nomExercice: 'Exercice ',
      serieAuChoix: R`Série au choix : la somme est <b>estimée numériquement</b> (sommes partielles jusqu’à $n = 4096$, puis extrapolation).`,
      serieConstante: 'Les fonctions $f_n$ sont constantes.',
      serieDebut: R`La série commence à $n = {n0}$.`,
      // --- énoncés
      enonceSommes: R`<b>Définition.</b> La série $\sum f_n$ est la suite de ses <b>sommes partielles</b> $s_n(x) := {debut} + \cdots + f_n(x)$. Elle <b>converge simplement</b> sur $A$ vers $f$ si, pour chaque $x \in A$, $s_n(x) \to f(x)$ : pour $x$ fixé, $\sum f_n(x)$ est une série numérique.`,
      enonceUniforme: R`<b>Définition.</b> La série $\sum f_n$ <b>converge uniformément</b> vers $f$ sur $A$ si $s_n \cvu f$ sur $A$. Avec le <b>reste</b> $R_n := f - s_n$, cela équivaut à $\nrm{R_n}{A} = \sup_{x \in A} |f(x) - s_n(x)| \to 0$ : à partir d’un rang, le graphe de $s_n$ au-dessus de $A$ est tout entier dans la bande $f \pm \eps$.`,
      enonceCauchy: R`<b>Théorème (critère de Cauchy pour les séries de fonctions).</b> La série $\sum f_n$ converge uniformément sur $A$ si et seulement si, pour tout $\eps > 0$, il existe $M(\eps) \in \bN$ tel que <span class="partie">$m > n \ge M(\eps) \ \Rightarrow \ |f_{n+1}(x) + \cdots + f_m(x)| < \eps$ pour tout $x \in A$.</span>`,
      enonceTerme: R`<b>Corollaire (test du terme général, version uniforme).</b> Si la série $\sum f_n$ converge uniformément sur $A$, alors $\nrm{f_n}{A} \to 0$. <span class="partie">Donc, si $\nrm{f_n}{A} \nra 0$, la série ne converge pas uniformément sur $A$.</span><span class="partie">Attention : la réciproque est fausse.</span>`,
      enonceTestM: R`<b>Théorème (test $M$ de Weierstrass).</b> Si $|f_n(x)| \le M_n$ pour tout $x \in A$ et tout $n$, et si la série numérique $\sum M_n$ converge, alors la série $\sum f_n$ converge uniformément sur $A$ (et absolument). <span class="partie">De plus, $|f(x) - s_n(x)| \le \rho_n := \sum_{k > n} M_k$ pour tout $x \in A$.</span>`,
      // --- statuts
      stSommes: R`En $x_0 = {x}$ : $s_{{n}}(x_0) \approx {s}$ et $f(x_0) \approx {f}$, donc $|R_{{n}}(x_0)| \approx {r}$.`,
      stSommesDiv: R`En $x_0 = {x}$ : $s_{{n}}(x_0) \approx {s}$. La série ne converge pas en ce point.`,
      stSommesHors: R` Le point $x_0$ n’est pas dans $@A$.`,
      stNorme: R`$@nR \approx {v}$`, stNormeInf: R`$@nR = +\infty$`,
      stNormeFormule: R`$@nRn = {tex}$ ; ici, $@nR \approx {v}$`, stNormeConst: R`$@nRn = {tex}$ pour tout $n$`,
      stDans: R` <span class="ok">✓</span> $< \eps = {eps}$ : le graphe de $s_{{n}}$ au-dessus de $@A$ est dans la bande.`,
      stHors: R` <span class="non">✗</span> $\ge \eps = {eps}$ : le graphe de $s_{{n}}$ sort de la bande (en rouge).`,
      stRang: R` Rang : pour $n \ge {N}$, $@nRn < \eps$.`,
      stRangNum: R` Rang (numérique, vérifié pour $n \le {K}$) : $@nRn < \eps$ dès que $n \ge {N}$.`,
      stRangAucun: R` Aucun rang ne convient : $@nRn$ ne tend pas vers $0$.`,
      stRangLoin: R` Aucun rang $n \le {K}$ ne convient pour cet $\eps$.`,
      stPartiel: R` (Borne supérieure calculée sur la partie visible de $@A$.)`,
      stDiverge: R`La série ne converge pas en chaque point de $@A$ : elle n’y converge ni simplement ni uniformément.`,
      stCauchy: R`$\nrm{s_{{m}} - s_{{n}}}{@A} {egal} {v}$`,
      stCauchyDans: R` <span class="ok">✓</span> $< \eps = {eps}$.`,
      stCauchyHors: R` <span class="non">✗</span> $\ge \eps = {eps}$ : ce bloc sort de la bande.`,
      stCauchyTous: R` Pour ce $n$, tous les blocs calculés ($m \le {K}$) restent sous $\eps$.`,
      stCauchyPire: R` Pour ce $n$, le plus grand bloc calculé est celui de $m = {m}$ : $\approx {v}$.`,
      stTerme: R`$@nT \approx {v}$`, stTermeInf: R`$@nT = +\infty$`,
      stTermeFormule: R`$@nTn = {tex}$ ; ici, $@nT \approx {v}$`, stTermeConst: R`$@nTn = {tex}$ pour tout $n$`,
      stTestM: R`$M_n = {texM}$ ; $\rho_{{n}} = \sum_{k > {n}} M_k \approx {rho}$ : $|f(x) - s_{{n}}(x)| \le \rho_{{n}}$ pour tout $x \in @A$, et $@nR \approx {v}$.`,
      stTestMNum: R`Avec $M_k := @nTk$ (valeurs numériques) : $\sum M_k \approx {somme}$.`,
      stTestMNumRho: R`Alors $\rho_{{n}} = \sum_{k > {n}} M_k \approx {rho}$, et $@nR \approx {v}$.`,
      stTestMNumNon: R`Avec $M_k := @nTk$ (valeurs numériques) : $\sum_{k \le {K}} M_k \approx {somme}$, et ces sommes ne semblent pas se stabiliser.`,
      stTestMNon: R`$@nT {egal} {v}$ : voir le raisonnement.`,
      // --- raisonnement : étapes génériques
      etConv: R`L’ensemble de convergence est $ {C}$.`,
      etSomme: R`Sur cet ensemble, la somme est $f(x) = {f}$.`,
      etVerdictSimple: R`La série converge simplement sur $@A$.`,
      etVerdictSimpleSous: 'Converge-t-elle uniformément ?',
      etVerdictDiverge: 'La série diverge en chaque point.',
      etVerdictPasPartout: R`La série ne converge pas en chaque point de $@A$.`,
      versUniforme: 'Convergence uniforme', versCauchy: 'Critère de Cauchy', versTerme: 'Terme général', versTestM: 'Test M', versSommes: 'Sommes partielles',
      verdictUnif: R`La série converge uniformément sur $@A$.`,
      verdictNonUnif: R`La série ne converge pas uniformément sur $@A$.`,
      verdictCauchyOui: R`Le critère de Cauchy est satisfait sur $@A$ : convergence uniforme.`,
      verdictCauchyNon: R`Le critère de Cauchy n’est pas satisfait sur $@A$ : pas de convergence uniforme.`,
      etCauchyM1: R`Soient $m > n$ et $x \in @A$. Par l’inégalité triangulaire, $|f_{n+1}(x) + \cdots + f_m(x)| \le M_{n+1} + \cdots + M_m \le \rho_n$, avec $M_n = {texM}$.`,
      etCauchyM2: R`Comme $\sum M_n$ converge, $\rho_n = {texRho} \to 0$ : étant donné $\eps > 0$, tout rang $M(\eps)$ tel que $\rho_{M(\eps)} < \eps$ convient, pour tous les $x \in @A$ à la fois.`,
      etCauchyM3: 'C’est la démonstration du test $M$ de Weierstrass : il repose sur le critère de Cauchy.',
      etCauchyT1: R`Avec $m = n + 1$, le bloc se réduit à un terme : $\nrm{s_{n+1} - s_n}{@A} = \nrm{f_{n+1}}{@A}$.`,
      etCauchyT2: R`Or $@nTn = {tex}$ ne tend pas vers $0$ : aucun rang $M(\eps)$ ne convient lorsque $\eps$ est petit.`,
      etCauchyInf: R`Les blocs $f_{n+1} + \cdots + f_m$ ne sont pas bornés sur $@A$ : $\nrm{s_m - s_n}{@A} = +\infty$ pour tous $m > n$.`,
      etCauchyVoir: 'Le critère de Cauchy équivaut à la convergence uniforme : voir l’onglet « Convergence uniforme » pour le raisonnement des notes.',
      etTerme1: R`$@nTn = {tex}$ {raison}`,
      etTermeNum: R`Borne supérieure calculée numériquement : $@nT \approx {v}$.`,
      etTermeOui: R`Donc $@nTn \to 0$ : la condition nécessaire est satisfaite, mais <b>le test ne permet pas de conclure</b>, car sa réciproque est fausse.`,
      etTermeNon: R`Donc $@nTn \nra 0$ : par le test du terme général, version uniforme, la série ne converge pas uniformément sur $@A$.`,
      etTemoin: R`Point témoin : $ {xn}$, où $ {val}$.`,
      verdictTermeNon: R`$@nTn \nra 0$ : pas de convergence uniforme sur $@A$.`,
      verdictTermeRien: R`$@nTn \to 0$ : le test ne permet pas de conclure.`,
      verdictTermeRienSous: { oui: 'La série converge bien uniformément ici :', non: 'Ici, la série ne converge pourtant pas uniformément :', div: 'Ici, la série diverge même en chaque point :' },
      etM1: R`Pour tout $x \in @A$ et tout $n$ : $|f_n(x)| \le M_n := {texM}$, {raison}.`,
      etM2: R`La série numérique $\sum M_n$ converge : {serie}.`,
      etM3: R`Par le test $M$ de Weierstrass, la série $\sum f_n$ converge uniformément (et absolument) sur $@A$.`,
      etM4: R`Majoration du reste : $|f(x) - s_n(x)| \le \rho_n = {texRho}$ pour tout $x \in @A$, le même nombre pour tous les $x$.`,
      verdictM: R`Le test $M$ s’applique : convergence uniforme sur $@A$.`,
      verdictMNon: R`Le test $M$ ne s’applique pas sur $@A$.`,
      verdictMNonSous: { oui: 'La série converge pourtant uniformément : le test donne une condition suffisante, pas nécessaire.', non: 'D’ailleurs, la série ne converge pas uniformément sur cet ensemble.', div: 'D’ailleurs, la série diverge.' },
      // --- raisonnement : valeurs numériques (série ou intervalle au choix)
      numIntro: R`L’application ne connaît pas de raisonnement pour ce cas : elle calcule des <b>valeurs numériques</b> sur une grille de points de $@A$.`,
      numSomme: R`La somme est estimée en chaque point (sommes partielles jusqu’à $n = 4096$, puis extrapolation). Là où la courbe verte est interrompue, la série ne semble pas converger.`,
      numSimpleOui: R`En chaque point d’essai de $@A$, la série semble converger.`,
      numSimpleNon: R`En certains points de $@A$, la série ne semble pas converger.`,
      numTable: R`Valeurs de $@nRn$ :`, numTableT: R`Valeurs de $@nTn$ :`, numTableC: R`Valeurs de $\nrm{s_{2n} - s_n}{@A}$ :`,
      numVersZero: 'Ces valeurs semblent tendre vers $0$.', numPasZero: 'Ces valeurs ne semblent pas tendre vers $0$.',
      numMOui: R`Avec $M_n := @nTn$, la série $\sum M_n$ semble converger : $\sum M_n \approx {v}$. Le test $M$ s’appliquerait.`,
      numMNon: R`Avec $M_n := @nTn$, le meilleur choix, la série $\sum M_n$ ne semble pas converger : le test $M$ ne s’appliquerait pas.`,
      numMInf: R`Des termes ne sont pas bornés sur $@A$ : aucun $M_n$ ne convient.`,
      verdictNum: 'Valeurs numériques seulement : pour conclure, il faut un test.',
      verdictNumOui: R`Numériquement, $@nRn$ semble tendre vers $0$.`,
      verdictNumNon: R`Numériquement, $@nRn$ ne semble pas tendre vers $0$.`,
      verdictNumSous: 'Ce n’est pas une démonstration : pour conclure, il faut un test.',
      // --- bulle
      bX: 'x', bHorsA: R`hors de $@A$`, bDiverge: 'la série diverge en ce point',
      // --- erreurs de saisie
      erreurs: {
        vide: 'Tapez le terme général, en fonction de <i>n</i> et de <i>x</i>.',
        caractere: 'Caractère non reconnu : <code>{texte}</code>.',
        fin: 'L’expression est incomplète.',
        parenthese: 'Il manque une parenthèse fermante <code>)</code>.',
        barre: 'Il manque une barre fermante <code>|</code>.',
        inattendu: '<code>{texte}</code> est inattendu ici.',
        fonctionParenthese: 'Mettez l’argument de <code>{texte}</code> entre parenthèses : <code>{texte}(x)</code>.',
        variable: 'Les variables sont <i>n</i> et <i>x</i> : <code>{texte}</code> n’est pas reconnu.',
        inconnu: 'Nom inconnu : <code>{texte}</code>.',
        indefini: 'Le terme n’est pas défini sur tout l’intervalle [<i>a</i>, <i>b</i>] pour les premiers <i>n</i> (division par zéro ou valeur hors domaine) : changez l’intervalle.',
        intervalle: 'Il faut <i>a</i> &lt; <i>b</i>.',
        interne: 'Expression non reconnue.',
      },
    },
    en: {
      titrePage: 'Series of functions — UQTR',
      btnLangue: 'FR', btnLangueTitre: 'Version française',
      arreter: 'Stop', lienCopie: '✓&nbsp;Link copied', lienEchec: 'Could not copy: copy the address of the page.',
      titreTest: { sommes: 'Pointwise convergence', uniforme: 'Uniform convergence', cauchy: 'Cauchy criterion', terme: 'Term test', testm: 'Weierstrass M-test' },
      auChoix: 'your own',
      titreEnsAb: 'An interval [a, b] of your own (numerical values only)',
      tSommes: R`Partial sum $s_{{n}}$ and sum $f$`, tSommesSans: R`Partial sum $s_{{n}}$`,
      tUniforme: R`The remainder: $@nR \approx {v}$`, tUniformeInf: R`The remainder: $@nR = +\infty$`, tUniformeSans: R`Partial sum $s_{{n}}$: no sum, no remainder`,
      tCauchy: R`The block $s_{{m}} - s_{{n}} = {bloc}$`,
      tTerme: R`The term $f_{{n}}$: $@nT \approx {v}$`, tTermeInf: R`The term $f_{{n}}$: $@nT = +\infty$`,
      tTestM: R`$s_{{n}}$ in the band $f \pm \rho_{{n}}$, $\rho_{{n}} \approx {v}$`, tTestMNon: R`Partial sum $s_{{n}}$: the $M$-test does not apply`,
      tTestMNum: R`$s_{{n}}$ in the band $f \pm \rho_{{n}}$, $\rho_{{n}} \approx {v}$ (numerical)`, tTestMNumNon: R`Partial sum $s_{{n}}$: $\sum @nTk$ does not seem to converge`,
      tTestMNumInf: R`Partial sum $s_{{n}}$: some terms are unbounded on $@A$`, tTestMNumLoin: R`Partial sum $s_{{n}}$`,
      sSommes: R`At $x_0 = {x}$: the sequence $s_n(x_0)$`, sSommesLog: R`At $x_0 = {x}$: the error $|f(x_0) - s_n(x_0)|$`,
      sUniforme: R`The sequence $@nRn$`, sCauchy: R`The gaps $\nrm{s_k - s_{{n}}}{@A}$, $k > {n}$`, sTerme: R`The sequence $@nTn$`,
      sTestM: R`The rectangles of $M_k$ and of $@nTk$`, sTestMNon: R`The rectangles of $@nTk$`, sTestMNum: R`The rectangles of $M_k := @nTk$`,
      legS: R`$s_{{n}}$`, legF: R`$f$`, legPrec: 'earlier sums', legBandeEps: R`band $f \pm \eps$`, legBandeRho: R`band $f \pm \rho_n$`,
      legBandeZero: R`band $\pm \eps$`, legHors: 'outside the band', legBloc: R`$s_m - s_n$`, legTerme: R`$f_{{n}}$`, legTermesPrec: 'earlier terms',
      legNorme: R`$\lVert f_k \rVert$`, legM: R`$M_k$`, legQueue: R`tail: $\rho_n$`,
      pasDeSomme: 'The series does not converge: there is neither a sum nor a remainder.',
      divergeX0: R`At $x_0 = {x}$, the series diverges.`,
      horsVue: 'out of view',
      blocsInfinis: R`The blocks $s_m - s_n$ are unbounded on $@A$: $\nrm{s_m - s_n}{@A} = +\infty$.`,
      partieVisible: 'on the visible part',
      ensConv: 'Set of convergence', nomNotes: 'Lecture notes: ', nomExercice: 'Exercise ',
      serieAuChoix: R`Series of your own: the sum is <b>estimated numerically</b> (partial sums up to $n = 4096$, then extrapolation).`,
      serieConstante: 'The functions $f_n$ are constant.',
      serieDebut: R`The series starts at $n = {n0}$.`,
      enonceSommes: R`<b>Definition.</b> The series $\sum f_n$ is the sequence of its <b>partial sums</b> $s_n(x) := {debut} + \cdots + f_n(x)$. It <b>converges pointwise</b> on $A$ to $f$ if, for each $x \in A$, $s_n(x) \to f(x)$: for fixed $x$, $\sum f_n(x)$ is a numerical series.`,
      enonceUniforme: R`<b>Definition.</b> The series $\sum f_n$ <b>converges uniformly</b> to $f$ on $A$ if $s_n \cvu f$ on $A$. With the <b>remainder</b> $R_n := f - s_n$, this is equivalent to $\nrm{R_n}{A} = \sup_{x \in A} |f(x) - s_n(x)| \to 0$: from some rank on, the graph of $s_n$ above $A$ lies entirely in the band $f \pm \eps$.`,
      enonceCauchy: R`<b>Theorem (Cauchy criterion for series of functions).</b> The series $\sum f_n$ converges uniformly on $A$ if and only if, for every $\eps > 0$, there exists $M(\eps) \in \bN$ such that <span class="partie">$m > n \ge M(\eps) \ \Rightarrow \ |f_{n+1}(x) + \cdots + f_m(x)| < \eps$ for all $x \in A$.</span>`,
      enonceTerme: R`<b>Corollary (uniform version of the term test).</b> If the series $\sum f_n$ converges uniformly on $A$, then $\nrm{f_n}{A} \to 0$. <span class="partie">So, if $\nrm{f_n}{A} \nra 0$, the series does not converge uniformly on $A$.</span><span class="partie">Warning: the converse is false.</span>`,
      enonceTestM: R`<b>Theorem (Weierstrass $M$-test).</b> If $|f_n(x)| \le M_n$ for all $x \in A$ and all $n$, and if the numerical series $\sum M_n$ converges, then the series $\sum f_n$ converges uniformly on $A$ (and absolutely). <span class="partie">Moreover, $|f(x) - s_n(x)| \le \rho_n := \sum_{k > n} M_k$ for all $x \in A$.</span>`,
      stSommes: R`At $x_0 = {x}$: $s_{{n}}(x_0) \approx {s}$ and $f(x_0) \approx {f}$, so $|R_{{n}}(x_0)| \approx {r}$.`,
      stSommesDiv: R`At $x_0 = {x}$: $s_{{n}}(x_0) \approx {s}$. The series does not converge at this point.`,
      stSommesHors: R` The point $x_0$ is not in $@A$.`,
      stNorme: R`$@nR \approx {v}$`, stNormeInf: R`$@nR = +\infty$`,
      stNormeFormule: R`$@nRn = {tex}$; here, $@nR \approx {v}$`, stNormeConst: R`$@nRn = {tex}$ for every $n$`,
      stDans: R` <span class="ok">✓</span> $< \eps = {eps}$: the graph of $s_{{n}}$ above $@A$ lies in the band.`,
      stHors: R` <span class="non">✗</span> $\ge \eps = {eps}$: the graph of $s_{{n}}$ leaves the band (in red).`,
      stRang: R` Rank: for $n \ge {N}$, $@nRn < \eps$.`,
      stRangNum: R` Rank (numerical, checked for $n \le {K}$): $@nRn < \eps$ as soon as $n \ge {N}$.`,
      stRangAucun: R` No rank works: $@nRn$ does not tend to $0$.`,
      stRangLoin: R` No rank $n \le {K}$ works for this $\eps$.`,
      stPartiel: R` (Supremum computed on the visible part of $@A$.)`,
      stDiverge: R`The series does not converge at every point of $@A$: it converges neither pointwise nor uniformly there.`,
      stCauchy: R`$\nrm{s_{{m}} - s_{{n}}}{@A} {egal} {v}$`,
      stCauchyDans: R` <span class="ok">✓</span> $< \eps = {eps}$.`,
      stCauchyHors: R` <span class="non">✗</span> $\ge \eps = {eps}$: this block leaves the band.`,
      stCauchyTous: R` For this $n$, all the computed blocks ($m \le {K}$) stay below $\eps$.`,
      stCauchyPire: R` For this $n$, the largest computed block is that of $m = {m}$: $\approx {v}$.`,
      stTerme: R`$@nT \approx {v}$`, stTermeInf: R`$@nT = +\infty$`,
      stTermeFormule: R`$@nTn = {tex}$; here, $@nT \approx {v}$`, stTermeConst: R`$@nTn = {tex}$ for every $n$`,
      stTestM: R`$M_n = {texM}$; $\rho_{{n}} = \sum_{k > {n}} M_k \approx {rho}$: $|f(x) - s_{{n}}(x)| \le \rho_{{n}}$ for all $x \in @A$, and $@nR \approx {v}$.`,
      stTestMNum: R`With $M_k := @nTk$ (numerical values): $\sum M_k \approx {somme}$.`,
      stTestMNumRho: R`Then $\rho_{{n}} = \sum_{k > {n}} M_k \approx {rho}$, and $@nR \approx {v}$.`,
      stTestMNumNon: R`With $M_k := @nTk$ (numerical values): $\sum_{k \le {K}} M_k \approx {somme}$, and these sums do not seem to settle.`,
      stTestMNon: R`$@nT {egal} {v}$: see the reasoning.`,
      etConv: R`The set of convergence is $ {C}$.`,
      etSomme: R`On this set, the sum is $f(x) = {f}$.`,
      etVerdictSimple: R`The series converges pointwise on $@A$.`,
      etVerdictSimpleSous: 'Does it converge uniformly?',
      etVerdictDiverge: 'The series diverges at every point.',
      etVerdictPasPartout: R`The series does not converge at every point of $@A$.`,
      versUniforme: 'Uniform convergence', versCauchy: 'Cauchy criterion', versTerme: 'General term', versTestM: 'M-test', versSommes: 'Partial sums',
      verdictUnif: R`The series converges uniformly on $@A$.`,
      verdictNonUnif: R`The series does not converge uniformly on $@A$.`,
      verdictCauchyOui: R`The Cauchy criterion holds on $@A$: uniform convergence.`,
      verdictCauchyNon: R`The Cauchy criterion fails on $@A$: no uniform convergence.`,
      etCauchyM1: R`Let $m > n$ and $x \in @A$. By the triangle inequality, $|f_{n+1}(x) + \cdots + f_m(x)| \le M_{n+1} + \cdots + M_m \le \rho_n$, with $M_n = {texM}$.`,
      etCauchyM2: R`Since $\sum M_n$ converges, $\rho_n = {texRho} \to 0$: given $\eps > 0$, any rank $M(\eps)$ with $\rho_{M(\eps)} < \eps$ works, for all $x \in @A$ at once.`,
      etCauchyM3: 'This is the proof of the Weierstrass $M$-test: it rests on the Cauchy criterion.',
      etCauchyT1: R`With $m = n + 1$, the block reduces to one term: $\nrm{s_{n+1} - s_n}{@A} = \nrm{f_{n+1}}{@A}$.`,
      etCauchyT2: R`But $@nTn = {tex}$ does not tend to $0$: no rank $M(\eps)$ works when $\eps$ is small.`,
      etCauchyInf: R`The blocks $f_{n+1} + \cdots + f_m$ are unbounded on $@A$: $\nrm{s_m - s_n}{@A} = +\infty$ for all $m > n$.`,
      etCauchyVoir: 'The Cauchy criterion is equivalent to uniform convergence: see the “Uniform convergence” tab for the reasoning of the notes.',
      etTerme1: R`$@nTn = {tex}$ {raison}`,
      etTermeNum: R`Supremum computed numerically: $@nT \approx {v}$.`,
      etTermeOui: R`So $@nTn \to 0$: the necessary condition holds, but <b>the test is inconclusive</b>, since its converse is false.`,
      etTermeNon: R`So $@nTn \nra 0$: by the uniform version of the term test, the series does not converge uniformly on $@A$.`,
      etTemoin: R`Witness point: $ {xn}$, where $ {val}$.`,
      verdictTermeNon: R`$@nTn \nra 0$: no uniform convergence on $@A$.`,
      verdictTermeRien: R`$@nTn \to 0$: the test is inconclusive.`,
      verdictTermeRienSous: { oui: 'The series does converge uniformly here:', non: 'Here, however, the series does not converge uniformly:', div: 'Here, the series even diverges at every point:' },
      etM1: R`For all $x \in @A$ and all $n$: $|f_n(x)| \le M_n := {texM}$, {raison}.`,
      etM2: R`The numerical series $\sum M_n$ converges: {serie}.`,
      etM3: R`By the Weierstrass $M$-test, the series $\sum f_n$ converges uniformly (and absolutely) on $@A$.`,
      etM4: R`Bound on the remainder: $|f(x) - s_n(x)| \le \rho_n = {texRho}$ for all $x \in @A$, the same number for all $x$.`,
      verdictM: R`The $M$-test applies: uniform convergence on $@A$.`,
      verdictMNon: R`The $M$-test does not apply on $@A$.`,
      verdictMNonSous: { oui: 'Yet the series converges uniformly: the test gives a sufficient condition, not a necessary one.', non: 'Besides, the series does not converge uniformly on this set.', div: 'Besides, the series diverges.' },
      numIntro: R`The application knows no reasoning for this case: it computes <b>numerical values</b> on a grid of points of $@A$.`,
      numSomme: R`The sum is estimated at each point (partial sums up to $n = 4096$, then extrapolation). Where the green curve is interrupted, the series does not seem to converge.`,
      numSimpleOui: R`At each test point of $@A$, the series seems to converge.`,
      numSimpleNon: R`At some points of $@A$, the series does not seem to converge.`,
      numTable: R`Values of $@nRn$:`, numTableT: R`Values of $@nTn$:`, numTableC: R`Values of $\nrm{s_{2n} - s_n}{@A}$:`,
      numVersZero: 'These values seem to tend to $0$.', numPasZero: 'These values do not seem to tend to $0$.',
      numMOui: R`With $M_n := @nTn$, the series $\sum M_n$ seems to converge: $\sum M_n \approx {v}$. The $M$-test would apply.`,
      numMNon: R`With $M_n := @nTn$, the best choice, the series $\sum M_n$ does not seem to converge: the $M$-test would not apply.`,
      numMInf: R`Some terms are unbounded on $@A$: no $M_n$ works.`,
      verdictNum: 'Numerical values only: to conclude, a test is needed.',
      verdictNumOui: R`Numerically, $@nRn$ seems to tend to $0$.`,
      verdictNumNon: R`Numerically, $@nRn$ does not seem to tend to $0$.`,
      verdictNumSous: 'This is not a proof: to conclude, a test is needed.',
      bX: 'x', bHorsA: R`outside $@A$`, bDiverge: 'the series diverges at this point',
      erreurs: {
        vide: 'Type the general term, in terms of <i>n</i> and <i>x</i>.',
        caractere: 'Unrecognized character: <code>{texte}</code>.',
        fin: 'The expression is incomplete.',
        parenthese: 'A closing parenthesis <code>)</code> is missing.',
        barre: 'A closing bar <code>|</code> is missing.',
        inattendu: '<code>{texte}</code> is unexpected here.',
        fonctionParenthese: 'Put the argument of <code>{texte}</code> in parentheses: <code>{texte}(x)</code>.',
        variable: 'The variables are <i>n</i> and <i>x</i>: <code>{texte}</code> is not recognized.',
        inconnu: 'Unknown name: <code>{texte}</code>.',
        indefini: 'The term is not defined on the whole interval [<i>a</i>, <i>b</i>] for the first values of <i>n</i> (division by zero or value out of the domain): change the interval.',
        intervalle: 'We need <i>a</i> &lt; <i>b</i>.',
        interne: 'Unrecognized expression.',
      },
    },
  };

  // ===========================================================================
  //  État
  // ===========================================================================
  const el = {
    zone: document.querySelector('.zone-graphe'),
    onglets: Array.from(document.querySelectorAll('.onglet')),
    courbes: $('graphe-courbes'), consCourbes: $('conteneur-courbes'), etiqCourbes: $('etiq-courbes'),
    titreCourbes: $('titre-courbes'), legende: $('legende-courbes'),
    suite: $('graphe-suite'), consSuite: $('conteneur-suite'), etiqSuite: $('etiq-suite'), titreSuite: $('titre-suite'),
    curseurN: $('curseur-n'), valN: $('val-n'), btnNMoins: $('btn-n-moins'), btnNPlus: $('btn-n-plus'), btnNDouble: $('btn-n-double'),
    btnAdditionner: $('btn-additionner'),
    btnZoomMoins: $('btn-zoom-moins'), btnZoomPlus: $('btn-zoom-plus'), btnRecadrer: $('btn-recadrer'),
    casePrecedentes: $('case-precedentes'), caseLog: $('case-log'), btnLien: $('btn-lien'), bulle: $('bulle'),
    champTerme: $('champ-terme'), apercu: $('apercu-serie'), erreur: $('erreur-terme'),
    ensembles: $('ensembles'), paramP: $('param-p'), libelleP: $('libelle-p'), curseurP: $('curseur-p'), valP: $('val-p'),
    paramAb: $('param-ab'), champA: $('champ-a'), champB: $('champ-b'), noteSerie: $('note-serie'),
    exNotes: $('exemples-notes'), exExercices: $('exemples-exercices'),
    titreTest: $('titre-test'), enonce: $('enonce'), statut: $('statut'),
    paramX0: $('param-x0'), curseurX0: $('curseur-x0'), valX0: $('val-x0'),
    paramEps: $('param-eps'), curseurEps: $('curseur-eps'), valEps: $('val-eps'),
    paramM: $('param-m'), curseurM: $('curseur-m'), valM: $('val-m'), choixM: $('choix-m'),
    boutonsM: Array.from(document.querySelectorAll('#choix-m [data-m]')),
    etapes: $('etapes'), verdict: $('verdict'), infoSuite: $('info-suite'),
    btnAide: $('btn-aide'), btnPanneau: $('btn-panneau'), btnPleinEcran: $('btn-plein-ecran'), btnLangue: $('btn-langue'),
    aide: $('aide'), btnFermerAide: $('btn-fermer-aide'), annonce: $('annonce'),
  };

  const etat = {
    langue: 'fr',
    mode: 'sommes',
    src: 'x^n',
    Se: null,                                   // la série courante (construireSerie)
    E: null,                                    // l'ensemble courant (construireEnsemble)
    ensId: null, p: null, ab: { a: -1, b: 1 },
    n: 8,
    choixM: 'double', m: null,                  // m = n + 1, m = 2n, ou un indice choisi
    eps: 0.5, x0: null,
    vue: { xmin: -1.25, xmax: 1.25, ymin: -0.6, ymax: 5.4 },
    vueN: { a: -0.6, b: 19.4 }, vueNAuto: true,
    log: false, precedentes: true,
    survol: null,                               // { x } sur le graphe du haut
    survolK: null,                              // indice survolé sur le graphe du bas
    glisse: null,                               // { type, … } pendant un glissement
    anim: null, addition: null, flash: null, accent: null,
    tailles: { courbes: { W: 800, H: 320 }, suite: { W: 800, H: 180 } },
    affinage: null,                             // minuterie : somme d'une série au choix, calcul complet
  };

  // ===========================================================================
  //  Traductions et formats
  // ===========================================================================
  function remplir(s, params) {
    if (!params) return s;
    return s.replace(/\{([A-Za-z0-9]+)\}/g, (tout, k) => (Object.prototype.hasOwnProperty.call(params, k) ? String(params[k]) : tout));
  }
  function t(cle, params) {
    let s = MSG[etat.langue][cle];
    if (s === undefined) s = MSG.fr[cle];
    if (s === undefined) return cle;
    return typeof s === 'string' ? remplir(s, params) : s;
  }
  function tErreur(code, details) {
    const d = details || {}, sur = {};
    for (const k in d) sur[k] = echapper(String(d[k]));
    return remplir(MSG[etat.langue].erreurs[code] || MSG.fr.erreurs[code] || MSG[etat.langue].erreurs.interne, sur);
  }
  function echapper(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  const fr = () => etat.langue === 'fr';
  const L = (o) => (o ? (o[etat.langue] !== undefined ? o[etat.langue] : o.fr) : '');

  // Nombre décimal : virgule en français, vrai signe moins
  function exposantTexte(e) {
    const sup = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
    return String(e).split('').map((c) => sup[c] || c).join('');
  }
  // Valeur courte (chiffres significatifs), en LaTeX : 0,75 ; 0,3679 ; 1,2 · 10⁻⁵
  function fmtCourt(v, sig) {
    if (v === Infinity) return '+\\infty';
    if (v === -Infinity) return '-\\infty';
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
  // La même, en texte (étiquettes des axes, bulles)
  function fmtTexte(v, sig) {
    if (v === Infinity) return '+∞';
    if (v === -Infinity) return '−∞';
    if (!Number.isFinite(v)) return '—';
    const a = Math.abs(v);
    let s;
    if (a !== 0 && (a < 1e-3 || a >= 1e6)) {
      const [m, e] = v.toExponential((sig || 3) - 1).split('e');
      s = String(Number(m)) + ' × 10' + exposantTexte(Number(e));
    } else s = String(Number(v.toPrecision(sig || 4)));
    if (fr()) s = s.replace('.', ',');
    return s.replace(/^-/, '−');
  }
  // Graduation : juste assez de décimales pour le pas
  function fmtGrad(v, pas) {
    if (Math.abs(v) < pas / 1e6) v = 0;
    let d = 0;
    while (d < 8 && Math.abs(pas * 10 ** d - Math.round(pas * 10 ** d)) > 1e-9 * 10 ** d) d++;
    let s = v.toFixed(d);
    if (fr()) s = s.replace('.', ',');
    return s.replace(/^-/, '−');
  }
  function fmtEntier(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, fr() ? ' ' : ',');
  }
  // Paramètre (r, a, b, δ, x_0, ε) : deux ou trois décimales
  function fmtParam(v, d) {
    let s = Number(v).toFixed(d === undefined ? 2 : d);
    if (fr()) s = s.replace('.', '{,}');
    return s;
  }

  // ===========================================================================
  //  KaTeX : formules et textes
  // ===========================================================================
  const MACROS = {
    '\\eps': '\\varepsilon', '\\bR': '\\mathbb{R}', '\\bN': '\\mathbb{N}',
    '\\nra': '\\nrightarrow', '\\cvu': '\\rightrightarrows',
    '\\nrm': '\\lVert #1 \\rVert_{#2}',
  };
  const memoTex = new Map();
  function katexHTML(tex, affichage) {
    const cle = (affichage ? 'D' : 'I') + tex;
    let h = memoTex.get(cle);
    if (h === undefined) {
      try {
        h = katex.renderToString(tex, { displayMode: !!affichage, throwOnError: false, strict: 'ignore', output: 'html', macros: Object.assign({}, MACROS) });
      } catch (_) { h = echapper(tex); }
      if (memoTex.size > 4000) memoTex.clear();
      memoTex.set(cle, h);
    }
    return h;
  }
  const K_ = (tex) => katexHTML(traduireTex(tex), false);
  // Les mots français des formules et la virgule décimale, en anglais
  function traduireTex(tex) {
    if (fr()) return tex;
    return tex.replace(/(\d)\{,\}(\d)/g, '$1.$2').replace(/\\text\{si \}/g, '\\text{if }');
  }
  // Typographie française hors des formules : espaces insécables avant : ; ? ! » et après «
  function typo(s) {
    if (!fr()) return s;
    return s.replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« ');
  }
  // Texte HTML contenant des formules entre $ … $
  function rendreTexte(str) {
    if (str == null) return '';
    const s = String(str);
    let out = '', i = 0;
    while (i < s.length) {
      const j = s.indexOf('$', i);
      if (j < 0) { out += typo(s.slice(i)); break; }
      out += typo(s.slice(i, j));
      const fin = s.indexOf('$', j + 1);
      if (fin < 0) { out += typo(s.slice(j)); break; }
      out += K_(s.slice(j + 1, fin));
      i = fin + 1;
    }
    return out;
  }
  function rendreMaths(racine) {
    racine.querySelectorAll('.m').forEach((e) => {
      const src = e.dataset.tex || e.textContent.replace(/^\s*\\\(|\\\)\s*$/g, '');
      e.dataset.tex = src;
      e.innerHTML = katexHTML(src, false);
    });
  }
  // Les jetons des textes : @A (l'ensemble), @nR (‖R_n‖ pour le n courant), @nRn, @nT, @nTn, @nTk
  function jetons(s, n) {
    const A = etat.E ? etat.E.tex : 'A';
    return s
      .replace(/@nRn/g, '\\nrm{R_n}{' + A + '}').replace(/@nR/g, '\\nrm{R_{' + n + '}}{' + A + '}')
      .replace(/@nTn/g, '\\nrm{f_n}{' + A + '}').replace(/@nTk/g, '\\nrm{f_k}{' + A + '}').replace(/@nT/g, '\\nrm{f_{' + n + '}}{' + A + '}')
      .replace(/@A/g, A);
  }
  // Un message traduit, avec ses paramètres et ses jetons, rendu en HTML
  const M_ = (cle, params) => rendreTexte(jetons(t(cle, params), etat.n));
  const texteCat = (s) => rendreTexte(jetons(s, etat.n));

  // ===========================================================================
  //  La série courante
  //    cat : l'entrée du catalogue (ou null pour une série au choix) ;
  //    terme(x, n), somme(x) (null : diverge partout), reste(x, n), exacte ;
  //    n0, points(), sauts(), domaine, fenetre, nDefaut, nmax, ncap, epsDefaut.
  // ===========================================================================
  const POINTS_ESSAI = [0.37, 0.83, 1.31, 2.17];
  function reconnaitre(T) {
    for (const c of C.SERIES) {
      let compte = 0, pareil = true;
      for (const x of POINTS_ESSAI) {
        for (const n of [1, 2, 3, 5, 6]) {
          const a = T.f(x, n), b = c.terme(x, n);
          if (!Number.isFinite(a) || !Number.isFinite(b)) { if (Number.isFinite(a) !== Number.isFinite(b)) pareil = false; continue; }
          if (Math.abs(a - b) > 1e-9 * (1 + Math.abs(b))) pareil = false;
          compte++;
        }
        if (!pareil) break;
      }
      if (pareil && compte >= 8) return c;
    }
    return null;
  }

  function serieCatalogue(c) {
    return {
      cat: c, id: c.id, src: c.src, n0: c.n0, exacte: true,
      terme: c.terme,
      somme: c.somme || null,
      reste: c.reste || (c.somme ? ((x, n) => c.somme(x) - S.sommePartielle(c.terme, c.n0, n, x)) : null),
      texTerme: () => c.texTerme, texSomme: c.texSomme, noteSomme: c.noteSomme || null,
      conv: c.conv, abs: c.abs,
      points: c.points || (() => []), sauts: c.sauts || (() => []), domaine: c.domaine || null,
      fenetre: c.fenetre, nDefaut: c.n, nmax: c.nmax, ncap: c.ncap || N_CAP, epsDefaut: c.eps,
      diverge: !!c.diverge,
    };
  }

  // Série au choix : la somme est estimée ; elle n'est calculée que sur des grilles (mises en cache)
  function seriePerso(T, ab) {
    const pts = [];
    for (let i = 0; i <= 10; i++) pts.push(ab.a + (ab.b - ab.a) * i / 10);
    const n0 = S.premierIndice(T.f, pts);
    if (n0 === null) throw new S.ErreurTerme('indefini');
    const Se = {
      cat: null, id: null, src: T.src, n0, exacte: false, T,
      terme: T.f,
      profondeur: K_SOMME,
      somme: (x) => S.estimerSomme(T.f, n0, x, Se.profondeur).v,
      texTerme: () => T.tex({ virgule: fr() }), texSomme: null, noteSomme: null, conv: null, abs: null,
      points: () => [], sauts: () => [], domaine: null,
      fenetre: null, nDefaut: 6, nmax: 60, ncap: 2000, epsDefaut: null,
      diverge: false, constant: T.constant,
    };
    Se.reste = (x, n) => Se.somme(x) - S.sommePartielle(T.f, n0, n, x);
    return Se;
  }

  // ===========================================================================
  //  L'ensemble courant
  //    def : l'ensemble du catalogue (ou null pour [a, b] au choix) ; tex ; p ;
  //    morceaux : A comme réunion d'intervalles ; noyau : où l'on échantillonne ;
  //    partiel : la borne supérieure n'est calculée que sur la partie visible.
  // ===========================================================================
  function construireEnsemble() {
    const Se = etat.Se;
    if (Se.cat && etat.ensId !== 'ab') {
      const d = Se.cat.ensembles.find((e) => e.id === etat.ensId) || Se.cat.ensembles[0];
      let p;
      if (d.param) {
        p = Number.isFinite(etat.p) ? clamp(etat.p, d.param.min, d.param.max) : d.param.defaut;
        etat.p = p;
      }
      etat.ensId = d.id;
      const morceaux = d.morceaux(p);
      let noyau = d.noyau ? d.noyau(p) : (morceaux.every((I) => Number.isFinite(I.a) && Number.isFinite(I.b)) ? morceaux : null);
      return { def: d, id: d.id, p, tex: d.tex, morceaux, noyau, partiel: !noyau && !d.infini, exact: true, uniforme: d.uniforme };
    }
    etat.ensId = 'ab';
    const I = { a: etat.ab.a, b: etat.ab.b };
    return { def: null, id: 'ab', p: undefined, tex: '[a, b]', morceaux: [I], noyau: [I], partiel: false, exact: false, uniforme: null };
  }
  const dansA = (x) => {
    const M = etat.E.morceaux;
    for (let i = 0; i < M.length; i++) { const I = M[i]; if ((I.ao ? x > I.a : x >= I.a) && (I.bo ? x < I.b : x <= I.b)) return true; }
    return false;
  };
  const dansDomaine = (x) => { const D = etat.Se.domaine; return !D || (x >= D.a && x <= D.b); };
  // Le noyau, avec les extrémités ouvertes de A reportées ; pour un ensemble « partiel », la partie visible
  function noyauCourant() {
    const E = etat.E;
    if (E.noyau) {
      return E.noyau.map((I) => {
        const m = E.morceaux.find((J) => J.a <= I.a && J.b >= I.b) || {};
        return { a: I.a, b: I.b, ao: !!m.ao && m.a === I.a, bo: !!m.bo && m.b === I.b };
      });
    }
    const res = [];
    for (const I of E.morceaux) {
      const a = Math.max(I.a, etat.vue.xmin), b = Math.min(I.b, etat.vue.xmax);
      if (b > a) res.push({ a, b, ao: !!I.ao && a === I.a, bo: !!I.bo && b === I.b });
    }
    return res;
  }

  // ===========================================================================
  //  Calculs sur A (mis en cache tant que la série et l'ensemble ne changent pas)
  // ===========================================================================
  const calc = { cle: null };
  function cleCalc() {
    const Se = etat.Se, E = etat.E;
    let c = (Se.id || 'f:' + Se.src) + '|' + Se.n0 + '|' + E.id + '|' + (E.p === undefined ? '' : E.p) + '|' + (E.id === 'ab' ? etat.ab.a + ',' + etat.ab.b : '');
    if (E.partiel) c += '|' + etat.vue.xmin.toPrecision(6) + ',' + etat.vue.xmax.toPrecision(6);
    if (!Se.exacte) c += '|K' + Se.profondeur;
    return c;
  }
  function assurerCalc() {
    const c = cleCalc();
    if (calc.cle === c) return;
    calc.cle = c;
    calc.noyau = noyauCourant();
    calc.grilles = new Map();      // NA → { xs, F, diverge }
    calc.nR = new Map();           // n → { v, x }
    calc.lotR = null;              // { K, v[] }
    calc.nT = new Map();
    calc.cauchy = null;            // { n, K, v[] }
    calc.sommeM = null;
  }
  // Grille de NA points sur le noyau, et la somme en ces points
  function grilleA(NA) {
    assurerCalc();
    let G = calc.grilles.get(NA);
    if (G) return G;
    const N = calc.noyau, Se = etat.Se;
    const total = N.reduce((s, I) => s + (I.b - I.a), 0) || 1;
    const xs = [];
    for (const I of N) {
      const k = Math.max(8, Math.round(NA * (I.b - I.a) / total));
      const marge = 1e-9 * Math.max(I.b - I.a, 1e-9);
      const a = I.ao ? I.a + marge : I.a, b = I.bo ? I.b - marge : I.b;
      for (let i = 0; i <= k; i++) xs.push(i === k ? b : a + (b - a) * i / k);
    }
    const X = Float64Array.from(xs), F = new Float64Array(X.length);
    let diverge = !Se.somme;
    if (Se.somme) for (let i = 0; i < X.length; i++) { F[i] = Se.somme(X[i]); if (!Number.isFinite(F[i])) diverge = true; }
    G = { xs: X, F, diverge };
    calc.grilles.set(NA, G);
    return G;
  }
  // La série converge-t-elle en chaque point (d'essai) de A ?
  function convergeSurA() {
    if (!etat.Se.somme || etat.Se.diverge) return false;
    if (etat.E.def) return true;                  // les ensembles du catalogue sont dans l'ensemble de convergence
    if (!calc.noyau || !calc.noyau.length) assurerCalc();
    return !grilleA(etat.Se.exacte ? 400 : 240).diverge;
  }

  // ‖R_n‖_A : { v, exact, x }
  function normeR(n) {
    assurerCalc();
    const Se = etat.Se, E = etat.E;
    if (!Se.somme) return { v: NaN };
    if (E.def && E.def.nR) return { v: E.def.nR.f(n, E.p), exact: true };
    let r = calc.nR.get(n);
    if (r) return r;
    if (!calc.noyau.length) r = { v: NaN };
    else if (Se.exacte) r = S.supAbs((x) => Se.reste(x, n), calc.noyau, clamp(8 * n, 600, 3000));
    else {
      const G = grilleA(600);
      if (G.diverge) r = { v: NaN };
      else {
        const Sn = S.sommesSurGrille(Se.terme, Se.n0, G.xs, [n]).get(n);
        let v = 0, x = NaN;
        for (let i = 0; i < Sn.length; i++) { const d = Math.abs(G.F[i] - Sn[i]); if (d > v) { v = d; x = G.xs[i]; } }
        r = { v, x };
      }
    }
    calc.nR.set(n, r);
    return r;
  }
  // Les normes ‖R_k‖_A pour k ≤ K, en un seul passage (bornes supérieures numériques)
  function lotNormesR(K) {
    assurerCalc();
    const Se = etat.Se;
    K = Math.min(K, 1200);
    if (calc.lotR && calc.lotR.K >= K) return calc.lotR;
    const G = grilleA(Se.exacte ? clamp(16 * K, 800, 3200) : 600);
    const v = [];
    if (!G.diverge) {
      const Sk = new Float64Array(G.xs.length);
      for (let k = Se.n0; k <= K; k++) {
        let m = 0;
        for (let i = 0; i < Sk.length; i++) {
          Sk[i] += Se.terme(G.xs[i], k);
          const d = Math.abs(G.F[i] - Sk[i]);
          if (d > m) m = d;
        }
        v[k] = m;
      }
    }
    calc.lotR = { K, v, diverge: G.diverge };
    return calc.lotR;
  }
  // Valeur pour le graphe du bas : exacte si possible, sinon le lot numérique
  function normeRSuite(k, K) {
    const E = etat.E;
    if (!etat.Se.somme) return NaN;
    if (E.def && E.def.nR) return E.def.nR.f(k, E.p);
    if (k === etat.n) return normeR(k).v;
    const lot = lotNormesR(Math.max(K, 40));
    return lot.diverge ? NaN : lot.v[k];
  }

  // ‖f_n‖_A : { v, exact }
  function normeT(n) {
    assurerCalc();
    const Se = etat.Se, E = etat.E;
    if (E.def && E.def.nT && E.def.nT.f) return { v: E.def.nT.f(n, E.p), exact: true };
    let r = calc.nT.get(n);
    if (r) return r;
    if (E.def && E.def.infini) r = { v: Infinity };
    else if (!calc.noyau.length) r = { v: NaN };
    else r = S.supAbs((x) => Se.terme(x, n), calc.noyau, clamp(8 * n, 400, 2000));
    calc.nT.set(n, r);
    return r;
  }

  // Le test M : s'applique-t-il ? M_k et ρ_n
  const testM = () => (etat.E.def && etat.E.def.M && etat.E.def.M.f ? etat.E.def.M : null);
  const valM = (k) => { const M = testM(); return M ? M.f(k, etat.E.p) : normeT(k).v; };
  // Série ou ensemble au choix : Σ ‖f_k‖_A converge-t-elle numériquement ? (blocs dyadiques)
  //   → { infini, converge, total, K, rho(n) } ; rho(n) = Σ_{k > n} ‖f_k‖_A, la queue (NaN au-delà de K)
  function sommeNumeriqueM() {
    assurerCalc();
    if (calc.sommeM) return calc.sommeM;
    // série au choix : pendant un geste (profondeur réduite), un calcul plus court ; il est refait ensuite
    const Se = etat.Se, court = !Se.exacte && Se.profondeur < K_SOMME, J = court ? 9 : 11;
    const G = grilleA(Se.exacte ? 400 : court ? 120 : 240);
    let total = 0, infini = false;
    const blocs = [];
    let k = Se.n0, borne = Math.max(2, Se.n0 + 1), bloc = 0;
    const fin = 2 ** J, cumul = new Float64Array(fin + 1);
    for (; k <= fin; k++) {
      let m = 0;
      for (let i = 0; i < G.xs.length; i++) { const a = Math.abs(Se.terme(G.xs[i], k)); if (a > m) m = a; }
      if (!Number.isFinite(m)) { infini = true; break; }
      total += m; bloc += m; cumul[k] = total;
      if (k === borne) { blocs.push(bloc); bloc = 0; borne *= 2; }
    }
    let converge = false, queue = 0;
    if (!infini && blocs.length >= 4) {
      const d = blocs.length - 1, r1 = blocs[d] / blocs[d - 1], r2 = blocs[d - 1] / blocs[d - 2];
      if (blocs[d] < 1e-12) converge = true;
      else if (r1 < 0.9 && r2 < 0.92) { converge = true; queue = blocs[d] * r1 / (1 - r1); }
    }
    const somme = total + queue, n0 = Se.n0;
    const rho = (n) => (!converge || n > fin ? NaN : n < n0 ? somme : Math.max(0, somme - cumul[n]));
    calc.sommeM = { infini, converge, total: somme, K: fin, rho };
    return calc.sommeM;
  }
  // Le test M « numérique » : pour une série ou un ensemble au choix, avec M_k := ‖f_k‖_A, si Σ M_k semble converger
  const testMNum = () => { if (etat.E.def) return null; const sm = sommeNumeriqueM(); return sm.converge ? sm : null; };
  const valRho = (n) => { const M = testM(); if (M) return M.rho(n, etat.E.p); const sm = testMNum(); return sm ? sm.rho(n) : NaN; };

  // ‖s_k − s_n‖_A pour n < k ≤ K (critère de Cauchy), en un passage
  function lotCauchy(n, K) {
    assurerCalc();
    const Se = etat.Se, E = etat.E;
    if (calc.cauchy && calc.cauchy.n === n && calc.cauchy.K >= K) return calc.cauchy;
    const v = [];
    if (E.def && E.def.infini) { for (let k = n + 1; k <= K; k++) v[k] = Infinity; }
    else if (calc.noyau.length) {
      const G = grilleA(Se.exacte ? clamp(12 * K, 600, 2400) : 600);
      const D = new Float64Array(G.xs.length);
      for (let k = n + 1; k <= K; k++) {
        let m = 0;
        for (let i = 0; i < D.length; i++) {
          D[i] += Se.terme(G.xs[i], k);
          const d = Math.abs(D[i]);
          if (d > m) m = d;
        }
        v[k] = m;
      }
    }
    calc.cauchy = { n, K, v };
    return calc.cauchy;
  }
  function normeC(n, m) {
    if (etat.E.def && etat.E.def.infini) return { v: Infinity, exact: true };
    if (!calc.noyau || !calc.noyau.length) { assurerCalc(); if (!calc.noyau.length) return { v: NaN }; }
    const Se = etat.Se;
    return S.supAbs((x) => S.sommePartielle(Se.terme, n + 1, m, x), calc.noyau, clamp(8 * m, 600, 2400));
  }

  // Rang N(ε) : le plus petit N tel que ‖R_k‖_A < ε pour tout k ≥ N
  //   { N } | { aucun: true } | { loin: K } ; numerique : vérifié jusqu'à K seulement
  function rang(eps) {
    const Se = etat.Se, E = etat.E;
    if (!Se.somme || (E.def && E.uniforme === false)) return { aucun: true };
    if (E.def && E.def.nR) {
      const f = (k) => E.def.nR.f(k, E.p);
      if (E.def.nR.decroit) {
        if (f(Se.n0) < eps) return { N: Se.n0 };
        let lo = Se.n0, hi = Math.max(1, Se.n0 + 1);
        while (!(f(hi) < eps)) { lo = hi; hi *= 2; if (hi > 1e7) return { loin: 1e7 }; }
        while (hi - lo > 1) { const mi = Math.floor((lo + hi) / 2); if (f(mi) < eps) hi = mi; else lo = mi; }
        return { N: hi };
      }
    }
    const lot = lotNormesR(K_RANG);
    if (lot.diverge) return { aucun: true };
    let dernier = Se.n0 - 1;
    for (let k = Se.n0; k <= lot.K; k++) if (!(lot.v[k] < eps)) dernier = k;
    if (dernier >= lot.K) return { loin: lot.K, numerique: true };
    return { N: dernier + 1, numerique: true, K: lot.K };
  }

  // ===========================================================================
  //  Les indices : n, m, les sommes précédentes
  // ===========================================================================
  function mCourant() {
    const n = etat.n;
    if (etat.choixM === 'suivant') return n + 1;
    if (etat.choixM === 'libre' && Number.isFinite(etat.m) && etat.m > n) return Math.min(etat.m, mMax());
    return Math.max(n + 1, Math.min(2 * n, mMax()));
  }
  const mMax = () => Math.min(etat.Se.ncap * 2, Math.max(2 * etat.n + 20, etat.n + 40));
  // Comme dans les figures des notes : s_{n/2}, s_{n/4}, … (pour n = 8 : s_4, s_2, s_1)
  function indicesPrecedents(n) {
    const res = [];
    if (!etat.precedentes) return res;
    const bas = Math.max(etat.Se.n0, 1);
    let k = Math.floor(n / 2);
    while (k >= bas && res.length < 5) {
      if (k < n) res.push(k);
      if (k === bas) break;
      k = Math.floor(k / 2);
    }
    return res;
  }

  // ===========================================================================
  //  La vue du graphe du haut (x et y) et celle du graphe du bas (les indices)
  // ===========================================================================
  // Étendue robuste : sans les valeurs extrêmes d'une courbe qui explose
  function etendue(tableaux, inclure) {
    const vals = [];
    for (const T of tableaux) for (let i = 0; i < T.length; i++) if (Number.isFinite(T[i])) vals.push(T[i]);
    if (inclure) for (const v of inclure) if (Number.isFinite(v)) vals.push(v);
    if (!vals.length) return { lo: -1, hi: 1 };
    vals.sort((p, q) => p - q);
    const q = (u) => vals[Math.min(vals.length - 1, Math.max(0, Math.round(u * (vals.length - 1))))];
    let lo = vals[0], hi = vals[vals.length - 1];
    const qlo = q(0.03), qhi = q(0.97), coeur = Math.max(qhi - qlo, 1e-12);
    if (hi - lo > 4 * coeur) { lo = Math.max(lo, qlo - 0.6 * coeur); hi = Math.min(hi, qhi + 0.6 * coeur); }
    if (inclure) for (const v of inclure) if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    if (hi - lo < 1e-9) { const d = Math.max(1e-3, Math.abs(hi) * 0.5); lo -= d; hi += d; }
    return { lo, hi };
  }
  const bornesA = () => {
    const M = etat.E.morceaux;
    const a = Math.min(...M.map((I) => I.a)), b = Math.max(...M.map((I) => I.b));
    return { a, b, borne: Number.isFinite(a) && Number.isFinite(b) };
  };
  function grilleSimple(xmin, xmax, N) {
    const xs = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) xs[i] = xmin + (xmax - xmin) * i / N;
    return xs;
  }
  // Fenêtre de départ : celle de la série (catalogue), élargie pour montrer A ; calculée pour une série au choix
  function vueDefaut() {
    const Se = etat.Se, E = etat.E, mode = etat.mode, n = etat.n;
    const A = bornesA();
    let x0, x1;
    if (Se.fenetre) { x0 = Se.fenetre.xmin; x1 = Se.fenetre.xmax; }
    else { const Lg = A.b - A.a; x0 = A.a - 0.14 * Lg; x1 = A.b + 0.14 * Lg; }
    let elargi = !Se.fenetre;
    if (A.borne) {
      const Lg = Math.max(A.b - A.a, 1e-6);
      if (A.a - 0.06 * Lg < x0) { x0 = A.a - 0.1 * Lg; elargi = true; }
      if (A.b + 0.06 * Lg > x1) { x1 = A.b + 0.1 * Lg; elargi = true; }
    }
    // les ordonnées
    const xs = grilleSimple(x0, x1, 240);
    const dedans = (x) => dansDomaine(x) && (!A.borne || dansA(x));
    const surA = (ys) => { const r = []; for (let i = 0; i < xs.length; i++) if (dedans(xs[i])) r.push(ys[i]); return r.length ? r : Array.from(ys); };
    let lo, hi;
    if (mode === 'terme') {
      const ks = indicesPrecedents(n).concat([n]);
      const T = ks.map((k) => surA(Array.from(xs, (x) => Se.terme(x, k))));
      ({ lo, hi } = etendue(T, [0]));
      const h = Math.max(Math.abs(lo), Math.abs(hi));
      if (lo < -0.02 * h) { lo = -h; hi = h; }
    } else if (mode === 'cauchy') {
      const m = mCourant();
      const D = S.sommesSurGrille(Se.terme, n + 1, xs, [m]).get(m);
      ({ lo, hi } = etendue([surA(D)], [0, etat.eps, -etat.eps]));
      const h = Math.max(Math.abs(lo), Math.abs(hi), 1.6 * etat.eps);
      lo = -h; hi = h;
    } else if (Se.fenetre && !elargi) {
      lo = Se.fenetre.ymin; hi = Se.fenetre.ymax;
    } else {
      const ks = [Se.n0, Math.max(Se.n0, Math.min(n, 12)), n];
      const sommes = S.sommesSurGrille(Se.terme, Se.n0, xs, ks);
      const T = ks.map((k) => surA(sommes.get(k)));
      if (Se.somme && Se.exacte) T.push(surA(Array.from(xs, (x) => Se.somme(x))));
      else if (Se.somme) T.push(Array.from(grilleA(240).F));
      ({ lo, hi } = etendue(T, Se.fenetre ? [Se.fenetre.ymin, Se.fenetre.ymax] : [0]));
    }
    const dy = hi - lo;
    if (!(Se.fenetre && !elargi) || mode === 'terme' || mode === 'cauchy') { lo -= 0.1 * dy; hi += 0.16 * dy; }
    return { xmin: x0, xmax: x1, ymin: lo, ymax: hi };
  }
  function recadrer(immediat) {
    etat.vueNAuto = true;
    allerVers(vueDefaut(), immediat);
  }
  function allerVers(v, immediat) {
    const cible = { xmin: v.xmin, xmax: v.xmax, ymin: v.ymin, ymax: v.ymax };
    if (!(cible.xmax - cible.xmin > 1e-9) || !(cible.ymax - cible.ymin > 1e-12)) return;
    if (immediat || REDUIT || MODE_TEST) { etat.vue = cible; etat.anim = null; dessiner(); return; }
    etat.anim = { de: Object.assign({}, etat.vue), vers: cible, debut: performance.now() };
    requestAnimationFrame(animerVue);
  }
  function animerVue(maintenant) {
    const A = etat.anim;
    if (!A) return;
    const u = clamp((maintenant - A.debut) / 300, 0, 1);
    const e = 1 - Math.pow(1 - u, 3);
    const mel = (k) => A.de[k] + (A.vers[k] - A.de[k]) * e;
    etat.vue = { xmin: mel('xmin'), xmax: mel('xmax'), ymin: mel('ymin'), ymax: mel('ymax') };
    dessiner();
    if (u < 1) requestAnimationFrame(animerVue); else etat.anim = null;
  }
  // Zoom autour du point (cx, cy) ; fx, fy : facteurs sur chaque axe
  function zoomer(fx, fy, cx, cy) {
    const v = etat.anim ? etat.anim.vers : etat.vue;
    if (cx === undefined) cx = (v.xmin + v.xmax) / 2;
    if (cy === undefined) cy = (v.ymin + v.ymax) / 2;
    const larg = (v.xmax - v.xmin) * fx, haut = (v.ymax - v.ymin) * fy;
    if (larg < 1e-7 || larg > 1e7 || haut < 1e-9 || haut > 1e9) return;
    allerVers({ xmin: cx - (cx - v.xmin) * fx, xmax: cx + (v.xmax - cx) * fx, ymin: cy - (cy - v.ymin) * fy, ymax: cy + (v.ymax - cy) * fy }, false);
    marquerGeste();
  }
  // Graphe du bas : les indices visibles
  function vueNDefaut() {
    const n0 = etat.Se.n0, n = etat.n;
    if (etat.mode === 'cauchy') {
      const m = mCourant();
      return { a: n - 0.6, b: Math.max(n + 20.4, m + 0.15 * (m - n) + 3.4) };
    }
    return { a: n0 - 0.6, b: Math.max(n0 + 19.4, n + 0.15 * (n - n0) + 3.4) };
  }
  function ajusterVueN() {
    if (etat.vueNAuto) { etat.vueN = vueNDefaut(); return; }
    // la ligne n (ou m) doit rester visible
    const v = etat.vueN, cible = etat.mode === 'cauchy' ? mCourant() : etat.n;
    if (cible > v.b - 0.5) { const d = cible + 2.4 - v.b; etat.vueN = { a: v.a, b: v.b + d }; }
    if (etat.n < v.a + 0.5) { etat.vueN = { a: etat.n - 0.6, b: v.b }; }
  }
  function zoomerN(facteur, centre) {
    const v = etat.vueN, bas = (etat.mode === 'cauchy' ? etat.n : etat.Se.n0) - 0.6;
    const c = centre === undefined ? (v.a + v.b) / 2 : centre;
    let a = Math.max(bas, c - (c - v.a) * facteur), b = c + (v.b - c) * facteur;
    if (b - a < 4) b = a + 4;
    if (b - a > LARGEUR_MAX_VUE_N) b = a + LARGEUR_MAX_VUE_N;
    etat.vueN = { a, b };
    etat.vueNAuto = false;
    dessinerSuite();
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
  function geoCourbes() {
    const T = etat.tailles.courbes, v = etat.vue;
    const x0 = MARGE.g, x1 = T.W - MARGE.d, y0 = T.H - MARGE.b, y1 = MARGE.h;
    const ex = (x1 - x0) / (v.xmax - v.xmin), ey = (y0 - y1) / (v.ymax - v.ymin);
    return {
      W: T.W, H: T.H, x0, x1, y0, y1, ex, ey,
      X: (x) => x0 + (x - v.xmin) * ex, Y: (y) => y0 - (y - v.ymin) * ey,
      xDe: (px) => v.xmin + (px - x0) / ex, yDe: (py) => v.ymin + (y0 - py) / ey,
    };
  }
  function geoSuite() {
    const T = etat.tailles.suite, v = etat.vueN;
    const x0 = MARGE.g, x1 = T.W - MARGE.d, y0 = T.H - MARGE.b, y1 = MARGE.h;
    const w = (x1 - x0) / (v.b - v.a);
    return { W: T.W, H: T.H, x0, x1, y0, y1, w, X: (k) => x0 + (k - v.a) * w, kDe: (px) => v.a + (px - x0) / w };
  }

  // La grille des abscisses : points réguliers, plus les points particuliers (extrémités
  // de A, points où la somme est discontinue ou cesse d'exister).
  //   coupe[i] = 1 : la courbe de f est interrompue entre x_i et x_{i+1}
  let cacheGrille = null;
  function grilleX(g) {
    const v = etat.vue, Se = etat.Se, E = etat.E;
    const N = clamp(Math.round(g.x1 - g.x0), 240, 1400);
    const cle = [v.xmin, v.xmax, N, Se.id || Se.src, Se.n0, E.id, E.p, etat.ab.a, etat.ab.b].join('|');
    if (cacheGrille && cacheGrille.cle === cle) return cacheGrille;
    const larg = v.xmax - v.xmin, d = 2e-7 * larg;
    const pts = [];
    for (let i = 0; i <= N; i++) pts.push(v.xmin + larg * i / N);
    const speciaux = Se.points(v.xmin, v.xmax).filter((p) => p > v.xmin && p < v.xmax);
    for (const p of speciaux) pts.push(p - d, p, p + d);
    for (const I of E.morceaux) for (const b of [I.a, I.b]) if (Number.isFinite(b) && b > v.xmin && b < v.xmax) pts.push(b);
    if (Se.domaine) for (const b of [Se.domaine.a, Se.domaine.b]) if (Number.isFinite(b) && b > v.xmin && b < v.xmax) pts.push(b);
    pts.sort((p, q) => p - q);
    const xs = [];
    for (const p of pts) if (!xs.length || p - xs[xs.length - 1] > 1e-12 * Math.max(1, Math.abs(p))) xs.push(p);
    const X = Float64Array.from(xs), n = X.length;
    const inA = new Uint8Array(n), dom = new Uint8Array(n), coupe = new Uint8Array(n);
    for (let i = 0; i < n; i++) { inA[i] = dansA(X[i]) ? 1 : 0; dom[i] = dansDomaine(X[i]) ? 1 : 0; }
    for (const p of speciaux) {
      // l'indice du point p
      let lo = 0, hi = n - 1;
      while (lo < hi) { const mi = (lo + hi) >> 1; if (X[mi] < p) lo = mi + 1; else hi = mi; }
      if (lo > 0) coupe[lo - 1] = 1;
      coupe[lo] = 1;
    }
    cacheGrille = { cle, xs: X, inA, dom, coupe, F: null, cleF: null };
    return cacheGrille;
  }
  // La somme f sur la grille (série au choix : grille plus grossière, puis interpolation)
  function valeursF(G) {
    const Se = etat.Se;
    if (!Se.somme) return null;
    const cleF = Se.exacte ? 'x' : 'K' + Se.profondeur;
    if (G.F && G.cleF === cleF) return G.F;
    const n = G.xs.length, F = new Float64Array(n);
    if (Se.exacte) {
      for (let i = 0; i < n; i++) F[i] = G.dom[i] ? Se.somme(G.xs[i]) : NaN;
    } else {
      const pas = Math.max(1, Math.ceil(n / (Se.profondeur >= K_SOMME ? 420 : 160)));
      let iPrec = -1, fPrec = NaN;
      for (let i = 0; i < n; i += pas) {
        const f = Se.somme(G.xs[i]);
        F[i] = f;
        if (iPrec >= 0) for (let j = iPrec + 1; j < i; j++) {
          const u = (G.xs[j] - G.xs[iPrec]) / (G.xs[i] - G.xs[iPrec]);
          F[j] = Number.isFinite(f) && Number.isFinite(fPrec) ? fPrec + (f - fPrec) * u : NaN;
        }
        iPrec = i; fPrec = f;
      }
      for (let j = iPrec + 1; j < n; j++) F[j] = NaN;
      if (iPrec < n - 1) F[n - 1] = Se.somme(G.xs[n - 1]);
    }
    G.F = F; G.cleF = cleF;
    return F;
  }
  function masquer(G, ys) {
    if (!etat.Se.domaine) return ys;
    for (let i = 0; i < ys.length; i++) if (!G.dom[i]) ys[i] = NaN;
    return ys;
  }

  // Le chemin SVG d'une courbe (interrompue aux valeurs non finies et aux coupures)
  function chemin(G, ys, g, coupe) {
    const xs = G.xs, haut = g.y1 - 2500, bas = g.y0 + 2500;
    let d = '', ouvert = false, yPrec = 0;
    for (let i = 0; i < xs.length; i++) {
      const y = ys[i];
      if (!Number.isFinite(y)) { ouvert = false; continue; }
      const py = clamp(g.Y(y), haut, bas);
      // une asymptote : deux points consécutifs hors du cadre, de part et d'autre
      if (ouvert && ((yPrec < g.y1 - 40 && py > g.y0 + 40) || (yPrec > g.y0 + 40 && py < g.y1 - 40))) ouvert = false;
      d += (ouvert ? 'L' : 'M') + g.X(xs[i]).toFixed(1) + ' ' + py.toFixed(1);
      ouvert = !(coupe && coupe[i]);
      yPrec = py;
    }
    return d;
  }
  // La bande centre ± demi au-dessus de A : { aire, haut, bas } (chemins SVG)
  function cheminsBande(G, centre, demi, g, coupe) {
    const xs = G.xs, lim = (y) => clamp(g.Y(y), g.y1 - 2500, g.y0 + 2500);
    let aire = '', haut = '', bas = '';
    let i = 0;
    const n = xs.length;
    const valide = (j) => G.inA[j] && Number.isFinite(centre[j]);
    while (i < n) {
      if (!valide(i)) { i++; continue; }
      let j = i;
      while (j + 1 < n && valide(j + 1) && !(coupe && coupe[j])) j++;
      if (j > i) {
        let h = '', b = '';
        for (let k = i; k <= j; k++) {
          const X = g.X(xs[k]).toFixed(1);
          h += (k === i ? 'M' : 'L') + X + ' ' + lim(centre[k] + demi).toFixed(1);
        }
        for (let k = j; k >= i; k--) {
          const X = g.X(xs[k]).toFixed(1);
          b += 'L' + X + ' ' + lim(centre[k] - demi).toFixed(1);
        }
        aire += h + b + 'Z';
        haut += h;
        bas += 'M' + b.slice(1);
      }
      i = j + 1;
    }
    return { aire, haut, bas };
  }
  // Les morceaux de la courbe qui sortent de la bande, au-dessus de A
  function cheminHors(G, cur, centre, demi, g) {
    const xs = G.xs;
    const hors = (i) => G.inA[i] && Number.isFinite(cur[i]) && Number.isFinite(centre[i]) && Math.abs(cur[i] - centre[i]) >= demi;
    let d = '', ouvert = false;
    for (let i = 0; i < xs.length; i++) {
      if (!hors(i)) { ouvert = false; continue; }
      d += (ouvert ? 'L' : 'M') + g.X(xs[i]).toFixed(1) + ' ' + clamp(g.Y(cur[i]), g.y1 - 2500, g.y0 + 2500).toFixed(1);
      ouvert = true;
    }
    return d;
  }

  // Graduations en multiples de π (séries trigonométriques)
  const SERIES_PI = { cosinus: 1, sinus2: 1, sinus3: 1, derivee: 1, P2: 1, T1: 1 };
  function gradPi(xmin, xmax, cible) {
    const larg = xmax - xmin;
    let den = 4;
    for (const d of [4, 2, 1]) if (larg / (Math.PI / d) <= cible) { den = d; break; } else den = 0;
    if (!den) return null;
    const pas = Math.PI / den, res = [];
    for (let k = Math.ceil(xmin / pas - 1e-9); k * pas <= xmax + 1e-9; k++) {
      let num = k, dd = den;
      while (dd > 1 && num % 2 === 0) { num /= 2; dd /= 2; }
      const txt = num === 0 ? '0' : (num === 1 ? '' : num === -1 ? '−' : String(num).replace('-', '−')) + 'π' + (dd > 1 ? '/' + dd : '');
      res.push({ x: k * pas, txt });
    }
    return res;
  }

  // Le repère : grille, axes, graduations
  function dessinerRepere(g, gr, couche) {
    const v = etat.vue;
    // abscisses
    const cibleX = Math.max(3, (g.x1 - g.x0) / 86);
    let gx = null;
    if (etat.Se.cat && SERIES_PI[etat.Se.cat.id]) gx = gradPi(v.xmin, v.xmax, cibleX + 3);
    if (!gx) {
      const pas = S.pasJoli(v.xmax - v.xmin, cibleX);
      gx = [];
      for (let k = Math.ceil(v.xmin / pas - 1e-9); k * pas <= v.xmax + 1e-9 * pas; k++) gx.push({ x: k * pas, txt: fmtGrad(k * pas, pas) });
    }
    for (const q of gx) {
      const X = g.X(q.x);
      if (X < g.x0 - 0.5 || X > g.x1 + 0.5) continue;
      svg('line', { x1: X, x2: X, y1: g.y1, y2: g.y0, class: 'grille' }, gr);
      svg('line', { x1: X, x2: X, y1: g.y0, y2: g.y0 + 4, class: 'axe' }, gr);
      if (X < g.x1 - 14) etiquette(couche, X, g.y0 + 5, q.txt, 'axe axe-x');
    }
    etiquette(couche, g.x1 - 2, g.y0 + 5, '<i>x</i>', 'axe axe-x');
    // ordonnées
    const pasY = S.pasJoli(v.ymax - v.ymin, Math.max(2, (g.y0 - g.y1) / 44));
    for (let k = Math.ceil(v.ymin / pasY - 1e-9); k * pasY <= v.ymax + 1e-9 * pasY; k++) {
      const y = k * pasY, Y = g.Y(y);
      if (Y > g.y0 + 0.5 || Y < g.y1 - 0.5) continue;
      svg('line', { x1: g.x0, x2: g.x1, y1: Y, y2: Y, class: 'grille' }, gr);
      etiquette(couche, g.x0 - 6, Y, fmtGrad(y, pasY), 'axe axe-y');
    }
    // axes : le cadre à gauche et en bas, et les droites x = 0 et y = 0
    if (v.ymin < 0 && v.ymax > 0) svg('line', { x1: g.x0, x2: g.x1, y1: g.Y(0), y2: g.Y(0), class: 'axe-zero' }, gr);
    if (v.xmin < 0 && v.xmax > 0) svg('line', { x1: g.X(0), x2: g.X(0), y1: g.y1, y2: g.y0, class: 'axe-zero' }, gr);
    svg('line', { x1: g.x0, x2: g.x0, y1: g.y1, y2: g.y0, class: 'axe' }, gr);
    svg('line', { x1: g.x0, x2: g.x1, y1: g.y0, y2: g.y0, class: 'axe' }, gr);
  }

  // ===========================================================================
  //  Les données du graphe du haut, selon l'onglet
  //    cur : la courbe dorée ; centre, demi : la bande ; F : la somme ;
  //    fantomes : [{ k, ys }] ; avant : la courbe précédente (terme ajouté)
  // ===========================================================================
  let donnees = null;
  function calculerDonnees(G) {
    const Se = etat.Se, n = etat.n, mode = etat.mode, xs = G.xs;
    const D = { mode, cur: null, centre: null, demi: null, F: null, fantomes: [], avant: null, nomCur: 's_{' + n + '}', lettre: 's' };
    const prec = indicesPrecedents(n);
    if (mode === 'cauchy') {
      const m = mCourant();
      D.m = m;
      D.cur = masquer(G, S.sommesSurGrille(Se.terme, n + 1, xs, [m]).get(m));
      D.centre = new Float64Array(xs.length);
      D.demi = etat.eps;
      D.nomCur = 's_{' + m + '} - s_{' + n + '}';
    } else if (mode === 'terme') {
      const f = (k) => { const ys = new Float64Array(xs.length); for (let i = 0; i < ys.length; i++) ys[i] = Se.terme(xs[i], k); return masquer(G, ys); };
      D.cur = f(n);
      D.fantomes = prec.map((k) => ({ k, ys: f(k) }));
      D.centre = new Float64Array(xs.length);
      D.nomCur = 'f_{' + n + '}';
      D.lettre = 'f';
    } else {
      const indices = prec.concat([n]);
      if (etat.flash === n && n > Se.n0) indices.push(n - 1);
      const sommes = S.sommesSurGrille(Se.terme, Se.n0, xs, indices);
      D.cur = masquer(G, sommes.get(n));
      D.fantomes = prec.map((k) => ({ k, ys: masquer(G, sommes.get(k)) }));
      if (etat.flash === n && n > Se.n0) D.avant = masquer(G, sommes.get(n - 1));
      D.F = valeursF(G);
      if (mode === 'uniforme' && D.F) { D.centre = D.F; D.demi = etat.eps; }
      if (mode === 'testm' && D.F && Number.isFinite(valRho(n))) { D.centre = D.F; D.demi = valRho(n); D.rho = true; }
    }
    // le plus grand écart visible au-dessus de A
    if (D.centre) {
      let v = -1, ix = -1;
      for (let i = 0; i < xs.length; i++) {
        if (!G.inA[i] || !Number.isFinite(D.cur[i]) || !Number.isFinite(D.centre[i])) continue;
        const d = Math.abs(D.cur[i] - D.centre[i]);
        if (d > v) { v = d; ix = i; }
      }
      if (ix >= 0) D.ecart = { v, i: ix };
    }
    return D;
  }

  // ===========================================================================
  //  Le graphe du haut
  // ===========================================================================
  function dessinerCourbes() {
    const svgEl = el.courbes, couche = el.etiqCourbes;
    svgEl.textContent = '';
    couche.textContent = '';
    const g = geoCourbes();
    svgEl.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H);
    const Se = etat.Se, E = etat.E, mode = etat.mode, n = etat.n, v = etat.vue;

    const defs = svg('defs', {}, svgEl);
    const clip = svg('clipPath', { id: 'cadre-courbes' }, defs);
    svg('rect', { x: g.x0, y: g.y1, width: g.x1 - g.x0, height: g.y0 - g.y1 }, clip);
    const motif = svg('pattern', { id: 'hachures', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    svg('rect', { x: 0, y: 0, width: 7, height: 7, fill: 'rgba(240, 239, 233, .35)' }, motif);
    svg('line', { x1: 0, y1: 0, x2: 0, y2: 7, stroke: '#D8D5C9', 'stroke-width': 1.6 }, motif);

    const fond = svg('g', {}, svgEl);
    const dedans = svg('g', { 'clip-path': 'url(#cadre-courbes)' }, svgEl);
    const dessus = svg('g', {}, svgEl);

    // hors du domaine, hors de A
    if (Se.domaine) {
      for (const [a, b] of [[v.xmin, Math.min(v.xmax, Se.domaine.a)], [Math.max(v.xmin, Se.domaine.b), v.xmax]]) {
        if (b > a) svg('rect', { x: g.X(a), y: g.y1, width: g.X(b) - g.X(a), height: g.y0 - g.y1, class: 'hors-domaine' }, fond);
      }
    }
    {
      const M = E.morceaux.slice().sort((p, q) => p.a - q.a);
      let x = v.xmin;
      for (const I of M) {
        const a = Math.max(I.a, v.xmin), b = Math.min(I.b, v.xmax);
        if (b < a) continue;
        if (a > x) svg('rect', { x: g.X(x), y: g.y1, width: g.X(a) - g.X(x), height: g.y0 - g.y1, class: 'hors-A' }, fond);
        x = Math.max(x, b);
      }
      if (x < v.xmax) svg('rect', { x: g.X(x), y: g.y1, width: g.X(v.xmax) - g.X(x), height: g.y0 - g.y1, class: 'hors-A' }, fond);
    }
    dessinerRepere(g, fond, couche);

    const G = grilleX(g);
    const D = donnees = calculerDonnees(G);
    etat.geoCourbes = g;

    // la bande
    if (D.centre && D.demi > 0 && Number.isFinite(D.demi)) {
      const B = cheminsBande(G, D.centre, D.demi, g, mode === 'cauchy' || mode === 'terme' ? null : G.coupe);
      if (B.aire) {
        svg('path', { d: B.aire, class: 'bande' + (D.rho ? ' rho' : '') }, dedans);
        svg('path', { d: B.haut, class: 'bord-bande' }, dedans);
        svg('path', { d: B.bas, class: 'bord-bande' }, dedans);
      }
    }
    // le terme que l'on vient d'ajouter : l'aire entre s_{n−1} et s_n
    if (D.avant) {
      let d = '', ouvert = false, debut = 0;
      const fermer = (fin) => {
        for (let k = fin; k >= debut; k--) d += 'L' + g.X(G.xs[k]).toFixed(1) + ' ' + clamp(g.Y(D.avant[k]), g.y1 - 2500, g.y0 + 2500).toFixed(1);
        d += 'Z';
      };
      for (let i = 0; i < G.xs.length; i++) {
        const ok = Number.isFinite(D.cur[i]) && Number.isFinite(D.avant[i]);
        if (!ok) { if (ouvert) fermer(i - 1); ouvert = false; continue; }
        if (!ouvert) debut = i;
        d += (ouvert ? 'L' : 'M') + g.X(G.xs[i]).toFixed(1) + ' ' + clamp(g.Y(D.cur[i]), g.y1 - 2500, g.y0 + 2500).toFixed(1);
        ouvert = true;
      }
      if (ouvert) fermer(G.xs.length - 1);
      if (d) svg('path', { d, class: 'ajout' }, dedans);
      etat.flash = null;
    }
    // les courbes précédentes
    for (const f of D.fantomes) svg('path', { d: chemin(G, f.ys, g), class: 'courbe-fantome' }, dedans);
    // la somme
    if (D.F) {
      svg('path', { d: chemin(G, D.F, g, G.coupe), class: 'courbe-f' }, dedans);
      for (const s of Se.sauts(v.xmin, v.xmax)) {
        const X = g.X(s.x);
        if (X < g.x0 - 6 || X > g.x1 + 6) continue;
        for (const lim of [s.g, s.d]) if (Number.isFinite(lim)) svg('circle', { cx: X, cy: g.Y(lim), r: 4, class: 'pt-creux' }, dedans);
        if (Number.isFinite(s.v)) svg('circle', { cx: X, cy: g.Y(s.v), r: 4.2, class: 'pt-plein f' }, dedans);
      }
    }
    // la courbe courante
    const dCur = chemin(G, D.cur, g);
    svg('path', { d: dCur, class: 'courbe-s contour' }, dedans);
    svg('path', { d: dCur, class: 'courbe-s' }, dedans);
    if (D.centre && D.demi > 0 && Number.isFinite(D.demi)) {
      const dh = cheminHors(G, D.cur, D.centre, D.demi, g);
      if (dh) svg('path', { d: dh, class: 'courbe-hors' }, dedans);
    }
    // le plus grand écart au-dessus de A
    if (D.ecart && D.ecart.v > 0 && mode !== 'sommes') {
      const i = D.ecart.i, X = g.X(G.xs[i]);
      const Ya = clamp(g.Y(D.centre[i]), g.y1 - 6, g.y0 + 6), Yb = clamp(g.Y(D.cur[i]), g.y1 - 6, g.y0 + 6);
      if (Math.abs(Ya - Yb) > 3) {
        svg('line', { x1: X, x2: X, y1: Ya, y2: Yb, class: 'ecart-max' }, dedans);
        svg('line', { x1: X - 4, x2: X + 4, y1: Yb, y2: Yb, class: 'ecart-max-bout' }, dedans);
        svg('line', { x1: X - 4, x2: X + 4, y1: Ya, y2: Ya, class: 'ecart-max-bout' }, dedans);
        const Ym = clamp((Ya + Yb) / 2, g.y1 + 10, g.y0 - 10);
        const aGauche = X > g.x1 - 70;
        // près d'une asymptote, l'écart calculé dépend de la grille : si la norme est infinie, on écrit +∞
        const norme = mode === 'uniforme' ? normeR(n).v : mode === 'terme' ? normeT(n).v : NaN;
        const infini = norme === Infinity && D.ecart.v > 20 * (etat.vue.ymax - etat.vue.ymin);
        etiquette(couche, X, Ym, K_(infini ? '+\\infty' : fmtCourt(D.ecart.v, 3)), 'ecart' + (aGauche ? ' gauche' : ''));
        // la place prise par cette étiquette : les noms des courbes l'évitent
        D.zoneEcart = aGauche ? [X - 80, X + 22] : [X - 22, X + 80];
      }
    }
    // le point témoin x_n (critère de non-convergence uniforme)
    const xn = E.def && E.def.xn;
    if (xn && ((xn.quoi === 'terme' && mode === 'terme') || (xn.quoi === 'reste' && mode === 'uniforme') || (xn.quoi === 'cauchy' && mode === 'cauchy' && D.m === 2 * n))) {
      const x = xn.f(n, E.p);
      let y;
      if (xn.quoi === 'terme') y = Se.terme(x, n);
      else if (xn.quoi === 'reste') y = S.sommePartielle(Se.terme, Se.n0, n, x);
      else y = S.sommePartielle(Se.terme, n + 1, 2 * n, x);
      const X = g.X(x), Yp = g.Y(y);
      if (X >= g.x0 && X <= g.x1 && Number.isFinite(Yp)) {
        svg('line', { x1: X, x2: X, y1: g.y0, y2: clamp(Yp, g.y1, g.y0), class: 'temoin-ligne' }, dedans);
        svg('circle', { cx: X, cy: clamp(Yp, g.y1, g.y0), r: 6, class: 'temoin' }, dedans);
        etiquette(couche, X, clamp(Yp, g.y1 + 24, g.y0), K_('x_{' + n + '}'), 'temoin');
      } else if (X > g.x1) {
        etiquette(couche, g.x1 - 6, g.y1 + 44, K_('x_{' + n + '} \\approx ' + fmtCourt(x, 3)) + ' →', 'ecart gauche');
      }
    }
    // la ligne x_0 (convergence simple)
    if (mode === 'sommes' && Number.isFinite(etat.x0)) {
      const X = g.X(etat.x0);
      if (X >= g.x0 - 1 && X <= g.x1 + 1) {
        svg('line', { x1: X, x2: X, y1: g.y1, y2: g.y0, class: 'ligne-x0' }, dessus);
        const s = S.sommePartielle(Se.terme, Se.n0, n, etat.x0), f = Se.somme && dansDomaine(etat.x0) ? Se.somme(etat.x0) : NaN;
        if (Number.isFinite(f) && g.Y(f) >= g.y1 && g.Y(f) <= g.y0) svg('circle', { cx: X, cy: g.Y(f), r: 4.6, class: 'pt-plein f' }, dessus);
        if (Number.isFinite(s) && dansDomaine(etat.x0) && g.Y(s) >= g.y1 && g.Y(s) <= g.y0) svg('circle', { cx: X, cy: g.Y(s), r: 4.6, class: 'pt-plein s' }, dessus);
        etiquette(couche, clamp(X, g.x0 + 34, g.x1 - 34), g.y1 + 2, K_('x_0 = ' + fmtParam(etat.x0, decimalesX())), 'x0');
      }
    }
    // l'ensemble A : la partie verte de l'axe, ses extrémités, ses poignées
    for (const I of E.morceaux) {
      const a = Math.max(I.a, v.xmin), b = Math.min(I.b, v.xmax);
      if (b < a) continue;
      svg('line', { x1: g.X(a), x2: g.X(b), y1: g.y0, y2: g.y0, class: 'barre-A' }, dessus);
      for (const [x, ouvertB, sens] of [[I.a, I.ao, 1], [I.b, I.bo, -1]]) {
        if (!Number.isFinite(x) || x < v.xmin || x > v.xmax) continue;
        const X = g.X(x), h = 8;
        // crochet (extrémité fermée) ou parenthèse (ouverte)
        const d = ouvertB
          ? 'M' + (X + sens * 5) + ' ' + (g.y0 - h) + 'Q' + (X - sens * 3) + ' ' + g.y0 + ' ' + (X + sens * 5) + ' ' + (g.y0 + h)
          : 'M' + (X + sens * 5) + ' ' + (g.y0 - h) + 'H' + X + 'V' + (g.y0 + h) + 'H' + (X + sens * 5);
        svg('path', { d, class: 'bout-A' }, dessus);
      }
    }
    etat.poignees = [];
    const P = E.def ? (E.def.poignees ? E.def.poignees(E.p) : []) : [{ x: etat.ab.a, ab: 'a' }, { x: etat.ab.b, ab: 'b' }];
    for (const h of P) {
      const X = g.X(h.x);
      if (X < g.x0 - 2 || X > g.x1 + 2) continue;
      svg('circle', { cx: X, cy: g.y0, r: 6.5, class: 'poignee-A' + (etat.glisse && etat.glisse.type === 'poignee' ? ' active' : '') }, dessus);
      etat.poignees.push({ X, h });
    }
    {
      // le nom de l'ensemble, au-dessus de son extrémité gauche visible
      const A = bornesA();
      const xa = Math.max(Number.isFinite(A.a) ? A.a : v.xmin, v.xmin), xb = Math.min(Number.isFinite(A.b) ? A.b : v.xmax, v.xmax);
      if (xb > xa) etiquette(couche, clamp((g.X(xa) + g.X(xb)) / 2, g.x0 + 40, g.x1 - 40), g.y0 - 22, K_((E.tex.length < 14 ? 'A = ' : '') + E.tex), 'ens');
    }
    // les noms des courbes
    etiqueterCourbes(G, D, g, couche);
    // le survol
    svg('g', { id: 'survol-courbes' }, svgEl);
    majSurvol();
  }
  // x_0 : arrondi à un pas « rond » de l'ordre du pixel, et écrit avec les décimales de ce pas
  const pasX0 = () => S.pasJoli(etat.vue.xmax - etat.vue.xmin, 250);
  const decimalesX = () => Math.max(0, Math.min(8, Math.ceil(-Math.log10(pasX0()) - 1e-9)));

  // Les noms s_k (ou f_k) près des courbes, là où elles sont le plus écartées
  function etiqueterCourbes(G, D, g, couche) {
    const courbes = D.fantomes.map((f) => ({ ys: f.ys, tex: D.lettre + '_{' + f.k + '}', cls: 'courbe fantome' }));
    courbes.push({ ys: D.cur, tex: D.nomCur, cls: 'courbe' });
    if (D.mode === 'cauchy') return;
    const xs = G.xs, haut = g.y1 + 30, bas = g.y0 - 30;
    // l'abscisse où les courbes sont le plus écartées (toutes dans le cadre)
    let mieux = -1, im = -1;
    for (let i = 4; i < xs.length - 4; i += 3) {
      const X = g.X(xs[i]);
      if (X < g.x0 + 30 || X > g.x1 - 50) continue;
      if (D.zoneEcart && X > D.zoneEcart[0] && X < D.zoneEcart[1]) continue;
      const Ys = [];
      let ok = true;
      for (const c of courbes) { const y = c.ys[i]; if (!Number.isFinite(y)) { ok = false; break; } const Yp = g.Y(y); if (Yp < haut || Yp > bas) { ok = false; break; } Ys.push(Yp); }
      if (!ok) continue;
      if (D.F && Number.isFinite(D.F[i])) Ys.push(g.Y(D.F[i]));
      Ys.sort((p, q) => p - q);
      let ecartMin = Infinity;
      for (let k = 1; k < Ys.length; k++) ecartMin = Math.min(ecartMin, Ys[k] - Ys[k - 1]);
      if (Ys.length === 1) ecartMin = 20 + (G.inA[i] ? 5 : 0);
      if (ecartMin > mieux) { mieux = ecartMin; im = i; }
    }
    if (im < 0) return;
    const places = [];
    for (const c of courbes.slice().reverse()) {
      const Yp = g.Y(c.ys[im]);
      if (places.some((p) => Math.abs(p - Yp) < 13)) continue;       // deux noms au même endroit : on garde le premier
      places.push(Yp);
      etiquette(couche, g.X(xs[im]), Yp, K_(c.tex), c.cls);
    }
  }

  // Le survol du graphe du haut : la droite verticale et les points des courbes
  function majSurvol() {
    const gr = el.courbes.querySelector('#survol-courbes');
    if (!gr) return;
    gr.textContent = '';
    const s = etat.survol, g = etat.geoCourbes;
    if (!s || !g || etat.glisse) return;
    const X = g.X(s.x);
    svg('line', { x1: X, x2: X, y1: g.y1, y2: g.y0, class: 'ligne-survol' }, gr);
    const pt = (y, cls) => { const Y = g.Y(y); if (Number.isFinite(y) && Y >= g.y1 && Y <= g.y0) svg('circle', { cx: X, cy: Y, r: 4, class: 'pt-plein ' + cls }, gr); };
    if (Number.isFinite(s.f)) pt(s.f, 'f');
    pt(s.cur, 's');
  }

  // ===========================================================================
  //  Le graphe du bas : la suite de nombres qui décide
  // ===========================================================================
  const K_LOT = 1200;        // bornes supérieures numériques : au plus K_LOT rangs d'un coup

  // Les valeurs de la suite pour les indices visibles
  function valeursSuite(deb, fin) {
    const Se = etat.Se, mode = etat.mode, n = etat.n;
    const R_ = { v: [], w: null, niveau: null, limite: null, premier: Se.n0, message: null };
    if (mode === 'sommes') {
      const x0 = etat.x0;
      const f0 = Se.somme && Number.isFinite(x0) && dansDomaine(x0) ? Se.somme(x0) : NaN;
      let s = 0;
      for (let k = Se.n0; k <= fin; k++) {
        s += Se.terme(x0, k);
        if (k >= deb) R_.v[k] = etat.log && Number.isFinite(f0) ? Math.abs(f0 - s) : s;
      }
      if (!etat.log || !Number.isFinite(f0)) R_.limite = f0;
      R_.erreur = etat.log && Number.isFinite(f0);
    } else if (mode === 'uniforme') {
      if (!Se.somme || !convergeSurA()) R_.message = t('pasDeSomme');
      else {
        const K = Math.min(fin, K_LOT);
        for (let k = Math.max(deb, Se.n0); k <= K; k++) R_.v[k] = normeRSuite(k, K);
      }
      R_.niveau = etat.eps;
    } else if (mode === 'cauchy') {
      R_.premier = n + 1;
      const K = Math.min(fin, n + K_LOT);
      const lot = lotCauchy(n, Math.max(K, mCourant()));
      for (let k = Math.max(deb, n + 1); k <= K; k++) R_.v[k] = lot.v[k];
      R_.niveau = etat.eps;
    } else if (mode === 'terme') {
      for (let k = Math.max(deb, Se.n0); k <= fin; k++) R_.v[k] = normeT(k).v;
    } else {
      const avecM = !!testM();
      R_.w = [];
      for (let k = Math.max(deb, Se.n0); k <= fin; k++) {
        R_.v[k] = normeT(k).v;
        if (avecM) R_.w[k] = valM(k);
      }
      if (!avecM) R_.w = null;
      R_.rho = Number.isFinite(valRho(n));
    }
    return R_;
  }

  // L'échelle des ordonnées : linéaire (à partir de 0 si les valeurs sont positives) ou logarithmique
  function echelleSuite(g, vals, inclure, log) {
    let lo = Infinity, hi = -Infinity, minPos = Infinity;
    const voir = (v) => { if (Number.isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; if (v > 0 && v < minPos) minPos = v; } };
    vals.forEach(voir);
    (inclure || []).forEach(voir);
    if (lo === Infinity) { lo = 0; hi = 1; }
    if (log) {
      if (!(minPos < Infinity)) minPos = Math.max(hi, 1e-3) / 10;
      let e0 = Math.floor(Math.log10(minPos) + 1e-9), e1 = Math.ceil(Math.log10(Math.max(hi, minPos)) + 0.02);
      if (e1 - e0 < 1) e0 = e1 - 1;
      if (e1 - e0 > 18) e0 = e1 - 18;
      const Y = (v) => (v > 0 ? clamp(g.y0 - (Math.log10(v) - e0) / (e1 - e0) * (g.y0 - g.y1), g.y1 - 20, g.y0 + 2) : g.y0 + 2);
      const inv = (py) => 10 ** (e0 + (g.y0 - py) / (g.y0 - g.y1) * (e1 - e0));
      const grad = [];
      const pasDec = Math.max(1, Math.ceil((e1 - e0) / 5));
      for (let d = e0; d <= e1; d += pasDec) grad.push({ v: 10 ** d, html: K_('10^{' + d + '}') });
      return { Y, inv, grad, log: true, bas: 10 ** e0, haut: 10 ** e1 };
    }
    if (lo >= 0) lo = 0;
    if (hi <= lo) hi = lo + 1;
    const marge = (hi - lo) * 0.09;
    let bas = lo < 0 ? lo - marge : 0, haut = hi + marge;
    const pas = S.pasJoli(haut - bas, Math.max(2, (g.y0 - g.y1) / 34));
    if (bas === 0) haut = Math.max(haut, pas);
    const Y = (v) => g.y0 - (v - bas) / (haut - bas) * (g.y0 - g.y1);
    const inv = (py) => bas + (g.y0 - py) / (g.y0 - g.y1) * (haut - bas);
    const grad = [];
    for (let k = Math.ceil(bas / pas - 1e-9); k * pas <= haut + 1e-9 * pas; k++) grad.push({ v: k * pas, html: fmtGrad(k * pas, pas) });
    return { Y, inv, grad, log: false, bas, haut };
  }

  function dessinerSuite() {
    const svgEl = el.suite, couche = el.etiqSuite;
    svgEl.textContent = '';
    couche.textContent = '';
    const g = geoSuite();
    svgEl.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H);
    const Se = etat.Se, mode = etat.mode, n = etat.n, v = etat.vueN;
    const deb = Math.max(mode === 'cauchy' ? n : Se.n0, Math.ceil(v.a - 0.5)), fin = Math.floor(v.b + 0.5);
    const V = valeursSuite(deb, fin);
    const rects = mode === 'testm';
    const gr = svg('g', {}, svgEl);

    // l'échelle
    const visibles = [];
    for (let k = deb; k <= fin; k++) { if (Number.isFinite(V.v[k])) visibles.push(V.v[k]); if (V.w && Number.isFinite(V.w[k])) visibles.push(V.w[k]); }
    const inclure = [];
    if (V.niveau != null) inclure.push(V.niveau);
    if (Number.isFinite(V.limite)) inclure.push(V.limite);
    const signe = mode === 'sommes' && !V.erreur;
    if (signe && Number.isFinite(V.limite) && visibles.length) {
      // de la place pour écrire f(x_0) du côté où les points ne sont pas
      const lo = Math.min(V.limite, ...visibles), hi = Math.max(V.limite, ...visibles), d = Math.max(hi - lo, 1e-12);
      const dernier = visibles[visibles.length - 1];
      V.dessous = dernier > V.limite;
      inclure.push(V.dessous ? V.limite - 0.22 * d : V.limite + 0.22 * d);
    }
    const E_ = echelleSuite(g, visibles, inclure, etat.log && !signe);
    etat.geoSuite = { g, E: E_, deb, fin, V };

    // grille et graduations
    for (const q of E_.grad) {
      const Y = E_.Y(q.v);
      if (Y < g.y1 - 1 || Y > g.y0 + 1) continue;
      svg('line', { x1: g.x0, x2: g.x1, y1: Y, y2: Y, class: 'grille' }, gr);
      etiquette(couche, g.x0 - 6, Y, q.html, 'axe axe-y');
    }
    const pasK = Math.max(1, S.pasJoli(fin - deb + 1, (g.x1 - g.x0) / 56));
    for (let k = Math.ceil(deb / pasK) * pasK; k <= fin; k += pasK) {
      const X = g.X(k);
      if (X < g.x0 - 1 || X > g.x1 + 1) continue;
      svg('line', { x1: X, x2: X, y1: g.y0, y2: g.y0 + 4, class: 'axe' }, gr);
      const txt = fmtEntier(k);
      if (X + 3.4 * txt.length <= g.x1 - 8) etiquette(couche, X, g.y0 + 5, txt, 'axe axe-x');
    }
    etiquette(couche, g.x1 - 2, g.y0 + 5, '<i>' + (mode === 'cauchy' ? 'm' : mode === 'testm' ? 'k' : 'n') + '</i>', 'axe axe-x');
    if (signe && E_.bas < 0 && E_.haut > 0) svg('line', { x1: g.x0, x2: g.x1, y1: E_.Y(0), y2: E_.Y(0), class: 'axe-zero' }, gr);

    // la zone sous ε, la limite
    if (V.niveau != null && !V.message) {
      const Y = clamp(E_.Y(V.niveau), g.y1, g.y0);
      svg('rect', { x: g.x0, y: Y, width: g.x1 - g.x0, height: g.y0 - Y, class: 'zone-ok' }, gr);
      svg('line', { x1: g.x0, x2: g.x1, y1: Y, y2: Y, class: 'ligne-eps' }, gr);
      etiquette(couche, g.x1 - 4, Y, K_('\\varepsilon = ' + fmtCourt(V.niveau, 3)), 'niveau' + (Y < g.y1 + 34 ? ' dessous' : ''));
    }
    if (Number.isFinite(V.limite)) {
      const Y = E_.Y(V.limite);
      svg('line', { x1: g.x0, x2: g.x1, y1: Y, y2: Y, class: 'ligne-limite' }, gr);
      etiquette(couche, g.x1 - 4, Y, K_('f(x_0) \\approx ' + fmtCourt(V.limite, 5)), 'niveau' + (V.dessous ? ' dessous' : ''));
    }
    // la colonne survolée
    if (etat.survolK != null && etat.survolK >= deb && etat.survolK <= fin) {
      svg('rect', { x: g.X(etat.survolK - 0.5), y: g.y1, width: g.w, height: g.y0 - g.y1, class: 'colonne-survol' }, gr);
    }

    if (V.message) {
      etiquette(couche, (g.x0 + g.x1) / 2, (g.y0 + g.y1) / 2, rendreTexte(V.message), 'message-graphe');
    } else if (rects) {
      // test M : les rectangles de M_k (en vert) et de ‖f_k‖_A (en or), de largeur 1
      const jeu = Math.min(3, g.w * 0.08);
      for (let k = deb; k <= fin; k++) {
        const xg = g.X(k - 0.5) + jeu, larg = Math.max(1, g.w - 2 * jeu);
        if (xg + larg < g.x0 || xg > g.x1) continue;
        if (V.w && Number.isFinite(V.w[k])) {
          const Y = clamp(E_.Y(V.w[k]), g.y1 - 2, g.y0);
          svg('rect', { x: xg, y: Y, width: larg, height: Math.max(0, g.y0 - Y), class: 'barre-y' + (k > n ? ' queue' : ' avant') }, gr);
        }
        const val = V.v[k];
        if (val === Infinity) fleche(gr, g.X(k), g.y1 + 12, true);
        else if (Number.isFinite(val)) {
          const Y = clamp(E_.Y(val), g.y1 - 2, g.y0), ret = V.w ? larg * 0.16 : 0;
          svg('rect', { x: xg + ret, y: Y, width: Math.max(1, larg - 2 * ret), height: Math.max(0, g.y0 - Y), class: 'barre-x' + (k > n ? '' : ' avant') }, gr);
        }
      }
      if (V.rho) etiquette(couche, g.x1 - 6, g.y1 + 30, K_('\\rho_{' + n + '} = \\sum_{k > ' + n + '} M_k \\approx ' + fmtCourt(valRho(n), 4)), 'niveau dessous');
    } else {
      // les points
      const r = clamp(g.w * 0.3, 1.7, 5);
      let d = '';
      for (let k = deb; k <= fin; k++) {
        const val = V.v[k], X = g.X(k);
        if (X < g.x0 - 2 || X > g.x1 + 2) continue;
        if (val === Infinity) { fleche(gr, X, g.y1 + 12, true); continue; }
        if (!Number.isFinite(val)) continue;
        const Y = E_.Y(val);
        if (mode === 'sommes' && !V.erreur) d += (d ? 'L' : 'M') + X.toFixed(1) + ' ' + Y.toFixed(1);
        let cls = 'ok';
        if (V.niveau != null) cls = val < V.niveau ? 'ok' : 'echec';
        if (mode === 'cauchy' && k === mCourant()) cls += ' courant';
        else if (mode !== 'cauchy' && k === n) cls += ' courant';
        if (Y < g.y1 - 4) { fleche(gr, X, g.y1 + 12, cls.indexOf('echec') >= 0); continue; }
        svg('circle', { cx: X, cy: Math.min(Y, g.y0 + 2), r: cls.indexOf('courant') >= 0 ? r + 1.6 : r, class: 'pt ' + cls }, gr);
      }
      if (d) gr.insertBefore(svg('path', { d, class: 'lien-pts' }), gr.querySelector('circle'));
    }
    svg('line', { x1: g.x0, x2: g.x0, y1: g.y1, y2: g.y0, class: 'axe' }, gr);
    svg('line', { x1: g.x0, x2: g.x1, y1: g.y0, y2: g.y0, class: 'axe' }, gr);

    // les lignes des rangs : n (que l'on peut glisser), m (critère de Cauchy), N(ε)
    const xLigne = (k) => g.X(rects ? k + 0.5 : k);
    const ligne = (k, tex, cls, niveau) => {
      const X = xLigne(k);
      if (X < g.x0 - 1 || X > g.x1 + 1) return;
      svg('line', { x1: X, x2: X, y1: g.y1 - 6, y2: g.y0, class: 'ligne-rang ' + cls }, gr);
      if (cls !== 'seuil') svg('circle', { cx: X, cy: g.y0, r: 5, class: 'poignee-rang ' + cls }, gr);
      etiquette(couche, clamp(X, g.x0 + 26, g.x1 - 30), g.y1 - 4 + (niveau || 0) * 21, K_(tex), 'rang ' + cls);
    };
    if (mode === 'uniforme' && !V.message) {
      const rg = rang(etat.eps);
      if (rg.N != null && rg.N !== n) ligne(rg.N, 'N(\\varepsilon) = ' + rg.N, 'seuil', 1);
    }
    ligne(n, 'n = ' + n, '', 0);
    if (mode === 'cauchy') ligne(mCourant(), 'm = ' + mCourant(), 'm', 1);
  }
  function fleche(gr, X, Y, echec) {
    svg('path', { d: 'M' + (X - 5) + ' ' + (Y + 6) + 'L' + X + ' ' + (Y - 5) + 'L' + (X + 5) + ' ' + (Y + 6) + 'Z', class: 'fleche-hors' + (echec ? ' echec' : '') }, gr);
  }

  // ===========================================================================
  //  Titres et légende des graphes
  // ===========================================================================
  function texBloc(n, m) {
    if (m === n + 1) return 'f_{' + m + '}';
    if (m === n + 2) return 'f_{' + (n + 1) + '} + f_{' + m + '}';
    return 'f_{' + (n + 1) + '} + \\cdots + f_{' + m + '}';
  }
  function majTitres() {
    const Se = etat.Se, mode = etat.mode, n = etat.n;
    let h, s;
    if (mode === 'sommes') {
      h = M_(Se.somme ? 'tSommes' : 'tSommesSans', { n });
      s = M_(etat.log && Se.somme && Number.isFinite(etat.x0) && Number.isFinite(Se.somme(etat.x0)) ? 'sSommesLog' : 'sSommes', { x: fmtParam(etat.x0, decimalesX()) });
    } else if (mode === 'uniforme') {
      const r = Se.somme && convergeSurA() ? normeR(n) : null;
      h = !r ? M_('tUniformeSans', { n }) : r.v === Infinity ? M_('tUniformeInf') : M_('tUniforme', { v: fmtCourt(r.v, 4) });
      s = M_('sUniforme');
    } else if (mode === 'cauchy') {
      const m = mCourant();
      h = M_('tCauchy', { n, m, bloc: texBloc(n, m) });
      s = M_('sCauchy', { n });
    } else if (mode === 'terme') {
      const r = normeT(n);
      h = r.v === Infinity ? M_('tTermeInf', { n }) : M_('tTerme', { n, v: fmtCourt(r.v, 4) });
      s = M_('sTerme');
    } else {
      const rho = valRho(n), num = !etat.E.def;
      if (Number.isFinite(rho) && Se.somme) h = M_(num ? 'tTestMNum' : 'tTestM', { n, v: fmtCourt(rho, 4) });
      else h = M_(num ? (sommeNumeriqueM().infini ? 'tTestMNumInf' : sommeNumeriqueM().converge ? 'tTestMNumLoin' : 'tTestMNumNon') : 'tTestMNon', { n });
      s = M_(testM() ? 'sTestM' : num ? 'sTestMNum' : 'sTestMNon');
    }
    el.titreCourbes.innerHTML = '<span>' + h + '</span>';
    el.titreSuite.innerHTML = '<span>' + s + '</span>';

    // la légende
    const item = (cls, html) => '<span class="leg ' + cls + '"><i></i><span>' + html + '</span></span>';
    const L_ = [];
    const avecPrec = donnees && donnees.fantomes.length > 0;
    if (mode === 'cauchy') {
      L_.push(item('leg-s', M_('legBloc')), item('leg-bande', M_('legBandeZero')), item('leg-rouge', M_('legHors')));
    } else if (mode === 'terme') {
      L_.push(item('leg-s', M_('legTerme', { n })));
      if (avecPrec) L_.push(item('leg-fantome', M_('legTermesPrec')));
    } else {
      L_.push(item('leg-s', M_('legS', { n })));
      if (Se.somme) L_.push(item('leg-f', M_('legF')));
      if (mode === 'uniforme' && Se.somme) L_.push(item('leg-bande', M_('legBandeEps')), item('leg-rouge', M_('legHors')));
      if (mode === 'testm' && Se.somme && Number.isFinite(valRho(n))) L_.push(item('leg-bande', M_('legBandeRho')));
      if (avecPrec) L_.push(item('leg-fantome', M_('legPrec')));
    }
    el.legende.innerHTML = L_.join('');
  }

  // ===========================================================================
  //  Panneau : la série
  // ===========================================================================
  function majPanneauSerie() {
    const Se = etat.Se, E = etat.E;
    // l'aperçu : Σ f_n(x) = f(x), l'ensemble de convergence, une remarque sur la somme
    let tex = '\\sum_{n = ' + Se.n0 + '}^{\\infty} ' + Se.texTerme();
    if (Se.diverge) tex += '';
    else if (Se.texSomme && !/\\begin/.test(Se.texSomme)) tex += ' = ' + Se.texSomme;
    else tex += ' =: f(x)';
    let h = katexHTML(traduireTex(tex), true);
    const lignes = [];
    if (Se.cat) {
      lignes.push('<b>' + rendreTexte(nomSerie(Se.cat)) + '</b>');
      if (Se.texSomme && /\\begin/.test(Se.texSomme)) lignes.push(K_('f(x) = ' + Se.texSomme));
      lignes.push(echapper(t('ensConv')) + (fr() ? ' : ' : ': ') + K_(Se.conv.tex));
      if (Se.noteSomme) lignes.push(texteCat(L(Se.noteSomme)));
    } else {
      lignes.push(M_('serieAuChoix'));
      if (Se.constant) lignes.push(M_('serieConstante'));
    }
    h += lignes.map((l) => '<span class="nature">' + l + '</span>').join('');
    el.apercu.innerHTML = h;
    el.apercu.classList.remove('perime');

    // les ensembles
    const boutons = [];
    if (Se.cat) for (const d of Se.cat.ensembles) boutons.push('<button type="button" data-ens="' + d.id + '" aria-pressed="' + (E.id === d.id) + '">' + K_(d.tex) + '</button>');
    boutons.push('<button type="button" data-ens="ab" aria-pressed="' + (E.id === 'ab') + '" title="' + echapper(t('titreEnsAb')) + '">' + K_('[a, b]') + '</button>');
    el.ensembles.innerHTML = boutons.join('');
    majParametreEnsemble();

    // les exemples : celui qui est affiché
    document.querySelectorAll('.exemple').forEach((b) => b.setAttribute('aria-pressed', String(!!Se.id && b.dataset.id === Se.id)));
  }
  function majParametreEnsemble() {
    const E = etat.E, P = E.def && E.def.param;
    el.paramP.hidden = !P;
    if (P) {
      el.libelleP.innerHTML = K_(P.tex + ' =');
      el.curseurP.min = P.min; el.curseurP.max = P.max; el.curseurP.step = P.pas;
      el.curseurP.value = E.p;
      el.valP.innerHTML = K_(fmtParam(E.p, P.pas < 0.05 ? 2 : P.pas < 0.5 ? 2 : 1));
    }
    el.paramAb.hidden = E.id !== 'ab';
    if (E.id === 'ab') {
      if (document.activeElement !== el.champA) el.champA.value = etat.ab.a;
      if (document.activeElement !== el.champB) el.champB.value = etat.ab.b;
    }
    el.ensembles.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ens === E.id)));
  }
  // « Notes de cours : série géométrique », « Exercice P1 (a) » (nu : sans formule, pour une infobulle)
  function nomSerie(c, nu) {
    let e = L(c.etiquette);
    if (nu) e = e.replace(/\$[^$]*\$/g, '').replace(/[,\s]+$/, '').trim();
    return (c.groupe === 'notes' ? t('nomNotes') : t('nomExercice')) + e;
  }
  function construireExemples() {
    // les séries des notes : la formule seule (le nom est dans l'infobulle et sous l'aperçu) ; les exercices : leur numéro
    const bouton = (c) => '<button type="button" class="exemple" data-id="' + c.id + '" aria-pressed="false" title="' + echapper(nomSerie(c, true)) + '">' + K_(c.texTerme)
      + (c.groupe === 'exercices' ? '<span class="source">' + rendreTexte(L(c.etiquette)) + '</span>' : '') + '</button>';
    el.exNotes.innerHTML = C.SERIES.filter((c) => c.groupe === 'notes').map(bouton).join('');
    el.exExercices.innerHTML = C.SERIES.filter((c) => c.groupe === 'exercices').map(bouton).join('');
  }

  // ===========================================================================
  //  Panneau : le test (énoncé, paramètres, statut)
  // ===========================================================================
  const EPS_BAS = 500, EPS_HAUT = 10;          // ε entre base/500 et 10 base (curseur logarithmique)
  const epsBase = () => etat.Se.epsDefaut || etat.epsBase || 0.1;
  const epsDeCurseur = (u) => epsBase() / EPS_BAS * Math.pow(EPS_BAS * EPS_HAUT, u / 1000);
  const curseurDeEps = (e) => clamp(Math.round(1000 * Math.log(e * EPS_BAS / epsBase()) / Math.log(EPS_BAS * EPS_HAUT)), 0, 1000);

  // « ‖R_n‖_A = formule ; ici, ‖R_8‖_A ≈ valeur » (quoi : 'Norme' pour le reste, 'Terme' pour le terme)
  function statutNorme(quoi, def, r, n) {
    const p = etat.E.p;
    if (r.v === Infinity && !(def && def.f)) return M_('st' + quoi + 'Inf');
    if (def && def.tex && def.f) {
      const constante = def.f(n, p) === def.f(n + 1, p) && def.f(n, p) === def.f(n + 6, p);
      if (r.v === Infinity || constante) return M_('st' + quoi + 'Const', { tex: def.tex });
      return M_('st' + quoi + 'Formule', { tex: def.tex, v: fmtCourt(r.v, 4) });
    }
    if (def && def.tex) return M_('st' + quoi + 'Formule', { tex: def.tex, v: fmtCourt(r.v, 4) });
    return M_('st' + quoi, { v: fmtCourt(r.v, 4) });
  }

  let cleEnonce = null;
  function majPanneauTest() {
    const Se = etat.Se, E = etat.E, mode = etat.mode, n = etat.n;
    el.titreTest.textContent = t('titreTest')[mode];
    const cle = etat.langue + '|' + mode + '|' + Se.n0;
    if (cle !== cleEnonce) {
      cleEnonce = cle;
      const nom = { sommes: 'enonceSommes', uniforme: 'enonceUniforme', cauchy: 'enonceCauchy', terme: 'enonceTerme', testm: 'enonceTestM' }[mode];
      el.enonce.innerHTML = rendreTexte(t(nom, { debut: 'f_{' + Se.n0 + '}(x)' }));
    }
    // les parties de l'énoncé qui servent ici
    const parties = el.enonce.querySelectorAll('.partie');
    parties.forEach((p) => p.classList.remove('utilisee'));
    if (mode === 'terme' && parties.length === 2 && E.def && E.def.nT) parties[E.def.nT.versZero ? 1 : 0].classList.add('utilisee');
    if (mode === 'testm' && parties.length && testM()) parties[0].classList.add('utilisee');

    // les paramètres
    el.paramX0.hidden = mode !== 'sommes';
    el.paramEps.hidden = !(mode === 'uniforme' || mode === 'cauchy');
    el.paramM.hidden = el.choixM.hidden = mode !== 'cauchy';
    if (mode === 'sommes') {
      const v = etat.vue;
      el.curseurX0.value = clamp(Math.round(1000 * (etat.x0 - v.xmin) / (v.xmax - v.xmin)), 0, 1000);
      el.valX0.innerHTML = K_(fmtParam(etat.x0, decimalesX()));
    }
    if (!el.paramEps.hidden) {
      el.curseurEps.value = curseurDeEps(etat.eps);
      el.valEps.innerHTML = K_(fmtCourt(etat.eps, 3));
    }
    if (mode === 'cauchy') {
      const m = mCourant();
      el.curseurM.min = n + 1; el.curseurM.max = mMax(); el.curseurM.value = m;
      el.valM.textContent = fmtEntier(m);
      el.boutonsM.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === etat.choixM)));
    }

    // le statut
    let h = '';
    const egal = (r) => (r.exact ? '=' : '\\approx');
    if (mode === 'sommes') {
      const x0 = etat.x0, s = S.sommePartielle(Se.terme, Se.n0, n, x0);
      const f = Se.somme && dansDomaine(x0) ? Se.somme(x0) : NaN;
      const p = { x: fmtParam(x0, decimalesX()), n, s: fmtCourt(s, 5), f: fmtCourt(f, 5), r: fmtCourt(Math.abs(f - s), 3) };
      h = Number.isFinite(f) ? M_('stSommes', p) : M_('stSommesDiv', p);
      if (!dansA(x0)) h += M_('stSommesHors');
    } else if (mode === 'uniforme') {
      if (!Se.somme || !convergeSurA()) h = M_('stDiverge');
      else {
        const r = normeR(n), eps = fmtCourt(etat.eps, 3);
        h = statutNorme('Norme', E.def && E.def.nR, r, n);
        h += r.v < etat.eps ? M_('stDans', { eps, n }) : M_('stHors', { eps, n });
        const rg = rang(etat.eps);
        if (rg.aucun) h += M_('stRangAucun');
        else if (rg.loin) h += M_('stRangLoin', { K: fmtEntier(rg.loin) });
        else h += M_(rg.numerique ? 'stRangNum' : 'stRang', { N: fmtEntier(rg.N), K: fmtEntier(rg.K || 0) });
        if (E.partiel) h += M_('stPartiel');
      }
    } else if (mode === 'cauchy') {
      const m = mCourant(), r = normeC(n, m), eps = fmtCourt(etat.eps, 3);
      h = M_('stCauchy', { n, m, egal: r.v === Infinity ? '=' : '\\approx', v: fmtCourt(r.v, 4) });
      h += r.v < etat.eps ? M_('stCauchyDans', { eps }) : M_('stCauchyHors', { eps });
      if (Number.isFinite(r.v)) {
        const lot = calc.cauchy && calc.cauchy.n === n ? calc.cauchy : lotCauchy(n, mMax());
        let pire = -1, kp = n + 1;
        for (let k = n + 1; k <= lot.K; k++) if (lot.v[k] > pire) { pire = lot.v[k]; kp = k; }
        if (pire < etat.eps) h += M_('stCauchyTous', { K: fmtEntier(lot.K) });
        else if (kp !== m) h += M_('stCauchyPire', { m: fmtEntier(kp), v: fmtCourt(pire, 4) });
      }
      if (E.partiel) h += M_('stPartiel');
    } else if (mode === 'terme') {
      h = statutNorme('Terme', E.def && E.def.nT, normeT(n), n);
      if (E.partiel) h += M_('stPartiel');
    } else {
      const M = testM();
      if (M) h = M_('stTestM', { texM: M.tex, n, rho: fmtCourt(valRho(n), 4), v: fmtCourt(normeR(n).v, 4) });
      else if (E.def) { const r = normeT(n); h = M_('stTestMNon', { egal: r.v === Infinity ? '=' : '\\approx', v: fmtCourt(r.v, 4) }); }
      else {
        const sm = sommeNumeriqueM(), rho = valRho(n);
        if (sm.infini) h = M_('numMInf');
        else if (!sm.converge) h = M_('stTestMNumNon', { K: fmtEntier(sm.K), somme: fmtCourt(sm.total, 4) });
        else {
          h = M_('stTestMNum', { somme: fmtCourt(sm.total, 4) });
          if (Number.isFinite(rho)) h += ' ' + M_('stTestMNumRho', { n, rho: fmtCourt(rho, 4), v: fmtCourt(normeR(n).v, 4) });
        }
      }
    }
    el.statut.innerHTML = h;
  }

  // ===========================================================================
  //  Panneau : le raisonnement
  // ===========================================================================
  const lienOnglet = (mode, cle) => '<button type="button" class="lien-onglet" data-mode="' + mode + '">' + echapper(t(cle)) + '</button>';
  // Tableau de valeurs numériques (série ou intervalle au choix)
  function tableau(ns, vals) {
    return '<table class="table-num"><tr><th>' + K_('n') + '</th>' + ns.map((k) => '<td>' + k + '</td>').join('') + '</tr><tr><th></th>'
      + vals.map((v) => '<td>' + K_(fmtCourt(v, 3)) + '</td>').join('') + '</tr></table>';
  }
  const tendVersZero = (vals) => {
    const f = vals.filter((v) => Number.isFinite(v));
    if (f.length < 3) return false;
    const d = f[f.length - 1], a = f[f.length - 3], b = f[0];
    return d < 1e-9 || (d < 0.6 * a && a < 0.9 * b) || (d < 1e-3 * b);
  };
  function raisonnement() {
    const Se = etat.Se, E = etat.E, mode = etat.mode;
    const etapes = [];
    let verdict;
    const ajouter = (html, cible, attention) => etapes.push({ html, cible, attention });
    const etat3 = Se.diverge ? 'div' : E.uniforme ? 'oui' : 'non';
    const NS_ = [5, 10, 20, 40, 80, 160].filter((k) => k >= Se.n0);

    if (mode === 'sommes') {
      if (Se.cat) {
        ajouter(texteCat(L(Se.conv)), 's');
        let h = M_('etConv', { C: Se.conv.tex });
        if (Se.texSomme) h += ' ' + M_('etSomme', { f: Se.texSomme });
        else if (Se.noteSomme) h += ' ' + texteCat(L(Se.noteSomme));
        ajouter(h, 'f');
        if (Se.abs) ajouter(texteCat(L(Se.abs)));
        if (Se.diverge) verdict = { cls: 'div', html: M_('etVerdictDiverge') };
        else if (convergeSurA()) verdict = { cls: 'conv', html: M_('etVerdictSimple'), sous: echapper(t('etVerdictSimpleSous')) + ' ' + lienOnglet('uniforme', 'versUniforme') };
        else verdict = { cls: 'div', html: M_('etVerdictPasPartout') };
      } else {
        ajouter(M_('numSomme'), 'f');
        ajouter(M_(convergeSurA() ? 'numSimpleOui' : 'numSimpleNon'), 'A');
        verdict = { cls: 'aucune', html: M_('verdictNum') };
      }
    } else if (mode === 'uniforme') {
      if (E.def) {
        const cibles = ['s', 'ecart', 'A'];
        L(E.def.unif).forEach((s, i) => ajouter(texteCat(s), cibles[i]));
        verdict = E.uniforme ? { cls: 'conv', html: M_('verdictUnif') } : { cls: 'div', html: M_('verdictNonUnif') };
      } else if (!convergeSurA()) {
        ajouter(M_('numIntro'));
        ajouter(M_('numSimpleNon'), 'f', true);
        verdict = { cls: 'div', html: M_('etVerdictPasPartout') };
      } else {
        const lot = lotNormesR(160), vals = NS_.map((k) => lot.v[k]), ok = tendVersZero(vals);
        ajouter(M_('numIntro'), 'A');
        ajouter(M_('numTable') + tableau(NS_, vals) + M_(ok ? 'numVersZero' : 'numPasZero'), 'ecart');
        verdict = { cls: 'aucune', html: M_(ok ? 'verdictNumOui' : 'verdictNumNon'), sous: echapper(t('verdictNumSous')) };
      }
    } else if (mode === 'cauchy') {
      if (E.def) {
        const M = testM(), nT = E.def.nT;
        if (E.def.cauchy) {
          const cibles = ['s', 'ecart', 'bande'];
          L(E.def.cauchy).forEach((s, i) => ajouter(texteCat(s), cibles[i]));
        } else if (M) {
          ajouter(M_('etCauchyM1', { texM: M.tex }), 's');
          ajouter(M_('etCauchyM2', { texRho: M.texRho }), 'bande');
          ajouter(M_('etCauchyM3'));
        } else if (E.def.infini) {
          ajouter(M_('etCauchyInf'), 's', true);
        } else if (nT && !nT.versZero) {
          ajouter(M_('etCauchyT1'), 's');
          ajouter(M_('etCauchyT2', { tex: nT.tex }), 'ecart', true);
        } else ajouter(M_('etCauchyVoir'));
        verdict = E.uniforme ? { cls: 'conv', html: M_('verdictCauchyOui') } : { cls: 'div', html: M_('verdictCauchyNon') };
      } else {
        const ns = NS_.filter((k) => k <= 80), vals = ns.map((k) => normeC(k, 2 * k).v), ok = tendVersZero(vals);
        ajouter(M_('numIntro'), 'A');
        ajouter(M_('numTableC') + tableau(ns, vals) + M_(ok ? 'numVersZero' : 'numPasZero'), 'ecart');
        verdict = { cls: 'aucune', html: M_('verdictNum') };
      }
    } else if (mode === 'terme') {
      const nT = E.def && E.def.nT;
      if (nT) {
        ajouter(M_('etTerme1', { tex: nT.tex, raison: nT.raison ? jetons(L(nT.raison), etat.n) : '' }), 'ecart');
        const xn = E.def.xn;
        if (xn && xn.quoi === 'terme') ajouter(M_('etTemoin', { xn: xn.tex, val: xn.texVal }), 'temoin');
        if (nT.versZero) {
          ajouter(M_('etTermeOui'), 'suite');
          verdict = { cls: 'aucune', html: M_('verdictTermeRien'), sous: echapper(t('verdictTermeRienSous')[etat3]) + ' ' + lienOnglet('uniforme', 'versUniforme') };
        } else {
          ajouter(M_('etTermeNon'), 'suite', true);
          verdict = { cls: 'div', html: M_('verdictTermeNon') };
        }
      } else {
        const vals = NS_.map((k) => normeT(k).v), ok = tendVersZero(vals);
        ajouter(M_('numIntro'), 'A');
        ajouter(M_('numTableT') + tableau(NS_, vals) + M_(ok ? 'numVersZero' : 'numPasZero'), 'ecart');
        verdict = { cls: 'aucune', html: M_('verdictNum') };
      }
    } else {
      const M = testM();
      if (M) {
        ajouter(M_('etM1', { texM: M.tex, raison: jetons(L(M.raison), etat.n) }), 'M');
        ajouter(M_('etM2', { serie: jetons(L(M.serie), etat.n) }), 'M');
        ajouter(M_('etM3'), 'A');
        ajouter(M_('etM4', { texRho: M.texRho }), 'bande');
        verdict = { cls: 'conv', html: M_('verdictM') };
      } else if (E.def) {
        ajouter(texteCat(L(E.def.M.non)), 'suite', true);
        verdict = { cls: 'aucune', html: M_('verdictMNon'), sous: echapper(t('verdictMNonSous')[etat3]) + ' ' + lienOnglet(E.def.cauchy ? 'cauchy' : 'uniforme', E.def.cauchy ? 'versCauchy' : 'versUniforme') };
      } else {
        const sm = sommeNumeriqueM();
        ajouter(M_('numIntro'), 'A');
        ajouter(sm.infini ? M_('numMInf') : M_(sm.converge ? 'numMOui' : 'numMNon', { v: fmtCourt(sm.total, 4) }), 'M');
        verdict = { cls: 'aucune', html: M_('verdictNum') };
      }
    }
    return { etapes, verdict };
  }
  let cleRaison = null;
  function majRaisonnement() {
    const Se = etat.Se, E = etat.E;
    const cle = [etat.langue, etat.mode, Se.id || Se.src, Se.n0, E.id, E.def ? '' : etat.ab.a + ',' + etat.ab.b, E.def ? '' : calc.cle].join('|');
    if (cle === cleRaison) return;
    cleRaison = cle;
    const r = raisonnement();
    el.etapes.innerHTML = r.etapes.map((e) => '<li class="' + (e.cible ? 'lie' : '') + (e.attention ? ' attention' : '') + '"' + (e.cible ? ' data-cible="' + e.cible + '"' : '') + '>' + e.html + '</li>').join('');
    el.verdict.className = 'verdict ' + r.verdict.cls;
    el.verdict.innerHTML = r.verdict.html + (r.verdict.sous ? '<span class="sous">' + r.verdict.sous + '</span>' : '');
  }

  // ===========================================================================
  //  Mise à jour générale
  // ===========================================================================
  function dessiner() {
    dessinerCourbes();
    dessinerSuite();
    majTitres();
  }
  function majCommande() {
    const Se = etat.Se;
    el.curseurN.min = Se.n0;
    el.curseurN.max = Math.max(Se.nmax, etat.n);
    el.curseurN.value = etat.n;
    el.valN.textContent = fmtEntier(etat.n);
    el.btnNMoins.disabled = etat.n <= Se.n0;
    el.btnNPlus.disabled = el.btnNDouble.disabled = etat.n >= Se.ncap;
  }
  function majOnglets() {
    el.onglets.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === etat.mode)));
  }
  function appliquerAccent() {
    if (etat.accent) { el.courbes.dataset.accent = etat.accent; el.suite.dataset.accent = etat.accent; }
    else { delete el.courbes.dataset.accent; delete el.suite.dataset.accent; }
  }
  function majTout() {
    assurerCalc();
    ajusterVueN();
    majOnglets();
    majCommande();
    dessiner();
    majPanneauTest();
    majRaisonnement();
  }

  // ===========================================================================
  //  La série : chargement, exemples, erreurs de saisie
  // ===========================================================================
  function montrerErreur(e) {
    el.champTerme.classList.add('invalide');
    el.erreur.innerHTML = tErreur(e && e.code ? e.code : 'interne', e && e.details);
    el.erreur.hidden = false;
    el.apercu.classList.add('perime');
  }
  function cacherErreur() {
    el.champTerme.classList.remove('invalide');
    el.erreur.hidden = true;
    el.apercu.classList.remove('perime');
  }
  const arrondi2 = (x) => Number(x.toPrecision(2));
  // Réglages de départ d'une série : x_0, ε
  function reglagesDepart() {
    const Se = etat.Se, vd = vueDefaut(), A = bornesA();
    const a = Math.max(A.a, vd.xmin), b = Math.min(A.b, vd.xmax);
    etat.x0 = b > a ? arrondi2(a + 0.7 * (b - a)) : arrondi2((vd.xmin + vd.xmax) / 2);
    if (!(etat.x0 > a && etat.x0 < b) && b > a) etat.x0 = a + 0.7 * (b - a);
    etat.epsBase = Se.epsDefaut || Number((0.08 * (vd.ymax - vd.ymin)).toPrecision(1)) || 0.1;
    etat.eps = etat.epsBase;
  }
  // Charge une série tapée (ou celle d'un exemple) ; false si le terme est invalide
  function chargerSerie(src, opts) {
    const o = opts || {};
    let T, Se;
    try {
      T = S.creerTerme(src);
      const c = reconnaitre(T);
      Se = c ? serieCatalogue(c) : seriePerso(T, etat.ab);
    } catch (e) { montrerErreur(e); return false; }
    cacherErreur();
    arreterAddition();
    etat.src = String(src).trim();
    etat.Se = Se;
    etat.ensId = o.ensId || (Se.cat ? Se.cat.ensembles[0].id : 'ab');
    etat.p = o.p !== undefined ? o.p : null;
    etat.n = Se.nDefaut;
    etat.choixM = 'double'; etat.m = null;
    etat.E = construireEnsemble();
    etat.vueNAuto = true;
    assurerCalc();
    reglagesDepart();
    etat.vue = vueDefaut();
    majPanneauSerie();
    cleRaison = null;
    majTout();
    majURLDiffere();
    return true;
  }
  function choisirExemple(id) {
    const c = C.parId(id);
    if (!c) return;
    el.champTerme.value = c.src;
    chargerSerie(c.src);
  }
  // Change d'ensemble : un de ceux de la série, ou un intervalle [a, b] au choix
  function choisirEnsemble(id) {
    const Se = etat.Se;
    if (id === 'ab' && etat.ensId !== 'ab') {
      // au départ : la partie bornée de l'ensemble affiché, un peu rétrécie si elle est ouverte
      const A = bornesA(), v = etat.vue;
      let a = Number.isFinite(A.a) ? A.a : v.xmin + 0.1 * (v.xmax - v.xmin), b = Number.isFinite(A.b) ? A.b : v.xmax - 0.1 * (v.xmax - v.xmin);
      const M = etat.E.morceaux, ouvertA = M[0].ao, ouvertB = M[M.length - 1].bo, lg = b - a;
      if (ouvertA) a += 0.05 * lg;
      if (ouvertB) b -= 0.05 * lg;
      etat.ab = { a: arrondi2(a), b: arrondi2(b) };
      if (!(etat.ab.b > etat.ab.a)) etat.ab = { a, b };
    }
    if (!Se.cat && id !== 'ab') return;
    etat.ensId = id;
    etat.p = null;
    etat.E = construireEnsemble();
    etat.vueNAuto = true;
    assurerCalc();
    const A = bornesA(), v = etat.vue;
    if (id !== 'ab' || !(A.a >= v.xmin && A.b <= v.xmax)) etat.vue = vueDefaut();
    if (!dansA(etat.x0)) { const a = Math.max(A.a, etat.vue.xmin), b = Math.min(A.b, etat.vue.xmax); if (b > a) etat.x0 = arrondi2(a + 0.7 * (b - a)); }
    majParametreEnsemble();
    cleRaison = null;
    majTout();
    majURLDiffere();
  }
  function changerP(val) {
    const P = etat.E.def && etat.E.def.param;
    if (!P) return;
    const p = clamp(Math.round(val / P.pas) * P.pas, P.min, P.max);
    etat.p = Number(p.toFixed(6));
    etat.E = construireEnsemble();
    majParametreEnsemble();
    majTout();
    majURLDiffere();
  }
  // L'intervalle [a, b] au choix ; pour une série au choix, le premier indice peut changer
  function changerAb(a, b, opts) {
    if (!(Number.isFinite(a) && Number.isFinite(b) && b - a > 1e-9)) { montrerErreur({ code: 'intervalle' }); return false; }
    const Se = etat.Se;
    if (!Se.cat) {
      try {
        const N = seriePerso(Se.T, { a, b });
        N.profondeur = Se.profondeur;
        etat.Se = N;
        if (etat.n < N.n0) etat.n = N.n0;
      } catch (e) { montrerErreur(e); return false; }
    }
    cacherErreur();
    etat.ab = { a, b };
    etat.E = construireEnsemble();
    if (!(opts && opts.glisse)) {
      const v = etat.vue;
      if (!(a >= v.xmin && b <= v.xmax)) etat.vue = vueDefaut();
    }
    majParametreEnsemble();
    if (!etat.Se.cat) majPanneauSerie();
    majTout();
    majURLDiffere();
    return true;
  }

  // ===========================================================================
  //  Les paramètres : onglet, n, m, ε, x_0
  // ===========================================================================
  const GROUPE = { sommes: 'f', uniforme: 'f', testm: 'f', cauchy: 'c', terme: 't' };
  function changerMode(mode) {
    if (!MODES.includes(mode) || mode === etat.mode) return;
    arreterAddition();
    const avant = etat.mode;
    etat.mode = mode;
    etat.vueNAuto = true;
    etat.survolK = null;
    cacherBulle();
    if (GROUPE[avant] !== GROUPE[mode]) etat.vue = vueDefaut();
    majTout();
    majURLDiffere();
    annoncer(t('titreTest')[mode]);
  }
  function changerN(n, opts) {
    const Se = etat.Se;
    n = clamp(Math.round(n), Se.n0, Se.ncap);
    if (n === etat.n) return;
    if (opts && opts.ajout && n === etat.n + 1 && !REDUIT) etat.flash = n;
    etat.n = n;
    majTout();
    majURLDiffere();
  }
  function changerM(m) {
    etat.choixM = 'libre';
    etat.m = clamp(Math.round(m), etat.n + 1, mMax());
    majTout();
    majURLDiffere();
  }
  function choisirM(choix) {
    etat.choixM = choix;
    etat.m = null;
    etat.vueNAuto = true;
    majTout();
    majURLDiffere();
  }
  function changerEps(e) {
    if (!Number.isFinite(e)) return;
    const base = epsBase();
    etat.eps = clamp(e, base / EPS_BAS, base * EPS_HAUT);
    majTout();
    majURLDiffere();
  }
  function changerX0(x) {
    if (!Number.isFinite(x)) return;
    const pas = pasX0();
    etat.x0 = Number((Math.round(clamp(x, etat.vue.xmin, etat.vue.xmax) / pas) * pas).toPrecision(12));
    majTout();
    majURLDiffere();
  }

  // ===========================================================================
  //  « Additionner les termes » : à partir du premier, un à un, puis de plus en plus vite
  // ===========================================================================
  function lancerAddition() {
    if (etat.addition) { arreterAddition(); return; }
    const Se = etat.Se;
    const fin = Math.max(Number(el.curseurN.max), Se.n0 + 1);
    etat.addition = { fin, delai: 520, pas: 1, compte: 0, prochain: performance.now() + 620 };
    etat.n = Se.n0 + 1;          // pour que changerN(n0) redessine
    changerN(Se.n0);
    el.btnAdditionner.classList.add('en-cours');
    el.btnAdditionner.innerHTML = '■&nbsp;<span>' + echapper(t('arreter')) + '</span>';
    requestAnimationFrame(pasAddition);
  }
  function pasAddition(maintenant) {
    const A = etat.addition;
    if (!A) return;
    if (maintenant >= A.prochain) {
      const n = Math.min(A.fin, etat.n + A.pas);
      changerN(n, { ajout: A.pas === 1 });
      if (n >= A.fin) { arreterAddition(); return; }
      A.compte++;
      if (A.compte > 4) A.delai = Math.max(45, A.delai * 0.86);
      if (A.delai <= 45 && A.fin - n > 50) A.pas = Math.ceil((A.fin - n) / 50);
      A.prochain = maintenant + A.delai;
    }
    requestAnimationFrame(pasAddition);
  }
  function arreterAddition() {
    if (!etat.addition) return;
    etat.addition = null;
    el.btnAdditionner.classList.remove('en-cours');
    el.btnAdditionner.innerHTML = '▶&nbsp;<span data-i18n="additionner">' + (TRAD[etat.langue].additionner || TRAD.fr.additionner) + '</span>';
  }

  // Série au choix : pendant un geste, la somme est estimée plus grossièrement ; puis on affine
  function marquerGeste() {
    const Se = etat.Se;
    if (!Se || Se.exacte) return;
    Se.profondeur = 512;
    clearTimeout(etat.affinage);
    etat.affinage = setTimeout(() => {
      etat.Se.profondeur = K_SOMME;
      cleRaison = null;
      majTout();
    }, 280);
  }

  // ===========================================================================
  //  Souris : survol, glisser (extrémités de A, ε, x_0, n, m, déplacement), molette, clic
  // ===========================================================================
  function posDans(svgEl, ev) {
    const r = svgEl.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }
  function indexProche(xs, x) {
    let lo = 0, hi = xs.length - 1;
    while (hi - lo > 1) { const mi = (lo + hi) >> 1; if (xs[mi] < x) lo = mi; else hi = mi; }
    return Math.abs(xs[lo] - x) <= Math.abs(xs[hi] - x) ? lo : hi;
  }
  // Ce que l'on saisit sur le graphe du haut
  function priseCourbes(p) {
    const g = etat.geoCourbes, D = donnees, G = cacheGrille;
    if (!g || !D || !G) return null;
    for (const q of etat.poignees || []) if (Math.abs(p.x - q.X) <= 11 && Math.abs(p.y - g.y0) <= 13) return { type: 'poignee', h: q.h };
    if (p.x < g.x0 - 4 || p.x > g.x1 + 4 || p.y < g.y1 - 4 || p.y > g.y0 + 4) return null;
    if (etat.mode === 'sommes' && Number.isFinite(etat.x0) && Math.abs(p.x - g.X(etat.x0)) <= 8) return { type: 'x0' };
    if ((etat.mode === 'uniforme' || etat.mode === 'cauchy') && D.centre && D.demi > 0) {
      const i = indexProche(G.xs, g.xDe(p.x));
      if (G.inA[i] && Number.isFinite(D.centre[i])) {
        if (Math.abs(p.y - g.Y(D.centre[i] + D.demi)) <= 7 || Math.abs(p.y - g.Y(D.centre[i] - D.demi)) <= 7) return { type: 'eps' };
      }
    }
    return null;
  }
  function brancherCourbes() {
    const svgEl = el.courbes;
    svgEl.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      const p = posDans(svgEl, ev), pr = priseCourbes(p);
      svgEl.setPointerCapture(ev.pointerId);
      etat.glisse = pr ? Object.assign({ svg: svgEl }, pr) : { type: 'pan', svg: svgEl, depart: p, vue: Object.assign({}, etat.vue), bouge: false };
      svgEl.classList.add('glisse');
      cacherBulle();
      etat.survol = null;
      majSurvol();
    });
    svgEl.addEventListener('pointermove', (ev) => {
      const p = posDans(svgEl, ev), G_ = etat.glisse, g = etat.geoCourbes;
      if (!g) return;
      if (G_ && G_.svg === svgEl) {
        if (G_.type === 'poignee') {
          const x = g.xDe(clamp(p.x, g.x0, g.x1));
          marquerGeste();
          if (G_.h.regle) changerP(G_.h.regle(x));
          else {
            const pas = S.pasJoli(etat.vue.xmax - etat.vue.xmin, 200), xa = Number((Math.round(x / pas) * pas).toPrecision(12));
            if (G_.h.ab === 'a') changerAb(Math.min(xa, etat.ab.b - pas), etat.ab.b, { glisse: true });
            else changerAb(etat.ab.a, Math.max(xa, etat.ab.a + pas), { glisse: true });
          }
        } else if (G_.type === 'x0') changerX0(g.xDe(p.x));
        else if (G_.type === 'eps') {
          const i = indexProche(cacheGrille.xs, g.xDe(p.x)), c = donnees.centre[i];
          if (Number.isFinite(c)) changerEps(Math.abs(g.yDe(p.y) - c));
        } else if (G_.type === 'pan') {
          const dx = p.x - G_.depart.x, dy = p.y - G_.depart.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) G_.bouge = true;
          if (G_.bouge) {
            const v = G_.vue, ddx = -dx / g.ex, ddy = ev.pointerType === 'touch' ? 0 : dy / g.ey;
            etat.anim = null;
            etat.vue = { xmin: v.xmin + ddx, xmax: v.xmax + ddx, ymin: v.ymin + ddy, ymax: v.ymax + ddy };
            svgEl.classList.add('deplace');
            marquerGeste();
            if (etat.E.partiel) majTout(); else { dessiner(); if (etat.mode === 'sommes') majPanneauTest(); }
          }
        }
        return;
      }
      // survol
      const pr = priseCourbes(p);
      svgEl.classList.toggle('sur-poignee', !!pr && (pr.type === 'poignee' || pr.type === 'x0'));
      svgEl.classList.toggle('sur-bande', !!pr && pr.type === 'eps');
      const dedans = p.x >= g.x0 && p.x <= g.x1 && p.y >= g.y1 && p.y <= g.y0;
      if (dedans && !pr) montrerBulleCourbes(p, ev); else { cacherBulle(); if (etat.survol) { etat.survol = null; majSurvol(); } }
    });
    const fin = (ev) => {
      const G_ = etat.glisse;
      if (!G_ || G_.svg !== svgEl) return;
      etat.glisse = null;
      svgEl.classList.remove('glisse', 'deplace');
      if (G_.type === 'pan' && !G_.bouge && ev.type === 'pointerup' && etat.mode === 'sommes') {
        // un clic : le point x_0
        const g = etat.geoCourbes, p = posDans(svgEl, ev);
        if (p.x >= g.x0 && p.x <= g.x1 && p.y >= g.y1 && p.y <= g.y0) changerX0(g.xDe(p.x));
      } else if (G_.type === 'poignee') dessiner();
    };
    svgEl.addEventListener('pointerup', fin);
    svgEl.addEventListener('pointercancel', fin);
    svgEl.addEventListener('pointerleave', () => {
      if (etat.glisse) return;
      cacherBulle();
      if (etat.survol) { etat.survol = null; majSurvol(); }
    });
    svgEl.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const g = etat.geoCourbes, p = posDans(svgEl, ev);
      const f = Math.exp(clamp(ev.deltaY, -120, 120) * 0.0022);
      zoomer(f, ev.shiftKey ? 1 : f, g.xDe(p.x), g.yDe(p.y));
    }, { passive: false });
    svgEl.addEventListener('dblclick', () => recadrer(false));
  }
  function montrerBulleCourbes(p, ev) {
    const g = etat.geoCourbes, G = cacheGrille, D = donnees, n = etat.n;
    const i = indexProche(G.xs, g.xDe(p.x)), x = G.xs[i];
    const lignes = [K_('x = ' + fmtCourt(x, 4))];
    const cur = D.cur[i], f = D.F ? D.F[i] : NaN;
    if (Number.isFinite(cur)) {
      const nom = D.mode === 'cauchy' ? 's_{' + D.m + '}(x) - s_{' + n + '}(x)' : D.mode === 'terme' ? 'f_{' + n + '}(x)' : 's_{' + n + '}(x)';
      lignes.push(K_(nom + ' \\approx ' + fmtCourt(cur, 5)));
    }
    if (D.F) {
      if (Number.isFinite(f)) {
        lignes.push(K_('f(x) \\approx ' + fmtCourt(f, 5)));
        if (Number.isFinite(cur)) lignes.push('<span class="petit">' + K_('|R_{' + n + '}(x)| \\approx ' + fmtCourt(Math.abs(f - cur), 3)) + '</span>');
      } else if (G.dom[i]) lignes.push('<span class="petit">' + echapper(t('bDiverge')) + '</span>');
    }
    if (!G.inA[i]) lignes.push('<span class="petit">' + M_('bHorsA') + '</span>');
    const hors = D.centre && D.demi > 0 && G.inA[i] && Number.isFinite(cur) && Number.isFinite(D.centre[i]) && Math.abs(cur - D.centre[i]) >= D.demi;
    el.bulle.className = 'bulle' + (hors ? ' echec' : '');
    el.bulle.innerHTML = lignes.join('<br>');
    el.bulle.hidden = false;
    placerBulle(ev);
    etat.survol = { x, cur, f };
    majSurvol();
  }
  function placerBulle(ev) {
    const zone = el.zone.getBoundingClientRect();
    const bw = el.bulle.offsetWidth, bh = el.bulle.offsetHeight;
    let left = ev.clientX - zone.left + 16, top = ev.clientY - zone.top + 14;
    if (left + bw > zone.width - 6) left = ev.clientX - zone.left - bw - 16;
    if (top + bh > zone.height - 6) top = ev.clientY - zone.top - bh - 12;
    el.bulle.style.left = Math.max(4, left) + 'px';
    el.bulle.style.top = Math.max(4, top) + 'px';
  }
  function cacherBulle() { el.bulle.hidden = true; }

  // Le graphe du bas
  function priseSuite(p) {
    const S_ = etat.geoSuite;
    if (!S_) return null;
    const g = S_.g, rects = etat.mode === 'testm';
    if (p.y < g.y1 - 12 || p.y > g.y0 + 10) return null;
    if (etat.mode === 'cauchy' && Math.abs(p.x - g.X(mCourant())) <= 9) return { type: 'm' };
    if (Math.abs(p.x - g.X(rects ? etat.n + 0.5 : etat.n)) <= 9) return { type: 'n' };
    if (S_.V.niveau != null && !S_.V.message && Math.abs(p.y - S_.E.Y(S_.V.niveau)) <= 7) return { type: 'eps' };
    return null;
  }
  const indiceEn = (g, px) => Math.round(g.kDe(px) - (etat.mode === 'testm' ? 0 : 0));
  function brancherSuite() {
    const svgEl = el.suite;
    svgEl.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      const p = posDans(svgEl, ev), pr = priseSuite(p);
      svgEl.setPointerCapture(ev.pointerId);
      etat.glisse = pr ? Object.assign({ svg: svgEl }, pr) : { type: 'pan', svg: svgEl, depart: p, vue: Object.assign({}, etat.vueN), bouge: false };
      svgEl.classList.add('glisse');
      cacherBulle();
    });
    svgEl.addEventListener('pointermove', (ev) => {
      const p = posDans(svgEl, ev), G_ = etat.glisse, S_ = etat.geoSuite;
      if (!S_) return;
      const g = S_.g;
      if (G_ && G_.svg === svgEl) {
        if (G_.type === 'n') { arreterAddition(); changerN(etat.mode === 'testm' ? Math.round(g.kDe(p.x) - 0.5) : Math.round(g.kDe(p.x))); }
        else if (G_.type === 'm') changerM(Math.round(g.kDe(p.x)));
        else if (G_.type === 'eps') changerEps(S_.E.inv(clamp(p.y, g.y1, g.y0)));
        else if (G_.type === 'pan') {
          const dx = p.x - G_.depart.x;
          if (Math.abs(dx) > 4) G_.bouge = true;
          if (G_.bouge) {
            const larg = G_.vue.b - G_.vue.a, bas = (etat.mode === 'cauchy' ? etat.n : etat.Se.n0) - 0.6;
            const a = Math.max(bas, G_.vue.a - dx / g.w);
            etat.vueN = { a, b: a + larg };
            etat.vueNAuto = false;
            svgEl.classList.add('deplace');
            dessinerSuite();
          }
        }
        return;
      }
      const pr = priseSuite(p);
      svgEl.classList.toggle('sur-ligne-v', !!pr && pr.type !== 'eps');
      svgEl.classList.toggle('sur-ligne-h', !!pr && pr.type === 'eps');
      const k = Math.round(g.kDe(p.x));
      const dedans = p.x >= g.x0 && p.x <= g.x1 && p.y >= g.y1 - 8 && p.y <= g.y0 && k >= S_.deb && k <= S_.fin && k >= S_.V.premier;
      const ks = dedans ? k : null;
      if (ks !== etat.survolK) { etat.survolK = ks; dessinerSuite(); }
      if (ks !== null && !pr) montrerBulleSuite(ks, ev); else cacherBulle();
    });
    const fin = (ev) => {
      const G_ = etat.glisse;
      if (!G_ || G_.svg !== svgEl) return;
      etat.glisse = null;
      svgEl.classList.remove('glisse', 'deplace');
      if (G_.type === 'pan' && !G_.bouge && ev.type === 'pointerup' && etat.geoSuite) {
        // un clic : l'indice n (ou m, à droite de n, pour le critère de Cauchy)
        const g = etat.geoSuite.g, p = posDans(svgEl, ev), k = Math.round(g.kDe(p.x));
        if (p.x >= g.x0 && p.x <= g.x1) {
          arreterAddition();
          if (etat.mode === 'cauchy' && k > etat.n) changerM(k); else changerN(k);
        }
      }
    };
    svgEl.addEventListener('pointerup', fin);
    svgEl.addEventListener('pointercancel', fin);
    svgEl.addEventListener('pointerleave', () => {
      if (etat.glisse) return;
      if (etat.survolK !== null) { etat.survolK = null; dessinerSuite(); }
      cacherBulle();
    });
    svgEl.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const g = etat.geoSuite.g, p = posDans(svgEl, ev);
      zoomerN(Math.exp(clamp(ev.deltaY, -120, 120) * 0.0022), g.kDe(p.x));
    }, { passive: false });
    svgEl.addEventListener('dblclick', () => { etat.vueNAuto = true; ajusterVueN(); dessinerSuite(); });
  }
  function montrerBulleSuite(k, ev) {
    const S_ = etat.geoSuite, V = S_.V, mode = etat.mode, n = etat.n;
    const v = V.v[k], A = etat.E.tex;
    const val = (x) => (x === Infinity ? '= +\\infty' : '\\approx ' + fmtCourt(x, 4));
    const lignes = [];
    if (mode === 'sommes') lignes.push(K_(V.erreur ? '|f(x_0) - s_{' + k + '}(x_0)| ' + val(v) : 's_{' + k + '}(x_0) ' + val(v)));
    else if (mode === 'uniforme') lignes.push(K_('\\nrm{R_{' + k + '}}{' + A + '} ' + val(v)));
    else if (mode === 'cauchy') lignes.push(K_('\\nrm{s_{' + k + '} - s_{' + n + '}}{' + A + '} ' + val(v)));
    else if (mode === 'terme') lignes.push(K_('\\nrm{f_{' + k + '}}{' + A + '} ' + val(v)));
    else {
      if (V.w) lignes.push(K_('M_{' + k + '} ' + val(V.w[k])));
      lignes.push(K_('\\nrm{f_{' + k + '}}{' + A + '} ' + val(v)));
    }
    if (!Number.isFinite(v) && v !== Infinity) { cacherBulle(); return; }
    el.bulle.className = 'bulle' + (V.niveau != null && !(v < V.niveau) ? ' echec' : '');
    el.bulle.innerHTML = lignes.join('<br>');
    el.bulle.hidden = false;
    placerBulle(ev);
  }

  // ===========================================================================
  //  Adresse (partage), annonces
  // ===========================================================================
  function adresse() {
    const Se = etat.Se, E = etat.E, q = new URLSearchParams();
    q.set('lang', etat.langue);
    if (etat.mode !== 'sommes') q.set('t', etat.mode);
    if (Se.cat) { if (Se.id !== SERIE_DEFAUT) q.set('s', Se.id); } else q.set('f', etat.src);
    if (E.id === 'ab') { q.set('A', 'ab'); q.set('a', String(etat.ab.a)); q.set('b', String(etat.ab.b)); }
    else {
      if (Se.cat && E.id !== Se.cat.ensembles[0].id) q.set('A', E.id);
      if (E.def.param && E.p !== E.def.param.defaut) q.set('p', String(E.p));
    }
    if (etat.n !== Se.nDefaut) q.set('n', String(etat.n));
    if (etat.mode === 'cauchy' && etat.choixM !== 'double') q.set('m', etat.choixM === 'suivant' ? 'suivant' : String(mCourant()));
    if (Math.abs(etat.eps - epsBase()) > 1e-12 * epsBase()) q.set('eps', String(+etat.eps.toPrecision(4)));
    if (etat.mode === 'sommes' && Number.isFinite(etat.x0)) q.set('x0', String(+etat.x0.toPrecision(5)));
    if (etat.log) q.set('log', '1');
    if (!etat.precedentes) q.set('prec', '0');
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
  // Dans une page de mathopo.ca, le lien est celui de la page (series-fonctions.html?s=…&n=…),
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
    arreterAddition();
    document.querySelectorAll('[data-i18n]').forEach((e) => { const v = d[e.dataset.i18n]; if (v !== undefined) e.innerHTML = v; });
    document.querySelectorAll('[data-i18n-title]').forEach((e) => { const v = d['title:' + e.dataset.i18nTitle]; if (v !== undefined) e.title = v; });
    document.querySelectorAll('[data-i18n-aria]').forEach((e) => { const v = d['aria:' + e.dataset.i18nAria]; if (v !== undefined) e.setAttribute('aria-label', v); });
    document.title = t('titrePage');
    el.btnLangue.textContent = t('btnLangue');
    el.btnLangue.title = t('btnLangueTitre');
    rendreMaths(el.aide);
    construireExemples();
    cleEnonce = null; cleRaison = null;
    if (etat.Se) { majPanneauSerie(); majTout(); }
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
        e.stopPropagation();
        const j = (i + (e.key === 'ArrowRight' ? 1 : MODES.length - 1)) % MODES.length;
        el.onglets[j].focus();
        changerMode(el.onglets[j].dataset.mode);
      }
    }));
    const clicExemple = (e) => { const b = e.target.closest('.exemple'); if (b) choisirExemple(b.dataset.id); };
    el.exNotes.addEventListener('click', clicExemple);
    el.exExercices.addEventListener('click', clicExemple);

    // le terme général : analysé pendant la frappe, chargé après une courte pause ou sur Entrée
    let minut = null;
    const appliquer = () => {
      const src = el.champTerme.value.trim();
      if (src === etat.src) { cacherErreur(); return; }
      chargerSerie(src);
    };
    el.champTerme.addEventListener('input', () => {
      clearTimeout(minut);
      minut = setTimeout(() => {
        try { S.creerTerme(el.champTerme.value); } catch (e) { montrerErreur(e); return; }
        appliquer();
      }, 420);
    });
    el.champTerme.addEventListener('keydown', (e) => { if (e.key === 'Enter') { clearTimeout(minut); appliquer(); el.champTerme.blur(); } });

    el.ensembles.addEventListener('click', (e) => { const b = e.target.closest('button[data-ens]'); if (b) choisirEnsemble(b.dataset.ens); });
    el.curseurP.addEventListener('input', () => changerP(+el.curseurP.value));
    const lireAb = () => changerAb(parseFloat(String(el.champA.value).replace(',', '.')), parseFloat(String(el.champB.value).replace(',', '.')));
    el.champA.addEventListener('change', lireAb);
    el.champB.addEventListener('change', lireAb);

    el.curseurN.addEventListener('input', () => { arreterAddition(); changerN(+el.curseurN.value); });
    el.btnNMoins.addEventListener('click', () => { arreterAddition(); changerN(etat.n - 1); });
    el.btnNPlus.addEventListener('click', () => { arreterAddition(); changerN(etat.n + 1, { ajout: true }); });
    el.btnNDouble.addEventListener('click', () => { arreterAddition(); changerN(Math.max(2 * etat.n, etat.n + 1)); });
    el.btnAdditionner.addEventListener('click', lancerAddition);

    el.curseurX0.addEventListener('input', () => changerX0(etat.vue.xmin + (+el.curseurX0.value / 1000) * (etat.vue.xmax - etat.vue.xmin)));
    el.curseurEps.addEventListener('input', () => changerEps(epsDeCurseur(+el.curseurEps.value)));
    el.curseurM.addEventListener('input', () => changerM(+el.curseurM.value));
    el.boutonsM.forEach((b) => b.addEventListener('click', () => choisirM(b.dataset.m)));
    const versOnglet = (e) => { const b = e.target.closest('[data-mode]'); if (b) changerMode(b.dataset.mode); };
    el.verdict.addEventListener('click', versOnglet);
    el.etapes.addEventListener('click', versOnglet);

    el.btnZoomMoins.addEventListener('click', () => zoomer(1.5, 1.5));
    el.btnZoomPlus.addEventListener('click', () => zoomer(1 / 1.5, 1 / 1.5));
    el.btnRecadrer.addEventListener('click', () => recadrer(false));
    el.casePrecedentes.addEventListener('change', () => { etat.precedentes = el.casePrecedentes.checked; majTout(); majURLDiffere(); });
    el.caseLog.addEventListener('change', () => { etat.log = el.caseLog.checked; majTout(); majURLDiffere(); });
    el.btnLien.addEventListener('click', copierLien);

    // les étapes du raisonnement mettent en valeur une partie des graphes
    el.etapes.addEventListener('pointerover', (e) => {
      const li = e.target.closest('li[data-cible]');
      const c = li ? li.dataset.cible : null;
      if (c !== etat.accent) { etat.accent = c; appliquerAccent(); }
    });
    el.etapes.addEventListener('pointerleave', () => { etat.accent = null; appliquerAccent(); });

    brancherCourbes();
    brancherSuite();

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
      const mode = etat.mode;
      switch (e.key) {
        case '1': case '2': case '3': case '4': case '5': changerMode(MODES[+e.key - 1]); break;
        case 'ArrowLeft': e.preventDefault(); arreterAddition(); changerN(etat.n - 1); break;
        case 'ArrowRight': e.preventDefault(); arreterAddition(); changerN(etat.n + 1, { ajout: true }); break;
        case 'd': case 'D': arreterAddition(); changerN(Math.max(2 * etat.n, etat.n + 1)); break;
        case 'ArrowUp': case 'ArrowDown': {
          const s = e.key === 'ArrowUp' ? 1 : -1;
          if (mode === 'sommes') { e.preventDefault(); changerX0(etat.x0 + s * (etat.vue.xmax - etat.vue.xmin) / 100); }
          else if (mode === 'uniforme' || mode === 'cauchy') { e.preventDefault(); changerEps(etat.eps * (s > 0 ? 1.08 : 1 / 1.08)); }
          break;
        }
        case 'l': case 'L': el.caseLog.checked = !el.caseLog.checked; etat.log = el.caseLog.checked; majTout(); majURLDiffere(); break;
        case 's': case 'S': el.casePrecedentes.checked = !el.casePrecedentes.checked; etat.precedentes = el.casePrecedentes.checked; majTout(); majURLDiffere(); break;
        case 'f': case 'F': recadrer(false); break;
        case '+': case '=': zoomer(1 / 1.5, 1 / 1.5); break;
        case '-': zoomer(1.5, 1.5); break;
        case ' ': if (cible && cible.tagName === 'BUTTON') return; e.preventDefault(); lancerAddition(); break;
        case 'Escape': arreterAddition(); break;
        case '?': ouvrirAide(); break;
        case 'p': case 'P': basculerPanneau(); break;
        default: break;
      }
    });

    const ro = window.ResizeObserver ? new ResizeObserver(redimensionner) : null;
    if (ro) { ro.observe(el.consCourbes); ro.observe(el.consSuite); }
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
    const rc = el.consCourbes.getBoundingClientRect(), rs = el.consSuite.getBoundingClientRect();
    const T = {
      courbes: { W: Math.max(220, Math.round(rc.width)), H: Math.max(150, Math.round(rc.height)) },
      suite: { W: Math.max(220, Math.round(rs.width)), H: Math.max(110, Math.round(rs.height)) },
    };
    const A = etat.tailles;
    if (T.courbes.W === A.courbes.W && T.courbes.H === A.courbes.H && T.suite.W === A.suite.W && T.suite.H === A.suite.H) return;
    etat.tailles = T;
    if (etat.Se) dessiner();
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
  {
    // l'intervalle [a, b] de l'adresse sert aussi à trouver le premier indice d'une série au choix
    const a0 = parseFloat(params.get('a')), b0 = parseFloat(params.get('b'));
    if (Number.isFinite(a0) && Number.isFinite(b0) && b0 > a0) etat.ab = { a: a0, b: b0 };
    const s0 = params.get('s'), f0 = params.get('f');
    const cat0 = s0 ? C.parId(s0) : null;
    const src0 = cat0 ? cat0.src : (f0 || C.parId(SERIE_DEFAUT).src);
    el.champTerme.value = src0;
    const ens0 = params.get('A'), p0 = parseFloat(params.get('p'));
    if (!chargerSerie(src0, { ensId: ens0 === 'ab' ? null : ens0, p: Number.isFinite(p0) ? p0 : undefined })) {
      el.champTerme.value = C.parId(SERIE_DEFAUT).src;
      chargerSerie(el.champTerme.value);
    }
    if (ens0 === 'ab' && etat.Se.cat && Number.isFinite(a0) && Number.isFinite(b0) && b0 > a0) {
      etat.ensId = 'ab';
      etat.E = construireEnsemble();
      etat.vue = vueDefaut();
      majParametreEnsemble();
    }
    // les autres paramètres de l'adresse
    const n0 = parseInt(params.get('n'), 10), e0 = parseFloat(params.get('eps')), x0 = parseFloat(params.get('x0')), m0 = params.get('m');
    if (Number.isFinite(n0)) etat.n = clamp(n0, etat.Se.n0, etat.Se.ncap);
    if (Number.isFinite(e0) && e0 > 0) etat.eps = clamp(e0, epsBase() / EPS_BAS, epsBase() * EPS_HAUT);
    if (Number.isFinite(x0)) etat.x0 = x0;
    if (m0 === 'suivant') etat.choixM = 'suivant';
    else if (/^\d+$/.test(m0 || '')) { etat.choixM = 'libre'; etat.m = parseInt(m0, 10); }
    if (params.get('log') === '1') { etat.log = true; el.caseLog.checked = true; }
    if (params.get('prec') === '0') { etat.precedentes = false; el.casePrecedentes.checked = false; }
    etat.vue = vueDefaut();
    if (Number.isFinite(x0)) etat.x0 = clamp(x0, etat.vue.xmin, etat.vue.xmax);
    cleRaison = null;
    majTout();
  }

  // Accès pour les tests automatisés (Playwright) et la console
  window.__sf = {
    etat, calc, S, C, changerMode, choisirExemple, chargerSerie, choisirEnsemble, changerP, changerAb, changerN, changerM, choisirM,
    changerEps, changerX0, lancerAddition, arreterAddition, recadrer, zoomer, changerLangue, normeR, normeT, normeC, rang, adresse,
    donnees: () => donnees, majTout, valRho, sommeNumeriqueM, lienAPartager,
  };

  // ===========================================================================
  //  Tests automatiques (index.html?test=1)
  // ===========================================================================
  if (MODE_TEST) setTimeout(lancerTests, 50);
  function lancerTests() {
    const sortie = [];
    let ok = 0, ko = 0;
    const verifier = (nom, cond, detail) => {
      if (cond) ok++; else { ko++; sortie.push('✗ ' + nom + (detail !== undefined ? ' — ' + detail : '')); }
    };
    const pres = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-9) * (1 + Math.abs(b));
    const classeVerdict = () => ['conv', 'div', 'aucune'].find((c) => el.verdict.classList.contains(c));
    const taper = (src) => { el.champTerme.value = src; return chargerSerie(src); };
    const propre = (e) => !/NaN|undefined|\[object|@n|@A|\{[a-zA-Z]+\}/.test(e.textContent);
    try {
      // les tests lisent des textes en français, quelle que soit la langue de départ (elle est rétablie à la fin)
      const langueDepart = etat.langue;
      if (etat.langue !== 'fr') changerLangue('fr');
      // 1. Au départ : la série géométrique, comme dans la figure des notes
      choisirExemple('geometrique');
      if (etat.mode !== 'sommes') changerMode('sommes');
      verifier('géométrique reconnue', etat.Se.id === 'geometrique' && etat.Se.n0 === 0);
      verifier('n = 8 au départ', etat.n === 8);
      verifier('sommes précédentes : s_4, s_2, s_1', JSON.stringify(indicesPrecedents(8)) === '[4,2,1]', JSON.stringify(indicesPrecedents(8)));
      verifier('courbes : s_8, 3 précédentes, f', el.courbes.querySelectorAll('.courbe-fantome').length === 3 && el.courbes.querySelectorAll('.courbe-f').length === 1);
      changerX0(0.5);
      verifier('statut : s_8(0,5) ≈ 1,9961', /1,9961/.test(el.statut.textContent), el.statut.textContent);
      verifier('convergence simple sur (−1, 1)', classeVerdict() === 'conv');
      // 2. Convergence uniforme sur (−1, 1) : non
      changerMode('uniforme');
      verifier('‖R_8‖ = +∞ sur (−1, 1)', normeR(8).v === Infinity);
      verifier('pas uniforme sur (−1, 1)', classeVerdict() === 'div' && rang(etat.eps).aucun === true);
      verifier('bande et partie rouge', el.courbes.querySelectorAll('.bande').length === 1 && el.courbes.querySelectorAll('.courbe-hors').length === 1);
      // 3. Sur [−r, r] : oui, avec la norme exacte et le rang
      choisirEnsemble('ferme');
      verifier('‖R_8‖ = r^9/(1 − r), r = 1/2', pres(normeR(8).v, Math.pow(0.5, 9) / 0.5));
      changerEps(0.5);
      verifier('rang N(0,5) = 2', rang(0.5).N === 2, JSON.stringify(rang(0.5)));
      verifier('uniforme sur [−r, r]', classeVerdict() === 'conv');
      changerP(0.9);
      verifier('r = 0,9 : ‖R_8‖', pres(normeR(8).v, Math.pow(0.9, 9) / 0.1), String(normeR(8).v));
      verifier('poignées de A', el.courbes.querySelectorAll('.poignee-A').length === 2);
      // 4. Critère de Cauchy : l'exercice T1 avec c_n = 1/n
      choisirExemple('T1');
      changerMode('cauchy');
      verifier('T1 : m = 2n', mCourant() === 2 * etat.n);
      verifier('T1 : ‖s_2n − s_n‖ ≥ σ/2', normeC(etat.n, 2 * etat.n).v >= Math.SQRT1_2 / 2, String(normeC(etat.n, 2 * etat.n).v));
      verifier('T1 : point témoin', el.courbes.querySelectorAll('.temoin').length === 1);
      verifier('T1 : critère non satisfait', classeVerdict() === 'div');
      choisirM('suivant');
      verifier('m = n + 1', mCourant() === etat.n + 1 && pres(normeC(etat.n, etat.n + 1).v, 1 / (etat.n + 1), 1e-6));
      changerMode('uniforme');
      verifier('T1 : ‖R_n‖ = π/2', pres(normeR(etat.n).v, Math.PI / 2));
      choisirEnsemble('compact');
      verifier('T1 : uniforme sur [δ, 2π − δ]', classeVerdict() === 'conv' && normeR(40).v < 0.2, String(normeR(40).v));
      // 5. Terme général : P1 (d) sur (1, ∞)
      choisirExemple('P1d');
      choisirEnsemble('ouvert');
      changerMode('terme');
      verifier('P1 (d) : ‖f_n‖ = 1/2', normeT(etat.n).v === 0.5);
      verifier('P1 (d) : pas uniforme sur (1, ∞)', classeVerdict() === 'div');
      verifier('P1 (d) : témoin x_n', el.courbes.querySelectorAll('.temoin').length === 1);
      choisirEnsemble('demi');
      verifier('P1 (d) : sur [a, ∞), le test ne conclut pas', classeVerdict() === 'aucune');
      // 6. Test M : l'illustration des notes
      choisirExemple('cosinus');
      changerMode('testm');
      changerN(4);
      verifier('cos(nx)/n² : ρ_4 ≈ 0,2213', pres(valRho(4), 0.221322955737115, 1e-9), String(valRho(4)));
      verifier('cos(nx)/n² : ‖R_4‖ = ρ_4', pres(normeR(4).v, valRho(4)));
      verifier('test M : bande et verdict', el.courbes.querySelectorAll('.bande.rho').length === 1 && classeVerdict() === 'conv');
      verifier('test M : rectangles', el.suite.querySelectorAll('.barre-y').length > 5 && el.suite.querySelectorAll('.barre-x').length > 5);
      // 7. P1 (f) : uniforme sans test M
      choisirExemple('P1f');
      verifier('P1 (f) : le test M ne s’applique pas', classeVerdict() === 'aucune');
      changerMode('cauchy');
      verifier('P1 (f) : critère de Cauchy satisfait', classeVerdict() === 'conv');
      changerMode('uniforme');
      verifier('P1 (f) : ‖R_n‖ ≤ 1/(n + 1)', normeR(9).v <= 0.1 && normeR(9).v >= 0.05 && classeVerdict() === 'conv', String(normeR(9).v));
      // 8. La série harmonique (fonctions constantes) diverge
      choisirExemple('harmonique');
      verifier('1/n : pas de reste', /converge/.test(el.etiqSuite.textContent) && classeVerdict() === 'div');
      changerMode('terme');
      verifier('1/n : ‖f_n‖ → 0, pas de conclusion', classeVerdict() === 'aucune');
      changerMode('sommes');
      verifier('1/n : diverge', classeVerdict() === 'div' && el.courbes.querySelectorAll('.courbe-f').length === 0);
      // 9. Zêta : rang sur [a, ∞)
      choisirExemple('zeta');
      changerMode('uniforme');
      verifier('zêta : N(0,1) = 10 sur [2, ∞)', rang(0.1).N === 10, JSON.stringify(rang(0.1)));
      // 10. Reconnaissance d'une série tapée autrement
      taper('x^n / n!');
      verifier('x^n/n! reconnue', etat.Se.id === 'exponentielle');
      taper('1/(n^2 + x^2)');
      verifier('1/(n^2 + x^2) reconnue', etat.Se.id === 'P1a');
      // 11. Série au choix : valeurs numériques
      taper('x^n/(1+n^2)');
      verifier('série au choix', !etat.Se.cat && etat.Se.n0 === 0 && etat.E.id === 'ab');
      const G = grilleA(600);
      let brut = 0; for (let k = 0; k <= 200000; k++) brut += Math.pow(G.xs[450], k) / (1 + k * k);
      verifier('somme estimée', Math.abs(G.F[450] - brut) < 1e-4, G.F[450] + ' vs ' + brut);
      verifier('au choix : valeurs numériques seulement', classeVerdict() === 'aucune' && el.etapes.querySelectorAll('.table-num').length === 1);
      changerMode('testm');
      verifier('au choix : Σ M_n semble converger', sommeNumeriqueM().converge === true && Math.abs(sommeNumeriqueM().total - 2.0767) < 0.01, String(sommeNumeriqueM().total));
      // la bande f ± ρ_n du test M, avec M_k := ‖f_k‖_A calculés numériquement
      changerN(4);
      let brutRho = 0; for (let k = 5; k <= 200000; k++) brutRho += 1 / (1 + k * k);
      verifier('au choix : ρ_4 numérique', Math.abs(valRho(4) - brutRho) < 2e-3, valRho(4) + ' vs ' + brutRho);
      verifier('au choix : la bande f ± ρ_n est tracée', !!el.courbes.querySelector('.bande.rho') && el.suite.querySelectorAll('.barre-y').length === 0 && el.suite.querySelectorAll('.barre-x').length > 5);
      verifier('au choix : ‖R_4‖ ≤ ρ_4', normeR(4).v <= valRho(4) + 1e-9, normeR(4).v + ' vs ' + valRho(4));
      verifier('au choix : ρ_n décroît vers 0', valRho(8) < valRho(4) && valRho(64) < valRho(8) && valRho(2000) < 1e-3 && Number.isNaN(valRho(3000)), [valRho(8), valRho(64), valRho(2000)].join(' '));
      verifier('au choix : titre numérique', /numérique/.test(el.titreCourbes.textContent), el.titreCourbes.textContent);
      taper('x^n/sqrt(n)');
      verifier('x^n/sqrt(n) : n0 = 1', etat.Se.n0 === 1);
      verifier('au choix sur [−1, 1] : diverge en x = 1', convergeSurA() === false);
      changerAb(-0.5, 0.5);
      verifier('au choix sur [−1/2, 1/2] : converge', convergeSurA() === true && sommeNumeriqueM().converge === true);
      // 12. Un intervalle au choix pour une série du catalogue
      choisirExemple('geometrique');
      changerMode('uniforme');
      choisirEnsemble('ab');
      verifier('[a, b] au départ', etat.E.id === 'ab' && etat.ab.a === -0.9 && etat.ab.b === 0.9, JSON.stringify(etat.ab));
      verifier('[a, b] : norme numérique', pres(normeR(8).v, Math.pow(0.9, 9) / 0.1, 1e-6), String(normeR(8).v));
      verifier('[a, b] : tableau', classeVerdict() === 'aucune' && el.etapes.querySelectorAll('.table-num').length === 1);
      changerAb(0, 1.5);
      verifier('[0 ; 1,5] : pas de convergence', classeVerdict() === 'div', classeVerdict());
      // 13. Erreur de saisie
      el.champTerme.value = 'x^'; chargerSerie('x^');
      verifier('erreur affichée', !el.erreur.hidden);
      el.champTerme.value = 'x^k'; chargerSerie('x^k');
      verifier('variable inconnue', !el.erreur.hidden && /k/.test(el.erreur.textContent));
      choisirExemple('geometrique');
      verifier('erreur effacée', el.erreur.hidden);
      // 14. Langue
      changerLangue('en');
      verifier('anglais : titre du test', el.titreTest.textContent === 'Uniform convergence');
      verifier('anglais : verdict', /does not converge uniformly/.test(el.verdict.textContent), el.verdict.textContent);
      verifier('anglais : exemples', /geometric series/.test(el.exNotes.querySelector('.exemple').title) && /Lecture notes: geometric series/.test(el.apercu.textContent));
      changerLangue('fr');
      verifier('français : verdict', /ne converge pas uniformément/.test(el.verdict.textContent));
      // 15. Addition, échelle log, sommes précédentes, adresse
      changerMode('sommes');
      lancerAddition();
      verifier('addition lancée', !!etat.addition && etat.n === 0);
      arreterAddition();
      verifier('addition arrêtée', !etat.addition);
      changerN(8);
      etat.log = true; majTout();
      verifier('échelle log : points', el.suite.querySelectorAll('.pt').length > 5);
      etat.log = false; etat.precedentes = false; majTout();
      verifier('sans les sommes précédentes', el.courbes.querySelectorAll('.courbe-fantome').length === 0);
      etat.precedentes = true; majTout();
      choisirExemple('P1b'); choisirEnsemble('loin'); changerP(0.5); changerMode('testm'); changerN(7);
      const ad = adresse();
      verifier('adresse', /s=P1b/.test(ad) && /A=loin/.test(ad) && /p=0\.5/.test(ad) && /t=testm/.test(ad) && /n=7/.test(ad), ad);
      // 16. Toutes les séries, tous les ensembles, tous les onglets, dans les deux langues
      for (const lang of ['fr', 'en']) {
        changerLangue(lang);
        for (const c of C.SERIES) {
          choisirExemple(c.id);
          verifier(lang + ' ' + c.id + ' : reconnue', etat.Se.id === c.id, String(etat.Se.id));
          for (const e of c.ensembles) {
            choisirEnsemble(e.id);
            for (const mode of MODES) {
              changerMode(mode);
              const nom = lang + ' ' + c.id + '/' + e.id + '/' + mode;
              verifier(nom + ' : verdict', !!classeVerdict());
              verifier(nom + ' : textes', propre(el.etapes) && propre(el.verdict) && propre(el.statut) && propre(el.titreCourbes) && propre(el.titreSuite) && el.statut.textContent.length > 3,
                [el.etapes, el.verdict, el.statut, el.titreCourbes, el.titreSuite].filter((x) => !propre(x)).map((x) => x.textContent.slice(0, 90)).join(' / '));
              verifier(nom + ' : formules', el.etapes.querySelectorAll('.katex-error').length + el.statut.querySelectorAll('.katex-error').length + el.enonce.querySelectorAll('.katex-error').length === 0);
              const d = el.courbes.querySelector('.courbe-s:not(.contour)');
              verifier(nom + ' : courbe', !!d && d.getAttribute('d').length > 20);
              if (mode === 'uniforme' && c.somme) verifier(nom + ' : cohérence', (classeVerdict() === 'conv') === e.uniforme);
              if (mode === 'testm') verifier(nom + ' : test M', (classeVerdict() === 'conv') === !!(e.M && e.M.f));
            }
          }
        }
      }
      changerLangue(langueDepart);
      choisirExemple('geometrique');
      changerMode('sommes');
    } catch (e) {
      ko++;
      sortie.push('✗ exception : ' + e.message + '\n' + e.stack);
    }
    window.__resultatTests = { ok, ko, sortie };
    const pre = document.getElementById('tests') || document.body.appendChild(Object.assign(document.createElement('pre'), { id: 'tests' }));
    pre.textContent = (ko ? '✗ ' : '✓ ') + ok + ' test(s) réussi(s), ' + ko + ' échec(s)' + (sortie.length ? '\n' + sortie.join('\n') : '');
  }
})();
