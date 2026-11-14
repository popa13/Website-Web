/* =============================================================================
   Réarranger une série — application interactive (UQTR)
   Application autonome (HTML/CSS/JS) : il suffit d'ouvrir index.html dans un
   navigateur. Le calcul est dans serie-core.js ; KaTeX (vendor/katex) écrit
   les formules. Le graphe reprend la diapositive 10 de la section 3.2 du cours
   MPU1054 : flèches vertes (termes positifs), rouges (termes négatifs), points
   dorés pour le réarrangement, escalier gris pour la série de départ.

   Paramètres d'adresse : ?lang=fr|en
                          ?x=<terme général>   (par exemple x=sin(n)/n)
                          ?f=1,2,4,3,6,8       (premières valeurs de la bijection f)
                          ?c=1.5               (valeur visée par le procédé de Riemann)
                          ?test=1              (tests automatiques)
   ============================================================================= */
'use strict';

(function () {
  const S = window.SerieNoyau;
  const MODE_TEST = /[?&]test=1\b/.test(location.search);
  const INTEGRE = document.documentElement.classList.contains('integre');   // dans une page de mathopo.ca
  if (MODE_TEST) {
    window.addEventListener('error', (e) => {
      const pre = document.getElementById('tests') || document.body.appendChild(Object.assign(document.createElement('pre'), { id: 'tests' }));
      pre.textContent += '\nERREUR : ' + e.message + ' (ligne ' + e.lineno + ')';
    });
  }

  // ===========================================================================
  //  Couleurs (diapositive 10) et constantes
  // ===========================================================================
  const C = {
    vert: '#0E8954', vertMoyen: '#87C4AA', vertClair: '#B7DCCC',
    or: '#DBA326', orFonce: '#9C7414', orClair: '#F2DFB3',
    rouge: '#C0392B', rougeClair: '#F6D5D1',
    gris: '#4D4D4D', grisMoyen: '#9E9E9E', grisClair: '#D4D4D4', grille: '#EFEEE8',
  };
  const NS = 'http://www.w3.org/2000/svg';
  const REDUIT = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const KMAX = 20000;                                   // termes choisis au plus
  const VITESSES = [1, 2, 4, 8, 16, 32, 64, 128, 256];  // termes par seconde
  const JETONS_MIN = 48;                                // jetons affichés par rangée (au moins)
  const JETONS_MAX = 120;                               // … et au plus
  const PUCES_MAX = 160;                                // termes affichés dans la bande
  const SERIE_DEFAUT = '(-1)^(n+1)/n';
  const EXEMPLES = [
    { x: '(-1)^(n+1)/n', tex: '\\frac{(-1)^{n+1}}{n}' },
    { x: '(-1)^(n+1)/sqrt(n)', tex: '\\frac{(-1)^{n+1}}{\\sqrt{n}}' },
    { x: 'sin(n)/n', tex: '\\frac{\\sin n}{n}' },
    { x: 'cos(n*pi/3)/n', tex: '\\frac{\\cos(n\\pi/3)}{n}' },
    { x: '(-1)^(n+1)/n^2', tex: '\\frac{(-1)^{n+1}}{n^2}' },
    { x: '1/n', tex: '\\frac{1}{n}' },
    { x: '(-1)^(n+1)', tex: '(-1)^{n+1}' },
  ];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const $ = (id) => document.getElementById(id);

  // ===========================================================================
  //  Langue (fr par défaut ; ?lang=en ou bouton EN/FR)
  //  Le français est le texte du HTML (capturé au démarrage) ; l'anglais est
  //  donné ici avec les mêmes clés (data-i18n, data-i18n-title, data-i18n-aria).
  //  MSG contient les chaînes produites par le code, dans les deux langues.
  // ===========================================================================
  const TRAD = {
    fr: {},
    en: {
      titre: 'Rearranging a series',
      sousTitre: 'Change the order of the terms… and the sum changes: Riemann’s rearrangement theorem, live.',
      btnAide: '?&nbsp;Help', 'title:btnAide': 'Help (key ?)',
      btnPanneau: 'Panel', 'title:btnPanneau': 'Show or hide the panel (key P)',
      btnPleinEcran: '⛶<span class="libelle">&nbsp;Full screen</span>', 'title:btnPleinEcran': 'Full screen',
      'aria:zoneGraphe': 'Graph of the partial sums',
      'aria:grapheAria': 'Partial sums of the original series (grey) and of the rearrangement (gold)',
      legDepart: 'original series', legRearr: 'rearrangement',
      invite: 'Click <b>above</b> the last point to add a positive term, <b>below</b> it for a negative term.',
      btnPlus: '▲&nbsp;Positive', 'title:btnPlus': 'Add the next positive term (↑ arrow)',
      btnMoins: '▼&nbsp;Negative', 'title:btnMoins': 'Add the next negative term (↓ arrow)',
      btnOrdre: '→&nbsp;In order', 'title:btnOrdre': 'Add the first unused term, in the order of the series (→ arrow)',
      btnAnnuler: '↶&nbsp;Undo', 'title:btnAnnuler': 'Remove the last term (Backspace)',
      btnRecommencer: '↺&nbsp;Start over', 'title:btnRecommencer': 'Remove all terms (key R)',
      btnLien: '🔗&nbsp;Copy link', 'title:btnLien': 'Copy the address of this rearrangement',
      bandeTitre: 'The rearrangement',
      bandeInfo: 'Drag a term to change its place; × removes it.',
      carteSerie: 'The original series',
      'aria:exemples': 'Examples of series',
      carteBanque: 'The terms, to choose from',
      noteBanque: 'Click a term to make it the next term <i>y<sub>k</sub></i> of the rearrangement. Terms already placed are faded.',
      banquePos: 'positive', banqueNeg: 'negative', banqueNul: 'zero',
      motifA: 'Pattern:', motifB: 'positive, then', motifC: 'negative',
      'aria:motifP': 'Number of positive terms', 'aria:motifQ': 'Number of negative terms',
      btnMotif: 'Apply', 'title:btnMotif': 'Add blocks of this pattern, up to 60 terms',
      carteRiemann: 'Riemann’s procedure',
      noteRiemann: 'To aim at a value <i>c</i>: positive terms while <i>t<sub>k</sub></i> ≤ <i>c</i>, then negative terms while <i>t<sub>k</sub></i> &gt; <i>c</i>, and so on. Drag the gold line on the graph to change <i>c</i>.',
      'aria:champC': 'Target value c',
      btnPas: 'One step', 'title:btnPas': 'One step of the procedure (Space)',
      'title:btnLecture': 'Start or stop the procedure (Enter)',
      btnCent: '+100', 'title:btnCent': 'Add 100 terms at once',
      etiqVitesse: 'Speed',
      carteValeurs: 'The values',
      pied: 'Rearranging a series · UQTR · P.-O. Parisé · 2026',
      btnFermer: 'Close',
      aide: `
    <h2>Rearranging a series</h2>
    <p>A <b>rearrangement</b> of the series <span class="m">\\(\\sum x_n\\)</span> is a series <span class="m">\\(\\sum y_k\\)</span> with the same terms in another order: <span class="m">\\(y_k = x_{f(k)}\\)</span> for a bijection <span class="m">\\(f : \\mathbb{N} \\to \\mathbb{N}\\)</span>. For a finite sum, the order does not matter. For a series, it can change everything.</p>
    <ul>
      <li><b>Riemann’s theorem:</b> if the series converges, but not absolutely, its terms can be reordered so that the rearrangement converges to any value <span class="m">\\(c\\)</span> chosen in advance (or diverges).</li>
      <li><b>Rearrangement theorem:</b> if the series converges absolutely, all its rearrangements converge, to the same value.</li>
    </ul>
    <h3>Choosing the terms</h3>
    <ul>
      <li><b>In the bank:</b> click a term (positive terms in green, negative terms in red). It becomes the next term <span class="m">\\(y_k\\)</span>.</li>
      <li><b>On the graph:</b> click above the last point to add the next positive term, below it for the next negative term. A dotted preview shows the step before the click.</li>
      <li><b>With the keyboard:</b> <kbd>↑</kbd> next positive term · <kbd>↓</kbd> next negative term · <kbd>→</kbd> first unused term, in the order of the series · <kbd>Backspace</kbd> undo · <kbd>R</kbd> start over.</li>
      <li><b>Pattern:</b> for instance 1 positive, then 2 negative (the rearrangement of the course notes, which converges to <span class="m">\\(\\tfrac{s}{2}\\)</span>). For the alternating harmonic series, the pattern <span class="m">\\(p\\)</span> positive, <span class="m">\\(q\\)</span> negative converges to <span class="m">\\(\\log 2 + \\tfrac{1}{2} \\log \\tfrac{p}{q}\\)</span>.</li>
      <li><b>The rearrangement:</b> under the graph, drag a term to change its place; × removes it. The line <span class="m">\\(f(1), f(2), \\ldots\\)</span> gives the bijection.</li>
    </ul>
    <h3>Riemann’s procedure</h3>
    <ul>
      <li>Choose <span class="m">\\(c\\)</span> (field, slider, or gold line to drag on the graph), then “One step” (<kbd>Space</kbd>), “Run” (<kbd>Enter</kbd>) or “+100”.</li>
      <li>Positive terms are taken in order while the partial sum is at most <span class="m">\\(c\\)</span>, then negative terms while it exceeds <span class="m">\\(c\\)</span>. Since <span class="m">\\(x_n \\to 0\\)</span>, the gaps to <span class="m">\\(c\\)</span> tend to 0.</li>
      <li>Try it with an absolutely convergent series: the positive terms are no longer enough to reach any <span class="m">\\(c\\)</span>.</li>
    </ul>
    <h3>Typing the general term</h3>
    <p>In terms of <span class="m">\\(n\\)</span>: <code>+ - * / ^</code>, parentheses, <code>sqrt</code>, <code>ln</code> (or <code>log</code>), <code>exp</code>, <code>sin</code>, <code>cos</code>, <code>tan</code>, <code>arctan</code>, <code>abs</code> or <code>|…|</code>, <code>n!</code>, <code>pi</code>, <code>e</code>. Products can be implicit: <code>2n</code>, <code>n(n+1)</code>. Examples: <code>(-1)^(n+1)/n</code>, <code>sin(n)/n</code>, <code>cos(n*pi/3)/n</code>, <code>(-1)^n/sqrt(n)</code>. The series starts at <span class="m">\\(n = 1\\)</span>.</p>
    <p class="indice">The diagnosis (convergence, value <span class="m">\\(s\\)</span>) is numerical: it uses <span class="m">\\(2^{18}\\)</span> terms and can be wrong for a series that converges or diverges very slowly.</p>`,
    },
  };

  const MSG = {
    fr: {
      titrePage: 'Réarranger une série — UQTR',
      btnLangue: 'EN', btnLangueTitre: 'English version',
      termeChoisi: 'terme choisi', termesChoisis: 'termes choisis',
      lancer: '▶&nbsp;Lancer', arreter: '⏸&nbsp;Arrêter',
      vitesse: '{v} terme/s', vitesses: '{v} termes/s',
      vide: 'Cliquez sur un terme de la banque, sur le graphe, ou utilisez les flèches ↑ ↓ du clavier.',
      suite: '+ ⋯ ({n} autres termes)',
      bijection: 'Bijection : ',
      apercuPos: '↑ prochain terme positif', apercuNeg: '↓ prochain terme négatif', apercuClic: 'cliquer pour l’ajouter',
      rang: 'position', serieDepart: 'série de départ',
      lienCopie: '✓&nbsp;Lien copié', lienEchec: 'Copiez l’adresse de la barre du navigateur.',
      dK: 'Termes choisis', dT: 'Somme du réarrangement', dS: 'Série de départ', dVal: 'Valeur de la série',
      dEcart: 'Écart', dCible: 'Distance à la cible', dMotif: 'Limite du motif',
      aucune: '—',
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
        indefini: 'Le terme <i>x</i><sub>{n}</sub> n’est pas défini (division par zéro ou valeur hors domaine). Décalez l’indice, par exemple <code>ln(n+1)</code> au lieu de <code>ln(n)</code>.',
        indefinie: 'Le terme <i>x</i><sub>{n}</sub> n’est pas défini : la série doit être définie pour tout <i>n</i> ≥ 1.',
        taille: 'Les nombres deviennent trop grands.',
        interne: 'Expression non reconnue.',
      },
      diag: {
        conditionnelle: '<span class="badge conditionnelle">converge, mais pas absolument</span> <i>s</i> ≈ <b>{s}</b>. <b>Théorème de Riemann :</b> en réordonnant les termes, on peut obtenir n’importe quelle valeur.',
        absolue: '<span class="badge absolue">converge absolument</span> <i>s</i> ≈ <b>{s}</b>. <b>Théorème de réarrangement :</b> tous les réarrangements convergent vers <i>s</i>. Essayez : la limite ne bouge pas.',
        divergente: '<span class="badge divergente">diverge</span> (numériquement) : les sommes partielles ne se stabilisent pas.',
        grossiere: '<span class="badge grossiere">diverge</span> : le terme général ne tend pas vers 0.',
      },
      motifHarmonique: 'Pour la série harmonique alternée, ce motif converge vers log 2 + ½ log({p}/{q}) ≈ <b>{v}</b>.',
      bloquePos: 'Depuis {m} termes, le procédé n’ajoute que des termes positifs. Ceux qui restent ont une somme d’environ {r} : les sommes partielles ne dépasseront jamais {max} environ, et n’atteindront donc pas <i>c</i>. La série converge absolument : c’est le théorème de réarrangement.',
      bloqueNeg: 'Depuis {m} termes, le procédé n’ajoute que des termes négatifs. Ceux qui restent ont une somme d’environ {r} : les sommes partielles ne descendront jamais sous {max} environ, et n’atteindront donc pas <i>c</i>. La série converge absolument : c’est le théorème de réarrangement.',
      lentPos: 'Il faut beaucoup de termes positifs : leur somme croît très lentement, mais elle finit par dépasser <i>c</i>.',
      lentNeg: 'Il faut beaucoup de termes négatifs : leur somme décroît très lentement, mais elle finit par passer sous <i>c</i>.',
      plusDeTermes: 'Plus de termes disponibles (limite de {k} termes atteinte).',
      forcePos: 'Plus aucun terme négatif disponible : le procédé ne peut que monter.',
      forceNeg: 'Plus aucun terme positif disponible : le procédé ne peut que descendre.',
      aucunPos: 'Aucun terme positif parmi les 200 000 premiers termes.',
      aucunNeg: 'Aucun terme négatif parmi les 200 000 premiers termes.',
      aucunNul: 'Aucun terme nul.',
      annonceAjout: 'y{k} = x{n} ; t{k} ≈ {t}',
      cible: 'cible',
      ecart: 'écart',
    },
    en: {
      titrePage: 'Rearranging a series — UQTR',
      btnLangue: 'FR', btnLangueTitre: 'Version française',
      termeChoisi: 'term chosen', termesChoisis: 'terms chosen',
      lancer: '▶&nbsp;Run', arreter: '⏸&nbsp;Stop',
      vitesse: '{v} term/s', vitesses: '{v} terms/s',
      vide: 'Click a term of the bank or the graph, or use the ↑ ↓ arrow keys.',
      suite: '+ ⋯ ({n} more terms)',
      bijection: 'Bijection: ',
      apercuPos: '↑ next positive term', apercuNeg: '↓ next negative term', apercuClic: 'click to add it',
      rang: 'position', serieDepart: 'original series',
      lienCopie: '✓&nbsp;Link copied', lienEchec: 'Copy the address from the browser bar.',
      dK: 'Terms chosen', dT: 'Sum of the rearrangement', dS: 'Original series', dVal: 'Value of the series',
      dEcart: 'Gap', dCible: 'Distance to the target', dMotif: 'Limit of the pattern',
      aucune: '—',
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
        indefini: 'The term <i>x</i><sub>{n}</sub> is not defined (division by zero or value out of the domain). Shift the index, for instance <code>ln(n+1)</code> instead of <code>ln(n)</code>.',
        indefinie: 'The term <i>x</i><sub>{n}</sub> is not defined: the series must be defined for all <i>n</i> ≥ 1.',
        taille: 'The numbers become too large.',
        interne: 'Unrecognized expression.',
      },
      diag: {
        conditionnelle: '<span class="badge conditionnelle">converges, but not absolutely</span> <i>s</i> ≈ <b>{s}</b>. <b>Riemann’s theorem:</b> by reordering the terms, any value can be obtained.',
        absolue: '<span class="badge absolue">converges absolutely</span> <i>s</i> ≈ <b>{s}</b>. <b>Rearrangement theorem:</b> all rearrangements converge to <i>s</i>. Try it: the limit does not move.',
        divergente: '<span class="badge divergente">diverges</span> (numerically): the partial sums do not settle down.',
        grossiere: '<span class="badge grossiere">diverges</span>: the general term does not tend to 0.',
      },
      motifHarmonique: 'For the alternating harmonic series, this pattern converges to log 2 + ½ log({p}/{q}) ≈ <b>{v}</b>.',
      bloquePos: 'For {m} terms, the procedure has only added positive terms. Those that remain add up to about {r}: the partial sums will never exceed about {max}, so they will not reach <i>c</i>. The series converges absolutely: this is the rearrangement theorem.',
      bloqueNeg: 'For {m} terms, the procedure has only added negative terms. Those that remain add up to about {r}: the partial sums will never go below about {max}, so they will not reach <i>c</i>. The series converges absolutely: this is the rearrangement theorem.',
      lentPos: 'Many positive terms are needed: their sum grows very slowly, but it eventually exceeds <i>c</i>.',
      lentNeg: 'Many negative terms are needed: their sum decreases very slowly, but it eventually goes below <i>c</i>.',
      plusDeTermes: 'No more terms available (limit of {k} terms reached).',
      forcePos: 'No negative term is available any more: the procedure can only go up.',
      forceNeg: 'No positive term is available any more: the procedure can only go down.',
      aucunPos: 'No positive term among the first 200,000 terms.',
      aucunNeg: 'No negative term among the first 200,000 terms.',
      aucunNul: 'No zero term.',
      annonceAjout: 'y{k} = x{n}; t{k} ≈ {t}',
      cible: 'target',
      ecart: 'gap',
    },
  };

  // ===========================================================================
  //  État
  // ===========================================================================
  const el = {
    graphe: $('graphe'), grapheConteneur: $('graphe-conteneur'), etiquettes: $('etiquettes'),
    bulle: $('bulle'), invite: $('invite'), hudK: $('hud-k'), hudKMot: $('hud-k-mot'), hudT: $('hud-t'),
    btnPlus: $('btn-plus'), btnMoins: $('btn-moins'), btnOrdre: $('btn-ordre'),
    btnAnnuler: $('btn-annuler'), btnRecommencer: $('btn-recommencer'), btnLien: $('btn-lien'),
    jetonsRearr: $('jetons-rearr'), bijection: $('bijection'),
    champTerme: $('champ-terme'), apercuTerme: $('apercu-terme'), erreurTerme: $('erreur-terme'),
    exemples: $('exemples'), serieLongue: $('serie-longue'), diagnostic: $('diagnostic'),
    banquePos: $('banque-pos'), banqueNeg: $('banque-neg'), banqueNul: $('banque-nul'), rangeeNuls: $('rangee-nuls'),
    motifP: $('motif-p'), motifQ: $('motif-q'), btnMotif: $('btn-motif'), noteMotif: $('note-motif'),
    champC: $('champ-c'), curseurC: $('curseur-c'), btnPas: $('btn-pas'), btnLecture: $('btn-lecture'),
    btnCent: $('btn-cent'), champVitesse: $('champ-vitesse'), valVitesse: $('val-vitesse'), noteRiemann: $('note-riemann'),
    valeurs: $('valeurs'),
    btnAide: $('btn-aide'), btnPanneau: $('btn-panneau'), btnPleinEcran: $('btn-plein-ecran'), btnLangue: $('btn-langue'),
    aide: $('aide'), btnFermerAide: $('btn-fermer-aide'), annonce: $('annonce'),
  };

  const etat = {
    langue: 'fr',
    src: SERIE_DEFAUT,
    serie: null,
    diag: null,
    harmonique: false,       // la série est-elle la série harmonique alternée ?
    choix: [],               // f(1), f(2), …, f(K)
    utilises: new Set(),
    t: [0],                  // sommes partielles du réarrangement t_0 = 0, t_1, …, t_K
    tExact: null,            // sommes exactes (fractions) tant qu'elles restent raisonnables
    sDep: [0],               // sommes partielles de la série de départ
    c: 1.5,
    ordre: 1,                // plus petit indice peut-être inutilisé (bouton « Dans l'ordre »)
    vue: { xmax: 12, ymin: -0.1, ymax: 1.2 },
    anim: null,              // animation de la vue
    morph: null,             // animation des sommes après un déplacement
    neuf: 0,                 // rang du pas à animer (0 : aucun)
    survol: null,            // pointeur au-dessus du graphe (coordonnées en pixels)
    glisseCible: false,
    lecture: { active: false, vitesse: 3, reste: 0, avant: 0, memeSigne: 0, signe: 0 },
    motif: null,             // { p, q } si le dernier ajout est un motif
    banqueLimite: { 1: JETONS_MIN, '-1': JETONS_MIN, 0: JETONS_MIN },
    taille: { W: 800, H: 400 },
    jetonsBanque: new Map(), // n → élément du jeton dans la banque
  };
  const estUtilise = (n) => etat.utilises.has(n);

  // ===========================================================================
  //  Traductions et formats
  // ===========================================================================
  function t(cle, params) {
    let s = MSG[etat.langue][cle];
    if (s === undefined) s = MSG.fr[cle];
    if (s === undefined) return cle;
    if (params) for (const k in params) s = s.split('{' + k + '}').join(String(typeof params[k] === 'function' ? params[k]() : params[k]));
    return s;
  }
  function tErreur(code, details) {
    const d = details || {};
    let s = (MSG[etat.langue].erreurs[code] || MSG.fr.erreurs[code] || MSG[etat.langue].erreurs.interne);
    for (const k in d) s = s.split('{' + k + '}').join(echapper(String(d[k])));
    return s;
  }
  function echapper(s) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  // Nombre décimal : virgule en français, vrai signe moins
  function fmt(v, ch) {
    if (!Number.isFinite(v)) return '—';
    const chiffres = ch === undefined ? 4 : ch;
    const a = Math.abs(v);
    let s;
    if (a !== 0 && (a < 1e-4 || a >= 1e7)) s = v.toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^-');
    else s = v.toFixed(chiffres);
    if (etat.langue === 'fr') s = s.replace('.', ',');
    return s.replace(/^-/, '−');
  }
  // Même chose, en LaTeX
  function fmtTex(v, ch) {
    if (!Number.isFinite(v)) return '\\text{—}';
    const a = Math.abs(v);
    const chiffres = ch === undefined ? 4 : ch;
    let s;
    if (a !== 0 && (a < 1e-4 || a >= 1e7)) {
      const [m, e] = v.toExponential(2).split('e');
      s = m + ' \\cdot 10^{' + Number(e) + '}';
    } else s = v.toFixed(chiffres);
    if (etat.langue === 'fr') s = s.replace('.', '{,}');
    return s;
  }
  // Décimal court (significatif) pour un jeton dont la valeur exacte est trop longue
  function fmtJetonTex(v) {
    const a = Math.abs(v);
    let s;
    if (a !== 0 && (a < 1e-3 || a >= 1e6)) {
      const [m, e] = v.toExponential(2).split('e');
      s = m + ' \\cdot 10^{' + Number(e) + '}';
    } else s = String(Number(v.toPrecision(4)));
    if (etat.langue === 'fr') s = s.replace('.', '{,}');
    return s;
  }
  const fmtGraduation = (v, pas) => {
    const dec = Math.max(0, -Math.floor(Math.log10(pas) + 1e-9));
    let s = (Math.abs(v) < pas / 1e6 ? 0 : v).toFixed(dec);
    if (etat.langue === 'fr') s = s.replace('.', ',');
    return s.replace(/^-/, '−');
  };

  function katexHTML(tex, affichage) {
    try {
      return katex.renderToString(tex, { displayMode: !!affichage, throwOnError: false, strict: 'ignore', output: 'html' });
    } catch (_) { return echapper(tex); }
  }
  function rendreMaths(racine) {
    racine.querySelectorAll('.m').forEach((e) => {
      const src = e.dataset.tex || e.textContent.replace(/^\s*\\\(|\\\)\s*$/g, '');
      e.dataset.tex = src;
      e.innerHTML = katexHTML(src, false);
    });
  }

  // LaTeX du terme x_n (exact si possible, sinon décimal), avec son signe
  function texTerme(n) {
    const e = etat.serie.exact(n);
    if (e.tex) return e;
    const v = etat.serie.valeur(n);
    return { tex: fmtJetonTex(v), q: null, somme: false };
  }
  // y_k précédé de son signe (« + 1/3 », « − 1/4 »), pour une somme
  function texSigne(n, premier) {
    const e = texTerme(n);
    let tex = e.tex;
    const neg = tex.startsWith('-');
    if (e.somme) tex = '\\left(' + tex + '\\right)';
    if (premier) return tex;
    if (neg && !e.somme) return ' - ' + tex.slice(1);
    return ' + ' + tex;
  }

  // ===========================================================================
  //  Langue : application
  // ===========================================================================
  function capturerFrancais() {
    document.querySelectorAll('[data-i18n]').forEach((e) => { TRAD.fr[e.dataset.i18n] = e.innerHTML; });
    document.querySelectorAll('[data-i18n-title]').forEach((e) => { TRAD.fr['title:' + e.dataset.i18nTitle] = e.title; });
    document.querySelectorAll('[data-i18n-aria]').forEach((e) => { TRAD.fr['aria:' + e.dataset.i18nAria] = e.getAttribute('aria-label') || ''; });
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
    el.champC.value = fmt(etat.c, 2).replace('−', '-');
    majLecture();
    majVitesse();
    if (etat.serie) {
      majPanneauSerie();
      construireBanque();
      construireBande();
      majNoteMotif();
      if (etat.noteR && !el.noteRiemann.hidden) el.noteRiemann.innerHTML = t(etat.noteR.cle, etat.noteR.params);
      majTout({ sansAnimation: true });
    }
  }
  function changerLangue(lang) { appliquerLangue(lang); majURL(); }

  // ===========================================================================
  //  La série de départ
  // ===========================================================================
  function chargerSerie(src, opts) {
    const o = opts || {};
    let serie, diag;
    try {
      serie = S.creerSerie(src);
      diag = S.diagnostiquer(serie.f);
      if (diag.classe === 'indefinie') throw new S.ErreurSerie('indefinie', { n: diag.n });
    } catch (e) {
      montrerErreurTerme(e);
      return false;
    }
    arreterLecture();
    cacherErreurTerme();
    etat.serie = serie;
    etat.src = src;
    etat.diag = diag;
    etat.harmonique = estHarmoniqueAlternee(serie);
    etat.sDep = [0];
    etat.banqueLimite = { 1: JETONS_MIN, '-1': JETONS_MIN, 0: JETONS_MIN };
    etat.motif = null;
    el.noteMotif.hidden = true;
    el.noteRiemann.hidden = true;
    viderChoix();
    if (o.choix) {
      for (const n of o.choix) if (Number.isInteger(n) && n >= 1 && !etat.utilises.has(n) && etat.choix.length < KMAX) pousser(n);
      recalculerExact();
    }
    majPanneauSerie();
    construireBanque();
    construireBande();
    etat.vue = vueCible(true);
    majTout({ sansAnimation: true });
    majURL();
    return true;
  }

  function estHarmoniqueAlternee(serie) {
    try {
      for (let n = 1; n <= 12; n++) {
        const e = serie.exact(n);
        if (!e.q || !S.qEgal(e.q, S.Q(BigInt(n % 2 ? 1 : -1), BigInt(n)))) return false;
      }
      return true;
    } catch (_) { return false; }
  }

  function montrerErreurTerme(e) {
    const code = e && e.code ? e.code : 'interne';
    el.erreurTerme.innerHTML = tErreur(code, e && e.details);
    el.erreurTerme.hidden = false;
    el.champTerme.classList.add('invalide');
    el.apercuTerme.classList.add('perime');
  }
  function cacherErreurTerme() {
    el.erreurTerme.hidden = true;
    el.champTerme.classList.remove('invalide');
    el.apercuTerme.classList.remove('perime');
  }

  function majPanneauSerie() {
    const serie = etat.serie;
    el.apercuTerme.innerHTML = katexHTML('x_n = ' + serie.texGeneral({ virgule: etat.langue === 'fr' }), true);
    // la série « en long » : ses dix premiers termes
    let tex = '\\sum_{n=1}^{\\infty} x_n = ';
    for (let n = 1; n <= 10; n++) tex += texSigne(n, n === 1);
    tex += ' + \\cdots';
    el.serieLongue.innerHTML = katexHTML(tex, true);
    // diagnostic
    const d = etat.diag;
    el.diagnostic.innerHTML = t('diag')[d.classe] ? t('diag')[d.classe].replace('{s}', d.s === null ? '' : fmt(d.s, 4)) : '';
    el.exemples.querySelectorAll('.exemple').forEach((b) => b.setAttribute('aria-pressed', b.dataset.x === etat.src ? 'true' : 'false'));
  }

  function construireExemples() {
    el.exemples.innerHTML = '';
    for (const ex of EXEMPLES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'exemple';
      b.dataset.x = ex.x;
      b.innerHTML = katexHTML(ex.tex, false);
      b.title = ex.x;
      b.addEventListener('click', () => {
        el.champTerme.value = ex.x;
        chargerSerie(ex.x);
      });
      el.exemples.appendChild(b);
    }
  }

  // ===========================================================================
  //  Le réarrangement : ajouter, retirer, déplacer
  // ===========================================================================
  function viderChoix() {
    etat.choix = [];
    etat.utilises.clear();
    etat.t = [0];
    etat.tExact = [S.Q(0n)];
    etat.ordre = 1;
    etat.neuf = 0;
    etat.lecture.memeSigne = 0;
    if (etat.serie) etat.serie.reculerCurseurs();
  }

  // Ajoute x_n à la fin du réarrangement (sans rien dessiner)
  function pousser(n) {
    const v = etat.serie.valeur(n);
    etat.choix.push(n);
    etat.utilises.add(n);
    etat.t.push(etat.t[etat.t.length - 1] + v);
    // somme exacte, tant que les termes sont rationnels et les dénominateurs raisonnables
    if (etat.tExact && etat.tExact.length === etat.choix.length && etat.choix.length <= 3000) {
      const e = etat.serie.exact(n);
      if (e.q) {
        try {
          const s = S.qAdd(etat.tExact[etat.tExact.length - 1], e.q);
          if (S.nbBits(s.d) <= 600) etat.tExact.push(s);
        } catch (_) { /* trop grand : on s'arrête */ }
      }
    }
  }

  function recalculerSommes() {
    const t = [0];
    for (const n of etat.choix) t.push(t[t.length - 1] + etat.serie.valeur(n));
    etat.t = t;
    recalculerExact();
  }
  function recalculerExact() {
    try {
      const ex = S.sommesExactes(etat.serie, etat.choix.slice(0, 3000), 600);
      etat.tExact = ex;
    } catch (_) { etat.tExact = [S.Q(0n)]; }
  }

  // Ajout « interactif » : un terme, puis mise à jour de l'écran
  function ajouter(n, opts) {
    const o = opts || {};
    if (n === null || n === undefined || estUtilise(n)) return false;
    if (etat.choix.length >= KMAX) { bulleTemporaire(t('plusDeTermes', { k: KMAX })); return false; }
    try { pousser(n); } catch (e) { montrerErreurTerme(e); return false; }
    if (!o.motif) etat.motif = null;
    etat.neuf = (o.sansAnimation || REDUIT) ? 0 : etat.choix.length;
    etat.neufK = 0;
    if (!o.differe) apresAjout(1);
    return true;
  }

  function apresAjout(combien) {
    majJetonsBanque();
    if (combien === 1) ajouterPuceFin(); else majBandeLegere();
    majTout();
    const k = etat.choix.length, n = etat.choix[k - 1];
    if (k) annoncer(t('annonceAjout', { k, n, t: fmt(etat.t[k], 4) }));
    majURLDiffere();
  }

  function ajouterProchain(signe) {
    let n;
    try { n = etat.serie.prochain(signe, estUtilise); } catch (e) { montrerErreurTerme(e); return false; }
    if (n === null) { bulleTemporaire(t(signe > 0 ? 'aucunPos' : signe < 0 ? 'aucunNeg' : 'aucunNul')); return false; }
    const ok = ajouter(n);
    if (ok) defilerVersJeton(n);
    return ok;
  }
  function ajouterDansOrdre() {
    let n = etat.ordre;
    while (estUtilise(n)) n++;
    etat.ordre = n;
    const ok = ajouter(n);
    if (ok) defilerVersJeton(n);
    return ok;
  }

  function retirerA(k) {
    if (k < 0 || k >= etat.choix.length) return;
    const avant = etat.t.slice();
    const n = etat.choix.splice(k, 1)[0];
    etat.utilises.delete(n);
    etat.serie.reculerCurseurs();
    etat.ordre = Math.min(etat.ordre, n);
    etat.motif = null;
    recalculerSommes();
    demarrerMorph(avant);
    majJetonsBanque();
    construireBande();
    majTout();
    majURLDiffere();
  }
  function annuler() {
    if (!etat.choix.length) return;
    arreterLecture();
    const k = etat.choix.length - 1;
    const n = etat.choix.pop();
    etat.utilises.delete(n);
    etat.t.pop();
    if (etat.tExact && etat.tExact.length > etat.choix.length + 1) etat.tExact.length = etat.choix.length + 1;
    etat.serie.reculerCurseurs();
    etat.ordre = Math.min(etat.ordre, n);
    etat.neuf = 0;
    majJetonsBanque();
    const p = el.jetonsRearr.querySelector('.jeton[data-k="' + k + '"]');
    if (p && etat.choix.length < PUCES_MAX) { p.remove(); majPucesVides(); } else construireBande();
    majTout();
    majURLDiffere();
  }
  function recommencer() {
    arreterLecture();
    viderChoix();
    etat.motif = null;
    el.noteMotif.hidden = true;
    el.noteRiemann.hidden = true;
    majJetonsBanque();
    construireBande();
    majTout();
    majURLDiffere();
  }
  function deplacer(de, vers) {
    if (de === vers || de < 0 || de >= etat.choix.length) return;
    const avant = etat.t.slice();
    const [n] = etat.choix.splice(de, 1);
    etat.choix.splice(clamp(vers, 0, etat.choix.length), 0, n);
    etat.motif = null;
    recalculerSommes();
    demarrerMorph(avant);
    majJetonsBanque();
    construireBande();
    majTout();
    majURLDiffere();
  }

  // Motif : p termes positifs, puis q négatifs, jusqu'à 60 termes de plus
  function appliquerMotif() {
    const p = clamp(parseInt(el.motifP.value, 10) || 1, 1, 20);
    const q = clamp(parseInt(el.motifQ.value, 10) || 1, 1, 20);
    el.motifP.value = p; el.motifQ.value = q;
    arreterLecture();
    const cible = Math.min(KMAX, etat.choix.length + 60);
    let ajoutes = 0;
    try {
      while (etat.choix.length < cible) {
        let progres = false;
        for (const [signe, m] of [[1, p], [-1, q]]) {
          for (let i = 0; i < m && etat.choix.length < cible; i++) {
            const n = etat.serie.prochain(signe, estUtilise);
            if (n !== null) { pousser(n); ajoutes++; progres = true; }
          }
        }
        if (!progres) break;
      }
    } catch (e) { montrerErreurTerme(e); }
    if (!ajoutes) return;
    etat.motif = { p, q };
    etat.neuf = 0;
    majNoteMotif();
    apresAjout(ajoutes);
  }

  function majNoteMotif() {
    const m = etat.motif;
    if (m && etat.harmonique) {
      const v = Math.log(2) + 0.5 * Math.log(m.p / m.q);
      el.noteMotif.innerHTML = t('motifHarmonique', { p: m.p, q: m.q, v: fmt(v, 4) });
      el.noteMotif.hidden = false;
    } else el.noteMotif.hidden = true;
  }

  // ===========================================================================
  //  Le procédé de Riemann
  // ===========================================================================
  function pasRiemann(differe) {
    const k = etat.choix.length;
    if (k >= KMAX) { arreterLecture(); noteRiemann('plusDeTermes', { k: KMAX }); return false; }
    let e;
    try { e = S.etapeRiemann(etat.serie, etat.t[k], etat.c, estUtilise, 2000000); } catch (err) { montrerErreurTerme(err); arreterLecture(); return false; }
    if (!e) { arreterLecture(); noteRiemann('plusDeTermes', { k }); return false; }
    // suivi : le procédé reste-t-il bloqué d'un côté ?
    const L = etat.lecture;
    if (e.signe === L.signe) L.memeSigne++; else { L.signe = e.signe; L.memeSigne = 1; }
    const ok = ajouter(e.n, { differe, sansAnimation: differe || L.active && VITESSES[L.vitesse] > 8 });
    if (e.force) noteRiemann(e.signe > 0 ? 'forcePos' : 'forceNeg');
    else if (L.memeSigne >= 300 && L.memeSigne % 100 === 0) noteBlocage(e.signe);
    else if (L.memeSigne === 1 && !el.noteRiemann.hidden && el.noteRiemann.dataset.type === 'blocage') el.noteRiemann.hidden = true;
    return ok;
  }
  // Les notes sont gardées sous forme (clé, paramètres) pour suivre la langue
  function noteRiemann(cle, params, type) {
    etat.noteR = { cle, params };
    el.noteRiemann.innerHTML = t(cle, params);
    el.noteRiemann.dataset.type = type || '';
    el.noteRiemann.hidden = false;
  }
  function noteBlocage(signe) {
    const d = etat.diag;
    const m = etat.lecture.memeSigne;
    if (d.classe === 'absolue') {
      // somme des termes de ce signe encore inutilisés (≈ total − utilisés)
      let utilises = 0;
      for (const n of etat.choix) { const v = etat.serie.valeur(n); if (signe > 0 ? v > 0 : v < 0) utilises += v; }
      const total = signe > 0 ? d.sommePos : d.sommeNeg;
      const r = total - utilises;
      const k = etat.choix.length;
      const borne = etat.t[k] + r;
      if (signe > 0 && borne < etat.c) { noteRiemann('bloquePos', { m, r: () => fmt(r, 4), max: () => fmt(borne, 4) }, 'blocage'); return; }
      if (signe < 0 && borne > etat.c) { noteRiemann('bloqueNeg', { m, r: () => fmt(r, 4), max: () => fmt(borne, 4) }, 'blocage'); return; }
    }
    noteRiemann(signe > 0 ? 'lentPos' : 'lentNeg', null, 'blocage');
  }

  function basculerLecture() {
    if (etat.lecture.active) arreterLecture();
    else demarrerLecture();
  }
  function demarrerLecture() {
    if (etat.lecture.active) return;
    etat.lecture.active = true;
    etat.lecture.reste = 0;
    etat.lecture.avant = performance.now();
    majLecture();
    requestAnimationFrame(boucleLecture);
  }
  function arreterLecture() {
    if (!etat.lecture.active) return;
    etat.lecture.active = false;
    majLecture();
    construireBande();
    majTout({ sansAnimation: true });
  }
  function boucleLecture(maintenant) {
    const L = etat.lecture;
    if (!L.active) return;
    const dt = Math.min(0.25, (maintenant - L.avant) / 1000);
    L.avant = maintenant;
    L.reste += dt * VITESSES[L.vitesse];
    let pas = Math.floor(L.reste);
    L.reste -= pas;
    pas = Math.min(pas, 64);
    if (pas > 0) {
      const lent = VITESSES[L.vitesse] <= 8;
      let faits = 0;
      for (let i = 0; i < pas && L.active; i++) {
        if (!pasRiemann(true)) break;
        faits++;
      }
      if (faits) {
        if (lent && faits === 1 && !REDUIT) etat.neuf = etat.choix.length;
        majJetonsBanque();
        if (faits === 1 && etat.choix.length <= PUCES_MAX) ajouterPuceFin(); else majBandeLegere();
        majTout();
        majURLDiffere();
      }
    }
    if (L.active) requestAnimationFrame(boucleLecture);
  }
  function majLecture() {
    el.btnLecture.innerHTML = etat.lecture.active ? t('arreter') : t('lancer');
    el.btnLecture.classList.toggle('en-cours', etat.lecture.active);
  }
  function majVitesse() {
    const v = VITESSES[etat.lecture.vitesse];
    el.champVitesse.value = etat.lecture.vitesse;
    el.valVitesse.textContent = t(v === 1 ? 'vitesse' : 'vitesses', { v });
  }
  function centTermes() {
    arreterLecture();
    let faits = 0;
    for (let i = 0; i < 100; i++) { if (!pasRiemann(true)) break; faits++; }
    if (!faits) return;
    etat.neuf = 0;
    apresAjout(faits);
  }

  // Valeur visée c : champ texte, curseur, ou ligne dorée du graphe
  function changerCible(c, source) {
    if (!Number.isFinite(c)) return;
    etat.c = clamp(c, -1e6, 1e6);
    if (source !== 'champ') el.champC.value = fmt(etat.c, 2).replace('−', '-');
    if (source !== 'curseur') el.curseurC.value = clamp(etat.c, -3, 3);
    el.noteRiemann.hidden = true;
    etat.lecture.memeSigne = 0;
    majTout({ sansAnimationVue: source === 'graphe' });
    majURLDiffere();
  }

  // ===========================================================================
  //  La banque des termes
  // ===========================================================================
  function creerJeton(n, classe) {
    const e = texTerme(n);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'jeton ' + classe;
    b.dataset.n = n;
    b.innerHTML = '<span class="valeur">' + katexHTML(e.tex, false) + '</span><span class="indice-n">x<sub>' + n + '</sub></span>';
    return b;
  }

  function construireBanque() {
    const serie = etat.serie;
    etat.jetonsBanque = new Map();
    const rangees = [[1, el.banquePos, 'pos'], [-1, el.banqueNeg, 'neg'], [0, el.banqueNul, 'nul']];
    // on s'assure d'avoir assez de termes de chaque signe (sans dépasser n = 4000 pour l'affichage)
    try {
      let garde = 0;
      while ((serie.liste(1).length < etat.banqueLimite[1] || serie.liste(-1).length < etat.banqueLimite[-1]) && serie.nCalcule < 4000 && garde++ < 20) {
        serie.etendre(Math.min(4000, serie.nCalcule * 2));
      }
    } catch (e) { montrerErreurTerme(e); }
    for (const [signe, conteneur, classe] of rangees) {
      conteneur.innerHTML = '';
      const L = serie.liste(signe);
      const lim = Math.min(L.length, etat.banqueLimite[signe]);
      const frag = document.createDocumentFragment();
      for (let i = 0; i < lim; i++) {
        const j = creerJeton(L[i], classe);
        etat.jetonsBanque.set(L[i], j);
        frag.appendChild(j);
      }
      if (L.length === 0) {
        const s = document.createElement('span');
        s.className = 'note';
        s.textContent = t(signe > 0 ? 'aucunPos' : signe < 0 ? 'aucunNeg' : 'aucunNul');
        frag.appendChild(s);
      } else if (L.length > lim || serie.nCalcule < 4000) {
        const s = document.createElement('span');
        s.className = 'note suite';
        s.textContent = '⋯';
        frag.appendChild(s);
      }
      conteneur.appendChild(frag);
    }
    el.rangeeNuls.hidden = serie.liste(0).length === 0;
    majJetonsBanque();
  }

  // États des jetons (estompé, rang, prochain) ; agrandit une rangée au besoin
  function majJetonsBanque() {
    const serie = etat.serie;
    let reconstruire = false;
    for (const signe of [1, -1, 0]) {
      const L = serie.liste(signe);
      let dernierUtilise = -1;
      for (let i = 0; i < Math.min(L.length, etat.banqueLimite[signe] + 400); i++) if (estUtilise(L[i])) dernierUtilise = i;
      if (dernierUtilise >= etat.banqueLimite[signe] - 8 && etat.banqueLimite[signe] < JETONS_MAX) {
        etat.banqueLimite[signe] = Math.min(JETONS_MAX, dernierUtilise + 30);
        reconstruire = true;
      }
    }
    if (reconstruire) { construireBanque(); return; }
    const rang = new Map();
    etat.choix.forEach((n, k) => { if (etat.jetonsBanque.has(n)) rang.set(n, k + 1); });
    const prochains = new Set();
    for (const signe of [1, -1]) {
      const L = serie.liste(signe);
      for (let i = 0; i < Math.min(L.length, etat.banqueLimite[signe]); i++) if (!estUtilise(L[i])) { prochains.add(L[i]); break; }
    }
    etat.jetonsBanque.forEach((j, n) => {
      const r = rang.get(n);
      j.classList.toggle('utilise', r !== undefined);
      j.classList.toggle('prochain', prochains.has(n));
      let badge = j.querySelector('.rang');
      if (r !== undefined) {
        if (!badge) { badge = document.createElement('span'); badge.className = 'rang'; j.appendChild(badge); }
        badge.textContent = 'y' + toIndice(r);
        j.title = 'x' + toIndice(n) + ' = y' + toIndice(r);
      } else {
        if (badge) badge.remove();
        j.title = 'x' + toIndice(n);
      }
    });
  }
  const CHIFFRES_INDICE = '₀₁₂₃₄₅₆₇₈₉';
  const toIndice = (k) => String(k).replace(/\d/g, (d) => CHIFFRES_INDICE[+d]);

  function defilerVersJeton(n) {
    const j = etat.jetonsBanque.get(n);
    if (!j) return;
    const r = j.parentElement;
    const gauche = j.offsetLeft - r.offsetLeft;
    if (gauche < r.scrollLeft + 10 || gauche + j.offsetWidth > r.scrollLeft + r.clientWidth - 10) {
      r.scrollLeft = Math.max(0, gauche - r.clientWidth / 3);
    }
    if (!REDUIT) { j.classList.remove('vole'); void j.offsetWidth; j.classList.add('vole'); }
  }

  function clicBanque(ev) {
    const j = ev.target.closest('.jeton');
    if (!j) return;
    const n = +j.dataset.n;
    if (estUtilise(n)) {               // déjà placé : on le montre
      const k = etat.choix.indexOf(n);
      reperer(k);
      return;
    }
    arreterLecture();
    if (ajouter(n) && !REDUIT) { j.classList.remove('vole'); void j.offsetWidth; j.classList.add('vole'); }
  }

  // ===========================================================================
  //  La bande : le réarrangement, terme par terme
  // ===========================================================================
  function creerPuce(k) {
    const n = etat.choix[k];
    const e = texTerme(n);
    const v = etat.serie.valeur(n);
    const p = document.createElement('span');
    p.className = 'jeton ' + (v > 0 ? 'pos' : v < 0 ? 'neg' : 'nul');
    p.dataset.k = k;
    p.tabIndex = 0;
    p.setAttribute('role', 'listitem');
    p.innerHTML = '<span class="valeur">' + katexHTML(e.tex, false) + '</span><span class="indice-n">y<sub>' + (k + 1) + '</sub> = x<sub>' + n + '</sub></span>' +
      '<button type="button" class="retirer" tabindex="-1" aria-label="×">×</button>';
    return p;
  }
  function construireBande() {
    const c = el.jetonsRearr;
    c.innerHTML = '';
    const K = etat.choix.length;
    if (!K) { majPucesVides(); majBijection(); return; }
    const debut = document.createElement('span');
    debut.className = 'somme-debut';
    debut.innerHTML = katexHTML('\\sum y_k =', false);
    c.appendChild(debut);
    const frag = document.createDocumentFragment();
    for (let k = 0; k < Math.min(K, PUCES_MAX); k++) frag.appendChild(creerPuce(k));
    c.appendChild(frag);
    if (K > PUCES_MAX) {
      const s = document.createElement('span');
      s.className = 'suite';
      s.textContent = t('suite', { n: K - PUCES_MAX });
      c.appendChild(s);
    }
    majBijection();
    requestAnimationFrame(() => { c.scrollLeft = c.scrollWidth; });
  }
  // Pendant la lecture rapide : seulement le compte des termes
  function majBandeLegere() {
    const K = etat.choix.length;
    const s = el.jetonsRearr.querySelector('.suite');
    const nb = el.jetonsRearr.querySelectorAll('.jeton').length;
    if (K <= PUCES_MAX && nb < K) { for (let k = nb; k < K; k++) ajouterPuceFin(k); return; }
    if (K > PUCES_MAX) {
      if (nb < PUCES_MAX) { construireBande(); return; }
      if (s) s.textContent = t('suite', { n: K - PUCES_MAX });
      else construireBande();
    }
    majBijection();
  }
  function ajouterPuceFin(kForce) {
    const K = etat.choix.length;
    const k = kForce === undefined ? K - 1 : kForce;
    const c = el.jetonsRearr;
    if (K > PUCES_MAX || !c.querySelector('.somme-debut')) { construireBande(); return; }
    c.appendChild(creerPuce(k));
    majBijection();
    c.scrollLeft = c.scrollWidth;
  }
  function majPucesVides() {
    const c = el.jetonsRearr;
    if (!etat.choix.length) {
      c.innerHTML = '<span class="vide">' + t('vide') + '</span>';
    }
    majBijection();
  }
  function majBijection() {
    const K = etat.choix.length;
    if (!K) { el.bijection.innerHTML = ''; return; }
    const m = Math.min(K, 40);
    const vals = etat.choix.slice(0, m).join(', ') + (K > m ? ', …' : '');
    el.bijection.innerHTML = echapper(t('bijection')) + katexHTML('f(1), f(2), \\ldots = ', false) + ' ' + vals;
  }
  function reperer(k) {
    if (k < 0) return;
    const p = el.jetonsRearr.querySelector('.jeton[data-k="' + k + '"]');
    if (p) {
      p.classList.remove('repere'); void p.offsetWidth; p.classList.add('repere');
      p.scrollIntoView({ block: 'nearest', inline: 'center', behavior: REDUIT ? 'auto' : 'smooth' });
      setTimeout(() => p.classList.remove('repere'), 1200);
    }
    etat.repere = { k: k + 1, jusqua: performance.now() + 1100 };
    dessiner();
  }

  // Glisser-déposer dans la bande (souris et doigt)
  const glisse = { actif: false, k: -1, x0: 0, y0: 0, porte: null, insertion: null, cible: -1, puce: null, id: null };
  function bandeDown(ev) {
    const b = ev.target.closest('.retirer');
    const p = ev.target.closest('.jeton');
    if (!p || b) return;
    glisse.k = +p.dataset.k; glisse.x0 = ev.clientX; glisse.y0 = ev.clientY; glisse.puce = p; glisse.actif = false; glisse.id = ev.pointerId;
    p.setPointerCapture(ev.pointerId);
  }
  function bandeMove(ev) {
    if (glisse.k < 0 || ev.pointerId !== glisse.id) return;
    if (!glisse.actif) {
      if (Math.hypot(ev.clientX - glisse.x0, ev.clientY - glisse.y0) < 6) return;
      glisse.actif = true;
      arreterLecture();
      const r = glisse.puce.getBoundingClientRect();
      glisse.porte = glisse.puce.cloneNode(true);
      glisse.porte.classList.add('porte');
      const x = glisse.porte.querySelector('.retirer');
      if (x) x.remove();
      glisse.porte.style.width = r.width + 'px';
      glisse.porte.dx = ev.clientX - r.left; glisse.porte.dy = ev.clientY - r.top;
      document.body.appendChild(glisse.porte);
      glisse.puce.classList.add('fantome-place');
      glisse.insertion = document.createElement('span');
      glisse.insertion.className = 'insertion';
    }
    glisse.porte.style.left = (ev.clientX - glisse.porte.dx) + 'px';
    glisse.porte.style.top = (ev.clientY - glisse.porte.dy) + 'px';
    // position d'insertion : d'après le milieu des puces
    const puces = [...el.jetonsRearr.querySelectorAll('.jeton')];
    let cible = puces.length;
    for (let i = 0; i < puces.length; i++) {
      const r = puces[i].getBoundingClientRect();
      if (ev.clientX < r.left + r.width / 2) { cible = i; break; }
    }
    glisse.cible = cible;
    if (cible < puces.length) el.jetonsRearr.insertBefore(glisse.insertion, puces[cible]);
    else puces[puces.length - 1].after(glisse.insertion);
    // défilement automatique près des bords
    const rc = el.jetonsRearr.getBoundingClientRect();
    if (ev.clientX < rc.left + 30) el.jetonsRearr.scrollLeft -= 12;
    else if (ev.clientX > rc.right - 30) el.jetonsRearr.scrollLeft += 12;
  }
  function bandeUp(ev) {
    if (glisse.k < 0 || ev.pointerId !== glisse.id) return;
    const k = glisse.k;
    if (glisse.actif) {
      glisse.porte.remove();
      glisse.insertion.remove();
      glisse.puce.classList.remove('fantome-place');
      let vers = glisse.cible;
      if (vers > k) vers--;            // la puce retirée décale les suivantes
      glisse.k = -1; glisse.actif = false;
      if (vers !== k && vers >= 0) deplacer(k, vers);
    } else {
      glisse.k = -1;
      reperer(k);
    }
  }
  function bandeCancel() {
    if (glisse.actif) { glisse.porte.remove(); glisse.insertion.remove(); glisse.puce.classList.remove('fantome-place'); }
    glisse.k = -1; glisse.actif = false;
  }

  // ===========================================================================
  //  Le graphe
  // ===========================================================================
  const marges = () => {
    const etroit = etat.taille.W < 560;
    return { g: etroit ? 40 : 52, d: etroit ? 74 : 104, h: 40, b: 30 };
  };
  function sommeDepart(n) {
    const s = etat.sDep;
    while (s.length <= n) {
      const m = s.length;
      s.push(s[m - 1] + etat.serie.valeur(m));
    }
    return s[n];
  }
  // Vue souhaitée : x jusqu'à K + 2 au moins, y englobant les deux escaliers, s, c et 0
  function vueCible(immediat) {
    const K = etat.choix.length;
    const v = etat.anim ? etat.anim.vers : etat.vue;   // la cible d'une animation en cours, pas une vue intermédiaire
    let xmax = v.xmax;
    const besoin = K + 2;
    if (immediat || besoin > xmax || xmax > Math.max(12, 1.7 * (K + 3))) {
      xmax = Math.max(12, K < 24 ? besoin + 2 : Math.ceil(besoin * 1.22));
    }
    let lo = 0, hi = 0;
    const t = etat.t;
    for (let k = 0; k <= K; k++) { if (t[k] < lo) lo = t[k]; if (t[k] > hi) hi = t[k]; }
    const nDep = Math.min(Math.floor(xmax), 200000);
    try {
      const pasDep = Math.max(1, Math.floor(nDep / 4000));
      for (let n = 1; n <= nDep; n += pasDep) { const s = sommeDepart(n); if (s < lo) lo = s; if (s > hi) hi = s; }
    } catch (_) { /* série non définie plus loin */ }
    const d = etat.diag;
    if (d && d.s !== null && Number.isFinite(d.s)) { lo = Math.min(lo, d.s); hi = Math.max(hi, d.s); }
    if (Number.isFinite(etat.c) && Math.abs(etat.c - (lo + hi) / 2) < 4 * Math.max(1, hi - lo)) { lo = Math.min(lo, etat.c); hi = Math.max(hi, etat.c); }
    if (hi - lo < 1e-9) { hi += 0.5; lo -= 0.5; }
    const pad = (hi - lo) * 0.09;
    let ymin = lo - pad, ymax = hi + pad * 1.5;
    // stabilité : on garde l'ancienne vue si elle contient la nouvelle sans trop de marge
    if (!immediat && ymin >= v.ymin && ymax <= v.ymax && (v.ymax - v.ymin) < 1.5 * (ymax - ymin)) { ymin = v.ymin; ymax = v.ymax; }
    return { xmax, ymin, ymax };
  }
  function animerVue(cible, duree) {
    const v = etat.vue;
    if (Math.abs(cible.xmax - v.xmax) < 1e-9 && Math.abs(cible.ymin - v.ymin) < 1e-12 && Math.abs(cible.ymax - v.ymax) < 1e-12) return false;
    if (REDUIT || duree === 0) { etat.vue = cible; etat.anim = null; return false; }
    etat.anim = { de: Object.assign({}, v), vers: cible, debut: performance.now(), duree: duree || 280 };
    requestAnimationFrame(boucleAnim);
    return true;
  }
  function demarrerMorph(avant) {
    if (REDUIT) { etat.morph = null; return; }
    etat.morph = { de: avant, debut: performance.now(), duree: 380 };
    requestAnimationFrame(boucleAnim);
  }
  let animEnCours = false;
  function boucleAnim(maintenant) {
    if (animEnCours) return;
    animEnCours = true;
    requestAnimationFrame(function etape(m) {
      let encore = false;
      if (etat.anim) {
        const a = etat.anim;
        const u = clamp((m - a.debut) / a.duree, 0, 1);
        const e = 1 - Math.pow(1 - u, 3);
        etat.vue = {
          xmax: a.de.xmax + (a.vers.xmax - a.de.xmax) * e,
          ymin: a.de.ymin + (a.vers.ymin - a.de.ymin) * e,
          ymax: a.de.ymax + (a.vers.ymax - a.de.ymax) * e,
        };
        if (u >= 1) etat.anim = null; else encore = true;
      }
      if (etat.morph) {
        if (m - etat.morph.debut >= etat.morph.duree) etat.morph = null; else encore = true;
      }
      dessiner();
      if (encore) requestAnimationFrame(etape); else animEnCours = false;
    });
  }

  function elt(nom, attrs, parent) {
    const e = document.createElementNS(NS, nom);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const r2 = (v) => Math.round(v * 100) / 100;

  // Pointe de flèche (Stealth) en (x, y), vers le haut si dir < 0 (écran), vers le bas sinon
  function pointe(x, y, dir, L) {
    const w = 0.6 * L;
    return 'M' + r2(x) + ' ' + r2(y) + 'L' + r2(x + w) + ' ' + r2(y - dir * L) + 'L' + r2(x) + ' ' + r2(y - dir * 0.62 * L) +
      'L' + r2(x - w) + ' ' + r2(y - dir * L) + 'Z';
  }
  const cercle = (x, y, r) => 'M' + r2(x - r) + ' ' + r2(y) + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0';

  // Un escalier de sommes partielles (valeurs v[0..K]) en chemins SVG regroupés
  function escalier(v, signes, X, Y, style, saufDernier) {
    const K = v.length - 1;
    const dx = X(1) - X(0);
    const mode = dx >= 7 ? 'plein' : dx >= 2.2 ? 'compact' : 'ligne';
    let liens = '', tigesP = '', tigesN = '', tetesP = '', tetesN = '', points = '', ligne = '';
    const fin = saufDernier ? K - 1 : K;
    for (let k = 1; k <= fin; k++) {
      const x = X(k), ya = Y(v[k - 1]), yb = Y(v[k]);
      if (mode === 'ligne') {
        ligne += (k === 1 ? 'M' + r2(X(0)) + ' ' + r2(ya) : '') + 'H' + r2(x) + 'V' + r2(yb);
        continue;
      }
      if (k > 1) liens += 'M' + r2(X(k - 1)) + ' ' + r2(ya) + 'H' + r2(x);
      const d = yb - ya, ad = Math.abs(d);
      const pos = signes[k] > 0;
      if (mode === 'plein' && ad > 5) {
        const L = Math.min(style.tete, 0.5 * ad);
        const dir = d < 0 ? -1 : 1;
        const tige = 'M' + r2(x) + ' ' + r2(ya) + 'V' + r2(yb - dir * 0.62 * L);
        const tete = pointe(x, yb, dir, L);
        if (pos) { tigesP += tige; tetesP += tete; } else { tigesN += tige; tetesN += tete; }
      } else if (ad > 0.3) {
        const tige = 'M' + r2(x) + ' ' + r2(ya) + 'V' + r2(yb);
        if (pos) tigesP += tige; else tigesN += tige;
      }
      if (mode === 'plein') points += cercle(x, yb, style.rayon);
    }
    const g = elt('g', { class: style.classe });
    if (mode === 'ligne') {
      elt('path', { d: ligne, fill: 'none', stroke: style.ligne, 'stroke-width': style.epLigne }, g);
      return g;
    }
    elt('path', { d: liens, fill: 'none', stroke: style.lien, 'stroke-width': mode === 'plein' ? 1 : 0.8, 'stroke-dasharray': mode === 'plein' ? '1.6 2.2' : 'none' }, g);
    elt('path', { d: tigesP, fill: 'none', stroke: style.vert, 'stroke-width': mode === 'plein' ? style.ep : 1 }, g);
    elt('path', { d: tigesN, fill: 'none', stroke: style.rouge, 'stroke-width': mode === 'plein' ? style.ep : 1 }, g);
    elt('path', { d: tetesP, fill: style.vert }, g);
    elt('path', { d: tetesN, fill: style.rouge }, g);
    if (points) elt('path', { d: points, fill: style.remplissage, stroke: style.contour, 'stroke-width': style.epPoint }, g);
    return g;
  }

  const STYLE_DEPART = { classe: 'depart', lien: C.grisClair, vert: C.grisClair, rouge: C.grisClair, ep: 1.2, tete: 6, rayon: 2.6, remplissage: C.grisClair, contour: 'none', epPoint: 0, ligne: C.grisClair, epLigne: 1.2 };
  const STYLE_REARR = { classe: 'rearr', lien: C.grisMoyen, vert: C.vert, rouge: C.rouge, ep: 1.8, tete: 8, rayon: 3.6, remplissage: C.or, contour: C.orFonce, epPoint: 1.2, ligne: C.orFonce, epLigne: 1.5 };

  // Graduations « rondes » : 1, 2 ou 5 × 10^m, espacées d'au moins « ecart » pixels
  function pasRond(etendue, pixels, ecart) {
    const brut = etendue * ecart / Math.max(1, pixels);
    const p = Math.pow(10, Math.floor(Math.log10(brut)));
    for (const m of [1, 2, 5, 10]) if (m * p >= brut) return m * p;
    return 10 * p;
  }

  function dessiner() {
    const svg = el.graphe;
    const { W, H } = etat.taille;
    const M = marges();
    const x0 = M.g, x1 = W - M.d, y0 = M.h, y1 = H - M.b;
    const v = etat.vue;
    const X = (n) => x0 + (n / v.xmax) * (x1 - x0);
    const Y = (y) => y1 - (y - v.ymin) / (v.ymax - v.ymin) * (y1 - y0);
    etat.repereX = { X, Y, x0, x1, y0, y1 };
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = '';
    const etiq = el.etiquettes;
    etiq.innerHTML = '';
    const K = etat.choix.length;

    // ---------- grille et axes
    const gAxes = elt('g', {}, svg);
    const pasY = pasRond(v.ymax - v.ymin, y1 - y0, 46);
    const yAxe = clamp(Y(0), y0, y1);
    for (let yv = Math.ceil(v.ymin / pasY) * pasY; yv <= v.ymax + 1e-12; yv += pasY) {
      const y = Y(yv);
      if (Math.abs(yv) > pasY / 1e6) elt('line', { x1: x0, x2: x1, y1: r2(y), y2: r2(y), stroke: C.grille, 'stroke-width': 1 }, gAxes);
      elt('line', { x1: x0 - 4, x2: x0, y1: r2(y), y2: r2(y), stroke: C.gris, 'stroke-width': 1 }, gAxes);
      etiquette(x0 - 7, y, fmtGraduation(yv, pasY), 'axe', { droite: true });
    }
    const pasX = Math.max(1, Math.round(pasRond(v.xmax, x1 - x0, 38)));
    for (let n = pasX; n <= v.xmax + 1e-9; n += pasX) {
      const x = X(n);
      elt('line', { x1: r2(x), x2: r2(x), y1: r2(yAxe), y2: r2(yAxe + 4), stroke: C.gris, 'stroke-width': 1 }, gAxes);
      etiquette(x, Math.min(yAxe + 13, H - 10), String(n), 'axe', { centre: true });
    }
    elt('path', { d: 'M' + x0 + ' ' + r2(yAxe) + 'H' + r2(x1 + 22), stroke: C.gris, 'stroke-width': 1.2, fill: 'none' }, gAxes);
    elt('path', { d: 'M' + r2(x1 + 28) + ' ' + r2(yAxe) + 'l-8 -3.6l2.2 3.6l-2.2 3.6z', fill: C.gris }, gAxes);
    elt('path', { d: 'M' + x0 + ' ' + r2(y1) + 'V' + r2(y0 - 18), stroke: C.gris, 'stroke-width': 1.2, fill: 'none' }, gAxes);
    elt('path', { d: 'M' + x0 + ' ' + r2(y0 - 22) + 'l-3.6 8l3.6 -2.2l3.6 2.2z', fill: C.gris }, gAxes);
    etiquette(x1 + 30, yAxe - 1, '<i>n</i>', 'axe', {});

    // ---------- série de départ (en gris)
    const nDep = Math.min(Math.floor(v.xmax), 200000);
    let sd = null;
    try {
      sd = [0];
      for (let n = 1; n <= nDep; n++) sd.push(sommeDepart(n));
    } catch (_) { sd = null; }
    if (sd) {
      const signesD = sd.map((_, n) => (n ? Math.sign(etat.serie.valeur(n)) : 0));
      svg.appendChild(escalier(sd, signesD, X, Y, STYLE_DEPART, false));
    }

    // ---------- droites s et c
    const d = etat.diag;
    const gLignes = elt('g', {}, svg);
    if (d && d.s !== null && Number.isFinite(d.s) && d.s >= v.ymin && d.s <= v.ymax) {
      const y = Y(d.s);
      elt('line', { x1: x0, x2: x1 + 4, y1: r2(y), y2: r2(y), stroke: C.grisMoyen, 'stroke-width': 1.3, 'stroke-dasharray': '6 4' }, gLignes);
      etiquette(x1 + 8, y, katexHTML('s \\approx ' + fmtTex(d.s, 3), false), 'ligne s', {});
    }
    const yc = Y(etat.c);
    const cVisible = etat.c >= v.ymin && etat.c <= v.ymax;
    if (cVisible) {
      elt('line', { x1: x0, x2: x1 + 4, y1: r2(yc), y2: r2(yc), stroke: C.or, 'stroke-width': etat.glisseCible ? 2.4 : 1.8, 'stroke-dasharray': '8 5' }, gLignes);
      elt('circle', { cx: r2(x1 + 4), cy: r2(yc), r: etat.glisseCible ? 6.5 : 5, fill: C.or, stroke: C.orFonce, 'stroke-width': 1.2 }, gLignes);
      etiquette(x1 + 14, yc, katexHTML('c = ' + fmtTex(etat.c, 2), false), 'ligne c', {});
    }

    // ---------- le réarrangement (en or)
    let tv = etat.t;
    if (etat.morph) {
      const m = etat.morph;
      const u = clamp((performance.now() - m.debut) / m.duree, 0, 1);
      const e = 1 - Math.pow(1 - u, 3);
      tv = etat.t.map((y, k) => (k < m.de.length ? m.de[k] + (y - m.de[k]) * e : y));
    }
    const signesR = [0].concat(etat.choix.map((n) => Math.sign(etat.serie.valeur(n))));
    const animerNeuf = etat.neuf === K && K > 0 && !etat.anim && !etat.morph;
    if (K) svg.appendChild(escalier(tv, signesR, X, Y, STYLE_REARR, animerNeuf));
    if (animerNeuf) dessinerPasNeuf(svg, K, tv, signesR, X, Y);
    if (etat.repere && performance.now() < etat.repere.jusqua && etat.repere.k <= K) {
      const k = etat.repere.k;
      elt('circle', { cx: r2(X(k)), cy: r2(Y(tv[k])), r: 3.6, fill: 'none', stroke: C.or, 'stroke-width': 1.2, class: 'surbrillance' }, svg);
    }

    // ---------- étiquettes des termes (peu de termes, assez de place)
    const dx = X(1) - X(0);
    let largeurDerniere = 0;           // l'étiquette du dernier pas, que la flèche « écart » doit éviter
    if (K && K <= 30 && dx >= 30 && !etat.morph) {
      for (let k = 1; k <= K; k++) {
        const n = etat.choix[k - 1];
        const e = texTerme(n);
        const neg = e.tex.startsWith('-');
        const tex = neg ? e.tex : '+' + e.tex;
        const ym = (Y(tv[k - 1]) + Y(tv[k])) / 2;
        if (Math.abs(Y(tv[k - 1]) - Y(tv[k])) < 16) continue;
        const et = etiquette(X(k) + 4, ym, katexHTML(tex, false), neg ? 'neg' : 'pos', {});
        if (k === K) largeurDerniere = et.offsetWidth;
      }
    }

    // ---------- écart entre t_K et s (comme la flèche « écart » de la diapositive)
    if (K && d && d.s !== null && Number.isFinite(d.s)) {
      const xe = Math.min(X(K) + Math.max(16, largeurDerniere + 12), x1 - 2), ya = Y(tv[K]), yb = Y(d.s);
      if (Math.abs(ya - yb) > 30 && d.s >= v.ymin && d.s <= v.ymax) {
        const dir = yb < ya ? -1 : 1;
        elt('path', { d: 'M' + r2(xe) + ' ' + r2(ya + dir * 5) + 'V' + r2(yb - dir * 5), stroke: C.rouge, 'stroke-width': 1.2, fill: 'none' }, svg);
        elt('path', { d: pointe(xe, yb, dir, 6) + pointe(xe, ya, -dir, 6), fill: C.rouge }, svg);
        etiquette(xe + 5, (ya + yb) / 2, t('ecart'), 'ecart-texte', {});
      }
    }

    // ---------- aperçu du prochain pas (survol), dans sa propre couche
    elt('g', { id: 'couche-survol' }, svg);
    dessinerSurvol();

    // ---------- surimpressions
    el.invite.hidden = K > 0 || etat.lecture.active;
    majHUD();
  }

  function dessinerPasNeuf(svg, K, tv, signes, X, Y) {
    const x = X(K), ya = Y(tv[K - 1]), yb = Y(tv[K]);
    if (etat.neufK !== K) { etat.neufK = K; etat.neufDebut = performance.now(); }
    const ecoule = performance.now() - etat.neufDebut;
    const retard = (e, ms) => { e.style.animationDelay = (ms - ecoule).toFixed(0) + 'ms'; };
    const g = elt('g', { class: 'pas-neuf' }, svg);
    const pos = signes[K] > 0;
    const coul = pos ? C.vert : C.rouge;
    if (K > 1) elt('path', { d: 'M' + r2(X(K - 1)) + ' ' + r2(ya) + 'H' + r2(x), stroke: C.grisMoyen, 'stroke-width': 1, 'stroke-dasharray': '1.6 2.2', fill: 'none' }, g);
    const ad = Math.abs(yb - ya);
    if (ad > 5) {
      const L = Math.min(STYLE_REARR.tete, 0.5 * ad);
      const dir = yb < ya ? -1 : 1;
      const long = Math.max(1, ad - 0.62 * L);
      const tige = elt('path', { d: 'M' + r2(x) + ' ' + r2(ya) + 'V' + r2(yb - dir * 0.62 * L), stroke: coul, 'stroke-width': STYLE_REARR.ep, fill: 'none', class: 'tige' }, g);
      tige.style.setProperty('--long', long.toFixed(1));
      retard(tige, 0);
      retard(elt('path', { d: pointe(x, yb, dir, L), fill: coul, class: 'tete' }, g), 220);
    } else if (ad > 0.3) {
      elt('path', { d: 'M' + r2(x) + ' ' + r2(ya) + 'V' + r2(yb), stroke: coul, 'stroke-width': 1.2, fill: 'none' }, g);
    }
    retard(elt('circle', { cx: r2(x), cy: r2(yb), r: STYLE_REARR.rayon, fill: C.or, stroke: C.orFonce, 'stroke-width': 1.2, class: 'point' }, g), 200);
    if (ecoule > 800) etat.neuf = 0;
  }

  // Le terme qu'ajouterait un clic à la position du pointeur
  function candidatSurvol() {
    const s = etat.survol;
    if (!s || etat.glisseCible || etat.lecture.active || glisse.actif) return null;
    const R = etat.repereX;
    if (!R || s.x < R.x0 - 4 || s.x > R.x1 + 2 || s.y < R.y0 - 20 || s.y > R.y1 + 4) return null;
    if (pointProche(s.x, s.y)) return null;
    const K = etat.choix.length;
    const yK = R.Y(etat.t[K]);
    const signe = s.y < yK ? 1 : -1;
    let n;
    try { n = etat.serie.prochain(signe, estUtilise); } catch (_) { return null; }
    if (n === null) return null;
    return { n, signe };
  }
  function dessinerSurvol() {
    const svg = el.graphe.querySelector('#couche-survol');
    const R = etat.repereX;
    if (!svg || !R) return;
    svg.innerHTML = '';
    if (etat.survolPoint) { montrerBulleTerme(etat.survolPoint.k); return; }
    dessinerApercu(svg, R.X, R.Y, etat.t);
  }
  function dessinerApercu(svg, X, Y, tv) {
    const cand = candidatSurvol();
    if (!cand) { el.bulle.hidden = true; return; }
    const K = etat.choix.length;
    const v = etat.serie.valeur(cand.n);
    const ya = Y(tv[K]), yb = Y(tv[K] + v), x = X(K + 1);
    const coul = cand.signe > 0 ? C.vert : C.rouge;
    const g = elt('g', { opacity: 0.75 }, svg);
    if (K > 0) elt('path', { d: 'M' + r2(X(K)) + ' ' + r2(ya) + 'H' + r2(x), stroke: C.grisMoyen, 'stroke-width': 1, 'stroke-dasharray': '1.6 2.2', fill: 'none' }, g);
    const ad = Math.abs(yb - ya);
    if (ad > 5) {
      const L = Math.min(8, 0.5 * ad), dir = yb < ya ? -1 : 1;
      elt('path', { d: 'M' + r2(x) + ' ' + r2(ya) + 'V' + r2(yb - dir * 0.62 * L), stroke: coul, 'stroke-width': 1.8, 'stroke-dasharray': '4 3', fill: 'none' }, g);
      elt('path', { d: pointe(x, yb, dir, L), fill: coul }, g);
    }
    elt('circle', { cx: r2(x), cy: r2(yb), r: 3.8, fill: '#fff', stroke: C.orFonce, 'stroke-width': 1.2, 'stroke-dasharray': '2 1.5' }, g);
    const e = texTerme(cand.n);
    const html = '<b class="' + (cand.signe > 0 ? 'positif' : 'negatif') + '">' + t(cand.signe > 0 ? 'apercuPos' : 'apercuNeg') + '</b><br>' +
      katexHTML('y_{' + (K + 1) + '} = x_{' + cand.n + '} = ' + e.tex, false) + '<br><span class="petit">' + t('apercuClic') + '</span>';
    montrerBulle(x + 14, (ya + yb) / 2, html, cand.signe > 0 ? 'pos' : 'neg');
  }

  // Point (du réarrangement) sous le pointeur ?
  function pointProche(px, py) {
    const R = etat.repereX;
    if (!R) return null;
    const K = etat.choix.length;
    const v = etat.vue;
    const kx = Math.round((px - R.x0) / (R.x1 - R.x0) * v.xmax);
    for (const k of [kx - 1, kx, kx + 1]) {
      if (k < 1 || k > K) continue;
      if (Math.hypot(R.X(k) - px, R.Y(etat.t[k]) - py) < 9) return { k, type: 'rearr' };
    }
    return null;
  }

  function montrerBulle(x, y, html, classe) {
    const b = el.bulle;
    b.innerHTML = html;
    b.className = 'bulle ' + (classe || '');
    b.hidden = false;
    const W = etat.taille.W;
    const w = b.offsetWidth, h = b.offsetHeight;
    let bx = x, by = y - h / 2;
    if (bx + w > W - 8) bx = x - w - 28;
    by = clamp(by, 6, etat.taille.H - h - 6);
    b.style.left = bx + 'px';
    b.style.top = by + 'px';
  }
  function bulleTemporaire(html) {
    montrerBulle(etat.taille.W / 2 - 160, 60, html, '');
    clearTimeout(bulleTemporaire.m);
    bulleTemporaire.m = setTimeout(() => { el.bulle.hidden = true; }, 2600);
  }

  function etiquette(x, y, html, classe, o) {
    const d = document.createElement('div');
    d.className = 'etiq ' + classe;
    d.innerHTML = html;
    d.style.left = x + 'px';
    d.style.top = y + 'px';
    if (o.droite) d.style.transform = 'translate(-100%, -50%)';
    if (o.centre) d.style.transform = 'translate(-50%, -50%)';
    el.etiquettes.appendChild(d);
    return d;
  }

  function majHUD() {
    const K = etat.choix.length;
    el.hudK.textContent = K;
    el.hudKMot.textContent = t(K >= 2 ? 'termesChoisis' : 'termeChoisi');
    el.hudT.innerHTML = katexHTML(K ? 't_{' + K + '} \\approx ' + fmtTex(etat.t[K], 4) : 't_0 = 0', false);
  }

  // Interactions avec le graphe
  function posSouris(ev) {
    const r = el.graphe.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }
  function surLigneCible(p) {
    const R = etat.repereX;
    if (!R) return false;
    const yc = R.Y(etat.c);
    return Math.abs(p.y - yc) < 9 && p.x > R.x0 - 4 && p.x < R.x1 + 16;
  }
  function grapheDown(ev) {
    const p = posSouris(ev);
    el.graphe.setPointerCapture(ev.pointerId);
    if (surLigneCible(p)) {
      etat.glisseCible = true;
      el.graphe.classList.add('glisse-cible');
      el.bulle.hidden = true;
      dessiner();
      return;
    }
    grapheDown.depart = p;
  }
  function grapheMove(ev) {
    const p = posSouris(ev);
    if (etat.glisseCible) {
      const R = etat.repereX, v = etat.vue;
      const c = v.ymin + (R.y1 - p.y) / (R.y1 - R.y0) * (v.ymax - v.ymin);
      changerCible(Math.round(c * 100) / 100, 'graphe');
      return;
    }
    etat.survol = p;
    el.graphe.classList.toggle('sur-cible', surLigneCible(p));
    etat.survolPoint = pointProche(p.x, p.y);
    dessinerSurvol();
  }
  function montrerBulleTerme(k) {
    const R = etat.repereX;
    const n = etat.choix[k - 1];
    const e = texTerme(n);
    let somme;
    const ex = etat.tExact && etat.tExact[k];
    if (ex && S.nbBits(ex.d) < 40) somme = S.texFraction(ex).replace(/^/, S.qSigne(ex) < 0 ? '-' : '') + ' \\approx ' + fmtTex(etat.t[k], 4);
    else somme = '\\approx ' + fmtTex(etat.t[k], 4);
    let sd = '';
    try { sd = '<br><span class="petit">' + t('serieDepart') + ' : </span>' + katexHTML('s_{' + k + '} \\approx ' + fmtTex(sommeDepart(k), 4), false); } catch (_) { /* rien */ }
    const html = katexHTML('y_{' + k + '} = x_{' + n + '} = ' + e.tex, false) + '<br>' + katexHTML('t_{' + k + '} ' + (somme.startsWith('\\approx') ? '' : '= ') + somme, false) + sd;
    montrerBulle(R.X(k) + 12, R.Y(etat.t[k]), html, etat.serie.valeur(n) > 0 ? 'pos' : 'neg');
  }
  function grapheUp(ev) {
    if (etat.glisseCible) {
      etat.glisseCible = false;
      el.graphe.classList.remove('glisse-cible');
      dessiner();
      return;
    }
    const d = grapheDown.depart;
    grapheDown.depart = null;
    if (!d) return;
    const p = posSouris(ev);
    if (Math.hypot(p.x - d.x, p.y - d.y) > 8) return;
    const pp = pointProche(p.x, p.y);
    if (pp) { reperer(pp.k - 1); return; }
    etat.survol = p;
    const cand = candidatSurvol();
    if (cand) {
      arreterLecture();
      if (ajouter(cand.n)) defilerVersJeton(cand.n);
      // le prochain aperçu suit le pointeur
      etat.survol = ev.pointerType === 'mouse' ? p : null;
      dessiner();
    }
  }
  function grapheLeave() {
    if (etat.glisseCible) return;
    etat.survol = null;
    etat.survolPoint = null;
    el.bulle.hidden = true;
    dessinerSurvol();
  }

  // ===========================================================================
  //  Panneau des valeurs
  // ===========================================================================
  function majValeurs() {
    const K = etat.choix.length;
    const d = etat.diag;
    const lignes = [];
    lignes.push([t('dK'), String(K)]);
    let tt;
    const ex = etat.tExact && etat.tExact.length === K + 1 ? etat.tExact[K] : null;
    if (ex && S.nbBits(ex.d) < 64 && K > 0) tt = katexHTML('t_{' + K + '} = ' + (S.qSigne(ex) < 0 ? '-' : '') + S.texFraction(ex) + ' \\approx ' + fmtTex(etat.t[K], 4), false);
    else tt = katexHTML('t_{' + K + '} \\approx ' + fmtTex(etat.t[K], 4), false);
    lignes.push([t('dT'), tt, 'accent']);
    let sK = null;
    try { sK = sommeDepart(K); } catch (_) { /* rien */ }
    if (sK !== null) lignes.push([t('dS'), katexHTML('s_{' + K + '} \\approx ' + fmtTex(sK, 4), false)]);
    if (d.s !== null) {
      lignes.push([t('dVal'), katexHTML('s \\approx ' + fmtTex(d.s, 4), false)]);
      if (K) lignes.push([t('dEcart'), katexHTML('t_{' + K + '} - s \\approx ' + fmtTex(etat.t[K] - d.s, 4), false)]);
    }
    lignes.push([t('dCible'), katexHTML('t_{' + K + '} - c \\approx ' + fmtTex(etat.t[K] - etat.c, 4), false)]);
    if (etat.motif && etat.harmonique) {
      const v = Math.log(2) + 0.5 * Math.log(etat.motif.p / etat.motif.q);
      lignes.push([t('dMotif'), katexHTML('\\log 2 + \\tfrac{1}{2} \\log \\tfrac{' + etat.motif.p + '}{' + etat.motif.q + '} \\approx ' + fmtTex(v, 4), false)]);
    }
    el.valeurs.innerHTML = lignes.map(([dt, dd, c]) => '<dt>' + dt + '</dt><dd' + (c ? ' class="' + c + '"' : '') + '>' + dd + '</dd>').join('');
  }

  function majBoutons() {
    const K = etat.choix.length;
    el.btnAnnuler.disabled = K === 0;
    el.btnRecommencer.disabled = K === 0;
  }

  function majTout(opts) {
    const o = opts || {};
    const cible = vueCible(false);
    const anime = (o.sansAnimation || o.sansAnimationVue) ? (etat.vue = cible, false) : animerVue(cible);
    if (!anime) dessiner();
    majValeurs();
    majBoutons();
  }

  // ===========================================================================
  //  Adresse (partage) et annonces
  // ===========================================================================
  function adresse() {
    const q = new URLSearchParams();
    q.set('lang', etat.langue);
    if (etat.src !== SERIE_DEFAUT) q.set('x', etat.src);
    if (etat.choix.length) q.set('f', etat.choix.slice(0, 400).join(','));
    if (Math.abs(etat.c - 1.5) > 1e-12) q.set('c', String(etat.c));
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
  // Dans une page de mathopo.ca, le lien est celui de la page (rearrangements.html?x=…&f=…&c=…),
  // qui passe ces paramètres à l'application ; sinon, celui de l'application.
  function lienAPartager() {
    if (INTEGRE && window.parent !== window) {
      try {
        const q = new URL(adresse(), location.href).searchParams;
        q.delete('lang'); q.delete('test');
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
      bulleTemporaire(t('lienEchec'));
    }
  }
  function annoncer(texte) {
    clearTimeout(annoncer.m);
    annoncer.m = setTimeout(() => { el.annonce.textContent = texte; }, 120);
  }

  // ===========================================================================
  //  Événements
  // ===========================================================================
  function brancher() {
    el.btnPlus.addEventListener('click', () => { arreterLecture(); ajouterProchain(1); });
    el.btnMoins.addEventListener('click', () => { arreterLecture(); ajouterProchain(-1); });
    el.btnOrdre.addEventListener('click', () => { arreterLecture(); ajouterDansOrdre(); });
    el.btnAnnuler.addEventListener('click', annuler);
    el.btnRecommencer.addEventListener('click', recommencer);
    el.btnLien.addEventListener('click', copierLien);
    el.btnMotif.addEventListener('click', appliquerMotif);
    el.btnPas.addEventListener('click', () => { arreterLecture(); pasRiemann(false); });
    el.btnLecture.addEventListener('click', basculerLecture);
    el.btnCent.addEventListener('click', centTermes);
    el.champVitesse.addEventListener('input', () => { etat.lecture.vitesse = +el.champVitesse.value; majVitesse(); });
    el.curseurC.addEventListener('input', () => changerCible(+el.curseurC.value, 'curseur'));
    el.champC.addEventListener('change', () => {
      const v = parseFloat(el.champC.value.replace(',', '.').replace('−', '-'));
      if (Number.isFinite(v)) changerCible(v, 'champ'); else el.champC.value = fmt(etat.c, 2).replace('−', '-');
    });
    el.champC.addEventListener('keydown', (e) => { if (e.key === 'Enter') el.champC.blur(); });

    // terme général : analyse en direct
    let minut = null;
    el.champTerme.addEventListener('input', () => {
      clearTimeout(minut);
      minut = setTimeout(() => {
        const src = el.champTerme.value;
        try {
          S.analyser(src);
        } catch (e) { montrerErreurTerme(e); return; }
        if (src.trim() !== etat.src) chargerSerie(src.trim());
        else cacherErreurTerme();
      }, 350);
    });
    el.champTerme.addEventListener('keydown', (e) => { if (e.key === 'Enter') { clearTimeout(minut); const s = el.champTerme.value.trim(); if (s !== etat.src) chargerSerie(s); el.champTerme.blur(); } });

    [el.banquePos, el.banqueNeg, el.banqueNul].forEach((b) => b.addEventListener('click', clicBanque));
    el.jetonsRearr.addEventListener('pointerdown', bandeDown);
    el.jetonsRearr.addEventListener('pointermove', bandeMove);
    el.jetonsRearr.addEventListener('pointerup', bandeUp);
    el.jetonsRearr.addEventListener('pointercancel', bandeCancel);
    el.jetonsRearr.addEventListener('click', (e) => {
      const b = e.target.closest('.retirer');
      if (b) { const p = b.closest('.jeton'); arreterLecture(); retirerA(+p.dataset.k); }
    });
    el.jetonsRearr.addEventListener('keydown', (e) => {
      const p = e.target.closest('.jeton');
      if (!p) return;
      const k = +p.dataset.k;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); retirerA(k); }
      else if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault(); e.stopPropagation();
        const vers = e.key === 'ArrowLeft' ? k - 1 : k + 1;
        if (vers >= 0 && vers < etat.choix.length) {
          deplacer(k, vers);
          const q = el.jetonsRearr.querySelector('.jeton[data-k="' + vers + '"]');
          if (q) q.focus();
        }
      }
    });

    el.graphe.addEventListener('pointerdown', grapheDown);
    el.graphe.addEventListener('pointermove', grapheMove);
    el.graphe.addEventListener('pointerup', grapheUp);
    el.graphe.addEventListener('pointerleave', grapheLeave);
    el.graphe.addEventListener('pointercancel', () => { etat.glisseCible = false; grapheDown.depart = null; });

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
      if (cible && (cible.tagName === 'INPUT' || cible.tagName === 'TEXTAREA' || cible.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); annuler(); }
        return;
      }
      if (e.altKey) return;
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); arreterLecture(); ajouterProchain(1); break;
        case 'ArrowDown': e.preventDefault(); arreterLecture(); ajouterProchain(-1); break;
        case 'ArrowRight': e.preventDefault(); arreterLecture(); ajouterDansOrdre(); break;
        case 'Backspace': case 'u': case 'U': e.preventDefault(); annuler(); break;
        case 'r': case 'R': recommencer(); break;
        case ' ': e.preventDefault(); arreterLecture(); pasRiemann(false); break;
        case 'Enter': if (cible && cible.tagName === 'BUTTON') return; e.preventDefault(); basculerLecture(); break;
        case 'Escape': arreterLecture(); break;
        case '?': ouvrirAide(); break;
        case 'p': case 'P': basculerPanneau(); break;
        default: break;
      }
    });

    if (window.ResizeObserver) new ResizeObserver(redimensionner).observe(el.grapheConteneur);
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
    const r = el.grapheConteneur.getBoundingClientRect();
    etat.taille = { W: Math.max(200, Math.round(r.width)), H: Math.max(160, Math.round(r.height)) };
    if (etat.serie) dessiner();
  }

  // ===========================================================================
  //  Démarrage
  // ===========================================================================
  const params = new URLSearchParams(location.search);
  capturerFrancais();
  etat.langue = params.get('lang') === 'en' ? 'en' : 'fr';
  const c0 = parseFloat(params.get('c'));
  if (Number.isFinite(c0)) etat.c = clamp(c0, -1e6, 1e6);
  el.curseurC.value = clamp(etat.c, -3, 3);
  construireExemples();
  brancher();
  redimensionner();
  appliquerLangue(etat.langue);
  const x0 = params.get('x');
  const f0 = (params.get('f') || '').split(',').map((s) => parseInt(s, 10)).filter((n) => Number.isInteger(n) && n >= 1);
  el.champTerme.value = x0 || SERIE_DEFAUT;
  if (!chargerSerie(x0 || SERIE_DEFAUT, { choix: f0 })) {
    el.champTerme.value = SERIE_DEFAUT;
    chargerSerie(SERIE_DEFAUT, { choix: f0 });
  }

  // Accès pour les tests automatisés (Playwright) et la console.
  window.__rearr = {
    etat, chargerSerie, ajouter, ajouterProchain, ajouterDansOrdre, annuler, recommencer, deplacer, retirerA,
    pasRiemann, centTermes, appliquerMotif, changerCible, changerLangue, dessiner,
    finirAnim: () => { etat.anim = null; etat.morph = null; etat.neuf = 0; if (etat.anim === null) dessiner(); },
  };

  // ===========================================================================
  //  Tests automatiques (index.html?test=1)
  // ===========================================================================
  if (MODE_TEST) {
    const sortie = [];
    let ok = 0, ko = 0;
    const verifier = (cond, nom) => { if (cond) ok++; else { ko++; sortie.push('ÉCHEC : ' + nom); } };
    const proche = (a, b, eps) => Math.abs(a - b) <= (eps || 1e-9);
    try {
      // analyse et LaTeX
      verifier(S.texGeneral(S.analyser('(-1)^(n+1)/n')) === '\\frac{\\left(-1\\right)^{n + 1}}{n}', 'LaTeX du terme général');
      verifier(S.termeExact(S.analyser('(-1)^(n+1)/n'), 4).tex === '-\\frac{1}{4}', 'x_4 = -1/4');
      verifier(S.termeExact(S.analyser('1/sqrt(n)'), 8).tex === '\\frac{1}{2\\sqrt{2}}', '1/√8 = 1/(2√2)');
      verifier(S.termeExact(S.analyser('cos(n*pi/3)/n'), 2).tex === '-\\frac{1}{4}', 'cos(2π/3)/2 = -1/4');
      verifier(S.termeExact(S.analyser('sin(n)/n'), 2).tex === '\\frac{\\sin 2}{2}', 'sin 2 / 2');
      let err = '';
      try { S.analyser('sin n'); } catch (e) { err = e.code; }
      verifier(err === 'fonctionParenthese', 'erreur : sin sans parenthèses');
      // diagnostic
      verifier(S.diagnostiquer(S.compiler(S.analyser('(-1)^(n+1)/n'))).classe === 'conditionnelle', 'harmonique alternée : conditionnelle');
      verifier(S.diagnostiquer(S.compiler(S.analyser('(-1)^(n+1)/n^2'))).classe === 'absolue', '1/n² alternée : absolue');
      verifier(S.diagnostiquer(S.compiler(S.analyser('1/n'))).classe === 'divergente', '1/n : divergente');
      verifier(S.diagnostiquer(S.compiler(S.analyser('(-1)^n'))).classe === 'grossiere', '(-1)^n : grossière');
      // procédé de Riemann avec c = s/2 : le réarrangement + − − des notes de cours
      chargerSerie('(-1)^(n+1)/n');
      changerCible(Math.log(2) / 2, 'champ');
      for (let i = 0; i < 30; i++) pasRiemann(true);
      verifier(etat.choix.slice(0, 9).join(',') === '1,2,4,3,6,8,5,10,12', 'Riemann c = s/2 : f = 1,2,4,3,6,8,5,10,12');
      verifier(etat.tExact.length > 12 && S.texFraction(etat.tExact[12]) === '\\frac{533}{1680}', 't_12 = s_8/2 = 533/1680 (exact)');
      // annuler, déplacer, retirer : sommes cohérentes
      const somme = () => etat.choix.reduce((a, n) => a + etat.serie.valeur(n), 0);
      annuler();
      verifier(etat.choix.length === 29 && proche(etat.t[29], somme()), 'annuler');
      deplacer(0, 5);
      verifier(etat.choix[5] === 1 && proche(etat.t[29], somme()), 'déplacer');
      retirerA(3);
      verifier(etat.choix.length === 28 && proche(etat.t[28], somme()), 'retirer');
      // motif 1 positif, 2 négatifs
      recommencer();
      el.motifP.value = 1; el.motifQ.value = 2;
      appliquerMotif();
      verifier(etat.choix.length === 60 && etat.choix.slice(0, 6).join(',') === '1,2,4,3,6,8', 'motif 1+, 2−');
      verifier(proche(etat.t[60], Math.log(2) / 2, 0.02), 'motif 1+, 2− : t_60 ≈ s/2');
      // série absolument convergente : le procédé ne peut pas atteindre c = 2
      chargerSerie('(-1)^(n+1)/n^2');
      changerCible(2, 'champ');
      for (let i = 0; i < 400; i++) pasRiemann(true);
      verifier(etat.t[etat.choix.length] < 1.24 && !el.noteRiemann.hidden, 'absolue : c = 2 hors d’atteinte, note affichée');
      // adresse : aller-retour
      chargerSerie('sin(n)/n', { choix: [3, 1, 2] });
      verifier(etat.choix.join(',') === '3,1,2' && /f=3%2C1%2C2|f=3,1,2/.test(adresse()), 'adresse avec f');
      changerLangue('en');
      verifier(el.btnLangue.textContent === 'FR' && /Rearranging/.test(document.title), 'langue anglaise');
      changerLangue('fr');
      recommencer();
      chargerSerie(SERIE_DEFAUT);
      changerCible(1.5, 'champ');
    } catch (e) {
      ko++;
      sortie.push('EXCEPTION : ' + e.message + '\n' + e.stack);
    }
    const pre = document.getElementById('tests') || document.body.appendChild(Object.assign(document.createElement('pre'), { id: 'tests' }));
    pre.textContent = 'Tests : ' + ok + ' réussis, ' + ko + ' échoués\n' + sortie.join('\n');
    window.__resultatTests = { ok, ko, sortie };
  }
})();
