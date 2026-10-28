// =============================================================================
// Démonstration à remettre en ordre — section 2.3 : Théorème 2.6 (interversion de
// la limite et de la dérivée). Trois parties : le but, la convergence uniforme de
// (f_n) (critère de Cauchy uniforme + accroissements finis), la dérivabilité de f
// avec f' = g (argument en ε/3). Quatre étapes intruses (raisonnements circulaires
// ou résultats faux) sont mêlées aux étapes de la preuve.
//
// Format : voir README.md (type: 'ordre'). Chaque étape déclare les étapes qu'elle
// requiert ; tout ordre respectant ces dépendances est accepté. Les chaînes
// acceptent du HTML et des formules $...$ / $$...$$ (KaTeX) ; String.raw évite de
// doubler les barres obliques inverses.
// =============================================================================
(function () {
  const r = String.raw;

  PreuvesATrous.enregistrer({
    id: 'theoreme-2-6-derivation',
    type: 'ordre',
    titre: r`Théorème 2.6 — interversion de la limite et de la dérivée : la démonstration à remettre en ordre`,
    titreCourt: 'Théorème 2.6 (section 2.3)',
    sousTitre: 'MPU1054 · Analyse à une variable réelle II · Section 2.3',
    solutionApres: 3,
    // Les trois diapositives de la démonstration (handout professeur), recadrées par
    // extraire-preuve.py et réunies par pdfunite (voir README.md, « Corrigés recadrés »).
    corrige: { pdf: 'corriges/theoreme-2-6-demonstration.pdf' },

    consignes: r`<p>La démonstration du théorème est découpée en <strong>trois parties</strong> : le but, la convergence uniforme de $(f_n)$ et la dérivabilité de $f$. Dans chaque partie, les étapes sont présentées <strong>dans le désordre</strong> : remettez-les en ordre en glissant les cartes (poignée ⋮⋮), ou en touchant une carte puis l'endroit où la placer (les boutons ▲ ▼ servent aussi).</p>
<p><strong>Quatre étapes intruses</strong> se sont glissées dans la liste : des affirmations fausses ou des raisonnements circulaires. Envoyez-les dans « Étapes écartées » avec le bouton ⊘. Appuyez ensuite sur <strong>Vérifier</strong> : chaque carte mal placée reçoit l'explication de ce qui lui manque. Plusieurs ordres sont possibles, pourvu que chaque étape n'utilise que ce qui la précède.</p>
<p>Une fois la démonstration en ordre, imprimez-la (ou faites une capture d'écran) et collez-la dans l'espace prévu sous le théorème dans le cahier.</p>`,

    enonce: {
      titre: 'Théorème 2.6 (Interversion de la limite et de la dérivée)',
      html: r`<p>Soient $J \subseteq \mathbb{R}$ un intervalle borné (non réduit à un point) et $(f_n)$ une suite de fonctions dérivables sur $J$ (dérivées latérales aux extrémités appartenant à $J$). On suppose que :</p>
<ol class="alpha">
<li><span class="lettre">(i)</span> il existe $x_0 \in J$ tel que la suite numérique $(f_n(x_0))$ converge ;</li>
<li><span class="lettre">(ii)</span> la suite des dérivées $(f_n')$ converge uniformément sur $J$ vers une fonction $g : J \to \mathbb{R}$.</li>
</ol>
<p>Alors $(f_n)$ converge uniformément sur $J$ vers une fonction $f : J \to \mathbb{R}$, la fonction $f$ est dérivable sur $J$ et $f' = g$. Autrement dit, $\big(\lim_{n \to \infty} f_n\big)' = \lim_{n \to \infty} f_n'$.</p>
<p><em>Idée de la démonstration.</em> Le théorème des accroissements finis appliqué à $f_m - f_n$ transforme le contrôle uniforme de $f_m' - f_n'$ en un contrôle uniforme de $f_m - f_n$, puis des taux d'accroissement de $f_m - f_n$.</p>`,
    },

    rappels: [
      {
        titre: 'Critère de Cauchy uniforme (Théorème 2.3)',
        html: r`<p>$(f_n)$ converge uniformément sur $A$ vers une certaine fonction si et seulement si elle est uniformément de Cauchy sur $A$ : pour tout $\varepsilon > 0$, il existe $N \in \mathbb{N}$ tel que $|f_m(x) - f_n(x)| < \varepsilon$ pour tous $m, n \geq N$ et tout $x \in A$. En particulier, une suite uniformément convergente est uniformément de Cauchy.</p>`,
      },
      {
        titre: 'Théorème des accroissements finis (MPU1045)',
        html: r`<p>Si $h$ est continue sur $[a, b]$ et dérivable sur $(a, b)$, il existe $\xi \in (a, b)$ tel que $h(b) - h(a) = h'(\xi)\,(b - a)$. Une fonction dérivable sur un intervalle y est continue.</p>`,
      },
      {
        titre: 'Dérivée en un point',
        html: r`<p>$f$ est dérivable en $c$, de dérivée $f'(c)$, si $\lim_{x \to c} \frac{f(x) - f(c)}{x - c} = f'(c)$ : pour tout $\varepsilon > 0$, il existe $\delta > 0$ tel que $\big| \frac{f(x) - f(c)}{x - c} - f'(c) \big| < \varepsilon$ dès que $x \in J$ et $0 < |x - c| < \delta$.</p>`,
      },
      {
        titre: 'Passage à la limite dans une inégalité (MPU1045)',
        html: r`<p>Si $a_m \to a$ et $a_m \leq K$ pour tout $m$, alors $a \leq K$ (une inégalité stricte devient large à la limite).</p>`,
      },
    ],

    noteOrdres: r`D'autres ordres sont acceptés lorsqu'ils respectent les dépendances : par exemple, « Soit $\varepsilon > 0$ » et le rappel des deux propriétés de Cauchy peuvent s'échanger, et le rang $N_2$ peut être choisi dès que $c$ et $\varepsilon$ sont fixés.`,

    // Parties, étapes (ordre canonique = ordre des notes) et intruses -----------
    parties: [
      {
        id: 'but',
        court: 'but',
        titre: 'But de la démonstration',
        etapes: [
          {
            id: 'but-cauchy',
            court: 'But (1)',
            texte: r`<strong>But (1).</strong> Montrer que $(f_n)$ est uniformément de Cauchy sur $J$ : par le critère de Cauchy uniforme, elle convergera alors uniformément sur $J$ vers une fonction $f : J \to \mathbb{R}$.`,
            requiert: [],
          },
          {
            id: 'but-derivee',
            court: 'But (2)',
            texte: r`<strong>But (2).</strong> Montrer qu'en tout point $c \in J$, le taux d'accroissement $\dfrac{f(x) - f(c)}{x - c}$ tend vers $g(c)$ lorsque $x \to c$ (argument en $\varepsilon/3$) : $f$ sera alors dérivable en $c$ avec $f'(c) = g(c)$.`,
            requiert: ['but-cauchy'],
            explications: { 'but-cauchy': r`Ce but parle de la fonction $f$, qui n'existe qu'une fois la convergence de $(f_n)$ établie.` },
          },
          {
            id: 'outil',
            court: 'Outil : accroissements finis',
            texte: r`<strong>Outil.</strong> Le théorème des accroissements finis, appliqué à $h := f_m - f_n$, transforme le contrôle uniforme de $f_m' - f_n'$ (hypothèse (ii)) en un contrôle uniforme de $f_m - f_n$, puis de leurs taux d'accroissement. On note $\ell > 0$ la longueur de $J$.`,
            requiert: [],
          },
        ],
        intrus: [
          {
            id: 'intrus-integrale',
            court: 'Intruse : formule intégrale',
            texte: r`<strong>But (0).</strong> Montrer d'abord que $(f_n)$ converge simplement sur $J$ en passant à la limite dans la formule $f_n(x) = f_n(x_0) + \displaystyle\int_{x_0}^{x} f_n'(t)\,dt$.`,
            pourquoi: r`Le théorème ne suppose pas $f_n'$ continue (ni même intégrable) : la formule $f_n(x) = f_n(x_0) + \int_{x_0}^x f_n'(t)\,dt$ n'est pas disponible. C'est le théorème des accroissements finis qui joue ce rôle.`,
          },
        ],
      },
      {
        id: 'conv',
        court: 'partie 1',
        titre: r`Partie 1 — Convergence uniforme de $(f_n)$`,
        etapes: [
          {
            id: 'eps1',
            court: r`Soit $\varepsilon > 0$`,
            texte: r`Soit $\varepsilon > 0$.`,
            requiert: [],
          },
          {
            id: 'cauchy-hyp',
            court: 'les deux propriétés de Cauchy',
            texte: r`La suite numérique $(f_n(x_0))$ converge, donc elle est de Cauchy ; et $(f_n')$ converge uniformément sur $J$, donc elle est uniformément de Cauchy sur $J$ (critère de Cauchy uniforme).`,
            requiert: [],
          },
          {
            id: 'rang-N',
            court: r`choix du rang $N$`,
            texte: r`Il existe donc $N \in \mathbb{N}$ tel que, pour tous $m, n \geq N$, $$|f_m(x_0) - f_n(x_0)| < \frac{\varepsilon}{2} \qquad\text{et}\qquad |f_m'(t) - f_n'(t)| < \frac{\varepsilon}{2\ell} \quad\text{pour tout } t \in J.$$`,
            requiert: ['eps1', 'cauchy-hyp'],
            explications: {
              'eps1': r`Le rang $N$ est choisi en fonction de $\varepsilon$ : il faut d'abord fixer $\varepsilon > 0$.`,
              'cauchy-hyp': r`L'existence de $N$ découle des deux propriétés de Cauchy, de $(f_n(x_0))$ et de $(f_n')$.`,
            },
          },
          {
            id: 'h-mn',
            court: r`$m, n \geq N$, $x \neq x_0$ et $h := f_m - f_n$`,
            texte: r`Soient $m, n \geq N$ et $x \in J$, $x \neq x_0$. La fonction $h := f_m - f_n$ est dérivable sur $J$, donc continue sur l'intervalle fermé d'extrémités $x_0$ et $x$ et dérivable en ses points intérieurs.`,
            requiert: ['rang-N'],
            explications: { 'rang-N': r`On prend $m, n \geq N$ : le rang $N$ doit avoir été défini.` },
          },
          {
            id: 'taf1',
            court: r`accroissements finis pour $h$`,
            texte: r`Par le théorème des accroissements finis, il existe $\xi$ strictement entre $x_0$ et $x$ tel que $h(x) - h(x_0) = h'(\xi)\,(x - x_0)$, c'est-à-dire $$\big(f_m(x) - f_n(x)\big) - \big(f_m(x_0) - f_n(x_0)\big) = \big(f_m'(\xi) - f_n'(\xi)\big)(x - x_0).$$`,
            requiert: ['h-mn'],
            explications: { 'h-mn': r`Le théorème des accroissements finis s'applique à $h = f_m - f_n$ sur l'intervalle d'extrémités $x_0$ et $x$ : il faut les avoir introduits et avoir vérifié ses hypothèses.` },
          },
          {
            id: 'majoration1',
            court: r`majoration de $|f_m(x) - f_n(x)|$ par $\varepsilon$`,
            texte: r`Par l'inégalité triangulaire et $|x - x_0| \leq \ell$, $$|f_m(x) - f_n(x)| \leq |f_m(x_0) - f_n(x_0)| + |f_m'(\xi) - f_n'(\xi)|\,|x - x_0| < \frac{\varepsilon}{2} + \frac{\varepsilon}{2\ell} \cdot \ell = \varepsilon.$$`,
            requiert: ['taf1', 'rang-N'],
            explications: {
              'taf1': r`Cette majoration utilise le point $\xi$ fourni par le théorème des accroissements finis.`,
              'rang-N': r`Les majorations par $\varepsilon/2$ et $\varepsilon/(2\ell)$ sont celles du choix de $N$.`,
            },
          },
          {
            id: 'cauchy-concl',
            court: r`$(f_n)$ uniformément de Cauchy`,
            texte: r`Cette inégalité vaut aussi pour $x = x_0$ (c'est le choix de $N$). Ainsi, $|f_m(x) - f_n(x)| < \varepsilon$ pour tous $m, n \geq N$ et tout $x \in J$ : la suite $(f_n)$ est uniformément de Cauchy sur $J$.`,
            requiert: ['majoration1'],
            explications: { 'majoration1': r`On conclut à partir de la majoration $|f_m(x) - f_n(x)| < \varepsilon$, qui doit être établie avant.` },
          },
          {
            id: 'conv-concl',
            court: r`$f_n \rightrightarrows f$ sur $J$`,
            texte: r`Par le critère de Cauchy uniforme, $(f_n)$ converge uniformément sur $J$ vers une fonction $f : J \to \mathbb{R}$.`,
            requiert: ['cauchy-concl'],
            explications: { 'cauchy-concl': r`Le critère de Cauchy uniforme s'applique une fois que l'on sait que $(f_n)$ est uniformément de Cauchy.` },
          },
        ],
        intrus: [
          {
            id: 'intrus-circulaire',
            court: 'Intruse : convergence supposée',
            texte: r`Comme $(f_n)$ converge uniformément sur $J$, elle est uniformément de Cauchy sur $J$ ; notons $f$ sa limite.`,
            pourquoi: r`Raisonnement circulaire : la convergence uniforme de $(f_n)$ est précisément ce qu'il faut démontrer. Le théorème ne suppose que la convergence de la suite numérique $(f_n(x_0))$, en un seul point.`,
          },
        ],
      },
      {
        id: 'der',
        court: 'partie 2',
        titre: r`Partie 2 — Dérivabilité de $f$ et $f' = g$`,
        etapes: [
          {
            id: 'fixer-c',
            court: r`fixer $c \in J$ et $\varepsilon > 0$`,
            texte: r`Fixons $c \in J$ et soit $\varepsilon > 0$.`,
            requiert: [],
          },
          {
            id: 'rang-N1',
            court: r`choix du rang $N_1$`,
            texte: r`Comme $(f_n')$ est uniformément de Cauchy sur $J$, il existe $N_1 \in \mathbb{N}$ tel que $|f_m'(t) - f_n'(t)| < \dfrac{\varepsilon}{3}$ pour tous $m, n \geq N_1$ et tout $t \in J$.`,
            requiert: ['fixer-c'],
            explications: { 'fixer-c': r`Le rang $N_1$ dépend de $\varepsilon$, qu'il faut avoir fixé.` },
          },
          {
            id: 'taf2',
            court: r`accroissements finis entre $c$ et $x$`,
            texte: r`Soient $x \in J$, $x \neq c$, et $m, n \geq N_1$. Le théorème des accroissements finis, appliqué à $f_m - f_n$ entre $c$ et $x$, fournit $\xi$ entre $c$ et $x$ tel que $$\big|\big(f_m(x) - f_m(c)\big) - \big(f_n(x) - f_n(c)\big)\big| = |f_m'(\xi) - f_n'(\xi)|\,|x - c| < \frac{\varepsilon}{3}\,|x - c|.$$`,
            requiert: ['rang-N1'],
            explications: { 'rang-N1': r`On prend $m, n \geq N_1$ pour majorer $|f_m'(\xi) - f_n'(\xi)|$ par $\varepsilon/3$ : le rang $N_1$ doit exister.` },
          },
          {
            id: 'limite-m',
            court: r`passage à la limite $m \to \infty$ : inégalité (1)`,
            texte: r`Faisons $m \to \infty$ (on a $f_m(x) \to f(x)$ et $f_m(c) \to f(c)$), puis divisons par $|x - c|$ : pour tout $n \geq N_1$ et tout $x \in J$, $x \neq c$, $$\Big|\frac{f(x) - f(c)}{x - c} - \frac{f_n(x) - f_n(c)}{x - c}\Big| \leq \frac{\varepsilon}{3}. \tag{1}$$`,
            requiert: ['taf2'],
            explications: { 'taf2': r`On passe à la limite $m \to \infty$ dans l'inégalité fournie par le théorème des accroissements finis.` },
          },
          {
            id: 'rang-N2',
            court: r`choix du rang $N_2$`,
            texte: r`Par l'hypothèse (ii), il existe $N_2 \in \mathbb{N}$ tel que $|f_n'(c) - g(c)| < \dfrac{\varepsilon}{3}$ pour tout $n \geq N_2$.`,
            requiert: ['fixer-c'],
            explications: { 'fixer-c': r`Le rang $N_2$ dépend de $\varepsilon$ et du point $c$ : il faut les avoir fixés.` },
          },
          {
            id: 'fixer-n',
            court: r`fixer $n := \max\{N_1, N_2\}$ : inégalité (2)`,
            texte: r`Fixons $n := \max\{N_1, N_2\}$. Comme $f_n$ est dérivable en $c$, il existe $\delta > 0$ tel que $$\Big|\frac{f_n(x) - f_n(c)}{x - c} - f_n'(c)\Big| < \frac{\varepsilon}{3} \quad\text{pour tout } x \in J \text{ avec } 0 < |x - c| < \delta. \tag{2}$$`,
            requiert: ['rang-N1', 'rang-N2'],
            explications: {
              'rang-N1': r`Le choix $n := \max\{N_1, N_2\}$ demande que $N_1$ soit déjà défini.`,
              'rang-N2': r`Le choix $n := \max\{N_1, N_2\}$ demande que $N_2$ soit déjà défini.`,
            },
          },
          {
            id: 'eps3',
            court: r`argument en $\varepsilon/3$`,
            texte: r`Pour un tel $x$, par l'inégalité triangulaire, (1), (2) et le choix de $N_2$, $$\Big|\frac{f(x) - f(c)}{x - c} - g(c)\Big| \leq \Big|\frac{f(x) - f(c)}{x - c} - \frac{f_n(x) - f_n(c)}{x - c}\Big| + \Big|\frac{f_n(x) - f_n(c)}{x - c} - f_n'(c)\Big| + |f_n'(c) - g(c)| < \frac{\varepsilon}{3} + \frac{\varepsilon}{3} + \frac{\varepsilon}{3} = \varepsilon.$$`,
            requiert: ['limite-m', 'fixer-n'],
            explications: {
              'limite-m': r`Le premier terme est majoré par l'inégalité (1), qui doit être établie avant.`,
              'fixer-n': r`Le deuxième terme est majoré par l'inégalité (2), et $n$ doit être fixé.`,
            },
          },
          {
            id: 'concl',
            court: r`conclusion : $f'(c) = g(c)$`,
            texte: r`Ainsi, $\lim_{x \to c} \dfrac{f(x) - f(c)}{x - c} = g(c)$ : la fonction $f$ est dérivable en $c$ (dérivée latérale si $c$ est une extrémité de $J$), avec $f'(c) = g(c)$. Le point $c \in J$ étant arbitraire, $f' = g$ sur $J$. <span class="fin">$\square$</span>`,
            requiert: ['eps3'],
            explications: { 'eps3': r`La conclusion découle de la majoration par $\varepsilon$ du taux d'accroissement.` },
          },
        ],
        intrus: [
          {
            id: 'intrus-derivees',
            court: r`Intruse : $f_n' \rightrightarrows f'$`,
            texte: r`Comme $f_n \rightrightarrows f$ sur $J$, on a aussi $f_n' \rightrightarrows f'$ sur $J$ ; par unicité de la limite, $f' = g$.`,
            pourquoi: r`Faux : la convergence uniforme de $(f_n)$ n'entraîne pas celle des dérivées — voir l'exemple a) de l'introduction, $\sqrt{x^2 + 1/n} \rightrightarrows |x|$, qui n'est même pas dérivable en $0$. C'est tout l'objet du théorème : il faut passer par les taux d'accroissement.`,
          },
          {
            id: 'intrus-taf-f',
            court: r`Intruse : accroissements finis pour $f$`,
            texte: r`Par le théorème des accroissements finis appliqué à $f$ entre $c$ et $x$, il existe $\xi$ entre $c$ et $x$ tel que $f(x) - f(c) = f'(\xi)\,(x - c)$.`,
            pourquoi: r`On ne sait pas encore que $f$ est dérivable : c'est ce que l'on cherche à démontrer. Le théorème des accroissements finis ne s'applique qu'aux fonctions $f_m - f_n$, dérivables par hypothèse.`,
          },
        ],
      },
    ],
  });
})();
