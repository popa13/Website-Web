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

.je-panel-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 0.35rem;
  min-height: 1.6rem;
}
.je-panel-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: #555;
}
.je-panel > .je-panel-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.35rem;
  min-height: 1.6rem;
}
.je-res-select {
  font-size: 0.78rem;
  padding: 0.15rem 0.3rem;
  border: 1px solid #aaa;
  border-radius: 3px;
  background: #f7f7f7;
  cursor: pointer;
}
.je-btn-action {
  font-size: 0.78rem;
  padding: 0.15rem 0.55rem;
  border: 1px solid #aaa;
  border-radius: 3px;
  background: #f7f7f7;
  cursor: pointer;
  white-space: nowrap;
  line-height: 1.4;
}
.je-btn-action:hover { background: #e4e4e4; }

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

/* Modal */
.je-modal-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  z-index: 9999;
  align-items: center;
  justify-content: center;
}
.je-modal-overlay.open { display: flex; }
.je-modal-box {
  position: relative;
  max-width: 96vw;
  max-height: 92vh;
  background: #111;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.je-modal-close {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 1;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 1rem;
  padding: 2px 8px;
  line-height: 1.5;
}
.je-modal-close:hover { background: #333; }
.je-modal-scroll { overflow: auto; flex: 1; }
.je-modal-img {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

@media (max-width: 640px) {
  .je-panels { flex-direction: column; }
}
</style>

<script src="julia-explorer.js"></script>
