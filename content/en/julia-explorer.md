---
page_title: "Filled Julia Set Explorer"
nav: "research"
wide: true
---

<h1>Filled Julia Set Explorer</h1>
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
      <div class="je-panel-title">Filled Julia Set for \(c\)</div>
      <div class="je-canvas-wrap">
        <canvas id="je-julia"></canvas>
      </div>
    </div>
  </div>

</div>

<style>
.je-app { max-width: 1100px; margin: 0 auto; }

.je-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.8rem;
  margin-bottom: 0.9rem;
}
.je-controls-label { font-weight: 600; white-space: nowrap; }
.je-num {
  width: 5rem;
  padding: 0.2rem 0.4rem;
  border: 1px solid #bbb;
  border-radius: 3px;
  font-size: 0.95rem;
}
.je-range { width: 180px; cursor: pointer; }
.je-clabel {
  font-family: monospace;
  font-size: 0.95rem;
  background: #f0f0f0;
  padding: 0.2rem 0.6rem;
  border-radius: 3px;
  white-space: nowrap;
}

.je-panels { display: flex; gap: 1rem; }
.je-panel { flex: 1; min-width: 0; }
.je-panel-title {
  text-align: center;
  font-size: 0.88rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.35rem;
}
.je-canvas-wrap { width: 100%; aspect-ratio: 1 / 1; }
.je-canvas-wrap canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  border: 1px solid #ddd;
}

@media (max-width: 640px) {
  .je-panels { flex-direction: column; }
}
</style>

<script src="julia-explorer.js"></script>
