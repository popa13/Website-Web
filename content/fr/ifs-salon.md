---
page_title: "Générateur IFS — Pierre-Olivier Parisé"
nav: "miscellaneous"
wide: true
---

<p class="retour-cours"><a href="miscellaneous.html#IFSSalon" title="Retour à la page Divers">← Retour à la page Divers</a></p>
<h1>Générateur IFS — Transformations affines visuelles</h1>
<p class="subtitle">
  Construisez un IFS par des transformations affines contractantes
  \( f_i(\mathbf{x}) = s\,R_\theta\,\mathbf{x} + \mathbf{b}_i \)
  en positionnant et orientant les copies du carré unité à la souris.
</p>
<div class="salon-barre">
  <div class="salon-tuto-group" role="group" aria-label="Visites guidées">
    <span class="salon-barre-label">Visites guidées</span>
    <button class="salon-btn salon-btn-tuto" id="salon-btn-tuto1">▶ Bases</button>
    <button class="salon-btn salon-btn-tuto" id="salon-btn-tuto2">▶ Rotations</button>
    <button class="salon-btn salon-btn-tuto" id="salon-btn-tuto3">▶ Facteur</button>
  </div>
  <a class="salon-more" href="ifs-fractales.html">Application IFS avancée</a>
</div>

<!-- ═══════════════════════════════════════════════════════════
     APPLICATION : 1. placer les copies du carré, 2. itérer
════════════════════════════════════════════════════════════ -->
<div class="salon-app">

  <!-- ── 1. Définition des transformations ─────────────────── -->
  <section class="salon-etape salon-etape-def" aria-labelledby="salon-titre-def">
    <h2 id="salon-titre-def"><span class="salon-num" aria-hidden="true">1</span>Placer les copies du carré</h2>
    <div class="salon-outils">
      <div id="salon-scale-display" class="salon-scale-display" title="Facteur d’échelle">
        <button class="salon-scale-step" id="salon-scale-num-dec" title="Diminuer le numérateur">−</button>
        <span id="salon-scale-value">1/2</span>
        <button class="salon-scale-step" id="salon-scale-num-inc" title="Augmenter le numérateur">+</button>
        <span class="salon-scale-hint">↘ glisser le coin</span>
      </div>
      <div class="salon-sym-group" role="group" aria-label="Miroir">
        <button class="salon-sym-btn salon-sym-active" data-sym="none">Sans miroir</button>
        <button class="salon-sym-btn" data-sym="H">Miroir H</button>
        <button class="salon-sym-btn" data-sym="V">Miroir V</button>
      </div>
      <button class="salon-btn salon-btn-primary salon-btn-add" id="salon-btn-add">+ Ajouter</button>
    </div>
    <canvas id="salon-canvas"></canvas>
    <div class="salon-sous-canvas">
      <p class="salon-hint">Glissez le carré vert · arête verte = repère de rotation · point mauve = facteur d’échelle (glisser).</p>
      <div id="salon-pos" class="salon-pos-label">centre : (0.250, 0.250)</div>
    </div>
    <div class="salon-liste">
      <div class="salon-liste-tete">
        <h3>Transformations (<span id="salon-count">0</span>)</h3>
        <button class="salon-btn salon-btn-danger salon-btn-sm" id="salon-btn-reset">⊗ Réinitialiser tout</button>
      </div>
      <div id="salon-list"></div>
      <p id="salon-empty-hint" class="salon-hint">Glissez le carré, choisissez une rotation, puis cliquez <em>Ajouter</em>.</p>
    </div>
  </section>

  <!-- ── 2. La fractale ────────────────────────────────────── -->
  <section class="salon-etape salon-etape-fractale" aria-labelledby="salon-titre-fractale">
    <h2 id="salon-titre-fractale"><span class="salon-num" aria-hidden="true">2</span>Itérer la fractale</h2>
    <div class="salon-outils">
      <div class="salon-iter-row">
        <button class="salon-btn" id="salon-btn-init">⊙ Init</button>
        <button class="salon-btn salon-btn-primary" id="salon-btn-iter1">Itérer ×1</button>
        <button class="salon-btn salon-btn-primary" id="salon-btn-iter5">Itérer ×5</button>
      </div>
      <p class="salon-iter-etat"><span id="salon-iter-label" class="salon-iter-label">Itération : —</span>
        <span id="salon-computing" class="salon-computing">calcul en cours…</span></p>
    </div>
    <canvas id="salon-fractal-canvas"></canvas>
    <svg id="salon-fractal-svg" style="display:none;" viewBox="0 0 1 1"></svg>
    <div class="salon-sous-canvas">
      <p class="salon-hint">Clic gauche : zoom + &nbsp;·&nbsp; Clic droit : zoom − &nbsp;·&nbsp; Double-clic : réinitialiser le zoom</p>
      <p class="salon-hint salon-canvas-info" id="salon-canvas-info"></p>
    </div>
    <div class="salon-options">
      <div class="salon-mode-row" role="group" aria-label="Affichage">
        <button class="salon-mode-btn salon-mode-active" id="salon-mode-bitmap">Bitmap</button>
        <button class="salon-mode-btn" id="salon-mode-svg">Vectoriel</button>
      </div>
      <div class="salon-res-row">
        <label for="salon-res-select">Résolution</label>
        <select id="salon-res-select" class="salon-res-select">
          <option value="512" selected>512 px</option>
        </select>
      </div>
    </div>
    <div class="salon-export">
      <button class="salon-btn salon-btn-save" id="salon-btn-save-png">↓ Enregistrer PNG</button>
      <button class="salon-btn salon-btn-link" id="salon-btn-copy-link">⎘ Copier le lien</button>
      <button class="salon-btn salon-btn-link" id="salon-btn-share-email">✉ Partager par courriel</button>
    </div>
  </section>

</div><!-- /salon-app -->

<!-- Panneau tutoriel -->
<div id="salon-tuto-panel" style="display:none;">
  <div id="salon-tuto-header">
    <div id="salon-tuto-step"></div>
    <button id="salon-tuto-close" aria-label="Fermer">✕</button>
  </div>
  <div id="salon-tuto-bar"><div id="salon-tuto-fill"></div></div>
  <h3 id="salon-tuto-title"></h3>
  <p id="salon-tuto-text"></p>
  <div id="salon-tuto-nav">
    <button class="salon-btn" id="salon-tuto-prev">← Retour</button>
    <button class="salon-btn salon-btn-primary" id="salon-tuto-next">Suivant →</button>
  </div>
</div>


<!-- ═══════════════════════════════════════════════════════════
     STYLES  (préfixe salon-)
════════════════════════════════════════════════════════════ -->
<style>
/* ── IFS, version salon ─────────────────────────────────────────
   Same look as the rest of the site (style-v3.css): white panels with
   thin rules, the UQTR green for actions, ink for selected toggles.
   Colours on the canvases (green square, orange arrow, purple handle)
   are unchanged: the tutorials refer to them.                      */
.salon-app, .salon-barre, #salon-tuto-panel {
  --s-accent: var(--accent, #0b7a57);
  --s-accent-dark: var(--accent-dark, #085e42);
  --s-tint: var(--accent-tint, #e6f2ec);
  --s-ink: var(--ink, #1d2b3a);
  --s-ink-2: var(--ink-2, #47576a);
  --s-muted: var(--muted, #6b7a86);
  --s-rule: var(--rule, #dde4e0);
  --s-surface: var(--surface, #f4f7f5);
  --s-scale: #5b3d8f;          /* the scale handle on the canvas is purple */
}
/* Back link, guided tours and the link to the advanced application */
.salon-barre {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: 0.6rem 1.5rem; margin: 1rem 0 1.4rem; padding: 0.6rem 0;
  border-top: 1px solid var(--s-rule); border-bottom: 1px solid var(--s-rule);
  font-family: var(--sans, system-ui, sans-serif);
}
.salon-barre .salon-tuto-group { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
.salon-barre-label { margin-right: 0.3rem; font-weight: 600; color: var(--s-ink); }
.salon-barre .salon-btn-tuto { width: auto; padding: 0.35rem 0.8rem; font-size: 0.9rem; }
.salon-more { font-weight: 600; }
.salon-more::after { content: " →"; }

/* Two work areas side by side: 1. place the squares, 2. iterate.
   Each one has its tools right above its canvas. */
.salon-app {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 2rem 2.2rem;
  align-items: start;
  font-family: var(--sans, system-ui, sans-serif);
}
.salon-etape { display: flex; flex-direction: column; gap: 0.75rem; min-width: 0; }
.salon-etape h2 {
  display: flex; align-items: center; gap: 0.6rem;
  margin: 0; font-family: var(--serif, Georgia, serif);
  font-size: 1.25rem; font-weight: 600; color: var(--s-ink);
}
.salon-num {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 1.7rem; height: 1.7rem; border-radius: 50%;
  background: var(--s-accent); color: #fff;
  font: 700 0.95rem/1 var(--sans, system-ui, sans-serif);
}
.salon-outils {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.6rem;
  min-height: 2.6rem;
}
/* the canvases: as large as the column, but never taller than the screen */
#salon-canvas, #salon-fractal-canvas, #salon-fractal-svg {
  display: block; width: 100%; max-width: calc(100vh - 13rem); max-width: calc(100svh - 13rem);
  min-width: min(100%, 18rem); height: auto; aspect-ratio: 1 / 1;
  border: 1px solid var(--s-rule); border-radius: 8px; background: #fff;
}
#salon-canvas { cursor: crosshair; touch-action: none; }
#salon-fractal-canvas, #salon-fractal-svg { cursor: zoom-in; }
#salon-fractal-canvas { image-rendering: pixelated; image-rendering: crisp-edges; }
.salon-sous-canvas { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.3rem 1rem; }
.salon-sous-canvas .salon-hint { flex: 1 1 16rem; }
.salon-canvas-info { flex: 0 0 auto !important; font-variant-numeric: tabular-nums; }

/* Buttons */
.salon-btn, .salon-sym-btn, .salon-mode-btn {
  font-family: inherit; font-weight: 600; cursor: pointer;
  border: 1px solid var(--s-rule); border-radius: 6px;
  background: #fff; color: var(--s-ink);
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.salon-btn { display: inline-block; padding: 0.5rem 0.9rem; font-size: 0.92rem; text-align: center; white-space: nowrap; }
.salon-btn:hover, .salon-sym-btn:hover, .salon-mode-btn:hover { border-color: var(--s-accent); }
.salon-btn:focus-visible, .salon-sym-btn:focus-visible, .salon-mode-btn:focus-visible, .salon-scale-step:focus-visible {
  outline: 2px solid var(--s-accent); outline-offset: 2px;
}
.salon-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.salon-btn-primary { background: var(--s-accent); border-color: var(--s-accent); color: #fff; }
.salon-btn-primary:hover:not(:disabled) { background: var(--s-accent-dark); border-color: var(--s-accent-dark); }
.salon-btn-danger { color: #a3271f; border-color: #e6c3bf; background: #fff; }
.salon-btn-danger:hover { background: #fbefee; border-color: #a3271f; }
.salon-btn-save, .salon-btn-link { color: var(--s-accent); border-color: var(--s-accent); background: #fff; }
.salon-btn-save:hover, .salon-btn-link:hover { background: var(--s-tint); }
.salon-btn-sm { padding: 0.25rem 0.7rem; font-size: 0.85rem; }
.salon-btn-tuto { color: var(--s-ink-2); }
.salon-btn-add { padding-left: 1.2rem; padding-right: 1.2rem; }

.salon-sym-group, .salon-mode-row, .salon-iter-row { display: flex; gap: 0.35rem; }
.salon-sym-btn, .salon-mode-btn { padding: 0.45rem 0.65rem; font-size: 0.85rem; white-space: nowrap; color: var(--s-ink-2); }
/* selected toggle: ink, like the language switch of the site */
.salon-sym-btn.salon-sym-active, .salon-mode-btn.salon-mode-active { background: var(--s-ink); border-color: var(--s-ink); color: #fff; }
.salon-iter-row .salon-btn { padding: 0.55rem 1rem; font-size: 0.95rem; }

/* Scale factor (purple, like its handle on the canvas) */
.salon-scale-display {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.25rem 0.4rem; border: 1px solid #d9cdee; border-radius: 6px; background: #f6f2fc;
}
.salon-scale-display #salon-scale-value {
  min-width: 2.6rem; text-align: center;
  font-weight: 700; font-size: 1rem; color: var(--s-scale); font-variant-numeric: tabular-nums;
}
.salon-scale-step {
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 26px; height: 26px; padding: 0; line-height: 1;
  background: #fff; border: 1px solid #d9cdee; border-radius: 6px;
  color: var(--s-scale); font-weight: 700; font-size: 1rem; cursor: pointer;
}
.salon-scale-step:hover:not(:disabled) { background: #ece4f8; }
.salon-scale-step:disabled { opacity: 0.35; cursor: not-allowed; }
.salon-scale-hint { padding: 0 0.2rem; font-size: 0.75rem; color: var(--s-muted); white-space: nowrap; }
.salon-scale-display.salon-scale-locked { border-style: dashed; }
.salon-scale-display.salon-scale-locked .salon-scale-hint { display: none; }

/* Position, iteration count, resolution */
.salon-pos-label {
  flex: none;
  font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.8rem; color: var(--s-ink-2);
  padding: 0.2rem 0.55rem; background: var(--s-surface); border: 1px solid var(--s-rule); border-radius: 6px;
}
.salon-iter-etat { display: flex; align-items: baseline; gap: 0.7rem; margin: 0 0 0 auto; }
.salon-iter-label { font-size: 1rem; font-weight: 700; color: var(--s-accent); font-variant-numeric: tabular-nums; white-space: nowrap; }
.salon-computing {
  display: none; font-size: 0.85rem; font-style: italic; color: var(--s-muted);
  animation: salon-blink 1.2s ease-in-out infinite;
}
@keyframes salon-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
@media (prefers-reduced-motion: reduce) { .salon-computing { animation: none; } }
.salon-options { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem 1.2rem; }
.salon-res-row { display: flex; align-items: center; gap: 0.5rem; }
.salon-res-row label { font-size: 0.9rem; color: var(--s-ink-2); white-space: nowrap; }
.salon-res-select {
  padding: 0.35rem 0.5rem; font-family: inherit; font-size: 0.9rem; color: var(--s-ink);
  border: 1px solid var(--s-rule); border-radius: 6px; background: #fff; cursor: pointer;
}
.salon-res-select:focus { outline: 2px solid var(--s-accent); border-color: var(--s-accent); }
.salon-export { display: flex; flex-wrap: wrap; gap: 0.45rem; padding-top: 0.8rem; border-top: 1px solid var(--s-rule); }

/* List of transformations (the coloured left edge matches the square on the canvas) */
.salon-liste { padding-top: 0.8rem; border-top: 1px solid var(--s-rule); }
.salon-liste-tete { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.6rem; }
.salon-liste-tete h3 { margin: 0; font-family: var(--serif, Georgia, serif); font-size: 1.05rem; font-weight: 600; color: var(--s-ink); }
#salon-list {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr)); gap: 0.45rem;
  max-height: 21rem; overflow-y: auto; overflow-x: hidden; padding-right: 2px;
}
.salon-t-item {
  border: 1px solid var(--s-rule); border-left-width: 4px; border-radius: 8px;
  padding: 0.5rem 0.7rem; background: #fff;
}
.salon-t-label { font-size: 0.92rem; font-weight: 700; margin-bottom: 0.15rem; }
.salon-t-info { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.75rem; color: var(--s-ink-2); margin-bottom: 0.4rem; line-height: 1.5; }
.salon-t-actions { display: flex; gap: 0.35rem; }
.salon-t-actions button {
  font-family: inherit; font-size: 0.78rem; font-weight: 600; padding: 0.15rem 0.6rem;
  border-radius: 999px; border: 1px solid var(--s-rule); background: #fff; cursor: pointer;
}
.salon-btn-edit { color: var(--s-accent); border-color: var(--s-accent) !important; }
/* the transformation being edited (its square is the green one on the canvas) */
.salon-t-item.salon-t-editing { background: var(--s-tint); border-top-color: var(--s-accent); border-right-color: var(--s-accent); border-bottom-color: var(--s-accent); }
.salon-t-editing .salon-btn-edit { background: var(--s-accent); color: #fff; }
.salon-btn-edit:hover { background: var(--s-accent) !important; color: #fff; }
.salon-btn-del { color: #a3271f; border-color: #e6c3bf !important; }
.salon-btn-del:hover { background: #a3271f !important; border-color: #a3271f !important; color: #fff; }

/* Help text */
.salon-hint { margin: 0; font-size: 0.85rem; line-height: 1.5; color: var(--s-muted); text-align: left; }
.salon-red { color: #a3271f; font-style: normal; font-weight: 600; }
.salon-fractal-placeholder {
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem; color: var(--s-muted);
  border: 1px dashed var(--s-rule); border-radius: 8px; background: var(--s-surface);
}

/* Narrower screens: the two work areas one under the other */
@media (max-width: 900px) {
  .salon-app { grid-template-columns: minmax(0, 1fr); gap: 2.2rem; }
  #salon-canvas, #salon-fractal-canvas, #salon-fractal-svg { max-width: 100%; }
}
/* Phones: bigger buttons, toolbars on full rows */
@media (max-width: 600px) {
  .salon-barre { justify-content: flex-start; }
  .salon-barre-label { width: 100%; }
  .salon-btn { padding: 0.65rem 0.9rem; font-size: 0.95rem; }
  .salon-sym-btn, .salon-mode-btn { padding: 0.6rem 0.4rem; }
  .salon-outils > *, .salon-sym-group, .salon-iter-row { flex: 1 1 100%; }
  .salon-sym-btn, .salon-iter-row .salon-btn, .salon-mode-btn { flex: 1; }
  .salon-scale-display { justify-content: space-between; }
  .salon-iter-etat { margin: 0; }
  .salon-btn-add { width: 100%; padding: 0.75rem; font-size: 1rem; }
  .salon-mode-row { flex: 1 1 100%; }
  .salon-export .salon-btn { flex: 1 1 100%; }
  .salon-res-select { padding: 0.45rem 0.5rem; }
  /* the list stays short, so that step 2 is not far below */
  #salon-list { grid-template-columns: repeat(2, minmax(0, 1fr)); max-height: 15rem; }
  .salon-t-item { padding: 0.45rem 0.55rem; }
  .salon-t-info { font-size: 0.7rem; }
}

/* Tutorial panel */
#salon-tuto-panel {
  position: fixed; bottom: 20px; right: 20px; z-index: 500; width: 320px;
  padding: 1rem 1.1rem 0.9rem; background: #fff;
  border: 1px solid var(--rule, #dde4e0); border-top: 3px solid var(--accent, #0b7a57); border-radius: 10px;
  box-shadow: 0 10px 30px rgba(29, 43, 58, 0.16);
  font-family: var(--sans, system-ui, sans-serif);
}
#salon-tuto-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
#salon-tuto-step { font-size: 0.82rem; color: var(--muted, #6b7a86); }
#salon-tuto-close { background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--muted, #6b7a86); padding: 2px 6px; border-radius: 4px; }
#salon-tuto-close:hover { background: var(--surface, #f4f7f5); color: var(--ink, #1d2b3a); }
#salon-tuto-bar { height: 3px; border-radius: 2px; background: var(--rule, #dde4e0); margin-bottom: 0.8rem; }
#salon-tuto-fill { height: 100%; background: var(--accent, #0b7a57); border-radius: 2px; transition: width 0.3s ease; }
#salon-tuto-panel h3 { margin: 0 0 0.4rem; font-family: var(--serif, Georgia, serif); font-size: 1.1rem; font-weight: 600; color: var(--ink, #1d2b3a); }
#salon-tuto-panel p { margin: 0 0 0.9rem; font-size: 0.92rem; line-height: 1.55; color: var(--ink-2, #47576a); }
#salon-tuto-nav { display: flex; gap: 0.5rem; }
#salon-tuto-nav .salon-btn { width: auto; flex: 1; }
#salon-tuto-prev { margin-right: auto; }
.salon-tuto-highlight {
  outline: 3px solid var(--accent, #0b7a57) !important; outline-offset: 4px; border-radius: 6px;
  animation: tuto-pulse 1.5s ease-in-out infinite;
}
@keyframes tuto-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(11, 122, 87, 0.35); }
  50% { box-shadow: 0 0 0 6px rgba(11, 122, 87, 0); }
}
@media (prefers-reduced-motion: reduce) { .salon-tuto-highlight { animation: none; } }
@media (max-width: 600px) { #salon-tuto-panel { left: 12px; right: 12px; width: auto; bottom: 12px; } }
</style>


<!-- ═══════════════════════════════════════════════════════════
     SCRIPT
════════════════════════════════════════════════════════════ -->
<script>
(function () {
'use strict';

/* ── Canvas d'affichage ── */
const canvas = document.getElementById('salon-canvas');
const ctx    = canvas.getContext('2d');
const S      = 512;
const PAD    = 20;  // marge autour du canevas pour que les bords des carrés restent visibles
canvas.width = canvas.height = S + 2 * PAD;
const RING_R = 28; // rayon de l'anneau de rotation (pixels canvas)

/* ── Canvas de la fractale ── */
const fractalCanvas = document.getElementById('salon-fractal-canvas');
const fractalCtx    = fractalCanvas.getContext('2d');
fractalCanvas.width = fractalCanvas.height = 512;

const fractalSVG = document.getElementById('salon-fractal-svg');

/* ── Canvas hors-écran (résolution interne) ── */
const offCanvas = document.createElement('canvas');
const offCtx    = offCanvas.getContext('2d');

let curDenominator = 2;
let curNumerator   = 1;
let SCALE      = curNumerator / curDenominator;
let SCALE_GRID = 1 / curDenominator;
let H          = SCALE / 2;

const PALETTE = [
  { border: '#1a6fd4', fill: 'rgba(26,111,212,0.22)'  },
  { border: '#0b7a57', fill: 'rgba(11,122,87,0.22)'   },
  { border: '#c07a10', fill: 'rgba(192,122,16,0.22)'  },
  { border: '#a020a0', fill: 'rgba(160,32,160,0.22)'  },
  { border: '#107070', fill: 'rgba(16,112,112,0.22)'  },
  { border: '#b52a2a', fill: 'rgba(181,42,42,0.22)'   },
  { border: '#4a4a00', fill: 'rgba(74,74,0,0.22)'     },
  { border: '#6a2080', fill: 'rgba(106,32,128,0.22)'  },
];

const SCALE_OPTIONS = {
  2:  { powers: [32, 64, 128, 256, 512, 1024, 2048], defaultR: 512  },
  3:  { powers: [27, 81, 243, 729, 2187],              defaultR: 729  },
  4:  { powers: [16, 64, 256, 1024, 4096],             defaultR: 1024 },
  5:  { powers: [25, 125, 625],                        defaultR: 625  },
  6:  { powers: [36, 216],                             defaultR: 216  },
  7:  { powers: [49, 343],                             defaultR: 343  },
  8:  { powers: [64, 512],                             defaultR: 512  },
  9:  { powers: [81, 729],                             defaultR: 729  },
  10: { powers: [100, 1000],                           defaultR: 1000 },
};

/* ── État ── */
let transforms   = [];
let editingIndex = -1;
let cur = { cx: H, cy: H, rotation: 0, flip: 'none', scale: SCALE, sn: 1, sd: 2 };
let isDragging  = false;
let dragOff     = { x: 0, y: 0 };
let isRotating       = false;
let isScaling        = false;
let scaleLocked      = false;
let isHoveringScaleCrn = false;
let rotateStart      = null; // { prevTheta }
let isHoveringCenter = false;

let R          = 512;   // résolution interne (pixels — calcul et sauvegarde)
let displayR   = 512;   // taille d'affichage du canvas fractale (= defaultR du facteur courant)

let zoomX = 0, zoomY = 0, zoomW = 1, zoomH = 1;  // fenêtre dans l'espace [0,1]²

let iterBitmap = null;  // Uint8Array R×R : 0 = blanc, 1 = noir
let iterCount  = 0;

let renderMode = 'bitmap'; // 'bitmap' | 'svg'
let svgLeaves       = null; // array of {a,b,c,d,tx,ty} leaf transforms
let svgVisibleCount = 0;

function isLeafVisible(leaf) {
  const { a, b, c, d, tx, ty } = leaf;
  const lx0 = tx + Math.min(0, a, b, a+b), lx1 = tx + Math.max(0, a, b, a+b);
  const ly0 = ty + Math.min(0, c, d, c+d), ly1 = ty + Math.max(0, c, d, c+d);
  const vx0 = zoomX, vx1 = zoomX + zoomW;
  const vy0 = 1 - zoomY - zoomH, vy1 = 1 - zoomY;
  return lx1 >= vx0 && lx0 <= vx1 && ly1 >= vy0 && ly0 <= vy1;
}

/* ── Coordonnées ── */
function mc(x, y) { return { x: x * S + PAD, y: (1 - y) * S + PAD }; }
function cm(cx, cy) { return { x: (cx - PAD) / S, y: 1 - (cy - PAD) / S }; }

/* ── Coins du carré transformé
   Ordre : f(0,0), f(1,0), f(1,1)★, f(0,1) — index 2 = coin rouge.
   flip='H' : miroir horizontal (y_local → −y_local)
   flip='V' : miroir vertical   (x_local → −x_local)              */
function getCorners(cx, cy, rotation, flip, scale) {
  const h = (scale !== undefined ? scale : SCALE) / 2;
  const rad = rotation * Math.PI / 180;
  const c = Math.cos(rad), s = Math.sin(rad);
  const off = flip === 'H' ? [[-h,h],[h,h],[h,-h],[-h,-h]]
            : flip === 'V' ? [[h,-h],[-h,-h],[-h,h],[h,h]]
            :                [[-h,-h],[h,-h],[h,h],[-h,h]];
  return off.map(([dx,dy]) => ({
    x: cx + dx*c - dy*s,
    y: cy + dx*s + dy*c,
  }));
}

/* ── Matrice affine directe ──
   Sans miroir : M = s·R(θ)
   Miroir H    : M = s·R(θ)·[[1,0],[0,−1]]  →  [[s·c, s·si],[s·si,−s·c]]
   Miroir V    : M = s·R(θ)·[[−1,0],[0,1]]  →  [[−s·c,−s·si],[−s·si,s·c]]
   tx, ty positionnent f(0.5, 0.5) = (cx, cy).                             */
function getAffine(t) {
  const sc = t.scale !== undefined ? t.scale : SCALE;
  const rad = t.rotation * Math.PI / 180;
  const c = Math.cos(rad), si = Math.sin(rad);
  let a, b, cc, d;
  if (t.flip === 'H') {
    a = sc*c;  b =  sc*si;
    cc= sc*si; d = -sc*c;
  } else if (t.flip === 'V') {
    a = -sc*c;  b = -sc*si;
    cc= -sc*si; d =  sc*c;
  } else {
    a = sc*c;  b = -sc*si;
    cc= sc*si; d =  sc*c;
  }
  return { a, b, c:cc, d,
           tx: t.cx - (a*0.5 + b*0.5),
           ty: t.cy - (cc*0.5 + d*0.5) };
}

/* ── Itération directe sur bitmap ──
   Principe : chaque pixel noir de la SOURCE est projeté par chaque
   transformation f_k ; le pixel de destination correspondant est allumé.
   Avec s = 0.5, des paires consécutives de pixels sources tombent sur le
   même pixel de destination → aucun trou, aucune disparition.
   Complexité : O(R² × n_transformations) par itération.            */
function iterateBitmap(src, Ri, fwdMats) {
  const dst = new Uint8Array(Ri * Ri);  // destination = tout blanc au départ
  const n   = fwdMats.length;
  for (let spy = 0; spy < Ri; spy++) {
    const sy = 1 - (spy + 0.5) / Ri;   // centre du pixel, repère mathématique
    for (let spx = 0; spx < Ri; spx++) {
      if (!src[spy * Ri + spx]) continue;  // pixel source blanc → rien à faire
      const sx = (spx + 0.5) / Ri;
      for (let k = 0; k < n; k++) {
        const fm = fwdMats[k];
        const dx = fm.a * sx + fm.b * sy + fm.tx;
        const dy = fm.c * sx + fm.d * sy + fm.ty;
        const dpx = Math.floor(dx * Ri);
        const dpy = Math.floor((1 - dy) * Ri);
        if (dpx >= 0 && dpx < Ri && dpy >= 0 && dpy < Ri) {
          dst[dpy * Ri + dpx] = 1;
        }
      }
    }
  }
  return dst;
}

/* ── Bitmap → canvas hors-écran ── */
function renderBitmapToOffscreen() {
  if (!iterBitmap) return;
  offCanvas.width  = R;
  offCanvas.height = R;
  const imgData = offCtx.createImageData(R, R);
  const data    = imgData.data;
  for (let i = 0; i < R * R; i++) {
    const v = iterBitmap[i] ? 0 : 255;
    const b = i << 2;
    data[b] = data[b+1] = data[b+2] = v;
    data[b+3] = 255;
  }
  offCtx.putImageData(imgData, 0, 0);
}

/* ── Dessin du fond (quadrillage pointillé adapté au SCALE courant) ── */
function drawGrid() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, S + 2*PAD, S + 2*PAD);
  ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
  ctx.beginPath();
  for (let v = SCALE_GRID; v < 1 - 1e-9; v += SCALE_GRID) {
    const px = mc(v, 0).x;
    const py = mc(0, v).y;
    ctx.moveTo(px, PAD); ctx.lineTo(px, S + PAD);
    ctx.moveTo(PAD, py); ctx.lineTo(S + PAD, py);
  }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#999999'; ctx.lineWidth = 2;
  ctx.strokeRect(PAD + 1, PAD + 1, S - 2, S - 2);
}

/* ── Dessin d'un carré transformé ── */
function drawSquare(cx, cy, rotation, flip, pal, alpha, label, scale) {
  const pts  = getCorners(cx, cy, rotation, flip, scale);
  const cpts = pts.map(p => mc(p.x, p.y));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(cpts[0].x, cpts[0].y);
  cpts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = pal.fill; ctx.fill();
  ctx.strokeStyle = pal.border; ctx.lineWidth = 1.5; ctx.stroke();
  const accent = pal.accent || '#cc2222';
  // Arête repère : pts[2]→pts[3]
  ctx.beginPath(); ctx.moveTo(cpts[2].x, cpts[2].y); ctx.lineTo(cpts[3].x, cpts[3].y);
  ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.stroke();
  // Point au coin pts[2]
  ctx.beginPath(); ctx.arc(cpts[2].x, cpts[2].y, 5.5, 0, Math.PI*2);
  ctx.fillStyle = accent; ctx.fill();
  if (label) {
    const cp = mc(cx, cy);
    ctx.globalAlpha = Math.min(alpha*1.8, 1);
    ctx.fillStyle = pal.border;
    ctx.font = `bold ${Math.round(S*0.025)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, cp.x, cp.y);
  }
  ctx.restore();
}

function drawTutoArrow() {
  if (!tutoArrow) return;
  const from = mc(tutoArrow.fx, tutoArrow.fy);
  const to   = mc(tutoArrow.tx, tutoArrow.ty);
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len, uy = dy / len;
  const headLen = 22;
  ctx.save();
  ctx.strokeStyle = '#e06000'; ctx.fillStyle = '#e06000';
  ctx.lineWidth = 3.5; ctx.setLineDash([9, 6]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x - ux * headLen * 0.7, to.y - uy * headLen * 0.7);
  ctx.stroke(); ctx.setLineDash([]);
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI/6), to.y - headLen * Math.sin(angle - Math.PI/6));
  ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI/6), to.y - headLen * Math.sin(angle + Math.PI/6));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* ── Rendu du canvas de définition (grille + carrés + prévisualisation) ── */
function render() {
  ctx.clearRect(0, 0, S + 2*PAD, S + 2*PAD);
  drawGrid();
  // Carrés enregistrés
  transforms.forEach((t, i) => {
    // en édition, Ti n'est pas dessinée à son ancienne place : c'est le carré vert
    if (i !== editingIndex)
      drawSquare(t.cx, t.cy, t.rotation, t.flip, PALETTE[i % PALETTE.length], 0.85, `T${i+1}`, t.scale);
  });
  // Prévisualisation de la transformation courante
  drawSquare(cur.cx, cur.cy, cur.rotation, cur.flip,
    { fill: 'rgba(34,170,68,0.22)', border: '#22aa44', accent: '#22aa44' },
    isDragging ? 1.0 : 0.85, editingIndex >= 0 ? `T${editingIndex+1}` : '', SCALE);
  const cp = mc(cur.cx, cur.cy);
  ctx.save();
  ctx.strokeStyle = '#22aa44'; ctx.fillStyle = '#22aa44'; ctx.lineWidth = 2;
  if (isHoveringCenter || isRotating) {
    // Anneau + point de rotation
    ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cp.x, cp.y, RING_R, 0, 2 * Math.PI); ctx.stroke();
    const dotC = getDotCanvas();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(dotC.x, dotC.y, 5.5, 0, 2 * Math.PI); ctx.fill();
    if (isRotating) {
      const deg = Math.round(((cur.rotation % 360) + 360) % 360);
      const txt = `${deg}°`;
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = ctx.measureText(txt).width;
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillRect(cp.x - tw / 2 - 3, cp.y - 9, tw + 6, 18);
      ctx.fillStyle = '#1a6fd4';
      ctx.fillText(txt, cp.x, cp.y);
    }
  } else {
    // Arc 270° sens anti-horaire à partir de l'horizontal
    ctx.globalAlpha = 0.65;
    ctx.beginPath(); ctx.arc(cp.x, cp.y, 14, 0, Math.PI / 2, true); ctx.stroke();
    const ex = cp.x, ey = cp.y + 14;
    const hl = 9, spread = 0.45;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - hl * Math.cos(-spread), ey - hl * Math.sin(-spread));
    ctx.lineTo(ex - hl * Math.cos( spread), ey - hl * Math.sin( spread));
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (!scaleLocked) {
    const scC = getScaleCornerCanvas();
    ctx.save();
    ctx.fillStyle = isHoveringScaleCrn || isScaling ? '#4a1a8a' : '#7a5aaa';
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.rect(scC.x - 5, scC.y - 5, 10, 10);
    ctx.fill(); ctx.stroke();
    if (isScaling) {
      const n = Math.round(1 / SCALE);
      const txt = `1/${n}`;
      ctx.font = 'bold 12px sans-serif';
      const tw = ctx.measureText(txt).width;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(scC.x + 8, scC.y - 9, tw + 8, 19);
      ctx.fillStyle = '#4a1a8a';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(txt, scC.x + 12, scC.y - 6);
    }
    ctx.restore();
  }
  drawTutoArrow();
}

function renderSVG() {
  fractalSVG.setAttribute('viewBox', `${zoomX} ${zoomY} ${zoomW} ${zoomH}`);
  if (!svgLeaves) {
    svgVisibleCount = 0;
    const cx = zoomX + zoomW / 2, cy = zoomY + zoomH / 2, fs = zoomH * 0.06;
    fractalSVG.innerHTML = `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}" fill="#bbb">Init → Itérer</text>`;
    return;
  }
  const visible = svgLeaves.filter(isLeafVisible);
  svgVisibleCount = visible.length;
  const rects = visible.map(L => {
    const p=L.a, q=-L.c, r=-L.b, s=L.d, e=L.b+L.tx, f=1-L.d-L.ty;
    return `<rect x="0" y="0" width="1" height="1" transform="matrix(${p},${q},${r},${s},${e},${f})"/>`;
  }).join('');
  fractalSVG.innerHTML = `<g fill="black">${rects}</g>`;
}

/* ── Rendu du canvas de la fractale ── */
function renderFractal() {
  if (renderMode === 'svg') { renderSVG(); return; }
  fractalCtx.clearRect(0, 0, displayR, displayR);
  if (iterBitmap) {
    fractalCtx.imageSmoothingEnabled = false;
    fractalCtx.drawImage(
      offCanvas,
      zoomX * R, zoomY * R, zoomW * R, zoomH * R,
      0, 0, displayR, displayR
    );
  } else {
    fractalCtx.fillStyle = '#fafafa';
    fractalCtx.fillRect(0, 0, displayR, displayR);
    fractalCtx.strokeStyle = '#ccc';
    fractalCtx.setLineDash([6, 4]);
    fractalCtx.strokeRect(1, 1, displayR-2, displayR-2);
    fractalCtx.setLineDash([]);
    fractalCtx.fillStyle = '#bbb';
    fractalCtx.font = `${Math.round(displayR*0.035)}px sans-serif`;
    fractalCtx.textAlign = 'center';
    fractalCtx.textBaseline = 'middle';
    fractalCtx.fillText('Appuyez sur ⊙ Init puis Itérer', displayR/2, displayR/2);
  }
}

/* ── Zoom ── */
function resetZoom() {
  zoomX = 0; zoomY = 0; zoomW = 1; zoomH = 1;
}
function doZoom(nx, ny, factor) {
  const cx = zoomX + nx * zoomW;
  const cy = zoomY + ny * zoomH;
  const minSize = renderMode === 'svg' ? 1e-12 : 2 / R;
  const newW = Math.max(minSize, zoomW / factor);
  const newH = Math.max(minSize, zoomH / factor);
  zoomX = Math.max(0, Math.min(1 - newW, cx - nx * newW));
  zoomY = Math.max(0, Math.min(1 - newH, cy - ny * newH));
  zoomW = newW; zoomH = newH;
}

/* ── Placement libre avec accrochage magnétique aux centres de cellule (≤20 px) ── */
function snapToGrid(val) {
  const clamped = Math.max(H, Math.min(1 - H, val));
  const hg = SCALE_GRID / 2;
  const i = Math.max(0, Math.min(curDenominator - 1, Math.round((clamped - hg) / SCALE_GRID)));
  const nearest = hg + i * SCALE_GRID;
  if (nearest < H - 1e-9 || nearest > 1 - H + 1e-9) return clamped;
  return Math.abs(clamped - nearest) < 20 / S ? nearest : clamped;
}

/* ── Utilitaires UI ── */
function hitTest(mx, my) {
  const rad = -(cur.rotation * Math.PI / 180);
  const c = Math.cos(rad), s = Math.sin(rad);
  const dx = mx - cur.cx, dy = my - cur.cy;
  return Math.abs(dx*c - dy*s) <= H && Math.abs(dx*s + dy*c) <= H;
}
function getDotCanvas() {
  const cp = mc(cur.cx, cur.cy);
  const angle = -cur.rotation * Math.PI / 180;
  return { x: cp.x + RING_R * Math.cos(angle), y: cp.y + RING_R * Math.sin(angle) };
}
function hitTestDotOnRing(mx, my) {
  const dot = getDotCanvas(), dm = cm(dot.x, dot.y);
  return Math.hypot(mx - dm.x, my - dm.y) < 10 / S;
}
function hitTestRingArea(mx, my) {
  return Math.hypot(mx - cur.cx, my - cur.cy) < (RING_R + 16) / S;
}
/* Zone de rotation tactile — rayon agrandi pour les doigts (≈34 px écran) */
function hitTestRotateTouch(mx, my) {
  return Math.hypot(mx - cur.cx, my - cur.cy) < 60 / S;
}
function snapRotation(r) {
  const norm = ((r % 360) + 360) % 360;
  for (const s of [0, 90, 180, 270]) {
    let dist = Math.abs(norm - s);
    if (dist > 180) dist = 360 - dist;
    if (dist <= 5) return s;
  }
  return norm;
}
function updatePosLabel() {
  document.getElementById('salon-pos').textContent =
    `centre : (${cur.cx.toFixed(3)}, ${cur.cy.toFixed(3)})`;
}
const SVG_MAX_ITER = 9;
function updateIterLabel() {
  const hasData = renderMode === 'svg' ? svgLeaves !== null : iterBitmap !== null;
  document.getElementById('salon-iter-label').textContent =
    hasData ? `Itération : ${iterCount}` : 'Itération : —';
  const atLimit = renderMode === 'svg' && iterCount >= SVG_MAX_ITER;
  ['salon-btn-iter1', 'salon-btn-iter5'].forEach(id => {
    document.getElementById(id).disabled = atLimit;
  });
}
function updateCanvasInfo() {
  const zoom = zoomW < 0.999 ? ` — ×${(1 / zoomW).toFixed(1)}` : '';
  if (renderMode === 'svg') {
    const n = svgLeaves ? svgLeaves.length : 0;
    const visInfo = (n > 0 && zoomW < 0.999) ? ` (${svgVisibleCount} vis.)` : '';
    document.getElementById('salon-canvas-info').textContent = `${n} forme${n !== 1 ? 's' : ''}${visInfo}${zoom}`;
  } else {
    document.getElementById('salon-canvas-info').textContent = `${R}×${R} px${zoom}`;
  }
}

/* ── Verrouillage du facteur / résolution par défaut ── */
function getScaleKey() { return curDenominator; }
function populateResolutionSelect() {
  const sel  = document.getElementById('salon-res-select');
  const opts = SCALE_OPTIONS[getScaleKey()];
  sel.innerHTML = '';
  opts.powers.forEach(p => {
    const o = document.createElement('option');
    o.value = p; o.textContent = `${p} px`;
    if (p === R) o.selected = true;
    sel.appendChild(o);
  });
}
function resizeFractalCanvas() {
  displayR = SCALE_OPTIONS[getScaleKey()].defaultR;
  fractalCanvas.width = fractalCanvas.height = displayR;
  fractalSVG.setAttribute('width', displayR);
  fractalSVG.setAttribute('height', displayR);
}
function setDefaultResolution() {
  R = SCALE_OPTIONS[getScaleKey()].defaultR;
  populateResolutionSelect();
  resizeFractalCanvas();
  updateCanvasInfo();
}
function lockScale() {
  scaleLocked = true;
  document.getElementById('salon-scale-display').classList.add('salon-scale-locked');
  updateScaleDisplay();
}
function unlockScale() {
  scaleLocked = false;
  document.getElementById('salon-scale-display').classList.remove('salon-scale-locked');
  updateScaleDisplay();
}
function updateScaleDisplay() {
  document.getElementById('salon-scale-value').textContent = `${curNumerator}/${curDenominator}`;
  document.getElementById('salon-scale-num-dec').disabled = curNumerator <= 1;
  document.getElementById('salon-scale-num-inc').disabled = curNumerator >= curDenominator - 1;
}
function getScaleCornerCanvas() {
  const pts = getCorners(cur.cx, cur.cy, cur.rotation, cur.flip, SCALE);
  return mc(pts[1].x, pts[1].y);
}
function hitTestScaleCorner(mx, my) {
  if (scaleLocked) return false;
  const cc = getScaleCornerCanvas();
  const dm = cm(cc.x, cc.y);
  return Math.hypot(mx - dm.x, my - dm.y) < 12 / S;
}
function hitTestScaleCornerTouch(mx, my) {
  if (scaleLocked) return false;
  const cc = getScaleCornerCanvas();
  const dm = cm(cc.x, cc.y);
  return Math.hypot(mx - dm.x, my - dm.y) < 20 / S;
}
function applyScaleFromDist(dist) {
  // Le coin est à distance H*sqrt(2) = curNumerator*sqrt(2)/(2*curDenominator)
  // On résout pour le dénominateur : n = curNumerator*sqrt(2)/(2*dist)
  const rawN = curNumerator * Math.SQRT2 / (2 * dist);
  let bestN = curDenominator + 1, bestDiff = Infinity;
  for (let n = 2; n <= 10; n++) {
    if (n <= curNumerator) continue;  // k/n doit être < 1
    const d = Math.abs(rawN - n);
    if (d < bestDiff) { bestDiff = d; bestN = n; }
  }
  if (bestN !== curDenominator) {
    curDenominator = bestN;
    curNumerator = Math.min(curNumerator, curDenominator - 1);
    SCALE = curNumerator / curDenominator;
    SCALE_GRID = 1 / curDenominator;
    H = SCALE / 2;
    cur.scale = SCALE; cur.sn = curNumerator; cur.sd = curDenominator;
    cur.cx = snapToGrid(cur.cx);
    cur.cy = snapToGrid(cur.cy);
    const validPowers = SCALE_OPTIONS[curDenominator].powers;
    if (!validPowers.includes(R)) R = SCALE_OPTIONS[curDenominator].defaultR;
    populateResolutionSelect();
    resizeFractalCanvas();
    updateScaleDisplay();
    updateCanvasInfo();
    updatePosLabel();
  }
}

/* ── Gestion de l'itération ── */
function resetIter() {
  iterBitmap = null; iterCount = 0;
  svgLeaves = null;
  resetZoom();
  updateIterLabel();
  renderFractal(); updateCanvasInfo();
}

function initIter() {
  if (transforms.length === 0) { alert('Ajoutez au moins une transformation !'); return; }
  if (renderMode === 'svg') {
    svgLeaves = [{ a:1, b:0, c:0, d:1, tx:0, ty:0 }];
    iterCount = 0;
    updateIterLabel(); renderFractal();
  } else {
    iterBitmap = new Uint8Array(R * R).fill(1); // carré unité entier = tout allumé
    iterCount  = 0;
    renderBitmapToOffscreen();
    updateIterLabel();
    renderFractal();
  }
}

function doIter(n) {
  if (transforms.length === 0) { alert('Ajoutez au moins une transformation !'); return; }
  if (renderMode === 'svg') {
    if (!svgLeaves) { svgLeaves = [{a:1,b:0,c:0,d:1,tx:0,ty:0}]; iterCount = 0; }
    const fwdMats = transforms.map(getAffine);
    const maxLeaves = 500000;
    const computing = document.getElementById('salon-computing');
    computing.style.display = '';
    setTimeout(() => {
      for (let k = 0; k < n; k++) {
        if (svgLeaves.length * fwdMats.length > maxLeaves) break;
        const next = [];
        for (const leaf of svgLeaves) {
          for (const fm of fwdMats) {
            next.push({
              a:  fm.a*leaf.a  + fm.b*leaf.c,
              b:  fm.a*leaf.b  + fm.b*leaf.d,
              c:  fm.c*leaf.a  + fm.d*leaf.c,
              d:  fm.c*leaf.b  + fm.d*leaf.d,
              tx: fm.a*leaf.tx + fm.b*leaf.ty + fm.tx,
              ty: fm.c*leaf.tx + fm.d*leaf.ty + fm.ty
            });
          }
        }
        svgLeaves = next;
        iterCount++;
      }
      computing.style.display = 'none';
      updateIterLabel(); renderFractal(); updateCanvasInfo();
    }, 16);
    return;
  }
  if (iterBitmap === null) {
    // Initialisation automatique sans afficher le carré plein
    iterBitmap = new Uint8Array(R * R).fill(1);
    iterCount  = 0;
  }
  const computing = document.getElementById('salon-computing');
  computing.style.display = '';
  // setTimeout pour permettre à l'interface de se mettre à jour avant le calcul
  setTimeout(() => {
    const fwdMats = transforms.map(getAffine);
    for (let k = 0; k < n; k++) {
      iterBitmap = iterateBitmap(iterBitmap, R, fwdMats);
      iterCount++;
    }
    computing.style.display = 'none';
    renderBitmapToOffscreen();
    updateIterLabel();
    renderFractal();
  }, 16);
}

/* ── Conversion client → coordonnées mathématiques ──
   Corrige l'écart entre la résolution du canvas (S px) et sa taille
   d'affichage CSS (r.width px), qui diffère sur mobile.              */
function canvasPos(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return cm(
    (clientX - r.left) * ((S + 2*PAD) / r.width),
    (clientY - r.top)  * ((S + 2*PAD) / r.height)
  );
}

/* ── Souris ── */
canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  const pos = canvasPos(e.clientX, e.clientY);
  if (hitTestScaleCorner(pos.x, pos.y)) {
    isScaling = true;
    canvas.style.cursor = 'nw-resize'; render();
  } else if (hitTestDotOnRing(pos.x, pos.y)) {
    isRotating = true;
    rotateStart = { prevTheta: Math.atan2(pos.y - cur.cy, pos.x - cur.cx) };
    canvas.style.cursor = 'grabbing'; render();
  } else if (hitTest(pos.x, pos.y)) {
    isDragging = true;
    dragOff = { x: pos.x - cur.cx, y: pos.y - cur.cy };
    canvas.style.cursor = 'grabbing'; render();
  }
});
canvas.addEventListener('mousemove', e => {
  const pos = canvasPos(e.clientX, e.clientY);
  if (isScaling) {
    applyScaleFromDist(Math.hypot(pos.x - cur.cx, pos.y - cur.cy));
    render();
  } else if (isRotating) {
    const theta = Math.atan2(pos.y - cur.cy, pos.x - cur.cx);
    let d = theta - rotateStart.prevTheta;
    if (d > Math.PI)  d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    cur.rotation = snapRotation(cur.rotation + d * 180 / Math.PI);
    rotateStart.prevTheta = theta;
    render();
  } else if (isDragging) {
    cur.cx = snapToGrid(pos.x - dragOff.x);
    cur.cy = snapToGrid(pos.y - dragOff.y);
    updatePosLabel(); render();
  } else {
    const wasHoveringScale = isHoveringScaleCrn;
    isHoveringScaleCrn = hitTestScaleCorner(pos.x, pos.y);
    const wasHovering = isHoveringCenter;
    isHoveringCenter = hitTestRingArea(pos.x, pos.y);
    if (isHoveringScaleCrn) {
      canvas.style.cursor = 'nw-resize';
    } else {
      canvas.style.cursor = hitTestDotOnRing(pos.x, pos.y) ? 'grab' : 'crosshair';
    }
    if (isHoveringScaleCrn !== wasHoveringScale || isHoveringCenter !== wasHovering) render();
  }
});
canvas.addEventListener('mouseup', () => {
  isScaling = false; isRotating = false; rotateStart = null; isDragging = false;
  canvas.style.cursor = 'crosshair'; render();
});
canvas.addEventListener('mouseleave', () => {
  isScaling = false; isRotating = false; rotateStart = null; isDragging = false;
  isHoveringCenter = false; isHoveringScaleCrn = false; canvas.style.cursor = 'crosshair'; render();
});

/* ── Tactile (mobile) ── */
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  const pos = canvasPos(t.clientX, t.clientY);
  if (hitTestScaleCornerTouch(pos.x, pos.y)) {
    isScaling = true;
    render();
  } else if (hitTestRotateTouch(pos.x, pos.y)) {
    isRotating = true;
    isHoveringCenter = true;
    rotateStart = { prevTheta: Math.atan2(pos.y - cur.cy, pos.x - cur.cx) };
    render();
  } else if (hitTest(pos.x, pos.y)) {
    isDragging = true;
    dragOff = { x: pos.x - cur.cx, y: pos.y - cur.cy };
    render();
  }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (!isScaling && !isRotating && !isDragging) return;
  e.preventDefault();
  const t = e.touches[0];
  const pos = canvasPos(t.clientX, t.clientY);
  if (isScaling) {
    applyScaleFromDist(Math.hypot(pos.x - cur.cx, pos.y - cur.cy));
    render();
  } else if (isRotating) {
    const theta = Math.atan2(pos.y - cur.cy, pos.x - cur.cx);
    let d = theta - rotateStart.prevTheta;
    if (d > Math.PI)  d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    cur.rotation = snapRotation(cur.rotation + d * 180 / Math.PI);
    rotateStart.prevTheta = theta;
    render();
  } else {
    cur.cx = snapToGrid(pos.x - dragOff.x);
    cur.cy = snapToGrid(pos.y - dragOff.y);
    updatePosLabel(); render();
  }
}, { passive: false });
canvas.addEventListener('touchend',    () => { isScaling = false; isRotating = false; rotateStart = null; isDragging = false; isHoveringCenter = false; render(); });
canvas.addEventListener('touchcancel', () => { isScaling = false; isRotating = false; rotateStart = null; isDragging = false; isHoveringCenter = false; render(); });

/* ── Zoom sur le canvas de la fractale (maintien pour zoomer) ── */
const ZOOM_IN_F  = 1.08;
const ZOOM_OUT_F = 1 / 1.08;
let zoomInterval = null;

function stopZoom() {
  if (zoomInterval) { clearInterval(zoomInterval); zoomInterval = null; }
}

fractalCanvas.addEventListener('mousedown', e => {
  if (!iterBitmap) return;
  e.preventDefault();
  if (e.detail >= 2) {          // double-clic → réinitialisation
    stopZoom();
    resetZoom(); renderFractal(); updateCanvasInfo();
    return;
  }
  const factor = e.button === 2 ? ZOOM_OUT_F : ZOOM_IN_F;
  const rect = fractalCanvas.getBoundingClientRect();
  const nx = (e.clientX - rect.left) / rect.width;
  const ny = (e.clientY - rect.top)  / rect.height;
  stopZoom();
  doZoom(nx, ny, factor); renderFractal(); updateCanvasInfo();
  zoomInterval = setInterval(() => {
    doZoom(nx, ny, factor); renderFractal(); updateCanvasInfo();
  }, 80);
});
document.addEventListener('mouseup', stopZoom);
fractalCanvas.addEventListener('contextmenu', e => e.preventDefault());

fractalSVG.addEventListener('mousedown', e => {
  if (!svgLeaves) return;
  e.preventDefault();
  if (e.detail >= 2) { stopZoom(); resetZoom(); renderFractal(); updateCanvasInfo(); return; }
  const factor = e.button === 2 ? ZOOM_OUT_F : ZOOM_IN_F;
  const rect = fractalSVG.getBoundingClientRect();
  const nx = (e.clientX - rect.left) / rect.width;
  const ny = (e.clientY - rect.top)  / rect.height;
  stopZoom();
  doZoom(nx, ny, factor); renderFractal(); updateCanvasInfo();
  zoomInterval = setInterval(() => {
    doZoom(nx, ny, factor); renderFractal(); updateCanvasInfo();
  }, 80);
});
fractalSVG.addEventListener('contextmenu', e => e.preventDefault());

/* ── Mode Bitmap / Vectoriel ── */
document.getElementById('salon-mode-bitmap').addEventListener('click', () => {
  if (renderMode === 'bitmap') return;
  renderMode = 'bitmap';
  document.getElementById('salon-mode-bitmap').classList.add('salon-mode-active');
  document.getElementById('salon-mode-svg').classList.remove('salon-mode-active');
  fractalCanvas.style.display = '';
  fractalSVG.style.display = 'none';
  document.getElementById('salon-res-select').disabled = false;
  document.getElementById('salon-btn-save-png').textContent = '↓ Enregistrer PNG';
  svgLeaves = null; resetIter();
});
document.getElementById('salon-mode-svg').addEventListener('click', () => {
  if (renderMode === 'svg') return;
  renderMode = 'svg';
  document.getElementById('salon-mode-svg').classList.add('salon-mode-active');
  document.getElementById('salon-mode-bitmap').classList.remove('salon-mode-active');
  fractalCanvas.style.display = 'none';
  fractalSVG.style.display = '';
  fractalSVG.setAttribute('width', displayR);
  fractalSVG.setAttribute('height', displayR);
  document.getElementById('salon-res-select').disabled = true;
  document.getElementById('salon-btn-save-png').textContent = '↓ Enregistrer SVG';
  iterBitmap = null; resetIter();
});


/* ── Boutons de symétrie ── */
document.querySelectorAll('.salon-sym-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.salon-sym-btn').forEach(b => b.classList.remove('salon-sym-active'));
    btn.classList.add('salon-sym-active');
    cur.flip = btn.dataset.sym;
    render();
  })
);

/* ── Steppers numérateur ── */
function applyNumerator(delta) {
  const next = curNumerator + delta;
  if (next < 1 || next >= curDenominator) return;
  curNumerator = next;
  SCALE = curNumerator / curDenominator;
  H = SCALE / 2;
  cur.scale = SCALE; cur.sn = curNumerator; cur.sd = curDenominator;
  cur.cx = snapToGrid(cur.cx); cur.cy = snapToGrid(cur.cy);
  updateScaleDisplay(); updatePosLabel(); render();
}
document.getElementById('salon-scale-num-dec').addEventListener('click', () => applyNumerator(-1));
document.getElementById('salon-scale-num-inc').addEventListener('click', () => applyNumerator(+1));


/* ── Ajouter / Mettre à jour ── */
const btnAdd = document.getElementById('salon-btn-add');
btnAdd.addEventListener('click', () => {
  if (editingIndex === -1) {
    transforms.push({ ...cur });
  } else {
    transforms[editingIndex] = { ...cur };
    editingIndex = -1;
    btnAdd.textContent = '+ Ajouter';
  }
  if (transforms.length === 1) { setDefaultResolution(); lockScale(); }
  resetIter(); refreshList(); render();
});

/* ── Libellé du facteur d'échelle ── */
function scaleLabel(t) {
  const sn = t.sn !== undefined ? t.sn : 1;
  const sd = t.sd !== undefined ? t.sd : (t.scale ? Math.round(1 / t.scale) : 2);
  return `${sn}/${sd}`;
}

/* ── Liste des transformations ── */
/* ── Édition d'une transformation : annuler, et ramener le canevas à l'écran ── */
function arreterEdition() {
  editingIndex = -1; btnAdd.textContent = '+ Ajouter';
  refreshList(); render();
}
function montrerDefinition() {
  // le carré vert à déplacer et le bouton « Mettre à jour » doivent être visibles
  const r = canvas.getBoundingClientRect();
  const entete = document.querySelector('.site-header');
  const haut = entete ? entete.getBoundingClientRect().bottom : 0;
  if (r.top < haut || r.top > window.innerHeight * 0.5) {
    const doux = !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    (document.getElementById('salon-titre-def') || canvas).scrollIntoView({ behavior: doux ? 'smooth' : 'auto', block: 'start' });
  }
}
function refreshList() {
  const list  = document.getElementById('salon-list');
  const hint  = document.getElementById('salon-empty-hint');
  document.getElementById('salon-count').textContent = transforms.length;
  hint.style.display = transforms.length === 0 ? '' : 'none';
  list.innerHTML = '';
  transforms.forEach((t, i) => {
    const pal = PALETTE[i % PALETTE.length];
    const div = document.createElement('div');
    div.className = 'salon-t-item' + (i === editingIndex ? ' salon-t-editing' : '');
    div.style.borderLeftColor = pal.border;
    div.innerHTML = `
      <div class="salon-t-label" style="color:${pal.border}">T${i+1}</div>
      <div class="salon-t-info">s = ${scaleLabel(t)} &nbsp;·&nbsp; rot = ${t.rotation}°${t.flip !== 'none' ? ' &nbsp;·&nbsp; ' + t.flip : ''}<br>c = (${t.cx.toFixed(3)}, ${t.cy.toFixed(3)})</div>
      <div class="salon-t-actions">
        <button class="salon-btn-edit" data-action="edit" data-i="${i}">${i === editingIndex ? 'Annuler' : 'Éditer'}</button>
        <button class="salon-btn-del"  data-action="del"  data-i="${i}">✕</button>
      </div>`;
    div.querySelector('[data-action=edit]').addEventListener('click', () => {
      if (editingIndex === i) { arreterEdition(); return; }   // second clic : annuler
      editingIndex = i; cur = { ...transforms[i] };
      document.querySelectorAll('.salon-sym-btn').forEach(b =>
        b.classList.toggle('salon-sym-active', b.dataset.sym === cur.flip)
      );
      curNumerator   = cur.sn !== undefined ? cur.sn : 1;
      curDenominator = cur.sd !== undefined ? cur.sd : (cur.scale ? Math.round(1 / cur.scale) : 2);
      SCALE = curNumerator / curDenominator;
      SCALE_GRID = 1 / curDenominator;
      H = SCALE / 2;
      updateScaleDisplay();
      btnAdd.textContent = `✓ Mettre à jour T${i+1}`;
      updatePosLabel(); refreshList(); render();
      montrerDefinition();
    });
    div.querySelector('[data-action=del]').addEventListener('click', () => {
      if (editingIndex === i) { editingIndex = -1; btnAdd.textContent = '+ Ajouter'; }
      else if (editingIndex > i) editingIndex--;
      transforms.splice(i, 1);
      if (transforms.length === 0) unlockScale();
      resetIter(); refreshList(); render();
    });
    list.appendChild(div);
  });
}

/* ── Boutons d'itération ── */
document.getElementById('salon-btn-init').addEventListener('click', initIter);
document.getElementById('salon-btn-iter1').addEventListener('click', () => doIter(1));
document.getElementById('salon-btn-iter5').addEventListener('click', () => doIter(5));

/* ── Changement de résolution ── */
document.getElementById('salon-res-select').addEventListener('change', function () {
  const newR = parseInt(this.value);
  if (newR !== R) { R = newR; resetIter(); updateCanvasInfo(); }
});

/* ── Réinitialiser tout ── */
document.getElementById('salon-btn-reset').addEventListener('click', () => {
  transforms = []; editingIndex = -1;
  curNumerator = 1; curDenominator = 2;
  SCALE = 0.5; SCALE_GRID = 0.5; H = 0.25;
  cur = { cx: H, cy: H, rotation: 0, flip: 'none', scale: SCALE, sn: 1, sd: 2 };
  document.querySelectorAll('.salon-sym-btn').forEach(b =>
    b.classList.toggle('salon-sym-active', b.dataset.sym === 'none')
  );
  btnAdd.textContent = '+ Ajouter';
  unlockScale();
  updateScaleDisplay();
  R = SCALE_OPTIONS[getScaleKey()].defaultR;
  populateResolutionSelect();
  resizeFractalCanvas();
  resetIter(); updatePosLabel(); refreshList(); render(); updateCanvasInfo();
});

/* ── Enregistrer PNG ── */
document.getElementById('salon-btn-save-png').addEventListener('click', () => {
  if (renderMode === 'svg') {
    if (!svgLeaves) { alert('Aucune fractale à enregistrer. Lancez d\'abord une itération.'); return; }
    const clone = fractalSVG.cloneNode(true);
    clone.removeAttribute('style');
    const svgData = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `ifs-fractale-iter${iterCount}.svg`;
    a.href = url; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else {
    if (!iterBitmap) { alert('Aucune fractale à enregistrer. Lancez d\'abord une itération.'); return; }
    const a = document.createElement('a');
    a.download = `ifs-fractale-iter${iterCount}.png`;
    a.href = offCanvas.toDataURL('image/png');
    a.click();
  }
});

/* ── Sérialisation de l'état ── */
function serializeState() {
  return btoa(JSON.stringify({
    t: transforms.map(t => ({
      x: +t.cx.toFixed(4), y: +t.cy.toFixed(4), r: t.rotation, f: t.flip,
      s: t.scale !== undefined ? t.scale : 0.5,
      sn: t.sn !== undefined ? t.sn : 1,
      sd: t.sd !== undefined ? t.sd : Math.round(1 / (t.scale || 0.5)),
    })),
    R, n: iterCount,
  }));
}
function getShareUrl() {
  return window.location.href.split('#')[0] + '#' + serializeState();
}

/* ── Copier le lien ── */
document.getElementById('salon-btn-copy-link').addEventListener('click', () => {
  if (transforms.length === 0) { alert('Ajoutez au moins une transformation d\'abord.'); return; }
  const url = getShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('salon-btn-copy-link');
    const orig = btn.textContent;
    btn.textContent = '✓ Copié !';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  }).catch(() => { prompt('Copiez ce lien :', url); });
});

/* ── Partager par courriel ── */
document.getElementById('salon-btn-share-email').addEventListener('click', () => {
  if (transforms.length === 0) { alert('Ajoutez au moins une transformation d\'abord.'); return; }
  const url = getShareUrl();
  const subject = encodeURIComponent('Fractale IFS — lien interactif');
  const body = encodeURIComponent(
    'Bonjour,\n\n' +
    'Voici une fractale IFS que je souhaitais vous partager.\n' +
    'Cliquez sur le lien suivant pour restaurer la fractale exacte (transformations, résolution et itérations) :\n\n' +
    url + '\n\n' +
    'Vous pouvez aussi visiter directement la page du générateur à l\'adresse :\n' +
    'https://www.mathopo.ca/fr/ifs-salon\n\n' +
    'Cordialement'
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
});

/* ── Restaurer l'état depuis le hash de l'URL ── */
function restoreFromHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  try {
    const s = JSON.parse(atob(hash));
    if (!Array.isArray(s.t) || s.t.length === 0) return;
    transforms = s.t.map(t => ({
      cx: t.x, cy: t.y, rotation: t.r, flip: t.f,
      scale: t.s !== undefined ? t.s : 0.5,
      sn: t.sn !== undefined ? t.sn : 1,
      sd: t.sd !== undefined ? t.sd : Math.round(1 / (t.s || 0.5)),
    }));
    curNumerator   = transforms[0].sn !== undefined ? transforms[0].sn : 1;
    curDenominator = transforms[0].sd !== undefined ? transforms[0].sd : Math.round(1 / (transforms[0].scale || 0.5));
    SCALE = curNumerator / curDenominator;
    SCALE_GRID = 1 / curDenominator;
    H = SCALE / 2;
    cur.scale = SCALE; cur.sn = curNumerator; cur.sd = curDenominator;
    updateScaleDisplay();
    const validPowers = SCALE_OPTIONS[getScaleKey()].powers;
    R = validPowers.includes(s.R) ? s.R : SCALE_OPTIONS[getScaleKey()].defaultR;
    populateResolutionSelect();
    resizeFractalCanvas();
    lockScale();
    refreshList(); render(); updateCanvasInfo();
    if (s.n > 0) doIter(Math.min(s.n, 20));
  } catch (e) { /* hash invalide, ignoré */ }
}

/* ── Tutoriel ── */
const TUTO = [
  { title: 'Visite guidée — Triangle de Sierpiński',
    text: 'On va construire un triangle de Sierpiński avec 3 applications contractantes au facteur ½. Le canvas est réinitialisé — le facteur courant (s = 1/2) est affiché en mauve dans le panneau.',
    hl: ['#salon-scale-display'] },
  { title: 'Étape 1 — Première transformation',
    text: 'Le carré vert est positionné au coin inférieur gauche (0.25, 0.25) — c\'est la carte T1. Cliquez sur le bouton "+ Ajouter" mis en évidence pour l\'enregistrer.',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Étape 2 — Deuxième transformation',
    text: 'T1 est enregistrée. Cliquez sur le nouveau carré vert apparu en dessous, puis glissez-le vers le coin inférieur droit (flèche orange) et cliquez « + Ajouter ».',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Étape 3 — Troisième transformation',
    text: 'T2 est enregistrée. Cliquez sur le nouveau carré vert apparu en dessous, puis glissez-le vers le coin supérieur gauche (flèche orange) et cliquez « + Ajouter ».',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Étape 4 — Initialiser',
    text: 'Les 3 transformations sont définies — vérifiez la liste. Cliquez sur le bouton "⊙ Init" mis en évidence pour remplir le canvas fractal d\'un carré unité plein.',
    hl: ['#salon-btn-init'] },
  { title: 'Étape 5 — Itérer',
    text: 'Le canvas fractal affiche un carré plein. Cliquez sur "Itérer ×1" pour appliquer les 3 cartes. Continuez à cliquer pour voir le triangle de Sierpiński émerger !',
    hl: ['#salon-btn-iter1', '#salon-btn-iter5'] },
  { title: 'Explorez !',
    text: 'Le triangle est apparu ! Maintenez le clic gauche sur la fractale pour zoomer. Modifiez les transformations ou ajoutez-en de nouvelles pour créer votre propre fractale IFS.',
    hl: ['#salon-fractal-canvas'] },
  { title: 'Pour aller plus loin — Fractale avec rotations',
    text: 'Construisons une nouvelle fractale au facteur ½ qui utilise des rotations. Passez la souris sur le centre du carré vert pour faire apparaître l\'anneau et le point de rotation.',
    hl: ['#salon-canvas'] },
  { title: 'Transformation 1 — Coin inférieur gauche, 0°',
    text: 'Le carré est positionné au coin inférieur gauche (0.25, 0.25) sans rotation — le point sur l\'anneau est à l\'horizontale (3 heures). Cliquez « + Ajouter » pour enregistrer T1.',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Transformation 2 — Coin supérieur gauche, 270°',
    text: 'Le carré s\'est déplacé au coin supérieur gauche (flèche orange). Survolez son centre pour faire apparaître l\'anneau, saisissez le point et faites-le glisser dans le sens anti-horaire jusqu\'à afficher 270°. Cliquez ensuite « + Ajouter ».',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Transformation 3 — Coin inférieur droit, 90°',
    text: 'Le carré s\'est déplacé au coin inférieur droit (flèche orange). Faites de même : survolez le centre, saisissez le point sur l\'anneau et faites-le glisser dans le sens anti-horaire jusqu\'à afficher 90°. Cliquez « + Ajouter ».',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Générer la fractale',
    text: 'Les 3 transformations avec rotations sont définies. Cliquez « Itérer ×1 » ou « Itérer ×5 » pour voir émerger la fractale !',
    hl: ['#salon-btn-iter1', '#salon-btn-iter5'] },
  { title: 'Tutoriel 3 — Facteur d\'échelle',
    text: 'Construisons une fractale avec le facteur 1/3 puis un multiple 2/3. Observez le petit carré mauve au coin inférieur droit du carré vert — c\'est le curseur d\'échelle. Glissez-le vers le bas à droite pour choisir 1/3.',
    hl: ['#salon-scale-display', '#salon-canvas'] },
  { title: 'Facteur 1/3 sélectionné — T1 : coin inférieur gauche',
    text: 'Le facteur est réglé à 1/3. Le carré est au coin inférieur gauche. Cliquez « + Ajouter » pour enregistrer T1 — le facteur sera verrouillé.',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Transformation 2 — Centre bas',
    text: 'T1 enregistré. Glissez le carré vers le centre de la rangée du bas (flèche orange) et cliquez « + Ajouter ».',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Transformation 3 — Coin inférieur droit',
    text: 'T2 enregistré. Glissez le carré vers le coin inférieur droit (flèche orange) et cliquez « + Ajouter ».',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Augmenter le numérateur à 2',
    text: 'Les 3 transformations à 1/3 sont définies. Cliquez sur le bouton « + » à côté de l\'affichage du facteur d\'échelle pour passer à 2/3 — le carré vert grossira.',
    hl: ['#salon-scale-display', '#salon-scale-num-inc'] },
  { title: 'T4 — Coin bas droit',
    text: 'Le carré est maintenant de taille 2/3 (flèche orange). Glissez-le vers le coin inférieur droit — le plus bas à droite possible — puis cliquez « + Ajouter ».',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Générer la fractale',
    text: 'Les 4 transformations sont définies (3 × 1/3 + 1 × 2/3). Cliquez « Itérer ×1 » ou « Itérer ×5 » pour voir émerger la fractale !',
    hl: ['#salon-btn-iter1', '#salon-btn-iter5'] }
];
const TUTO_RANGES = [
  { start: 0,  end: 6  },
  { start: 7,  end: 11 },
  { start: 12, end: 18 },
];
function tutoRangeOf(step) {
  return TUTO_RANGES.find(r => step >= r.start && step <= r.end) || TUTO_RANGES[0];
}
let tutoStep = -1;
let tutoAutoHook = null, tutoAutoTargets = [];
let tutoArrow = null;

function tutoHighlight(sels) {
  document.querySelectorAll('.salon-tuto-highlight').forEach(el => el.classList.remove('salon-tuto-highlight'));
  (sels || []).forEach(sel => document.querySelectorAll(sel).forEach(el => el.classList.add('salon-tuto-highlight')));
}

function clearTutoAuto() {
  if (tutoAutoHook) tutoAutoTargets.forEach(t => t.removeEventListener('click', tutoAutoHook));
  tutoAutoHook = null; tutoAutoTargets = [];
}

function setTutoAuto(ids, nextStep, delay) {
  clearTutoAuto();
  tutoAutoHook = () => { clearTutoAuto(); if (tutoStep >= 0) setTimeout(() => tutoShow(nextStep), delay); };
  tutoAutoTargets = ids.map(id => document.getElementById(id)).filter(Boolean);
  tutoAutoTargets.forEach(t => t.addEventListener('click', tutoAutoHook));
}

function tutoApply(step) {
  tutoArrow = null;
  const T = [
    { cx: 0.25, cy: 0.25, rotation: 0, flip: 'none', scale: 0.5 },
    { cx: 0.75, cy: 0.25, rotation: 0, flip: 'none', scale: 0.5 },
    { cx: 0.25, cy: 0.75, rotation: 0, flip: 'none', scale: 0.5 },
  ];
  function syncButtons() {
    document.querySelectorAll('.salon-sym-btn').forEach(b =>
      b.classList.toggle('salon-sym-active', b.dataset.sym === 'none'));
    curNumerator = 1; curDenominator = 2; SCALE_GRID = 0.5;
    updateScaleDisplay();
  }
  const R2 = [
    { cx: 0.25, cy: 0.25, rotation: 0,   flip: 'none', scale: 0.5 },
    { cx: 0.25, cy: 0.75, rotation: 270, flip: 'none', scale: 0.5 },
    { cx: 0.75, cy: 0.25, rotation: 90,  flip: 'none', scale: 0.5 },
  ];
  const S1 = { cx: 1/6, cy: 1/6, rotation: 0, flip: 'none', scale: 1/3, sn: 1, sd: 3 };
  const S2 = { cx: 0.5, cy: 1/6, rotation: 0, flip: 'none', scale: 1/3, sn: 1, sd: 3 };
  const S3 = { cx: 5/6, cy: 1/6, rotation: 0, flip: 'none', scale: 1/3, sn: 1, sd: 3 };
  const S4 = { cx: 2/3, cy: 2/3, rotation: 0, flip: 'none', scale: 2/3, sn: 2, sd: 3 };
  function place(t) {
    curNumerator = t.sn !== undefined ? t.sn : 1;
    curDenominator = t.sd !== undefined ? t.sd : 2;
    SCALE = curNumerator / curDenominator; SCALE_GRID = 1 / curDenominator; H = SCALE / 2;
    cur = { ...t, sn: curNumerator, sd: curDenominator, scale: SCALE };
    document.querySelectorAll('.salon-sym-btn').forEach(b =>
      b.classList.toggle('salon-sym-active', b.dataset.sym === (t.flip || 'none')));
    updateScaleDisplay();
    updatePosLabel(); render();
  }
  function setList(list) {
    transforms = list.map(t => ({ ...t })); editingIndex = -1; btnAdd.textContent = '+ Ajouter';
    if (transforms.length === 0) unlockScale(); else { setDefaultResolution(); lockScale(); }
    refreshList();
  }
  if (step === 0) {
    curNumerator = 1; curDenominator = 2; SCALE = 0.5; SCALE_GRID = 0.5; H = 0.25;
    R = SCALE_OPTIONS[2].defaultR;
    populateResolutionSelect(); resizeFractalCanvas(); syncButtons();
    setList([]); resetZoom(); resetIter(); place(T[0]); renderFractal(); updateCanvasInfo();
  } else if (step === 1) { setList([]);              resetZoom(); resetIter(); place(T[0]); }
  else if (step === 2) {
    tutoArrow = { fx: T[0].cx, fy: T[0].cy, tx: T[1].cx, ty: T[1].cy };
    setList([T[0]]); resetZoom(); resetIter(); place(T[0]);
  }
  else if (step === 3) {
    tutoArrow = { fx: T[1].cx, fy: T[1].cy, tx: T[2].cx, ty: T[2].cy };
    setList([T[0], T[1]]); resetZoom(); resetIter(); place(T[1]);
  }
  else if (step === 4)   { setList([T[0], T[1], T[2]]); resetZoom(); resetIter(); place(T[2]); }
  else if (step === 5)   { setList([T[0], T[1], T[2]]); place(T[2]); initIter(); }
  else if (step === 6)   { setList([T[0], T[1], T[2]]); place(T[2]); renderFractal(); if (iterCount === 0) { initIter(); doIter(5); } }
  else if (step === 7) {
    curNumerator = 1; curDenominator = 2; SCALE = 0.5; SCALE_GRID = 0.5; H = 0.25;
    R = SCALE_OPTIONS[2].defaultR;
    populateResolutionSelect(); resizeFractalCanvas(); syncButtons();
    setList([]); resetZoom(); resetIter(); place(R2[0]); renderFractal(); updateCanvasInfo();
  }
  else if (step === 8)  { setList([]);       resetZoom(); resetIter(); place(R2[0]); }
  else if (step === 9) {
    tutoArrow = { fx: R2[0].cx, fy: R2[0].cy, tx: R2[1].cx, ty: R2[1].cy };
    setList([R2[0]]); resetZoom(); resetIter(); place({ ...R2[1], rotation: 0 });
  }
  else if (step === 10) {
    tutoArrow = { fx: R2[1].cx, fy: R2[1].cy, tx: R2[2].cx, ty: R2[2].cy };
    setList([R2[0], R2[1]]); resetZoom(); resetIter(); place({ ...R2[2], rotation: 0 });
  }
  else if (step === 11) {
    setList([R2[0], R2[1], R2[2]]); resetZoom(); resetIter(); place(R2[2]); initIter();
  }
  else if (step === 12) {
    curNumerator = 1; curDenominator = 2; SCALE = 0.5; SCALE_GRID = 0.5; H = 0.25;
    R = SCALE_OPTIONS[2].defaultR;
    populateResolutionSelect(); resizeFractalCanvas(); syncButtons();
    setList([]); resetZoom(); resetIter();
    place({ cx: 0.5, cy: 0.5, rotation: 0, flip: 'none', scale: 0.5, sn: 1, sd: 2 });
    renderFractal(); updateCanvasInfo();
  }
  else if (step === 13) {
    curNumerator = 1; curDenominator = 3; SCALE = 1/3; SCALE_GRID = 1/3; H = 1/6;
    R = SCALE_OPTIONS[3].defaultR;
    populateResolutionSelect(); resizeFractalCanvas();
    setList([]); resetZoom(); resetIter(); place(S1); updateCanvasInfo();
  }
  else if (step === 14) {
    curNumerator = 1; curDenominator = 3; SCALE_GRID = 1/3;
    tutoArrow = { fx: S1.cx, fy: S1.cy, tx: S2.cx, ty: S2.cy };
    setList([S1]); resetZoom(); resetIter(); place(S1);
  }
  else if (step === 15) {
    curNumerator = 1; curDenominator = 3; SCALE_GRID = 1/3;
    tutoArrow = { fx: S2.cx, fy: S2.cy, tx: S3.cx, ty: S3.cy };
    setList([S1, S2]); resetZoom(); resetIter(); place(S2);
  }
  else if (step === 16) {
    curNumerator = 1; curDenominator = 3; SCALE_GRID = 1/3;
    setList([S1, S2, S3]); resetZoom(); resetIter(); place(S3);
  }
  else if (step === 17) {
    curNumerator = 2; curDenominator = 3; SCALE_GRID = 1/3;
    tutoArrow = { fx: 2/3, fy: 1/3, tx: 2/3, ty: 2/3 };
    setList([S1, S2, S3]); resetZoom(); resetIter();
    place({ cx: 2/3, cy: 1/3, rotation: 0, flip: 'none', scale: 2/3, sn: 2, sd: 3 });
  }
  else if (step === 18) {
    curNumerator = 2; curDenominator = 3; SCALE_GRID = 1/3;
    setList([S1, S2, S3, S4]); resetZoom(); resetIter(); place(S4); initIter();
  }
}

function tutoShow(step) {
  tutoStep = step;
  const s = TUTO[step];
  const range = tutoRangeOf(step);
  const tutoNum = TUTO_RANGES.indexOf(range) + 1;
  const localStep = step - range.start + 1;
  const totalSteps = range.end - range.start + 1;
  document.getElementById('salon-tuto-step').textContent = `Tutoriel ${tutoNum} — Étape ${localStep} sur ${totalSteps}`;
  document.getElementById('salon-tuto-fill').style.width = `${localStep / totalSteps * 100}%`;
  document.getElementById('salon-tuto-title').textContent = s.title;
  document.getElementById('salon-tuto-text').textContent  = s.text;
  document.getElementById('salon-tuto-prev').disabled = (step === range.start);
  document.getElementById('salon-tuto-next').textContent = (step === range.end) ? 'Terminer' : 'Suivant →';
  document.getElementById('salon-tuto-panel').style.display = '';
  tutoApply(step);
  tutoHighlight(s.hl);
  clearTutoAuto();
  const autoMap = {
    1:  { ids: ['salon-btn-add'],  next: 2,  d: 400 },
    2:  { ids: ['salon-btn-add'],  next: 3,  d: 400 },
    3:  { ids: ['salon-btn-add'],  next: 4,  d: 400 },
    4:  { ids: ['salon-btn-init'], next: 5,  d: 400 },
    5:  { ids: ['salon-btn-iter1', 'salon-btn-iter5'], next: 6, d: 1500 },
    8:  { ids: ['salon-btn-add'],  next: 9,  d: 400 },
    9:  { ids: ['salon-btn-add'],  next: 10, d: 400 },
    10: { ids: ['salon-btn-add'],  next: 11, d: 400 },
    13: { ids: ['salon-btn-add'],  next: 14, d: 400 },
    14: { ids: ['salon-btn-add'],  next: 15, d: 400 },
    15: { ids: ['salon-btn-add'],        next: 16, d: 400 },
    16: { ids: ['salon-scale-num-inc'], next: 17, d: 400 },
    17: { ids: ['salon-btn-add'],        next: 18, d: 400 },
  };
  if (autoMap[step]) { const { ids, next, d } = autoMap[step]; setTutoAuto(ids, next, d); }
}
function tutoHide() {
  tutoStep = -1;
  document.getElementById('salon-tuto-panel').style.display = 'none';
  tutoHighlight([]);
  clearTutoAuto();
  tutoArrow = null; render();
}

document.getElementById('salon-btn-tuto1').addEventListener('click', () => tutoShow(0));
document.getElementById('salon-btn-tuto2').addEventListener('click', () => tutoShow(7));
document.getElementById('salon-btn-tuto3').addEventListener('click', () => tutoShow(12));
document.getElementById('salon-tuto-close').addEventListener('click', tutoHide);
document.getElementById('salon-tuto-prev').addEventListener('click', () => {
  const range = tutoRangeOf(tutoStep);
  if (tutoStep > range.start) tutoShow(tutoStep - 1);
});
document.getElementById('salon-tuto-next').addEventListener('click', () => {
  const range = tutoRangeOf(tutoStep);
  if (tutoStep < range.end) tutoShow(tutoStep + 1);
  else tutoHide();
});

/* ── Initialisation ── */
populateResolutionSelect();
resizeFractalCanvas();
updateScaleDisplay();
updatePosLabel(); updateIterLabel(); updateCanvasInfo(); refreshList(); render(); renderFractal();
restoreFromHash();

})();
</script>
