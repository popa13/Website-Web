// =========================================================
// Rational Lemniscate Viewer — pure JavaScript
// =========================================================

// --------- Complex number arithmetic ---------

function cadd(a, b) { return { r: a.r + b.r, i: a.i + b.i }; }
function csub(a, b) { return { r: a.r - b.r, i: a.i - b.i }; }
function cmul(a, b) { return { r: a.r*b.r - a.i*b.i, i: a.r*b.i + a.i*b.r }; }
function cdiv(a, b) {
  const d = b.r*b.r + b.i*b.i;
  return { r: (a.r*b.r + a.i*b.i)/d, i: (a.i*b.r - a.r*b.i)/d };
}
function cabs(a) { return Math.sqrt(a.r*a.r + a.i*a.i); }
function c(r, i=0) { return { r, i }; }

// --------- Polynomial (array of {r,i} coeffs, high degree first) ---------

function polyEval(coeffs, z) {
  let result = c(0);
  for (const coef of coeffs) {
    result = cadd(cmul(result, z), coef);
  }
  return result;
}

function polyMul(a, b) {
  const result = Array(a.length + b.length - 1).fill(null).map(() => c(0));
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++)
      result[i+j] = cadd(result[i+j], cmul(a[i], b[j]));
  return result;
}

function polySub(a, b) {
  const len = Math.max(a.length, b.length);
  const result = [];
  for (let i = 0; i < len; i++) {
    const ai = a[a.length - len + i] || c(0);
    const bi = b[b.length - len + i] || c(0);
    result.push(csub(ai, bi));
  }
  return result;
}

function polyDeriv(coeffs) {
  const n = coeffs.length - 1;
  if (n <= 0) return [c(0)];
  return coeffs.slice(0, -1).map((coef, i) => cmul(coef, c(n - i)));
}

function polyTrim(coeffs) {
  let start = 0;
  while (start < coeffs.length - 1 && cabs(coeffs[start]) < 1e-12) start++;
  return coeffs.slice(start);
}

// --------- Polynomial root finding via Durand-Kerner ---------

function polyRoots(coeffs) {
  const trimmed = polyTrim(coeffs);
  const n = trimmed.length - 1;
  if (n <= 0) return [];

  // Normalize
  const leading = trimmed[0];
  const monic = trimmed.map(c2 => cdiv(c2, leading));

  if (n === 1) {
    // linear: root = -b/a (monic so a=1)
    return [{ r: -monic[1].r, i: -monic[1].i }];
  }

  if (n === 2) {
    // quadratic
    const b = monic[1], cc2 = monic[2];
    const disc = csub(cmul(b, b), cmul(c(4), cc2));
    const sqrtDisc = csqrt(disc);
    return [
      cdiv(csub(c(0), cadd(b, sqrtDisc)), c(2)),
      cdiv(csub(sqrtDisc, b), c(2))
    ];
  }

  // Durand-Kerner for degree >= 3
  let roots = [];
  for (let k = 0; k < n; k++) {
    const angle = (2 * Math.PI * k) / n;
    const r0 = 0.4 + 0.7 * k / n;
    roots.push(c(r0 * Math.cos(angle), r0 * Math.sin(angle)));
  }

  for (let iter = 0; iter < 200; iter++) {
    let maxMove = 0;
    const newRoots = roots.map((ri, i) => {
      let denom = c(1);
      for (let j = 0; j < n; j++) {
        if (j !== i) denom = cmul(denom, csub(ri, roots[j]));
      }
      const pVal = polyEval(monic, ri);
      const delta = cdiv(pVal, denom);
      const nr = csub(ri, delta);
      maxMove = Math.max(maxMove, cabs(delta));
      return nr;
    });
    roots = newRoots;
    if (maxMove < 1e-12) break;
  }
  return roots;
}

function csqrt(z) {
  const r = Math.sqrt(cabs(z));
  const theta = Math.atan2(z.i, z.r) / 2;
  return c(r * Math.cos(theta), r * Math.sin(theta));
}

// --------- Parse input ---------

function parseNumberList(text) {
  text = text.trim();
  if (!text) return [];
  return text.split(',').map(s => {
    s = s.trim().replace(/i/g, 'j');
    // handle formats like 1+2j, -3j, 2, 1.5
    const match = s.match(/^([+-]?[\d.]+(?:e[+-]?\d+)?)?([+-][\d.]*j|[+-]?[\d.]+j)?$/i);
    let real = 0, imag = 0;
    // simple approach: eval-safe parsing
    s = s.replace('j', '');
    const parts = s.match(/^([+-]?[^+-]+)?([+-][^+-]+)?$/);
    if (parts) {
      if (parts[1] !== undefined && parts[1] !== '') real = parseFloat(parts[1]) || 0;
      if (parts[2] !== undefined && parts[2] !== '') imag = parseFloat(parts[2]) || 0;
    }
    return c(real, imag);
  }).filter(z => isFinite(z.r) && isFinite(z.i));
}

function parseComplex(s) {
  s = s.trim().replace(/\s+/g, '');
  // Replace 'i' with 'j' for consistency
  s = s.replace(/i$/i, 'j');
  // Pattern: optional real part + optional imaginary part
  const fullMatch = s.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)?([+-](?:\d+\.?\d*|\.\d+)?j)$/i);
  if (fullMatch) {
    const re = fullMatch[1] ? parseFloat(fullMatch[1]) : 0;
    const imStr = fullMatch[2] ? fullMatch[2].replace('j','') : '0';
    const im = imStr === '+' ? 1 : imStr === '-' ? -1 : parseFloat(imStr);
    return c(isNaN(re) ? 0 : re, isNaN(im) ? 0 : im);
  }
  // pure imaginary
  if (s.match(/^[+-]?(?:\d+\.?\d*)?j$/i)) {
    const imStr = s.replace('j','');
    const im = imStr === '' || imStr === '+' ? 1 : imStr === '-' ? -1 : parseFloat(imStr);
    return c(0, isNaN(im) ? 0 : im);
  }
  // pure real
  const re = parseFloat(s);
  return c(isNaN(re) ? 0 : re, 0);
}

function parseComplexList(text) {
  text = text.trim();
  if (!text) return [];
  return text.split(',')
    .map(s => parseComplex(s.trim()))
    .filter(z => isFinite(z.r) && isFinite(z.i));
}

function makePoly(coeffsText, rootsText, fallback) {
  const rootsStr = rootsText.trim();
  const coeffsStr = coeffsText.trim();

  if (rootsStr) {
    const roots = parseComplexList(rootsStr);
    if (roots.length > 0) {
      // Build monic polynomial from roots: prod(z - r_i)
      let poly = [c(1)];
      for (const root of roots) {
        poly = polyMul(poly, [c(1), c(-root.r, -root.i)]);
      }
      return poly;
    }
  }
  if (coeffsStr) {
    const coeffs = parseComplexList(coeffsStr);
    if (coeffs.length > 0) return coeffs;
  }
  return fallback;
}

// --------- Critical points ---------

function getCriticalPoints(P, Q) {
  const Pd = polyDeriv(P);
  const Qd = polyDeriv(Q);
  // numerator of (P/Q)' = P'Q - PQ'
  const N = polySub(polyMul(Pd, Q), polyMul(P, Qd));
  const trimN = polyTrim(N);
  if (trimN.length <= 1) return [];
  const crits = polyRoots(trimN);
  // Remove points where Q = 0 (poles)
  return crits.filter(z => cabs(polyEval(Q, z)) > 1e-8);
}

// --------- Auto window ---------

function autoWindow(P, Q, critPts, level) {
  const pts = [];
  const pRoots = polyRoots(P);
  const qRoots = polyRoots(Q);
  pts.push(...pRoots, ...qRoots, ...critPts);

  let R_pts = 2.0;
  if (pts.length > 0) {
    R_pts = Math.max(2.0, ...pts.map(z => cabs(z)));
  }

  const degP = P.length - 1;
  const degQ = Q.length - 1;
  const k = degP - degQ;
  let R_c = 0;
  if (k !== 0 && level > 0) {
    const lcP = cabs(P[0]);
    const lcQ = cabs(Q[0]);
    if (lcP > 0 && lcQ > 0) {
      R_c = Math.pow(level / (lcP / lcQ), 1 / k);
    }
  }

  const R = Math.max(R_pts, R_c, 2.0) * 1.3;
  return { xMin: -R, xMax: R, yMin: -R, yMax: R };
}

// --------- Canvas drawing helpers ---------

function clearCanvas(ctx, w, h) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
}

function niceStep(span, ticks = 8) {
  const raw = span / ticks;
  const pow = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  for (const m of [1, 2, 5, 10]) {
    if (raw <= m * pow) return m * pow;
  }
  return 10 * pow;
}

function drawAxes(ctx, w, h, xMin, xMax, yMin, yMax, toScreen) {
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (yMin <= 0 && 0 <= yMax) {
    const [x0, y0] = toScreen(xMin, 0);
    const [x1, y1] = toScreen(xMax, 0);
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
  }
  if (xMin <= 0 && 0 <= xMax) {
    const [x0, y0] = toScreen(0, yMin);
    const [x1, y1] = toScreen(0, yMax);
    ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
  }
  ctx.stroke();

  ctx.fillStyle = '#555';
  ctx.font = '11px "Segoe UI", sans-serif';

  const xStep = niceStep(xMax - xMin);
  const yStep = niceStep(yMax - yMin);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
    const [sx, sy] = toScreen(x, Math.max(yMin, Math.min(yMax, 0)));
    ctx.beginPath(); ctx.moveTo(sx, sy-4); ctx.lineTo(sx, sy+4); ctx.stroke();
    if (Math.abs(x) > 1e-9) {
      ctx.fillText(xStep < 1 ? x.toFixed(1) : x.toFixed(0), sx, sy + 6);
    }
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
    const [sx, sy] = toScreen(Math.max(xMin, Math.min(xMax, 0)), y);
    ctx.beginPath(); ctx.moveTo(sx-4, sy); ctx.lineTo(sx+4, sy); ctx.stroke();
    if (Math.abs(y) > 1e-9) {
      ctx.fillText(yStep < 1 ? y.toFixed(1) : y.toFixed(0), sx - 6, sy);
    }
  }
}

function drawAxesSimple(ctx, w, h) {
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
  ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
  ctx.stroke();
}

// --------- Marching squares lemniscate ---------

function drawLemniscate(ctx, P, Q, level, xMin, xMax, yMin, yMax, toScreen, resolution = 300) {
  const xs = [], ys = [];
  for (let i = 0; i <= resolution; i++) {
    xs.push(xMin + (i / resolution) * (xMax - xMin));
    ys.push(yMin + (i / resolution) * (yMax - yMin));
  }

  // Build grid of |f(z)| - level
  const R = [];
  for (let j = 0; j <= resolution; j++) {
    const row = [];
    for (let i = 0; i <= resolution; i++) {
      const z = c(xs[i], ys[j]);
      const pv = polyEval(P, z);
      const qv = polyEval(Q, z);
      const absQ = cabs(qv);
      const val = absQ < 1e-12 ? Infinity : cabs(pv) / absQ;
      row.push(val - level);
    }
    R.push(row);
  }

  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  for (let j = 0; j < resolution; j++) {
    for (let i = 0; i < resolution; i++) {
      const v0 = R[j][i], v1 = R[j][i+1];
      const v2 = R[j+1][i+1], v3 = R[j+1][i];
      const b0 = v0 >= 0, b1 = v1 >= 0, b2 = v2 >= 0, b3 = v3 >= 0;
      if (b0 === b1 && b1 === b2 && b2 === b3) continue;

      const pts = [];
      if (b0 !== b1 && v1 !== v0) { const t = v0/(v0-v1); pts.push([xs[i]+t*(xs[i+1]-xs[i]), ys[j]]); }
      if (b1 !== b2 && v2 !== v1) { const t = v1/(v1-v2); pts.push([xs[i+1], ys[j]+t*(ys[j+1]-ys[j])]); }
      if (b2 !== b3 && v3 !== v2) { const t = v2/(v2-v3); pts.push([xs[i+1]-t*(xs[i+1]-xs[i]), ys[j+1]]); }
      if (b3 !== b0 && v0 !== v3) { const t = v3/(v3-v0); pts.push([xs[i], ys[j+1]-t*(ys[j+1]-ys[j])]); }

      for (let k = 0; k+1 < pts.length; k += 2) {
        const [sxa, sya] = toScreen(pts[k][0], pts[k][1]);
        const [sxb, syb] = toScreen(pts[k+1][0], pts[k+1][1]);
        ctx.moveTo(sxa, sya); ctx.lineTo(sxb, syb);
      }
    }
  }
  ctx.stroke();
}

function drawDot(ctx, sx, sy, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, 2 * Math.PI);
  ctx.fill();
}

// --------- Main update ---------

function updatePlots() {
  const numCoeffs = document.getElementById('num-coeffs').value;
  const numRoots  = document.getElementById('num-roots').value;
  const denCoeffs = document.getElementById('den-coeffs').value;
  const denRoots  = document.getElementById('den-roots').value;

  const levelInput  = document.getElementById('level-input');
  const levelSlider = document.getElementById('level-slider');

  let level = parseFloat(levelInput.value);
  if (!isFinite(level) || level < 0.1) level = 1.0;
  level = Math.max(0.1, Math.min(5.0, level));
  levelInput.value = level.toFixed(2);
  levelSlider.value = Math.round(level * 100);

  const P = makePoly(numCoeffs, numRoots, [c(1), c(0), c(-1)]);
  const Q = makePoly(denCoeffs, denRoots, [c(1)]);
  const critPts = getCriticalPoints(P, Q);

  const { xMin, xMax, yMin, yMax } = autoWindow(P, Q, critPts, level);

  const canvasZ = document.getElementById('canvas-z');
  const canvasW = document.getElementById('canvas-w');
  const ctxZ = canvasZ.getContext('2d');
  const ctxW = canvasW.getContext('2d');
  const wZ = canvasZ.width, hZ = canvasZ.height;
  const wW = canvasW.width, hW = canvasW.height;

  clearCanvas(ctxZ, wZ, hZ);
  clearCanvas(ctxW, wW, hW);

  const toScreenZ = (x, y) => [
    (x - xMin) / (xMax - xMin) * wZ,
    hZ - (y - yMin) / (yMax - yMin) * hZ
  ];

  drawAxes(ctxZ, wZ, hZ, xMin, xMax, yMin, yMax, toScreenZ);
  drawLemniscate(ctxZ, P, Q, level, xMin, xMax, yMin, yMax, toScreenZ);

  // Zeros (blue), poles (red), critical points (green)
  const pRoots = polyRoots(P);
  const qRoots = polyRoots(Q);
  for (const z of pRoots) { const [sx, sy] = toScreenZ(z.r, z.i); drawDot(ctxZ, sx, sy, 4, '#0b57d0'); }
  for (const z of qRoots) { const [sx, sy] = toScreenZ(z.r, z.i); drawDot(ctxZ, sx, sy, 4, '#cc0000'); }
  for (const z of critPts) { const [sx, sy] = toScreenZ(z.r, z.i); drawDot(ctxZ, sx, sy, 4, '#0b7a57'); }

  // w-plane
  drawAxesSimple(ctxW, wW, hW);

  const critVals = critPts.map(z => cdiv(polyEval(P, z), polyEval(Q, z)));
  let Rplot = Math.max(1.25, level) * 1.15;
  if (critVals.length > 0) {
    const M = Math.max(...critVals.map(cabs));
    Rplot = Math.max(1.25, M, level) * 1.15;
  }

  const toScreenW = (x, y) => [
    (x + Rplot) / (2 * Rplot) * wW,
    hW - (y + Rplot) / (2 * Rplot) * hW
  ];

  // Circle |w| = level
  ctxW.strokeStyle = '#555555';
  ctxW.lineWidth = 1.2;
  ctxW.beginPath();
  const [cxW, cyW] = toScreenW(0, 0);
  const [sxC] = toScreenW(level, 0);
  ctxW.arc(cxW, cyW, Math.abs(sxC - cxW), 0, 2 * Math.PI);
  ctxW.stroke();

  // Critical values: purple if inside circle, orange if outside
  for (const w of critVals) {
    const inside = cabs(w) <= level * (1 + 1e-3);
    const [sx, sy] = toScreenW(w.r, w.i);
    drawDot(ctxW, sx, sy, 4, inside ? '#8000ff' : '#ff7f00');
  }
}

// --------- Debounce helper ---------
function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// --------- Event listeners ---------

const debouncedUpdate = debounce(updatePlots, 80);

document.getElementById('refresh-btn').addEventListener('click', updatePlots);

document.getElementById('level-slider').addEventListener('input', () => {
  const slider = document.getElementById('level-slider');
  const input  = document.getElementById('level-input');
  input.value = (parseFloat(slider.value) / 100).toFixed(2);
  debouncedUpdate();
});

document.getElementById('level-input').addEventListener('change', () => {
  const input  = document.getElementById('level-input');
  const slider = document.getElementById('level-slider');
  let c2 = parseFloat(input.value);
  if (!isFinite(c2)) c2 = 1.0;
  c2 = Math.max(0.1, Math.min(5.0, c2));
  input.value = c2.toFixed(2);
  slider.value = Math.round(c2 * 100);
  updatePlots();
});

for (const id of ['num-coeffs', 'num-roots', 'den-coeffs', 'den-roots']) {
  document.getElementById(id).addEventListener('change', updatePlots);
}

// Initial draw
updatePlots();
