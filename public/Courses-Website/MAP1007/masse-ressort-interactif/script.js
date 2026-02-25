const controlConfig = {
  m: { min: 0.1, max: 10, step: 0.1, default: 1 },
  gamma: { min: 0, max: 20, step: 0.1, default: 1 },
  k: { min: 0.1, max: 25, step: 0.1, default: 4 },
  u0: { min: -8, max: 8, step: 0.1, default: 1 },
  v0: { min: -20, max: 20, step: 0.1, default: 0 },
  tMax: { min: 2, max: 60, step: 1, default: 20 }
};

const controls = Object.fromEntries(
  Object.keys(controlConfig).map((key) => [
    key,
    {
      range: document.getElementById(`${key}Range`),
      number: document.getElementById(`${key}Number`),
      value: document.getElementById(`${key}Value`)
    }
  ])
);

const discriminantEl = document.getElementById("discriminant");
const regimeEl = document.getElementById("regime");
const rootsEl = document.getElementById("roots");
const formulaEl = document.getElementById("formula");
const constantsEl = document.getElementById("constants");
const chartMetaEl = document.getElementById("chartMeta");
const simInfoEl = document.getElementById("simInfo");

const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");

const springEl = document.getElementById("spring");
const massEl = document.getElementById("mass");
const playButton = document.getElementById("playButton");

let modelState = null;
let animationFrame = null;
let isPlaying = false;
let startTimestamp = 0;

function formatNumber(value, digits = 4) {
  if (!Number.isFinite(value)) {
    return "non défini";
  }
  return Number(value).toFixed(digits);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readControls() {
  return Object.fromEntries(
    Object.keys(controlConfig).map((key) => [key, Number(controls[key].number.value)])
  );
}

function syncControl(key, value) {
  const { min, max } = controlConfig[key];
  const clamped = clamp(value, min, max);
  controls[key].range.value = clamped;
  controls[key].number.value = clamped;
  controls[key].value.textContent = formatNumber(clamped, key === "tMax" ? 0 : 2);
}

function setupControls(onChange) {
  Object.keys(controlConfig).forEach((key) => {
    const applyValue = (rawValue) => {
      syncControl(key, Number(rawValue));
      onChange();
    };

    controls[key].range.addEventListener("input", (event) => applyValue(event.target.value));
    controls[key].number.addEventListener("input", (event) => applyValue(event.target.value));
    syncControl(key, controlConfig[key].default);
  });
}

function computeSolution(m, gamma, k, u0, v0) {
  const eps = 1e-10;
  const delta = gamma ** 2 - 4 * k * m;

  if (delta > eps) {
    const sqrtDelta = Math.sqrt(delta);
    const r1 = (-gamma - sqrtDelta) / (2 * m);
    const r2 = (-gamma + sqrtDelta) / (2 * m);
    const A = (v0 - r2 * u0) / (r1 - r2);
    const B = (r1 * u0 - v0) / (r1 - r2);

    return {
      delta,
      regime: "Suramorti (racines réelles distinctes)",
      rootsText: `r₁ = ${formatNumber(r1)}, r₂ = ${formatNumber(r2)}`,
      formulaText: "u(t) = A e^(r₁ t) + B e^(r₂ t)",
      constantsText: `Avec u(0)=${formatNumber(u0, 2)} et v(0)=${formatNumber(v0, 2)} ⇒ A=${formatNumber(A)}, B=${formatNumber(B)}`,
      valueAt: (t) => A * Math.exp(r1 * t) + B * Math.exp(r2 * t)
    };
  }

  if (Math.abs(delta) <= eps) {
    const r = -gamma / (2 * m);
    const C2 = u0;
    const C1 = v0 - r * u0;

    return {
      delta,
      regime: "Amortissement critique (racine réelle double)",
      rootsText: `r = ${formatNumber(r)}`,
      formulaText: "u(t) = (C₁ t + C₂) e^(r t)",
      constantsText: `Avec u(0)=${formatNumber(u0, 2)} et v(0)=${formatNumber(v0, 2)} ⇒ C₁=${formatNumber(C1)}, C₂=${formatNumber(C2)}`,
      valueAt: (t) => (C1 * t + C2) * Math.exp(r * t)
    };
  }

  const alpha = gamma / (2 * m);
  const mu = Math.sqrt(4 * k * m - gamma ** 2) / (2 * m);
  const C = u0;
  const D = (v0 + alpha * u0) / mu;

  return {
    delta,
    regime: "Sous-amorti / harmonique (racines complexes)",
    rootsText: `μ = ${formatNumber(mu)}`,
    formulaText: "u(t) = e^(-γ t / (2m)) (C cos(μ t) + D sin(μ t))",
    constantsText: `Avec u(0)=${formatNumber(u0, 2)} et v(0)=${formatNumber(v0, 2)} ⇒ C=${formatNumber(C)}, D=${formatNumber(D)}`,
    valueAt: (t) => Math.exp(-alpha * t) * (C * Math.cos(mu * t) + D * Math.sin(mu * t))
  };
}

function niceStep(range, tickCount) {
  const rough = range / tickCount;
  const mag = 10 ** Math.floor(Math.log10(rough || 1));
  const norm = rough / mag;
  let factor = 1;
  if (norm >= 5) {
    factor = 5;
  } else if (norm >= 2) {
    factor = 2;
  }
  return factor * mag;
}

function drawPlot(points, tMax) {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth;
  const cssHeight = canvas.clientHeight;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = cssWidth;
  const height = cssHeight;
  const margin = { top: 20, right: 20, bottom: 42, left: 72 };
  ctx.clearRect(0, 0, width, height);

  const values = points.map((point) => point.u);
  let uMin = Math.min(...values);
  let uMax = Math.max(...values);

  if (Math.abs(uMax - uMin) < 1e-8) {
    uMax += 1;
    uMin -= 1;
  }

  const yPadding = (uMax - uMin) * 0.08;
  uMax += yPadding;
  uMin -= yPadding;

  const xToCanvas = (x) => margin.left + (x / tMax) * (width - margin.left - margin.right);
  const yToCanvas = (y) => {
    const normalized = (y - uMin) / (uMax - uMin);
    return height - margin.bottom - normalized * (height - margin.top - margin.bottom);
  };

  const xStep = niceStep(tMax, 8);
  const yStep = niceStep(uMax - uMin, 7);

  ctx.strokeStyle = "#deE5f2";
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = 0; x <= tMax + 1e-9; x += xStep) {
    const px = xToCanvas(x);
    ctx.moveTo(px, margin.top);
    ctx.lineTo(px, height - margin.bottom);
  }

  const yStart = Math.ceil(uMin / yStep) * yStep;
  for (let y = yStart; y <= uMax + 1e-9; y += yStep) {
    const py = yToCanvas(y);
    ctx.moveTo(margin.left, py);
    ctx.lineTo(width - margin.right, py);
  }

  ctx.stroke();

  ctx.strokeStyle = "#344158";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();

  const yZero = yToCanvas(0);
  if (yZero >= margin.top && yZero <= height - margin.bottom) {
    ctx.strokeStyle = "#8a94aa";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(margin.left, yZero);
    ctx.lineTo(width - margin.right, yZero);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "#374761";
  ctx.font = "13px Segoe UI";
  ctx.fillText("t", width - margin.right + 4, height - margin.bottom + 15);
  ctx.fillText("u(t)", margin.left - 52, margin.top + 3);

  for (let x = 0; x <= tMax + 1e-9; x += xStep) {
    const px = xToCanvas(x);
    ctx.fillText(formatNumber(x, xStep >= 1 ? 0 : 1), px - 8, height - margin.bottom + 16);
  }

  for (let y = yStart; y <= uMax + 1e-9; y += yStep) {
    const py = yToCanvas(y);
    ctx.fillText(formatNumber(y, 2), margin.left - 62, py + 4);
  }

  const grad = ctx.createLinearGradient(0, margin.top, 0, height - margin.bottom);
  grad.addColorStop(0, "rgba(28, 116, 242, 0.22)");
  grad.addColorStop(1, "rgba(28, 116, 242, 0.02)");

  ctx.beginPath();
  points.forEach((point, index) => {
    const x = xToCanvas(point.t);
    const y = yToCanvas(point.u);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  const last = points[points.length - 1];
  ctx.lineTo(xToCanvas(last.t), yToCanvas(0));
  ctx.lineTo(xToCanvas(points[0].t), yToCanvas(0));
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  points.forEach((point, index) => {
    const x = xToCanvas(point.t);
    const y = yToCanvas(point.u);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.strokeStyle = "#1769e0";
  ctx.lineWidth = 2.3;
  ctx.stroke();
}

function drawSpring(massCenterX) {
  const anchorX = 80;
  const y = 110;
  const turns = 12;
  const amplitude = 24;
  const endX = massCenterX - 28;
  const available = Math.max(40, endX - anchorX);
  const step = available / turns;

  const points = [`${anchorX},${y}`];
  for (let i = 1; i < turns; i += 1) {
    const x = anchorX + i * step;
    const yy = y + (i % 2 === 0 ? -amplitude : amplitude);
    points.push(`${x},${yy}`);
  }
  points.push(`${endX},${y}`);
  springEl.setAttribute("points", points.join(" "));
}

function renderMassAtTime(t) {
  if (!modelState) {
    return;
  }

  const displacement = modelState.valueAt(t);
  const baseCenterX = 390;
  const pxPerUnit = 34;
  const centerX = baseCenterX + displacement * pxPerUnit;
  const x = clamp(centerX - 26, 110, 690);

  massEl.setAttribute("x", formatNumber(x, 2));
  drawSpring(x + 26);
  simInfoEl.textContent = `t = ${formatNumber(t, 2)} s • u(t) = ${formatNumber(displacement, 3)}`;
}

function stopAnimation() {
  isPlaying = false;
  playButton.textContent = "▶ Play";
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

function animateMass(timestamp) {
  if (!isPlaying) {
    return;
  }

  if (startTimestamp === 0) {
    startTimestamp = timestamp;
  }
  const elapsedS = (timestamp - startTimestamp) / 1000;
  renderMassAtTime(elapsedS);
  animationFrame = requestAnimationFrame(animateMass);
}

function togglePlay() {
  if (isPlaying) {
    stopAnimation();
    return;
  }

  isPlaying = true;
  startTimestamp = 0;
  playButton.textContent = "⏸ Pause";
  animationFrame = requestAnimationFrame(animateMass);
}

function update() {
  stopAnimation();

  const { m, gamma, k, u0, v0, tMax } = readControls();
  const model = computeSolution(m, gamma, k, u0, v0);
  modelState = model;

  const sampleCount = 1200;
  const points = [];
  for (let i = 0; i <= sampleCount; i += 1) {
    const t = (i / sampleCount) * tMax;
    points.push({ t, u: model.valueAt(t) });
  }

  discriminantEl.textContent = `Δ = γ² - 4km = ${formatNumber(model.delta)}`;
  regimeEl.textContent = `Régime: ${model.regime}`;
  rootsEl.textContent = model.rootsText;
  formulaEl.textContent = model.formulaText;
  constantsEl.textContent = model.constantsText;
  chartMetaEl.textContent = `Échantillonnage: ${sampleCount + 1} points • Intervalle [0, ${formatNumber(tMax, 0)}]`;

  drawPlot(points, tMax);
  renderMassAtTime(0);
}

setupControls(update);
playButton.addEventListener("click", togglePlay);
window.addEventListener("resize", update);
update();
