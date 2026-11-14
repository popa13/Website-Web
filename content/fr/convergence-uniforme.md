---
page_title: "Convergence simple et uniforme — Pierre-Olivier Parisé"
nav: "teaching"
wide: true
---

<article>
<p class="retour-cours"><a href="mpu1054.html#Applications" title="MPU1054 – page du cours (applications et activités)">← Retour à la page du cours MPU1054</a></p>
<h1 id="ConvergenceUniforme">Convergence simple et uniforme</h1>
<p class="subtitle">MPU1054 Analyse à une variable réelle II, section 2.1 : suites de fonctions.</p>

<div class="app-barre">
<details class="app-aide">
<summary>Mode d’emploi</summary>
<div class="app-aide-contenu">
<p>L’application dessine la <b>limite simple</b> <i>f</i> (en vert), un <b>membre</b> <i>f<sub>n</sub></i> de la suite (en or) et, si l’on veut, quelques autres membres <i>f<sub>k</sub></i>. La <b>bande</b> verte est l’ensemble des points dont l’ordonnée est à distance strictement inférieure à ε du graphe de <i>f</i>.</p>
<p><b>Convergence uniforme sur <i>A</i></b> : pour tout ε &gt; 0, il existe un rang <i>N</i> tel que, pour <i>n</i> ≥ <i>N</i>, le graphe de <i>f<sub>n</sub></i> au-dessus de <i>A</i> est <i>tout entier</i> dans la bande. Autrement dit, ‖<i>f<sub>n</sub></i> − <i>f</i>‖<sub><i>A</i></sub> = sup<sub><i>x</i>∈<i>A</i></sub> |<i>f<sub>n</sub></i>(<i>x</i>) − <i>f</i>(<i>x</i>)| tend vers 0. Les parties de <i>f<sub>n</sub></i> qui sortent de la bande sont dessinées en rouge ; le segment rouge vertical montre où l’écart |<i>f<sub>n</sub></i> − <i>f</i>| est le plus grand.</p>
<p><b>Convergence simple seulement</b> : pour chaque <i>x</i>, <i>f<sub>n</sub></i>(<i>x</i>) finit par entrer dans la bande, mais aucun rang ne convient pour tous les <i>x</i> à la fois ; on le voit en suivant les points <i>x<sub>n</sub></i> (critère de non-convergence uniforme), où <i>f<sub>n</sub></i> reste loin de <i>f</i> quel que soit <i>n</i>.</p>
<ul>
<li><b>Curseur <i>n</i></b> (ou ↑ ↓, +, −, ×2) : choisir le membre affiché ; <b>▶ Animer</b> fait croître <i>n</i>.</li>
<li><b>Curseur ε</b> (ou ← →) : largeur de la bande. Le panneau « Valeurs » donne ‖<i>f<sub>n</sub></i> − <i>f</i>‖<sub><i>A</i></sub> et le rang <i>N</i>(ε) lorsqu’il existe.</li>
<li><b>Autres membres</b> : indices <i>k</i> séparés par des virgules (p. ex. <code>1, 2, 5, 10</code>).</li>
<li><b>Au choix</b> : entrer <i>f<sub>n</sub></i>(<i>x</i>) avec les variables <code>x</code> et <code>n</code>, la limite <i>f</i>(<i>x</i>) (si elle est laissée vide, elle est estimée par <i>f<sub>N</sub></i> avec <i>N</i> = 10<sup>6</sup>) et l’intervalle <i>A</i> = [<i>a</i>, <i>b</i>]. La norme est alors calculée numériquement sur la partie visible de <i>A</i>.</li>
<li><b>Graphe</b> : molette = zoom, glisser = déplacer, <b>Recadrer</b> (F) = fenêtre par défaut, ⛶ = plein écran.</li>
</ul>
<p class="rd-credit">Application en HTML, CSS et JavaScript, créée avec l’aide de Claude Code (Anthropic) à partir des notes du cours. Les formules sont composées avec KaTeX.</p>
</div>
</details>
<button type="button" class="app-plein-ecran" data-plein-ecran="app-cu" title="Afficher l’application en plein écran" hidden>⛶&nbsp;Plein écran</button>
</div>

<div class="app-cadre contenu">
<iframe id="app-cu" src="../apps/convergence-uniforme/index.html?lang=fr&amp;embed=1" title="Convergence simple et uniforme, application interactive" allowfullscreen></iframe>
</div>
</article>
