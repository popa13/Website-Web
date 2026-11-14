---
page_title: "Filled Julia set explorer — Pierre-Olivier Parisé"
nav: "research"
wide: true
---

<p class="retour-cours"><a href="research.html" title="Back to the Research page">← Back to the Research page</a></p>
<h1>Filled Julia set explorer</h1>
<p class="subtitle">
  \(f_c(z) = z^2 + c\)
</p>

<p>
Click or drag on the Mandelbrot set (left) to choose the parameter
\(c \in \mathbb{C}\). The corresponding filled Julia set \(\mathcal{K}_c = \{z \in \mathbb{C} : (f_c^n(z))_{n \geq 0}\ \text{is bounded}\}\)
is displayed on the right, rendered using the Distance Estimation Method (DEM).
</p>

<div class="je-app">

  <div class="je-controls">
    <label class="je-controls-label" for="je-iter-num">Iterations:</label>
    <input id="je-iter-num" class="je-num" type="number" min="10" max="2000" value="200">
    <input id="je-iter-range" class="je-range" type="range" min="10" max="2000" value="200" step="10">
    <span id="je-c-label" class="je-clabel">c = −0.7000 + 0.2700i</span>
  </div>

  <div class="je-panels">
    <div class="je-panel">
      <div class="je-panel-title">Mandelbrot Set</div>
      <div class="je-canvas-wrap">
        <canvas id="je-mandelbrot"></canvas>
      </div>
    </div>
    <div class="je-panel">
      <div class="je-panel-header">
        <span class="je-panel-title">Filled Julia Set for \(c\)</span>
        <select id="je-res-select" class="je-res-select" title="Image resolution">
          <option value="256">256 × 256</option>
          <option value="512">512 × 512</option>
          <option value="1024">1024 × 1024</option>
          <option value="2048" selected>2048 × 2048</option>
        </select>
        <button id="je-btn-save" class="je-btn-action" type="button" title="Download PNG">&#x2193; PNG</button>
        <button id="je-btn-fullsize" class="je-btn-action" type="button">Full size</button>
      </div>
      <div class="je-canvas-wrap">
        <canvas id="je-julia"></canvas>
      </div>
    </div>
  </div>

</div>

<!-- Full-size modal -->
<div id="je-modal" class="je-modal-overlay" role="dialog" aria-modal="true">
  <div class="je-modal-box">
    <button id="je-modal-close" class="je-modal-close" type="button" aria-label="Close">&#x2715;</button>
    <div class="je-modal-scroll">
      <img id="je-modal-img" class="je-modal-img" alt="Filled Julia set (full size)">
    </div>
  </div>
</div>

<script src="julia-explorer.js"></script>
