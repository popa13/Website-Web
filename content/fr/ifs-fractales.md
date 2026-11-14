---
page_title: "Générateur de fractales IFS — Pierre-Olivier Parisé"
nav: "miscellaneous"
wide: true
---

<p class="retour-cours"><a href="miscellaneous.html#IFSSalon" title="Retour à la page Divers">← Retour à la page Divers</a></p>
<h1>Générateur de fractales IFS</h1>
<p class="subtitle">
  Application répétée de transformations affines contractantes :
  \( w_i(\mathbf{x}) = A_i\,\mathbf{x} + \mathbf{b}_i \)
</p>

<div class="ifs-app-grid">

  <!-- ══ Colonne gauche : contrôles ══════════════════════════════ -->
  <div class="ifs-col-controls">

    <!-- Itérations -->
    <div class="mr-panel">
      <h2>Itérations</h2>
      <div class="ifs-btn-row">
        <button class="ifs-btn ifs-btn-primary" id="btn-iter1"  type="button">Itérer ×1</button>
        <button class="ifs-btn ifs-btn-primary" id="btn-iter10" type="button">Itérer ×10</button>
        <button class="ifs-btn ifs-btn-success" id="btn-auto"   type="button">Auto ×20</button>
        <button class="ifs-btn"                 id="btn-stop"   type="button">Stop</button>
        <button class="ifs-btn"                 id="btn-reset"  type="button">Réinitialiser</button>
        <span id="ifs-computing" class="ifs-computing">calcul en cours…</span>
      </div>
      <div class="ifs-res-row">
        <label for="ifs-res-input">Résolution (px) :</label>
        <input type="number" id="ifs-res-input" value="512" min="64" max="8192" step="1" />
        <button class="ifs-btn" id="btn-apply-res" type="button">Appliquer</button>
      </div>
      <p class="ifs-hint">
        3<sup>k</sup> idéal pour échelle 1/3 (ex. 243, 729, 2187) &nbsp;·&nbsp;
        2<sup>k</sup> idéal pour échelle 1/2 (ex. 256, 512, 1024)
      </p>
      <p id="ifs-iter-label" class="ifs-iter-label">Itération : 0</p>
      <p id="ifs-status"     class="ifs-status"></p>
    </div>

    <!-- Préréglages -->
    <div class="mr-panel">
      <h2>Préréglages</h2>
      <div class="ifs-btn-row">
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Sierpinski')">Sierpiński</button>
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Tenta')">Ex. 1</button>
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Twisted')">Ex. 2</button>
        <button class="ifs-btn" type="button" onclick="ifsLoadPreset('Bat')">Ex. 3</button>
      </div>
    </div>

    <!-- Transformations affines -->
    <div class="mr-panel">
      <h2>Transformations affines</h2>
      <p class="ifs-hint">
        \(w_i\) : <strong>r, s</strong> (échelle, ]0,1]) &nbsp;·&nbsp;
        <strong>Rot</strong> (rotation, degrés) &nbsp;·&nbsp;
        <strong>e, f</strong> (translation [0,1], origine bas-gauche, \(y\) vers le haut)
      </p>
      <div class="ifs-btn-row">
        <button class="ifs-btn ifs-btn-success" id="btn-add-row"  type="button">+ Ajouter</button>
        <button class="ifs-btn"                 id="btn-save-tf"  type="button">Sauver .ifs.json</button>
        <button class="ifs-btn"                 id="btn-load-tf"  type="button">Charger .ifs.json</button>
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

    <!-- Sauvegarde -->
    <div class="mr-panel">
      <h2>Sauvegarde</h2>
      <div class="ifs-btn-row">
        <button class="ifs-btn"                 id="btn-save-png"  type="button">Sauvegarder PNG</button>
        <button class="ifs-btn ifs-btn-primary"  id="btn-show-full" type="button">Image complète</button>
      </div>
    </div>

  </div><!-- /ifs-col-controls -->

  <!-- ══ Colonne droite : aperçu ═════════════════════════════════ -->
  <div class="ifs-col-canvas">
    <div class="mr-panel">
      <h2>Aperçu</h2>
      <p id="ifs-canvas-info" class="ifs-hint">Aperçu 512×512 — résolution interne 512×512</p>
      <div class="ifs-canvas-frame">
        <canvas id="ifs-preview-canvas" width="512" height="512"></canvas>
      </div>
    </div>
  </div>

</div><!-- /ifs-app-grid -->

<!-- ══ Modal : image complète avec zoom ════════════════════════════ -->
<div id="ifs-modal-overlay" class="ifs-modal-overlay">
  <div class="ifs-modal">
    <div class="ifs-modal-header">
      <span id="ifs-modal-title" class="ifs-modal-title">Image complète</span>
      <div class="ifs-zoom-bar">
        <span>Zoom :</span>
        <button class="ifs-btn ifs-btn-sm" type="button" onclick="ifsSetZoom(0.25)">25 %</button>
        <button class="ifs-btn ifs-btn-sm" type="button" onclick="ifsSetZoom(0.5)">50 %</button>
        <button class="ifs-btn ifs-btn-sm" type="button" onclick="ifsSetZoom(1)">100 %</button>
        <button class="ifs-btn ifs-btn-sm" type="button" onclick="ifsSetZoom(2)">200 %</button>
        <button class="ifs-btn ifs-btn-sm" type="button" onclick="ifsSetZoom(4)">400 %</button>
        <span id="ifs-zoom-pct" class="ifs-zoom-pct">100 %</span>
        <span class="ifs-hint ifs-hint-bar">(Ctrl + molette)</span>
        <button class="ifs-btn ifs-btn-sm" id="btn-modal-save" type="button">Sauvegarder PNG</button>
      </div>
      <button class="ifs-modal-close" id="btn-modal-close" type="button">&#x2715;</button>
    </div>
    <div class="ifs-modal-body" id="ifs-modal-canvas-wrap">
      <canvas id="ifs-modal-canvas"></canvas>
    </div>
    <div class="ifs-modal-footer" id="ifs-modal-info"></div>
  </div>
</div>

<!-- Input caché pour charger les fichiers JSON -->
<input type="file" id="ifs-file-input" accept=".json,.ifs.json" style="display:none">

<script src="../ifs-fractales.js"></script>