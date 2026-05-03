---
page_title: "IFS Generator — Workshop"
nav: "research"
wide: true
---

<h1>IFS Generator — Visual Affine Transformations</h1>
<p class="subtitle">
  Build an IFS from contracting affine transformations
  \( f_i(\mathbf{x}) = s\,R_\theta\,\mathbf{x} + \mathbf{b}_i \)
  by positioning and rotating copies of the unit square with the mouse.
</p>

<!-- ═══════════════════════════════════════════════════════════
     APPLICATION
════════════════════════════════════════════════════════════ -->
<div class="salon-app">

  <!-- ── Control panel ─────────────────────────────────────── -->
  <aside class="salon-sidebar">

    <div class="mr-panel">
      <h2>Current transformation</h2>
      <div class="salon-scale-group">
        <button class="salon-scale-btn salon-scale-active" data-scale="0.5">1/2</button>
        <button class="salon-scale-btn" data-scale="0.3333333333333333">1/3</button>
        <button class="salon-scale-btn" data-scale="0.25">1/4</button>
      </div>
      <div class="salon-rot-group">
        <button class="salon-rot-btn salon-rot-active" data-rot="0">0°</button>
        <button class="salon-rot-btn" data-rot="90">90°</button>
        <button class="salon-rot-btn" data-rot="180">180°</button>
        <button class="salon-rot-btn" data-rot="270">270°</button>
      </div>
      <div class="salon-sym-group">
        <button class="salon-sym-btn salon-sym-active" data-sym="none">No mirror</button>
        <button class="salon-sym-btn" data-sym="H">Mirror H</button>
        <button class="salon-sym-btn" data-sym="V">Mirror V</button>
      </div>
      <div id="salon-pos" class="salon-pos-label">centre: (0.250, 0.250)</div>
      <button class="salon-btn salon-btn-primary" id="salon-btn-add">+ Add</button>
    </div>

    <div class="mr-panel">
      <h2>Transformations (<span id="salon-count">0</span>)</h2>
      <div id="salon-list"></div>
      <p id="salon-empty-hint" class="salon-hint" style="margin:0;">
        Drag the square, choose a rotation, then click <em>Add</em>.
      </p>
    </div>

    <div class="mr-panel">
      <h2>Iterations</h2>
      <div class="salon-res-row">
        <label for="salon-res-select">Resolution:</label>
        <select id="salon-res-select" class="salon-res-select">
          <option value="512" selected>512 px</option>
        </select>
      </div>
      <div class="salon-iter-row">
        <button class="salon-btn" id="salon-btn-init">⊙ Init</button>
        <button class="salon-btn salon-btn-primary" id="salon-btn-iter1">Iterate ×1</button>
        <button class="salon-btn salon-btn-primary" id="salon-btn-iter5">Iterate ×5</button>
      </div>
      <p id="salon-iter-label" class="salon-iter-label">Iteration: —</p>
      <span id="salon-computing" class="salon-computing">computing…</span>
    </div>

    <button class="salon-btn salon-btn-save" id="salon-btn-save-png">↓ Save PNG</button>
    <button class="salon-btn salon-btn-link" id="salon-btn-copy-link">⎘ Copy link</button>
    <button class="salon-btn salon-btn-link" id="salon-btn-share-email">✉ Share by email</button>
    <button class="salon-btn salon-btn-danger" id="salon-btn-reset">⊗ Reset all</button>

  </aside>

  <!-- ── Canvas area ───────────────────────────────────────── -->
  <div class="salon-canvas-col" id="salon-canvas-col">

    <p class="salon-canvas-label">Transformation definition</p>
    <canvas id="salon-canvas"></canvas>
    <p class="salon-hint">
      Drag the blue square · <span class="salon-red">red edge</span> = rotation marker ·
      The red dot is the image of corner&nbsp;(1,&nbsp;1).
    </p>

    <p class="salon-canvas-label" style="margin-top:14px;">IFS Fractal</p>
    <canvas id="salon-fractal-canvas"></canvas>
    <p class="salon-hint" id="salon-canvas-info"></p>
    <p class="salon-hint">Left-click: zoom in &nbsp;·&nbsp; Right-click: zoom out &nbsp;·&nbsp; Double-click: reset zoom</p>

  </div>

</div><!-- /salon-app -->


<!-- ═══════════════════════════════════════════════════════════
     STYLES  (prefix salon-)
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

.salon-rot-group { display: flex; gap: 5px; margin-bottom: 6px; }
.salon-rot-btn {
  flex: 1; padding: 6px 4px; font-family: inherit; font-size: 0.82rem;
  font-weight: 600; border: 1px solid #bbb; border-radius: 6px;
  background: #fff; color: #555; cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.salon-rot-btn:hover            { background: #f0f0f0; }
.salon-rot-btn.salon-rot-active { background: #0b7a57; border-color: #085e42; color: #fff; }

/* Scale */
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

/* Symmetry */
.salon-sym-group { display: flex; gap: 5px; margin-bottom: 10px; }
.salon-sym-btn {
  flex: 1; padding: 6px 4px; font-family: inherit; font-size: 0.80rem;
  font-weight: 600; border: 1px solid #bbb; border-radius: 6px;
  background: #fff; color: #555; cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.salon-sym-btn:hover            { background: #f0f0f0; }
.salon-sym-btn.salon-sym-active { background: #7a3b0b; border-color: #5e2d08; color: #fff; }

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

.salon-res-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }
.salon-res-row label { font-size: 0.82rem; color: #555; white-space: nowrap; }
.salon-res-select {
  padding: 4px 6px; font-family: inherit; font-size: 0.82rem;
  border: 1px solid #ccc; border-radius: 5px; background: #fff; cursor: pointer;
}
.salon-res-select:focus { outline: 2px solid #0b7a57; border-color: #0b7a57; }

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

.salon-pos-label {
  font-size: 0.75rem; color: #888; font-family: "Courier New", monospace;
  padding: 4px 8px; margin-bottom: 8px;
  background: #f5f5f5; border-radius: 4px; border: 1px solid #e0e0e0;
}

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

.salon-hint { font-size: 0.80rem; color: #888; font-style: italic; text-align: center; line-height: 1.5; margin: 0; }
.salon-red  { color: #cc2222; font-style: normal; font-weight: 600; }
.salon-fractal-placeholder {
  display: flex; align-items: center; justify-content: center;
  font-size: 0.82rem; color: #aaa; font-style: italic;
  border: 1px dashed #ccc; border-radius: 8px; background: #fafafa;
}

/* ── Touch: prevent page scroll while dragging on canvas ── */
#salon-canvas { touch-action: none; }

/* ── Mobile (≤ 600 px) ── */
@media (max-width: 600px) {
  /* Larger touch targets */
  .salon-btn                   { padding: 11px 12px; font-size: 0.92rem; }
  .salon-scale-btn             { padding: 11px 4px;  font-size: 0.88rem; }
  .salon-rot-btn               { padding: 11px 4px;  font-size: 0.88rem; }
  .salon-sym-btn               { padding: 11px 4px;  font-size: 0.84rem; }
  .salon-iter-row .salon-btn   { padding: 11px 4px;  font-size: 0.88rem; }
  .salon-res-select            { padding: 7px 8px;   font-size: 0.88rem; }
  /* Extra spacing between panels */
  .salon-sidebar > * + *       { margin-top: 4px; }
}
</style>


<!-- ═══════════════════════════════════════════════════════════
     SCRIPT
════════════════════════════════════════════════════════════ -->
<script>
(function () {
'use strict';

/* ── Display canvas ── */
const canvas = document.getElementById('salon-canvas');
const ctx    = canvas.getContext('2d');
const S      = 512;
canvas.width = canvas.height = S;

/* ── Fractal canvas ── */
const fractalCanvas = document.getElementById('salon-fractal-canvas');
const fractalCtx    = fractalCanvas.getContext('2d');
fractalCanvas.width = fractalCanvas.height = 512;

/* ── Offscreen canvas (internal resolution) ── */
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

/* ── State ── */
let transforms   = [];
let editingIndex = -1;
let cur = { cx: H, cy: H, rotation: 0, flip: 'none', scale: SCALE };
let isDragging = false;
let dragOff    = { x: 0, y: 0 };

let R          = 512;   // internal resolution (pixels — for computation & save)
let displayR   = 512;   // display size of fractal canvas (= defaultR for current scale)

let zoomX = 0, zoomY = 0, zoomW = 1, zoomH = 1;  // viewport in [0,1]² fractal space

let iterBitmap = null;  // Uint8Array R×R : 0 = white, 1 = black
let iterCount  = 0;

/* ── Coordinate helpers ── */
function mc(x, y) { return { x: x * S, y: (1 - y) * S }; }
function cm(cx, cy) { return { x: cx / S, y: 1 - cy / S }; }

/* ── Corners of the transformed square
   Order: f(0,0), f(1,0), f(1,1)★, f(0,1) — index 2 = red corner.
   flip='H': horizontal mirror (local y → −y)
   flip='V': vertical mirror   (local x → −x)                      */
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

/* ── Forward affine matrix ──
   No mirror : M = s·R(θ)
   Mirror H  : M = s·R(θ)·[[1,0],[0,−1]]  →  [[s·c, s·si],[s·si,−s·c]]
   Mirror V  : M = s·R(θ)·[[−1,0],[0,1]]  →  [[−s·c,−s·si],[−s·si,s·c]]
   tx, ty position f(0.5, 0.5) = (cx, cy).                               */
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

/* ── Forward iteration on bitmap ──
   Each black pixel in the SOURCE is projected by every transform f_k;
   the corresponding destination pixel is painted black.
   With s = 0.5, consecutive pairs of source pixels land on the same
   destination pixel → no gaps, no vanishing.
   Complexity: O(R² × n_transforms) per iteration step.            */
function iterateBitmap(src, Ri, fwdMats) {
  const dst = new Uint8Array(Ri * Ri);  // destination starts all white
  const n   = fwdMats.length;
  for (let spy = 0; spy < Ri; spy++) {
    const sy = 1 - (spy + 0.5) / Ri;   // pixel centre, math coords (y up)
    for (let spx = 0; spx < Ri; spx++) {
      if (!src[spy * Ri + spx]) continue;  // source pixel white → skip
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

/* ── Bitmap → offscreen canvas ── */
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

/* ── Background drawing (dashed grid scaled to current SCALE) ── */
function drawGrid() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
  ctx.beginPath();
  for (let v = SCALE; v < 1 - 1e-9; v += SCALE) {
    const px = mc(v, 0).x;
    const py = mc(0, v).y;
    ctx.moveTo(px, 0); ctx.lineTo(px, S);
    ctx.moveTo(0, py); ctx.lineTo(S, py);
  }
  ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = '#999999'; ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, S-2, S-2);
}

/* ── Draw a transformed square ── */
function drawSquare(cx, cy, rotation, flip, pal, alpha, label, scale) {
  const pts  = getCorners(cx, cy, rotation, flip, scale);
  const cpts = pts.map(p => mc(p.x, p.y));
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(cpts[0].x, cpts[0].y);
  cpts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.fillStyle = pal.fill; ctx.fill();
  ctx.strokeStyle = pal.border; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cpts[2].x, cpts[2].y); ctx.lineTo(cpts[3].x, cpts[3].y);
  ctx.strokeStyle = '#cc2222'; ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.arc(cpts[2].x, cpts[2].y, 5.5, 0, Math.PI*2);
  ctx.fillStyle = '#cc2222'; ctx.fill();
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

/* ── Definition canvas render (grid + squares + preview) ── */
function render() {
  ctx.clearRect(0, 0, S, S);
  drawGrid();
  transforms.forEach((t, i) =>
    drawSquare(t.cx, t.cy, t.rotation, t.flip, PALETTE[i % PALETTE.length], 0.85, `T${i+1}`, t.scale)
  );
  drawSquare(cur.cx, cur.cy, cur.rotation, cur.flip,
    { fill: 'rgba(100,150,230,0.18)', border: '#3366cc' },
    isDragging ? 1.0 : 0.80, '', SCALE);
}

/* ── Fractal canvas render ── */
function renderFractal() {
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
    fractalCtx.fillText('Press ⊙ Init then Iterate', displayR/2, displayR/2);
  }
}

/* ── Zoom helpers ── */
function resetZoom() {
  zoomX = 0; zoomY = 0; zoomW = 1; zoomH = 1;
}
function doZoom(nx, ny, factor) {
  const cx = zoomX + nx * zoomW;
  const cy = zoomY + ny * zoomH;
  const newW = Math.max(2 / R, zoomW / factor);
  const newH = Math.max(2 / R, zoomH / factor);
  zoomX = Math.max(0, Math.min(1 - newW, cx - nx * newW));
  zoomY = Math.max(0, Math.min(1 - newH, cy - ny * newH));
  zoomW = newW; zoomH = newH;
}

/* ── Snap a coordinate to the nearest grid-cell centre ── */
function snapToGrid(val) {
  const n = Math.round(1 / SCALE);
  const i = Math.max(0, Math.min(n - 1, Math.round((val - H) / SCALE)));
  return H + i * SCALE;
}

/* ── UI helpers ── */
function hitTest(mx, my) {
  const rad = -(cur.rotation * Math.PI / 180);
  const c = Math.cos(rad), s = Math.sin(rad);
  const dx = mx - cur.cx, dy = my - cur.cy;
  return Math.abs(dx*c - dy*s) <= H && Math.abs(dx*s + dy*c) <= H;
}
function updatePosLabel() {
  document.getElementById('salon-pos').textContent =
    `centre: (${cur.cx.toFixed(3)}, ${cur.cy.toFixed(3)})`;
}
function updateIterLabel() {
  document.getElementById('salon-iter-label').textContent =
    iterBitmap === null ? 'Iteration: —' : `Iteration: ${iterCount}`;
}
function updateCanvasInfo() {
  const zoom = zoomW < 0.999 ? ` — ×${(1 / zoomW).toFixed(1)}` : '';
  document.getElementById('salon-canvas-info').textContent = `${R}×${R} px${zoom}`;
}

/* ── Scale lock / resolution helpers ── */
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

/* ── Iteration management ── */
function resetIter() {
  iterBitmap = null; iterCount = 0;
  resetZoom();
  updateIterLabel();
  renderFractal(); updateCanvasInfo();
}

function initIter() {
  if (transforms.length === 0) { alert('Add at least one transformation!'); return; }
  iterBitmap = new Uint8Array(R * R).fill(1); // unit square = all pixels on
  iterCount  = 0;
  renderBitmapToOffscreen();
  updateIterLabel();
  renderFractal();
}

function doIter(n) {
  if (transforms.length === 0) { alert('Add at least one transformation!'); return; }
  if (iterBitmap === null) {
    iterBitmap = new Uint8Array(R * R).fill(1);
    iterCount  = 0;
  }
  const computing = document.getElementById('salon-computing');
  computing.style.display = '';
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

/* ── Client → math coordinate conversion ──
   Corrects the gap between canvas resolution (S px) and its CSS display
   size (r.width px), which differs on mobile.                          */
function canvasPos(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return cm(
    (clientX - r.left) * (S / r.width),
    (clientY - r.top)  * (S / r.height)
  );
}

/* ── Mouse events ── */
canvas.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  const pos = canvasPos(e.clientX, e.clientY);
  if (hitTest(pos.x, pos.y)) {
    isDragging = true;
    dragOff = { x: pos.x - cur.cx, y: pos.y - cur.cy };
    canvas.style.cursor = 'grabbing'; render();
  }
});
canvas.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const pos = canvasPos(e.clientX, e.clientY);
  cur.cx = snapToGrid(pos.x - dragOff.x);
  cur.cy = snapToGrid(pos.y - dragOff.y);
  updatePosLabel(); render();
});
canvas.addEventListener('mouseup',    () => { isDragging = false; canvas.style.cursor = 'crosshair'; });
canvas.addEventListener('mouseleave', () => { isDragging = false; canvas.style.cursor = 'crosshair'; });

/* ── Touch events (mobile) ── */
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  const pos = canvasPos(t.clientX, t.clientY);
  if (hitTest(pos.x, pos.y)) {
    isDragging = true;
    dragOff = { x: pos.x - cur.cx, y: pos.y - cur.cy };
    render();
  }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (!isDragging) return;
  e.preventDefault();
  const t = e.touches[0];
  const pos = canvasPos(t.clientX, t.clientY);
  cur.cx = snapToGrid(pos.x - dragOff.x);
  cur.cy = snapToGrid(pos.y - dragOff.y);
  updatePosLabel(); render();
}, { passive: false });
canvas.addEventListener('touchend',    () => { isDragging = false; });
canvas.addEventListener('touchcancel', () => { isDragging = false; });

/* ── Fractal canvas zoom (hold to zoom) ── */
const ZOOM_IN_F  = 1.08;
const ZOOM_OUT_F = 1 / 1.08;
let zoomInterval = null;

function stopZoom() {
  if (zoomInterval) { clearInterval(zoomInterval); zoomInterval = null; }
}

fractalCanvas.addEventListener('mousedown', e => {
  if (!iterBitmap) return;
  e.preventDefault();
  if (e.detail >= 2) {          // double-click → reset
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

/* ── Rotation buttons ── */
document.querySelectorAll('.salon-rot-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.salon-rot-btn').forEach(b => b.classList.remove('salon-rot-active'));
    btn.classList.add('salon-rot-active');
    cur.rotation = parseInt(btn.dataset.rot);
    render();
  })
);

/* ── Symmetry buttons ── */
document.querySelectorAll('.salon-sym-btn').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.salon-sym-btn').forEach(b => b.classList.remove('salon-sym-active'));
    btn.classList.add('salon-sym-active');
    cur.flip = btn.dataset.sym;
    render();
  })
);

/* ── Scale buttons ── */
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

/* ── Add / Update ── */
const btnAdd = document.getElementById('salon-btn-add');
btnAdd.addEventListener('click', () => {
  if (editingIndex === -1) { transforms.push({ ...cur }); }
  else {
    transforms[editingIndex] = { ...cur };
    editingIndex = -1; btnAdd.textContent = '+ Add';
  }
  if (transforms.length === 1) { setDefaultResolution(); lockScale(); }
  resetIter(); refreshList(); render();
});

/* ── Scale label helper ── */
function scaleLabel(s) {
  if (Math.abs(s - 0.5) < 1e-6)   return '1/2';
  if (Math.abs(s - 1/3) < 1e-6)   return '1/3';
  if (Math.abs(s - 0.25) < 1e-6)  return '1/4';
  return s.toFixed(3);
}

/* ── Transform list ── */
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
        <button class="salon-btn-edit" data-action="edit" data-i="${i}">Edit</button>
        <button class="salon-btn-del"  data-action="del"  data-i="${i}">✕</button>
      </div>`;
    div.querySelector('[data-action=edit]').addEventListener('click', () => {
      editingIndex = i; cur = { ...transforms[i] };
      document.querySelectorAll('.salon-rot-btn').forEach(b =>
        b.classList.toggle('salon-rot-active', parseInt(b.dataset.rot) === cur.rotation)
      );
      document.querySelectorAll('.salon-sym-btn').forEach(b =>
        b.classList.toggle('salon-sym-active', b.dataset.sym === cur.flip)
      );
      SCALE = cur.scale !== undefined ? cur.scale : 0.5;
      H = SCALE / 2;
      document.querySelectorAll('.salon-scale-btn').forEach(b =>
        b.classList.toggle('salon-scale-active', Math.abs(parseFloat(b.dataset.scale) - SCALE) < 1e-9)
      );
      btnAdd.textContent = `✓ Update T${i+1}`;
      updatePosLabel(); refreshList(); render();
    });
    div.querySelector('[data-action=del]').addEventListener('click', () => {
      if (editingIndex === i) { editingIndex = -1; btnAdd.textContent = '+ Add'; }
      else if (editingIndex > i) editingIndex--;
      transforms.splice(i, 1);
      if (transforms.length === 0) unlockScale();
      resetIter(); refreshList(); render();
    });
    list.appendChild(div);
  });
}

/* ── Iteration buttons ── */
document.getElementById('salon-btn-init').addEventListener('click', initIter);
document.getElementById('salon-btn-iter1').addEventListener('click', () => doIter(1));
document.getElementById('salon-btn-iter5').addEventListener('click', () => doIter(5));

/* ── Resolution change ── */
document.getElementById('salon-res-select').addEventListener('change', function () {
  const newR = parseInt(this.value);
  if (newR !== R) { R = newR; resetIter(); updateCanvasInfo(); }
});

/* ── Reset all ── */
document.getElementById('salon-btn-reset').addEventListener('click', () => {
  transforms = []; editingIndex = -1;
  SCALE = 0.5; H = SCALE / 2;
  cur = { cx: H, cy: H, rotation: 0, flip: 'none', scale: SCALE };
  document.querySelectorAll('.salon-rot-btn').forEach(b =>
    b.classList.toggle('salon-rot-active', b.dataset.rot === '0')
  );
  document.querySelectorAll('.salon-sym-btn').forEach(b =>
    b.classList.toggle('salon-sym-active', b.dataset.sym === 'none')
  );
  document.querySelectorAll('.salon-scale-btn').forEach(b =>
    b.classList.toggle('salon-scale-active', parseFloat(b.dataset.scale) === 0.5)
  );
  btnAdd.textContent = '+ Add';
  unlockScale();
  R = SCALE_OPTIONS[getScaleKey()].defaultR;
  populateResolutionSelect();
  resizeFractalCanvas();
  resetIter(); updatePosLabel(); refreshList(); render(); updateCanvasInfo();
});

/* ── Save PNG ── */
document.getElementById('salon-btn-save-png').addEventListener('click', () => {
  if (!iterBitmap) { alert('No fractal to save. Run an iteration first.'); return; }
  const a = document.createElement('a');
  a.download = `ifs-fractal-iter${iterCount}.png`;
  a.href = offCanvas.toDataURL('image/png');
  a.click();
});

/* ── State serialization ── */
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

/* ── Copy link ── */
document.getElementById('salon-btn-copy-link').addEventListener('click', () => {
  if (transforms.length === 0) { alert('Add at least one transformation first.'); return; }
  const url = getShareUrl();
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('salon-btn-copy-link');
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  }).catch(() => { prompt('Copy this link:', url); });
});

/* ── Share by email ── */
document.getElementById('salon-btn-share-email').addEventListener('click', () => {
  if (transforms.length === 0) { alert('Add at least one transformation first.'); return; }
  const url = getShareUrl();
  const subject = encodeURIComponent('IFS Fractal — interactive link');
  const body = encodeURIComponent(
    'Hello,\n\n' +
    'Here is an IFS fractal I wanted to share with you.\n' +
    'Click the link below to restore the exact fractal (transformations, resolution and iterations):\n\n' +
    url + '\n\n' +
    'You can also visit the generator page directly at:\n' +
    'https://www.mathopo.ca/ifs-salon\n\n' +
    'Best regards'
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
});

/* ── Restore state from URL hash ── */
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
  } catch (e) { /* invalid hash, ignore */ }
}

/* ── Init ── */
populateResolutionSelect();
resizeFractalCanvas();
updatePosLabel(); updateIterLabel(); updateCanvasInfo(); refreshList(); render(); renderFractal();
restoreFromHash();

})();
</script>
