const ids = ["m", "gamma", "k", "A", "B", "tMax"];
const inputs = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));

const discriminantEl = document.getElementById("discriminant");
const regimeEl = document.getElementById("regime");
const rootsEl = document.getElementById("roots");
const formulaEl = document.getElementById("formula");

const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "non défini";
  }
  return Number(value).toFixed(4);
}

function computeSolution(m, gamma, k, A, B) {
  const eps = 1e-10;
  const delta = gamma ** 2 - 4 * k * m;

  if (delta > eps) {
    const sqrtDelta = Math.sqrt(delta);
    const r1 = (-gamma - sqrtDelta) / (2 * m);
    const r2 = (-gamma + sqrtDelta) / (2 * m);

    return {
      delta,
      regime: "Suramorti (racines réelles distinctes)",
      rootsText: `r₁ = ${formatNumber(r1)}, r₂ = ${formatNumber(r2)}`,
      formulaText: "u(t) = A e^(r₁ t) + B e^(r₂ t)",
      valueAt: (t) => A * Math.exp(r1 * t) + B * Math.exp(r2 * t)
    };
  }

  if (Math.abs(delta) <= eps) {
    const r = -gamma / (2 * m);

    return {
      delta,
      regime: "Amortissement critique (racine réelle double)",
      rootsText: `r = ${formatNumber(r)}`,
      formulaText: "u(t) = (A t + B) e^(r t)",
      valueAt: (t) => (A * t + B) * Math.exp(r * t)
    };
  }

  const mu = Math.sqrt(4 * k * m - gamma ** 2) / (2 * m);

  return {
    delta,
    regime: "Sous-amorti / harmonique (racines complexes)",
    rootsText: `μ = ${formatNumber(mu)}`,
    formulaText: "u(t) = e^(-γ t / (2m)) (A cos(μ t) + B sin(μ t))",
    valueAt: (t) => Math.exp((-gamma * t) / (2 * m)) * (A * Math.cos(mu * t) + B * Math.sin(mu * t))
  };
}

function drawPlot(points, tMax) {
  const width = canvas.width;
  const height = canvas.height;
  const margin = { top: 20, right: 24, bottom: 42, left: 64 };

  ctx.clearRect(0, 0, width, height);

  const values = points.map((point) => point.u);
  let uMin = Math.min(...values);
  let uMax = Math.max(...values);

  if (Math.abs(uMax - uMin) < 1e-8) {
    uMax += 1;
    uMin -= 1;
  }

  const xToCanvas = (x) => margin.left + (x / tMax) * (width - margin.left - margin.right);
  const yToCanvas = (y) => {
    const normalized = (y - uMin) / (uMax - uMin);
    return height - margin.bottom - normalized * (height - margin.top - margin.bottom);
  };

  ctx.strokeStyle = "#d4dceb";
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let i = 0; i <= 8; i += 1) {
    const x = margin.left + (i / 8) * (width - margin.left - margin.right);
    ctx.moveTo(x, margin.top);
    ctx.lineTo(x, height - margin.bottom);
  }

  for (let i = 0; i <= 6; i += 1) {
    const y = margin.top + (i / 6) * (height - margin.top - margin.bottom);
    ctx.moveTo(margin.left, y);
    ctx.lineTo(width - margin.right, y);
  }

  ctx.stroke();

  ctx.strokeStyle = "#344158";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();

  const y0 = yToCanvas(0);
  if (y0 >= margin.top && y0 <= height - margin.bottom) {
    ctx.strokeStyle = "#8a94aa";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(margin.left, y0);
    ctx.lineTo(width - margin.right, y0);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.fillStyle = "#344158";
  ctx.font = "14px Segoe UI";
  ctx.fillText("t", width - margin.right + 4, height - margin.bottom + 16);
  ctx.fillText("u(t)", margin.left - 46, margin.top + 4);
  ctx.fillText(`0`, margin.left - 16, height - margin.bottom + 18);
  ctx.fillText(`${tMax}`, width - margin.right - 8, height - margin.bottom + 18);
  ctx.fillText(`${uMax.toFixed(2)}`, margin.left - 56, margin.top + 4);
  ctx.fillText(`${uMin.toFixed(2)}`, margin.left - 56, height - margin.bottom + 4);

  ctx.strokeStyle = "#1769e0";
  ctx.lineWidth = 2.2;
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

  ctx.stroke();
}

function update() {
  const m = Math.max(0.05, Number(inputs.m.value));
  const gamma = Number(inputs.gamma.value);
  const k = Number(inputs.k.value);
  const A = Number(inputs.A.value);
  const B = Number(inputs.B.value);
  const tMax = Math.max(1, Number(inputs.tMax.value));

  inputs.m.value = m;
  inputs.tMax.value = tMax;

  const model = computeSolution(m, gamma, k, A, B);
  const sampleCount = 1000;
  const points = [];

  for (let i = 0; i <= sampleCount; i += 1) {
    const t = (i / sampleCount) * tMax;
    points.push({ t, u: model.valueAt(t) });
  }

  discriminantEl.textContent = `Δ = γ² - 4km = ${formatNumber(model.delta)}`;
  regimeEl.textContent = `Régime: ${model.regime}`;
  rootsEl.textContent = model.rootsText;
  formulaEl.textContent = model.formulaText;

  drawPlot(points, tMax);
}

ids.forEach((id) => {
  inputs[id].addEventListener("input", update);
});

update();
