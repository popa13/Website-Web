---
page_title: "Explorateur d'ensembles de Julia remplis — Pierre-Olivier Parisé"
nav: "research"
wide: true
---

<p class="retour-cours"><a href="research.html" title="Retour à la page Recherche">← Retour à la page Recherche</a></p>
<h1>Explorateur d'ensembles de Julia remplis</h1>
<p class="subtitle">
  \(f_c(z) = z^2 + c\)
</p>

<p>
Cliquez ou glissez sur l'ensemble de Mandelbrot (à gauche) pour choisir le paramètre
\(c \in \mathbb{C}\). L'ensemble de Julia rempli correspondant \(\mathcal{K}_c = \{z \in \mathbb{C} : (f_c^n(z))_{n \geq 0}\ \text{est bornée}\}\)
s'affiche à droite, généré par la méthode d'estimation de distance (DEM).
</p>

<div class="je-app">

  <div class="je-controls">
    <label class="je-controls-label" for="je-iter-num">Itérations&nbsp;:</label>
    <input id="je-iter-num" class="je-num" type="number" min="10" max="2000" value="200">
    <input id="je-iter-range" class="je-range" type="range" min="10" max="2000" value="200" step="10">
    <span id="je-c-label" class="je-clabel">c = −0.7000 + 0.2700i</span>
  </div>

  <div class="je-panels">
    <div class="je-panel">
      <div class="je-panel-title">Ensemble de Mandelbrot</div>
      <div class="je-canvas-wrap">
        <canvas id="je-mandelbrot"></canvas>
      </div>
    </div>
    <div class="je-panel">
      <div class="je-panel-header">
        <span class="je-panel-title">Ensemble de Julia rempli pour \(c\)</span>
        <select id="je-res-select" class="je-res-select" title="Résolution de l'image">
          <option value="256">256 × 256</option>
          <option value="512">512 × 512</option>
          <option value="1024">1024 × 1024</option>
          <option value="2048" selected>2048 × 2048</option>
        </select>
        <button id="je-btn-save" class="je-btn-action" type="button" title="Télécharger l'image PNG">&#x2193; PNG</button>
        <button id="je-btn-fullsize" class="je-btn-action" type="button">Taille réelle</button>
      </div>
      <div class="je-canvas-wrap">
        <canvas id="je-julia"></canvas>
      </div>
    </div>
  </div>

</div>

<!-- Modal taille réelle -->
<div id="je-modal" class="je-modal-overlay" role="dialog" aria-modal="true">
  <div class="je-modal-box">
    <button id="je-modal-close" class="je-modal-close" type="button" aria-label="Fermer">&#x2715;</button>
    <div class="je-modal-scroll">
      <img id="je-modal-img" class="je-modal-img" alt="Ensemble de Julia rempli (taille réelle)">
    </div>
  </div>
</div>

<script src="julia-explorer.js"></script>
