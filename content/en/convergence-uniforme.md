---
page_title: "Pointwise and uniform convergence — Pierre-Olivier Parisé"
nav: "teaching"
wide: true
---

<article>
<p class="retour-cours"><a href="mpu1054.html#Applications" title="MPU1054 - course page (applications and activities)">← Back to the MPU1054 course page</a></p>
<h1 id="ConvergenceUniforme">Pointwise and uniform convergence</h1>
<p class="subtitle">MPU1054 Analysis in One Real Variable II, Section 2.1: sequences of functions.</p>

<div class="app-barre">
<details class="app-aide">
<summary>How to use</summary>
<div class="app-aide-contenu">
<p>The app draws the <b>pointwise limit</b> <i>f</i> (green), one <b>member</b> <i>f<sub>n</sub></i> of the sequence (gold) and, optionally, a few other members <i>f<sub>k</sub></i>. The green <b>band</b> is the set of points whose ordinate lies at distance less than ε from the graph of <i>f</i>.</p><p><b>Uniform convergence on <i>A</i></b>: for every ε &gt; 0 there is a rank <i>N</i> such that, for <i>n</i> ≥ <i>N</i>, the graph of <i>f<sub>n</sub></i> above <i>A</i> lies <i>entirely</i> inside the band. Equivalently, ‖<i>f<sub>n</sub></i> − <i>f</i>‖<sub><i>A</i></sub> = sup<sub><i>x</i>∈<i>A</i></sub> |<i>f<sub>n</sub></i>(<i>x</i>) − <i>f</i>(<i>x</i>)| tends to 0. The parts of <i>f<sub>n</sub></i> leaving the band are drawn in red; the vertical red segment shows where the gap |<i>f<sub>n</sub></i> − <i>f</i>| is largest.</p><p><b>Pointwise convergence only</b>: for each <i>x</i>, <i>f<sub>n</sub></i>(<i>x</i>) eventually enters the band, but no rank works for all <i>x</i> at once; follow the points <i>x<sub>n</sub></i> (criterion for non-uniform convergence), where <i>f<sub>n</sub></i> stays far from <i>f</i> whatever <i>n</i> is.</p><ul><li><b>Slider <i>n</i></b> (or ↑ ↓, +, −, ×2): choose the member shown; <b>▶ Animate</b> increases <i>n</i>.</li><li><b>Slider ε</b> (or ← →): width of the band. The “Values” panel gives ‖<i>f<sub>n</sub></i> − <i>f</i>‖<sub><i>A</i></sub> and the rank <i>N</i>(ε) when it exists.</li><li><b>Other members</b>: indices <i>k</i> separated by commas (e.g. <code>1, 2, 5, 10</code>).</li><li><b>Your own</b>: enter <i>f<sub>n</sub></i>(<i>x</i>) with the variables <code>x</code> and <code>n</code>, the limit <i>f</i>(<i>x</i>) (if left empty it is estimated by <i>f<sub>N</sub></i> with <i>N</i> = 10<sup>6</sup>) and the interval <i>A</i> = [<i>a</i>, <i>b</i>]. The norm is then computed numerically on the visible part of <i>A</i>.</li><li><b>Graph</b>: wheel = zoom, drag = pan, <b>Reset view</b> (F) = default window, ⛶ = full screen.</li></ul>
<p class="rd-credit">HTML, CSS and JavaScript application, created with the help of Claude Code (Anthropic) from the course notes. The formulas are typeset with KaTeX.</p>
</div>
</details>
<button type="button" class="app-plein-ecran" data-plein-ecran="app-cu" title="Show the application in full screen" hidden>⛶&nbsp;Full screen</button>
</div>

<div class="app-cadre contenu">
<iframe id="app-cu" src="apps/convergence-uniforme/index.html?lang=en&amp;embed=1" title="Pointwise and uniform convergence, interactive application" allowfullscreen></iframe>
</div>
</article>
