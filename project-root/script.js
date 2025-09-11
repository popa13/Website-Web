const springCanvas = document.getElementById('springCanvas');
const springCtx = springCanvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');

let m = 1, k = 5, c = 0, x0 = 1, v0 = 0, speed = 1;
let t = 0, graphData = [], running = false;

let solutionFunc = t => 0;

const inputs = {
  mass: document.getElementById('mass'),
  spring: document.getElementById('spring'),
  damping: document.getElementById('damping'),
  x0: document.getElementById('x0'),
  v0: document.getElementById('v0'),
  speed: document.getElementById('speed')
};

const labels = {
  mass: document.getElementById('massVal'),
  spring: document.getElementById('springVal'),
  damping: document.getElementById('dampingVal'),
  x0: document.getElementById('x0Val'),
  v0: document.getElementById('v0Val'),
  speed: document.getElementById('speedVal')
};

Object.keys(inputs).forEach(key => {
  inputs[key].addEventListener('input', () => {
    labels[key].textContent = inputs[key].value;
  });
});

document.getElementById('startPause').onclick = () => {
  running = !running;
  document.getElementById('startPause').textContent = running ? '⏸️ Pause' : '▶️ Start';
  if (running) animate();
};

document.getElementById('reset').onclick = () => {
  initializeSolution();
  const diagnostic = document.getElementById('diagnostic');
  const delta = c * c - 4 * m * k;
  let regime = '';

  if (delta > 0) {
    regime = '🟤 Régime suramorti (Δ > 0)';
  } else if (delta === 0) {
    regime = '⚫ Régime critique (Δ = 0)';
  } else {
    regime = '🔵 Régime sous-amorti (Δ < 0)';
  }

  diagnostic.innerHTML = `Δ = ${delta.toFixed(2)}<br>${regime}`;
};

function initializeSolution() {
  m = parseFloat(inputs.mass.value);
  k = parseFloat(inputs.spring.value);
  c = parseFloat(inputs.damping.value);
  x0 = parseFloat(inputs.x0.value);
  v0 = parseFloat(inputs.v0.value);
  speed = parseFloat(inputs.speed.value);

  t = 0;
  graphData = [];
  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
  springCtx.clearRect(0, 0, springCanvas.width, springCanvas.height);

  const delta = c * c - 4 * m * k;

  if (delta > 0) {
    // Suramorti
    const r1 = (-c + Math.sqrt(delta)) / (2 * m);
    const r2 = (-c - Math.sqrt(delta)) / (2 * m);
    const A = (v0 - r2 * x0) / (r1 - r2);
    const B = x0 - A;
    solutionFunc = t => A * Math.exp(r1 * t) + B * Math.exp(r2 * t);
  } else if (delta === 0) {
    // Critique
    const r = -c / (2 * m);
    const A = x0;
    const B = v0 - r * x0;
    solutionFunc = t => (A + B * t) * Math.exp(r * t);
  } else {
    // Sous-amorti
    const omega0 = Math.sqrt(k / m);
    const zeta = c / (2 * Math.sqrt(k * m));
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    const A = x0;
    const B = (v0 + zeta * omega0 * x0) / omegaD;
    solutionFunc = t => Math.exp(-zeta * omega0 * t) * (A * Math.cos(omegaD * t) + B * Math.sin(omegaD * t));
  }

  drawSpringMass(solutionFunc(t));
}

function drawSpringMass(pos) {
  springCtx.clearRect(0, 0, springCanvas.width, springCanvas.height);
  const baseY = 50;
  const restLength = 150;
  const amplitude = 100 * pos;

  // Draw ceiling
  springCtx.fillStyle = 'black';
  springCtx.fillRect(150, 10, 100, 10);

  // Draw spring
  const massY = baseY + restLength + amplitude;
  springCtx.strokeStyle = '#888';
  springCtx.lineWidth = 2;
  springCtx.beginPath();
  springCtx.moveTo(200, 20);
  springCtx.lineTo(200, massY - 20);
  springCtx.stroke();

  // Draw mass
  springCtx.fillStyle = 'blue';
  springCtx.fillRect(180, massY - 20, 40, 40);
}

function drawGraph(pos) {
  graphData.push({ t, x: pos });
  if (graphData.length > graphCanvas.width) {
    graphData.shift();
  }

  graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
  graphCtx.beginPath();
  graphData.forEach((point, i) => {
    const px = i;
    const py = graphCanvas.height / 2 - point.x * 50;
    if (i === 0) graphCtx.moveTo(px, py);
    else graphCtx.lineTo(px, py);
  });
  graphCtx.strokeStyle = 'red';
  graphCtx.lineWidth = 2;
  graphCtx.stroke();

  // Axes
  graphCtx.strokeStyle = '#000';
  graphCtx.beginPath();
  graphCtx.moveTo(0, graphCanvas.height / 2);
  graphCtx.lineTo(graphCanvas.width, graphCanvas.height / 2);
  graphCtx.stroke();
}

function animate() {
  if (!running) return;
  const pos = solutionFunc(t);
  drawSpringMass(pos);
  drawGraph(pos);
  t += 0.02 * speed;
  requestAnimationFrame(animate);
}

// Ini
