// =============================================================================
// Exemple à trous — section 2.1 : f_n(x) = x^n sur [0, 1].
// (a) Limite simple (deux cas), (b) la limite n'est pas continue,
// (c) le rang N(ε, x) dépend de x et explose lorsque x → 1⁻ (diapositive
// « Pourquoi la convergence simple ne suffit-elle pas ? »).
//
// Format : voir README.md. Les chaînes acceptent du HTML et des formules $...$
// (LaTeX rendu par KaTeX). String.raw évite de doubler les barres obliques inverses.
// =============================================================================
(function () {
  const r = String.raw;

  PreuvesATrous.enregistrer({
    id: 'exemple-2-1-puissances',
    titre: r`Exemple — $f_n(x) = x^n$ sur $[0, 1]$ : la convergence simple ne conserve pas la continuité`,
    titreCourt: 'Exemple xⁿ (section 2.1)',
    sousTitre: 'MPU1054 · Analyse à une variable réelle II · Section 2.1',
    solutionApres: 3,
    // Corrigé : les deux « Solution. » du handout professeur (diapositives 5 et 6 de la
    // section 2.1) recadrées par extraire-preuve.py ; le PDF réunit les deux (une page
    // chacune), les PNG -ab et -c servent au collage séparé dans le cahier.
    corrige: { pdf: 'corriges/exemple-2-1-puissances-solution.pdf' },

    consignes: r`<p>Complétez la rédaction de l'exemple : touchez chaque blanc numéroté et choisissez l'option qui convient. Un même menu revient à plusieurs endroits et une même option peut servir plusieurs fois. Appuyez ensuite sur <strong>Vérifier</strong>.</p>
<p>Une fois la rédaction juste, imprimez-la (ou faites une capture d'écran) et collez-la dans les deux espaces « Solution » du cahier : la partie (a)–(b) sous l'exemple, la partie (c) sous « Pourquoi la convergence simple ne suffit-elle pas ? ».</p>`,

    enonce: {
      titre: 'Exemple',
      html: r`<p>Pour $n \in \mathbb{N}$ et $x \in [0, 1]$, posons $f_n(x) := x^n$.</p>
<ol class="alpha">
<li><span class="lettre">(a)</span> Montrer que $(f_n)$ converge simplement sur $[0, 1]$ et déterminer sa limite $f$.</li>
<li><span class="lettre">(b)</span> Chaque $f_n$ est continue sur $[0, 1]$. La limite $f$ l'est-elle ?</li>
<li><span class="lettre">(c)</span> Soient $0 < \varepsilon < 1$ et $0 < x < 1$. À partir de quel rang a-t-on $|f_n(x) - f(x)| < \varepsilon$ ? Que devient ce rang lorsque $x \to 1^-$ ?</li>
</ol>`,
    },

    rappels: [
      {
        titre: 'Définition 2.1 (Convergence simple)',
        html: r`<p>$(f_n)$ converge simplement vers $f$ sur $A$ si, pour tout $x \in A$, la suite numérique $(f_n(x))_{n \in \mathbb{N}}$ converge vers $f(x)$ : pour tout $x \in A$ et tout $\varepsilon > 0$, il existe $N \in \mathbb{N}$ tel que $|f_n(x) - f(x)| < \varepsilon$ pour tout $n \geq N$. Le rang $N = N(\varepsilon, x)$ peut dépendre de $x$.</p>`,
      },
      {
        titre: 'Suites géométriques (MPU1045)',
        html: r`<p>Pour $q \in \mathbb{R}$ : si $|q| < 1$, alors $q^n \to 0$ ; si $q = 1$, alors $q^n = 1$ pour tout $n$ ; si $q > 1$, alors $q^n \to +\infty$.</p>`,
      },
      {
        titre: 'Logarithme',
        html: r`<p>$\log$ est strictement croissant sur $(0, +\infty)$ et $\log 1 = 0$ : pour $0 < x < 1$, $\log x < 0$, et $\log x \to 0^-$ lorsque $x \to 1^-$. Diviser une inégalité par un nombre strictement négatif en renverse le sens.</p>`,
      },
    ],

    // Menus -------------------------------------------------------------------
    menus: {
      fixer: {
        libelle: 'ce que l\'on fixe',
        titre: 'Par quoi commence-t-on ?',
        options: [
          { id: 'x', texte: r`Soit $x \in [0, 1]$ fixé.` },
          { id: 'n', texte: r`Soit $n \in \mathbb{N}$ fixé.`,
            pourquoi: r`Pour la convergence simple, c'est le point $x$ que l'on fixe ; c'est $n$ qui tend vers l'infini. Fixer $n$ reviendrait à étudier une seule fonction $f_n$.` },
          { id: 'eps', texte: r`Soit $\varepsilon > 0$ fixé.`,
            pourquoi: r`Le $\varepsilon$ intervient dans la définition, mais la première étape est de fixer le point $x$ : la convergence simple est la convergence de la suite de nombres $(f_n(x))_n$, pour chaque $x$.` },
          { id: 'N', texte: r`Soit $N \in \mathbb{N}$ fixé.`,
            pourquoi: r`Le rang $N$ se détermine à la fin, en fonction de $\varepsilon$ et de $x$ ; on ne le fixe pas d'avance.` },
        ],
      },
      cas: {
        libelle: 'cas à distinguer',
        titre: 'Quels cas faut-il distinguer ?',
        options: [
          { id: 'deux', texte: r`deux cas : $0 \leq x < 1$ et $x = 1$` },
          { id: 'trois', texte: r`trois cas : $x = 0$, $0 < x < 1$ et $x = 1$` },
          { id: 'unSeul', texte: r`un seul cas : $0 \leq x \leq 1$`,
            pourquoi: r`La suite $(x^n)$ ne se comporte pas de la même façon partout : pour $x = 1$, elle vaut constamment $1$, alors que pour $0 \leq x < 1$ elle tend vers $0$.` },
          { id: 'zeroEtReste', texte: r`deux cas : $x = 0$ et $0 < x \leq 1$`,
            pourquoi: r`Le point qui se distingue est $x = 1$, pas $x = 0$ : pour $x = 0$, on a $0^n = 0 \to 0$, comme pour tout $x \in [0, 1)$. Et le cas « $0 < x \leq 1$ » mélange des points où $x^n \to 0$ et le point $x = 1$ où $x^n = 1$.` },
        ],
      },
      limite: {
        libelle: 'limite',
        titre: r`Quelle est la limite lorsque $n \to \infty$ ?`,
        options: [
          { id: 'zero', texte: r`$0$` },
          { id: 'un', texte: r`$1$` },
          { id: 'x', texte: r`$x$` },
          { id: 'infini', texte: r`$+\infty$` },
          { id: 'aucune', texte: r`la suite n'a pas de limite` },
        ],
      },
      justif: {
        libelle: 'justification',
        titre: r`Pourquoi $x^n \to 0$ lorsque $0 \leq x < 1$ ?`,
        options: [
          { id: 'geom', texte: r`suite géométrique de raison $x$ avec $|x| < 1$` },
          { id: 'majoration', texte: r`parce que $x^n \leq x$ pour tout $n$`,
            pourquoi: r`C'est vrai, mais une majoration par $x$ ne force pas la suite vers $0$ : la suite constante égale à $x$ vérifie aussi cette inégalité. Il faut l'argument de la suite géométrique de raison $|x| < 1$.` },
          { id: 'decroissante', texte: r`parce que la suite $(x^n)_n$ est décroissante` },
          { id: 'gendarmes', texte: r`par le théorème des gendarmes, puisque $0 \leq x^n \leq 1$`,
            pourquoi: r`L'encadrement $0 \leq x^n \leq 1$ ne se resserre pas autour d'une seule valeur : les gendarmes ne concluent rien ici. C'est la suite géométrique de raison $|x| < 1$ qui tend vers $0$.` },
        ],
      },
      fonctionLimite: {
        libelle: 'fonction limite',
        titre: r`Quelle est la limite simple $f$ ?`,
        options: [
          { id: 'saut', texte: r`$f(x) = 0$ si $0 \leq x < 1$, et $f(1) = 1$` },
          { id: 'nulle', texte: r`$f \equiv 0$ sur $[0, 1]$`,
            pourquoi: r`En $x = 1$, on a $f_n(1) = 1$ pour tout $n$, donc $f(1) = 1 \neq 0$.` },
          { id: 'une', texte: r`$f \equiv 1$ sur $[0, 1]$`,
            pourquoi: r`Pour $0 \leq x < 1$, on vient de voir que $x^n \to 0$ : la limite ne vaut $1$ qu'en $x = 1$.` },
          { id: 'identite', texte: r`$f(x) = x$`,
            pourquoi: r`$x^n$ ne tend pas vers $x$ (sauf en $0$ et en $1$) : pour $x = \tfrac{1}{2}$, par exemple, $(\tfrac{1}{2})^n \to 0 \neq \tfrac{1}{2}$.` },
          { id: 'deuxSauts', texte: r`$f(x) = 0$ si $0 < x < 1$, et $f(0) = f(1) = 1$`,
            pourquoi: r`En $x = 0$, on a $0^n = 0$ pour tout $n \geq 1$, donc $f(0) = 0$ : il n'y a rien de spécial en $0$.` },
        ],
      },
      continuite: {
        libelle: 'continuité',
        titre: r`Qu'en est-il de la limite $f$ ?`,
        options: [
          { id: 'pasEn1', texte: r`n'est pas continue en $1$` },
          { id: 'pasEn0', texte: r`n'est pas continue en $0$`,
            pourquoi: r`Près de $0$, la fonction $f$ est nulle, y compris en $0$ : elle y est continue. Le saut est en $x = 1$.` },
          { id: 'continue', texte: r`est continue sur $[0, 1]$`,
            pourquoi: r`Regardez le graphe de $f$ : elle vaut $0$ sur $[0, 1)$ et saute à $1$ au point $x = 1$.` },
          { id: 'pasDefinie', texte: r`n'est pas définie en $1$`,
            pourquoi: r`Elle est définie en $1$ : $f(1) = \lim_n f_n(1) = 1$.` },
        ],
      },
      raison: {
        libelle: 'justification',
        titre: r`Pourquoi ?`,
        options: [
          { id: 'limGauche', texte: r`$\lim_{x \to 1^-} f(x) = 0 \neq 1 = f(1)$` },
          { id: 'valeurs', texte: r`$f(1) = 1 \neq 0 = f(0)$`,
            pourquoi: r`Prendre deux valeurs différentes en deux points différents n'a rien d'anormal pour une fonction continue. La discontinuité se lit en comparant $f(1)$ à la limite de $f(x)$ lorsque $x \to 1^-$.` },
          { id: 'derivable', texte: r`$f$ n'est pas dérivable en $1$`,
            pourquoi: r`La dérivabilité n'est pas en cause ici ; d'ailleurs une fonction peut être continue sans être dérivable. Ce qui manque à $f$ en $1$, c'est la continuité.` },
          { id: 'fnPasContinues', texte: r`les $f_n$ ne sont pas continues en $1$`,
            pourquoi: r`Chaque $f_n(x) = x^n$ est polynomiale, donc continue sur tout $\mathbb{R}$. C'est la limite qui est discontinue, pas les $f_n$.` },
          { id: 'nonBornee', texte: r`$f$ n'est pas bornée`,
            pourquoi: r`$0 \leq f \leq 1$ sur $[0, 1]$ : $f$ est bornée.` },
        ],
      },
      moralite: {
        libelle: 'conclusion',
        titre: 'Que retenir ?',
        options: [
          { id: 'pasConservee', texte: r`la convergence simple ne conserve pas la continuité` },
          { id: 'conservee', texte: r`une limite simple de fonctions continues est toujours continue`,
            pourquoi: r`C'est précisément ce que l'exemple réfute : les $f_n$ sont continues et leur limite simple $f$ ne l'est pas.` },
          { id: 'pasConvergence', texte: r`$(f_n)$ ne converge pas sur $[0, 1]$`,
            pourquoi: r`Elle converge simplement sur $[0, 1]$ : on vient de le démontrer. C'est la continuité de la limite qui fait défaut.` },
          { id: 'continueNonDerivable', texte: r`la limite $f$ est continue mais pas dérivable`,
            pourquoi: r`La limite n'est pas continue en $1$ ; la dérivabilité n'est pas la question.` },
        ],
      },
      ecart: {
        libelle: 'écart',
        titre: r`Que vaut $|f_n(x) - f(x)|$ pour $0 < x < 1$ ?`,
        options: [
          { id: 'xn', texte: r`$x^n$` },
          { id: 'unMoinsXn', texte: r`$1 - x^n$`,
            pourquoi: r`Pour $0 < x < 1$, la limite vaut $f(x) = 0$, pas $1$ : l'écart est $|x^n - 0| = x^n$.` },
          { id: 'xnMoinsUn', texte: r`$x^n - 1$`,
            pourquoi: r`Pour $0 < x < 1$, $f(x) = 0$ ; de plus $x^n - 1 < 0$ ne peut pas être une valeur absolue.` },
          { id: 'x', texte: r`$x$`,
            pourquoi: r`$f_n(x) = x^n$, pas $x$ : l'écart à la limite $f(x) = 0$ est $x^n$.` },
        ],
      },
      signeLog: {
        libelle: 'signe',
        titre: r`Signe de $\log x$ pour $0 < x < 1$ ?`,
        options: [
          { id: 'neg', texte: r`$\log x < 0$` },
          { id: 'pos', texte: r`$\log x > 0$`,
            pourquoi: r`$\log$ est croissant et $\log 1 = 0$ : pour $0 < x < 1$, on a $\log x < \log 1 = 0$.` },
          { id: 'nul', texte: r`$\log x = 0$`,
            pourquoi: r`$\log x = 0$ seulement pour $x = 1$, qui est exclu ici.` },
        ],
      },
      rang: {
        libelle: 'condition sur n',
        titre: r`L'inégalité $x^n < \varepsilon$ équivaut à :`,
        options: [
          { id: 'bon', texte: r`$n > \log \varepsilon / \log x$` },
          { id: 'sensInverse', texte: r`$n < \log \varepsilon / \log x$`,
            pourquoi: r`On divise $n \log x < \log \varepsilon$ par $\log x$, qui est <em>strictement négatif</em> : le sens de l'inégalité se renverse. (Vérification : pour $x = \tfrac{1}{2}$ et $\varepsilon = \tfrac{1}{4}$, on a $\log \varepsilon / \log x = 2$, et $x^n < \varepsilon$ exige bien $n > 2$.)` },
          { id: 'fractionInversee', texte: r`$n > \log x / \log \varepsilon$`,
            pourquoi: r`La fraction est renversée : de $n \log x < \log \varepsilon$ on tire $n > \log \varepsilon / \log x$. (Pour $x = \tfrac{1}{2}$ et $\varepsilon = \tfrac{1}{4}$, votre borne vaudrait $\tfrac{1}{2}$ alors qu'il faut $n > 2$.)` },
          { id: 'difference', texte: r`$n > \log \varepsilon - \log x$`,
            pourquoi: r`$n \log x < \log \varepsilon$ se résout en divisant par $\log x$, pas en soustrayant.` },
          { id: 'unSurEps', texte: r`$n > 1 / \varepsilon$`,
            pourquoi: r`C'était le rang de l'exemple $f_n(x) = x/n$ sur $[0, 1]$. Ici, le rang dépend de $x$ : il vient de $x^n < \varepsilon$, donc du logarithme.` },
        ],
      },
      dependance: {
        libelle: 'dépendance',
        titre: r`De quoi dépend le plus petit rang qui convient ?`,
        options: [
          { id: 'epsEtX', texte: r`de $\varepsilon$ et de $x$` },
          { id: 'epsSeul', texte: r`de $\varepsilon$ seulement`,
            pourquoi: r`La borne $\log \varepsilon / \log x$ contient $x$ : à $\varepsilon$ fixé, le rang change avec le point $x$ considéré (il est d'autant plus grand que $x$ est proche de $1$).` },
          { id: 'xSeul', texte: r`de $x$ seulement`,
            pourquoi: r`La borne $\log \varepsilon / \log x$ contient aussi $\varepsilon$ : plus $\varepsilon$ est petit, plus le rang est grand.` },
          { id: 'aucun', texte: r`ni de $\varepsilon$ ni de $x$`,
            pourquoi: r`Relisez la borne : $\log \varepsilon / \log x$ dépend des deux.` },
        ],
      },
      limiteRang: {
        libelle: 'comportement du rang',
        titre: r`Lorsque $x \to 1^-$, le rang $N(\varepsilon, x)$ tend vers :`,
        options: [
          { id: 'infini', texte: r`$+\infty$` },
          { id: 'zero', texte: r`$0$`,
            pourquoi: r`Le dénominateur $\log x$ tend vers $0^-$ et le numérateur $\log \varepsilon$ est un nombre strictement négatif fixé : le quotient tend vers $+\infty$, pas vers $0$.` },
          { id: 'unSurEps', texte: r`$1/\varepsilon$`,
            pourquoi: r`$1/\varepsilon$ ne joue aucun rôle ici : la borne est $\log \varepsilon / \log x$, dont le dénominateur tend vers $0^-$.` },
          { id: 'finie', texte: r`une limite finie qui dépend de $\varepsilon$`,
            pourquoi: r`Comme $\log x \to 0^-$ et $\log \varepsilon < 0$ est fixé, le quotient $\log \varepsilon / \log x$ devient arbitrairement grand : la limite est $+\infty$.` },
        ],
      },
      bilan: {
        libelle: 'bilan',
        titre: 'Que peut-on en conclure ?',
        options: [
          { id: 'aucunRang', texte: r`aucun rang $N$ ne convient pour tous les $x \in [0, 1)$ à la fois` },
          { id: 'rangCommun', texte: r`il existe un rang $N$ qui convient pour tous les $x \in [0, 1)$`,
            pourquoi: r`C'est le contraire : quel que soit $N$, il y a des points $x$ proches de $1$ pour lesquels $N(\varepsilon, x) > N$, c'est-à-dire $f_N(x) = x^N \geq \varepsilon$.` },
          { id: 'pasSimple', texte: r`$(f_n)$ ne converge pas simplement sur $[0, 1)$`,
            pourquoi: r`Elle converge simplement : en chaque point $x$, un rang $N(\varepsilon, x)$ existe bel et bien. Ce qui échoue, c'est de trouver un rang <em>commun</em> à tous les points.` },
          { id: 'continueFinalement', texte: r`la limite $f$ est finalement continue en $1$`,
            pourquoi: r`Non : le calcul explique au contraire <em>pourquoi</em> la limite a pu devenir discontinue, les $f_n$ restant proches de $1$ près de $x = 1$, aussi grand que soit $n$.` },
        ],
      },
    },

    // Rédaction : liste de paragraphes ; un paragraphe est une liste de
    // morceaux de texte (chaînes) et de blancs (objets). -------------------------
    preuve: [
      [
        r`<strong>(a)</strong> `,
        { b: 'a-fixer', menu: 'fixer', ok: ['x'] },
        r` La suite de nombres $(f_n(x))_{n \in \mathbb{N}} = (x^n)_{n \in \mathbb{N}}$ est une suite géométrique de raison $x$ ; il faut distinguer `,
        {
          b: 'a-cas', menu: 'cas', ok: ['deux'],
          okAvecRemarque: {
            trois: r`Correct, mais le cas $x = 0$ n'a rien de particulier : $0^n = 0 \to 0$, comme pour tout $x \in [0, 1)$. Deux cas suffisent.`,
          },
        },
        r`. Si $0 \leq x < 1$, alors $x^n \to$ `,
        {
          b: 'a-limite1', menu: 'limite', ok: ['zero'],
          pourquoi: {
            un: r`$x^n \to 1$ seulement si $x = 1$. Pour $0 \leq x < 1$, les puissances de $x$ deviennent de plus en plus petites : prenez $x = \tfrac{1}{2}$.`,
            x: r`$x^n$ ne reste pas égal à $x$ : $(\tfrac{1}{2})^n$ vaut $\tfrac{1}{2}, \tfrac{1}{4}, \tfrac{1}{8}, \ldots$ et tend vers $0$.`,
            infini: r`$x^n \to +\infty$ demande $x > 1$ ; ici $0 \leq x < 1$.`,
            aucune: r`La suite géométrique de raison $|x| < 1$ converge (vers $0$).`,
          },
        },
        r` lorsque $n \to \infty$, car `,
        {
          b: 'a-justif', menu: 'justif', ok: ['geom'],
          okAvecRemarque: {
            decroissante: r`Décroissante et minorée par $0$, la suite converge vers une limite $L \geq 0$ ; il reste à voir que $L = 0$, par exemple en passant à la limite dans $x^{n+1} = x \cdot x^n$ : $L = xL$, donc $L = 0$ puisque $x \neq 1$. L'argument de la suite géométrique de raison $|x| < 1$ est plus direct.`,
          },
        },
        r`. Si $x = 1$, alors $f_n(1) = 1^n = 1$ pour tout $n$, donc $f_n(1) \to$ `,
        {
          b: 'a-limite2', menu: 'limite', ok: ['un'],
          pourquoi: {
            zero: r`La suite $(1^n)_n = (1, 1, 1, \ldots)$ est constante égale à $1$ : sa limite est $1$, pas $0$. C'est précisément ce qui distingue le point $x = 1$.`,
            x: r`Ici $x = 1$, donc « $x$ » et « $1$ » désignent le même nombre : écrivez la valeur, $1$.`,
            infini: r`$1^n = 1$ pour tout $n$ : la suite est constante.`,
            aucune: r`Une suite constante converge (vers sa valeur).`,
          },
        },
        r`. Ainsi, $(f_n)$ converge simplement sur $[0, 1]$ vers la fonction `,
        { b: 'a-fonction', menu: 'fonctionLimite', ok: ['saut'] },
        r`.`,
      ],
      [
        r`<strong>(b)</strong> Chaque $f_n$ est continue sur $[0, 1]$ (fonction polynomiale), mais la limite $f$ `,
        { b: 'b-continuite', menu: 'continuite', ok: ['pasEn1'] },
        r`, puisque `,
        { b: 'b-raison', menu: 'raison', ok: ['limGauche'] },
        r`. Moralité : `,
        { b: 'b-moralite', menu: 'moralite', ok: ['pasConservee'] },
        r`.`,
      ],
      [
        r`<strong>(c)</strong> Fixons $0 < \varepsilon < 1$ et $0 < x < 1$. Comme $f(x) = 0$, on a $|f_n(x) - f(x)| = $ `,
        { b: 'c-ecart', menu: 'ecart', ok: ['xn'] },
        r`. Comme `,
        { b: 'c-signe', menu: 'signeLog', ok: ['neg'] },
        r`, on obtient $x^n < \varepsilon \iff n \log x < \log \varepsilon \iff$ `,
        { b: 'c-rang', menu: 'rang', ok: ['bon'] },
        r`. Le plus petit rang qui convient, noté $N(\varepsilon, x)$, dépend donc `,
        { b: 'c-dependance', menu: 'dependance', ok: ['epsEtX'] },
        r`. Lorsque $x \to 1^-$, on a $\log x \to 0^-$, donc $N(\varepsilon, x) \to$ `,
        { b: 'c-limite', menu: 'limiteRang', ok: ['infini'] },
        r` : `,
        { b: 'c-bilan', menu: 'bilan', ok: ['aucunRang'] },
        r`. Autrement dit, si $n$ est fixé, aussi grand soit-il, il existe toujours des points $x$ proches de $1$ où $f_n(x) = x^n$ est proche de $1$, donc loin de $f(x) = 0$ : c'est ce qui permet à la limite d'être discontinue. La <em>convergence uniforme</em> exigera un rang $N$ qui ne dépend pas de $x.$ <span class="fin">$\square$</span>`,
      ],
    ],
  });
})();
