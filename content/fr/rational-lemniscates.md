---
page_title: "Visualiseur de lemniscates rationnelles — Pierre-Olivier Parisé"
nav: "research"
wide: true
---

<p class="retour-cours"><a href="research.html" title="Retour à la page Recherche">← Retour à la page Recherche</a></p>
<h1>Visualiseur de lemniscates rationnelles</h1>
<p class="subtitle">Visualisez la lemniscate \( |P(z)/Q(z)| = c \) et les valeurs critiques. Entrez le numérateur et le dénominateur par leurs coefficients ou leurs racines, puis choisissez un niveau \( c \).</p>

<div class="mr-panel">
  <h2>Paramètres</h2>
  <div class="mr-controls-grid">
    <div class="mr-control">
      <label class="mr-control-head" for="num-coeffs">Coefficients du numérateur</label>
      <input id="num-coeffs" type="text" value="1, 0, -1" />
    </div>
    <div class="mr-control">
      <label class="mr-control-head" for="num-roots">Racines du numérateur</label>
      <input id="num-roots" type="text" value="" />
    </div>
    <div class="mr-control">
      <label class="mr-control-head" for="den-coeffs">Coefficients du dénominateur</label>
      <input id="den-coeffs" type="text" value="" />
    </div>
    <div class="mr-control">
      <label class="mr-control-head" for="den-roots">Racines du dénominateur</label>
      <input id="den-roots" type="text" value="" />
    </div>
    <div class="mr-control level-full-width">
      <div class="mr-control-head">Niveau c <output id="level-val-display">1.00</output></div>
      <input id="level-slider" type="range" min="10" max="500" value="100" />
      <input id="level-input" type="number" min="0.1" max="5.0" step="0.01" value="1.00" />
    </div>
  </div>
  <div class="lem-actions">
    <button id="refresh-btn" class="play-style-btn" type="button">Tracer</button>
  </div>
</div>

<div class="mr-panel">
  <div class="lem-plots">
    <div class="lem-plot-block">
      <canvas id="canvas-z" width="600" height="600"></canvas>
      <div class="lem-plot-title">Plan des z : lemniscate \( |r(z)| = c \)</div>
    </div>
    <div class="lem-plot-block">
      <canvas id="canvas-w" width="600" height="600"></canvas>
      <div class="lem-plot-title">Plan des w : valeurs critiques et cercle \( |w| = c \)</div>
    </div>
  </div>
</div>

<p class="lem-legende">Les coefficients et les racines peuvent être réels ou complexes (par ex. <code>1+2j</code>, <code>1-3i</code>). Les zéros sont en <strong style="color:#0b57d0">bleu</strong>, les pôles en <strong style="color:#cc0000">rouge</strong> et les points critiques en <strong style="color:#0b7a57">vert</strong>. Les valeurs critiques à l’intérieur du cercle \(|w|=c\) sont en <strong style="color:#8000ff">violet</strong>, celles à l’extérieur en <strong style="color:#ff7f00">orange</strong>.</p>

<script src="rational-lemniscates.js"></script>
