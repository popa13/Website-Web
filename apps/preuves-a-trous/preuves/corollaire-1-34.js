// =============================================================================
// Preuve à trous — Corollaire 1.34 (section 1.6) : |f|, f² et fg sont intégrables.
// Parties (a) et (b) de la démonstration des diapositives ; la partie (c) est
// laissée en exercice, à rédiger à la main dans le cahier.
//
// Format : voir README.md. Les chaînes acceptent du HTML et des formules $...$
// (LaTeX rendu par KaTeX ; les macros du cours \Rab, \eps, \oc...\fc sont connues).
// String.raw évite de doubler les barres obliques inverses.
// =============================================================================
(function () {
  const r = String.raw;

  // Explications partagées par plusieurs blancs ---------------------------------
  const pourquoiResultatComposition = {
    linearite: r`La linéarité concerne $f + g$ et $cf$ ; une composée $\varphi \circ f$ n'est pas une combinaison linéaire de fonctions dont on connaît déjà l'intégrabilité.`,
    monotonie: r`La monotonie compare les intégrales de fonctions <em>déjà</em> intégrables ; elle ne peut pas établir qu'une fonction est intégrable.`,
    monoLin: r`Ces deux propriétés supposent les fonctions déjà intégrables. Elles serviront plus loin, pour passer d'un encadrement de fonctions à un encadrement d'intégrales.`,
    critere: r`Le critère ne s'applique pas tel quel : il faudrait encore majorer $\SDs{\varphi \circ f}{\cP} - \SDi{\varphi \circ f}{\cP}$, et c'est précisément ce que fait la démonstration du théorème de composition. Ici, on invoque ce théorème : la fonction $\varphi$ continue sur $[c, d]$ vient d'être posée pour cela.`,
    bornesAtteintes: r`Le théorème des bornes atteintes demande la continuité de $f$ et ne parle pas d'intégrabilité.`,
    chasles: r`La relation de Chasles découpe l'intervalle d'intégration ; elle n'intervient pas ici.`,
    produit: r`Le théorème du produit est la partie (b) du corollaire : nous sommes en train de le démontrer, nous ne pouvons pas l'utiliser.`,
  };

  const pourquoiResultatCompositionA = Object.assign({}, pourquoiResultatComposition, {
    produit: pourquoiResultatComposition.produit + r` D'ailleurs, $|f|$ n'est pas un produit de deux fonctions de $\Rab$.`,
  });
  const pourquoiResultatCompositionB = Object.assign({}, pourquoiResultatComposition, {
    monoLin: r`Ces deux propriétés supposent les fonctions déjà intégrables ; elles ne peuvent pas établir que $f^2$ l'est. La linéarité servira plus loin, pour $f \pm g$ et pour l'identité finale ; la monotonie n'intervient pas dans la partie (b).`,
  });

  const pourquoiIntervalleDomaine = r`$[a, b]$ est le domaine de $f$. Le théorème de composition demande que $\varphi$ soit continue sur un intervalle $[c, d]$ contenant les <em>valeurs</em> $f(x)$, pas les points $x$.`;

  PreuvesATrous.enregistrer({
    id: 'corollaire-1-34',
    titre: r`Corollaire 1.34 — $|f|$, $f^2$ et $fg$ sont intégrables`,
    titreCourt: 'Corollaire 1.34',
    sousTitre: 'MPU1054 · Analyse à une variable réelle II · Section 1.6',
    solutionApres: 3,
    corrige: { pdf: 'corriges/corollaire-1-34-demonstration.pdf', png: 'corriges/corollaire-1-34-demonstration.png' },

    consignes: r`<p>Complétez la démonstration des parties (a) et (b) : touchez chaque blanc numéroté et choisissez l'option qui convient. Un même menu revient à plusieurs endroits et une même option peut servir plusieurs fois. Appuyez ensuite sur <strong>Vérifier</strong>.</p>
<p>La partie (c) est laissée en exercice : rédigez-la à la main dans l'espace du cahier, sur le modèle de (a) et (b).</p>`,

    enonce: {
      titre: 'Corollaire 1.34',
      html: r`<p>Soient $f, g \in \Rab$.</p>
<ol class="alpha">
<li><span class="lettre">(a)</span> $|f| \in \Rab$ et $\big| \int_a^b f \big| \leq \int_a^b |f|$ &nbsp;(<em>inégalité triangulaire</em>).</li>
<li><span class="lettre">(b)</span> $f^2 \in \Rab$ et $fg \in \Rab$ &nbsp;(<em>théorème du produit</em>).</li>
<li><span class="lettre">(c)</span> Si $f \geq \eta > 0$, alors $1/f \in \Rab$ ; si $f \geq 0$, alors $\sqrt{f} \in \Rab$.</li>
</ol>`,
    },

    rappels: [
      {
        titre: 'Théorème 1.33 (Composition)',
        html: r`<p>Soient $f \in \Rab$ et $\varphi : \oc c, d \fc \ra \bR$ continue, avec $f(x) \in \oc c, d \fc$ pour tout $x \in \oc a, b \fc$. Alors $\varphi \circ f \in \Rab$.</p>`,
      },
      {
        titre: 'Section 1.2 — fonctions intégrables',
        html: r`<p>Les sommes de Darboux, donc l'intégrabilité, ne sont définies que pour des fonctions <em>bornées</em> : toute fonction de $\Rab$ est bornée par définition.</p>`,
      },
      {
        titre: 'Section 1.4 — propriétés de l\'intégrale',
        html: r`<p><em>Linéarité :</em> si $f, g \in \Rab$ et $c \in \bR$, alors $f + g \in \Rab$, $cf \in \Rab$, $\int_a^b (f + g) = \int_a^b f + \int_a^b g$ et $\int_a^b cf = c \int_a^b f$.</p>
<p><em>Monotonie :</em> si $f, g \in \Rab$ et $f \leq g$ sur $\oc a, b \fc$, alors $\int_a^b f \leq \int_a^b g$.</p>`,
      },
    ],

    // Menus -------------------------------------------------------------------
    menus: {
      borne: {
        libelle: 'justification',
        titre: r`Pourquoi $f$ et $g$ sont-elles bornées ?`,
        options: [
          { id: 'def', texte: r`par définition de l'intégrabilité` },
          { id: 'bornesAtteintes', texte: r`par le théorème des bornes atteintes` },
          { id: 'continues', texte: r`parce que $f$ et $g$ sont continues sur $[a, b]$` },
          { id: 'composition', texte: r`par le théorème de composition` },
          { id: 'critere', texte: r`par le critère d'intégrabilité` },
        ],
      },
      phi: {
        libelle: 'fonction φ',
        titre: r`Quelle fonction $\varphi$ poser ?`,
        options: [
          { id: 'abs', texte: r`$\varphi(t) := |t|$` },
          { id: 'carre', texte: r`$\varphi(t) := t^2$` },
          { id: 'inverse', texte: r`$\varphi(t) := 1/t$` },
          { id: 'racine', texte: r`$\varphi(t) := \sqrt{t}$` },
          { id: 'produit', texte: r`$\varphi(t) := t \, g(t)$`,
            pourquoi: r`Dans le théorème de composition, $\varphi$ est une fonction de la seule variable $t \in [c, d]$. Ici, « $t \, g(t)$ » mélange la variable $t$ (une valeur de $f$) et la fonction $g$, qui dépend du point $x \in [a, b]$ : $fg$ n'est pas, en général, de la forme $\varphi \circ f$.` },
        ],
      },
      intervalle: {
        libelle: 'intervalle',
        titre: r`Sur quel intervalle $\varphi$ doit-elle être continue ?`,
        options: [
          { id: 'K', texte: r`$ {[-K, K]}$` },
          { id: 'KH', texte: r`$ {[-(K + H), K + H]}$` },
          { id: 'zeroK', texte: r`$ {[0, K]}$` },
          { id: 'etaK', texte: r`$ {[\eta, K]}$` },
          { id: 'ab', texte: r`$[a, b]$`, pourquoi: pourquoiIntervalleDomaine },
        ],
      },
      resultat: {
        libelle: 'résultat invoqué',
        titre: 'Quel résultat invoquer ?',
        options: [
          { id: 'composition', texte: 'le théorème de composition' },
          { id: 'linearite', texte: r`la linéarité de l'intégrale` },
          { id: 'monotonie', texte: r`la monotonie de l'intégrale` },
          { id: 'monoLin', texte: r`la monotonie et la linéarité de l'intégrale` },
          { id: 'critere', texte: r`le critère d'intégrabilité` },
          { id: 'bornesAtteintes', texte: 'le théorème des bornes atteintes' },
          { id: 'chasles', texte: 'la relation de Chasles' },
          { id: 'produit', texte: 'le théorème du produit (partie (b))' },
        ],
      },
      compo: {
        libelle: 'conclusion',
        titre: 'Que conclut-on ?',
        options: [
          { id: 'absInt', texte: r`$|f| = \varphi \circ f \in \Rab$` },
          { id: 'carreInt', texte: r`$f^2 = \varphi \circ f \in \Rab$` },
          { id: 'fgInt', texte: r`$fg = \varphi \circ f \in \Rab$`,
            pourquoi: r`$fg$ n'est pas, en général, de la forme $\varphi \circ f$ : la valeur $f(x) g(x)$ dépend de $g(x)$, et pas seulement de $f(x)$.` },
          { id: 'absCont', texte: r`$|f|$ est continue sur $[a, b]$`,
            pourquoi: r`Le théorème de composition conclut à l'intégrabilité de $\varphi \circ f$, pas à sa continuité. D'ailleurs $|f|$ n'est pas continue en général : prenez $f = 1$ sur $[0, 1/2]$ et $f = 0$ sur $(1/2, 1]$.` },
          { id: 'fCont', texte: r`$f$ est continue sur $[a, b]$`,
            pourquoi: r`Rien ne permet de conclure que $f$ est continue : intégrable n'implique pas continue (fonctions en escalier, fonction de Thomae).` },
          { id: 'carreCont', texte: r`$f^2$ est continue sur $[a, b]$`,
            pourquoi: r`Le théorème de composition donne l'intégrabilité de $\varphi \circ f$, pas sa continuité ; $f^2$ n'est pas continue si $f$ ne l'est pas (prenez $f = 1$ sur $[0, 1/2]$ et $f = 0$ sur $(1/2, 1]$).` },
        ],
      },
      ineg: {
        libelle: 'inégalité',
        titre: r`Quel encadrement de $f$ utiliser ?`,
        options: [
          { id: 'enc', texte: r`$-|f| \leq f \leq |f|$` },
          { id: 'pos', texte: r`$0 \leq f \leq |f|$` },
          { id: 'moitie', texte: r`$f \leq |f|$` },
          { id: 'inv', texte: r`$|f| \leq f$` },
          { id: 'borneK', texte: r`$|f| \leq K$` },
        ],
      },
      integ: {
        libelle: 'conclusion',
        titre: 'Que conclut-on ?',
        options: [
          { id: 'sommeDiff', texte: r`$f + g \in \Rab$ et $f - g \in \Rab$` },
          { id: 'carres', texte: r`$(f + g)^2 \in \Rab$ et $(f - g)^2 \in \Rab$` },
          { id: 'fg', texte: r`$fg \in \Rab$` },
          { id: 'sommeCont', texte: r`$f + g$ et $f - g$ sont continues sur $[a, b]$`,
            pourquoi: r`Intégrable n'implique pas continue : la linéarité donne l'intégrabilité de $f \pm g$, rien de plus.` },
          { id: 'prodCarre', texte: r`$f^2 g^2 \in \Rab$`,
            pourquoi: r`$f^2 g^2$ est un produit : affirmer qu'il est intégrable, c'est supposer le théorème du produit que nous voulons démontrer.` },
        ],
      },
      identite: {
        libelle: 'identité',
        titre: r`Quelle identité exprime $fg$ à l'aide de carrés ?`,
        options: [
          { id: 'quart', texte: r`$fg = \tfrac{1}{4} \big[ (f + g)^2 - (f - g)^2 \big]$` },
          { id: 'demi', texte: r`$fg = \tfrac{1}{2} \big[ (f + g)^2 - f^2 - g^2 \big]$` },
          { id: 'sansFacteur', texte: r`$fg = (f + g)^2 - (f - g)^2$`,
            pourquoi: r`Développez : $(f + g)^2 - (f - g)^2 = 4fg$, et non $fg$ : l'égalité écrite est fausse. (La différence $(f + g)^2 - (f - g)^2$ est bien intégrable par linéarité, donc $fg$ aussi, mais c'est avec le facteur $\tfrac{1}{4}$ qu'il faut l'écrire.)` },
          { id: 'demiFaux', texte: r`$fg = \tfrac{1}{2} \big[ (f + g)^2 - (f - g)^2 \big]$`,
            pourquoi: r`$(f + g)^2 - (f - g)^2 = 4fg$ : le facteur est $\tfrac{1}{4}$, pas $\tfrac{1}{2}$.` },
          { id: 'racineProd', texte: r`$fg = \sqrt{f^2 g^2}$`,
            pourquoi: r`$\sqrt{f^2 g^2} = |fg|$, pas $fg$ (faux dès que $fg < 0$) ; et l'intégrabilité de $f^2 g^2$ supposerait le théorème du produit.` },
        ],
      },
    },

    // Démonstration : liste de paragraphes ; un paragraphe est une liste de
    // morceaux de texte (chaînes) et de blancs (objets). -------------------------
    preuve: [
      [
        r`<strong>Démonstration.</strong> Comme $f, g \in \Rab$, elles sont bornées `,
        {
          b: 'borne', menu: 'borne', ok: ['def'],
          pourquoi: {
            bornesAtteintes: r`Le théorème des bornes atteintes s'applique aux fonctions <em>continues</em> sur $[a, b]$. Or rien ne dit que $f$ et $g$ soient continues : une fonction intégrable n'est pas forcément continue (fonction en escalier, fonction de Thomae). Les fonctions de $\Rab$ sont bornées par définition.`,
            continues: r`Les hypothèses ne disent pas que $f$ et $g$ soient continues, seulement qu'elles sont intégrables.`,
            composition: r`Le théorème de composition conclut à l'intégrabilité de $\varphi \circ f$ ; il ne dit rien du caractère borné de $f$. C'est plutôt lui qui aura besoin de ces bornes, pour choisir l'intervalle $[c, d]$.`,
            critere: r`Le critère d'intégrabilité caractérise, parmi les fonctions <em>bornées</em>, celles qui sont intégrables : le fait que $f$ soit bornée est un préalable à son énoncé, pas une conséquence.`,
          },
        },
        r` : il existe $K$ et $H$ tels que $|f| \leq K$ et $|g| \leq H$. La partie (c) est laissée en exercice.`,
      ],
      [
        r`(a) Posons `,
        {
          b: 'a-phi', menu: 'phi', ok: ['abs'],
          pourquoi: {
            carre: r`Avec $\varphi(t) := t^2$, on obtient $\varphi \circ f = f^2$ : c'est la partie (b). En (a), c'est $|f|$ qu'il faut écrire sous la forme $\varphi \circ f$.`,
            inverse: r`$\varphi(t) := 1/t$ donne $1/f$, qui est l'objet de la partie (c) ; de plus, $1/t$ n'est pas définie en $0$, et rien n'empêche $f$ de s'annuler.`,
            racine: r`$\varphi(t) := \sqrt{t}$ donne $\sqrt{f}$ (partie (c)) et n'est définie que pour $t \geq 0$.`,
          },
        },
        r`, fonction continue sur `,
        {
          b: 'a-intervalle', menu: 'intervalle', ok: ['K'],
          okAvecRemarque: {
            KH: r`Correct aussi, puisque $ {[-K, K]} \subseteq {[-(K + H), K + H]}$ ; mais la borne $H$ de $g$ ne sert à rien dans la partie (a).`,
          },
          pourquoi: {
            zeroK: r`$f$ peut prendre des valeurs négatives : on sait seulement que $|f| \leq K$, c'est-à-dire $f(x) \in [-K, K]$. L'intervalle $[0, K]$ ne contient pas forcément toutes les valeurs de $f$.`,
            etaK: r`$[\eta, K]$ est l'intervalle utile pour $1/f$ dans la partie (c), lorsque $f \geq \eta > 0$. Ici, on sait seulement que $f(x) \in [-K, K]$.`,
          },
        },
        r`. Par `,
        { b: 'a-resultat', menu: 'resultat', ok: ['composition'], pourquoi: pourquoiResultatCompositionA },
        r`, `,
        {
          b: 'a-conclusion', menu: 'compo', ok: ['absInt'],
          pourquoi: {
            carreInt: r`En (a), la fonction visée est $|f|$ ; $f^2$ est l'objet de la partie (b).`,
          },
        },
        r`. De plus, `,
        {
          b: 'a-inegalite', menu: 'ineg', ok: ['enc'],
          pourquoi: {
            pos: r`$0 \leq f$ est faux dès que $f$ prend une valeur négative. L'encadrement valable pour toute fonction est $-|f| \leq f \leq |f|$.`,
            moitie: r`$f \leq |f|$ est vrai, mais ne donne que $\int_a^b f \leq \int_a^b |f|$. Pour obtenir $\big| \int_a^b f \big| \leq \int_a^b |f|$, il faut aussi la minoration $-|f| \leq f$.`,
            inv: r`$|f| \leq f$ est faux dès que $f$ prend une valeur négative.`,
            borneK: r`$|f| \leq K$ est vrai, mais mène à $\int_a^b |f| \leq K (b - a)$ (la majoration $\big| \int_\alpha^\beta f \big| \leq K |\beta - \alpha|$ de la section 1.4), pas à l'inégalité triangulaire.`,
          },
        },
        r` donne, par `,
        {
          b: 'a-proprietes', menu: 'resultat', ok: ['monoLin'],
          okAvecRemarque: {
            monotonie: r`La monotonie est l'ingrédient principal ; la linéarité sert aussi, pour savoir que $-|f| \in \Rab$ et pour écrire $\int_a^b (-|f|) = -\int_a^b |f|$.`,
          },
          pourquoi: {
            linearite: r`La linéarité seule ne fournit aucune inégalité ; c'est la monotonie qui transforme $-|f| \leq f \leq |f|$ en un encadrement des intégrales.`,
            composition: r`Le théorème de composition a déjà servi : il donne $|f| \in \Rab$. Passer de $-|f| \leq f \leq |f|$ aux intégrales relève de la monotonie (et de la linéarité pour le signe).`,
            '*': r`Ce résultat ne permet pas de passer d'un encadrement de fonctions à un encadrement d'intégrales.`,
          },
        },
        r`, $-\int_a^b |f| \leq \int_a^b f \leq \int_a^b |f|$, c'est-à-dire $\big| \int_a^b f \big| \leq \int_a^b |f|$.`,
      ],
      [
        r`(b) Posons `,
        {
          b: 'b-phi', menu: 'phi', ok: ['carre'],
          pourquoi: {
            abs: r`$\varphi(t) := |t|$ donne $|f|$, déjà traité en (a). En (b), on veut $f^2$.`,
            inverse: r`$1/t$ est la fonction de la partie (c) ; ici, on veut $f^2$.`,
            racine: r`$\sqrt{t}$ est la fonction de la partie (c) ; ici, on veut $f^2$.`,
          },
        },
        r`, fonction continue sur `,
        {
          b: 'b-intervalle', menu: 'intervalle', ok: ['KH'],
          pourquoi: {
            K: r`$ {[-K, K]}$ contient les valeurs de $f$, donc suffit pour $f^2$. Mais la suite applique le même argument à $f + g$ et $f - g$, dont les valeurs sont dans $ {[-(K + H), K + H]}$ : il faut choisir cet intervalle dès maintenant pour que « par ce qui précède » soit justifié.`,
            zeroK: r`$f$, $f + g$ et $f - g$ peuvent prendre des valeurs négatives.`,
            etaK: r`$[\eta, K]$ est l'intervalle de la partie (c), pour $1/f$ lorsque $f \geq \eta > 0$.`,
          },
        },
        r`. Par `,
        { b: 'b-resultat', menu: 'resultat', ok: ['composition'], pourquoi: pourquoiResultatCompositionB },
        r`, `,
        {
          b: 'b-conclusion', menu: 'compo', ok: ['carreInt'],
          pourquoi: {
            absInt: r`$|f|$ a été traité en (a) ; ici, $\varphi(t) = t^2$ donne $f^2$.`,
          },
        },
        r`. Par `,
        {
          b: 'b-linearite', menu: 'resultat', ok: ['linearite'],
          okAvecRemarque: {
            monoLin: r`La linéarité suffit ; la monotonie n'intervient pas ici.`,
          },
          pourquoi: {
            composition: r`$f + g$ et $f - g$ ne sont pas des composées $\varphi \circ f$ ; leur intégrabilité vient de la linéarité (section 1.4).`,
            monotonie: r`La monotonie compare des intégrales ; elle ne donne pas l'intégrabilité de $f \pm g$.`,
            critere: r`Le critère ne donne rien tel quel : il faudrait majorer $\SDs{f \pm g}{\cP} - \SDi{f \pm g}{\cP}$, ce qui est la démonstration de la linéarité (section 1.4). On invoque le résultat, pas sa preuve.`,
            produit: r`Circulaire : le théorème du produit est ce que nous démontrons.`,
            '*': r`Ce résultat ne donne pas l'intégrabilité de $f + g$ et $f - g$ ; c'est la linéarité de l'intégrale qui le fait.`,
          },
        },
        r`, `,
        {
          b: 'b-sommes', menu: 'integ', ok: ['sommeDiff'],
          pourquoi: {
            carres: r`Pas encore : la linéarité donne $f + g$ et $f - g$ ; les carrés viennent ensuite, par la composition avec $\varphi(t) = t^2$.`,
            fg: r`C'est la conclusion visée, qui n'est pas encore justifiée ; et $fg$ n'est pas une combinaison linéaire de $f$ et $g$.`,
          },
        },
        r`, donc `,
        {
          b: 'b-carres', menu: 'integ', ok: ['carres'],
          pourquoi: {
            sommeDiff: r`C'est ce que nous venons d'obtenir. « Par ce qui précède » renvoie à la composition avec $\varphi(t) = t^2$, qui s'applique à $f + g$ et $f - g$ (leurs valeurs sont dans $ {[-(K + H), K + H]}$) et donne leurs carrés.`,
            fg: r`Pas encore : $fg$ n'est ni une composée $\varphi \circ f$ ni une combinaison linéaire évidente. Il faut d'abord les carrés, puis une identité algébrique.`,
          },
        },
        r` par ce qui précède, et `,
        {
          b: 'b-identite', menu: 'identite', ok: ['quart'],
          okAvecRemarque: {
            demi: r`Identité correcte aussi, mais la démonstration écrite n'a pas établi que $g^2 \in \Rab$ : il faudrait ajouter « de même, $g^2 = \varphi \circ g \in \Rab$, puisque $|g| \leq H \leq K + H$ ». Avec cette ligne, $(f - g)^2$ devient inutile.`,
          },
        },
        r` $\in \Rab$ par linéarité. <span class="fin">$\square$</span>`,
      ],
    ],
  });
})();
