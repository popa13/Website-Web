// main.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';
import { ParametricGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.153.0/examples/jsm/geometries/ParametricGeometry.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.153.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let currentMesh = null;
let traceLines = [];

const container = document.getElementById('canvas-container');

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  const width = window.innerWidth;
  const height = window.innerHeight;

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x404040);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(5,5,5);
  scene.add(directional);

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // UI event listeners
  document.getElementById('surfaceType').addEventListener('change', updateSurface);
  document.getElementById('coeffA').addEventListener('input', updateSurface);
  document.getElementById('coeffB').addEventListener('input', updateSurface);
  document.getElementById('coeffC').addEventListener('input', updateSurface);
  document.getElementById('traceXY').addEventListener('change', updateTraces);
  document.getElementById('traceXZ').addEventListener('change', updateTraces);
  document.getElementById('traceYZ').addEventListener('change', updateTraces);

  window.addEventListener('resize', onWindowResize, false);

  // Génération initiale
  updateSurface();
}

function updateSurface() {
  const type = document.getElementById('surfaceType').value;
  const a = parseFloat(document.getElementById('coeffA').value);
  const b = parseFloat(document.getElementById('coeffB').value);
  const c = parseFloat(document.getElementById('coeffC').value);

  // supprimer ancien mesh et anciennes traces
  if (currentMesh) {
    scene.remove(currentMesh);
    currentMesh.geometry.dispose();
    currentMesh.material.dispose();
    currentMesh = null;
  }
  traceLines.forEach(lineObj => {
    scene.remove(lineObj.line);
    // dispose si possible
    if (lineObj.line.geometry) lineObj.line.geometry.dispose();
    if (lineObj.line.material) lineObj.line.material.dispose();
  });
  traceLines = [];

  currentMesh = generateSurfaceMesh(type, a, b, c);
  scene.add(currentMesh);

  const newTraces = generateTraces(type, a, b, c);
  newTraces.forEach(traceObj => {
    scene.add(traceObj.line);
    traceLines.push(traceObj);
  });

  // Appliquer les réglages de visibilité des traces immédiatement
  updateTraces();
}

function updateTraces() {
  const showXY = document.getElementById('traceXY').checked;
  const showXZ = document.getElementById('traceXZ').checked;
  const showYZ = document.getElementById('traceYZ').checked;

  traceLines.forEach(traceObj => {
    const name = traceObj.typeName;
    let visible = false;
    if (name === "XY" && showXY) visible = true;
    if (name === "XZ" && showXZ) visible = true;
    if (name === "YZ" && showYZ) visible = true;
    traceObj.line.visible = visible;
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Fonctions de génération de surface et traces

function generateSurfaceMesh(type, a, b, c) {
  let geom;
  const segments = 64;
  const stacks = 32;

  switch (type) {
    case 'ellipsoid':
      geom = new ParametricGeometry((u, v, target) => {
        const theta = 2 * Math.PI * u;
        const phi = Math.PI * (v - 0.5);
        const x = a * Math.cos(phi) * Math.cos(theta);
        const y = b * Math.cos(phi) * Math.sin(theta);
        const z = c * Math.sin(phi);
        target.set(x, y, z);
      }, segments, stacks);
      break;

    case 'hyperboloid1':
      geom = new ParametricGeometry((u, v, target) => {
        const theta = 2 * Math.PI * u;
        const vmax = 2;
        const vv = (v - 0.5) * 2 * vmax;
        const factor = Math.sqrt(1 + vv * vv);
        const x = a * factor * Math.cos(theta);
        const y = b * factor * Math.sin(theta);
        const z = c * vv;
        target.set(x, y, z);
      }, segments, stacks);
      break;

    case 'hyperboloid2':
      geom = new ParametricGeometry((u, v, target) => {
        const theta = 2 * Math.PI * u;
        const vmax = 2;
        const vv = (v - 0.5) * 2 * vmax;
        if (Math.abs(vv) < 1) {
          // zone non définie, on la positionne "paresseusement"
          target.set(0, 0, 0);
        } else {
          const factor = Math.sqrt(vv * vv - 1);
          const x = a * factor * Math.cos(theta);
          const y = b * factor * Math.sin(theta);
          const z = c * vv;
          target.set(x, y, z);
        }
      }, segments, stacks);
      break;

    case 'paraboloid':
      geom = new ParametricGeometry((u, v, target) => {
        const uu = (u - 0.5) * 4; 
        const vv = (v - 0.5) * 4;
        const x = a * uu;
        const y = b * vv;
        const z = (uu * uu) / (a * a) + (vv * vv) / (b * b);
        target.set(x, y, z);
      }, segments, stacks);
      break;

    case 'cylinder':
      // cylindre autour de z : rayon selon a, b, hauteur 2c
      geom = new THREE.CylinderGeometry(a, b, 2 * c, segments, 1, true);
      break;

    default:
      // fallback
      return generateSurfaceMesh('ellipsoid', a, b, c);
  }

  const material = new THREE.MeshPhongMaterial({
    color: 0x6699ff,
    wireframe: false,
    opacity: 0.8,
    transparent: true,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geom, material);
  return mesh;
}

function generateTraces(type, a, b, c) {
  const n = 200;
  const traces = [];

  // Trace XY : z = 0
  {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = 2 * Math.PI * i / n;
      let x, y;
      switch (type) {
        case 'ellipsoid':
        case 'cylinder':
        case 'hyperboloid1':
        case 'hyperboloid2':
          x = a * Math.cos(t);
          y = b * Math.sin(t);
          break;
        case 'paraboloid':
          // seulement le point (0,0)
          x = 0;
          y = 0;
          break;
        default:
          x = a * Math.cos(t);
          y = b * Math.sin(t);
      }
      pts.push(new THREE.Vector3(x, y, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: 0xff0000 }));
    traces.push({ line: line, typeName: "XY" });
  }

  // Trace XZ : y = 0
  {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = 2 * Math.PI * i / n;
      let x, z;
      switch (type) {
        case 'ellipsoid':
        case 'cylinder':
          x = a * Math.cos(t);
          z = c * Math.sin(t);
          break;
        case 'hyperboloid1':
          // y=0 => x^2/a^2 - z^2/c^2 = 1 => hyperbole
          // Paramétrisation approximative
          const vv = Math.tan(t - Math.PI); 
          x = a * Math.sqrt(1 + vv * vv);
          if (t > Math.PI/2 && t < 3*Math.PI/2) x = -x;
          z = c * vv;
          break;
        case 'hyperboloid2':
          // x^2/case similar
          const vv2 = Math.tan(t - Math.PI);
          z = c * Math.sqrt(1 + (a*a * vv2*vv2)/(c*c));
          if (t > Math.PI/2 && t < 3*Math.PI/2) z = -z;
          x = a * vv2;
          break;
        case 'paraboloid':
          x = a * Math.cos(t);
          z = ( (x*x) / (a*a) );
          break;
        default:
          x = a * Math.cos(t);
          z = c * Math.sin(t);
      }
      pts.push(new THREE.Vector3(x, 0, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
    traces.push({ line: line, typeName: "XZ" });
  }

  // Trace YZ : x = 0
  {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = 2 * Math.PI * i / n;
      let y, z;
      switch (type) {
        case 'ellipsoid':
        case 'cylinder':
          y = b * Math.cos(t);
          z = c * Math.sin(t);
          break;
        case 'hyperboloid1':
          const vv1 = Math.tan(t - Math.PI);
          y = b * Math.sqrt(1 + vv1 * vv1);
          if (t > Math.PI/2 && t < 3*Math.PI/2) y = -y;
          z = c * vv1;
          break;
        case 'hyperboloid2':
          const vv3 = Math.tan(t - Math.PI);
          z = c * Math.sqrt(1 + (b*b * vv3*vv3)/(c*c));
          if (t > Math.PI/2 && t < 3*Math.PI/2) z = -z;
          y = b * vv3;
          break;
        case 'paraboloid':
          y = b * Math.cos(t);
          z = ( (y*y) / (b*b) );
          break;
        default:
          y = b * Math.cos(t);
          z = c * Math.sin(t);
      }
      pts.push(new THREE.Vector3(0, y, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x0000ff }));
    traces.push({ line: line, typeName: "YZ" });
  }

  return traces;
}
