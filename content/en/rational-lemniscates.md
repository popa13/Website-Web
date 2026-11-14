---
page_title: "Rational lemniscate viewer — Pierre-Olivier Parisé"
nav: "research"
wide: true
---

<p class="retour-cours"><a href="research.html" title="Back to the Research page">← Back to the Research page</a></p>
<h1>Rational lemniscate viewer</h1>
<p class="subtitle">Visualize the lemniscate \( |P(z)/Q(z)| = c \) and the critical values. Enter the numerator and denominator as coefficients or roots, then choose a level \( c \).</p>

<div class="mr-panel">
  <h2>Parameters</h2>
  <div class="mr-controls-grid">
    <div class="mr-control">
      <label class="mr-control-head" for="num-coeffs">Numerator coefficients</label>
      <input id="num-coeffs" type="text" value="1, 0, -1" />
    </div>
    <div class="mr-control">
      <label class="mr-control-head" for="num-roots">Numerator roots</label>
      <input id="num-roots" type="text" value="" />
    </div>
    <div class="mr-control">
      <label class="mr-control-head" for="den-coeffs">Denominator coefficients</label>
      <input id="den-coeffs" type="text" value="" />
    </div>
    <div class="mr-control">
      <label class="mr-control-head" for="den-roots">Denominator roots</label>
      <input id="den-roots" type="text" value="" />
    </div>
    <div class="mr-control level-full-width">
      <div class="mr-control-head">Level c <output id="level-val-display">1.00</output></div>
      <input id="level-slider" type="range" min="10" max="500" value="100" />
      <input id="level-input" type="number" min="0.1" max="5.0" step="0.01" value="1.00" />
    </div>
  </div>
  <div class="lem-actions">
    <button id="refresh-btn" class="play-style-btn" type="button">Plot</button>
  </div>
</div>

<div class="mr-panel">
  <div class="lem-plots">
    <div class="lem-plot-block">
      <canvas id="canvas-z" width="600" height="600"></canvas>
      <div class="lem-plot-title">z-plane: lemniscate \( |r(z)| = c \)</div>
    </div>
    <div class="lem-plot-block">
      <canvas id="canvas-w" width="600" height="600"></canvas>
      <div class="lem-plot-title">w-plane: critical values and circle \( |w| = c \)</div>
    </div>
  </div>
</div>

<p class="lem-legende">Coefficients and roots can be real or complex (e.g. <code>1+2j</code>, <code>1-3i</code>). Zeros are shown in <strong style="color:#0b57d0">blue</strong>, poles in <strong style="color:#cc0000">red</strong> and critical points in <strong style="color:#0b7a57">green</strong>. Critical values inside the circle \(|w|=c\) are in <strong style="color:#8000ff">purple</strong>, those outside in <strong style="color:#ff7f00">orange</strong>.</p>

<script src="rational-lemniscates.js"></script>
