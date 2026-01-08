// file: script.js
// Initialisation
const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(6, 6, 6);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);

// Lumières
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x888888));

// Axes
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// ====================== Surface : Cylindre ======================
const radius = 2;
const height = 4;
const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 64, 1, true);
const cylinderMaterial = new THREE.MeshPhongMaterial({color: 0x87ceeb, transparent: true, opacity: 0.6, side: THREE.DoubleSide});
const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
scene.add(cylinder);

// ====================== Traces ======================
// Trace XY (z = 0) → cercle
function traceXY() {
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: 0xff0000}));
  scene.add(line);
}

// Trace XZ (y = 0) → ellipse
function traceXZ() {
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: 0x00aa00}));
  scene.add(line);
}

// Trace YZ (x = 0) → ellipse
function traceYZ() {
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const theta = (i / 64) * Math.PI * 2;
    points.push(new THREE.Vector3(0, radius * Math.cos(theta), radius * Math.sin(theta)));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: 0x0000ff}));
  scene.add(line);
}

traceXY();
traceXZ();
traceYZ();

// ====================== Animation ======================
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / (window.innerHeight * 0.9);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight * 0.9);
});
