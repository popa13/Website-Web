---
page_title: "IFS Fractal Generator"
nav: "research"
wide: true
---

<h1>IFS Fractal Generator</h1>
<p class="subtitle">
  Repeated application of contracting affine transformations:
  \( w_i(\mathbf{x}) = A_i\,\mathbf{x} + \mathbf{b}_i \)
</p>

<div class="ifs-app-grid">

  <!-- ══ Left column : controls ══════════════════════════════════ -->
  <div class="ifs-col-controls">

    <!-- Iterations -->
    <div class="mr-panel">
      <h2>Iterations</h2>
      <div class="ifs-btn-row">
        <button class="ifs-btn ifs-btn-primary" id="btn-iter1"  type="button">Iterate ×1</button>
        <button class="ifs-btn ifs-btn-primary" id="btn-iter10" type="button">Iterate ×10</button>
        <button class="ifs-btn ifs-btn-success" id="btn-auto"   type="button">Auto ×20</button>
        <button class="ifs-btn"                 id="btn-stop"   type="button">Stop</button>
        <button class="ifs-btn"                 id="btn-reset"  type="button">Reset</button>
        <span id="ifs-computing" class="ifs-computing">computing…</span>
      </div>
      <div class="ifs-res-row">
        <label for="ifs-res-input">Resolution (px):</label>
        <input type="number" id="ifs-res-input" value="512" min="64" max="8192" step="1" />
        <button class="ifs-btn" id="btn-apply-res" type="button">Apply</button>
      </div>
      <p class="ifs-hint">
        Powers of 3 ideal for scale 1/3 (e.g. 243, 729, 2187) &nbsp;·&nbsp;
        Powers of 2 ideal for scale 1/2 (e.g. 256, 512, 1024)
      </p>
      <p id="ifs-iter-label" class="ifs-iter-label">Iteration: 0</p>
      <p id="ifs-status"     class="ifs-status"></p>
    </div>

    <!-- Presets -->
    <div class="mr-panel">
      <h2>Presets</h2>
      <div class="ifs-btn-row">
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Sierpinski')">Sierpiński △</button>
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Tapis')">Carpet □</button>
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Pentaflake')">Pentaflake</button>
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Arbre')">Tree</button>
      </div>
    </div>

    <!-- Affine transformations -->
    <div class="mr-panel">
      <h2>Affine Transformations</h2>
      <p class="ifs-hint">
        \(w_i\) : <strong>r, s</strong> (scale, ]0,1]) &nbsp;·&nbsp;
        <strong>Rot</strong> (rotation, degrees) &nbsp;·&nbsp;
        <strong>e, f</strong> (translation [0,1], bottom-left origin, \(y\) upward)
      </p>
      <div class="ifs-btn-row">
        <button class="ifs-btn ifs-btn-success" id="btn-add-row"  type="button">+ Add</button>
        <button class="ifs-btn"                 id="btn-save-tf"  type="button">Save .ifs.json</button>
        <button class="ifs-btn"                 id="btn-load-tf"  type="button">Load .ifs.json</button>
      </div>
      <div class="ifs-table-wrap">
        <div class="ifs-tf-header">
          <span>#</span>
          <span>r</span><span>s</span><span>Rot</span><span>e</span><span>f</span>
          <span></span>
        </div>
        <div class="ifs-tf-scroll" id="tf-container"></div>
      </div>
    </div>

    <!-- Save -->
    <div class="mr-panel">
      <h2>Save</h2>
      <div class="ifs-btn-row">
        <button class="ifs-btn"                 id="btn-save-png"  type="button">Save PNG</button>
        <button class="ifs-btn ifs-btn-primary"  id="btn-show-full" type="button">Full Image</button>
      </div>
    </div>

  </div><!-- /ifs-col-controls -->

  <!-- ══ Right column : preview ═══════════════════════════════════ -->
  <div class="ifs-col-canvas">
    <div class="mr-panel">
      <h2>Preview</h2>
      <p id="ifs-canvas-info" class="ifs-hint">Preview 512×512 — internal resolution 512×512</p>
      <div class="ifs-canvas-frame">
        <canvas id="ifs-preview-canvas" width="512" height="512"></canvas>
      </div>
    </div>
  </div>

</div><!-- /ifs-app-grid -->

<!-- ══ Modal: full image with zoom ═════════════════════════════════ -->
<div id="ifs-modal-overlay" class="ifs-modal-overlay">
  <div class="ifs-modal">
    <div class="ifs-modal-header">
      <span id="ifs-modal-title" class="ifs-modal-title">Full Image</span>
      <div class="ifs-zoom-bar">
        <span>Zoom:</span>
        <button class="ifs-btn ifs-btn-sm" type="button" onclick="ifsSetZoom(0.25)">25 %</button>
        <button class="ifs-btn ifs-btn-sm" type="button" onclick="ifsSetZoom(0.5)">50 %</button>
        <button class="ifs-btn ifs-btn-sm" type="button" onclick="ifsSetZoom(1)">100 %</button>
        <button class="ifs-btn ifs-btn-sm" type="button" onclick="ifsSetZoom(2)">200 %</button>
        <button class="ifs-btn ifs-btn-sm" type="button" onclick="ifsSetZoom(4)">400 %</button>
        <span id="ifs-zoom-pct" class="ifs-zoom-pct">100 %</span>
        <span class="ifs-hint" style="margin:0;">(Ctrl + scroll)</span>
        <button class="ifs-btn ifs-btn-sm" id="btn-modal-save" type="button">Save PNG</button>
      </div>
      <button class="ifs-modal-close" id="btn-modal-close" type="button">&#x2715;</button>
    </div>
    <div class="ifs-modal-body" id="ifs-modal-canvas-wrap">
      <canvas id="ifs-modal-canvas"></canvas>
    </div>
    <div class="ifs-modal-footer" id="ifs-modal-info"></div>
  </div>
</div>

<!-- Hidden file input for JSON loading -->
<input type="file" id="ifs-file-input" accept=".json,.ifs.json" style="display:none">

<style>
/* ── IFS-specific styles (all prefixed ifs-) ── */

.ifs-app-grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 860px) {
  .ifs-app-grid { grid-template-columns: 1fr; }
  .ifs-col-canvas   { order: -1; }
  .ifs-col-controls { order:  1; }
}

.ifs-btn {
  display: inline-block;
  padding: 6px 13px;
  font-family: inherit;
  font-size: 0.88rem;
  border: 1px solid #bbb;
  border-radius: 6px;
  background: #fff;
  color: #222;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s, border-color 0.12s;
}
.ifs-btn:hover   { background: #e8e8e8; border-color: #999; }
.ifs-btn:active  { background: #d4d4d4; }
.ifs-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.ifs-btn-primary { background: #0b7a57; border-color: #085e42; color: #fff; }
.ifs-btn-primary:hover { background: #085e42; }

.ifs-btn-success { background: #0b7a57; border-color: #085e42; color: #fff; }
.ifs-btn-success:hover { background: #085e42; }

.ifs-btn-sm { padding: 3px 8px; font-size: 0.78rem; }

.ifs-btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.ifs-res-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 4px;
  flex-wrap: wrap;
}
.ifs-res-row label { font-size: 0.88rem; color: #444; white-space: nowrap; }
.ifs-res-row input[type=number] {
  width: 90px;
  padding: 4px 7px;
  font-family: inherit;
  font-size: 0.88rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.ifs-res-row input[type=number]:focus {
  outline: 2px solid #0b57d0;
  border-color: #0b57d0;
}

.ifs-hint       { font-size: 0.82rem; color: #777; font-style: italic; line-height: 1.4; margin: 4px 0; }
.ifs-iter-label { font-size: 0.92rem; font-weight: 700; color: #0b57d0; margin-top: 8px; }
.ifs-status     { font-size: 0.8rem; color: #888; font-style: italic; min-height: 15px; }

.ifs-computing {
  font-size: 0.8rem; font-weight: 700; color: #c0620a; display: none;
  animation: ifs-blink 0.9s ease-in-out infinite;
}
@keyframes ifs-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

.ifs-table-wrap {
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  margin-top: 6px;
}
.ifs-tf-header {
  display: grid;
  grid-template-columns: 28px repeat(5, 1fr) 54px;
  background: #f2f2f2;
  border-bottom: 1px solid #ddd;
  padding: 4px 5px;
  font-size: 0.76rem;
  font-weight: 700;
  color: #777;
  text-align: center;
}
.ifs-tf-header span:first-child { text-align: right; }

.ifs-tf-scroll { max-height: 210px; overflow-y: auto; }

.ifs-tf-row {
  display: grid;
  grid-template-columns: 28px repeat(5, 1fr) 54px;
  align-items: center;
  padding: 2px 5px;
  border-bottom: 1px solid #f0f0f0;
}
.ifs-tf-row:last-child { border-bottom: none; }
.ifs-tf-row:hover { background: #fafafa; }

.ifs-tf-num { font-size: 0.78rem; font-weight: 700; color: #aaa; text-align: right; padding-right: 4px; }

.ifs-tf-row input {
  width: 100%; min-width: 0;
  font-size: 0.8rem;
  font-family: "Courier New", monospace;
  padding: 2px 4px;
  text-align: right;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.ifs-tf-row input:focus { border-color: #0b57d0; outline: none; }

.ifs-btn-del {
  font-family: inherit; font-size: 0.75rem;
  padding: 2px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff; color: #c00;
  cursor: pointer;
}
.ifs-btn-del:hover { background: #c9302c; color: #fff; border-color: #c9302c; }

.ifs-canvas-frame {
  border: 1px solid #ddd;
  border-radius: 6px;
  display: block;
  overflow: hidden;
  line-height: 0;
}
#ifs-preview-canvas {
  display: block;
  width: 100%;
  height: auto;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.ifs-modal-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.65); z-index: 9000;
  align-items: center; justify-content: center;
}
.ifs-modal-overlay.open { display: flex; }

.ifs-modal {
  background: #fff; width: 96vw; height: 93vh;
  border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,0.45);
  display: flex; flex-direction: column; overflow: hidden;
}

.ifs-modal-header {
  background: #333; color: #fff;
  padding: 8px 12px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  flex-shrink: 0;
}
.ifs-modal-title { font-size: 0.92rem; font-weight: 700; white-space: nowrap; }
.ifs-zoom-bar { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.ifs-zoom-pct { font-size: 0.92rem; font-weight: 700; color: #7ec8e3; min-width: 46px; }

.ifs-modal-close {
  margin-left: auto; background: none; border: 1px solid #666;
  color: #ccc; padding: 3px 9px; border-radius: 6px;
  cursor: pointer; font-size: 1rem; line-height: 1; flex-shrink: 0;
}
.ifs-modal-close:hover { background: #555; color: #fff; }

.ifs-modal-body { flex: 1; overflow: auto; background: #888; }

#ifs-modal-canvas {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.ifs-modal-footer {
  padding: 5px 12px; font-size: 0.78rem; color: #888;
  border-top: 1px solid #eee; flex-shrink: 0;
}
</style>

<script src="ifs-fractales.js"></script>