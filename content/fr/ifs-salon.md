---
page_title: "Générateur IFS — Salon"
nav: "research"
wide: true
---

<h1>Générateur IFS — Transformations affines visuelles</h1>
<p class="subtitle">
  Construisez un IFS par des transformations affines contractantes
  \( f_i(\mathbf{x}) = s\,R_\theta\,\mathbf{x} + \mathbf{b}_i \)
  en positionnant et orientant les copies du carré unité à la souris.
</p>

<!-- ═══════════════════════════════════════════════════════════
     APPLICATION
════════════════════════════════════════════════════════════ -->
<div class="salon-app">

  <!-- ── Panneau de contrôle ───────────────────────────────── -->
  <aside class="salon-sidebar">

    <button class="salon-btn salon-btn-tuto" id="salon-btn-tuto">? Tutoriel</button>

    <div class="mr-panel">
      <h2>Transformation courante</h2>
      <div class="salon-scale-group">
        <button class="salon-scale-btn salon-scale-active" id="salon-scale-half" data-scale="0.5">1/2</button>
        <button class="salon-scale-btn" data-scale="0.3333333333333333">1/3</button>
        <button class="salon-scale-btn" data-scale="0.25">1/4</button>
      </div>

      <div class="salon-sym-group">
        <button class="salon-sym-btn salon-sym-active" data-sym="none">Sans miroir</button>
        <button class="salon-sym-btn" data-sym="H">Miroir H</button>
        <button class="salon-sym-btn" data-sym="V">Miroir V</button>
      </div>
      <div id="salon-pos" class="salon-pos-label">centre : (0.250, 0.250)</div>
      <button class="salon-btn salon-btn-primary" id="salon-btn-add">+ Ajouter</button>
    </div>

    <div class="mr-panel">
      <h2>Transformations (<span id="salon-count">0</span>)</h2>
      <div id="salon-list"></div>
      <p id="salon-empty-hint" class="salon-hint" style="margin:0;">
        Glissez le carré, choisissez une rotation, puis cliquez <em>Ajouter</em>.
      </p>
    </div>

    <div class="mr-panel">
      <h2>Itérations</h2>
      <div class="salon-res-row">
        <label for="salon-res-select">Résolution :</label>
        <select id="salon-res-select" class="salon-res-select">
          <option value="512" selected>512 px</option>
        </select>
      </div>
      <div class="salon-mode-row">
        <button class="salon-mode-btn salon-mode-active" id="salon-mode-bitmap">Bitmap</button>
        <button class="salon-mode-btn" id="salon-mode-svg">Vectoriel</button>
      </div>
      <div class="salon-iter-row">
        <button class="salon-btn" id="salon-btn-init">⊙ Init</button>
        <button class="salon-btn salon-btn-primary" id="salon-btn-iter1">Itérer ×1</button>
        <button class="salon-btn salon-btn-primary" id="salon-btn-iter5">Itérer ×5</button>
      </div>
      <p id="salon-iter-label" class="salon-iter-label">Itération : —</p>
      <span id="salon-computing" class="salon-computing">calcul en cours…</span>
    </div>

    <button class="salon-btn salon-btn-save" id="salon-btn-save-png">↓ Enregistrer PNG</button>
    <button class="salon-btn salon-btn-link" id="salon-btn-copy-link">⎘ Copier le lien</button>
    <button class="salon-btn salon-btn-link" id="salon-btn-share-email">✉ Partager par courriel</button>
    <button class="salon-btn salon-btn-danger" id="salon-btn-reset">⊗ Réinitialiser tout</button>

  </aside>

  <!-- ── Zone canvas ───────────────────────────────────────── -->
  <div class="salon-canvas-col" id="salon-canvas-col">

    <p class="salon-canvas-label">Définition des transformations</p>
    <canvas id="salon-canvas"></canvas>
    <p class="salon-hint">
      Glissez le carré vert · arête verte = repère de rotation ·
      Le point vert est l'image du coin&nbsp;(1,&nbsp;1).
    </p>

    <p class="salon-canvas-label" style="margin-top:14px;">Fractale IFS</p>
    <canvas id="salon-fractal-canvas"></canvas>
    <svg id="salon-fractal-svg" style="display:none;" viewBox="0 0 1 1"></svg>
    <p class="salon-hint" id="salon-canvas-info"></p>
    <p class="salon-hint">Clic gauche : zoom + &nbsp;·&nbsp; Clic droit : zoom − &nbsp;·&nbsp; Double-clic : réinitialiser le zoom</p>

  </div>

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
.salon-app {
  display: flex; gap: 18px; align-items: flex-start; margin-top: 18px;
}
@media (max-width: 860px) {
  .salon-app        { flex-direction: column; }
  .salon-canvas-col { order: -1; }
  .salon-sidebar    { order: 1; width: 100%; min-width: 0; }
}
.salon-sidebar    { width: 260px; min-width: 260px; flex-shrink: 0; }
.salon-canvas-col { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; }

#salon-canvas {
  display: block; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px;
  cursor: crosshair; max-width: 100%;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}
#salon-fractal-canvas {
  display: block; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px;
  cursor: zoom-in; max-width: 100%;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
.salon-canvas-label {
  font-size: 0.82rem; font-weight: 700; color: #444;
  text-transform: uppercase; letter-spacing: 0.04em;
  margin: 0; align-self: flex-start;
}


/* Facteur d'échelle */
.salon-scale-group { display: flex; gap: 5px; margin-bottom: 6px; }
.salon-scale-btn {
  flex: 1; padding: 6px 4px; font-family: inherit; font-size: 0.82rem;
  font-weight: 600; border: 1px solid #bbb; border-radius: 6px;
  background: #fff; color: #555; cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.salon-scale-btn:hover               { background: #f0f0f0; }
.salon-scale-btn.salon-scale-active  { background: #4a1a8a; border-color: #370d6e; color: #fff; }
.salon-scale-btn:disabled            { opacity: 0.45; cursor: not-allowed; }

/* Symétrie */
.salon-sym-group { display: flex; gap: 5px; margin-bottom: 10px; }
.salon-sym-btn {
  flex: 1; padding: 6px 4px; font-family: inherit; font-size: 0.80rem;
  font-weight: 600; border: 1px solid #bbb; border-radius: 6px;
  background: #fff; color: #555; cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.salon-sym-btn:hover            { background: #f0f0f0; }
.salon-sym-btn.salon-sym-active { background: #7a3b0b; border-color: #5e2d08; color: #fff; }

/* Boutons */
.salon-btn {
  display: block; width: 100%; padding: 7px 12px;
  font-family: inherit; font-size: 0.88rem; font-weight: 600;
  border: 1px solid #bbb; border-radius: 6px;
  background: #fff; color: #222; cursor: pointer; text-align: center;
  transition: background 0.12s, border-color 0.12s;
}
.salon-btn:hover           { background: #f0f0f0; }
.salon-btn-primary         { background: #0b7a57; border-color: #085e42; color: #fff; }
.salon-btn-primary:hover   { background: #085e42; }
.salon-btn-danger          { background: #b52a2a; border-color: #8b1f1f; color: #fff; }
.salon-btn-danger:hover    { background: #8b1f1f; }
.salon-btn-save            { background: #1a5fa8; border-color: #134a84; color: #fff; }
.salon-btn-save:hover      { background: #134a84; }
.salon-btn-link            { background: #1a7a8a; border-color: #135f6e; color: #fff; }
.salon-btn-link:hover      { background: #135f6e; }
.salon-btn-sm              { width: auto; padding: 4px 10px; font-size: 0.80rem; }

/* Résolution */
.salon-res-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.salon-res-row label { font-size: 0.82rem; color: #555; white-space: nowrap; }
.salon-res-select {
  padding: 4px 6px; font-family: inherit; font-size: 0.82rem;
  border: 1px solid #ccc; border-radius: 5px; background: #fff; cursor: pointer;
}
.salon-res-select:focus { outline: 2px solid #0b7a57; border-color: #0b7a57; }

/* Itérations */
.salon-iter-row { display: flex; gap: 5px; margin-bottom: 8px; }
.salon-iter-row .salon-btn { flex: 1; padding: 6px 4px; font-size: 0.82rem; }
.salon-iter-label {
  font-size: 0.80rem; font-weight: 700; color: #0b57d0; margin: 0;
  font-family: "Courier New", monospace;
}
.salon-computing {
  font-size: 0.78rem; font-weight: 700; color: #c0620a; display: none; margin-top: 4px;
  animation: salon-blink 0.9s ease-in-out infinite;
}
@keyframes salon-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

/* Mode Bitmap / Vectoriel */
.salon-mode-row { display: flex; gap: 5px; margin-bottom: 8px; }
.salon-mode-btn {
  flex: 1; padding: 6px 4px; font-family: inherit; font-size: 0.82rem;
  font-weight: 600; border: 1px solid #bbb; border-radius: 6px;
  background: #fff; color: #555; cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.salon-mode-btn:hover             { background: #f0f0f0; }
.salon-mode-btn.salon-mode-active { background: #1a5fa8; border-color: #134a84; color: #fff; }

#salon-fractal-svg {
  display: block; border: 1px solid rgba(0,0,0,0.15); border-radius: 8px;
  cursor: zoom-in; max-width: 100%;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

/* Position */
.salon-pos-label {
  font-size: 0.75rem; color: #888; font-family: "Courier New", monospace;
  padding: 4px 8px; margin-bottom: 8px;
  background: #f5f5f5; border-radius: 4px; border: 1px solid #e0e0e0;
}

/* Items de la liste */
#salon-list {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
}

.salon-t-item {
  border: 1px solid rgba(0,0,0,0.10); border-left-width: 3px; border-radius: 7px;
  padding: 9px 10px; margin-bottom: 7px; background: rgba(255,255,255,0.85);
}
.salon-t-label { font-size: 0.85rem; font-weight: 700; margin-bottom: 3px; }
.salon-t-info  { font-size: 0.72rem; color: #777; font-family: "Courier New", monospace; margin-bottom: 6px; line-height: 1.5; }
.salon-t-actions { display: flex; gap: 5px; }
.salon-t-actions button {
  font-size: 0.72rem; padding: 3px 9px; border-radius: 4px; font-family: inherit;
  cursor: pointer; border: 1px solid #bbb; background: #fff; transition: background 0.1s;
}
.salon-btn-edit { color: #0b7a57; border-color: #0b7a57; }
.salon-btn-edit:hover { background: #0b7a57 !important; color: #fff; }
.salon-btn-del  { color: #b52a2a; border-color: #b52a2a; }
.salon-btn-del:hover  { background: #b52a2a !important; color: #fff; }

/* Textes d'aide */
.salon-hint { font-size: 0.80rem; color: #888; font-style: italic; text-align: center; line-height: 1.5; margin: 0; }
.salon-red  { color: #cc2222; font-style: normal; font-weight: 600; }
.salon-fractal-placeholder {
  display: flex; align-items: center; justify-content: center;
  font-size: 0.82rem; color: #aaa; font-style: italic;
  border: 1px dashed #ccc; border-radius: 8px; background: #fafafa;
}

/* ── Tactile : empêche le défilement de la page pendant le glisser ── */
#salon-canvas { touch-action: none; }

/* ── Mobile (≤ 600 px) ── */
@media (max-width: 600px) {
  /* Cibles de touche plus grandes */
  .salon-btn                   { padding: 11px 12px; font-size: 0.92rem; }
  .salon-scale-btn             { padding: 11px 4px;  font-size: 0.88rem; }

  .salon-sym-btn               { padding: 11px 4px;  font-size: 0.84rem; }
  .salon-iter-row .salon-btn   { padding: 11px 4px;  font-size: 0.88rem; }
  .salon-res-select            { padding: 7px 8px;   font-size: 0.88rem; }
  /* Espacement supplémentaire entre les panneaux */
  .salon-sidebar > * + *       { margin-top: 4px; }
}

/* ── Panneau tutoriel ── */
#salon-tuto-panel {
  position: fixed; bottom: 20px; right: 20px; z-index: 500;
  background: #fff; border-radius: 12px;
  padding: 18px 20px 14px; width: 300px;
  box-shadow: 0 8px 36px rgba(0,0,0,0.20);
  border: 1px solid #d0e0ff;
}
#salon-tuto-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
#salon-tuto-step {
  font-size: 0.70rem; color: #aaa;
  font-family: 'Courier New', monospace; letter-spacing: 0.05em; text-transform: uppercase;
}
#salon-tuto-close { background: none; border: none; cursor: pointer; font-size: 1.0rem; color: #bbb; padding: 2px 5px; border-radius: 4px; }
#salon-tuto-close:hover { background: #f0f0f0; color: #555; }
#salon-tuto-bar  { height: 3px; border-radius: 2px; background: #e8e8e8; margin-bottom: 14px; }
#salon-tuto-fill { height: 100%; background: #1a6fd4; border-radius: 2px; transition: width 0.3s ease; }
#salon-tuto-panel h3 { margin: 0 0 8px; font-size: 0.95rem; font-weight: 700; color: #1a1a2e; }
#salon-tuto-panel p  { margin: 0 0 16px; font-size: 0.82rem; line-height: 1.6; color: #555; }
#salon-tuto-nav  { display: flex; gap: 8px; }
#salon-tuto-prev { margin-right: auto; }
.salon-tuto-highlight {
  outline: 3px solid #1a6fd4 !important; outline-offset: 4px;
  border-radius: 6px;
  animation: tuto-pulse 1.5s ease-in-out infinite;
}
@keyframes tuto-pulse {
  0%, 100% { outline-color: #1a6fd4; box-shadow: 0 0 0 0 rgba(26,111,212,0.4); }
  50%       { outline-color: #5599ff; box-shadow: 0 0 0 6px rgba(26,111,212,0.0); }
}
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

let SCALE = 0.5;
let H     = SCALE / 2;

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
  2: { powers: [32, 64, 128, 256, 512, 1024, 2048], defaultR: 512  },
  3: { powers: [27, 81, 243, 729, 2187],              defaultR: 729  },
  4: { powers: [16, 64, 256, 1024, 4096],             defaultR: 1024 },
};

/* ── État ── */
let transforms   = [];
let editingIndex = -1;
let cur = { cx: H, cy: H, rotation: 0, flip: 'none', scale: SCALE };
let isDragging  = false;
let dragOff     = { x: 0, y: 0 };
let isRotating      = false;
let rotateStart     = null; // { prevTheta }
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
  for (let v = SCALE; v < 1 - 1e-9; v += SCALE) {
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
  transforms.forEach((t, i) =>
    drawSquare(t.cx, t.cy, t.rotation, t.flip, PALETTE[i % PALETTE.length], 0.85, `T${i+1}`, t.scale)
  );
  // Prévisualisation de la transformation courante
  drawSquare(cur.cx, cur.cy, cur.rotation, cur.flip,
    { fill: 'rgba(34,170,68,0.22)', border: '#22aa44', accent: '#22aa44' },
    isDragging ? 1.0 : 0.85, '', SCALE);
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
  const n = Math.round(1 / SCALE);
  const i = Math.max(0, Math.min(n - 1, Math.round((clamped - H) / SCALE)));
  const nearest = H + i * SCALE;
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
function getScaleKey() {
  if (Math.abs(SCALE - 0.5)  < 1e-6) return 2;
  if (Math.abs(SCALE - 1/3)  < 1e-6) return 3;
  if (Math.abs(SCALE - 0.25) < 1e-6) return 4;
  return 2;
}
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
  document.querySelectorAll('.salon-scale-btn').forEach(b => { b.disabled = true; });
}
function unlockScale() {
  document.querySelectorAll('.salon-scale-btn').forEach(b => { b.disabled = false; });
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
  if (hitTestDotOnRing(pos.x, pos.y)) {
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
  if (isRotating) {
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
    const wasHovering = isHoveringCenter;
    isHoveringCenter = hitTestRingArea(pos.x, pos.y);
    canvas.style.cursor = hitTestDotOnRing(pos.x, pos.y) ? 'grab' : 'crosshair';
    if (isHoveringCenter !== wasHovering) render();
  }
});
canvas.addEventListener('mouseup', () => {
  isRotating = false; rotateStart = null; isDragging = false;
  canvas.style.cursor = 'crosshair'; render();
});
canvas.addEventListener('mouseleave', () => {
  isRotating = false; rotateStart = null; isDragging = false;
  isHoveringCenter = false; canvas.style.cursor = 'crosshair'; render();
});

/* ── Tactile (mobile) ── */
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  const pos = canvasPos(t.clientX, t.clientY);
  if (hitTestDotOnRing(pos.x, pos.y)) {
    isRotating = true;
    rotateStart = { prevTheta: Math.atan2(pos.y - cur.cy, pos.x - cur.cx) };
    render();
  } else if (hitTest(pos.x, pos.y)) {
    isDragging = true;
    dragOff = { x: pos.x - cur.cx, y: pos.y - cur.cy };
    render();
  }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (!isRotating && !isDragging) return;
  e.preventDefault();
  const t = e.touches[0];
  const pos = canvasPos(t.clientX, t.clientY);
  if (isRotating) {
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
canvas.addEventListener('touchend',    () => { isRotating = false; rotateStart = null; isDragging = false; isHoveringCenter = false; render(); });
canvas.addEventListener('touchcancel', () => { isRotating = false; rotateStart = null; isDragging = false; isHoveringCenter = false; render(); });

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

/* ── Boutons de facteur d'échelle ── */
document.querySelectorAll('.salon-scale-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.salon-scale-btn').forEach(b => b.classList.remove('salon-scale-active'));
    btn.classList.add('salon-scale-active');
    SCALE = parseFloat(btn.dataset.scale);
    H = SCALE / 2;
    cur.scale = SCALE;
    cur.cx = snapToGrid(cur.cx);
    cur.cy = snapToGrid(cur.cy);
    R = SCALE_OPTIONS[getScaleKey()].defaultR;
    populateResolutionSelect();
    resizeFractalCanvas();
    updateCanvasInfo();
    updatePosLabel(); render();
  })
);

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
function scaleLabel(s) {
  if (Math.abs(s - 0.5) < 1e-6)   return '1/2';
  if (Math.abs(s - 1/3) < 1e-6)   return '1/3';
  if (Math.abs(s - 0.25) < 1e-6)  return '1/4';
  return s.toFixed(3);
}

/* ── Liste des transformations ── */
function refreshList() {
  const list  = document.getElementById('salon-list');
  const hint  = document.getElementById('salon-empty-hint');
  document.getElementById('salon-count').textContent = transforms.length;
  hint.style.display = transforms.length === 0 ? '' : 'none';
  list.innerHTML = '';
  transforms.forEach((t, i) => {
    const pal = PALETTE[i % PALETTE.length];
    const div = document.createElement('div');
    div.className = 'salon-t-item';
    div.style.borderLeftColor = pal.border;
    div.innerHTML = `
      <div class="salon-t-label" style="color:${pal.border}">T${i+1}</div>
      <div class="salon-t-info">s = ${scaleLabel(t.scale !== undefined ? t.scale : 0.5)} &nbsp;·&nbsp; rot = ${t.rotation}°${t.flip !== 'none' ? ' &nbsp;·&nbsp; ' + t.flip : ''}<br>c = (${t.cx.toFixed(3)}, ${t.cy.toFixed(3)})</div>
      <div class="salon-t-actions">
        <button class="salon-btn-edit" data-action="edit" data-i="${i}">Éditer</button>
        <button class="salon-btn-del"  data-action="del"  data-i="${i}">✕</button>
      </div>`;
    div.querySelector('[data-action=edit]').addEventListener('click', () => {
      editingIndex = i; cur = { ...transforms[i] };
      document.querySelectorAll('.salon-sym-btn').forEach(b =>
        b.classList.toggle('salon-sym-active', b.dataset.sym === cur.flip)
      );
      SCALE = cur.scale !== undefined ? cur.scale : 0.5;
      H = SCALE / 2;
      document.querySelectorAll('.salon-scale-btn').forEach(b =>
        b.classList.toggle('salon-scale-active', Math.abs(parseFloat(b.dataset.scale) - SCALE) < 1e-9)
      );
      btnAdd.textContent = `✓ Mettre à jour T${i+1}`;
      updatePosLabel(); refreshList(); render();
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
  SCALE = 0.5; H = SCALE / 2;
  cur = { cx: H, cy: H, rotation: 0, flip: 'none', scale: SCALE };
  document.querySelectorAll('.salon-sym-btn').forEach(b =>
    b.classList.toggle('salon-sym-active', b.dataset.sym === 'none')
  );
  document.querySelectorAll('.salon-scale-btn').forEach(b =>
    b.classList.toggle('salon-scale-active', parseFloat(b.dataset.scale) === 0.5)
  );
  btnAdd.textContent = '+ Ajouter';
  unlockScale();
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
    t: transforms.map(t => ({ x: +t.cx.toFixed(4), y: +t.cy.toFixed(4), r: t.rotation, f: t.flip, s: t.scale !== undefined ? t.scale : 0.5 })),
    R,
    n: iterCount,
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
    transforms = s.t.map(t => ({ cx: t.x, cy: t.y, rotation: t.r, flip: t.f, scale: t.s !== undefined ? t.s : 0.5 }));
    SCALE = transforms[0].scale !== undefined ? transforms[0].scale : 0.5;
    H = SCALE / 2;
    cur.scale = SCALE;
    document.querySelectorAll('.salon-scale-btn').forEach(b =>
      b.classList.toggle('salon-scale-active', Math.abs(parseFloat(b.dataset.scale) - SCALE) < 1e-9)
    );
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
    text: 'On va construire un triangle de Sierpiński avec 3 applications contractantes au facteur ½. Le canvas est réinitialisé et le facteur ½ est sélectionné — mis en évidence dans la barre latérale.',
    hl: ['.salon-scale-btn.salon-scale-active'] },
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
  { title: 'Symétries miroir',
    text: 'Les boutons « Miroir H » et « Miroir V » appliquent une symétrie horizontale ou verticale au carré avant de l\'ajouter. Construisons une nouvelle fractale qui en utilise une !',
    hl: ['.salon-sym-btn'] },
  { title: 'Transformation 1 — Coin supérieur gauche, 0°',
    text: 'Le carré est positionné au coin supérieur gauche (0.25, 0.75) sans rotation ni miroir. Cliquez « + Ajouter » pour enregistrer T1.',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Transformation 2 — Coin inférieur droit, 270°',
    text: 'Le carré se déplace au coin inférieur droit (flèche orange). Survolez le centre du carré, saisissez le point sur l\'anneau et faites-le glisser jusqu\'à 270°. Cliquez ensuite « + Ajouter ».',
    hl: ['#salon-btn-add', '#salon-canvas'] },
  { title: 'Transformation 3 — Coin inférieur gauche, 270° + Miroir H',
    text: 'Le carré se déplace au coin inférieur gauche avec une rotation de 270° (flèche orange). Cliquez maintenant sur le bouton « Miroir H » mis en évidence pour appliquer la symétrie, puis cliquez « + Ajouter ».',
    hl: ['#salon-btn-add', '#salon-canvas', '.salon-sym-btn'] }
];
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
    document.querySelectorAll('.salon-scale-btn').forEach(b =>
      b.classList.toggle('salon-scale-active', Math.abs(parseFloat(b.dataset.scale) - 0.5) < 1e-9));
  }
  const R2 = [
    { cx: 0.25, cy: 0.25, rotation: 0,   flip: 'none', scale: 0.5 },
    { cx: 0.25, cy: 0.75, rotation: 270, flip: 'none', scale: 0.5 },
    { cx: 0.75, cy: 0.25, rotation: 90,  flip: 'none', scale: 0.5 },
  ];
  const R3 = [
    { cx: 0.25, cy: 0.75, rotation: 0,   flip: 'none', scale: 0.5 },
    { cx: 0.75, cy: 0.25, rotation: 270, flip: 'none', scale: 0.5 },
    { cx: 0.25, cy: 0.25, rotation: 270, flip: 'H',    scale: 0.5 },
  ];
  function place(t) {
    SCALE = 0.5; H = 0.25; cur = { ...t };
    document.querySelectorAll('.salon-sym-btn').forEach(b =>
      b.classList.toggle('salon-sym-active', b.dataset.sym === (t.flip || 'none')));
    updatePosLabel(); render();
  }
  function setList(list) {
    transforms = list.map(t => ({ ...t })); editingIndex = -1; btnAdd.textContent = '+ Ajouter';
    if (transforms.length === 0) unlockScale(); else { setDefaultResolution(); lockScale(); }
    refreshList();
  }
  if (step === 0) {
    SCALE = 0.5; H = 0.25; R = SCALE_OPTIONS[getScaleKey()].defaultR;
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
    SCALE = 0.5; H = 0.25; R = SCALE_OPTIONS[getScaleKey()].defaultR;
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
    SCALE = 0.5; H = 0.25; R = SCALE_OPTIONS[getScaleKey()].defaultR;
    populateResolutionSelect(); resizeFractalCanvas(); syncButtons();
    setList([]); resetZoom(); resetIter(); place(R3[0]); renderFractal(); updateCanvasInfo();
  }
  else if (step === 13) { setList([]);       resetZoom(); resetIter(); place(R3[0]); }
  else if (step === 14) {
    tutoArrow = { fx: R3[0].cx, fy: R3[0].cy, tx: R3[1].cx, ty: R3[1].cy };
    setList([R3[0]]); resetZoom(); resetIter(); place({ ...R3[1], rotation: 0 });
  }
  else if (step === 15) {
    tutoArrow = { fx: R3[1].cx, fy: R3[1].cy, tx: R3[2].cx, ty: R3[2].cy };
    setList([R3[0], R3[1]]); resetZoom(); resetIter(); place({ ...R3[2], flip: 'none' });
  }
}

function tutoShow(step) {
  tutoStep = step;
  const s = TUTO[step];
  document.getElementById('salon-tuto-step').textContent = `Étape ${step + 1} sur ${TUTO.length}`;
  document.getElementById('salon-tuto-fill').style.width = `${(step + 1) / TUTO.length * 100}%`;
  document.getElementById('salon-tuto-title').textContent = s.title;
  document.getElementById('salon-tuto-text').textContent  = s.text;
  document.getElementById('salon-tuto-prev').disabled = (step === 0);
  document.getElementById('salon-tuto-next').textContent = (step === TUTO.length - 1) ? 'Terminer' : 'Suivant →';
  document.getElementById('salon-tuto-panel').style.display = '';
  tutoApply(step);
  tutoHighlight(s.hl);
  clearTutoAuto();
  const autoMap = {
    0:  { ids: ['salon-scale-half'], next: 1, d: 300 },
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

document.getElementById('salon-btn-tuto').addEventListener('click', () => tutoShow(0));
document.getElementById('salon-tuto-close').addEventListener('click', tutoHide);
document.getElementById('salon-tuto-prev').addEventListener('click', () => {
  if (tutoStep > 0) tutoShow(tutoStep - 1);
});
document.getElementById('salon-tuto-next').addEventListener('click', () => {
  if (tutoStep < TUTO.length - 1) tutoShow(tutoStep + 1);
  else tutoHide();
});

/* ── Initialisation ── */
populateResolutionSelect();
resizeFractalCanvas();
updatePosLabel(); updateIterLabel(); updateCanvasInfo(); refreshList(); render(); renderFractal();
restoreFromHash();

})();
</script>
