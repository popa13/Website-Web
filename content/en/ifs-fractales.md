---
page_title: "IFS fractal generator — Pierre-Olivier Parisé"
nav: "miscellaneous"
wide: true
---

<p class="retour-cours"><a href="miscellaneous.html#IFSWorkshop" title="Back to the Miscellaneous page">← Back to the Miscellaneous page</a></p>
<h1>IFS fractal generator</h1>
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
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Sierpinski')">Sierpiński</button>
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Tenta')">Ex. 1</button>
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Twisted')">Ex. 2</button>
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Bat')">Ex. 3</button>
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
        <span class="ifs-hint ifs-hint-bar">(Ctrl + scroll)</span>
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

<script src="ifs-fractales.js"></script>